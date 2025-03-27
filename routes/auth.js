const express = require('express');
const router = express.Router();
const passport = require('passport');
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

// Local login route
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Server error during login' 
      });
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: info.message || 'Invalid email or password' 
      });
    }
    
    // Log in the user
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Server error during login' 
        });
      }
      
      // Prepare user response (exclude sensitive data)
      const userResponse = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      };
  
      return res.status(200).json({ 
        success: true, 
        user: userResponse,
        message: 'Login successful' 
      });
    });
  })(req, res, next);
});

// Google Auth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/');
  }
);

// Facebook Auth Routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/');
  }
);

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

    // Log in the new user
    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Server error after registration' 
        });
      }
      
      // Prepare user response (exclude sensitive data)
      const userResponse = {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role
      };
  
      return res.status(201).json({ 
        success: true, 
        user: userResponse,
        message: 'Registration successful' 
      });
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
  req.logout(function(err) {
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
  if (req.isAuthenticated()) {
    return res.status(200).json({ 
      isLoggedIn: true, 
      userId: req.user._id,
      userRole: req.user.role
    });
  }
  
  return res.status(200).json({ isLoggedIn: false });
});

module.exports = router;