const express = require('express');
const router = express.Router();
const User = require('../models/user');
const validator = require('validator');

// Middleware to validate user input
const validateUserInput = (req, res, next) => {
  const { email, password, firstName, lastName } = req.body;

  // Email validation
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid email address' 
    });
  }

  // Password validation
  if (!password || password.length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 6 characters long' 
    });
  }

  // Name validation
  if (!firstName || firstName.length < 2) {
    return res.status(400).json({ 
      success: false, 
      message: 'First name must be at least 2 characters long' 
    });
  }

  if (!lastName || lastName.length < 2) {
    return res.status(400).json({ 
      success: false, 
      message: 'Last name must be at least 2 characters long' 
    });
  }

  next();
};

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Store user in session
    req.session.userId = user._id;
    req.session.userRole = user.role;

    // Prepare user response (exclude sensitive data)
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    };

    res.status(200).json({ 
      success: true, 
      user: userResponse,
      message: 'Login successful' 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Register route
router.post('/register', validateUserInput, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, isSubscribed } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email' 
      });
    }

    // Create new user
    const newUser = new User({
      email,
      password,
      firstName,
      lastName,
      phone: phone || '',
      isSubscribed: isSubscribed || false
    });

    // Save user to database
    await newUser.save();

    // Store user in session
    req.session.userId = newUser._id;
    req.session.userRole = newUser.role;

    // Prepare user response (exclude sensitive data)
    const userResponse = {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role
    };

    res.status(201).json({ 
      success: true, 
      user: userResponse,
      message: 'Registration successful' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: errors[0] 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Could not log out' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Logout successful' 
    });
  });
});

// Check authentication status
router.get('/check', (req, res) => {
  if (req.session.userId) {
    return res.status(200).json({ 
      isLoggedIn: true, 
      userId: req.session.userId,
      userRole: req.session.userRole
    });
  }
  
  return res.status(200).json({ isLoggedIn: false });
});

module.exports = router;