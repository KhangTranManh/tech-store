// update-to-admin.js - The safest and simplest approach
// This script updates an existing user to have admin role

const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file if available

// Import User model - make sure this path matches your project structure
const User = require('../models/user'); // Adjust path as needed

// MongoDB connection URI - replace with your actual connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/techstore';

// Email of the existing user to convert to admin (change this to one of your users)
const userEmail = "khangjaki12@gmail.com"; // Replace with your user email

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    
    try {
      // Find and update the user to admin role
      const result = await User.updateOne(
        { email: userEmail },
        { $set: { role: 'admin' } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`Success! User ${userEmail} has been updated to admin role`);
        
        // Get the updated user to confirm
        const adminUser = await User.findOne({ email: userEmail });
        console.log(`Confirmed: ${adminUser.firstName} ${adminUser.lastName} is now an admin`);
      } else if (result.matchedCount > 0) {
        console.log(`User ${userEmail} was already an admin`);
      } else {
        console.log(`User ${userEmail} not found. Please check the email address.`);
      }
      
      // Disconnect from the database
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
      
    } catch (error) {
      console.error('Error updating user to admin:', error);
      await mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });