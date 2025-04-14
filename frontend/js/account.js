

// frontend/js/account.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (window.authUtils && !window.authUtils.isUserLoggedIn()) {
        // If not logged in, redirect to login page
        window.location.href = '/login.html';
        return;
    }
    
    // Load user data into the profile
    loadUserProfile();
    
    // Load order stats for the dashboard
    loadOrderStats();
    
     // Load orders data if we're on the account page
     if (document.querySelector('.recent-orders')) {
        loadRecentOrders();
    }
    
    // Load wishlist items for the Saved Items section
    if (document.querySelector('.saved-items')) {
        loadWishlistItems();
    }
    
    // Logout button functionality
    const logoutButton = document.querySelector('.logout-btn');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Clear any stored data
                    sessionStorage.removeItem('authUser');
                    
                    // Show success notification if available
                    if (typeof window.showNotification === 'function') {
                        window.showNotification('Logged out successfully!', 'success');
                    }
                    
                    // Redirect to home page
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    if (typeof window.showNotification === 'function') {
                        window.showNotification('Logout failed. Please try again.', 'error');
                    } else {
                        alert('Logout failed. Please try again.');
                    }
                }
            })
            .catch(error => {
                console.error('Error during logout:', error);
                if (typeof window.showNotification === 'function') {
                    window.showNotification('An error occurred during logout. Please try again.', 'error');
                } else {
                    alert('An error occurred during logout. Please try again.');
                }
            });
        });
    }
    
    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.cart-btn');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const itemName = this.closest('.saved-item-info').querySelector('.saved-item-name').textContent;
            
            // If showNotification function is available, use it
            if (typeof window.showNotification === 'function') {
                window.showNotification('Added "' + itemName + '" to your cart!', 'success');
            } else {
                alert('Added "' + itemName + '" to your cart.');
            }
        });
    });
    
    // Remove from wishlist functionality
    const removeButtons = document.querySelectorAll('.saved-item-actions button:not(.cart-btn)');
    
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const item = this.closest('.saved-item');
            const itemName = item.querySelector('.saved-item-name').textContent;
            
            if (confirm('Remove "' + itemName + '" from your wishlist?')) {
                item.remove();
                
                if (document.querySelectorAll('.saved-item').length === 0) {
                    document.querySelector('.saved-items').innerHTML = '<p>No items in your wishlist.</p>';
                }
            }
        });
    });
});

function loadOrderStats() {
    const orderCountElement = document.querySelector('.summary-card .summary-value');
    if (!orderCountElement) return;
    
    fetch('/api/orders/recent', {  // Change from /orders/recent to /api/orders/recent
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (response.status === 404) {
            console.log('Orders endpoint not found, using default value');
            // Set a default value if the endpoint doesn't exist yet
            orderCountElement.textContent = '0';
            return { success: false };
        }
        if (!response.ok) {
            throw new Error('Failed to fetch order stats');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Update the order count in the dashboard
            orderCountElement.textContent = data.count;
        }
    })
    .catch(error => {
        console.error('Error fetching order stats:', error);
        // Set a default value as fallback
        orderCountElement.textContent = '0';
    });
}

/**
 * Load user profile data into the account page
 */
function loadUserProfile() {
    // Try to get user data from session storage first for faster loading
    const storedData = sessionStorage.getItem('authUser');
    if (storedData) {
        try {
            const userData = JSON.parse(storedData);
            updateUserInfo(userData);
        } catch (error) {
            console.error('Error parsing auth data:', error);
        }
    }
    
    // Always fetch fresh data from the server to ensure it's up to date
    fetch('/auth/user', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            updateUserInfo(data.user);
            
            // Store updated user data
            sessionStorage.setItem('authUser', JSON.stringify(data.user));
        } else {
            // If API call fails with an error message, show it
            if (data.message && typeof window.showNotification === 'function') {
                window.showNotification(data.message, 'error');
            }
            
            // If authentication failed, redirect to login
            if (response.status === 401) {
                window.location.href = '/login.html';
            }
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        // On error, redirect to login
        window.location.href = '/login.html';
    });
}

/**
 * Update the user info elements on the page
 * @param {Object} userData - User data object
 */
function updateUserInfo(userData) {
    // Update user avatar initial
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar && userData.firstName) {
        userAvatar.textContent = userData.firstName.charAt(0).toUpperCase();
    }
    
    // Update user name
    const userName = document.querySelector('.user-name');
    if (userName) {
        userName.textContent = userData.firstName + ' ' + userData.lastName;
    }
    
    // Update user email
    const userEmail = document.querySelector('.user-email');
    if (userEmail) {
        userEmail.textContent = userData.email;
    }
    
    // Update welcome message
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.textContent = 'Welcome back, ' + userData.firstName + '!';
    }
    
    // Update other elements that might contain user data
    document.querySelectorAll('[data-user-field]').forEach(element => {
        const field = element.dataset.userField;
        if (userData[field]) {
            element.textContent = userData[field];
        }
    });
}

/**
 * Load recent orders from the database
 */
function loadRecentOrders() {
    // Fetch recent orders from your API
    fetch('/api/orders/recent', {  // Change from /orders/recent to /api/orders/recent
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            // If no orders endpoint exists yet, don't show an error
            if (response.status === 404) {
                return { success: false, orders: [] };
            }
            throw new Error('Failed to fetch orders');
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.orders && data.orders.length > 0) {
            updateOrdersDisplay(data.orders);
        } else {
            // Show empty state for orders
            const ordersContainer = document.querySelector('.recent-orders');
            if (ordersContainer) {
                ordersContainer.innerHTML = `
                    <div class="order-row order-header">
                        <div>Order</div>
                        <div>Date</div>
                        <div>Status</div>
                        <div>Total</div>
                        <div></div>
                    </div>
                    <div class="empty-orders" style="padding: 20px; text-align: center;">
                        <p>You don't have any orders yet.</p>
                        <a href="/" style="display: inline-block; margin-top: 10px; padding: 8px 15px; background-color: #ff6b00; color: white; text-decoration: none; border-radius: 4px;">Start Shopping</a>
                    </div>
                `;
            }
        }
    })
    .catch(error => {
        console.error('Error fetching orders:', error);
        // Don't show error to user for better experience
    });
}

/**
 * Update the orders display with actual order data
 * @param {Array} orders - Array of order objects
 */
function updateOrdersDisplay(orders) {
    const ordersContainer = document.querySelector('.recent-orders');
    if (!ordersContainer) return;
    
    // Keep the header row
    const headerRow = ordersContainer.querySelector('.order-header');
    ordersContainer.innerHTML = '';
    
    if (headerRow) {
        ordersContainer.appendChild(headerRow);
    } else {
        // Add header row if it doesn't exist
        ordersContainer.innerHTML = `
            <div class="order-row order-header">
                <div>Order</div>
                <div>Date</div>
                <div>Status</div>
                <div>Total</div>
                <div></div>
            </div>
        `;
    }
    
    // Limit to 3 most recent orders for the dashboard
    const recentOrders = orders.slice(0, 3);
    
    // Add order rows
    recentOrders.forEach(order => {
        // Format date
        const orderDate = new Date(order.createdAt);
        const formattedDate = orderDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Determine status class
        let statusClass = 'status-processing';
        switch(order.status.toLowerCase()) {
            case 'delivered':
                statusClass = 'status-delivered';
                break;
            case 'shipped':
                statusClass = 'status-shipped';
                break;
            case 'cancelled':
                statusClass = 'status-cancelled';
                break;
        }
        
        // Format total price
        const formattedTotal = new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD' 
        }).format(order.total);
        
        // Create order row
        const orderRow = document.createElement('div');
        orderRow.className = 'order-row';
        orderRow.innerHTML = `
            <div class="order-id" data-label="Order:">${order.orderNumber || order._id}</div>
            <div class="order-date" data-label="Date:">${formattedDate}</div>
            <div data-label="Status:"><span class="order-status ${statusClass}">${order.status}</span></div>
            <div class="order-total" data-label="Total:">${formattedTotal}</div>
            <div class="order-action"><a href="/orders.html?id=${order._id}">View</a></div>
        `;
        
        ordersContainer.appendChild(orderRow);
    });
// Add this function to your account.js file
function loadWishlistItems() {
    const savedItemsContainer = document.querySelector('.saved-items');
    
    if (!savedItemsContainer) return;
    
    // Show loading state
    savedItemsContainer.innerHTML = '<div style="text-align: center; padding: 20px;">Loading your wishlist items...</div>';
    
    // Fetch wishlist items
    fetch('/api/wishlist', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.wishlist && data.wishlist.items && data.wishlist.items.length > 0) {
        // Display wishlist items only if there are items
        displayWishlistItems(data.wishlist, savedItemsContainer);
      } else {
        // Show empty state
        displayEmptyWishlist(savedItemsContainer);
      }
    })
    .catch(error => {
      console.error('Error fetching wishlist:', error);
      // Show empty state on error
      displayEmptyWishlist(savedItemsContainer);
    });
  }
  
  // Function to display empty wishlist message
  function displayEmptyWishlist(container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; background-color: #f9f9f9; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-bottom: 10px; color: #333;">Your wishlist is empty</h3>
        <p style="margin-bottom: 20px; color: #666;">You haven't added any products to your wishlist yet.</p>
        <a href="/" style="display: inline-block; padding: 10px 20px; background-color: #ff6b00; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Shop Now</a>
      </div>
    `;
  }
  
  // Function to display wishlist items
  function displayWishlistItems(wishlist, container) {
    // Clear container
    container.innerHTML = '';
    
    // Double-check if wishlist has items
    if (!wishlist.items || wishlist.items.length === 0) {
      displayEmptyWishlist(container);
      return;
    }
    
    // Sort items by price (most expensive first)
    const sortedItems = [...wishlist.items].sort((a, b) => b.price - a.price);
    
    // Get the 4 most expensive items (or fewer if less than 4 are available)
    const items = sortedItems.slice(0, 4);
    
    // Create item elements
    items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'saved-item';
      
      // Format price
      const formattedPrice = formatCurrency(item.price);
      
      itemElement.innerHTML = `
        <div class="saved-item-img">
          <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}">
        </div>
        <div class="saved-item-info">
          <div class="saved-item-name">${item.name}</div>
          <div class="saved-item-price">${formattedPrice}</div>
          <div class="saved-item-actions">
            <button class="cart-btn" data-product-id="${item.product}">Add to Cart</button>
            <button class="remove-btn" data-product-id="${item.product}">Remove</button>
          </div>
        </div>
      `;
      
      container.appendChild(itemElement);
    });
    
    // Add event listeners for buttons
    setupWishlistButtons();
  }
  
  // Setup event listeners for wishlist buttons
  function setupWishlistButtons() {
    // Add to cart buttons
    const addToCartButtons = document.querySelectorAll('.saved-items .cart-btn');
    addToCartButtons.forEach(button => {
      button.addEventListener('click', function() {
        const productId = this.getAttribute('data-product-id');
        addToCart(productId, this);
      });
    });
    
    // Remove from wishlist buttons
    const removeButtons = document.querySelectorAll('.saved-items .remove-btn');
    removeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const productId = this.getAttribute('data-product-id');
        removeFromWishlist(productId);
      });
    });
  }
  
  // Function to add to cart
  function addToCart(productId, button) {
    // Disable button while processing
    button.disabled = true;
    button.textContent = 'Adding...';
    
    // Add to cart logic using existing cart utility if available
    if (window.cartUtils && window.cartUtils.addToCart) {
      window.cartUtils.addToCart(productId, 1)
        .then(success => {
          if (success) {
            button.textContent = 'Added!';
            setTimeout(() => {
              button.textContent = 'Add to Cart';
              button.disabled = false;
            }, 2000);
          } else {
            button.textContent = 'Failed';
            setTimeout(() => {
              button.textContent = 'Add to Cart';
              button.disabled = false;
            }, 2000);
          }
        })
        .catch(error => {
          console.error('Error adding to cart:', error);
          button.textContent = 'Error';
          setTimeout(() => {
            button.textContent = 'Add to Cart';
            button.disabled = false;
          }, 2000);
        });
    } else {
      // Fallback if cart utility is not available
      fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          productId: productId,
          quantity: 1
        }),
        credentials: 'include'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          button.textContent = 'Added!';
          // Show notification if available
          if (typeof window.showNotification === 'function') {
            window.showNotification('Product added to cart!', 'success');
          }
        } else {
          button.textContent = 'Failed';
          if (typeof window.showNotification === 'function') {
            window.showNotification('Failed to add product to cart: ' + data.message, 'error');
          }
        }
        
        setTimeout(() => {
          button.textContent = 'Add to Cart';
          button.disabled = false;
        }, 2000);
      })
      .catch(error => {
        console.error('Error adding to cart:', error);
        button.textContent = 'Error';
        
        if (typeof window.showNotification === 'function') {
          window.showNotification('Error adding product to cart. Please try again.', 'error');
        }
        
        setTimeout(() => {
          button.textContent = 'Add to Cart';
          button.disabled = false;
        }, 2000);
      });
    }
  }
  
  // Function to remove from wishlist
  function removeFromWishlist(productId) {
    fetch(`/api/wishlist/remove/${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Show notification if available
        if (typeof window.showNotification === 'function') {
          window.showNotification('Product removed from wishlist!', 'success');
        }
        
        // Reload wishlist items
        loadWishlistItems();
      } else {
        if (typeof window.showNotification === 'function') {
          window.showNotification('Failed to remove product: ' + data.message, 'error');
        }
      }
    })
    .catch(error => {
      console.error('Error removing from wishlist:', error);
      
      if (typeof window.showNotification === 'function') {
        window.showNotification('Error removing product. Please try again.', 'error');
      }
    });
  }
  
  // Format currency helper
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}