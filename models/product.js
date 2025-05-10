// models/product.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Detailed specification schema for better organization
const SpecificationSchema = new Schema({
  title: String,
  details: [String]
}, { _id: false });

const FAQSchema = new Schema({
  question: String,
  answer: String
}, { _id: false });

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
  
  // New field: Detailed description for the Description tab
  detailedDescription: {
    type: String
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
  
  // New field: Brand information
  brand: {
    type: String
  },
  
  // New field: Model number
  modelNumber: {
    type: String
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
  
  // Basic specs as a string (for simple display)
  specs: {
    type: String
  },
  
  // New field: Detailed specifications for the Specifications tab
  detailedSpecs: {
    processor: SpecificationSchema,
    graphics: SpecificationSchema,
    memory: SpecificationSchema,
    storage: SpecificationSchema,
    display: SpecificationSchema,
    audio: SpecificationSchema,
    keyboard: SpecificationSchema,
    connectivity: SpecificationSchema,
    battery: SpecificationSchema,
    operatingSystem: SpecificationSchema,
    dimensions: SpecificationSchema
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
  
  // New field: Additional image URLs (if not using Image model references)
  additionalImages: [String],
  
  // New field: Frequently Asked Questions
  faqs: [FAQSchema],
  
  // New field: Shipping information
  shippingInfo: {
    type: String,
    default: 'Free shipping on orders over $50. Free returns.'
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

// Virtual for formatted discount percentage
ProductSchema.virtual('discountPercentage').get(function() {
  return Math.round(this.discount);
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
ProductSchema.statics.updateImages = async function(productId, mainImage, additionalImages) {
  try {
    const product = await this.findById(productId);
    
    if (!product) {
      console.error(`Product with ID ${productId} not found`);
      return false;
    }
    
    // Update thumbnail URL
    product.thumbnailUrl = mainImage;
    
    // Update additional images
    product.additionalImages = additionalImages;
    
    await product.save();
    console.log(`Updated images for ${product.name}`);
    return true;
  } catch (error) {
    console.error(`Error updating product images: ${error}`);
    return false;
  }
};
module.exports = mongoose.model('Product', ProductSchema);