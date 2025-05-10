/**
 * Product Controller
 * Handles API endpoints for products
 */
const Product = require('../models/product');
const Category = require('../models/category');
const mongoose = require('mongoose');

/**
 * Get all products with filtering, sorting, and pagination
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      limit = 12,                  // Default limit
      page = 1,                    // Default page
      sort = 'createdAt',          // Default sort field
      order = 'desc',              // Default sort order
      search = '',                 // Search term
      category = '',               // Category ID
      subcategory = '',            // Subcategory ID
      minPrice = 0,                // Min price
      maxPrice = 10000,            // Max price
      isFeatured = false,          // Featured products only
      inStock = false,             // In stock products only
      brand = '',                  // Brand filter
      ids = '',                    // Comma-separated product IDs
      exclude = '',                // Product ID to exclude
      rating = 0                   // Minimum rating
    } = req.query;
    
    // Build query
    const query = {};
    
    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category
    if (category) {
      query.category = mongoose.Types.ObjectId.isValid(category) 
        ? mongoose.Types.ObjectId(category) 
        : category;
    }
    
    // Subcategory
    if (subcategory) {
      query.subCategory = mongoose.Types.ObjectId.isValid(subcategory) 
        ? mongoose.Types.ObjectId(subcategory) 
        : subcategory;
    }
    
    // Price range
    query.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
    
    // Featured
    if (isFeatured === 'true' || isFeatured === true) {
      query.isFeatured = true;
    }
    
    // In stock
    if (inStock === 'true' || inStock === true) {
      query.stock = { $gt: 0 };
    }
    
    // Brand
    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }
    
    // Specific IDs
    if (ids) {
      const idArray = ids.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
      
      if (idArray.length > 0) {
        query._id = { $in: idArray.map(id => mongoose.Types.ObjectId(id)) };
      }
    }
    
    // Exclude
    if (exclude && mongoose.Types.ObjectId.isValid(exclude)) {
      query._id = { ...(query._id || {}), $ne: mongoose.Types.ObjectId(exclude) };
    }
    
    // Minimum rating
    if (rating && !isNaN(rating)) {
      query.rating = { $gte: parseFloat(rating) };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Create sort object
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // Execute query with pagination and sort
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages,
      currentPage: parseInt(page),
      products
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

/**
 * Get a single product by ID or slug
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let product;
    
    // Check if ID is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Find by ID
      product = await Product.findById(id)
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug')
        .populate('relatedProducts', 'name slug thumbnailUrl price');
    } else {
      // Find by slug
      product = await Product.findOne({ slug: id })
        .populate('category', 'name slug')
        .populate('subCategory', 'name slug')
        .populate('relatedProducts', 'name slug thumbnailUrl price');
    }
    
    // Check if product exists
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Increment view count
    product.views = (product.views || 0) + 1;
    await product.save();
    
    res.status(200).json({
      success: true,
      product
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

/**
 * Get featured products
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 4 } = req.query;
    
    const products = await Product.find({ isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
    
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
};

/**
 * Get related products
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    
    // Find the product
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // If product has explicit related products
    if (product.relatedProducts && product.relatedProducts.length > 0) {
      const relatedProducts = await Product.find({
        _id: { $in: product.relatedProducts }
      }).limit(parseInt(limit));
      
      return res.status(200).json({
        success: true,
        count: relatedProducts.length,
        products: relatedProducts
      });
    }
    
    // Otherwise, find products in the same category
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: relatedProducts.length,
      products: relatedProducts
    });
    
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related products',
      error: error.message
    });
  }
};

/**
 * Get products by category
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 12, page = 1 } = req.query;
    
    // Validate category ID
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    
    // Find the category
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find products in the category
    const products = await Product.find({ category: categoryId })
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    // Get total count
    const totalProducts = await Product.countDocuments({ category: categoryId });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    
    res.status(200).json({
      success: true,
      category,
      count: products.length,
      totalProducts,
      totalPages,
      currentPage: parseInt(page),
      products
    });
    
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: error.message
    });
  }
};

/**
 * Search products
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.query;
    const { limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Search in name, description, brand, and tags
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
    
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
};

module.exports = exports;