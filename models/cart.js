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

// KEY FIX: Add a compound index to prevent duplicate productIds for the same user
// This will enforce uniqueness of productId within each user's cart
CartSchema.index({ 'userId': 1, 'items.productId': 1 }, { unique: true });

// Alternatively, use this approach which is more flexible:
// This will help MongoDB find items more efficiently
CartSchema.index({ 'userId': 1 });
CartSchema.index({ 'items.productId': 1 });

// Pre-save middleware to update the updatedAt field
CartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add pre-save middleware to handle potential duplicate items
// This will combine quantities if the same product is added multiple times
CartSchema.pre('save', function(next) {
  if (!this.isModified('items')) return next();
  
  // Create a map to track products by ID
  const productMap = new Map();
  
  // Group items by productId and combine quantities
  this.items.forEach(item => {
    const productIdStr = item.productId.toString();
    
    if (productMap.has(productIdStr)) {
      // If this product already exists, add to its quantity
      productMap.get(productIdStr).quantity += item.quantity;
    } else {
      // Otherwise, add it to the map
      productMap.set(productIdStr, item);
    }
  });
  
  // Replace items array with deduplicated items
  this.items = Array.from(productMap.values());
  
  next();
});

// Virtual for calculating total item count
CartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Static method to find and merge duplicate items for an existing cart
CartSchema.statics.deduplicateItems = async function(userId) {
  const cart = await this.findOne({ userId });
  if (!cart || !cart.items || cart.items.length === 0) return null;
  
  // Create a map to track products by ID
  const productMap = new Map();
  
  // Group items by productId and combine quantities
  cart.items.forEach(item => {
    const productIdStr = item.productId.toString();
    
    if (productMap.has(productIdStr)) {
      // If this product already exists, add to its quantity
      productMap.get(productIdStr).quantity += item.quantity;
    } else {
      // Otherwise, add it to the map
      productMap.set(productIdStr, item);
    }
  });
  
  // Replace items array with deduplicated items
  cart.items = Array.from(productMap.values());
  
  // Save the cart with deduplicated items
  return cart.save();
};

module.exports = mongoose.model('Cart', CartSchema);