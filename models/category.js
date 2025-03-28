// models/category.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  
  description: {
    type: String
  },
  
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  
  level: {
    type: Number,
    default: 0
  },
  
  // Store image reference to the Image collection
  image: {
    type: Schema.Types.ObjectId,
    ref: 'Image'
  },
  
  // Store thumbnail for quick access
  thumbnailUrl: {
    type: String
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  order: {
    type: Number,
    default: 0
  },
  
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

// Pre-save middleware to generate slug and update timestamps
CategorySchema.pre('save', function(next) {
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

// Virtual for child categories
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for product count
CategorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Method to update image from Image collection
CategorySchema.methods.updateImage = async function() {
  const Image = mongoose.model('Image');
  
  // Find the image for this category
  const image = await Image.findOne({ 
    entityType: 'category', 
    entityId: this._id,
    isActive: true
  });
  
  if (image) {
    this.image = image._id;
    this.thumbnailUrl = image.thumbnailUrl;
  } else {
    this.image = null;
    this.thumbnailUrl = null;
  }
  
  // Save the changes
  return this.save();
};

module.exports = mongoose.model('Category', CategorySchema);