// file: routes/pages.js
const express = require('express');
const router = express.Router();
const path = require('path');

// Define the path to your views directory
const viewsPath = path.join(__dirname, '../frontend/views');

// Routes for all the pages
router.get('/shipping.html', (req, res) => {
  res.sendFile(path.join(viewsPath, 'shipping.html'));
});

router.get('/returns.html', (req, res) => {
  res.sendFile(path.join(viewsPath, 'returns.html'));
});

router.get('/faq.html', (req, res) => {
  res.sendFile(path.join(viewsPath, 'faq.html'));
});

router.get('/orders.html', (req, res) => {
  res.sendFile(path.join(viewsPath, 'orders.html'));
});

router.get('/track.html', (req, res) => {
  res.sendFile(path.join(viewsPath, 'track.html'));
});

router.get('/account.html', (req, res) => {
  res.sendFile(path.join(viewsPath, 'account.html'));
});

module.exports = router;