const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Product = require('../models/product');
const mongoose = require('mongoose');
const debug = require('debug')('app:cart');

// Modified authentication middleware
const isAuthenticated = (req, res, next) => {
    // Allow guest cart operations
    if (!req.user) {
        // Create a guest user ID if none exists
        if (!req.session.guestId) {
            req.session.guestId = new mongoose.Types.ObjectId();
        }
        req.guestId = req.session.guestId;
    }
    next();
};
// Get current user's cart
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.guestId;
        const cart = await Cart.findOne({ userId: userId })
            .populate({
                path: 'items.productId',
                select: 'name price images thumbnailUrl specs'
            });

        if (!cart) {
            return res.status(200).json({
                success: true,
                cart: { items: [], itemCount: 0 }
            });
        }

        // Use the formatCartForResponse function to properly format cart data
        const formattedCart = formatCartForResponse(cart);

        res.status(200).json({
            success: true,
            cart: formattedCart
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart'
        });
    }
});
// routes/cart.js
router.post('/add', isAuthenticated, async (req, res) => {
    try {
      const { productId, quantity = 1, name, price, image } = req.body;
      
      // Validate inputs
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }
  
      // Determine user ID (for both logged-in and guest users)
      const userId = req.user ? req.user._id : req.session.guestId;
      
      if (!userId) {
        // Create a guest ID if none exists
        req.session.guestId = new mongoose.Types.ObjectId();
      }
  
      // Find or create a cart
      let cart = await Cart.findOne({ userId });
      
      if (!cart) {
        cart = new Cart({ 
          userId, 
          items: [],
          isGuest: !req.user
        });
      }
  
      // Find the product
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
  
      // Check if product already in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );
  
      if (existingItemIndex > -1) {
        // Update quantity if product exists
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({
          productId,
          quantity,
          name: name || product.name,
          price: price || product.price,
          image: image || product.thumbnailUrl || '/images/placeholder.jpg',
          specs: product.specs
        });
      }
  
      // Save the cart
      await cart.save();
  
      res.status(200).json({
        success: true,
        message: 'Product added to cart',
        cart: {
          items: cart.items,
          itemCount: cart.items.reduce((total, item) => total + item.quantity, 0)
        }
      });
  
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding product to cart',
        error: error.message
      });
    }
  });

// Clear cart
router.post('/clear', isAuthenticated, async (req, res) => {
    try {
        // Find and update the cart
        await Cart.findOneAndUpdate(
            { userId: req.user._id },
            { $set: { items: [] } },
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'Cart cleared',
            cart: {
                items: [],
                itemCount: 0
            }
        });
        
    } catch (error) {
        debug('Error details:', error);
        console.error('Cart operation failed:', {
            error: error.message,
            stack: error.stack,
            userId: req?.user?._id
        });
        res.status(500).json({ 
            success: false, 
            message: 'Server error while clearing cart' 
        });
    }
});
// Ensure items have all necessary properties when returning cart data
function formatCartForResponse(cart) {
    if (!cart || !cart.items || !cart.items.length) {
      return { items: [], itemCount: 0 };
    }
  
    return {
      items: cart.items.map(item => {
        // Make sure each item has all necessary fields
        return {
          id: item._id || item.id,
          productId: item.productId._id || item.productId,
          name: item.name || (item.productId.name || "Product"),
          price: parseFloat(item.price || (item.productId.price || 0)),
          image: item.image || (item.productId.thumbnailUrl || 
                  (item.productId.images && item.productId.images.length > 0 ? 
                   item.productId.images[0] : '/images/placeholder.jpg')),
          quantity: parseInt(item.quantity || 1),
          specs: item.specs || (item.productId.specs || '')
        };
      }),
      itemCount: cart.items.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0)
    };
  }

// Update item quantity
router.put('/update', isAuthenticated, async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        
        if (!itemId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Item ID and quantity are required'
            });
        }
        
        // Find the cart
        const cart = await Cart.findOne({ userId: req.user._id });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        // Find the item in the cart
        const itemIndex = cart.items.findIndex(item => 
            item._id.toString() === itemId
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }
        
        // Update quantity or remove if quantity is 0
        if (parseInt(quantity) <= 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = parseInt(quantity);
        }
        
        // Save cart
        await cart.save();
        
        // Return updated cart
        const updatedCart = await Cart.findOne({ userId: req.user._id })
            .populate({
                path: 'items.productId',
                select: 'name price images specs',
                model: 'Product'
            });
        
        const cartItems = updatedCart ? updatedCart.items.map(item => {
            const product = item.productId;
            return {
                id: item._id,
                productId: product._id,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : '',
                specs: product.specs || '',
                quantity: item.quantity
            };
        }) : [];
        
        res.status(200).json({
            success: true,
            message: 'Cart updated',
            cart: {
                items: cartItems,
                itemCount: updatedCart ? updatedCart.itemCount : 0
            }
        });
        
    } catch (error) {
        debug('Error details:', error);
        console.error('Cart operation failed:', {
            error: error.message,
            stack: error.stack,
            userId: req?.user?._id
        });
        res.status(500).json({ 
            success: false, 
            message: 'Server error while updating cart' 
        });
    }
});

// Remove item from cart
router.delete('/remove/:itemId', isAuthenticated, async (req, res) => {
    try {
        const { itemId } = req.params;
        
        // Find the cart
        const cart = await Cart.findOne({ userId: req.user._id });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        // Remove the item
        cart.items = cart.items.filter(item => 
            item._id.toString() !== itemId
        );
        
        // Save cart
        await cart.save();
        
        // Return updated cart
        const updatedCart = await Cart.findOne({ userId: req.user._id })
            .populate({
                path: 'items.productId',
                select: 'name price images specs',
                model: 'Product'
            });
        
        const cartItems = updatedCart ? updatedCart.items.map(item => {
            const product = item.productId;
            return {
                id: item._id,
                productId: product._id,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : '',
                specs: product.specs || '',
                quantity: item.quantity
            };
        }) : [];
        
        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            cart: {
                items: cartItems,
                itemCount: updatedCart ? updatedCart.itemCount : 0
            }
        });
        
    } catch (error) {
        debug('Error details:', error);
        console.error('Cart operation failed:', {
            error: error.message,
            stack: error.stack,
            userId: req?.user?._id
        });
        res.status(500).json({ 
            success: false, 
            message: 'Server error while removing from cart' 
        });
    }
});

// Clear cart
router.delete('/clear', isAuthenticated, async (req, res) => {
    try {
        // Find and update the cart
        await Cart.findOneAndUpdate(
            { userId: req.user._id },
            { $set: { items: [] } },
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'Cart cleared',
            cart: {
                items: [],
                itemCount: 0
            }
        });
        
    } catch (error) {
        debug('Error details:', error);
        console.error('Cart operation failed:', {
            error: error.message,
            stack: error.stack,
            userId: req?.user?._id
        });
        res.status(500).json({ 
            success: false, 
            message: 'Server error while clearing cart' 
        });
    }
});
// Transfer guest cart to user cart after login
router.post('/transfer', async (req, res) => {
    try {
        // Check if user is logged in and has a guestId
        if (!req.user || !req.session.guestId) {
            return res.status(400).json({
                success: false,
                message: 'No guest cart or user not authenticated'
            });
        }

        // Find guest cart
        const guestCart = await Cart.findOne({ userId: req.session.guestId });
        
        if (!guestCart || guestCart.items.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No guest cart to transfer',
                cart: { items: [], itemCount: 0 }
            });
        }

        // Find or create user cart
        let userCart = await Cart.findOne({ userId: req.user._id });
        if (!userCart) {
            userCart = new Cart({
                userId: req.user._id,
                items: []
            });
        }

        // Transfer items from guest cart to user cart
        guestCart.items.forEach(item => {
            const existingItemIndex = userCart.items.findIndex(
                userItem => userItem.productId.toString() === item.productId.toString()
            );
            
            if (existingItemIndex > -1) {
                // If item exists in user cart, update quantity
                userCart.items[existingItemIndex].quantity += item.quantity;
            } else {
                // If not, add the item
                userCart.items.push(item);
            }
        });

        // Save user cart
        await userCart.save();
        
        // Delete guest cart
        await Cart.findByIdAndDelete(guestCart._id);
        
        // Clear guest ID from session
        delete req.session.guestId;

        // Return updated cart
        res.status(200).json({
            success: true,
            message: 'Guest cart transferred to user account',
            cart: {
                items: userCart.items,
                itemCount: userCart.itemCount
            }
        });

    } catch (error) {
        console.error('Error transferring cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error transferring cart'
        });
    }
});

module.exports = router;