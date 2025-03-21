// server.js - Main server file for TechStore
const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(session({
  secret: 'techstore-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// Set up routes
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);

// Serve static HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'views', 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'views', 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'views', 'register.html'));
});

app.get('/laptops.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'views', 'laptops.html'));
});

app.get('/cart.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'views', 'cart.html'));
});

app.get('/contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'views', 'contact.html'));
});

app.get('/product-detail.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'views', 'product-detail.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'views', 'index.html'));
});

// Also add a more general route to handle any HTML file request
app.get('/:page.html', (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, 'frontend', 'views', `${page}.html`);
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Page not found');
  }
});