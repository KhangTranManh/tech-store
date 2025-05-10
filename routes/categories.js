// routes/categories.js
const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const Product = require('../models/product');
const multer = require('multer');
const path = require('path');
const Image = require('../models/image');

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

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { 
      level, 
      isActive, 
      isFeatured, 
      parent,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query
    const query = {};
    if (level !== undefined) query.level = level;
    if (isActive !== undefined) query.isActive = isActive;
    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (parent !== undefined) query.parent = parent;

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
      .limit(limitNumber);

    // Count total categories
    const totalCategories = await Category.countDocuments(query);

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
      message: 'Error fetching categories' 
    });
  }
});

// Get a single category by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Find category by either ID or slug
    const category = await Category.findOne({
      $or: [
        { _id: identifier },
        { slug: identifier }
      ]
    })
    .populate('parent', 'name slug')
    .populate('image', 'thumbnailUrl')
    .populate({
      path: 'children',
      select: 'name slug'
    });

    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

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
      message: 'Error fetching category' 
    });
  }
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
      message: 'Error creating category' 
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
      message: 'Error updating category' 
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
      message: 'Error deleting category' 
    });
  }
});

// Get products for a specific category
router.get('/:id/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Find products in the category
    const products = await Product.find({ category: req.params.id })
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber)
      .populate('category', 'name slug');

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
    console.error('Error fetching category products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching category products' 
    });
  }
});

module.exports = router;