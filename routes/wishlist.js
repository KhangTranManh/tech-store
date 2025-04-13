// routes/wishlist.js
const express = require('express');
const router = express.Router();
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');
const { isAuthenticated } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /api/wishlist
 * @desc    Get user's wishlist
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    // Find or create user's wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('items.product');
    
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
      await wishlist.save();
    }
    
    res.status(200).json({
      success: true,
      wishlist
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wishlist',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/wishlist/add
 * @desc    Add product to wishlist
 * @access  Private
 */
router.post('/add', async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Find product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Find or create user's wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
    }
    
    // Check if product is already in wishlist
    const itemExists = wishlist.items.some(item => 
      item.product.toString() === productId
    );
    
    if (itemExists) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in your wishlist'
      });
    }
    
    // Add product to wishlist
    wishlist.items.push({
      product: productId,
      name: product.name,
      price: product.price,
      image: product.image
    });
    
    await wishlist.save();
    
    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlist
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding product to wishlist',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/wishlist/remove/:productId
 * @desc    Remove product from wishlist
 * @access  Private
 */
router.delete('/remove/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    // Remove product from wishlist
    wishlist.items = wishlist.items.filter(item => 
      item.product.toString() !== productId
    );
    
    await wishlist.save();
    
    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing product from wishlist',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/wishlist/clear
 * @desc    Clear wishlist
 * @access  Private
 */
router.delete('/clear', async (req, res) => {
  try {
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    // Clear wishlist
    wishlist.items = [];
    await wishlist.save();
    
    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      wishlist
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing wishlist',
      error: error.message
    });
  }
});

module.exports = router;