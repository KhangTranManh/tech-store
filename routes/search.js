/**
 * Search API route for TechStore
 * Handles product search requests from the frontend
 */

const express = require('express');
const router = express.Router();
const Product = require('../models/product'); // Adjust the path to your Product model

// Search endpoint
router.get('/products/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    
    // If query is too short, return empty results
    if (query.length < 2) {
      return res.json({
        success: true,
        products: []
      });
    }
    
    // Create a search regex (case insensitive)
    const searchRegex = new RegExp(query, 'i');
    
    // Find products matching the search term
    const products = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { specs: searchRegex },
        { brand: searchRegex },
        { "tags": searchRegex }
      ]
    })
    .select('name price compareAtPrice thumbnailUrl specs brand') // Select only needed fields
    .limit(10) // Limit to 10 results
    .lean(); // Convert to plain JS objects for faster response
    
    // Return the results
    res.json({
      success: true,
      products: products,
      count: products.length,
      query: query
    });
    
  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching for products',
      error: error.message
    });
  }
});

// Alternative search endpoint for compatibility
router.get('/search', async (req, res) => {
  try {
    const query = req.query.query || '';
    
    // If query is too short, return empty results
    if (query.length < 2) {
      return res.json({
        success: true,
        results: []
      });
    }
    
    // Create a search regex (case insensitive)
    const searchRegex = new RegExp(query, 'i');
    
    // Find products matching the search term
    const products = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { specs: searchRegex },
        { brand: searchRegex },
        { "tags": searchRegex }
      ]
    })
    .select('name price compareAtPrice thumbnailUrl specs brand') // Select only needed fields
    .limit(10) // Limit to 10 results
    .lean(); // Convert to plain JS objects for faster response
    
    // Return the results
    res.json({
      success: true,
      results: products,
      count: products.length,
      query: query
    });
    
  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching for products',
      error: error.message
    });
  }
});

module.exports = router;