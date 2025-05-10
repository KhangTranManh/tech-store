// seedCategories.js - Create a separate file for seeding categories
const mongoose = require('mongoose');
const Category = require('../models/category');

// Set your MongoDB connection string here
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/techstore';

// Check for MongoDB URI
if (!MONGODB_URI) {
  console.error('ERROR: MongoDB connection string is missing. Set MONGODB_URI environment variable or update the hardcoded value in this file.');
  process.exit(1);
}

// Connect to MongoDB
console.log('Attempting to connect to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define the category hierarchy
const categories = [
  // Main categories (level 0)
  {
    name: "Laptops",
    slug: "laptops",
    level: 0,
    isActive: true,
    isFeatured: true
  },
  {
    name: "Components",
    slug: "components",
    level: 0,
    isActive: true,
    isFeatured: true
  },
  {
    name: "Gaming PCs",
    slug: "gaming-pcs",
    level: 0,
    isActive: true,
    isFeatured: true
  },
  {
    name: "Monitors",
    slug: "monitors",
    level: 0,
    isActive: true,
    isFeatured: true
  },
];

// Define subcategories in a separate array to add parent IDs after inserting main categories
const subcategories = [
  // Laptop subcategories
  { name: "Gaming Laptops", slug: "gaming-laptops", level: 1, parentSlug: "laptops" },
  { name: "Business Laptops", slug: "business-laptops", level: 1, parentSlug: "laptops" },
  { name: "Ultrabooks", slug: "ultrabooks", level: 1, parentSlug: "laptops" },
  { name: "2-in-1 Laptops", slug: "2-in-1-laptops", level: 1, parentSlug: "laptops" },
  { name: "Chromebooks", slug: "chromebooks", level: 1, parentSlug: "laptops" },
  
  // Component subcategories
  { name: "Graphics Cards", slug: "graphics-cards", level: 1, parentSlug: "components" },
  { name: "Processors", slug: "processors", level: 1, parentSlug: "components" },
  { name: "Motherboards", slug: "motherboards", level: 1, parentSlug: "components" },
  { name: "Memory (RAM)", slug: "memory-ram", level: 1, parentSlug: "components" },
  { name: "Storage", slug: "storage", level: 1, parentSlug: "components" },
  // ...other component subcategories
  
  // PC subcategories
  { name: "High-End Gaming PCs", slug: "high-end-gaming-pcs", level: 1, parentSlug: "gaming-pcs" },
  { name: "Mid-Range Gaming PCs", slug: "mid-range-gaming-pcs", level: 1, parentSlug: "gaming-pcs" },
  { name: "Entry-Level Gaming PCs", slug: "entry-level-gaming-pcs", level: 1, parentSlug: "gaming-pcs" },
  { name: "Custom Build PCs", slug: "custom-build-pcs", level: 1, parentSlug: "gaming-pcs" },
  
  // Monitor subcategories
  { name: "Gaming Monitors", slug: "gaming-monitors", level: 1, parentSlug: "monitors" },
  { name: "Ultrawide Monitors", slug: "ultrawide-monitors", level: 1, parentSlug: "monitors" },
  { name: "4K Monitors", slug: "4k-monitors", level: 1, parentSlug: "monitors" },
  { name: "Professional Monitors", slug: "professional-monitors", level: 1, parentSlug: "monitors" },
  { name: "Curved Monitors", slug: "curved-monitors", level: 1, parentSlug: "monitors" },
];

// Main seeding function
async function seedCategories() {
  try {
    // Clear existing categories
    await Category.deleteMany({});
    console.log('Deleted existing categories');
    
    // Insert main categories
    const mainCats = await Category.insertMany(categories);
    console.log(`Inserted ${mainCats.length} main categories`);
    
    // Create a mapping of slug to ID for main categories
    const slugToId = {};
    mainCats.forEach(cat => {
      slugToId[cat.slug] = cat._id;
    });
    
    // Add parent ID references to subcategories
    const subcatsWithParents = subcategories.map(subcat => ({
      ...subcat,
      parent: slugToId[subcat.parentSlug]
    }));
    
    // Insert subcategories
    const subCats = await Category.insertMany(subcatsWithParents);
    console.log(`Inserted ${subCats.length} subcategories`);
    
    console.log('Category seeding completed successfully');
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedCategories();