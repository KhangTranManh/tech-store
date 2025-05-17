// models/review.js - Fixed version
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId; // Properly import ObjectId

const ReviewSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  guestId: {
    type: String
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  title: {
    type: String,
    trim: true
  },

  content: {
    type: String,
    required: true,
    trim: true
  },

  authorName: {
    type: String,
    required: true
  },

  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },

  isApproved: {
    type: Boolean,
    default: true
  },

  helpfulCount: {
    type: Number,
    default: 0
  },

  notHelpfulCount: {
    type: Number,
    default: 0
  },

  images: [{
    url: String,
    caption: String
  }],

  replies: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    authorName: String,
    content: String,
    isStaff: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure either user or guestId is provided 
ReviewSchema.pre('validate', function(next) {
  if (!this.user && !this.guestId) {
    next(new Error('Either user or guestId must be provided'));
  } else {
    next();
  }
});

// Update timestamps on save
ReviewSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to calculate average rating for a product
ReviewSchema.statics.calculateAverageRating = async function(productId) {
  // FIXED: Properly convert string to ObjectId if needed
  const prodId = typeof productId === 'string' ? new ObjectId(productId) : productId;
  
  const result = await this.aggregate([
    { $match: { product: prodId, isApproved: true } },
    { $group: { 
      _id: '$product', 
      averageRating: { $avg: '$rating' }, 
      reviewCount: { $sum: 1 },
      ratingCounts: {
        $push: "$rating"
      }
    }}
  ]);

  if (result.length === 0) {
    return { averageRating: 0, reviewCount: 0, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  // Calculate counts for each rating (1-5)
  const ratingCounts = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0
  };
  
  result[0].ratingCounts.forEach(rating => {
    ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
  });
  
  return { 
    averageRating: Math.round(result[0].averageRating * 10) / 10, 
    reviewCount: result[0].reviewCount,
    ratingCounts
  };
};

// Method to update product's rating when a review is created/updated/deleted
ReviewSchema.statics.updateProductRating = async function(productId) {
  const Product = mongoose.model('Product');
  const stats = await this.calculateAverageRating(productId);
  
  try {
    // Update the product with the new rating data
    await Product.findByIdAndUpdate(productId, {
      rating: stats.averageRating,
      reviewCount: stats.reviewCount
    });
    
    return stats;
  } catch (error) {
    console.error('Error updating product rating:', error);
    throw error;
  }
};

// After saving a review, update the product's rating
ReviewSchema.post('save', async function() {
  try {
    await this.constructor.updateProductRating(this.product);
  } catch (error) {
    console.error('Error in post-save hook:', error);
  }
});

// After deleting a review, update the product's rating
ReviewSchema.post('remove', async function() {
  try {
    await this.constructor.updateProductRating(this.product);
  } catch (error) {
    console.error('Error in post-remove hook:', error);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);