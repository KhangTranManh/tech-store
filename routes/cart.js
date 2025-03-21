const express = require('express');
const router = express.Router();

// Middleware to check if user is logged in
const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      message: 'Please log in to access cart' 
    });
  }
  next();
};

// Get cart items
router.get('/', requireLogin, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Cart route is working',
      items: [],
      totalItems: 0,
      totalValue: 0
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving cart' 
    });
  }
});

// Add item to cart
router.post('/add', requireLogin, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Add to cart route is working',
      item: {}
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding item to cart' 
    });
  }
});

module.exports = router;