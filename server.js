require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const passport = require('passport');

// Database Connection
const connectDB = require('./db/connection');

// Auth service for passport configuration
const { initializePassport } = require('./services/authService');

// Routes (use optional chaining and error handling)
const safeRequire = (modulePath) => {
  try {
    return require(modulePath);
  } catch (error) {
    console.warn(`Could not load module ${modulePath}:`, error.message);
    return null;
  }
};

const pagesRoutes = require('./routes/pages');
const productRoutes = safeRequire('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = safeRequire('./routes/orders');
const imageRoutes = require('./routes/images');
const addressRoutes = safeRequire('./routes/addresses');
const paymentMethodRoutes = safeRequire('./routes/payment-methods');
const wishlistRoutes = require('./routes/wishlist');
const app = express();
const PORT = process.env.PORT || 3000;
const categoryRoutes = require('./routes/categories');


// Load auth routes with enhanced debugging
let authRoutes;
try {
  authRoutes = require('./routes/auth');
  console.log('Auth routes loaded successfully');
  
  // Debug available routes
  if (authRoutes.stack) {
    console.log('Auth router routes:');
    authRoutes.stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods)
          .filter(method => layer.route.methods[method])
          .join(', ').toUpperCase();
        console.log(`${methods} ${layer.route.path}`);
      }
    });
  } else {
    console.log('Auth router does not have a stack property');
  }
} catch (error) {
  console.error('Error loading auth routes:', error.message, error.stack);
  authRoutes = null;
}

// Connect to Database
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// IMPORTANT: Move middleware order - bodyParser should be before route mounting
// Middleware for request body parsing
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend')));

// Ensure environment variables are set
if (!process.env.SESSION_SECRET || !process.env.MONGODB_URI) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Initialize Passport JS for authentication
initializePassport(app);

// Mount API routes with debugging
app.use('/images', imageRoutes);

// Mount auth routes with more debugging
if (authRoutes) {
  console.log('Mounting auth routes at /auth path');
  app.use('/auth', authRoutes);
} else {
  console.error('Auth routes not available to mount!');
}



// Mount other API routes
if (addressRoutes) {
  console.log('Mounting address routes at /api/addresses');
  app.use('/api/addresses', addressRoutes);
}

if (paymentMethodRoutes) {
  console.log('Mounting payment method routes at /api/payment-methods');
  app.use('/api/payment-methods', paymentMethodRoutes);
}

if (productRoutes) {
  console.log('Mounting product routes at /products');
  app.use('/products', productRoutes);
}

if (orderRoutes) {
  console.log('Mounting order routes at /api/orders');
  app.use('/api/orders', orderRoutes);
}
app.use('/api/wishlist', wishlistRoutes);


if (wishlistRoutes) {
  console.log('Mounting wishlist routes at /api/wishlist');
  app.use('/api/wishlist', wishlistRoutes);
} else {
  console.warn('Wishlist routes not available to mount');
}
app.use('/api/categories', categoryRoutes);

// Serve static HTML pages
const serveStaticPage = (route, filename) => {
  app.get(route, (req, res) => {
    try {
      res.sendFile(path.join(__dirname, 'frontend', 'views', filename));
    } catch (error) {
      console.error(`Error serving ${filename}:`, error);
      res.status(500).send('Error serving page');
    }
  });
};

// Common static page routes
const staticPages = [
  ['/', 'index.html'],
  '/login.html',
  '/register.html',
  '/laptops.html',
  '/gaming-pcs.html',
  '/cart.html',
  '/contact.html',
  '/product-detail.html',
  '/components.html',
  '/monitors.html',
  '/accessories.html',
  '/shipping.html',
  '/returns.html',
  '/faq.html',
  '/orders.html',
  '/track.html',
  '/account.html',
  '/forgot-password.html',
  '/reset-password.html',
  '/account-settings.html',
  '/addresses.html',
  '/payment-methods.html',
  '/checkout.html',
  '/order-details.html',
  '/wishlist.html',
];

staticPages.forEach(page => {
  if (Array.isArray(page)) {
    serveStaticPage(page[0], page[1]);
  } else {
    serveStaticPage(page, page.substring(1));
  }
});

// Authentication status middleware (makes user data available to templates)
app.use((req, res, next) => {
  res.locals.user = req.isAuthenticated() ? req.user : null;
  next();
});

// Add a test route to check if basic routing is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running correctly' });
});

// 404 handler
app.use((req, res, next) => {
  console.log('404 Not Found:', req.method, req.path);
  res.status(404).json({
    message: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV !== 'production' ? err.stack : {}
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`- Static files served from: ${path.join(__dirname, 'frontend')}`);
  console.log(`- Test the server: http://localhost:${PORT}/api/test`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal. Closing server...');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close MongoDB connection
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force close server after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};
app.use('/api/cart', cartRoutes);

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;