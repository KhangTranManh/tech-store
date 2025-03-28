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
}