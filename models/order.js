// models/order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for individual order items - Define this FIRST
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

// Main Order schema - Modified to support Cash on Delivery
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
    // Add paymentType field to support COD
    paymentType: {
        type: String,
        enum: ['card', 'bank', 'cod'],
        default: 'card',
        required: true
    },
    // Make paymentMethod optional since it's not needed for COD
    paymentMethod: {
        type: Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        // Required will be enforced in validation middleware
        required: false
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
    tracking: [{
        status: {
            type: String,
            required: true
        },
        location: String,
        description: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        carrier: String,
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        lastUpdated: Date
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

// Pre-validate middleware to enforce conditional requirement for paymentMethod
OrderSchema.pre('validate', function(next) {
    // If payment type is not COD, paymentMethod is required
    if (this.paymentType !== 'cod' && !this.paymentMethod) {
        this.invalidate('paymentMethod', 'Payment method is required for non-COD orders');
    }
    next();
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
    // Update status
    this.status = status;
    
    // Add to status history
    this.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Order status updated to ${status}`
    });
    
    // Synchronize with tracking
    this.addTrackingUpdate({
        status: this.getStatusDisplay(status),
        description: note || `Order status updated to ${status}`,
        timestamp: new Date()
    });
    
    return this.save();
};

// Helper method to convert system status to display status
OrderSchema.methods.getStatusDisplay = function(status) {
    const statusMap = {
        'pending': 'Order Placed',
        'processing': 'Order Processed',
        'shipped': 'Shipped', 
        'in_transit': 'In Transit',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'cancelled': 'Order Cancelled'
    };
    
    return statusMap[status] || status;
};

// Method to add tracking update
OrderSchema.methods.addTrackingUpdate = function(trackingData) {
    // Initialize tracking array if it doesn't exist
    if (!this.tracking) {
        this.tracking = [];
    }
    
    // Add new tracking entry
    this.tracking.push({
        status: trackingData.status,
        location: trackingData.location,
        description: trackingData.description,
        timestamp: trackingData.timestamp || new Date(),
        carrier: trackingData.carrier,
        updatedBy: trackingData.updatedBy
    });
    
    // Update current status if this is a status change
    if (trackingData.status) {
        this.status = trackingData.status.toLowerCase();
    }
    
    return this.save();
};

module.exports = mongoose.model('Order', OrderSchema);