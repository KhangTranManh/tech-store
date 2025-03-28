// routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const { isAuthenticated } = require('../middleware/auth');

// Middleware to ensure user is authenticated
router.use(isAuthenticated);

/**
 * @route   GET /orders/recent
 * @desc    Get recent orders and count for dashboard
 * @access  Private
 */
router.get('/recent', async (req, res) => {
  try {
    // Get count of all orders for this user
    const totalOrders = await Order.countDocuments({ user: req.user._id });
    
    // Get most recent orders (limit to 3)
    const recentOrders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('items.product', 'name price images')
      .exec();
    
    // Transform recent orders for frontend
    const transformedOrders = recentOrders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        name: item.name || (item.product ? item.product.name : 'Unknown Product'),
        price: item.price,
        quantity: item.quantity,
        image: item.product && item.product.images && item.product.images.length > 0 
          ? item.product.images[0] 
          : '/images/placeholder.jpg'
      }))
    }));
    
    res.status(200).json({
      success: true,
      count: totalOrders,
      orders: transformedOrders
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
 * @route   GET /api/orders
 * @desc    Get all orders for the logged in user
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Base query - filter by user ID
    let query = { user: req.user._id };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      // Search in order number or items names
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Find orders that match the query
    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // Sort by date descending (newest first)
      .populate('items.product', 'name price images') // Populate product details
      .exec();
    
    // Transform orders for frontend
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        name: item.name || (item.product ? item.product.name : 'Unknown Product'),
        price: item.price,
        quantity: item.quantity,
        image: item.product && item.product.images && item.product.images.length > 0 
          ? item.product.images[0] 
          : '/images/placeholder.jpg'
      }))
    }));
    
    res.status(200).json({
      success: true,
      count: transformedOrders.length,
      orders: transformedOrders
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
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .exec();
    
    // Check if order exists
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if the order belongs to the logged in user
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

module.exports = router;