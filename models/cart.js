const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for individual cart items
const CartItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',  // Reference to the Product model
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1'],
    default: 1
  },
  name: String,      // Add these fields for easier access
  price: Number,     // without needing to populate every time
  image: String,
  specs: String,
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

// Main Cart schema - each user has one cart
const CartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',     // Reference to the User model
    required: true,
    unique: true     // One cart per user/guest
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  items: [CartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
CartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for calculating total item count
CartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

module.exports = mongoose.model('Cart', CartSchema);