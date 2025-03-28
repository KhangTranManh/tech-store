// models/image.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  // Original filename
  filename: {
    type: String,
    required: true
  },
  
  // The path where the image is stored
  path: {
    type: String,
    required: true
  },
  
  // MIME type (e.g., image/jpeg, image/png)
  mimetype: {
    type: String,
    required: true
  },
  
  // Size in bytes
  size: {
    type: Number,
    required: true
  },
  
  // Associated entity (product, category, banner, etc.)
  entityType: {
    type: String,
    required: true,
    enum: ['product', 'category', 'banner', 'logo', 'user', 'other']
  },
  
  // ID of the associated entity (e.g., product ID)
  entityId: {
    type: Schema.Types.ObjectId,
    required: false, // Not required for banners, logos
    refPath: 'entityType'
  },
  
  // Position/order for multiple product images
  order: {
    type: Number,
    default: 0
  },
  
  // Additional metadata (alt text, caption, etc.)
  alt: {
    type: String,
    default: ''
  },
  
  caption: {
    type: String,
    default: ''
  },
  
  // Image dimensions
  width: {
    type: Number,
    required: false
  },
  
  height: {
    type: Number,
    required: false
  },
  
  // Whether this is a thumbnail, medium, or large size
  sizeType: {
    type: String,
    enum: ['original', 'thumbnail', 'medium', 'large'],
    default: 'original'
  },
  
  // If this is a resized version, reference to the original
  originalImage: {
    type: Schema.Types.ObjectId,
    ref: 'Image',
    required: false
  },
  
  // Whether this image is featured/main for the entity
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Whether this image is active/visible
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Creation and update timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
ImageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for the full URL (useful for frontend)
ImageSchema.virtual('url').get(function() {
  return `/uploads/${this.path}`;
});

// Virtual for thumbnail URL
ImageSchema.virtual('thumbnailUrl').get(function() {
  // Logic to return thumbnail URL if exists, otherwise original
  // This would be implemented based on your image storage approach
  return `/uploads/thumbnails/${this.path}`;
});

module.exports = mongoose.model('Image', ImageSchema);