const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
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
    image: {
      type: String
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxItems: {
    type: Number,
    default: 50  // Limit wishlist to 50 items
  }
}, {
  timestamps: true
});

// Pre-save middleware to ensure no duplicates
WishlistSchema.pre('save', function(next) {
  // Create a Set to track unique product IDs and names
  const uniqueProducts = new Set();
  const uniqueNames = new Set();
  const uniqueItems = [];

  // Go through each item and only keep unique ones
  for (const item of this.items) {
    // Use product ID if available, otherwise use name
    const productId = item.product ? item.product.toString() : null;
    const key = productId || item.name;
    
    // If we've already seen this product/name, skip it
    if ((productId && uniqueProducts.has(productId)) || 
        (!productId && uniqueNames.has(item.name))) {
      continue;
    }
    
    // Otherwise, add it to our tracking sets and the new items array
    if (productId) {
      uniqueProducts.add(productId);
    } else {
      uniqueNames.add(item.name);
    }
    
    uniqueItems.push(item);
  }
  
  // Replace the items array with our de-duplicated version
  this.items = uniqueItems;
  
  next();
});

module.exports = mongoose.model('Wishlist', WishlistSchema);