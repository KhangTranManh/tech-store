// routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Cart = require('../models/cart');
const Address = require('../models/address');
const PaymentMethod = require('../models/payment-method');
const { isAuthenticated } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
// routes/orders.js
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
            subtotal, 
            shipping, 
            tax 
        } = req.body;
        
        // Validate required fields
        if (!items || !addressId || !paymentMethodId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required order information' 
            });
        }
        
        // Verify address belongs to user
        const address = await Address.findOne({ 
            _id: addressId, 
            user: user._id  // Note: changed from userId to match your existing model
        });
        
        if (!address) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid shipping address' 
            });
        }
        
        // Verify payment method belongs to user
        const paymentMethod = await PaymentMethod.findOne({ 
            _id: paymentMethodId, 
            user: user._id  // Note: changed from userId to match your existing model
        });
        
        if (!paymentMethod) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid payment method' 
            });
        }
        
        // Calculate total
        const total = subtotal + shipping + tax;
        
        // Create new order
        const newOrder = new Order({
            user: user._id,  // Note: changed from userId to match your existing model
            items: items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })),
            shippingAddress: addressId,
            paymentMethod: paymentMethodId,
            paymentLast4: paymentMethod.last4,
            subtotal,
            shippingCost: shipping,
            tax,
            total,
            status: 'pending',
            statusHistory: [{
                status: 'pending',
                note: 'Order created'
            }]
        });
        
        // Save order
        await newOrder.save();
        
        // Generate order number
        newOrder.orderNumber = `TS${newOrder._id.toString().slice(-8)}`;
        await newOrder.save();
        
        // Clear user's cart
        const cart = await Cart.findOne({ userId: user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
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
 * @route   GET /api/orders
 * @desc    Get all orders for the current user
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        // Find all orders for the current user
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('shippingAddress')
            .populate('paymentMethod', '-paymentToken');
        
        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get a single order by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        // Find order by ID
        const order = await Order.findById(req.params.id)
            .populate('shippingAddress')
            .populate('paymentMethod', '-paymentToken')
            .populate('items.productId');
        
        // Check if order exists
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Check if order belongs to current user
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this order'
            });
        }
        
        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private
 */
router.post('/:id/cancel', async (req, res) => {
    try {
        // Find order by ID
        const order = await Order.findById(req.params.id);
        
        // Check if order exists
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Check if order belongs to current user
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to cancel this order'
            });
        }
        
        // Check if order can be cancelled
        if (order.status !== 'pending' && order.status !== 'processing') {
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled in ${order.status} status`
            });
        }
        
        // Update order status
        await order.updateStatus('cancelled', req.body.reason || 'Cancelled by customer');
        
        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling order',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/orders/cart/clear
 * @desc    Clear the user's cart
 * @access  Private
 */
router.post('/cart/clear', async (req, res) => {
    try {
        // Find user's cart
        const cart = await Cart.findOne({ userId: req.user._id });
        
        // Check if cart exists
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }
        
        // Clear cart items
        cart.items = [];
        await cart.save();
        
        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
});

module.exports = router;