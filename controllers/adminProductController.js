// controllers/adminProductController.js
const Product = require('../models/product');

// Controller methods
const updateProductImages = async (productId, mainImage, additionalImages) => {
  try {
    const product = await Product.findById(productId);
    
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
  }
  catch (error) {
    console.error(`Error updating product images: ${error}`);
    return false;
  }
};

// Create handler for image upload route
const handleProductImageUpload = async (req, res) => {
  const { productId } = req.params;
  const mainImage = req.files.mainImage ? req.files.mainImage[0].path : null;
  const additionalImages = req.files.additionalImages ? 
    req.files.additionalImages.map(file => file.path) : [];
    
  const success = await updateProductImages(productId, mainImage, additionalImages);
  
  if (success) {
    return res.status(200).json({
      success: true,
      message: 'Product images updated successfully'
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Failed to update product images'
    });
  }
};

module.exports = {
  updateProductImages,
  handleProductImageUpload
  // Add other controller methods
};