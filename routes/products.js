// routes/products.js
const express = require('express');
const router = express.Router();

// Mock product database
const products = [
  {
    id: 1,
    name: 'Acer Predator Helios 300 Gaming Laptop',
    category: 'laptops',
    subCategory: 'gaming-laptops',
    price: 1199,
    originalPrice: 1499,
    discount: 20,
    specs: 'Intel Core i7, 16GB RAM, 512GB SSD, RTX 3060',
    description: 'The Acer Predator Helios 300 is a powerful gaming laptop featuring a 15.6" Full HD IPS display, 10th Gen Intel Core i7 processor, NVIDIA GeForce RTX 3060 graphics, 16GB DDR4 RAM, and a fast 512GB NVMe SSD.',
    rating: 4.7,
    reviews: 128,
    stock: 8,
    image: 'product1.jpg'
  },
  {
    id: 2,
    name: 'Dell XPS 15 Laptop',
    category: 'laptops',
    subCategory: 'ultrabooks',
    price: 1599,
    originalPrice: 1799,
    discount: 11,
    specs: 'Intel Core i7, 16GB RAM, 1TB SSD, GeForce GTX 1650 Ti',
    description: 'Powerful and sleek ultrabook for professionals and content creators.',
    rating: 5.0,
    reviews: 64,
    stock: 12,
    image: 'laptop2.jpg'
  },
  {
    id: 3,
    name: 'HP Spectre x360 2-in-1 Laptop',
    category: 'laptops',
    subCategory: '2-in-1-laptops',
    price: 1099,
    originalPrice: 1299,
    discount: 15,
    specs: 'Intel Core i5, 8GB RAM, 512GB SSD, Touchscreen',
    description: 'Versatile 2-in-1 laptop with a premium design and excellent battery life.',
    rating: 4.5,
    reviews: 95,
    stock: 10,
    image: 'laptop3.jpg'
  },
  {
    id: 4,
    name: 'Lenovo ThinkPad X1 Carbon',
    category: 'laptops',
    subCategory: 'business-laptops',
    price: 1449,
    originalPrice: 1649,
    discount: 12,
    specs: 'Intel Core i7, 16GB RAM, 512GB SSD, 14" FHD',
    description: 'Premium business laptop with excellent performance and durability.',
    rating: 4.9,
    reviews: 122,
    stock: 7,
    image: 'laptop4.jpg'
  },
  {
    id: 5,
    name: 'ASUS ROG Zephyrus G14 Gaming Laptop',
    category: 'laptops',
    subCategory: 'gaming-laptops',
    price: 1399,
    originalPrice: 1649,
    discount: 15,
    specs: 'AMD Ryzen 9, 16GB RAM, 1TB SSD, RTX 3060',
    description: 'Powerful gaming laptop in a compact form factor with excellent battery life.',
    rating: 4.9,
    reviews: 87,
    stock: 5,
    image: 'laptop5.jpg'
  }
];

// Get all products
router.get('/', (req, res) => {
  res.status(200).json(products);
});

// Get specific product by ID
router.get('/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  res.status(200).json(product);
});

// Get products by category
router.get('/category/:category', (req, res) => {
  const { category } = req.params;
  const filtered = products.filter(p => p.category === category);
  
  res.status(200).json(filtered);
});

// Get products by subcategory
router.get('/subcategory/:subCategory', (req, res) => {
  const { subCategory } = req.params;
  const filtered = products.filter(p => p.subCategory === subCategory);
  
  res.status(200).json(filtered);
});

// Search products
router.get('/search/:query', (req, res) => {
  const { query } = req.params;
  const searchTerm = query.toLowerCase();
  
  const results = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm) || 
    p.description.toLowerCase().includes(searchTerm) ||
    p.specs.toLowerCase().includes(searchTerm)
  );
  
  res.status(200).json(results);
});

module.exports = router;