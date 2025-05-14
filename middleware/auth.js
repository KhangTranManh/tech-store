// middleware/auth.js - Enhanced version

const passport = require('passport');
const mongoose = require('mongoose');

/**
 * Authentication middleware
 * Checks if the user is authenticated and continues if they are
 */
const isAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // If guest user, assign a guest ID
    if (!req.session.guestId) {
      req.session.guestId = new mongoose.Types.ObjectId();
    }
    
    // If it's an AJAX request
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        redirect: '/login.html' 
      });
    }
    
    // If it's a page request, redirect to login with the original URL as redirect target
    const redirectUrl = encodeURIComponent(req.originalUrl || req.url);
    return res.redirect(`/login.html?redirect=${redirectUrl}`);
  }
  next();
};

/**
 * Middleware to check if the user is an admin
 * More robust implementation with proper error handling
 */
const isAdmin = (req, res, next) => {
  // First check authentication
  if (!req.isAuthenticated()) {
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    return res.redirect('/login.html');
  }
  
  // Then check admin role
  if (!req.user || req.user.role !== 'admin') {
    console.log(`User ${req.user?.email || 'unknown'} attempted to access admin-only resource`);
    
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    return res.redirect('/unauthorized.html');
  }
  
  // User is authenticated and is an admin
  console.log(`Admin access granted to ${req.user.email}`);
  next();
};

/**
 * Middleware to check if a user owns a resource or is an admin
 * Allows admins to access any resource, or users to access their own
 * @param {string} userIdPath - Path to the user ID in the request (e.g., 'params.userId', 'body.userId')
 */
const ownerOrAdmin = (userIdPath) => {
  return (req, res, next) => {
    // First check authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if admin - admins can access everything
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    
    // Get the user ID to check against from the request
    const pathParts = userIdPath.split('.');
    let value = req;
    
    for (const part of pathParts) {
      value = value[part];
      if (value === undefined) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: user ID not found in request'
        });
      }
    }
    
    // Check if user owns the resource
    if (value.toString() === req.user._id.toString()) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: you do not have permission to access this resource'
    });
  };
};

/**
 * Enhanced middleware to restrict access to admin tracking page
 * Combines isAuthenticated and isAdmin with specific tracking functionality
 */
const isTrackingAdmin = (req, res, next) => {
  // First check authentication
  if (!req.isAuthenticated()) {
    console.log('User not authenticated - redirecting to login');
    // Include the original URL for redirect after login
    const redirectUrl = encodeURIComponent(req.originalUrl || req.url);
    return res.redirect(`/login.html?redirect=${redirectUrl}`);
  }
  
  // Then check if user has admin role
  if (req.user && req.user.role === 'admin') {
    console.log(`Admin user ${req.user.email} granted access to tracking page`);
    return next();
  }
  
  console.log(`User ${req.user.email} denied access to admin tracking (role: ${req.user.role || 'undefined'})`);
  
  // Not an admin, handle based on request type
  if (req.xhr || req.path.startsWith('/api/')) {
    // If AJAX/API request
    return res.status(403).json({
      success: false,
      message: 'Admin access required for order tracking management'
    });
  } else {
    // If regular page request, redirect to unauthorized page
    return res.redirect('/unauthorized.html');
  }
};

// Export all middleware
module.exports = {
  isAuthenticated,
  isAdmin,
  ownerOrAdmin,
  isTrackingAdmin
};