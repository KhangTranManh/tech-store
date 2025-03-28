const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Cart = require('../models/cart'); // Add this import
const validator = require('validator');
const axios = require('axios'); // Add this for making internal requests

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

// Function to transfer guest cart to user cart
async function transferGuestCart(req) {
  try {
    // Only proceed if there's a guest ID in the session
    if (!req.session.guestId) {
      return;
    }

    console.log(`Transferring guest cart (${req.session.guestId}) to user (${req.user._id})`);

    // Find guest cart
    const guestCart = await Cart.findOne({ userId: req.session.guestId });
    
    if (!guestCart || guestCart.items.length === 0) {
      console.log('No guest cart found or cart is empty');
      return;
    }

    // Find or create user cart
    let userCart = await Cart.findOne({ userId: req.user._id });
    if (!userCart) {
      userCart = new Cart({
        userId: req.user._id,
        items: []
      });
    }

    // Transfer items from guest cart to user cart
    guestCart.items.forEach(item => {
      const existingItemIndex = userCart.items.findIndex(
        userItem => userItem.productId.toString() === item.productId.toString()
      );
      
      if (existingItemIndex > -1) {
        // If item exists in user cart, update quantity
        userCart.items[existingItemIndex].quantity += item.quantity;
      } else {
        // If not, add the item
        userCart.items.push({
          productId: item.productId,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
          image: item.image,
          specs: item.specs
        });
      }
    });

    // Save user cart
    await userCart.save();
    
    // Delete guest cart
    await Cart.findByIdAndDelete(guestCart._id);
    
    // Clear guest ID from session
    delete req.session.guestId;
    
    console.log('Cart transfer successful');
  } catch (error) {
    console.error('Error transferring cart:', error);
  }
}

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
    req.login(user, async (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Server error during login' 
        });
      }
      
      // Transfer guest cart to user cart if exists
      await transferGuestCart(req);
      
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
  async (req, res) => {
    // Transfer guest cart after successful social authentication
    await transferGuestCart(req);
    // Successful authentication
    res.redirect('/');
  }
);

// Facebook Auth Routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  async (req, res) => {
    // Transfer guest cart after successful social authentication
    await transferGuestCart(req);
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
    req.login(newUser, async (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Server error after registration' 
        });
      }
      
      // Transfer guest cart to user cart if exists
      await transferGuestCart(req);
      
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

// Get user profile
router.get('/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  
  // Return user data (exclude sensitive fields)
  res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar
    }
  });
});
// Add these routes to your auth.js file

const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure nodemailer (you'll need to set up your email credentials in .env)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Forgot password route - sends reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security reasons, still return success even if email doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    // Generate reset token
    const token = crypto.randomBytes(20).toString('hex');
    
    // Set token and expiration (1 hour)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${token}`;
    
    // Send email
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_FROM || 'noreply@techstore.com',
      subject: 'TechStore Password Reset',
      html: `
        <p>Hello ${user.firstName},</p>
        <p>You requested a password reset for your TechStore account.</p>
        <p>Please click the link below to reset your password. This link will expire in 1 hour.</p>
        <p><a href="${resetUrl}">Reset Your Password</a></p>
        <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        <p>Best regards,<br>The TechStore Team</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending password reset email'
    });
  }
});

// Reset password route - processes the reset
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }
    
    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Set new password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    // Send confirmation email
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_FROM || 'noreply@techstore.com',
      subject: 'Your password has been changed',
      html: `
        <p>Hello ${user.firstName},</p>
        <p>This is a confirmation that the password for your TechStore account has just been changed.</p>
        <p>If you did not request this change, please contact our support team immediately.</p>
        <p>Best regards,<br>The TechStore Team</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: 'Password has been reset'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
});

module.exports = router;