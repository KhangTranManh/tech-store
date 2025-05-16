// routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Cart = require('../models/cart');
const Address = require('../models/address');
const PaymentMethod = require('../models/payment-method');
const { isAuthenticated } = require('../middleware/auth');

// routes/orders.js - Update the POST route for order creation

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
        // Get user ID from authenticated session
        const userId = req.user._id;
        
        console.log(`Fetching orders for user ID: ${userId}`);
        
        // Add query parameters support
        const { status, search } = req.query;
        
        // Build filter object
        const filter = { user: userId };
        
        // Add status filter if provided
        if (status && status !== 'all') {
            filter.status = status.toLowerCase();
        }
        
        // Add search filter if provided
        if (search) {
            // Create regex for case-insensitive search
            const searchRegex = new RegExp(search, 'i');
            
            // Search in order number and item names
            filter.$or = [
                { orderNumber: searchRegex },
                { 'items.name': searchRegex }
            ];
        }
        
        // Find all orders for the current user with filters
        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .populate('shippingAddress')
            .populate('paymentMethod', '-paymentToken');
        
        // Log how many orders were found
        console.log(`Found ${orders.length} orders for user ${userId}`);
        
        // Transform orders to ensure consistent order number format
        const formattedOrders = orders.map(order => {
            const orderObj = order.toObject();
            
            // Ensure order number is in correct format
            if (orderObj.orderNumber && !orderObj.orderNumber.startsWith('ORD-')) {
                // Convert TS format to ORD- format if needed
                if (orderObj.orderNumber.startsWith('TS')) {
                    const idPart = orderObj.orderNumber.replace('TS', '');
                    const sixDigits = idPart.length > 6 ? idPart.slice(0, 6) : idPart.padStart(6, '0');
                    const fourDigits = idPart.length > 6 ? idPart.slice(6) : '0000';
                    orderObj.orderNumber = `ORD-${sixDigits}-${fourDigits}`;
                }
            }
            
            return orderObj;
        });
        
        res.status(200).json({
            success: true,
            count: formattedOrders.length,
            orders: formattedOrders
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
        const orderId = req.params.id;
        const userId = req.user._id;
        
        console.log(`Fetching order ${orderId} for user ${userId}`);
        
        // Find order by ID
        const order = await Order.findById(orderId)
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
        if (order.user.toString() !== userId.toString()) {
            console.log(`User ${userId} attempted to access order ${orderId} which belongs to user ${order.user}`);
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this order'
            });
        }
        
        // Convert to plain object to modify
        const orderObj = order.toObject();
        
        // Ensure order number is in correct format
        if (orderObj.orderNumber && !orderObj.orderNumber.startsWith('ORD-')) {
            // Convert TS format to ORD- format if needed
            if (orderObj.orderNumber.startsWith('TS')) {
                const idPart = orderObj.orderNumber.replace('TS', '');
                const sixDigits = idPart.length > 6 ? idPart.slice(0, 6) : idPart.padStart(6, '0');
                const fourDigits = idPart.length > 6 ? idPart.slice(6) : '0000';
                orderObj.orderNumber = `ORD-${sixDigits}-${fourDigits}`;
            }
        }
        
        res.status(200).json({
            success: true,
            order: orderObj
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