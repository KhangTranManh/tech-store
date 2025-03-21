const mongoose = require('mongoose');

const ComponentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Component name is required'],
    trim: true,
    maxlength: [100, 'Component name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Component category is required'],
    enum: [
      'monitors', 
      'accessories', 
      'components'
    ]
  },
  subCategory: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
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
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
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
    min: [0, 'Number of reviews cannot be negative']
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
ComponentSchema.virtual('discountedPrice').get(function() {
  return this.price * (1 - this.discount / 100);
});

// Index for search performance
ComponentSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Component', ComponentSchema);