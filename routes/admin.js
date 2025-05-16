// routes/admin.js - Comprehensive admin functionality

const express = require('express');
const router = express.Router();
const path = require('path');
const { isAuthenticated, isAdmin, isTrackingAdmin } = require('../middleware/auth');
const Order = require('../models/order');
const User = require('../models/user');

/**
 * Admin Dashboard Routes
 */

// Protected route for admin dashboard
router.get('/admin-dashboard.html', isAuthenticated, isAdmin, (req, res) => {
  const filePath = path.join(__dirname, '../frontend/views/admin-dashboard.html');
  res.sendFile(filePath);
});

// Protected route for admin orders page
router.get('/admin-orders.html', isAuthenticated, isAdmin, (req, res) => {
  const filePath = path.join(__dirname, '../frontend/views/admin-orders.html');
  res.sendFile(filePath);
});

// Protected route for the admin tracking page
router.get('/admin-tracking.html', isAuthenticated, isTrackingAdmin, (req, res) => {
  const filePath = path.join(__dirname, '../frontend/views/admin-tracking.html');
  console.log(`Admin user accessing tracking page: ${req.user.email}`);
  res.sendFile(filePath);
});

// Add this to your admin.js file - this is the route you're trying to access
router.get('/admintrack.html', isAuthenticated, isTrackingAdmin, (req, res) => {
    // This should point to wherever your admin tracking HTML file actually is
    const filePath = path.join(__dirname, '../frontend/views/admintrack.html');
    
    console.log(`Admin user accessing tracking page: ${req.user.email}`);
    console.log(`Looking for file at: ${filePath}`);
    
    // Check if file exists
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      console.error(`File not found: ${filePath}`);
      res.status(404).send('Admin tracking page not found. Check server logs.');
    }
  });
/**
 * Admin API Endpoints
 */

// Get dashboard stats
router.get('/api/admin/dashboard', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get order stats
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const shippedOrders = await Order.countDocuments({ status: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email');
    
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get revenue stats (assuming you want this month's revenue)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const orderThisMonth = await Order.find({
      createdAt: { $gte: firstDayOfMonth },
      status: { $ne: 'cancelled' }
    });
    
    const revenueThisMonth = orderThisMonth.reduce((sum, order) => sum + order.total, 0);
    
    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        totalUsers,
        revenueThisMonth
      },
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
});

/**
 * Admin Order Management Endpoints
 */

// Get all orders with advanced filtering options
router.get('/api/admin/orders', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Query params for filtering
    const { 
      status, 
      userId, 
      search, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Filter by user
    if (userId) {
      filter.user = userId;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set time to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateTime;
      }
    }
    
    // Search by order number, customer email, or name
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search, 'i');
      
      // First try to find users that match the search
      const users = await User.find({
        $or: [
          { email: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex }
        ]
      }).select('_id');
      
      const userIds = users.map(user => user._id);
      
      filter.$or = [
        { orderNumber: searchRegex },
        { user: { $in: userIds } }
      ];
    }
    
    // Set up pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Set up sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortDir === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Order.countDocuments(filter);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get a specific order with full details
router.get('/api/admin/orders/:orderId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email')
      .populate('shippingAddress')
      .populate('items.productId', 'name price images');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
});

// Update order status
router.put('/api/admin/orders/:orderId/status', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Update status with note
    await order.updateStatus(status, note || `Status updated to ${status} by admin`);
    
    // If order is being marked as shipped and tracking info is provided
    if (status === 'shipped' && req.body.trackingNumber) {
      order.trackingNumber = req.body.trackingNumber;
      order.carrier = req.body.carrier || 'Standard Shipping';
      
      // Add tracking update if tracking array exists
      if (Array.isArray(order.tracking)) {
        order.tracking.push({
          status: 'Shipped',
          description: note || 'Your order has been shipped',
          timestamp: new Date(),
          carrier: req.body.carrier || 'Standard Shipping',
          location: req.body.location || 'Warehouse',
          updatedBy: req.user._id
        });
      }
      
      await order.save();
    }
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

/**
 * Admin Order Tracking Endpoints
 */

// Add a new tracking update
router.post('/api/admin/orders/:orderId/tracking', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, location, description, timestamp, carrier, notify } = req.body;
    
    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required for tracking update'
      });
    }
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Initialize tracking array if it doesn't exist
    if (!Array.isArray(order.tracking)) {
      order.tracking = [];
    }
    
    // Create new tracking entry
    const newTracking = {
      status,
      location,
      description,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      carrier,
      updatedBy: req.user._id
    };
    
    order.tracking.push(newTracking);
    
    // Update order status based on tracking status
    // Map tracking statuses to order statuses
    const statusMap = {
      'Order Placed': 'pending',
      'Order Processed': 'processing',
      'Shipped': 'shipped',
      'In Transit': 'shipped',
      'Out for Delivery': 'shipped',
      'Delivered': 'delivered'
    };
    
    if (statusMap[status]) {
      order.status = statusMap[status];
      
      // Also update status history for consistency
      order.statusHistory.push({
        status: statusMap[status],
        timestamp: newTracking.timestamp,
        note: `Status updated to ${statusMap[status]} via tracking update`
      });
    }
    
    // Save tracking number if provided
    if (req.body.trackingNumber) {
      order.trackingNumber = req.body.trackingNumber;
    }
    
    await order.save();
    
    // Send notification email if requested
    if (notify && order.user && order.user.email) {
      try {
        // This will need to be adapted to your email service
        const emailService = require('../services/emailService');
        
        await emailService.sendTrackingUpdate({
          email: order.user.email,
          orderId: order._id,
          orderNumber: order.orderNumber || order._id,
          status,
          description,
          trackingUrl: `/track.html?order=${order._id}`
        });
        
        console.log(`Tracking update email sent to ${order.user.email}`);
      } catch (emailError) {
        console.error('Error sending tracking update email:', emailError);
        // Continue anyway as this is optional
      }
    }
    
    res.json({
      success: true,
      message: 'Tracking update added successfully',
      data: order
    });
  } catch (error) {
    console.error('Error adding tracking update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add tracking update',
      error: error.message
    });
  }
});

// Update an existing tracking entry
router.put('/api/admin/orders/:orderId/tracking/:trackingId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { orderId, trackingId } = req.params;
    const { status, location, description, timestamp, carrier } = req.body;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if tracking array exists
    if (!Array.isArray(order.tracking)) {
      return res.status(404).json({
        success: false,
        message: 'No tracking information found for this order'
      });
    }
    
    // Find the tracking entry
    const trackingIndex = order.tracking.findIndex(
      t => t._id.toString() === trackingId
    );
    
    if (trackingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tracking entry not found'
      });
    }
    
    // Update tracking entry fields
    if (status) order.tracking[trackingIndex].status = status;
    if (location) order.tracking[trackingIndex].location = location;
    if (description) order.tracking[trackingIndex].description = description;
    if (timestamp) order.tracking[trackingIndex].timestamp = new Date(timestamp);
    if (carrier) order.tracking[trackingIndex].carrier = carrier;
    
    // Set last updated info
    order.tracking[trackingIndex].lastUpdated = new Date();
    order.tracking[trackingIndex].updatedBy = req.user._id;
    
    // Check if this is the latest entry (by timestamp) and update order status if needed
    const sortedTracking = [...order.tracking].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    const latestEntry = sortedTracking[0];
    if (latestEntry && latestEntry._id.toString() === trackingId && status) {
      // Map tracking statuses to order statuses
      const statusMap = {
        'Order Placed': 'pending',
        'Order Processed': 'processing',
        'Shipped': 'shipped',
        'In Transit': 'shipped',
        'Out for Delivery': 'shipped',
        'Delivered': 'delivered'
      };
      
      if (statusMap[status]) {
        order.status = statusMap[status];
        
        // Also update status history for consistency
        order.statusHistory.push({
          status: statusMap[status],
          timestamp: new Date(),
          note: `Status updated to ${statusMap[status]} via tracking update`
        });
      }
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Tracking entry updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating tracking entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tracking entry',
      error: error.message
    });
  }
});
router.get('/api/admin/orders', isAuthenticated, isTrackingAdmin, async (req, res) => {
    try {
      const Order = require('../models/order');
      
      // This should fetch ALL orders without any user-specific filtering
      const orders = await Order.find()
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(20);
      
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
        error: error.message
      });
    }
  });

// Delete a tracking entry
router.delete('/api/admin/orders/:orderId/tracking/:trackingId', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { orderId, trackingId } = req.params;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if tracking array exists
    if (!Array.isArray(order.tracking)) {
      return res.status(404).json({
        success: false,
        message: 'No tracking information found for this order'
      });
    }
    
    // Find the tracking entry
    const trackingIndex = order.tracking.findIndex(
      t => t._id.toString() === trackingId
    );
    
    if (trackingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Tracking entry not found'
      });
    }
    
    // Remove the tracking entry
    order.tracking.splice(trackingIndex, 1);
    
    // Update order status if needed
    if (order.tracking.length > 0) {
      // Sort tracking by timestamp to find the latest
      const latestEntry = [...order.tracking].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
      
      // Map tracking statuses to order statuses
      const statusMap = {
        'Order Placed': 'pending',
        'Order Processed': 'processing',
        'Shipped': 'shipped',
        'In Transit': 'shipped',
        'Out for Delivery': 'shipped',
        'Delivered': 'delivered'
      };
      
      if (latestEntry && latestEntry.status && statusMap[latestEntry.status]) {
        order.status = statusMap[latestEntry.status];
      }
    } else {
      // If no tracking entries, set to pending
      order.status = 'pending';
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Tracking entry deleted successfully',
      data: order
    });
  } catch (error) {
    console.error('Error deleting tracking entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tracking entry',
      error: error.message
    });
  }
});
// Add this to your tracking.js file temporarily (remove in production)
router.get('/api/debug-orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .select('orderNumber user createdAt')
      .populate('user', 'email')
      .limit(20);
    
    const orderList = orders.map(order => ({
      id: order._id,
      orderNumber: order.orderNumber,
      email: order.user?.email,
      date: order.createdAt
    }));
    
    res.json({
      count: orderList.length,
      orders: orderList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;