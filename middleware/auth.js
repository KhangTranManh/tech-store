// middleware/auth.js
/**
 * Middleware to check if the user is authenticated
 */
exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  };
  
  /**
   * Middleware to check if the user is an admin
   */
  exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  };
  
  /**
   * Middleware to check if a user owns a resource or is an admin
   * Usage: ownerOrAdmin('userId') where 'userId' is the path to the user ID in the request
   */
  exports.ownerOrAdmin = (userIdPath) => {
    return (req, res, next) => {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Check if admin
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Get the user ID to check against from the request
      const pathParts = userIdPath.split('.');
      let value = req;
      
      for (const part of pathParts) {
        if (!value[part]) {
          return res.status(403).json({
            success: false,
            message: 'Access forbidden: user ID not found in request'
          });
        }
        value = value[part];
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