// scripts/migrate-order-numbers.js
const mongoose = require('mongoose');
const Order = require('../models/order');

async function migrateOrderNumbers() {
    try {
        // Connect to MongoDB with direct connection string
        // Replace this with your actual MongoDB connection string
        const MONGODB_URI = 'mongodb://localhost:27017/tech-store'; // Use your actual connection string here
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB');
        
        // The rest of your script remains the same
        const orders = await Order.find({});
        
        console.log(`Found ${orders.length} orders to process`);
        
        let updatedCount = 0;
        
        // Process each order
        for (const order of orders) {
            // Check if order number needs updating
            if (!order.orderNumber || !order.orderNumber.startsWith('ORD-')) {
                const idString = order._id.toString();
                const sixDigits = idString.length > 6 ? idString.slice(-10, -4) : idString.padStart(6, '0');
                const fourDigits = idString.length > 4 ? idString.slice(-4) : '0000';
                
                // Set new order number
                order.orderNumber = `ORD-${sixDigits}-${fourDigits}`;
                
                // Save the order
                await order.save();
                
                updatedCount++;
                console.log(`Updated order ${order._id} to ${order.orderNumber}`);
            }
        }
        
        console.log(`Migration complete. Updated ${updatedCount} orders.`);
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the migration
migrateOrderNumbers();