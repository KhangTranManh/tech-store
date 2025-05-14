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

// In routes/orders.js - Find your POST /api/orders route and update it

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
            paymentType, // New field for payment type
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
        
        // Create new order
        const newOrder = new Order({
            user: user._id,
            items: items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })),
            shippingAddress: addressId,
            paymentType: paymentType || 'card', // Set payment type
            // Only include paymentMethod if not COD
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
        
        // Save order
        await newOrder.save();
        
        // Generate order number (if your pre-save hook doesn't do this)
        if (!newOrder.orderNumber) {
            newOrder.orderNumber = `TS${newOrder._id.toString().slice(-8)}`;
            await newOrder.save();
        }
        
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
 * @route   GET /api/orders/recent
 * @desc    Get recent orders and order count
 * @access  Private
 */
router.get('/recent', async (req, res) => {
    try {
        // Find recent orders for current user
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('shippingAddress')
            .populate('paymentMethod', '-paymentToken');
        
        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('Error fetching recent orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent orders',
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