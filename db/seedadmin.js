// Simplified version of the seed-admin.js script
// This version focuses on clarity and has fewer dependencies

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model - IMPORTANT: Update this path to match your project structure
const User = require('../models/user'); // or '../models/user' depending on your file naming

// MongoDB connection URI - replace with your actual connection string
const MONGO_URI = 'mongodb://localhost:27017/techstore'; 

// Admin user data
const adminData = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@techstore.com", 
  password: "Djjk68913@", // Will be hashed by the script
  phone: "0949387276",
  role: "admin", // This field enables the redirect to tracking page
  isSubscribed: false,
  isEmailVerified: true,
  preferences: {
    orderUpdates: true,
    promotions: false,
    newsletter: false,
    productAlerts: false,
    currency: "usd"
  },
  security: {
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 60
  },
  createdAt: new Date()
};

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    
    try {
      // Check if admin already exists
      const existingAdmin = await User.findOne({ email: adminData.email });
      
      if (existingAdmin) {
        console.log('Admin user already exists');
        
        // Update the role if needed
        if (existingAdmin.role !== 'admin') {
          await User.updateOne(
            { _id: existingAdmin._id }, 
            { $set: { role: 'admin' } }
          );
          console.log('Updated user to admin role');
        }
      } else {
        // Create new admin user
        
        // Hash the password - THIS IS THE CRUCIAL STEP
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);
        
        // Create admin with HASHED password
        const newAdmin = new User({
          ...adminData,
          password: hashedPassword // Store the hashed password, not plaintext
        });
        
        // Save to database
        await newAdmin.save();
        console.log('Admin user created successfully');
        console.log(`Email: ${adminData.email}`);
        console.log(`Password: ${adminData.password} (stored as hashed)`);
      }
      
      // Disconnect from the database
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
      console.log('Done!');
      
    } catch (error) {
      console.error('Error creating admin user:', error);
      await mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });