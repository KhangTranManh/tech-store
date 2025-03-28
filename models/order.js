// models/order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Order Item Schema
const OrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1']
  }
});

// Address Schema
const AddressSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    default: 'United States'
  },
  phone: {
    type: String
  }
});

// Payment Info Schema
const PaymentInfoSchema = new Schema({
  method: {
    type: String,
    required: true,
    enum: ['credit_card', 'paypal', 'stripe']
  },
  transactionId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  last4: {
    type: String
  }
});

// Order Schema
const OrderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [OrderItemSchema],
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema,
  paymentInfo: PaymentInfoSchema,
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  notes: {
    type: String
  },
  trackingNumber: {
    type: String
  },
  estimatedDelivery: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate a unique order number before saving
OrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    // Generate order number format: TS + last 8 chars of ObjectId + random 4 digits
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 random digits
    this.orderNumber = `TS${this._id.toString().substr(-8)}${randomDigits}`;
  }
  next();
});

// Virtual for checking if order is returnable (within 30 days and delivered)
OrderSchema.virtual('isReturnable').get(function() {
  if (this.status !== 'delivered') return false;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return this.updatedAt >= thirtyDaysAgo;
});

module.exports = mongoose.model('Order', OrderSchema);