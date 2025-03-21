const express = require('express');
const router = express.Router();
const GamingPC = require('../models/gaming-pc');

// Get all gaming PCs
router.get('/', async (req, res) => {
  try {
    const { 
      subCategory, 
      minPrice, 
      maxPrice, 
      sort = 'createdAt', 
      order = 'desc',
      page = 1,
      limit = 10 
    } = req.query;

    // Build query
    const query = { category: 'gaming-pcs' };
    
    if (subCategory) query.subCategory = subCategory;
    
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

    // Fetch gaming PCs
    const gamingPCs = await GamingPC.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber);

    // Count total gaming PCs for pagination
    const totalGamingPCs = await GamingPC.countDocuments(query);

    res.status(200).json({
      success: true,
      totalGamingPCs,
      totalPages: Math.ceil(totalGamingPCs / limitNumber),
      currentPage: pageNumber,
      gamingPCs
    });
  } catch (error) {
    console.error('Error fetching gaming PCs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching gaming PCs' 
    });
  }
});

// Seed route for gaming PCs (for development)
router.post('/seed', async (req, res) => {
  try {
    const gamingPCsData = [
      {
        name: 'Alienware Aurora Ryzen Edition R10 Gaming Desktop',
        subCategory: 'high-end',
        price: 2499,
        originalPrice: 2799,
        discount: 10,
        specs: {
          processor: 'AMD Ryzen 9 5950X',
          graphicsCard: 'NVIDIA GeForce RTX 3080',
          memory: '32GB DDR4',
          storage: '1TB NVMe SSD'
        },
        description: 'Extreme gaming performance with cutting-edge components and sleek design.',
        brand: 'Alienware',
        rating: 4.8,
        reviews: 95,
        stock: 10,
        images: ['alienware-r10.jpg']
      },
      {
        name: 'HP Omen 30L Gaming Desktop',
        subCategory: 'mid-range',
        price: 1599,
        originalPrice: 1799,
        discount: 11,
        specs: {
          processor: 'Intel Core i7-10700K',
          graphicsCard: 'NVIDIA GeForce RTX 3070',
          memory: '16GB DDR4',
          storage: '512GB SSD + 1TB HDD'
        },
        description: 'Powerful mid-range gaming PC with excellent cooling and upgradeability.',
        brand: 'HP',
        rating: 4.6,
        reviews: 78,
        stock: 15,
        images: ['hp-omen-30l.jpg']
      },
        // Continuing from the previous code...
    {
    name: 'ASUS ROG Strix G15CE Gaming Desktop',
    subCategory: 'mid-range',
    price: 1399,
    originalPrice: 1599,
    discount: 13,
    specs: {
      processor: 'Intel Core i5-11400F',
      graphicsCard: 'NVIDIA GeForce RTX 3060',
      memory: '16GB DDR4',
      storage: '512GB NVMe SSD'
    },
    description: 'Compact gaming desktop with strong performance for modern games.',
    brand: 'ASUS',
    rating: 4.5,
    reviews: 65,
    stock: 20,
    images: ['asus-rog-strix-g15ce.jpg']
  },
  {
    name: 'Lenovo Legion Tower 5 Gaming PC',
    subCategory: 'entry-level',
    price: 999,
    originalPrice: 1199,
    discount: 17,
    specs: {
      processor: 'AMD Ryzen 5 5600G',
      graphicsCard: 'NVIDIA GeForce GTX 1660 Super',
      memory: '8GB DDR4',
      storage: '256GB SSD'
    },
    description: 'Affordable entry-level gaming PC perfect for casual gamers.',
    brand: 'Lenovo',
    rating: 4.3,
    reviews: 52,
    stock: 25,
    images: ['lenovo-legion-tower-5.jpg']
  },
  {
    name: 'Custom Gaming PC - Enthusiast Build',
    subCategory: 'custom-build',
    price: 2999,
    originalPrice: 3299,
    discount: 9,
    specs: {
      processor: 'AMD Ryzen 9 5950X',
      graphicsCard: 'NVIDIA GeForce RTX 3090',
      memory: '64GB DDR4',
      storage: '2TB NVMe SSD + 4TB HDD'
    },
    description: 'Ultimate custom-built gaming PC for maximum performance and future-proofing.',
    brand: 'Custom Build',
    rating: 4.9,
    reviews: 40,
    stock: 5,
    images: ['custom-enthusiast-build.jpg']
  }
];

// Clear existing gaming PCs
await GamingPC.deleteMany({});

// Insert new gaming PCs
const insertedGamingPCs = await GamingPC.insertMany(gamingPCsData);

res.status(201).json({
  success: true,
  message: `Inserted ${insertedGamingPCs.length} gaming PCs`,
  gamingPCs: insertedGamingPCs
});
} catch (error) {
console.error('Error seeding gaming PCs:', error);
res.status(500).json({ 
  success: false, 
  message: 'Error seeding gaming PCs' 
});
}
});

// Get specific gaming PC by ID
router.get('/:id', async (req, res) => {
try {
const gamingPC = await GamingPC.findById(req.params.id);

if (!gamingPC) {
  return res.status(404).json({ 
    success: false, 
    message: 'Gaming PC not found' 
  });
}

res.status(200).json({
  success: true,
  gamingPC
});
} catch (error) {
console.error('Error fetching gaming PC:', error);
res.status(500).json({ 
  success: false, 
  message: 'Error fetching gaming PC' 
});
}
});

// Get available subcategories
router.get('/subcategories/list', async (req, res) => {
try {
const subcategories = await GamingPC.distinct('subCategory');

res.status(200).json({
  success: true,
  subcategories
});
} catch (error) {
console.error('Error fetching subcategories:', error);
res.status(500).json({ 
  success: false, 
  message: 'Error fetching gaming PC subcategories' 
});
}
});

// Search gaming PCs
router.get('/search/:query', async (req, res) => {
try {
const { query } = req.params;
const { 
  page = 1, 
  limit = 10 
} = req.query;

const pageNumber = parseInt(page);
const limitNumber = parseInt(limit);
const skip = (pageNumber - 1) * limitNumber;

// Text search
const searchResults = await GamingPC.find({ 
  $text: { 
    $search: query 
  } 
})
.skip(skip)
.limit(limitNumber);

const totalGamingPCs = await GamingPC.countDocuments({ 
  $text: { 
    $search: query 
  } 
});

res.status(200).json({
  success: true,
  totalGamingPCs,
  totalPages: Math.ceil(totalGamingPCs / limitNumber),
  currentPage: pageNumber,
  gamingPCs: searchResults
});
} catch (error) {
console.error('Search error:', error);
res.status(500).json({ 
  success: false, 
  message: 'Error performing search' 
});
}
});

module.exports = router;