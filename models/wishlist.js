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
      ref: 'Product',
      required: true
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

// Ensure each product is only added once per user
WishlistSchema.index({ user: 1, 'items.product': 1 }, { unique: true });

// Method to calculate total wishlist value
WishlistSchema.methods.calculateTotalValue = function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Method to check if wishlist is at max capacity
WishlistSchema.methods.isAtMaxCapacity = function() {
  return this.items.length >= this.maxItems;
};

module.exports = mongoose.model('Wishlist', WishlistSchema);