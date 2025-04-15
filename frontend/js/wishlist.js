document.addEventListener('DOMContentLoaded', function() {
  // Check authentication and redirect if not logged in
  if (!window.authUtils || !window.authUtils.isUserLoggedIn()) {
      window.location.href = '/login.html?redirect=wishlist.html';
      return;
  }
  
  // Update header links
  updateHeaderLinks();
  
  // Load wishlist items
  loadWishlist();
  
  // Setup clear wishlist button
  const clearWishlistBtn = document.getElementById('clear-wishlist');
  clearWishlistBtn?.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your entire wishlist?')) {
          clearWishlist();
      }
  });
});

function updateHeaderLinks() {
  const loginLink = document.getElementById('login-link');
  const registerLink = document.getElementById('register-link');
  const accountLink = document.getElementById('account-link');
  
  const isLoggedIn = window.authUtils && window.authUtils.isUserLoggedIn();
  
  if (loginLink) loginLink.style.display = isLoggedIn ? 'none' : 'inline-block';
  if (registerLink) registerLink.style.display = isLoggedIn ? 'none' : 'inline-block';
  if (accountLink) accountLink.style.display = isLoggedIn ? 'inline-block' : 'none';
}

function loadWishlist() {
  const wishlistContent = document.getElementById('wishlist-content');
  wishlistContent.innerHTML = '<div class="loading">Loading your wishlist...</div>';
  
  fetch('/api/wishlist', {
    credentials: 'include' // Important for sending cookies/session
  })
  .then(response => {
    if (!response.ok) {
      // Handle non-200 responses
      throw new Error('Failed to fetch wishlist');
    }
    return response.json();
  })
  .then(data => {
    console.log('Wishlist data (raw):', JSON.stringify(data)); // Log the full raw data
    
    if (data.success) {
      // Check if wishlist exists and has items
      const wishlistItems = data.wishlist && data.wishlist.items ? data.wishlist.items : [];
      
      console.log('Wishlist items:', wishlistItems.map(item => ({
        name: item.name,
        product: item.product,
        _id: item._id
      })));
      
      if (wishlistItems.length > 0) {
        renderWishlistItems(wishlistItems);
      } else {
        renderEmptyWishlist();
      }
    } else {
      // Handle unsuccessful response
      throw new Error(data.message || 'Unable to load wishlist');
    }
  })
  .catch(error => {
    console.error('Error loading wishlist:', error);
    
    // Display error message
    const wishlistContent = document.getElementById('wishlist-content');
    wishlistContent.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 20px; background-color: #ffebee; border-radius: 8px; margin: 20px 0; color: #c62828;">
        <p>Failed to load wishlist: ${error.message}</p>
        <button onclick="loadWishlist()" style="padding: 8px 16px; background-color: #ff6b00; color: white; border: none; border-radius: 4px; margin-top: 10px; cursor: pointer;">Try Again</button>
      </div>
    `;
  });
}

function renderWishlistItems(items) {
  const wishlistContent = document.getElementById('wishlist-content');
  
  // Create a modern styled container
  const container = document.createElement('div');
  container.style.cssText = 'width: 100%;';
  
  // Create a card grid
  const wishlistGrid = document.createElement('div');
  wishlistGrid.className = 'wishlist-grid';
  wishlistGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px;';
  
  // Filter out any null or invalid items
  const validItems = items.filter(item => item !== null && item.name);
  
  if (validItems.length === 0) {
    renderEmptyWishlist();
    return;
  }
  
  validItems.forEach(item => {
    // Get the proper product ID safely
    let productId;
    
    // If item has an _id, use that
    if (item._id) {
      productId = item._id;
    }
    // Otherwise if item.product is an object with _id, use that
    else if (item.product && typeof item.product === 'object' && item.product._id) {
      productId = item.product._id;
    }
    // Otherwise use item.product directly if it's not null
    else if (item.product) {
      productId = item.product;
    }
    // Last resort - use a temporary ID if nothing else works
    else {
      productId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      console.warn('Using temporary ID for wishlist item:', item.name);
    }
    
    console.log(`Item ${item.name} using productId: ${productId}`);
    
    // Create a card for each item
    const card = document.createElement('div');
    card.className = 'wishlist-item';
    card.style.cssText = 'border: 1px solid #eee; border-radius: 8px; overflow: hidden; transition: all 0.3s ease; background-color: white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);';
    
    // Create card content
    card.innerHTML = `
      <div class="item-image" style="height: 200px; overflow: hidden; display: flex; justify-content: center; align-items: center;">
        <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: contain;">
      </div>
      <div class="item-info" style="padding: 20px;">
        <h3 class="item-name" style="font-size: 18px; margin: 0 0 10px 0; color: #333; font-weight: bold;">${item.name}</h3>
        <div class="item-price" style="font-size: 20px; color: #ff6b00; margin-bottom: 15px; font-weight: bold;">${formatCurrency(item.price)}</div>
        <div class="item-actions" style="display: flex; gap: 10px;">
          <button class="add-to-cart" data-product-id="${productId}" data-item-id="${item._id || ''}" 
            style="flex: 1; padding: 10px; background-color: #ff6b00; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
            Add to Cart
          </button>
          <button class="remove-item" data-product-id="${productId}" data-item-id="${item._id || ''}"
            style="padding: 10px; background-color: #f5f5f5; color: #555; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
            Remove
          </button>
        </div>
      </div>
    `;
    
    // Add hover effect
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
    });
    
    wishlistGrid.appendChild(card);
  });
  
  container.appendChild(wishlistGrid);
  wishlistContent.innerHTML = '';
  wishlistContent.appendChild(container);
  
  setupWishlistItemActions();
}
function renderEmptyWishlist() {
  const wishlistContent = document.getElementById('wishlist-content');
  wishlistContent.innerHTML = `
    <div class="empty-wishlist">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </div>
      <h3>Your Wishlist is Empty</h3>
      <p>Looks like you haven't added any items to your wishlist yet.</p>
      <a href="/" class="shop-now-btn">Shop Now</a>
    </div>
  `;
}
function setupWishlistItemActions() {
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
      const productId = this.getAttribute('data-product-id');
      
      // Find the wishlist item container
      const itemContainer = this.closest('.wishlist-item');
      
      // Get product details
      const productName = itemContainer.querySelector('.item-name').textContent;
      const productPriceText = itemContainer.querySelector('.item-price').textContent;
      const productPrice = parseFloat(productPriceText.replace(/[^0-9.-]+/g,''));
      const productImage = itemContainer.querySelector('img').src;
      
      console.log('Adding to cart from wishlist:', {
        productId, 
        name: productName, 
        price: productPrice,
        image: productImage
      });
      
      // Use the addToCartLocal function from cart-js.js
      if (window.cartFunctions && window.cartFunctions.addToCartLocal) {
        try {
          window.cartFunctions.addToCartLocal(productId, productName, productPrice);
          showNotification(productName + ' added to cart!', 'success');
          
          // Update cart count
          if (window.cartFunctions.updateCartCountFromLocalStorage) {
            window.cartFunctions.updateCartCountFromLocalStorage();
          }
        } catch (error) {
          console.error('Error adding to cart:', error);
          showNotification('Error adding product to cart', 'error');
        }
      } else {
        // Fallback if cart functions aren't available
        showNotification('Cart functionality not available', 'error');
      }
    });
  });
  
  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', function() {
      const productId = this.getAttribute('data-product-id');
      removeFromWishlist(productId);
    });
  });
}

function removeFromWishlist(id) {
  if (!id || id === 'null') {
    console.error('Cannot remove: Invalid ID:', id);
    showNotification('Error removing product: Invalid ID', 'error');
    return;
  }

  console.log('Removing product from wishlist with ID:', id);
  
  fetch(`/api/wishlist/remove/${id}`, {
      method: 'DELETE',
      credentials: 'include'
  })
  .then(response => {
      console.log('Remove response status:', response.status);
      return response.json().catch(e => {
        // If can't parse JSON, create a simple object
        if (response.ok) {
          return { success: true };
        } else {
          throw new Error(`Server returned ${response.status}`);
        }
      });
  })
  .then(data => {
      console.log('Remove response data:', data);
      if (data.success) {
          showNotification('Product removed from wishlist!', 'success');
          loadWishlist(); // Reload the wishlist
      } else {
          showNotification(data.message || 'Failed to remove product', 'error');
      }
  })
  .catch(error => {
      console.error('Error removing from wishlist:', error);
      showNotification('Error removing product: ' + error.message, 'error');
  });
}

function clearWishlist() {
  fetch('/api/wishlist/clear', {
      method: 'DELETE',
      credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          showNotification('Wishlist cleared!', 'success');
          loadWishlist();
      } else {
          showNotification('Failed to clear wishlist', 'error');
      }
  })
  .catch(error => {
      console.error('Error clearing wishlist:', error);
      showNotification('Error clearing wishlist', 'error');
  });
}

function addToCart(productId, buttonElement, productName, productPrice, productImage) {
  try {
    // Validate inputs
    if (!productId) {
      console.error('No product ID provided');
      return;
    }

    // Disable button and show loading state
    if (buttonElement) {
      buttonElement.disabled = true;
      buttonElement.textContent = 'Adding...';
    }

    // Use provided data instead of trying to extract it
    const name = productName || 'Unnamed Product';
    const price = productPrice ? parseFloat(productPrice) : 0;
    const image = productImage || '/images/placeholder.jpg';

    // Prepare request data
    const requestData = {
      productId: productId.toString(),
      name: name,
      price: price,
      image: image,
      quantity: 1
    };

    console.log('Adding to cart:', requestData);

    // Send request to add to cart
    fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData),
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.message || 'Failed to add to cart');
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Show success notification
        showNotification(`${name} added to cart!`, 'success');
        
        // Update cart count
        updateCartCount(data.cart.itemCount);
      } else {
        throw new Error(data.message || 'Failed to add to cart');
      }
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
      showNotification(error.message || 'Failed to add to cart', 'error');
    })
    .finally(() => {
      // Re-enable button
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Add to Cart';
      }
    });

  } catch (error) {
    console.error('Unexpected error in addToCart:', error);
    showNotification('An unexpected error occurred', 'error');
    
    // Re-enable button in case of synchronous error
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.textContent = 'Add to Cart';
    }
  }
}

function updateCartCount(count) {
  const cartCountEl = document.querySelector('#cart-count');
  if (cartCountEl) {
    cartCountEl.textContent = count || 0;
  }
}

// Update the button initialization
function initializeAddToCartButtons() {
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  
  addToCartButtons.forEach(button => {
    // Remove any existing event listeners first
    button.removeEventListener('click', handleAddToCart);
    
    // Add new event listener
    button.addEventListener('click', handleAddToCart);
  });
}

// Separate handler function
function handleAddToCart(event) {
  event.preventDefault();
  const productId = this.getAttribute('data-product-id');
  
  if (!productId) {
    console.error('No product ID found on button');
    return;
  }
  
  addToCart(productId, this);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeAddToCartButtons);

function defaultAddToCart(productId, quantity) {
  return fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity }),
      credentials: 'include'
  })
  .then(response => response.json())
  .then(data => data.success);
}

// Add a notification system like in payment methods
function showNotification(message, type = 'info') {
  console.log(`${type.toUpperCase()}: ${message}`);
  
  // Check if notification element exists, create if not
  let notification = document.querySelector('.notification-toast');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 4px; color: white; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.2); display: none;';
    document.body.appendChild(notification);
  }
  
  // Set styling based on notification type
  if (type === 'success') {
    notification.style.backgroundColor = '#4CAF50';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#f44336';
  } else {
    notification.style.backgroundColor = '#2196F3';
  }
  
  // Set content and display
  notification.textContent = message;
  notification.style.display = 'block';
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
  }).format(amount);
}

function displayErrorMessage(message) {
  const wishlistContent = document.getElementById('wishlist-content');
  wishlistContent.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 20px; background-color: #ffebee; border-radius: 8px; margin: 20px 0; color: #c62828;">
          <p>${message}</p>
          <button onclick="loadWishlist()" style="padding: 8px 16px; background-color: #ff6b00; color: white; border: none; border-radius: 4px; margin-top: 10px; cursor: pointer;">Try Again</button>
      </div>
  `;
}