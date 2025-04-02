// models/order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for individual order items
const OrderItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    image: String
});

// Main Order schema
const OrderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    orderNumber: {
        type: String,
        unique: true
    },
    items: [OrderItemSchema],
    shippingAddress: {
        type: Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    paymentMethod: {
        type: Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        required: true
    },
    paymentLast4: {
        type: String
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    statusHistory: [{
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    trackingNumber: String,
    carrier: String,
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to generate order number and update timestamps
OrderSchema.pre('save', async function(next) {
    // Update timestamp
    this.updatedAt = Date.now();
    
    // Generate order number if not provided
    if (!this.orderNumber) {
        const prefix = 'ORD';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.orderNumber = `${prefix}-${timestamp}-${random}`;
    }
    
    next();
});

// Method to update order status
OrderSchema.methods.updateStatus = function(status, note) {
    this.status = status;
    this.statusHistory.push({
        status,
        timestamp: Date.now(),
        note: note || `Order status updated to ${status}`
    });
    
    return this.save();
};

module.exports = mongoose.model('Order', OrderSchema);