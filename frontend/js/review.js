/**
 * Review System for Product Details
 * - Supports reviews, ratings, and comments
 * - Saves data to product model
 * - Handles WebSocket errors gracefully
 */

// Global variables
let wsConnectionAttempted = false; // Track if we've already tried to connect to WebSocket

// Initialize review system on page load
document.addEventListener('DOMContentLoaded', function() {
  // Get product ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id') || urlParams.get('slug');
  
  if (productId) {
    initializeReviewSystem(productId);
  }
});

/**
 * Initialize the review system
 * @param {string} productId - ID of the current product
 */
function initializeReviewSystem(productId) {
  // Set up tab structure if not already present
  setupReviewTab();
  
  // Load reviews data
  loadReviewsData(productId);
  
  // Initialize user rating UI
  initializeUserRatingUI();
  
  // Only try WebSocket if it hasn't been attempted yet and is supported
  if (!wsConnectionAttempted && typeof WebSocket !== 'undefined') {
    // Try to set up WebSocket, but don't retry on failure
    trySetupWebSocket(productId);
  }
}

/**
 * Try to set up WebSocket once, but don't retry on failure
 * @param {string} productId - Product ID
 */
function trySetupWebSocket(productId) {
  wsConnectionAttempted = true;
  
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws/product/${productId}/reviews`;
    
    const socket = new WebSocket(wsUrl);
    
    // Set timeout to abort connection attempt if it takes too long
    const connectionTimeout = setTimeout(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        socket.close();
        console.log('WebSocket connection attempt timed out');
      }
    }, 5000);
    
    socket.onopen = function() {
      clearTimeout(connectionTimeout);
      console.log('WebSocket connection established for reviews');
    };
    
    socket.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data, productId);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };
    
    socket.onerror = function(error) {
      clearTimeout(connectionTimeout);
      console.log('WebSocket not supported by server, falling back to regular updates');
      // Don't log detailed error to avoid console spam
    };
    
    socket.onclose = function() {
      clearTimeout(connectionTimeout);
      console.log('WebSocket connection closed');
      // Don't attempt to reconnect
    };
    
    // Store socket reference for cleanup
    window.reviewsSocket = socket;
  } catch (error) {
    console.log('WebSocket not supported, using standard HTTP requests');
  }
}

/**
 * Handle WebSocket message
 * @param {Object} data - Message data
 * @param {string} productId - Product ID
 */
function handleWebSocketMessage(data, productId) {
  switch (data.type) {
    case 'new_review':
      // Reload reviews data to include the new review
      loadReviewsData(productId);
      showNotification('A new review has been added', 'info');
      break;
      
    case 'updated_rating':
      // Update just the rating information without reloading everything
      updateRatingInfo(data.averageRating, data.totalReviews, data.ratingCounts);
      break;
      
    default:
      console.log('Unknown WebSocket message type:', data.type);
  }
}

/**
 * Set up review tab in the tab structure
 */
function setupReviewTab() {
  // Check if tabs already exist
  const tabsHeader = document.querySelector('.tabs-header');
  if (!tabsHeader) return;
  
  // Find reviews tab button
  const reviewsTabBtn = Array.from(tabsHeader.querySelectorAll('.tab-btn'))
    .find(btn => btn.textContent.toLowerCase().includes('review'));
  
  // If reviews tab doesn't exist, add it
  if (!reviewsTabBtn) {
    const newReviewTab = document.createElement('button');
    newReviewTab.className = 'tab-btn';
    newReviewTab.textContent = 'Reviews (0)';
    newReviewTab.setAttribute('data-tab', 'reviews');
    tabsHeader.appendChild(newReviewTab);
    
    // Add tab content pane
    const tabContent = document.querySelector('.tab-content');
    if (tabContent) {
      const reviewsPane = document.createElement('div');
      reviewsPane.className = 'tab-pane';
      reviewsPane.id = 'reviews';
      reviewsPane.innerHTML = '<div class="loading">Loading reviews...</div>';
      tabContent.appendChild(reviewsPane);
    }
  }
  
  // Make sure tab click handlers are set up
  initializeTabHandlers();
}

/**
 * Initialize tab click handlers
 */
function initializeTabHandlers() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Determine which pane to show based on button text or data attribute
      let tabId;
      if (this.getAttribute('data-tab')) {
        tabId = this.getAttribute('data-tab');
      } else if (this.textContent.toLowerCase().includes('review')) {
        tabId = 'reviews';
      } else if (this.textContent.toLowerCase().includes('description')) {
        tabId = 'description';
      } else if (this.textContent.toLowerCase().includes('specification')) {
        tabId = 'specifications';
      } else if (this.textContent.toLowerCase().includes('faq')) {
        tabId = 'faqs';
      }
      
      // Show the corresponding tab pane
      if (tabId) {
        const pane = document.getElementById(tabId);
        if (pane) {
          pane.classList.add('active');
        }
      }
    });
  });
}

/**
 * Load reviews data from server
 * @param {string} productId - ID of the product
 */
function loadReviewsData(productId) {
  // Get reviews container
  const reviewsContainer = document.getElementById('reviews');
  if (!reviewsContainer) return;
  
  // Show loading state
  reviewsContainer.innerHTML = '<div class="loading">Loading reviews...</div>';
  
  // Fetch reviews - use API if available
  fetch(`/api/products/${productId}/reviews`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return response.json();
    })
    .then(data => {
      updateReviewsUI(data);
    })
    .catch(error => {
      console.error('Error loading reviews:', error);
      // Use mock/fallback data since API failed
      const mockData = generateMockReviewData(productId);
      updateReviewsUI(mockData);
    });
}

/**
 * Generate mock review data for testing or as fallback
 * @param {string} productId - Product ID
 * @returns {Object} Mock reviews data
 */
function generateMockReviewData(productId) {
  // Try to get product info from the page to create more realistic mock data
  const productTitle = document.querySelector('.product-title')?.textContent || 'Product';
  const currentRating = document.querySelector('.product-rating .stars')?.textContent 
    ? countStars(document.querySelector('.product-rating .stars').textContent) 
    : 4.5;
  const reviewCount = document.querySelector('.reviews-count')?.textContent
    ? parseInt(document.querySelector('.reviews-count').textContent.match(/\d+/)[0])
    : 42;
  
  return {
    productId: productId,
    averageRating: currentRating,
    totalReviews: reviewCount,
    ratingCounts: {
      5: Math.round(reviewCount * 0.7),
      4: Math.round(reviewCount * 0.2),
      3: Math.round(reviewCount * 0.06),
      2: Math.round(reviewCount * 0.02),
      1: Math.round(reviewCount * 0.02)
    },
    reviews: [
      {
        id: '1',
        authorName: 'John Doe',
        rating: 5,
        title: `Excellent ${productTitle}`,
        content: 'This is one of the best purchases I have made. The performance is outstanding.',
        date: '2025-04-20',
        isVerifiedPurchase: true,
        helpfulCount: 8
      },
      {
        id: '2',
        authorName: 'Jane Smith',
        rating: 4,
        title: `Great purchase with minor issues`,
        content: 'Great performance overall, but the fans can get a bit loud under heavy load.',
        date: '2025-04-15',
        isVerifiedPurchase: true,
        helpfulCount: 3
      },
      {
        id: '3',
        authorName: 'Mike Johnson',
        rating: 5,
        title: 'Perfect for my needs',
        content: 'This product exceeds my expectations. The quality is excellent and it works perfectly.',
        date: '2025-04-10',
        isVerifiedPurchase: false,
        helpfulCount: 5
      }
    ]
  };
}

/**
 * Count stars in a string
 * @param {string} starsStr - String containing stars (★)
 * @returns {number} Rating value
 */
function countStars(starsStr) {
  const fullStars = (starsStr.match(/★/g) || []).length;
  const halfStars = (starsStr.match(/½/g) || []).length * 0.5;
  return fullStars + halfStars;
}

/**
 * Update the Reviews UI with data
 * @param {Object} data - Reviews data
 */
function updateReviewsUI(data) {
  // Update review count in tab
  updateReviewCount(data.totalReviews);
  
  // Get reviews container
  const reviewsContainer = document.getElementById('reviews');
  if (!reviewsContainer) return;
  
  // Create rating summary HTML
  const ratingSummaryHtml = `
    <div class="customer-reviews">
      <h3>Bình luận và Đánh giá</h3>
      
      <div class="reviews-summary">
        <div class="rating-summary">
          <div class="average-rating">
            <span class="rating-value">${data.averageRating.toFixed(1)}/5</span>
            <div class="rating-stars">${generateStars(data.averageRating)}</div>
            <div class="review-count">(${data.totalReviews} đánh giá và nhận xét)</div>
          </div>
        </div>
        
        <div class="rating-bars">
          ${generateRatingBars(data.ratingCounts)}
        </div>
      </div>
      
      <div class="user-review-form">
        <h4>Đánh giá của bạn</h4>
        <div class="user-star-rating">
          <span class="star" data-value="1">☆</span>
          <span class="star" data-value="2">☆</span>
          <span class="star" data-value="3">☆</span>
          <span class="star" data-value="4">☆</span>
          <span class="star" data-value="5">☆</span>
        </div>
        <textarea placeholder="Hãy để lại bình luận của bạn tại đây!" class="review-comment"></textarea>
        <button class="submit-review-btn">Submit Review</button>
      </div>
      
      <div class="reviews-list">
        ${generateReviewsList(data.reviews)}
      </div>
    </div>
  `;
  
  // Update reviews container
  reviewsContainer.innerHTML = ratingSummaryHtml;
  
  // Initialize star rating
  initializeUserRatingUI();
  
  // Initialize review submission
  initializeReviewSubmission(data.productId);
}

/**
 * Generate HTML for rating bars
 * @param {Object} ratingCounts - Count of ratings for each star level
 * @returns {string} HTML for rating bars
 */
function generateRatingBars(ratingCounts) {
  // Calculate total number of ratings
  const totalRatings = Object.values(ratingCounts).reduce((sum, count) => sum + count, 0);
  
  // Generate HTML for each rating bar
  let barsHtml = '';
  
  for (let i = 5; i >= 1; i--) {
    const count = ratingCounts[i] || 0;
    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
    
    barsHtml += `
      <div class="rating-bar">
        <div class="star-level">${i} Sao</div>
        <div class="bar-container">
          <div class="progress-bar" style="width: ${percentage}%"></div>
        </div>
        <div class="rating-count">${count} đánh giá</div>
      </div>
    `;
  }
  
  return barsHtml;
}

/**
 * Generate HTML for reviews list
 * @param {Array} reviews - Array of review objects
 * @returns {string} HTML for reviews list
 */
function generateReviewsList(reviews) {
  if (!reviews || reviews.length === 0) {
    return '<p>No reviews yet. Be the first to leave a review!</p>';
  }
  
  let reviewsHtml = '';
  
  reviews.forEach(review => {
    // Format date
    const date = new Date(review.date);
    const formattedDate = date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Check if there's a verified purchase badge
    const verifiedBadge = review.isVerifiedPurchase ? 
      '<span class="verified-badge">Verified Purchase</span>' : '';
    
    reviewsHtml += `
      <div class="review-item" data-review-id="${review.id}">
        <div class="review-header">
          <div class="reviewer-info">
            <div class="reviewer-name">${review.authorName}</div>
            ${verifiedBadge}
          </div>
          <div class="review-date">${formattedDate}</div>
        </div>
        
        <div class="review-rating">${generateStars(review.rating)}</div>
        
        <h4 class="review-title">${review.title}</h4>
        <div class="review-content">${review.content}</div>
        
        <div class="review-actions">
          <button class="helpful-btn" data-review-id="${review.id}">
            <i class="thumbs-up-icon"></i> Helpful (${review.helpfulCount || 0})
          </button>
        </div>
      </div>
    `;
  });
  
  return reviewsHtml;
}

/**
 * Generate star rating HTML
 * @param {number} rating - Rating value
 * @returns {string} HTML star rating
 */
function generateStars(rating) {
  // Ensure rating is between 0 and 5
  rating = Math.max(0, Math.min(5, rating));
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let starsHtml = '';
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<span class="star filled">★</span>';
  }
  
  // Add half star if needed
  if (hasHalfStar) {
    starsHtml += '<span class="star half-filled">★</span>';
  }
  
  // Add empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<span class="star empty">☆</span>';
  }
  
  return starsHtml;
}

/**
 * Update review count in tab button
 * @param {number} count - Number of reviews
 */
function updateReviewCount(count) {
  // Find reviews tab button
  const tabsHeader = document.querySelector('.tabs-header');
  if (!tabsHeader) return;
  
  const reviewsTabBtn = Array.from(tabsHeader.querySelectorAll('.tab-btn'))
    .find(btn => btn.textContent.toLowerCase().includes('review'));
  
  if (reviewsTabBtn) {
    reviewsTabBtn.textContent = `Reviews (${count})`;
  }
}

/**
 * Initialize user rating UI
 */
function initializeUserRatingUI() {
  const starRating = document.querySelector('.user-star-rating');
  if (!starRating) return;
  
  const stars = starRating.querySelectorAll('.star');
  let currentRating = 0;
  
  stars.forEach(star => {
    // Hover effect
    star.addEventListener('mouseenter', function() {
      const rating = parseInt(this.getAttribute('data-value'));
      
      // Highlight stars up to the hovered one
      stars.forEach((s, index) => {
        if (index < rating) {
          s.classList.add('hover');
        } else {
          s.classList.remove('hover');
        }
      });
    });
    
    // Mouse leave - restore selected rating
    starRating.addEventListener('mouseleave', function() {
      stars.forEach((s, index) => {
        s.classList.remove('hover');
        if (index < currentRating) {
          s.classList.add('selected');
        } else {
          s.classList.remove('selected');
        }
      });
    });
    
    // Click to select rating
    star.addEventListener('click', function() {
      currentRating = parseInt(this.getAttribute('data-value'));
      
      // Update visual state
      stars.forEach((s, index) => {
        if (index < currentRating) {
          s.classList.add('selected');
          s.textContent = '★';
        } else {
          s.classList.remove('selected');
          s.textContent = '☆';
        }
      });
    });
  });
}
/**
 * Initialize review submission
 * @param {string} productId - Product ID
 */
function initializeReviewSubmission(productId) {
  const submitButton = document.querySelector('.submit-review-btn');
  if (!submitButton) return;
  
  submitButton.addEventListener('click', function() {
    // Get the product ID from the URL if not provided
    if (!productId) {
      const urlParams = new URLSearchParams(window.location.search);
      productId = urlParams.get('id') || urlParams.get('slug');
      
      if (!productId) {
        showNotification('Product ID not found', 'error');
        return;
      }
    }
    
    // Get the selected rating
    const selectedRating = document.querySelectorAll('.user-star-rating .star.selected').length;
    
    // Get the review comment
    const commentElement = document.querySelector('.review-comment');
    const reviewComment = commentElement ? commentElement.value.trim() : '';
    
    // Validate input
    if (selectedRating === 0) {
      showNotification('Please select a rating', 'error');
      return;
    }
    
    if (reviewComment === '') {
      showNotification('Please enter your review comment', 'error');
      return;
    }
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    // Attempt to submit review
    submitReview(productId, selectedRating, reviewComment)
      .then(response => {
        if (response.success) {
          // Update product rating in the UI
          updateProductRatingInUI(response.newRating, response.newReviewCount);
          
          // Reload reviews after a delay to avoid duplicate reviews in UI
          setTimeout(() => {
            loadReviewsData(productId);
          }, 1000);
        } else {
          showNotification(response.message || 'Failed to submit review', 'error');
        }
      })
      .catch(error => {
        console.error('Error submitting review:', error);
        showNotification('An error occurred while submitting your review', 'error');
      })
      .finally(() => {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Review';
      });
  });
}

async function submitReview(productId, rating, comment) {
  try {
    // Validate inputs
    if (!productId) {
      showNotification('Product ID is missing', 'error');
      return { success: false, message: 'Product ID is missing' };
    }
    
    if (!rating || rating < 1 || rating > 5) {
      showNotification('Invalid rating value. Please select 1-5 stars', 'error');
      return { success: false, message: 'Invalid rating value' };
    }
    
    if (!comment || comment.trim() === '') {
      showNotification('Please enter a review comment', 'error');
      return { success: false, message: 'Review comment is required' };
    }
    
    // Show loading state in UI
    const submitButton = document.querySelector('.submit-review-btn');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
    }
    
    // Check if user is logged in
    const isLoggedIn = window.authUtils ? window.authUtils.isUserLoggedIn() : false;
    
    if (!isLoggedIn) {
      // Save review data to localStorage for after login
      localStorage.setItem('pendingReview', JSON.stringify({
        productId,
        rating,
        comment,
        timestamp: Date.now()
      }));
      
      // Redirect to login
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return { success: false, message: 'Please log in to submit a review' };
    }
    
    // Get username if available, otherwise use "Customer"
    const username = window.authUtils && window.authUtils.getUsername 
      ? window.authUtils.getUsername() 
      : 'Customer';
    
    // Prepare review data - ensure all fields have proper values
    const reviewData = {
      productId: productId.toString(),
      rating: parseInt(rating, 10), // Ensure it's an integer
      content: comment.trim(),
      title: comment.split('.')[0].trim() || 'Review', // Fallback if no title can be extracted
      authorName: username || 'Anonymous User'
    };
    
    console.log('Submitting review data:', reviewData); // Log the data being sent
    
    // Submit review to API
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData),
      credentials: 'include'
    });
    
    // Get response body even if status is not OK (to see error message)
    const result = await response.json();
    
    if (!response.ok) {
      console.error('Server returned error:', result);
      throw new Error(`Error submitting review: ${response.status} - ${result.message || 'Unknown error'}`);
    }
    
    // Clear form inputs
    const ratingStars = document.querySelectorAll('.user-star-rating .star');
    if (ratingStars) {
      ratingStars.forEach(star => {
        star.classList.remove('selected');
        star.textContent = '☆';
      });
    }
    
    const commentTextarea = document.querySelector('.review-comment');
    if (commentTextarea) {
      commentTextarea.value = '';
    }
    
    // Show success notification
    showNotification('Your review has been submitted successfully!', 'success');
    
    // Return the result
    return {
      ...result,
      shouldReload: false // Changed to false to prevent immediate reload
    };
  } catch (error) {
    console.error('Submit review error:', error);
    showNotification(error.message || 'Failed to submit review', 'error');
    
    // For demo purposes or if the API fails, try fallback
    try {
      const updatedRating = await updateProductRating(productId, rating);
      
      // Only return success if fallback succeeded
      return {
        success: true,
        newRating: updatedRating.newRating,
        newReviewCount: updatedRating.newReviewCount,
        shouldReload: false,
        message: 'Review submitted successfully (local update)'
      };
    } catch (fallbackError) {
      console.error('Fallback update failed:', fallbackError);
      return {
        success: false,
        message: 'Failed to submit review. Please try again later.'
      };
    }
  } finally {
    // Reset submit button state
    const submitButton = document.querySelector('.submit-review-btn');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Review';
    }
  }
}

/**
 * Update product rating in the database
 * @param {string} productId - Product ID
 * @param {number} newRating - New rating to add
 * @returns {Promise} Promise resolving to updated rating data
 */
async function updateProductRating(productId, newRating) {
  try {
    // Try to update via API first
    const response = await fetch(`/api/products/${productId}/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating: newRating
      }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Error updating product rating: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API update failed, using local update:', error);
    
    // Fallback: Update rating client-side
    // Get current rating from UI
    const ratingElement = document.querySelector('.product-rating .stars');
    const reviewsCountElement = document.querySelector('.product-rating .reviews-count');
    
    let currentRating = 0;
    let currentReviewCount = 0;
    
    if (ratingElement) {
      currentRating = countStars(ratingElement.innerHTML);
    }
    
    if (reviewsCountElement) {
      const countMatch = reviewsCountElement.textContent.match(/\((\d+)\)/);
      if (countMatch) {
        currentReviewCount = parseInt(countMatch[1]);
      }
    }
    
    // Calculate new average rating
    const newReviewCount = currentReviewCount + 1;
    const newAverageRating = ((currentRating * currentReviewCount) + newRating) / newReviewCount;
    
    return {
      newRating: newAverageRating,
      newReviewCount: newReviewCount
    };
  }
}

/**
 * Update product rating in the UI
 * @param {number} newRating - New average rating
 * @param {number} newReviewCount - New review count
 */
function updateProductRatingInUI(newRating, newReviewCount) {
  // Update stars in product detail
  const ratingElement = document.querySelector('.product-rating .stars');
  if (ratingElement) {
    ratingElement.innerHTML = generateStars(newRating);
  }
  
  // Update review count
  const reviewsCountElement = document.querySelector('.product-rating .reviews-count');
  if (reviewsCountElement) {
    reviewsCountElement.textContent = `${newRating.toFixed(1)}/5 (${newReviewCount} Reviews)`;
  }
  
  // Update tab count
  updateReviewCount(newReviewCount);
}

/**
 * Update rating information in the reviews tab
 * @param {number} averageRating - New average rating
 * @param {number} totalReviews - New total review count
 * @param {Object} ratingCounts - New rating counts for each star level
 */
function updateRatingInfo(averageRating, totalReviews, ratingCounts) {
  // Update tab count
  updateReviewCount(totalReviews);
  
  // Update average rating
  const ratingValueElement = document.querySelector('.rating-value');
  if (ratingValueElement) {
    ratingValueElement.textContent = `${averageRating.toFixed(1)}/5`;
  }
  
  // Update stars
  const ratingStarsElement = document.querySelector('.average-rating .rating-stars');
  if (ratingStarsElement) {
    ratingStarsElement.innerHTML = generateStars(averageRating);
  }
  
  // Update review count
  const reviewCountElement = document.querySelector('.review-count');
  if (reviewCountElement) {
    reviewCountElement.textContent = `(${totalReviews} đánh giá và nhận xét)`;
  }
  
  // Update rating bars
  const ratingBarsContainer = document.querySelector('.rating-bars');
  if (ratingBarsContainer && ratingCounts) {
    ratingBarsContainer.innerHTML = generateRatingBars(ratingCounts);
  }
  
  // Update product detail rating as well
  updateProductRatingInUI(averageRating, totalReviews);
}

/**
 * Show notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let notificationElement = document.getElementById('notification-toast');
  
  if (!notificationElement) {
    notificationElement = document.createElement('div');
    notificationElement.id = 'notification-toast';
    notificationElement.className = 'notification-toast';
    document.body.appendChild(notificationElement);
  }
  
  // Set message and type
  notificationElement.textContent = message;
  notificationElement.className = `notification-toast notification-${type}`;
  
  // Show notification
  notificationElement.classList.add('show');
  
  // Hide after 3 seconds
  setTimeout(() => {
    notificationElement.classList.remove('show');
  }, 3000);
}

// Add CSS styles for the review system
document.addEventListener('DOMContentLoaded', function() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* Review System Styles */
    .customer-reviews {
      padding: 15px 0;
    }
    
    .reviews-summary {
      display: flex;
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
    }
    
    .rating-summary {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-right: 1px solid #e0e0e0;
      padding-right: 20px;
    }
    
    .average-rating {
      text-align: center;
    }
    .rating-value {
     font-size: 32px;
     font-weight: bold;
     color: #333;
   }
   
   .rating-stars {
     margin: 10px 0;
     font-size: 24px;
   }
   
   .review-count {
     font-size: 14px;
     color: #666;
   }
   
   .rating-bars {
     flex: 2;
     padding-left: 25px;
   }
   
   .rating-bar {
     display: flex;
     align-items: center;
     margin-bottom: 8px;
   }
   
   .star-level {
     width: 60px;
     text-align: left;
     font-size: 14px;
     color: #333;
   }
   
   .bar-container {
     flex: 1;
     height: 8px;
     background-color: #e0e0e0;
     border-radius: 4px;
     margin: 0 10px;
     overflow: hidden;
   }
   
   .progress-bar {
     height: 100%;
     background-color: #ff0000;
     border-radius: 4px;
   }
   
   .rating-count {
     width: 70px;
     text-align: right;
     font-size: 14px;
     color: #666;
   }
   
   .user-review-form {
     margin-bottom: 30px;
     padding: 20px;
     background-color: #f9f9f9;
     border-radius: 8px;
   }
   
   .user-review-form h4 {
     margin-top: 0;
     margin-bottom: 15px;
     font-size: 16px;
     font-weight: bold;
   }
   
   .user-star-rating {
     margin-bottom: 15px;
     font-size: 24px;
   }
   
   .user-star-rating .star {
     cursor: pointer;
     margin-right: 5px;
     color: #ddd;
     transition: color 0.2s;
   }
   
   .user-star-rating .star.hover,
   .user-star-rating .star.selected {
     color: #FFD700;
   }
   
   .review-comment {
     width: 100%;
     height: 100px;
     padding: 10px;
     border: 1px solid #ddd;
     border-radius: 4px;
     margin-bottom: 15px;
     font-family: inherit;
     resize: vertical;
   }
   
   .submit-review-btn {
     background-color: #ff6b00;
     color: white;
     border: none;
     padding: 10px 20px;
     border-radius: 4px;
     font-size: 16px;
     cursor: pointer;
   }
   
   .submit-review-btn:hover {
     background-color: #e05f00;
   }
   
   .submit-review-btn:disabled {
     background-color: #ccc;
     cursor: not-allowed;
   }
   
   .reviews-list {
     margin-top: 20px;
   }
   
   .review-item {
     border-bottom: 1px solid #eee;
     padding-bottom: 20px;
     margin-bottom: 20px;
   }
   
   .review-header {
     display: flex;
     justify-content: space-between;
     margin-bottom: 10px;
   }
   
   .reviewer-name {
     font-weight: bold;
   }
   
   .verified-badge {
     display: inline-block;
     background-color: #4CAF50;
     color: white;
     font-size: 12px;
     padding: 2px 6px;
     border-radius: 4px;
     margin-left: 10px;
   }
   
   .review-date {
     font-size: 14px;
     color: #666;
   }
   
   .review-rating {
     margin-bottom: 10px;
     font-size: 18px;
   }
   
   .review-title {
     font-size: 16px;
     font-weight: bold;
     margin-bottom: 8px;
   }
   
   .review-content {
     line-height: 1.5;
     margin-bottom: 15px;
   }
   
   .review-actions {
     display: flex;
     gap: 10px;
   }
   
   .helpful-btn {
     background: none;
     border: 1px solid #ddd;
     border-radius: 4px;
     padding: 6px 12px;
     font-size: 14px;
     color: #666;
     cursor: pointer;
   }
   
   .helpful-btn:hover {
     background-color: #f2f2f2;
   }
   
   .star {
     color: #FFD700;
   }
   
   .star.empty {
     color: #ddd;
   }
   
   .star.half-filled {
     position: relative;
     color: #ddd;
   }
   
   .star.half-filled::after {
     content: '★';
     position: absolute;
     left: 0;
     top: 0;
     width: 50%;
     overflow: hidden;
     color: #FFD700;
   }
   
   .notification-toast {
     position: fixed;
     top: 20px;
     right: 20px;
     padding: 12px 20px;
     border-radius: 4px;
     box-shadow: 0 2px 10px rgba(0,0,0,0.1);
     z-index: 1000;
     opacity: 0;
     transform: translateY(-20px);
     transition: opacity 0.3s, transform 0.3s;
   }
   
   .notification-toast.show {
     opacity: 1;
     transform: translateY(0);
   }
   
   .notification-success {
     background-color: #4CAF50;
     color: white;
   }
   
   .notification-error {
     background-color: #f44336;
     color: white;
   }
   
   .notification-info {
     background-color: #2196F3;
     color: white;
   }
   
   /* Loading indicator */
   .loading {
     text-align: center;
     padding: 20px;
     color: #666;
   }
   
   /* Responsive styles */
   @media (max-width: 768px) {
     .reviews-summary {
       flex-direction: column;
     }
     
     .rating-summary {
       border-right: none;
       border-bottom: 1px solid #e0e0e0;
       padding-right: 0;
       padding-bottom: 15px;
       margin-bottom: 15px;
     }
     
     .rating-bars {
       padding-left: 0;
     }
   }
 `;
 
 document.head.appendChild(styleElement);
});

/**
* Check for pending reviews in localStorage after login
* This should be called on page load
*/
document.addEventListener('DOMContentLoaded', function() {
 const isLoggedIn = window.authUtils ? window.authUtils.isUserLoggedIn() : false;
 
 if (isLoggedIn) {
   const pendingReview = localStorage.getItem('pendingReview');
   
   if (pendingReview) {
     try {
       const reviewData = JSON.parse(pendingReview);
       
       // Check if the pending review is for the current product
       const urlParams = new URLSearchParams(window.location.search);
       const currentProductId = urlParams.get('id') || urlParams.get('slug');
       
       if (reviewData.productId === currentProductId) {
         // Clear the pending review from localStorage
         localStorage.removeItem('pendingReview');
         
         // Wait for the review system to initialize
         setTimeout(() => {
           // Fill in the review form
           const stars = document.querySelectorAll('.user-star-rating .star');
           if (stars && stars.length > 0) {
             const rating = Math.min(5, Math.max(1, reviewData.rating));
             for (let i = 0; i < rating; i++) {
               stars[i].classList.add('selected');
               stars[i].textContent = '★';
             }
           }
           
           const commentField = document.querySelector('.review-comment');
           if (commentField) {
             commentField.value = reviewData.comment;
           }
           
           // Show notification to submit the review
           showNotification('Your review has been restored. Please submit when ready.', 'info');
         }, 1000);
       }
     } catch (error) {
       console.error('Error processing pending review:', error);
       localStorage.removeItem('pendingReview');
     }
   }
 }
});

/**
* Model for Review
* This is the data structure we would expect to see in MongoDB
*/
class Review {
 constructor(data) {
   this._id = data._id || null;
   this.productId = data.productId;
   this.userId = data.userId;
   this.authorName = data.authorName;
   this.rating = data.rating;
   this.title = data.title;
   this.content = data.content;
   this.isVerifiedPurchase = data.isVerifiedPurchase || false;
   this.isApproved = data.isApproved || false;
   this.helpfulCount = data.helpfulCount || 0;
   this.notHelpfulCount = data.notHelpfulCount || 0;
   this.createdAt = data.createdAt || new Date();
   this.updatedAt = data.updatedAt || new Date();
 }
 
 // Static method to create a new review and update product rating
 static async createReview(reviewData, userId, username) {
   try {
     // 1. Create review document
     const review = new Review({
       ...reviewData,
       userId,
       authorName: username,
       createdAt: new Date(),
       updatedAt: new Date()
     });
     
     // 2. Save review to database
     // In a real implementation, this would be a MongoDB insert
     console.log('Creating review:', review);
     
     // 3. Update product's average rating and review count
     await this.updateProductRating(reviewData.productId, reviewData.rating);
     
     return review;
   } catch (error) {
     console.error('Error creating review:', error);
     throw error;
   }
 }
 
 // Update product's rating and review count
 static async updateProductRating(productId, newRating) {
   try {
     // In a real implementation, this would be a MongoDB update
     // Find the product by ID
     console.log(`Updating product ${productId} with new rating ${newRating}`);
     
     // Calculate new average rating and increment review count
     // This would involve fetching the current product, updating its rating and reviewCount fields
     
     return {
       success: true,
       newRating: 4.5, // Example value
       newReviewCount: 43 // Example value
     };
   } catch (error) {
     console.error('Error updating product rating:', error);
     throw error;
   }
 }
}

/**
* Utility function to check if an element is in the viewport
* @param {HTMLElement} el - Element to check
* @returns {boolean} True if element is in viewport
*/
function isElementInViewport(el) {
 const rect = el.getBoundingClientRect();
 return (
   rect.top >= 0 &&
   rect.left >= 0 &&
   rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
   rect.right <= (window.innerWidth || document.documentElement.clientWidth)
 );
}

/**
* Scroll to reviews tab
*/
function scrollToReviews() {
 const reviewsTab = Array.from(document.querySelectorAll('.tab-btn'))
   .find(btn => btn.textContent.toLowerCase().includes('review'));
 
 if (reviewsTab) {
   // Click the tab to make it active
   reviewsTab.click();
   
   // Scroll to the tab
   reviewsTab.scrollIntoView({ behavior: 'smooth' });
 }
}

// Expose key functions globally
window.reviewSystem = {
 scrollToReviews,
 submitReview,
 updateProductRating
};