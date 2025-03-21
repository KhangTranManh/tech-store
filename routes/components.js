const express = require('express');
const router = express.Router();
const Component = require('../models/component');

// Get components by category
router.get('/:category', async (req, res) => {
  try {
    const { 
      subcategory, 
      minPrice, 
      maxPrice, 
      sort = 'createdAt', 
      order = 'desc',
      page = 1,
      limit = 10 
    } = req.query;

    // Validate category
    const validCategories = ['monitors', 'accessories', 'components'];
    const category = req.params.category.toLowerCase();

    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid category' 
      });
    }

    // Build query
    const query = { category };
    
    if (subcategory) query.subCategory = subcategory;
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch components
    const components = await Component.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber);

    // Count total components for pagination
    const totalComponents = await Component.countDocuments(query);

    res.status(200).json({
      success: true,
      totalComponents,
      totalPages: Math.ceil(totalComponents / limitNumber),
      currentPage: pageNumber,
      components
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching components' 
    });
  }
});

// Get component by ID
router.get('/detail/:id', async (req, res) => {
  try {
    const component = await Component.findById(req.params.id);
    
    if (!component) {
      return res.status(404).json({ 
        success: false, 
        message: 'Component not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      component
    });
  } catch (error) {
    console.error('Error fetching component:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching component' 
    });
  }
});

// Seed route for components (for development)
router.post('/seed', async (req, res) => {
  try {
    const componentsData = [
      // Monitors
      {
        name: 'LG UltraGear 27" 1ms 144Hz Gaming Monitor',
        category: 'monitors',
        subCategory: 'gaming-monitors',
        price: 329,
        originalPrice: 399,
        discount: 18,
        specs: '27" IPS, 2560x1440, HDR10',
        description: 'High-performance gaming monitor with ultra-fast response time and crisp resolution.',
        rating: 4.8,
        reviews: 95,
        stock: 15,
        images: ['monitor1.jpg']
      },
      {
        name: 'Dell S2721DGF 27" QHD Gaming Monitor',
        category: 'monitors',
        subCategory: 'gaming-monitors',
        price: 379,
        originalPrice: 449,
        discount: 15,
        specs: '27" IPS, 2560x1440, 165Hz, G-Sync',
        description: 'Immersive gaming experience with high refresh rate and sharp QHD resolution.',
        rating: 4.7,
        reviews: 78,
        stock: 10,
        images: ['monitor2.jpg']
      },
      // Accessories
      {
        name: 'Logitech G Pro X Mechanical Gaming Keyboard',
        category: 'accessories',
        subCategory: 'keyboards',
        price: 129,
        originalPrice: 149,
        discount: 13,
        specs: 'Mechanical switches, RGB lighting, Compact design',
        description: 'Professional-grade mechanical keyboard designed for competitive gaming.',
        rating: 4.6,
        reviews: 112,
        stock: 20,
        images: ['keyboard1.jpg']
      },
      {
        name: 'Razer DeathAdder V2 Gaming Mouse',
        category: 'accessories',
        subCategory: 'mice',
        price: 69,
        originalPrice: 89,
        discount: 22,
        specs: '20K DPI, Optical switches, Ergonomic design',
        description: 'High-precision gaming mouse with advanced optical sensors.',
        rating: 4.7,
        reviews: 88,
        stock: 25,
        images: ['mouse1.jpg']
      },
      // Components
      {
        name: 'NVIDIA GeForce RTX 4070 Graphics Card',
        category: 'components',
        subCategory: 'graphics-cards',
        price: 599,
        originalPrice: 649,
        discount: 8,
        specs: '12GB GDDR6X, Ray Tracing, DLSS',
        description: 'Next-generation graphics card with advanced ray tracing and AI capabilities.',
        rating: 4.9,
        reviews: 65,
        stock: 8,
        images: ['gpu1.jpg']
      },
      {
        name: 'AMD Ryzen 7 5800X Processor',
        category: 'components',
        subCategory: 'processors',
        price: 349,
        originalPrice: 449,
        discount: 22,
        specs: '8-core, 16-thread, 3.8GHz base, 4.7GHz boost',
        description: 'High-performance processor for gaming and content creation.',
        rating: 4.8,
        reviews: 102,
        stock: 12,
        images: ['cpu1.jpg']
      }
    ];

    // Clear existing components
    await Component.deleteMany({});

    // Insert new components
    const insertedComponents = await Component.insertMany(componentsData);
    
    res.status(201).json({
      success: true,
      message: `Inserted ${insertedComponents.length} components`,
      components: insertedComponents
    });
  } catch (error) {
    console.error('Error seeding components:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error seeding components' 
    });
  }
});

module.exports = router;