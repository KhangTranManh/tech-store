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
    
    // Logout button functionality
    const logoutButton = document.querySelector('.logout-btn');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            if (window.authUtils) {
                window.authUtils.handleLogout(e);
            } else {
                // Fallback if authUtils is not available
                e.preventDefault();
                
                fetch('/auth/logout', {
                    method: 'GET',
                    credentials: 'include'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Clear any stored data
                        sessionStorage.removeItem('authUser');
                        
                        // Redirect to home page
                        window.location.href = '/';
                    } else {
                        alert('Logout failed. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error during logout:', error);
                    alert('An error occurred during logout. Please try again.');
                });
            }
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

/**
 * Load user profile data into the account page
 */
function loadUserProfile() {
    let userData = null;
    
    // Try to get user data from auth utils
    if (window.authUtils) {
        userData = window.authUtils.getCurrentUser();
    }
    
    // Fallback: try to get from session storage
    if (!userData) {
        const storedData = sessionStorage.getItem('authUser');
        if (storedData) {
            try {
                userData = JSON.parse(storedData);
            } catch (error) {
                console.error('Error parsing auth data:', error);
            }
        }
    }
    
    if (userData) {
        // Update user info
        updateUserInfo(userData);
    } else {
        // If no user data available, fetch from API
        fetch('/auth/user', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateUserInfo(data.user);
                
                // Store user data for future use
                if (window.authUtils) {
                    window.authUtils.storeUserData(data.user);
                } else {
                    sessionStorage.setItem('authUser', JSON.stringify(data.user));
                }
            } else {
                // If API call fails, redirect to login
                window.location.href = '/login.html';
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            // On error, redirect to login
            window.location.href = '/login.html';
        });
    }
}

/**
 * Update the user info elements on the page
 * @param {Object} userData - User data object
 */
function updateUserInfo(userData) {
    // Update user avatar initial
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar && userData.firstName) {
        userAvatar.textContent = userData.firstName.charAt(0);
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
}