// routes/cart.js
const express = require('express');
const router = express.Router();

// Get cart items from session
router.get('/', (req, res) => {
  // Initialize cart if it doesn't exist
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  res.status(200).json({ 
    items: req.session.cart,
    totalItems: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    subtotal: req.session.cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  });
});

// Add item to cart
router.post('/add', (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  // Validate product ID and quantity
  if (!productId || quantity < 1) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid product ID or quantity' 
    });
  }
  
  // Initialize cart if it doesn't exist
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  // Check if item is already in cart
  const existingItemIndex = req.session.cart.findIndex(item => item.productId === productId);
  
  if (existingItemIndex !== -1) {
    // Update quantity if item exists
    req.session.cart[existingItemIndex].quantity += quantity;
  } else {
    // Add new item if it doesn't exist
    // Normally you would fetch product details from database
    // This is simplified for demo purposes using product ID
    req.session.cart.push({
      productId,
      quantity,
      price: req.body.price, // In a real app, you'd get this from the database
      name: req.body.name
    });
  }
  
  res.status(200).json({ 
    success: true, 
    message: 'Item added to cart',
    items: req.session.cart,
    totalItems: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    subtotal: req.session.cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  });
});

// Update item quantity
router.put('/update', (req, res) => {
  const { productId, quantity } = req.body;
  
  // Validate input
  if (!productId || !quantity) {
    return res.status(400).json({ 
      success: false, 
      message: 'Product ID and quantity are required' 
    });
  }
  
  // Ensure cart exists
  if (!req.session.cart) {
    return res.status(404).json({ 
      success: false, 
      message: 'Cart is empty' 
    });
  }
  
  // Find the item
  const itemIndex = req.session.cart.findIndex(item => item.productId === productId);
  
  if (itemIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      message: 'Item not found in cart' 
    });
  }
  
  // Update quantity or remove if quantity is 0
  if (quantity > 0) {
    req.session.cart[itemIndex].quantity = quantity;
  } else {
    req.session.cart.splice(itemIndex, 1);
  }
  
  res.status(200).json({ 
    success: true, 
    message: quantity > 0 ? 'Item quantity updated' : 'Item removed from cart',
    items: req.session.cart,
    totalItems: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    subtotal: req.session.cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  });
});

// Remove item from cart
router.delete('/remove/:productId', (req, res) => {
  const { productId } = req.params;
  
  // Ensure cart exists
  if (!req.session.cart) {
    return res.status(404).json({ 
      success: false, 
      message: 'Cart is empty' 
    });
  }
  
  // Filter out the item
  req.session.cart = req.session.cart.filter(item => item.productId !== productId);
  
  res.status(200).json({ 
    success: true, 
    message: 'Item removed from cart',
    items: req.session.cart,
    totalItems: req.session.cart.reduce((total, item) => total + item.quantity, 0),
    subtotal: req.session.cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  });
});

// Clear cart
router.delete('/clear', (req, res) => {
  req.session.cart = [];
  
  res.status(200).json({ 
    success: true, 
    message: 'Cart cleared',
    items: [],
    totalItems: 0,
    subtotal: 0
  });
});

module.exports = router;