// frontend/js/wishlist.js
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (window.authUtils && !window.authUtils.isUserLoggedIn()) {
        // If not logged in, redirect to login page
        window.location.href = '/login.html?redirect=wishlist.html';
        return;
    }
    
    // Update header to show account link
    updateHeaderLinks();
    
    // Load wishlist items
    loadWishlist();
    
    // Setup clear wishlist button
    const clearWishlistBtn = document.getElementById('clear-wishlist');
    if (clearWishlistBtn) {
        clearWishlistBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your entire wishlist?')) {
                clearWishlist();
            }
        });
    }
});

/**
 * Update header links based on authentication status
 */
function updateHeaderLinks() {
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const accountLink = document.getElementById('account-link');
    
    if (window.authUtils && window.authUtils.isUserLoggedIn()) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (accountLink) accountLink.style.display = 'inline-block';
    } else {
        if (loginLink) loginLink.style.display = 'inline-block';
        if (registerLink) registerLink.style.display = 'inline-block';
        if (accountLink) accountLink.style.display = 'none';
    }
}

/**
 * Load wishlist items from API
 */
function loadWishlist() {
    // Show loading state
    const wishlistContent = document.getElementById('wishlist-content');
    if (wishlistContent) {
        wishlistContent.innerHTML = '<div class="loading">Loading your wishlist...</div>';
    }
    
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
        if (data.success) {
            // Display wishlist
            displayWishlist(data.wishlist);
        } else {
            showError('Failed to load wishlist: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching wishlist:', error);
        showError('An error occurred while fetching your wishlist. Please try again.');
    });
}

/**
 * Display wishlist items
 * @param {Object} wishlist - Wishlist object from API
 */
function displayWishlist(wishlist) {
    const wishlistContent = document.getElementById('wishlist-content');
    
    if (!wishlistContent) return;
    
    // Clear previous content
    wishlistContent.innerHTML = '';
    
    if (!wishlist.items || wishlist.items.length === 0) {
        // Display empty state
        wishlistContent.innerHTML = `
            <div class="empty-wishlist">
                <h3>Your wishlist is empty</h3>
                <p>You haven't added any products to your wishlist yet.</p>
                <a href="/" class="shop-now-btn">Shop Now</a>
            </div>
        `;
        return;
    }
    
    // Create wishlist grid
    const wishlistGrid = document.createElement('div');
    wishlistGrid.className = 'wishlist-grid';
    
    // Add items to grid
    wishlist.items.forEach(item => {
        const wishlistItem = document.createElement('div');
        wishlistItem.className = 'wishlist-item';
        
        // Format price
        const formattedPrice = formatCurrency(item.price);
        
        wishlistItem.innerHTML = `
            <div class="item-image">
                <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}">
            </div>
            <div class="item-info">
                <h3 class="item-name">${item.name}</h3>
                <div class="item-price">${formattedPrice}</div>
                <div class="item-actions">
                    <button class="add-to-cart" data-product-id="${item.product}">Add to Cart</button>
                    <button class="remove-item" data-product-id="${item.product}">Remove</button>
                </div>
            </div>
        `;
        
        wishlistGrid.appendChild(wishlistItem);
    });
    
    wishlistContent.appendChild(wishlistGrid);
    
    // Add event listeners for buttons
    setupButtonListeners();
}

/**
 * Setup event listeners for wishlist item buttons
 */
function setupButtonListeners() {
    // Add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            addToCart(productId, this);
        });
    });
    
    // Remove from wishlist buttons
    const removeButtons = document.querySelectorAll('.remove-item');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            removeFromWishlist(productId);
        });
    });
}

/**
 * Add product to cart
 * @param {string} productId - Product ID
 * @param {HTMLElement} button - Button element
 */
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

/**
 * Remove product from wishlist
 * @param {string} productId - Product ID
 */
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
            
            // Reload wishlist
            loadWishlist();
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

/**
 * Clear entire wishlist
 */
function clearWishlist() {
    fetch('/api/wishlist/clear', {
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
                window.showNotification('Wishlist cleared!', 'success');
            }
            
            // Reload wishlist
            loadWishlist();
        } else {
            if (typeof window.showNotification === 'function') {
                window.showNotification('Failed to clear wishlist: ' + data.message, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error clearing wishlist:', error);
        
        if (typeof window.showNotification === 'function') {
            window.showNotification('Error clearing wishlist. Please try again.', 'error');
        }
    });
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    const wishlistContent = document.getElementById('wishlist-content');
    
    if (wishlistContent) {
        wishlistContent.innerHTML = `
            <div class="error-message" style="padding: 20px; text-align: center; color: #d32f2f; background-color: #ffebee; border-radius: 4px; margin-top: 20px;">
                <p>${message}</p>
                <button onclick="loadWishlist()" style="margin-top: 10px; padding: 8px 15px; background-color: #ff6b00; color: white; border: none; border-radius: 4px; cursor: pointer;">Try Again</button>
            </div>
        `;
    }
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}