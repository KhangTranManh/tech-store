require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

// Database Connection
const connectDB = require('./db/connection');

// Routes (use optional chaining and error handling)
const safeRequire = (modulePath) => {
  try {
    return require(modulePath);
  } catch (error) {
    console.warn(`Could not load module ${modulePath}:`, error.message);
    return null;
  }
};

const authRoutes = safeRequire('./routes/auth');
const productRoutes = safeRequire('./routes/products');
const cartRoutes = safeRequire('./routes/cart');
const orderRoutes = safeRequire('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Middleware
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
    collectionName: 'sessions',
    autoRemove: 'interval',
    autoRemoveInterval: 10 // in minutes
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true
  }
}));

// Conditionally add routes if modules exist
if (authRoutes) app.use('/auth', authRoutes);
if (productRoutes) app.use('/products', productRoutes);
if (cartRoutes) app.use('/cart', cartRoutes);
if (orderRoutes) app.use('/orders', orderRoutes);

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
  '/cart.html',
  '/contact.html',
  '/product-detail.html'
];

staticPages.forEach(page => {
  if (Array.isArray(page)) {
    serveStaticPage(page[0], page[1]);
  } else {
    serveStaticPage(page, page.substring(1));
  }
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Not Found',
    path: req.path
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

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;