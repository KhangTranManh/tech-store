// routes/categories.js
const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const Product = require('../models/product');
const multer = require('multer');
const path = require('path');
const Image = require('../models/image');
const mongoose = require('mongoose');

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

// File upload configuration for category images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'frontend/images/categories/') // Destination folder for category images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Unique filename
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
});

// Debug route to check database connection (placing this first to ensure it's accessible)
router.get('/debug/database', async (req, res) => {
  try {
    // Check MongoDB connection
    const isConnected = mongoose.connection.readyState === 1;
    
    // Check if models are available
    const categoryCount = await Category.countDocuments();
    const productCount = await Product.countDocuments();
    
    // Try to get one product and one category
    const sampleCategory = await Category.findOne({}).lean();
    const sampleProduct = await Product.findOne({}).lean();
    
    res.json({
      success: true,
      database: {
        connected: isConnected,
        connectionState: mongoose.connection.readyState,
        categories: categoryCount,
        products: productCount,
        sampleCategory: sampleCategory ? {
          id: sampleCategory._id,
          name: sampleCategory.name,
          slug: sampleCategory.slug
        } : null,
        sampleProduct: sampleProduct ? {
          id: sampleProduct._id,
          name: sampleProduct.name,
          category: sampleProduct.category
        } : null
      }
    });
  } catch (error) {
    console.error('Database debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: error.message,
      stack: error.stack
    });
  }
});

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { 
      level, 
      isActive, 
      isFeatured, 
      parent,
      page = 1, 
      limit = 50  // Increased limit to get more categories at once
    } = req.query;

    // Build query
    const query = {};
    if (level !== undefined) query.level = parseInt(level);
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (parent !== undefined) query.parent = parent === 'null' ? null : parent;

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch categories with pagination and populate
    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .populate('image', 'thumbnailUrl')
      .sort({ order: 1, name: 1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();  // Use lean for better performance

    // Count total categories
    const totalCategories = await Category.countDocuments(query);

    console.log(`Found ${categories.length} categories matching query:`, query);

    res.status(200).json({
      success: true,
      totalCategories,
      totalPages: Math.ceil(totalCategories / limitNumber),
      currentPage: pageNumber,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories',
      error: error.message 
    });
  }
});

// Get a specific route for monitors (since it's a common category)
router.get('/monitors/featured', async (req, res) => {
  try {
    console.log('Fetching featured monitor products');
    
    // Find the monitors category
    const monitorsCategory = await Category.findOne({ slug: 'monitors' });
    
    if (!monitorsCategory) {
      return res.status(404).json({
        success: false,
        message: 'Monitors category not found'
      });
    }
    
    // Find subcategories
    const subcategories = await Category.find({ parent: monitorsCategory._id });
    const subcategoryIds = subcategories.map(sc => sc._id);
    
    // Find featured monitor products
    const monitorProducts = await Product.find({
      $or: [
        { category: monitorsCategory._id },
        { subCategory: { $in: subcategoryIds } }
      ],
      isFeatured: true
    })
    .limit(12)
    .select('name slug price compareAtPrice discount rating reviewCount specs images thumbnailUrl brand isOnSale')
    .lean();
    
    console.log(`Found ${monitorProducts.length} featured monitor products`);
    
    res.json({
      success: true,
      products: monitorProducts
    });
  } catch (error) {
    console.error('Error fetching monitor products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching monitor products',
      error: error.message 
    });
  }
});

// Get a single category by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    console.log('Fetching category with identifier:', identifier);
    
    // Check if identifier is a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(identifier);
    
    // Find category by either ID or slug
    const query = isValidObjectId 
      ? { $or: [{ _id: identifier }, { slug: identifier }] }
      : { slug: identifier };
    
    const category = await Category.findOne(query)
      .populate('parent', 'name slug')
      .populate('image', 'thumbnailUrl')
      .populate({
        path: 'children',
        select: 'name slug'
      })
      .lean();

    if (!category) {
      console.log('Category not found with identifier:', identifier);
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    console.log('Found category:', category.name);

    // Get product count for this category
    const productCount = await Product.countDocuments({ category: category._id });

    res.status(200).json({
      success: true,
      category,
      productCount
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// Get products by category slug (optimized version)
router.get('/:slug/products', async (req, res) => {
  try {
    const categorySlug = req.params.slug;
    console.log('Fetching products for category slug:', categorySlug);
    
    // Step 1: Find the category by slug
    const category = await Category.findOne({ slug: categorySlug });
    
    if (!category) {
      console.log('Category not found with slug:', categorySlug);
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    console.log('Found category:', category.name, 'with ID:', category._id);
    
    // Step 2: Find subcategories
    const subcategories = await Category.find({ parent: category._id });
    const subcategoryIds = subcategories.map(sc => sc._id);
    
    console.log('Found subcategories:', subcategoryIds.length);
    
    // Step 3: Find products from this category and its subcategories
    const query = {
      $or: [
        { category: category._id }
      ]
    };
    
    // Add subcategory filter if we have subcategories
    if (subcategoryIds.length > 0) {
      query.$or.push({ subCategory: { $in: subcategoryIds } });
    }
    
    console.log('Product query:', JSON.stringify(query));
    
    // Add optional query parameters for filtering
    const { 
      minPrice, 
      maxPrice, 
      sort = 'featured', 
      limit = 100 
    } = req.query;
    
    // Add price range filter if provided
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Determine sort options
    const sortOptions = {};
    switch (sort) {
      case 'price-low':
        sortOptions.price = 1;
        break;
      case 'price-high':
        sortOptions.price = -1;
        break;
      case 'rating':
        sortOptions.rating = -1;
        break;
      case 'newest':
        sortOptions.createdAt = -1;
        break;
      case 'featured':
      default:
        sortOptions.isFeatured = -1;
        sortOptions.rating = -1;
    }
    
    const products = await Product.find(query)
      .select('name slug price compareAtPrice discount rating reviewCount specs images thumbnailUrl brand isOnSale isFeatured createdAt tags description')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .lean();  // Use lean to get plain objects for better performance
    
    console.log('Found products:', products.length);
    
    // Return success response with additional metadata
    res.status(200).json({
      success: true,
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug
      },
      productCount: products.length,
      products: products
    });
  } catch (error) {
    console.error('Error fetching category products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching category products',
      error: error.message 
    });
  }
});

// Get products for a specific category by ID
router.get('/:id/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Check if ID is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    // Find products in the category
    const products = await Product.find({ category: req.params.id })
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber)
      .populate('category', 'name slug')
      .lean();

    // Count total products
    const totalProducts = await Product.countDocuments({ category: req.params.id });

    res.status(200).json({
      success: true,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limitNumber),
      currentPage: pageNumber,
      products
    });
  } catch (error) {
    console.error('Error fetching category products by ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching category products',
      error: error.message
    });
  }
});

// Fallback route with embedded products (useful when database is not available)
router.get('/:slug/embedded-products', (req, res) => {
  const categorySlug = req.params.slug;
  console.log('Using embedded products data for category:', categorySlug);
  
  // Hardcoded categories from your paste-2.txt
  const categories = [
    {
      "_id": "681e2f4a7a418d374a94c196",
      "name": "Laptops",
      "slug": "laptops",
      "parent": null,
      "level": 0,
      "isActive": true,
      "isFeatured": true
    },
    {
      "_id": "681e2f4a7a418d374a94c197",
      "name": "Components",
      "slug": "components",
      "parent": null,
      "level": 0,
      "isActive": true,
      "isFeatured": true
    },
    {
      "_id": "681e2f4a7a418d374a94c198",
      "name": "Gaming PCs",
      "slug": "gaming-pcs",
      "parent": null,
      "level": 0,
      "isActive": true,
      "isFeatured": true
    },
    {
      "_id": "681e2f4a7a418d374a94c199",
      "name": "Monitors",
      "slug": "monitors",
      "parent": null,
      "level": 0,
      "isActive": true,
      "isFeatured": true
    },
    // Add subcategories with their parent IDs
    {
      "_id": "681e2f4a7a418d374a94c1a9",
      "name": "Gaming Monitors",
      "slug": "gaming-monitors",
      "parent": "681e2f4a7a418d374a94c199",
      "level": 1,
      "isActive": true,
      "isFeatured": false
    },
    {
      "_id": "681e2f4a7a418d374a94c1aa",
      "name": "Ultrawide Monitors",
      "slug": "ultrawide-monitors",
      "parent": "681e2f4a7a418d374a94c199",
      "level": 1,
      "isActive": true,
      "isFeatured": false
    },
    {
      "_id": "681e2f4a7a418d374a94c1ab",
      "name": "4K Monitors",
      "slug": "4k-monitors",
      "parent": "681e2f4a7a418d374a94c199",
      "level": 1,
      "isActive": true,
      "isFeatured": false
    }
  ];
  
  // Sample products (add more from paste-3.txt as needed)
  const products = [
    {
      "_id": "681e3143bf1727e8bb3a3d7b",
      "name": "TechStore Titan X",
      "slug": "techstore-titan-x",
      "description": "The TechStore Titan X is our flagship gaming PC featuring the latest NVIDIA RTX 4090 graphics card, Intel Core i9-13900K processor, 64GB DDR5 RAM, and advanced liquid cooling in a premium case with extensive RGB lighting.",
      "shortDescription": "Ultimate gaming PC with RTX 4090 and i9-13900K",
      "price": 3999.99,
      "compareAtPrice": 4299.99,
      "category": "681e2f4a7a418d374a94c198",
      "subCategory": "681e2f4a7a418d374a94c1a5",
      "specs": "Intel Core i9-13900K, RTX 4090 24GB, 64GB DDR5-6000, 2TB NVMe SSD + 4TB HDD",
      "discount": 7,
      "rating": 5,
      "reviewCount": 42,
      "brand": "TechStore",
      "isOnSale": true,
      "isFeatured": true,
      "thumbnailUrl": "images/techstore-titan-x.jpg"
    },
    {
      "_id": "681e3143bf1727e8bb3a3d7c",
      "name": "TechStore Voyager",
      "slug": "techstore-voyager",
      "description": "The TechStore Voyager delivers exceptional gaming performance at a reasonable price, featuring the Intel Core i7-13700K processor, NVIDIA RTX 4070 graphics, and 32GB of DDR5 memory in a stylish mid-tower case.",
      "shortDescription": "Balanced gaming PC with RTX 4070 and i7",
      "price": 2299.99,
      "compareAtPrice": 2499.99,
      "category": "681e2f4a7a418d374a94c198",
      "subCategory": "681e2f4a7a418d374a94c1a6",
      "specs": "Intel Core i7-13700K, RTX 4070 12GB, 32GB DDR5-5200, 1TB NVMe SSD + 2TB HDD",
      "discount": 8,
      "rating": 4.8,
      "reviewCount": 64,
      "brand": "TechStore",
      "isOnSale": true,
      "isFeatured": true,
      "thumbnailUrl": "images/techstore-voyager.jpg"
    },
    {
      "_id": "681e3143bf1727e8bb3a3d81",
      "name": "LG 27GN950-B UltraGear",
      "slug": "lg-27gn950-b-ultragear",
      "description": "The LG 27GN950-B UltraGear is a 27\" 4K gaming monitor with 144Hz refresh rate, 1ms response time, and outstanding color performance with VESA DisplayHDR 600 certification and 98% DCI-P3 color gamut.",
      "shortDescription": "4K gaming monitor with 144Hz refresh rate",
      "price": 799.99,
      "compareAtPrice": 899.99,
      "category": "681e2f4a7a418d374a94c199",
      "subCategory": "681e2f4a7a418d374a94c1ab",
      "specs": "27\" Nano IPS, 3840x2160, 144Hz, 1ms, HDR600, DCI-P3 98%",
      "discount": 11,
      "rating": 4.8,
      "reviewCount": 92,
      "brand": "LG",
      "isOnSale": true,
      "isFeatured": true,
      "thumbnailUrl": "images/lg-ultragear.jpg"
    }
  ];
  
  // Find the category
  const category = categories.find(cat => cat.slug === categorySlug);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }
  
  // Find subcategories 
  const subcategories = categories.filter(cat => cat.parent === category._id);
  const subcategoryIds = subcategories.map(cat => cat._id);
  
  // Filter products for this category and its subcategories
  const filteredProducts = products.filter(product => 
    product.category === category._id || 
    subcategoryIds.includes(product.subCategory)
  );
  
  // Apply sorting (default to featured)
  const sort = req.query.sort || 'featured';
  
  let sortedProducts = [...filteredProducts];
  
  switch (sort) {
    case 'price-low':
      sortedProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      sortedProducts.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      sortedProducts.sort((a, b) => b.rating - a.rating);
      break;
    case 'featured':
    default:
      sortedProducts.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) {
          return a.isFeatured ? -1 : 1;
        }
        return b.rating - a.rating;
      });
  }
  
  res.json({
    success: true,
    category: {
      id: category._id,
      name: category.name,
      slug: category.slug
    },
    productCount: sortedProducts.length,
    products: sortedProducts
  });
});

// Create a new category (admin only)
router.post('/', isAdmin, upload.single('image'), async (req, res) => {
  try {
    const categoryData = req.body;
    
    // Handle image upload
    if (req.file) {
      const image = new Image({
        filename: req.file.filename,
        path: req.file.path,
        thumbnailUrl: `/images/categories/${req.file.filename}`,
        entityType: 'category'
      });
      await image.save();
      categoryData.image = image._id;
      categoryData.thumbnailUrl = image.thumbnailUrl;
    }

    // Generate slug if not provided
    if (!categoryData.slug && categoryData.name) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Determine category level
    if (categoryData.parent) {
      const parentCategory = await Category.findById(categoryData.parent);
      categoryData.level = parentCategory ? parentCategory.level + 1 : 0;
    } else {
      categoryData.level = 0;
    }

    const newCategory = new Category(categoryData);
    await newCategory.save();

    res.status(201).json({
      success: true,
      category: newCategory,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Category creation error:', error);
    
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
      message: 'Error creating category',
      error: error.message
    });
  }
});

// Update a category (admin only)
router.put('/:id', isAdmin, upload.single('image'), async (req, res) => {
  try {
    const categoryData = req.body;
    
    // Handle image upload
    if (req.file) {
      const image = new Image({
        filename: req.file.filename,
        path: req.file.path,
        thumbnailUrl: `/images/categories/${req.file.filename}`,
        entityType: 'category'
      });
      await image.save();
      categoryData.image = image._id;
      categoryData.thumbnailUrl = image.thumbnailUrl;
    }

    // Determine category level
    if (categoryData.parent) {
      const parentCategory = await Category.findById(categoryData.parent);
      categoryData.level = parentCategory ? parentCategory.level + 1 : 0;
    }

    // Update the 'updatedAt' timestamp
    categoryData.updatedAt = Date.now();

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id, 
      categoryData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      category: updatedCategory,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Category update error:', error);
    
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
      message: 'Error updating category',
      error: error.message
    });
  }
});

// Delete a category (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    // Check if category has any child categories
    const childCategories = await Category.countDocuments({ parent: req.params.id });
    if (childCategories > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete category with child categories' 
      });
    }

    // Check if category has any products
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete category with associated products' 
      });
    }

    // Delete the category
    await Category.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Category deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting category',
      error: error.message
    });
  }
});

module.exports = router;