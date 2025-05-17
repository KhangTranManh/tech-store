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
}
// Update the POST route in orders.js to properly handle product images

router.post('/', async (req, res) => {
    try {
        // Get user from authenticated session
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not authenticated' 
            });
        }
        
        // Validate request body
        const { 
            items, 
            addressId, 
            paymentMethodId, 
            paymentType, 
            subtotal, 
            shipping, 
            tax,
            notes 
        } = req.body;
        
        // Validate required fields
        if (!items || !addressId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required order information' 
            });
        }
        
        // Verify address belongs to user
        const address = await Address.findOne({ 
            _id: addressId, 
            user: user._id
        });
        
        if (!address) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid shipping address' 
            });
        }
        
        // For COD orders, skip payment method verification
        let paymentLast4 = '';
        
        // Only verify payment method for card payments
        if (paymentType !== 'cod') {
            if (!paymentMethodId) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment method is required for non-COD orders'
                });
            }
            
            // Verify payment method belongs to user
            const paymentMethod = await PaymentMethod.findOne({ 
                _id: paymentMethodId, 
                user: user._id
            });
            
            if (!paymentMethod) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid payment method' 
                });
            }
            
            // Set payment last4 if available
            paymentLast4 = paymentMethod.last4 || '';
        }
        
        // Calculate total
        const total = subtotal + shipping + tax;
        
        // Process items to ensure they have valid images and data
        const processedItems = items.map(item => {
            // Ensure we have a valid image URL
            const imageUrl = item.image && item.image !== '' ? item.image : '/images/placeholder.jpg';
            
            return {
                productId: item.productId,
                name: item.name || 'Product',
                price: parseFloat(item.price) || 0,
                quantity: parseInt(item.quantity) || 1,
                image: imageUrl
            };
        });
        
        // Create new order
        const newOrder = new Order({
            user: user._id,
            items: processedItems,
            shippingAddress: addressId,
            paymentType: paymentType || 'card',
            ...(paymentType !== 'cod' && { paymentMethod: paymentMethodId }),
            paymentLast4,
            subtotal,
            shippingCost: shipping,
            tax,
            total,
            status: 'pending',
            notes: notes || '',
            statusHistory: [{
                status: 'pending',
                note: 'Order created'
            }]
        });
        
        // If this is a COD order, add an initial tracking entry
        if (paymentType === 'cod') {
            newOrder.tracking = [{
                status: 'Order Placed',
                description: 'Your order has been received and will be processed upon delivery',
                timestamp: new Date(),
                location: 'Online Store'
            }];
        }
        
        // Save order to generate ID
        await newOrder.save();
        
        // Generate consistent order number using ORD- format
        // The pre-save middleware should handle this now, but we ensure it's properly formatted here
        if (!newOrder.orderNumber || !newOrder.orderNumber.startsWith('ORD-')) {
            const idString = newOrder._id.toString();
            const sixDigits = idString.length > 6 ? idString.slice(-10, -4) : idString.padStart(6, '0');
            const fourDigits = idString.length > 4 ? idString.slice(-4) : '0000';
            
            newOrder.orderNumber = `ORD-${sixDigits}-${fourDigits}`;
            await newOrder.save();
        }
        
        // Clear user's cart
        const cart = await Cart.findOne({ userId: user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        
        // Send order confirmation email
        try {
            await sendOrderConfirmationEmail(user, newOrder);
            console.log(`Order confirmation email sent to ${user.email} for order ${newOrder.orderNumber}`);
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // We don't want to fail the order creation if the email fails
            // Just log the error and continue
        }
        
        // Respond with success and order details
        res.status(201).json({ 
            success: true, 
            order: newOrder,
            message: 'Order placed successfully' 
        });
    } catch (error) {
        console.error('Order placement error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to place order. Please try again.',
            error: error.message 
        });
    }
});
/**
 * Deduplicates cart items by combining items with the same productId
 * This function is for API response formatting only, not for database updates
 * @param {Object} cart - The cart object with items array
 * @returns {Object} - Deduplicated cart object for API response
 */
function deduplicateCart(cart) {
    // Return early if cart is empty or invalid
    if (!cart || !cart.items || cart.items.length === 0) {
      return cart || { items: [], itemCount: 0 };
    }
    
    // Create an object to store unique items by productId (as string)
    const uniqueItems = {};
    
    // First, group items by their productId (as string)
    cart.items.forEach(item => {
      if (!item) return; // Skip null or undefined items
      
      // Get a safe ID to use as a key
      let safeId;
      
      if (item.productId) {
        // If productId is an object with _id (populated mongoose document)
        if (typeof item.productId === 'object' && item.productId !== null && item.productId._id) {
          safeId = String(item.productId._id);
        } 
        // If productId is a string
        else if (typeof item.productId === 'string') {
          // Skip invalid productIds like 'undefined' or 'null'
          if (item.productId === 'undefined' || item.productId === 'null') {
            return;
          }
          safeId = item.productId;
        }
        // If productId is already an ObjectId
        else {
          safeId = String(item.productId);
        }
      } else {
        // If no productId, use item's _id or generate a fallback
        safeId = item._id ? String(item._id) : 'item_' + Math.random().toString(36).substr(2, 9);
      }
      
      if (uniqueItems[safeId]) {
        // If this productId already exists, combine quantities
        uniqueItems[safeId].quantity += parseInt(item.quantity || 1);
      } else {
        // Create a new item object with all needed properties
        uniqueItems[safeId] = {
          id: item._id ? String(item._id) : safeId,
          productId: safeId,
          name: item.name || 'Product',
          price: parseFloat(item.price || 0),
          image: item.image || '/images/placeholder.jpg',
          quantity: parseInt(item.quantity || 1),
          specs: item.specs || ''
        };
      }
    });
    
    // Convert object to array for the response
    const itemsArray = Object.values(uniqueItems);
    
    // Calculate total item count
    const itemCount = itemsArray.reduce((total, item) => total + parseInt(item.quantity || 1), 0);
    
    // Return a new cart object with deduplicated items
    return {
      ...cart,
      items: itemsArray,
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

        // Make a safe copy for formatting the response
        const safeCart = {
            _id: cart._id,
            userId: cart.userId,
            items: cart.items.filter(item => item).map(item => {
                // Create a safe item copy without direct references to MongoDB document
                return {
                    _id: item._id,
                    productId: item.productId,
                    quantity: item.quantity || 1,
                    name: item.name || (item.productId && item.productId.name ? item.productId.name : 'Product'),
                    price: item.price || (item.productId && item.productId.price ? item.productId.price : 0),
                    image: item.image || (item.productId && item.productId.thumbnailUrl ? item.productId.thumbnailUrl : '/images/placeholder.jpg'),
                    specs: item.specs || (item.productId && item.productId.specs ? item.productId.specs : '')
                };
            })
        };

        // Apply deduplication for the response formatting
        const deduplicatedCart = deduplicateCart(safeCart);
        
        // Format the cart for the API response
        const formattedCart = formatCartForResponse(deduplicatedCart);

        // Clean up invalid items in the actual MongoDB cart
        // We need to make sure all items have a valid productId (ObjectId)
        const validCartItems = cart.items.filter(item => {
            // Keep only items with a valid productId that can be cast to ObjectId
            return item && item.productId && 
                   // Make sure productId is not a string like 'undefined'
                   !(typeof item.productId === 'string' && 
                     (item.productId === 'undefined' || item.productId === 'null'));
        });

        // Only update the database if we need to remove invalid items
        if (validCartItems.length !== cart.items.length) {
            try {
                await Cart.findOneAndUpdate(
                    { userId: userId },
                    { $set: { items: validCartItems } },
                    { new: true }
                );
                console.log('Removed invalid items from cart');
            } catch (saveError) {
                console.error('Error cleaning up cart:', saveError);
                // Continue with the response even if the save fails
            }
        }

        res.status(200).json({
            success: true,
            cart: formattedCart
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
});
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
        // Get product image from database or fallback to provided image
        const productImage = product.thumbnailUrl || product.images?.[0] || image || '/images/placeholder.jpg';

        const updatedCart = await Cart.findOneAndUpdate(
          { userId },
          { 
            $push: { 
              items: {
                productId: product._id,
                quantity,
                name: name || product.name,
                price: price || product.price,
                image: productImage,
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
// Improved Sync cart route to better handle product images
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
      
        // Process and add new items from request
        const validItems = [];
      
        for (const item of items) {
            // Skip invalid items
            if (!item.productId) continue;

            try {
                // Normalize the productId to make sure it's a valid ObjectId
                const productId = mongoose.Types.ObjectId.isValid(item.productId) 
                ? new mongoose.Types.ObjectId(item.productId) 
                : null;
                
                if (!productId) {
                    console.warn(`Invalid productId format: ${item.productId}`);
                    continue;
                }
                
                // Find product in database
                const product = await Product.findById(productId);
                
                if (product) {
                    // If product exists in database, prefer its image
                    validItems.push({
                        productId: product._id,
                        quantity: parseInt(item.quantity) || 1,
                        name: item.name || product.name,
                        price: parseFloat(item.price) || product.price,
                        image: product.thumbnailUrl || item.image || '/images/placeholder.jpg',
                        specs: product.specs || item.specs || ''
                    });
                } else {
                    // If product not found but we have name and price, add it with provided info
                    if (item.name && item.price) {
                        // Ensure the image is valid
                        const imageUrl = item.image && item.image !== '' 
                            ? item.image 
                            : '/images/placeholder.jpg';
                            
                        validItems.push({
                            productId: productId,
                            quantity: parseInt(item.quantity) || 1,
                            name: item.name,
                            price: parseFloat(item.price),
                            image: imageUrl,
                            specs: item.specs || ''
                        });
                    }
                }
            } catch (error) {
                console.warn(`Error processing item ${item.productId}:`, error);
                // Continue with next item
            }
        }
      
        // Update cart with valid items only
        cart.items = validItems;
      
        // Save the updated cart
        await cart.save();
      
        // Format the cart for response
        const formattedCart = formatCartForResponse(cart);
      
        res.status(200).json({
            success: true,
            message: 'Cart synced successfully',
            cart: formattedCart
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
/**
 * Format cart data for API response
 * @param {Object} cart - Cart object
 * @returns {Object} - Formatted cart data
 */
function formatCartForResponse(cart) {
    // Return empty cart if invalid
    if (!cart || !cart.items || !cart.items.length) {
      return { items: [], itemCount: 0 };
    }
    
    // Process each item safely
    const formattedItems = cart.items
      .filter(item => item) // Remove null/undefined items
      .map(item => {
        // Get product name - check all possible sources
        const name = item.name || 
          (item.productId && typeof item.productId === 'object' && item.productId.name) || 
          'Product';
        
        // Get product price - check all possible sources
        const price = parseFloat(
          item.price || 
          (item.productId && typeof item.productId === 'object' && item.productId.price) || 
          0
        );
        
        // Get product image - check all possible sources
        let image = item.image || '';
        
        // Try to get image from productId if it's an object
        if (!image && item.productId && typeof item.productId === 'object') {
          // Check thumbnailUrl first
          if (item.productId.thumbnailUrl) {
            image = item.productId.thumbnailUrl;
          }
          // Then try images array
          else if (item.productId.images && item.productId.images.length > 0) {
            image = item.productId.images[0];
          }
        }
        
        // Use placeholder if still no image
        if (!image) {
          image = '/images/placeholder.jpg';
        }
        
        // Get specs - check all possible sources
        const specs = item.specs || 
          (item.productId && typeof item.productId === 'object' && item.productId.specs) || 
          '';
        
        // Get product ID safely
        let productId;
        if (item.productId) {
          if (typeof item.productId === 'object' && item.productId._id) {
            productId = item.productId._id;
          } else {
            productId = item.productId;
          }
        } else {
          productId = item._id || 'unknown';
        }
        
        // Return safe item object
        return {
          id: item._id || 'item_' + Math.random().toString(36).substr(2, 9),
          productId: productId,
          name: name,
          price: price, 
          image: image,
          quantity: parseInt(item.quantity || 1),
          specs: specs
        };
      });
    
    // Calculate total item count
    const itemCount = formattedItems.reduce(
      (total, item) => total + (parseInt(item.quantity) || 1), 0
    );
    
    // Return formatted cart
    return {
      items: formattedItems,
      itemCount: itemCount
    };
  }

module.exports = router;