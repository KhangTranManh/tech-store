const express = require('express');
const router = express.Router();

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      message: 'Please log in to access orders' 
    });
  }
  next();
};

// Get user's orders
router.get('/', requireLogin, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Orders route is working',
      orders: []
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving orders' 
    });
  }
});

// Create a new order
router.post('/create', requireLogin, async (req, res) => {
  try {
    res.status(201).json({
      success: true,
      message: 'Order creation route is working',
      order: {}
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating order' 
    });
  }
});

module.exports = router;