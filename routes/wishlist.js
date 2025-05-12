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

    // Find the user's wishlist or create a new one
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
    
    // Check if product already exists in wishlist
    let existingItemIndex = -1;
    
    if (product) {
      // Check by product ID
      existingItemIndex = wishlist.items.findIndex(item => 
        item.product && item.product.toString() === product._id.toString()
      );
    } else if (name) {
      // No product found, check by name
      existingItemIndex = wishlist.items.findIndex(item => 
        item.name === name
      );
    }
    
    // If item already exists, return early
    if (existingItemIndex >= 0) {
      return res.status(200).json({
        success: true,
        message: 'Product already in wishlist',
        wishlist
      });
    }
    
    // Add the item to wishlist
    if (product) {
      wishlist.items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.thumbnailUrl || image || 'images/placeholder.jpg',
        quantity: 1
      });
    } else if (name && price) {
      // If no product found but we have details
      wishlist.items.push({
        product: new mongoose.Types.ObjectId(), // Create a virtual ID
        name: name,
        price: parseFloat(price),
        image: image || 'images/placeholder.jpg',
        quantity: 1
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Product not found and insufficient data provided'
      });
    }
    
    // Save wishlist with a retry mechanism for concurrent operations
    let savedWishlist;
    let retries = 3;
    
    while (retries > 0) {
      try {
        savedWishlist = await wishlist.save();
        break; // Exit the loop if save was successful
      } catch (saveError) {
        retries--;
        
        // If it's a duplicate key error, the item is already in wishlist
        if (saveError.code === 11000) {
          return res.status(200).json({
            success: true,
            message: 'Product already in wishlist',
            wishlist
          });
        }
        
        // If it's a version error or we've run out of retries, throw the error
        if (saveError.name !== 'VersionError' || retries === 0) {
          throw saveError;
        }
        
        // Otherwise, refresh the wishlist and try again
        wishlist = await Wishlist.findOne({ user: req.user._id });
        
        // Re-check for existing item
        let existingItemIndex = -1;
        
        if (product) {
          existingItemIndex = wishlist.items.findIndex(item => 
            item.product && item.product.toString() === product._id.toString()
          );
        } else if (name) {
          existingItemIndex = wishlist.items.findIndex(item => 
            item.name === name
          );
        }
        
        // If item exists after refresh, return early
        if (existingItemIndex >= 0) {
          return res.status(200).json({
            success: true,
            message: 'Product already in wishlist',
            wishlist
          });
        }
        
        // Otherwise, add the item again
        if (product) {
          wishlist.items.push({
            product: product._id,
            name: product.name,
            price: product.price,
            image: product.thumbnailUrl || image || 'images/placeholder.jpg',
            quantity: 1
          });
        } else if (name && price) {
          wishlist.items.push({
            product: new mongoose.Types.ObjectId(),
            name: name,
            price: parseFloat(price),
            image: image || 'images/placeholder.jpg',
            quantity: 1
          });
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlist: savedWishlist || wishlist
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
router.delete('/remove/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Find user's wishlist and atomically update it
    const result = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { 
        $pull: { 
          items: {
            $or: [
              // Pull by item._id
              { _id: mongoose.Types.ObjectId.isValid(productId) ? productId : null },
              // Pull by product._id
              { product: mongoose.Types.ObjectId.isValid(productId) ? productId : null }
            ]
          }
        } 
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist: result
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
    
    // First check if productId is a valid MongoDB ID and check by product ID
    let inWishlist = false;
    
    if (mongoose.Types.ObjectId.isValid(productId)) {
      inWishlist = wishlist.items.some(item => 
        item.product && item.product.toString() === productId
      );
    }
    
    // If not found by ID, check if there's a product with this SKU
    if (!inWishlist) {
      const product = await Product.findOne({ sku: productId });
      
      if (product) {
        inWishlist = wishlist.items.some(item => 
          item.product && item.product.toString() === product._id.toString()
        );
      }
    }
    
    // If still not found, check by name (as fallback)
    if (!inWishlist) {
      inWishlist = wishlist.items.some(item => 
        item.name && item.name.includes(productId)
      );
    }
    
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
router.delete('/clear', async (req, res) => {
  try {
    // Find user's wishlist and atomically update it
    const result = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      wishlist: result
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