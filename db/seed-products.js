const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Product = require('../models/product');

const products = [
    {
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
      images: ['product1.jpg']
    },
    {
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
      images: ['laptop2.jpg']
    },
    {
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
      images: ['laptop3.jpg']
    },
    {
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
      images: ['laptop4.jpg']
    },
    {
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
      images: ['laptop5.jpg']
    }
  ];

// Enhanced MongoDB connection with more detailed logging
async function connectToDatabase() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection URI:', process.env.MONGODB_URI);

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: false,
      useUnifiedTopology: true,
    });

    console.log('✅ Successfully connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    return false;
  }
}

// Main seeding function
async function seedDatabase() {
  try {
    // Connect to database
    const isConnected = await connectToDatabase();
    if (!isConnected) {
      console.error('Failed to connect to database. Exiting.');
      process.exit(1);
    }

    // Clear existing products
    const deleteResult = await Product.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing products`);

    // Insert new products
    const insertedProducts = await Product.insertMany(products);
    console.log(`✨ Inserted ${insertedProducts.length} new products`);

  } catch (error) {
    console.error('❌ Seeding Error:', error);
    // Log the full error details
    console.error(error.errors);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📴 MongoDB connection closed');
  }
}

// Run the seeding process
seedDatabase().then(() => {
  console.log('Seeding process completed');
  process.exit(0);
}).catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});