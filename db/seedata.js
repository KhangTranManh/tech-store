// seedDatabase.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
const Address = require('../models/address');
const Cart = require('../models/cart');
const Category = require('../models/category');
const Image = require('../models/image');
const Message = require('../models/message');
const Order = require('../models/order');
const PaymentMethod = require('../models/payment-method');
const Product = require('../models/product');
const Review = require('../models/review');
const ReviewVote = require('../models/reviewVote');
const User = require('../models/user');
const Wishlist = require('../models/wishlist');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/techstore';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to read JSON file
const readJsonFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
};

// Model mapping
const modelMap = {
  'addresses.json': Address,
  'carts.json': Cart,
  'categories.json': Category,
  'images.json': Image,
  'messages.json': Message,
  'orders.json': Order,
  'paymentmethods.json': PaymentMethod,
  'products.json': Product,
  'reviews.json': Review,
  'reviewvotes.json': ReviewVote,
  'users.json': User,
  'wishlists.json': Wishlist
};

// Function to seed data for a specific model
const seedModel = async (Model, dataArray) => {
  if (!Array.isArray(dataArray)) {
    console.error(`Data for ${Model.modelName} is not an array`);
    return;
  }
  
  try {
    // Clear existing data
    await Model.deleteMany({});
    console.log(`Cleared existing ${Model.modelName} data`);
    
    // Insert new data
    if (dataArray.length > 0) {
      const result = await Model.insertMany(dataArray, { ordered: false });
      console.log(`${result.length} ${Model.modelName} documents inserted`);
    } else {
      console.log(`No ${Model.modelName} data to insert`);
    }
  } catch (error) {
    console.error(`Error seeding ${Model.modelName}:`, error);
  }
};

// Main function to seed all data
const seedDatabase = async () => {
  console.log('Starting database seeding...');
  
  // Get export directory path
  const exportDir = 'C:\\Users\\admin\\Documents\\Zalo Received Files\\tech-store\\tech-store\\mongodb_export';
  
  // Process each file in the export directory
  for (const [filename, Model] of Object.entries(modelMap)) {
    const filePath = path.join(exportDir, filename);
    
    if (fs.existsSync(filePath)) {
      const data = readJsonFile(filePath);
      if (data) {
        console.log(`Seeding ${filename}...`);
        await seedModel(Model, data);
      }
    } else {
      console.log(`File ${filename} does not exist in the export directory`);
    }
  }
  
  console.log('Database seeding completed!');
  mongoose.connection.close();
};

// Execute the seeding function
seedDatabase()
  .catch(error => {
    console.error('Error in seeding process:', error);
    mongoose.connection.close();
    process.exit(1);
  });