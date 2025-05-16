// routes/tracking.js
const express = require('express');
const router = express.Router();
const Order = require('../models/order');

// In routes/tracking.js - Update the tracking api endpoint
router.get('/api/tracking', async (req, res) => {
  try {
    const { orderNumber, email } = req.query;
    
    if (!orderNumber || !email) {
      return res.status(400).json({
        success: false,
        message: 'Order number and email are required'
      });
    }
    
    console.log(`Tracking request for order: ${orderNumber}, email: ${email}`);
    
    // Create a flexible query to handle different order number formats
    const order = await Order.findOne({
      $or: [
        { orderNumber: orderNumber },
        { orderNumber: { $regex: new RegExp(orderNumber.replace(/[^a-zA-Z0-9]/g, ''), 'i') }},
        // Try alternative formats
        { orderNumber: orderNumber.startsWith('ORD-') ? 
            orderNumber.replace('ORD-', 'TS') : 
            (orderNumber.startsWith('TS') ? 
              'ORD-' + orderNumber.substring(2).slice(0, 6) + '-' + orderNumber.substring(2).slice(6) : 
              orderNumber)
        }
      ]
    }).populate('user', 'email firstName lastName')
      .populate('shippingAddress');
    
    console.log(`Order found: ${order ? 'Yes' : 'No'}`);
    if (order) {
      console.log(`Found order number: ${order.orderNumber}, user email: ${order.user?.email}`);
    }
    
    // Check if order exists and email matches
    if (!order || !order.user || order.user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or email does not match'
      });
    }
    
    // Sort tracking steps by date
    let sortedTracking = [];
    if (order.tracking && order.tracking.length > 0) {
      sortedTracking = [...order.tracking].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
    }
    
    // Check if delivered (for special handling)
    const isDelivered = order.tracking?.some(step => 
      step.status && step.status.toLowerCase() === 'delivered'
    );
    
    // Return tracking information
    res.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        status: order.status,
        paymentMethod: order.paymentType === 'cod' ? 'Cash on Delivery' : 
                      `Credit Card (${order.paymentLast4 ? '****' + order.paymentLast4 : ''})`,
        shippingAddress: order.shippingAddress,
        estimatedDelivery: order.estimatedDelivery || calculateEstimatedDelivery(order),
        tracking: sortedTracking,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier || 'Standard Shipping',
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          image: item.image || '/images/placeholder.jpg'
        })),
        isDelivered: isDelivered // Add this flag for the frontend
      }
    });
    
  } catch (error) {
    console.error('Error fetching tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tracking information'
    });
  }
});

// Helper function to calculate estimated delivery
function calculateEstimatedDelivery(order) {
  // If order has a specific estimated delivery date, use that
  if (order.estimatedDelivery) {
    return order.estimatedDelivery;
  }
  
  // Otherwise calculate based on order date and shipping method
  const orderDate = new Date(order.createdAt);
  const estimatedDeliveryDate = new Date(orderDate);
  
  switch(order.shippingMethod) {
    case 'express':
      estimatedDeliveryDate.setDate(orderDate.getDate() + 3);
      break;
    case 'priority':
      estimatedDeliveryDate.setDate(orderDate.getDate() + 5);
      break;
    default: // standard
      estimatedDeliveryDate.setDate(orderDate.getDate() + 7);
  }
  
  return estimatedDeliveryDate;
}

module.exports = router;