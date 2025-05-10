const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const adminProductController = require('../controllers/adminProductController');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.userRole !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'frontend/images/') // Destination folder for product images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Unique filename
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      subcategory, 
      minPrice, 
      maxPrice, 
      sort = 'createdAt', 
      order = 'desc',
      page = 1,
      limit = 10,
      isFeatured = false // Added parameter for featured products
    } = req.query;

    // Build query
    const query = {};
    
    if (category) query.category = category;
    if (subcategory) query.subCategory = subcategory;
    
    // Add option to filter featured products
    if (isFeatured === 'true' || isFeatured === true) {
      query.isFeatured = true;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch products
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber);

    // Count total products for pagination
    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limitNumber),
      currentPage: pageNumber,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching products' 
    });
  }
});

// Get a single product by ID or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Find product by ID or slug
    const product = await Product.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(idOrSlug) ? idOrSlug : null },
        { slug: idOrSlug }
      ]
    })
    .populate('category', 'name slug')
    .populate('subCategory', 'name slug')
    .populate('images')
    .populate('relatedProducts');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Get related products
    let relatedProducts = [];
    if (product.relatedProducts && product.relatedProducts.length > 0) {
      // Use specific related products if defined
      relatedProducts = product.relatedProducts;
    } else {
      // Otherwise get products from same category
      relatedProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id }
      })
      .limit(4)
      .select('name slug price compareAtPrice discount thumbnailUrl');
    }
    
    res.status(200).json({
      success: true,
      product,
      relatedProducts
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product details'
    });
  }
});

// Get featured products (new dedicated endpoint)
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 4 } = req.query;
    
    const featuredProducts = await Product.find({ isFeatured: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: featuredProducts.length,
      products: featuredProducts
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products'
    });
  }
});

// Get related products (dedicated endpoint)
router.get('/:id/related', async (req, res) => {
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
    
    let relatedProducts = [];
    
    // If product has explicit related products
    if (product.relatedProducts && product.relatedProducts.length > 0) {
      relatedProducts = await Product.find({
        _id: { $in: product.relatedProducts }
      }).limit(parseInt(limit));
    } else {
      // Otherwise, find products in the same category
      relatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: product._id }
      }).limit(parseInt(limit));
    }
    
    res.status(200).json({
      success: true,
      count: relatedProducts.length,
      products: relatedProducts
    });
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching related products'
    });
  }
});

// Search products
router.get('/search/query', async (req, res) => {
  try {
    const { query } = req.query;
    const { 
      page = 1, 
      limit = 10 
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Text search
    const searchResults = await Product.find({ 
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .skip(skip)
    .limit(limitNumber);

    const totalProducts = await Product.countDocuments({ 
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    });

    res.status(200).json({
      success: true,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limitNumber),
      currentPage: pageNumber,
      products: searchResults
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error performing search' 
    });
  }
});

// Admin route to create a product with image upload
router.post('/', isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const productData = req.body;
    
    // Add uploaded image paths to product data
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => file.filename);
    }

    const newProduct = new Product(productData);
    
    await newProduct.save();
    
    res.status(201).json({
      success: true,
      product: newProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Product creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: errors[0] 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error creating product' 
    });
  }
});

// Admin route to update a product with optional image upload
router.put('/:id', isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const productData = req.body;
    
    // Add uploaded image paths to product data
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => file.filename);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      productData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      product: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Product update error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: errors[0] 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Error updating product' 
    });
  }
});

// Admin route to delete a product
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting product' 
    });
  }
});

// Upload product images route that uses the adminProductController
router.post(
  '/:productId/images',
  isAdmin,
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 5 }
  ]),
  adminProductController.handleProductImageUpload
);

// Get product categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching product categories' 
    });
  }
});

// Get subcategories for a specific category
router.get('/subcategories/:category', async (req, res) => {
  try {
    const subcategories = await Product.distinct('subCategory', { 
      category: req.params.category 
    });
    
    res.status(200).json({
      success: true,
      subcategories
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching product subcategories' 
    });
  }
});

module.exports = router;