const express = require('express');
const router = express.Router();
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');
const Category = require('../models/category');
const mongoose = require('mongoose'); // Add this line

const { isAuthenticated } = require('../middleware/auth');
const Cart = require('../models/cart');


router.use(isAuthenticated);

// Get wishlist
router.get('/', async (req, res) => {
  try {
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name price thumbnailUrl sku' // Selective population
      });
    
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        wishlist: { items: [] }
      });
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
// In your wishlist routes file
router.post('/add', async (req, res) => {
  try {
    const { productId, name, price, image } = req.body;
    
    // Validate inputs
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user._id,
        items: []
      });
    }

    // Try to find product by SKU OR MongoDB ObjectId
    let product;
    
    // Try to find by SKU first
    product = await Product.findOne({ sku: productId });
    
    // If not found by SKU and productId looks like a valid MongoDB ObjectId, try that
    if (!product && mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    
    // If still no product but we have the details from frontend, create a "virtual" product reference
    if (!product && name && price) {
      const productData = {
        _id: new mongoose.Types.ObjectId(),
        name: name,
        price: parseFloat(price),
        image: image || 'images/placeholder.jpg'
      };
      
      // Add product with the data from the UI
      wishlist.items.push({
        product: productData._id,
        name: productData.name,
        price: productData.price,
        image: productData.image,
        quantity: 1
      });
    } else if (product) {
      // Using the found product
      // Check if product is already in wishlist
      const existingItem = wishlist.items.find(item => 
        item.product.toString() === product._id.toString()
      );
      
      if (existingItem) {
        return res.status(200).json({
          success: true,
          message: 'Product already in wishlist',
          wishlist
        });
      }
      
      // Add the product to wishlist
      wishlist.items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.thumbnailUrl || image || 'images/placeholder.jpg',
        quantity: 1
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Product not found and insufficient data provided'
      });
    }
    
    // Save the wishlist
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

// Get wishlist count
router.get('/count', async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    const count = wishlist ? wishlist.items.length : 0;
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving wishlist count',
      error: error.message
    });
  }
});
// Update the remove route in routes/wishlist.js
router.delete('/remove/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    console.log('Attempting to remove item with ID:', productId);
    
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    // Track if we found and removed anything
    let itemRemoved = false;
    
    // Case 1: Try to remove by direct match on item._id
    if (mongoose.Types.ObjectId.isValid(productId)) {
      const originalLength = wishlist.items.length;
      wishlist.items = wishlist.items.filter(item => item._id.toString() !== productId);
      itemRemoved = wishlist.items.length < originalLength;
      
      console.log(`Attempted removal by item._id: ${itemRemoved ? 'Success' : 'No match'}`);
    }
    
    // Case 2: If still not removed and ID is valid MongoDB ID, try by product ID
    if (!itemRemoved && mongoose.Types.ObjectId.isValid(productId)) {
      const originalLength = wishlist.items.length;
      wishlist.items = wishlist.items.filter(item => 
        !item.product || item.product.toString() !== productId
      );
      itemRemoved = wishlist.items.length < originalLength;
      
      console.log(`Attempted removal by product ID: ${itemRemoved ? 'Success' : 'No match'}`);
    }
    
    // Case 3: Last resort - try by product SKU
    if (!itemRemoved) {
      for (let i = 0; i < wishlist.items.length; i++) {
        const product = await Product.findOne({ sku: productId });
        if (product && wishlist.items[i].product.toString() === product._id.toString()) {
          wishlist.items.splice(i, 1);
          itemRemoved = true;
          console.log('Removed by product SKU match');
          break;
        }
      }
    }
    
    // Save the updated wishlist
    await wishlist.save();
    
    if (itemRemoved) {
      res.status(200).json({
        success: true,
        message: 'Product removed from wishlist',
        wishlist
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Product not found in wishlist',
        wishlist
      });
    }
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing product from wishlist',
      error: error.message
    });
  }
});
router.get('/check/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // If not authenticated, return false
    if (!req.user) {
      return res.status(200).json({ inWishlist: false });
    }
    
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      return res.status(200).json({ inWishlist: false });
    }
    
    // Try to find product by SKU first
    let product = await Product.findOne({ sku: productId });
    
    // If not found by SKU and it's a valid ObjectId, try that
    if (!product && mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    
    // If product found, check if it's in wishlist
    if (product) {
      const inWishlist = wishlist.items.some(item => 
        item.product.toString() === product._id.toString()
      );
      return res.status(200).json({ inWishlist });
    }
    
    // If no product found but we have items with matching productId (as SKU)
    const inWishlist = wishlist.items.some(item => 
      item.name && item.name.includes(productId)
    );
    
    return res.status(200).json({ inWishlist });
    
  } catch (error) {
    console.error('Error checking wishlist status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking wishlist status',
      error: error.message
    });
  }
});
// Clear entire wishlist
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