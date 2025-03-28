// controllers/imageController.js
const Image = require('../models/image');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp'); // For image processing
const { v4: uuidv4 } = require('uuid'); // For generating unique filenames

// Base directory for image uploads
const UPLOAD_DIR = path.join(__dirname, '../frontend/uploads');
const THUMBNAILS_DIR = path.join(UPLOAD_DIR, 'thumbnails');
const MEDIUM_DIR = path.join(UPLOAD_DIR, 'medium');

// Ensure upload directories exist
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDirExists(UPLOAD_DIR);
ensureDirExists(THUMBNAILS_DIR);
ensureDirExists(MEDIUM_DIR);

// Generate a unique filename to avoid collisions
const generateUniqueFilename = (originalFilename) => {
  const ext = path.extname(originalFilename);
  const timestamp = Date.now();
  const uuid = uuidv4();
  return `${timestamp}-${uuid}${ext}`;
};

// Controller methods
const imageController = {
  /**
   * Upload a new image
   */
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }
      
      const { entityType, entityId, alt, caption, isFeatured, order } = req.body;
      
      // Generate a unique filename
      const uniqueFilename = generateUniqueFilename(req.file.originalname);
      
      // Move the uploaded file to our storage location
      const targetPath = path.join(UPLOAD_DIR, uniqueFilename);
      fs.renameSync(req.file.path, targetPath);
      
      // Get image dimensions using sharp
      const metadata = await sharp(targetPath).metadata();
      
      // Create image record in database
      const image = new Image({
        filename: uniqueFilename,
        path: uniqueFilename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        entityType,
        entityId: entityId || null,
        alt: alt || '',
        caption: caption || '',
        isFeatured: isFeatured === 'true',
        order: order ? parseInt(order) : 0,
        width: metadata.width,
        height: metadata.height
      });
      
      // Create thumbnails and medium-sized versions
      await createImageVariants(targetPath, uniqueFilename, metadata);
      
      // Save the image record
      await image.save();
      
      // If this is set as featured, unset other featured images for the same entity
      if (image.isFeatured && image.entityId) {
        await Image.updateMany(
          { 
            entityType: image.entityType, 
            entityId: image.entityId,
            _id: { $ne: image._id },
            isFeatured: true
          },
          { $set: { isFeatured: false } }
        );
      }
      
      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        image: {
          _id: image._id,
          url: image.url,
          thumbnailUrl: image.thumbnailUrl,
          filename: image.filename
        }
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error uploading image',
        error: error.message
      });
    }
  },
  
  /**
   * Get images for a specific entity
   */
  async getEntityImages(req, res) {
    try {
      const { entityType, entityId } = req.params;
      
      // Find all images for this entity
      const images = await Image.find({ 
        entityType, 
        entityId,
        isActive: true
      }).sort({ isFeatured: -1, order: 1 });
      
      res.status(200).json({
        success: true,
        images: images.map(img => ({
          _id: img._id,
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          alt: img.alt,
          caption: img.caption,
          isFeatured: img.isFeatured,
          order: img.order
        }))
      });
    } catch (error) {
      console.error('Error fetching entity images:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching images',
        error: error.message
      });
    }
  },
  
  /**
   * Delete an image
   */
  async deleteImage(req, res) {
    try {
      const { imageId } = req.params;
      
      // Find the image to delete
      const image = await Image.findById(imageId);
      
      if (!image) {
        return res.status(404).json({ 
          success: false, 
          message: 'Image not found' 
        });
      }
      
      // Delete the physical files
      const filesToDelete = [
        path.join(UPLOAD_DIR, image.path),
        path.join(THUMBNAILS_DIR, image.path),
        path.join(MEDIUM_DIR, image.path)
      ];
      
      filesToDelete.forEach(file => {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      });
      
      // Delete the database record
      await Image.findByIdAndDelete(imageId);
      
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting image',
        error: error.message
      });
    }
  },
  
  /**
   * Update image details
   */
  async updateImage(req, res) {
    try {
      const { imageId } = req.params;
      const { alt, caption, isFeatured, order } = req.body;
      
      // Find and update the image
      const image = await Image.findById(imageId);
      
      if (!image) {
        return res.status(404).json({ 
          success: false, 
          message: 'Image not found' 
        });
      }
      
      // Update fields
      if (alt !== undefined) image.alt = alt;
      if (caption !== undefined) image.caption = caption;
      if (order !== undefined) image.order = parseInt(order);
      
      // Handle featured status
      if (isFeatured !== undefined) {
        const newFeaturedStatus = isFeatured === 'true' || isFeatured === true;
        
        // If setting to featured, unset others
        if (newFeaturedStatus && !image.isFeatured && image.entityId) {
          await Image.updateMany(
            { 
              entityType: image.entityType, 
              entityId: image.entityId,
              _id: { $ne: image._id },
              isFeatured: true
            },
            { $set: { isFeatured: false } }
          );
        }
        
        image.isFeatured = newFeaturedStatus;
      }
      
      await image.save();
      
      res.status(200).json({
        success: true,
        message: 'Image updated successfully',
        image: {
          _id: image._id,
          url: image.url,
          thumbnailUrl: image.thumbnailUrl,
          alt: image.alt,
          caption: image.caption,
          isFeatured: image.isFeatured,
          order: image.order
        }
      });
    } catch (error) {
      console.error('Error updating image:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating image',
        error: error.message
      });
    }
  },
  
  /**
   * Set the order of multiple images
   */
  async setImagesOrder(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const { imageOrders } = req.body;
      
      if (!Array.isArray(imageOrders)) {
        return res.status(400).json({ 
          success: false, 
          message: 'imageOrders must be an array' 
        });
      }
      
      // Update each image's order
      for (const item of imageOrders) {
        if (!item._id || !Number.isInteger(item.order)) continue;
        
        await Image.findByIdAndUpdate(item._id, { order: item.order });
      }
      
      res.status(200).json({
        success: true,
        message: 'Image order updated successfully'
      });
    } catch (error) {
      console.error('Error updating image order:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error updating image order',
        error: error.message
      });
    }
  },
  
  /**
   * Get all store images (banners, logos, etc.)
   */
  async getStoreImages(req, res) {
    try {
      const { type } = req.query; // Optional filter by entityType
      
      const query = { isActive: true };
      if (type) {
        query.entityType = type;
      } else {
        // Default to non-product, non-user images if no type specified
        query.entityType = { $nin: ['product', 'user'] };
      }
      
      const images = await Image.find(query).sort({ entityType: 1, order: 1 });
      
      res.status(200).json({
        success: true,
        images: images.map(img => ({
          _id: img._id,
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          entityType: img.entityType,
          alt: img.alt,
          caption: img.caption,
          order: img.order
        }))
      });
    } catch (error) {
      console.error('Error fetching store images:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching store images',
        error: error.message
      });
    }
  }
};

/**
 * Create thumbnail and medium-sized versions of an image
 */
async function createImageVariants(sourcePath, filename, metadata) {
  try {
    // Create thumbnail (200px width)
    await sharp(sourcePath)
      .resize(200, null, { withoutEnlargement: true })
      .toFile(path.join(THUMBNAILS_DIR, filename));
    
    // Create medium-sized version (600px width)
    await sharp(sourcePath)
      .resize(600, null, { withoutEnlargement: true })
      .toFile(path.join(MEDIUM_DIR, filename));
      
    return true;
  } catch (error) {
    console.error('Error creating image variants:', error);
    return false;
  }
}

module.exports = imageController;