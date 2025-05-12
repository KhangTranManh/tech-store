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
function formatCartForResponse(cart) {
    if (!cart || !cart.items || !cart.items.length) {
      return { items: [], itemCount: 0 };
    }
  
    // Keep track of products by ID to prevent duplicates
    const uniqueItems = {};
    
    // First pass to combine quantities for duplicates
    cart.items.forEach(item => {
      const id = String(item.productId);
      
      if (uniqueItems[id]) {
        // If item exists, combine quantities
        uniqueItems[id].quantity += parseInt(item.quantity || 1);
      } else {
        // New item
        uniqueItems[id] = {
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
      }
    });
    
    // Convert back to array
    const uniqueItemsArray = Object.values(uniqueItems);
    
    // Calculate total item count
    const itemCount = uniqueItemsArray.reduce(
      (total, item) => total + (parseInt(item.quantity) || 1), 0
    );
    
    return {
      items: uniqueItemsArray,
      itemCount: itemCount
    };
  }

// In your GET '/' route:
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user ? req.user._id : req.guestId;
        let cart = await Cart.findOne({ userId: userId })
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

        // Apply deduplication before returning
        cart = deduplicateCart(cart);
        
        // Force a save to clean up any duplicates
        await Cart.findOneAndUpdate(
            { userId: userId },
            { items: cart.items },
            { new: true }
        );
        
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
// Fix for the route/cart.js add method to handle version errors

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
      const userId = req.user ? req.user._id : req.guestId;
      
      if (!userId) {
        // Create a guest ID if none exists
        req.session.guestId = new mongoose.Types.ObjectId();
      }
  
      // IMPORTANT: Use findOneAndUpdate instead of find + save to avoid version errors
      // This approach uses atomic updates which avoid the VersionError
      let cart = await Cart.findOneAndUpdate(
        { userId },
        { $setOnInsert: { isGuest: !req.user } },
        { upsert: true, new: true }
      );
  
      // Find the product
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
  
      // Normalize productId to string for consistent comparison
      const normalizedProductId = String(productId);
  
      // Update approach: Use findOneAndUpdate with atomic operators
      // This prevents the VersionError by doing the modification at the database level
      const updatedCart = await Cart.findOneAndUpdate(
        { 
          userId, 
          'items.productId': normalizedProductId 
        },
        { 
          // If item exists, increment its quantity
          $inc: { 'items.$.quantity': quantity } 
        },
        { new: true }
      );
  
      if (updatedCart) {
        // Item already existed and quantity was incremented
        console.log(`Updated quantity for existing product ${normalizedProductId}`);
        
        // Return the cart
        const formattedCart = formatCartForResponse(updatedCart);
        return res.status(200).json({
          success: true,
          message: 'Product quantity updated in cart',
          cart: formattedCart
        });
      } else {
        // Item doesn't exist yet, add it
        const updatedCart = await Cart.findOneAndUpdate(
          { userId },
          { 
            $push: { 
              items: {
                productId: product._id,
                quantity,
                name: name || product.name,
                price: price || product.price,
                image: image || product.thumbnailUrl || '/images/placeholder.jpg',
                specs: product.specs
              }
            }
          },
          { new: true }
        );
  
        console.log(`Added new product ${normalizedProductId} to cart`);
        
        // Return the cart
        const formattedCart = formatCartForResponse(updatedCart);
        return res.status(200).json({
          success: true,
          message: 'Product added to cart',
          cart: formattedCart
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding product to cart',
        error: error.message
      });
    }
  });
router.put('/update', isAuthenticated, async (req, res) => {
    try {
        // Accept either itemId or productId
        const { itemId, productId, quantity } = req.body;
        const cartItemId = itemId || productId;
        
        if (!cartItemId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Item ID and quantity are required'
            });
        }
        
        // Rest of your code...
        // Find the cart - use guest ID if needed
        const userId = req.user ? req.user._id : req.guestId;
        const cart = await Cart.findOne({ userId });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        // Find the item in the cart - check both _id and productId
        let itemIndex = cart.items.findIndex(item => 
            item._id.toString() === cartItemId
        );
        
        // If not found by _id, try finding by productId
        if (itemIndex === -1) {
            itemIndex = cart.items.findIndex(item =>
                item.productId.toString() === cartItemId
            );
        }
        
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
        
        // Format cart for response
        const formattedCart = formatCartForResponse(cart);
        
        res.status(200).json({
            success: true,
            message: 'Cart updated',
            cart: formattedCart
        });
        
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while updating cart' 
        });
    }
});
router.delete('/remove/:itemId', isAuthenticated, async (req, res) => {
    try {
        const { itemId } = req.params;
        
        // Normalize the itemId to a string for consistent comparison
        const normalizedItemId = String(itemId);
        
        console.log(`Attempting to remove item with ID: ${normalizedItemId}`);
        
        // Find the cart - use guest ID if needed
        const userId = req.user ? req.user._id : req.guestId;
        const cart = await Cart.findOne({ userId });
        
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        // Log current cart items to help with debugging
        console.log('Current cart items before removal:', cart.items.map(item => ({
            id: String(item._id), 
            productId: String(item.productId),
            name: item.name
        })));
        
        // FIXED: Use OR logic instead of AND for removal
        // Remove item if EITHER the _id OR productId matches
        const originalLength = cart.items.length;
        cart.items = cart.items.filter(item => {
            const itemIdStr = String(item._id);
            const productIdStr = String(item.productId);
            
            // Keep this item if NEITHER id matches our target
            // (meaning remove if EITHER matches)
            const shouldKeep = (itemIdStr !== normalizedItemId) && 
                               (productIdStr !== normalizedItemId);
            
            console.log(`Item ${itemIdStr} (product ${productIdStr}): ${shouldKeep ? 'keeping' : 'removing'}`);
            
            return shouldKeep;
        });
        
        // Check if anything was removed
        if (cart.items.length === originalLength) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }
        
        console.log(`Removed item, cart now has ${cart.items.length} items`);
        
        // Save cart
        await cart.save();
        
        // Return updated cart with proper formatting
        const formattedCart = formatCartForResponse(cart);
        
        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            cart: formattedCart
        });
        
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while removing from cart' 
        });
    }
});
// Clear cart
router.delete('/clear', isAuthenticated, async (req, res) => {
    try {
        // Find and update the cart - use guest ID if needed
        const userId = req.user ? req.user._id : req.guestId;
        await Cart.findOneAndUpdate(
            { userId },
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
        console.error('Error clearing cart:', error);
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

        // Return updated cart with proper formatting
        const formattedCart = formatCartForResponse(userCart);

        res.status(200).json({
            success: true,
            message: 'Guest cart transferred to user account',
            cart: formattedCart
        });

    } catch (error) {
        console.error('Error transferring cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error transferring cart'
        });
    }
});

// Sync cart route
router.post('/sync', isAuthenticated, async (req, res) => {
    try {
        const { items } = req.body;
        const userId = req.user ? req.user._id : req.guestId;
      
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items to sync'
            });
        }
      
        // Find or create cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({
                userId,
                items: [],
                isGuest: !req.user
            });
        }
      
        // Clear existing items
        cart.items = [];
      
        // Add new items from local storage
        for (const item of items) {
            // Find product by ID
            let product;
            
            try {
                product = await Product.findById(item.productId);
            } catch (error) {
                console.warn(`Product not found for ID ${item.productId}:`, error);
                // Continue with the next item
                continue;
            }
            
            if (product) {
                cart.items.push({
                    productId: product._id,
                    quantity: parseInt(item.quantity) || 1,
                    name: item.name || product.name,
                    price: parseFloat(item.price) || product.price,
                    image: item.image || product.thumbnailUrl || '/images/placeholder.jpg',
                    specs: product.specs
                });
            } else {
                // If product not found but we have name and price, still add it
                if (item.name && item.price) {
                    cart.items.push({
                        productId: new mongoose.Types.ObjectId(), // Generate a temporary ID
                        quantity: parseInt(item.quantity) || 1,
                        name: item.name,
                        price: parseFloat(item.price),
                        image: item.image || '/images/placeholder.jpg',
                        specs: item.specs || ''
                    });
                }
            }
        }
      
        // Save the updated cart
        await cart.save();
      
        res.status(200).json({
            success: true,
            message: 'Cart synced successfully',
            cart: formatCartForResponse(cart)
        });
      
    } catch (error) {
        console.error('Error syncing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error syncing cart',
            error: error.message
        });
    }
});

module.exports = router;