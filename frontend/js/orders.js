// orders.js - Handles order history functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (window.authUtils && !window.authUtils.isUserLoggedIn()) {
        // If not logged in, redirect to login page
        window.location.href = '/login.html?redirect=orders.html';
        return;
    }
    
    // Initialize order display
    loadOrders();
    
    // Filter buttons functionality
    initializeFilters();
    
    // Search functionality
    initializeSearch();
});

/**
 * Load orders from the server
 */
function loadOrders(status = null, searchQuery = null) {
    // Show loading state
    const orderList = document.querySelector('.order-list');
    if (orderList) {
        orderList.innerHTML = '<div class="loading">Loading your orders...</div>';
    }
    
    // Build query parameters
    let queryParams = new URLSearchParams();
    if (status && status !== 'All Orders') {
        queryParams.append('status', status.toLowerCase());
    }
    if (searchQuery) {
        queryParams.append('search', searchQuery);
    }
    
    // Fetch orders from the server
    fetch(`/api/orders?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Display orders
            displayOrders(data.orders);
        } else {
            showError('Failed to load orders: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching orders:', error);
        showError('An error occurred while fetching your orders. Please try again.');
    });
}

/**
 * Display orders in the order list
 * @param {Array} orders - Array of order objects
 */
function displayOrders(orders) {
    const orderList = document.querySelector('.order-list');
    
    if (!orderList) return;
    
    // Clear previous content
    orderList.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        // Display empty state
        orderList.innerHTML = `
            <div class="empty-orders">
                <h3>No orders found</h3>
                <p>You haven't placed any orders yet.</p>
                <a href="/" class="shop-now-btn">Shop Now</a>
            </div>
        `;
        return;
    }
    
    // Sort orders by date (most recent first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Create and append order cards
    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        orderList.appendChild(orderCard);
    });
}

/**
 * Create an order card element
 * @param {Object} order - Order object
 * @returns {HTMLElement} Order card element
 */
function createOrderCard(order) {
    // Create order date elements
    const orderDate = new Date(order.createdAt);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const month = monthNames[orderDate.getMonth()].substring(0, 3);
    const day = orderDate.getDate();
    const year = orderDate.getFullYear();
    
    // Get status class
    const statusClass = getStatusClass(order.status);
    
    // Create order card element
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    // Create order header
    const orderHeader = document.createElement('div');
    orderHeader.className = 'order-header';
    orderHeader.innerHTML = `
        <div class="order-date">
            <span class="date-month">${month}</span>
            <span class="date-day">${day}</span>
            <span class="date-year">${year}</span>
        </div>
        <div class="order-info">
            <div class="order-number">Order #${order.orderNumber} <span class="order-status ${statusClass}">${capitalizeFirstLetter(order.status)}</span></div>
        </div>
    `;
    
    // Create order items section
    const orderItems = document.createElement('div');
    orderItems.className = 'order-items';
    
    // Add each item
    order.items.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        
        // Format price
        const formattedPrice = formatCurrency(item.price);
        
        orderItem.innerHTML = `
            <div class="item-image">
                <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}">
            </div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-price">${formattedPrice}</div>
                <div class="item-quantity">Quantity: ${item.quantity}</div>
            </div>
        `;
        
        orderItems.appendChild(orderItem);
    });
    
    // Create order footer
    const orderFooter = document.createElement('div');
    orderFooter.className = 'order-footer';
    
    // Format total amount
    const formattedTotal = formatCurrency(order.total);
    
    orderFooter.innerHTML = `
        <div class="order-total">
            Total: <span class="total-amount">${formattedTotal}</span>
        </div>
        <div class="order-actions">
            <a href="/order-details.html?id=${order._id}" class="view-details">View Order Details</a>
        </div>
    `;
    
    // Assemble order card
    orderCard.appendChild(orderHeader);
    orderCard.appendChild(orderItems);
    orderCard.appendChild(orderFooter);
    
    return orderCard;
}

/**
 * Initialize filter buttons
 */
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter status
            const status = this.textContent;
            
            // Get current search query if any
            const searchInput = document.querySelector('.search-orders input');
            const searchQuery = searchInput ? searchInput.value.trim() : null;
            
            // Load filtered orders
            loadOrders(status, searchQuery);
        });
    });
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchButton = document.querySelector('.search-orders button');
    const searchInput = document.querySelector('.search-orders input');
    
    if (searchButton && searchInput) {
        // Handle search button click
        searchButton.addEventListener('click', function() {
            performSearch();
        });
        
        // Handle pressing Enter in search input
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }
}

/**
 * Perform order search
 */
function performSearch() {
    const searchInput = document.querySelector('.search-orders input');
    const searchQuery = searchInput ? searchInput.value.trim() : '';
    
    // Get current active filter
    const activeFilter = document.querySelector('.filter-btn.active');
    const status = activeFilter ? activeFilter.textContent : null;
    
    // Load filtered/searched orders
    loadOrders(status, searchQuery);
}

/**
 * Get CSS class for order status
 * @param {string} status - Order status
 * @returns {string} CSS class
 */
function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'delivered':
            return 'status-delivered';
        case 'shipped':
            return 'status-shipped';
        case 'processing':
            return 'status-processing';
        case 'cancelled':
            return 'status-cancelled';
        default:
            return '';
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

/**
 * Capitalize first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    const orderList = document.querySelector('.order-list');
    
    if (orderList) {
        orderList.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
                <button onclick="loadOrders()">Try Again</button>
            </div>
        `;
    }
    
    // Also show as notification if available
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, 'error');
    }
}