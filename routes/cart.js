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
            .populate('items.productId');

        if (!cart) {
            return res.status(200).json({
                success: true,
                cart: { items: [], itemCount: 0 }
            });
        }

        const cartItems = cart.items.map(item => ({
            id: item._id,
            productId: item.productId._id,
            name: item.name || item.productId.name,
            price: item.price || item.productId.price,
            image: item.image || (item.productId.images && item.productId.images[0]),
            specs: item.specs || item.productId.specs,
            quantity: item.quantity
        }));

        res.status(200).json({
            success: true,
            cart: {
                items: cartItems,
                itemCount: cart.itemCount
            }
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart'
        });
    }
});

// Add item to cart
router.post('/add', isAuthenticated, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user ? req.user._id : req.guestId;
        
        // Validate product exists and get its details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        // Find or create cart
        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            cart = new Cart({
                userId: userId,
                items: []
            });
        }
        
        // Check if product already in cart
        const itemIndex = cart.items.findIndex(item => 
            item.productId.toString() === productId
        );
        
        if (itemIndex > -1) {
            // Update existing item
            cart.items[itemIndex].quantity += parseInt(quantity);
        } else {
            // Add new item with product details
            cart.items.push({
                productId: productId,
                quantity: parseInt(quantity),
                name: product.name,
                price: product.price,
                image: product.images[0],
                specs: product.specs
            });
        }
        
        await cart.save();
        
        res.status(200).json({
            success: true,
            message: 'Item added to cart',
            cart: {
                items: cart.items,
                itemCount: cart.itemCount
            }
        });
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart'
        });
    }
});

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