// models/product.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  
  shortDescription: {
    type: String,
    maxlength: 200
  },
  
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: 0
  },
  
  compareAtPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  
  subCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  weight: {
    type: Number,
    min: 0
  },
  
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  
  features: [String],
  
  specs: {
    type: String
  },
  
  // Image fields - we'll store the references to separate Image documents
  // This will be populated from the Image collection based on entityId
  images: [{
    type: Schema.Types.ObjectId,
    ref: 'Image'
  }],
  
  // This will be used to quickly retrieve the main product image
  featuredImage: {
    type: Schema.Types.ObjectId,
    ref: 'Image'
  },
  
  // Thumbnail URL for quick access
  thumbnailUrl: {
    type: String
  },
  
  tags: [String],
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isOnSale: {
    type: Boolean,
    default: false
  },
  
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  reviewCount: {
    type: Number,
    default: 0
  },
  
  relatedProducts: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  metaTitle: String,
  metaDescription: String,
  metaKeywords: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to generate slug
ProductSchema.pre('save', function(next) {
  // Update timestamp
  this.updatedAt = Date.now();
  
  // Generate slug if not provided
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  next();
});

// Virtual for sale price
ProductSchema.virtual('salePrice').get(function() {
  if (this.isOnSale && this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
});

// Virtual for stock status
ProductSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Method to update images from Image collection
ProductSchema.methods.updateImages = async function() {
  const Image = mongoose.model('Image');
  
  // Find all images for this product
  const images = await Image.find({ 
    entityType: 'product', 
    entityId: this._id,
    isActive: true
  }).sort({ isFeatured: -1, order: 1 });
  
  // Update images array
  this.images = images.map(img => img._id);
  
  // Set featured image
  const featuredImage = images.find(img => img.isFeatured);
  if (featuredImage) {
    this.featuredImage = featuredImage._id;
    this.thumbnailUrl = featuredImage.thumbnailUrl;
  } else if (images.length > 0) {
    // If no featured image, use the first one
    this.featuredImage = images[0]._id;
    this.thumbnailUrl = images[0].thumbnailUrl;
  } else {
    // No images
    this.featuredImage = null;
    this.thumbnailUrl = null;
  }
  
  // Save the changes
  return this.save();
};

module.exports = mongoose.model('Product', ProductSchema);