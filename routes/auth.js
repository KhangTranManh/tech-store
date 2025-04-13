const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const { transporter } = require('../services/authService');
const passport = require('passport');


// Debug middleware
router.use((req, res, next) => {
    console.log('Auth route accessed:', req.method, req.path);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    next();
});

// In auth.js, modify the forgot-password route:
router.post('/forgot-password', async (req, res) => {
  console.log('=== FORGOT PASSWORD ROUTE HIT ===');
  try {
      const { email } = req.body;
      
      console.log('Received email:', email);
      
      if (!email) {
          console.log('No email provided');
          return res.status(400).json({
              success: false,
              message: 'Email is required'
          });
      }
      
      // Find user by email
      const user = await User.findOne({ email });
      
      if (!user) {
          console.log('No user found with email:', email);
          // For security reasons, still return success
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
      
      console.log('Password reset token generated:', token);
      
      // Create reset URL
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
      
      // Create email content
      const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: 'Password Reset Request',
          html: `
              <p>Hello ${user.firstName},</p>
              <p>You requested a password reset. Please click the link below to reset your password:</p>
              <p><a href="${resetUrl}">Reset Your Password</a></p>
              <p>This link will expire in 1 hour.</p>
              <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          `
      };
      
      // Send email
      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent to:', user.email);
      
      res.status(200).json({
          success: true,
          message: 'Password reset email sent'
      });
  } catch (error) {
      console.error('Detailed Forgot Password Error:', error);
      res.status(500).json({
          success: false,
          message: 'Error sending password reset email',
          errorDetails: error.message
      });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }
    
    // Find user with this reset token
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
    
    // Set the new password (it will be hashed by the pre-save hook)
    user.password = password;
    
    // Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password',
      error: error.message
    });
  }
});
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
  router.get('/user', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role
      }
    });
  });
  // Local Login Route
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'An error occurred during login' 
        });
      }
  
      if (!user) {
        // Authentication failed
        return res.status(401).json({ 
          success: false, 
          message: info.message || 'Invalid credentials' 
        });
      }
  
      // Use req.login to establish a login session
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Session login error:', loginErr);
          return res.status(500).json({ 
            success: false, 
            message: 'Error establishing session' 
          });
        }
  
        // Prepare user data to send back (exclude sensitive information)
        const userData = {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        };
  
        // Send successful login response
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: userData
        });
      });
    })(req, res, next);
  });
  
  // Add logout route
  router.post('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error during logout' 
        });
      }
      res.status(200).json({ 
        success: true, 
        message: 'Logged out successfully' 
      });
    });
  });
  // Add this to your auth router file
router.post('/register', async (req, res) => {
    try {
      console.log('Registration attempt:', req.body);
      
      const { firstName, lastName, email, password, isSubscribed } = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered'
        });
      }
      
      // Create new user
      const newUser = new User({
        firstName,
        lastName,
        email,
        password, // This will be hashed by your pre-save hook
        isSubscribed
      });
      
      await newUser.save();
      
      // Automatically log in the user after registration
      req.login(newUser, (err) => {
        if (err) {
          console.error('Auto-login error:', err);
          return res.status(200).json({
            success: true,
            message: 'Registration successful, please log in',
          });
        }
        
        return res.status(201).json({
          success: true,
          message: 'Registration successful',
          user: {
            _id: newUser._id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.role
          }
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during registration',
        error: error.message
      });
    }
  });
  // Add these routes to your existing auth.js file

// Update user profile information
router.post('/profile/update', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      const { firstName, lastName, email, phone } = req.body;
      
      // Basic validation
      if (!firstName || !lastName || !email) {
        return res.status(400).json({
          success: false,
          message: 'Required fields missing'
        });
      }
      
      // Check if email already exists for another user
      if (email !== req.user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email address is already in use'
          });
        }
      }
      
      // Update user profile
      const user = await User.findById(req.user._id);
      
      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
      user.phone = phone || user.phone; // Keep existing phone if not provided
      
      await user.save();
      
      // Return success with updated user (excluding sensitive info)
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isSubscribed: user.isSubscribed,
          preferences: user.preferences,
          security: user.security
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: error.message
      });
    }
  });
  
  // Change password
  router.post('/password/change', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // Check if required fields are present
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }
      
      // Get user with password
      const user = await User.findById(req.user._id).select('+password');
      
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      
      // Validate new password
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
        });
      }
      
      // Check if new password is different from current
      const isSamePassword = await user.comparePassword(newPassword);
      
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'New password must be different from current password'
        });
      }
      
      // Update password
      user.password = newPassword;
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Password change error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error changing password',
        error: error.message
      });
    }
  });
  
  // Update user preferences
  router.post('/preferences/update', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      const { preferences } = req.body;
      
      // Update user preferences
      const user = await User.findById(req.user._id);
      
      // Initialize preferences object if it doesn't exist
      if (!user.preferences) {
        user.preferences = {};
      }
      
      // Update preference fields
      if (preferences) {
        user.preferences = {
          ...user.preferences,
          ...preferences
        };
      }
      
      // Update newsletter subscription
      if (preferences && preferences.newsletter !== undefined) {
        user.isSubscribed = preferences.newsletter;
      }
      
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isSubscribed: user.isSubscribed,
          preferences: user.preferences,
          security: user.security
        }
      });
    } catch (error) {
      console.error('Preferences update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating preferences',
        error: error.message
      });
    }
  });
  
  // Update security settings
  router.post('/security/update', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      const { security } = req.body;
      
      // Validate 2FA settings if enabled
      if (security.twoFactorEnabled && !security.twoFactorPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for two-factor authentication'
        });
      }
      
      // Update user security settings
      const user = await User.findById(req.user._id);
      
      // Initialize security object if it doesn't exist
      if (!user.security) {
        user.security = {};
      }
      
      // Update security fields
      if (security) {
        user.security = {
          ...user.security,
          ...security
        };
      }
      
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Security settings updated successfully',
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isSubscribed: user.isSubscribed,
          preferences: user.preferences,
          security: user.security
        }
      });
    } catch (error) {
      console.error('Security settings update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating security settings',
        error: error.message
      });
    }
  });
  
  // Logout from all devices
  router.post('/logout-all', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      // Get user ID
      const userId = req.user._id;
      
      // Find all sessions in the database
      const MongoStore = require('connect-mongo');
      const store = MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
      });
      
      // Generate a unique token to invalidate all sessions
      const user = await User.findById(userId);
      user.security = user.security || {};
      user.security.sessionToken = crypto.randomBytes(16).toString('hex');
      await user.save();
      
      // Destroy current session
      req.logout((err) => {
        if (err) {
          console.error('Error during logout:', err);
          return res.status(500).json({
            success: false,
            message: 'Error logging out'
          });
        }
        
        return res.status(200).json({
          success: true,
          message: 'Logged out from all devices successfully'
        });
      });
    } catch (error) {
      console.error('Logout from all devices error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error logging out from all devices',
        error: error.message
      });
    }
  });
  
  // Delete account
  router.post('/account/delete', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      const { email } = req.body;
      
      // Verify email matches the current user
      if (email !== req.user.email) {
        return res.status(400).json({
          success: false,
          message: 'Email address does not match your account'
        });
      }
      
      // Get user ID before logout
      const userId = req.user._id;
      
      // Log the user out first
      req.logout(async (err) => {
        if (err) {
          console.error('Error during logout for account deletion:', err);
          return res.status(500).json({
            success: false,
            message: 'Error during account deletion process'
          });
        }
        
        try {
          // Delete user account
          await User.findByIdAndDelete(userId);
          
          // If you have related data (like orders, cart items, etc.), you might want to delete them here too
          // Example: await Order.deleteMany({ user: userId });
          
          return res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
          });
        } catch (deleteError) {
          console.error('Error deleting account:', deleteError);
          return res.status(500).json({
            success: false,
            message: 'Error deleting account',
            error: deleteError.message
          });
        }
      });
    } catch (error) {
      console.error('Account deletion error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting account',
        error: error.message
      });
    }
  });
  
  
module.exports = router;