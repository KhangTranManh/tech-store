const mongoose = require('mongoose');

const GamingPCSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Gaming PC name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  category: {
    type: String,
    default: 'gaming-pcs',
    enum: ['gaming-pcs']
  },
  subCategory: {
    type: String,
    enum: [
      'high-end', 
      'mid-range', 
      'entry-level', 
      'custom-build'
    ]
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100']
  },
  specs: {
    processor: {
      type: String,
      trim: true
    },
    graphicsCard: {
      type: String,
      trim: true
    },
    memory: {
      type: String,
      trim: true
    },
    storage: {
      type: String,
      trim: true
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  brand: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  reviews: {
    type: Number,
    default: 0,
    min: [0, 'Reviews cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative']
  },
  images: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Virtual for discounted price
GamingPCSchema.virtual('discountedPrice').get(function() {
  return this.price * (1 - this.discount / 100);
});

module.exports = mongoose.model('GamingPC', GamingPCSchema);