const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Cart = require('../models/cart');

// Add initial cart data with a valid userId
const initialCarts = [
    {
        userId: new mongoose.Types.ObjectId(), // Generate a valid ObjectId
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        userId: new mongoose.Types.ObjectId(), // Another cart with different userId
        items: [{
            productId: new mongoose.Types.ObjectId(),
            quantity: 1,
            name: "Sample Product",
            price: 99.99,
            image: "sample.jpg"
        }],
        createdAt: new Date(),
        updatedAt: new Date()
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

        // Clear existing carts
        const deleteCartResult = await Cart.deleteMany({});
        console.log(`🗑️ Deleted ${deleteCartResult.deletedCount} existing carts`);

        // Insert initial carts
        const insertedCarts = await Cart.insertMany(initialCarts);
        console.log(`✨ Inserted ${insertedCarts.length} initial carts`);

    } catch (error) {
        console.error('❌ Seeding Error:', error);
        console.error(error.errors);
    } finally {
        await mongoose.connection.close();
        console.log('📴 MongoDB connection closed');
    }
}

// Run the seeding process
seedDatabase().then(() => {
    console.log('Cart seeding process completed');
    process.exit(0);
}).catch((error) => {
    console.error('Cart seeding failed:', error);
    process.exit(1);
}); 