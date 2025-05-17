// controllers/reviewController.js - With better error handling
const Review = require('../models/review');
const ReviewVote = require('../models/reviewVote');
const Product = require('../models/product');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Helper to safely convert ID strings to ObjectId
const toObjectId = (id) => {
  try {
    return typeof id === 'string' ? new ObjectId(id) : id;
  } catch (error) {
    console.error('Invalid ObjectId:', id, error);
    return null;
  }
};

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    // Validate productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    // First, check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false, 
        message: 'Product not found'
      });
    }
    
    // Get total count
    const totalReviews = await Review.countDocuments({ 
      product: productId,
      isApproved: true
    });
    
    // Get reviews with pagination
    const reviews = await Review.find({ 
      product: productId,
      isApproved: true
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
    // Get rating stats
    const stats = await Review.calculateAverageRating(productId);
    
    res.json({
      success: true,
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
      reviews,
      averageRating: stats.averageRating,
      ratingCounts: stats.ratingCounts,
      productId
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};
// Submit a new review
exports.submitReview = async (req, res) => {
  try {
    console.log('Received review submission:', req.body); // Log the incoming request
    
    const { productId, rating, title, content } = req.body;
    
    // Validate required fields
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: productId'
      });
    }
    
    if (rating === undefined || rating === null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: rating'
      });
    }
    
    // Ensure rating is a number between 1-5
    const numericRating = parseInt(rating, 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5'
      });
    }
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: content'
      });
    }
    
    // Check if product exists
    let product;
    try {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
    } catch (error) {
      console.error('Error finding product:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    // Prepare review data
    const reviewData = {
      product: productId,
      rating: numericRating,
      title: title || content.substring(0, 50), // Use first 50 chars as title if none provided
      content: content.trim(),
      isApproved: true // Auto-approve for now
    };
    
    // Handle authentication - either use logged in user or guest
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      // Check if user has already reviewed this product
      const existingReview = await Review.findOne({ 
        user: req.user._id, 
        product: productId 
      });
      
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }
      
      reviewData.user = req.user._id;
      reviewData.authorName = req.user.name || req.user.email || 'Anonymous User';
      
      // Check if verified purchase (if you have order data)
      // This is a placeholder - implement your own logic to check if user has purchased this product
      const isVerifiedPurchase = false;
      reviewData.isVerifiedPurchase = isVerifiedPurchase;
    } else {
      // Guest review handling
      if (!req.session) {
        req.session = {}; // Create session object if it doesn't exist
      }
      
      if (!req.session.guestId) {
        req.session.guestId = new mongoose.Types.ObjectId().toString();
      }
      
      reviewData.guestId = req.session.guestId;
      reviewData.authorName = req.body.authorName || 'Guest';
    }
    
    console.log('Creating review with data:', reviewData); // Log the final review data
    
    // Create the review
    const review = new Review(reviewData);
    await review.save();
    
    // Get updated rating stats
    const updatedStats = await Review.calculateAverageRating(productId);
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
      newRating: updatedStats.averageRating,
      newReviewCount: updatedStats.reviewCount,
      shouldReload: true
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting review',
      error: error.message
    });
  }
};

// Mark a review as helpful or not helpful
exports.markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isHelpful } = req.body;
    
    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    const voteData = {
      review: reviewId,
      isHelpful: isHelpful === true || isHelpful === 'true'
    };
    
    // Handle authentication
    if (req.isAuthenticated() && req.user) {
      voteData.user = req.user._id;
    } else {
      if (!req.session.guestId) {
        req.session.guestId = new mongoose.Types.ObjectId().toString();
      }
      voteData.guestId = req.session.guestId;
    }
    
    // Find existing vote
    let vote;
    if (voteData.user) {
      vote = await ReviewVote.findOne({ review: reviewId, user: voteData.user });
    } else {
      vote = await ReviewVote.findOne({ review: reviewId, guestId: voteData.guestId });
    }
    
    if (vote) {
      // Update existing vote if it's different
      if (vote.isHelpful !== voteData.isHelpful) {
        vote.isHelpful = voteData.isHelpful;
        await vote.save();
      }
    } else {
      // Create new vote
      vote = new ReviewVote(voteData);
      await vote.save();
    }
    
    // Update helpful counts on review
    const helpfulVotes = await ReviewVote.countDocuments({ review: reviewId, isHelpful: true });
    const notHelpfulVotes = await ReviewVote.countDocuments({ review: reviewId, isHelpful: false });
    
    await Review.findByIdAndUpdate(reviewId, {
      helpfulCount: helpfulVotes,
      notHelpfulCount: notHelpfulVotes
    });
    
    res.json({
      success: true,
      helpfulCount: helpfulVotes,
      notHelpfulCount: notHelpfulVotes
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking review as helpful',
      error: error.message
    });
  }
};

// Add a reply to a review
exports.addReplyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }
    
    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    const replyData = {
      content: content.trim(),
      createdAt: new Date()
    };
    
    // Handle authentication
    if (req.isAuthenticated() && req.user) {
      replyData.user = req.user._id;
      replyData.authorName = req.user.name || req.user.email || 'Anonymous User';
      replyData.isStaff = req.user.role === 'admin' || req.user.role === 'staff';
    } else {
      replyData.authorName = req.body.authorName || 'Guest';
      replyData.isStaff = false;
    }
    
    // Add reply to review
    review.replies.push(replyData);
    await review.save();
    
    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      reply: replyData
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding reply',
      error: error.message
    });
  }
};

// Update product rating directly
exports.updateProductRating = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating } = req.body;
    
    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rating value'
      });
    }
    
    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Calculate new rating
    const currentRating = product.rating || 0;
    const currentReviewCount = product.reviewCount || 0;
    
    let newRating;
    let newReviewCount;
    
    if (currentReviewCount === 0) {
      // First review
      newRating = parseFloat(rating);
      newReviewCount = 1;
    } else {
      // Update existing rating
      newReviewCount = currentReviewCount + 1;
      newRating = ((currentRating * currentReviewCount) + parseFloat(rating)) / newReviewCount;
      
      // Round to 1 decimal place
      newRating = Math.round(newRating * 10) / 10;
    }
    
    // Update product
    product.rating = newRating;
    product.reviewCount = newReviewCount;
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Product rating updated successfully',
      newRating,
      newReviewCount
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product rating',
      error: error.message
    });
  }
};