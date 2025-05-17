// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Public routes (no authentication required)
router.get('/products/:productId/reviews', reviewController.getProductReviews);
router.post('/reviews', reviewController.submitReview);
router.post('/products/:productId/rating', reviewController.updateProductRating);

// These routes don't require authentication but may use it if available
router.post('/reviews/:reviewId/helpful', reviewController.markReviewHelpful);
router.post('/reviews/:reviewId/reply', reviewController.addReplyToReview);

module.exports = router;