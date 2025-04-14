// middleware/auth.js
const passport = require('passport');

/**
 * Middleware to check if the user is authenticated
 */
// middleware/auth.js
const isAuthenticated = (req, res, next) => {
  // Allow guest cart operations
  if (!req.user) {
    // Create a guest user ID if none exists
    if (!req.session.guestId) {
      req.session.guestId = new mongoose.Types.ObjectId();
    }
    req.guestId = req.session.guestId;
  }
  next();
};

/**
 * Middleware to check if the user is an admin
 */
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    // Assuming user role is stored in req.user.role
    if (req.user && req.user.role === 'admin') {
      return next();
    }
  }
  
  return res.status(403).json({
    success: false,
    message: 'Admin access required'
  });
};

/**
 * Middleware to check if a user owns a resource or is an admin
 * @param {string} userIdPath - Path to the user ID in the request
 */
const ownerOrAdmin = (userIdPath) => {
  return (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Check if admin
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

module.exports = {
  isAuthenticated,
  isAdmin,
  ownerOrAdmin
};