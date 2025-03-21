// routes/auth.js
const express = require('express');
const router = express.Router();

// Mock user database for demo purposes
const users = [
  { id: 1, email: 'user@example.com', password: 'password123', firstName: 'John', lastName: 'Doe' }
];

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find user in our mock database
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Store user in session (excluding password)
    const { password, ...userWithoutPassword } = user;
    req.session.user = userWithoutPassword;
    return res.status(200).json({ 
      success: true, 
      user: userWithoutPassword,
      message: 'Login successful' 
    });
  }
  
  return res.status(401).json({ 
    success: false, 
    message: 'Invalid email or password' 
  });
});

// Register route
router.post('/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  // Check if user already exists
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'User already exists with this email' 
    });
  }
  
  // Create new user
  const newUser = {
    id: users.length + 1,
    email,
    password,
    firstName,
    lastName
  };
  
  // Add to our mock database
  users.push(newUser);
  
  // Store user in session (excluding password)
  const { password: pass, ...userWithoutPassword } = newUser;
  req.session.user = userWithoutPassword;
  
  return res.status(201).json({ 
    success: true, 
    user: userWithoutPassword,
    message: 'Registration successful' 
  });
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.status(200).json({ 
    success: true, 
    message: 'Logout successful' 
  });
});

// Check if user is logged in
router.get('/check', (req, res) => {
  if (req.session.user) {
    return res.status(200).json({ 
      isLoggedIn: true, 
      user: req.session.user 
    });
  }
  
  return res.status(200).json({ isLoggedIn: false });
});

module.exports = router;