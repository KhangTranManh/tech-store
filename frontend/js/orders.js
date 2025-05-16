// Event listener for page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded for orders page');
    
    // Check if we're on the orders page by looking for the order-list element
    const orderList = document.querySelector('.order-list');
    if (!orderList) {
        console.warn('Not on orders page or order-list element not found');
        return;
    }
    
    console.log('Initializing orders page...');
    
    // Load the user's orders
    loadOrders();
    
    // Initialize filter buttons
    initializeFilters();
    
    // Initialize search functionality
    initializeSearch();
});

/**
 * Load orders from the server
 */
function loadOrders(status = null, searchQuery = null) {
    console.log('Loading orders...');
    
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
        console.log('Orders API response status:', response.status);
        
        // Handle authentication issues
        if (response.status === 401) {
            // Redirect to login
            window.location.href = '/login.html?redirect=/orders.html';
            throw new Error('Authentication required. Redirecting to login...');
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Orders API response data:', data);
        
        if (data.success) {
            // Check if we have orders
            if (data.orders && data.orders.length > 0) {
                console.log(`Displaying ${data.orders.length} orders`);
                displayOrders(data.orders);
            } else {
                console.log('No orders found');
                showEmptyState();
            }
        } else {
            console.error('API returned success: false', data.message);
            showError(data.message || 'Failed to load orders');
        }
    })
    .catch(error => {
        console.error('Error fetching orders:', error);
        
        // Don't show error if we're redirecting to login
        if (!error.message.includes('Redirecting to login')) {
            showError('An error occurred while fetching your orders. Please try again.');
        }
    });
}

/**
 * Display orders in the order list
 * @param {Array} orders - Array of order objects
 */
function displayOrders(orders) {
    console.log('Displaying orders:', orders);
    
    const orderList = document.querySelector('.order-list');
    
    if (!orderList) {
        console.error('Order list container not found');
        return;
    }
    
    // Clear previous content
    orderList.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        // Display empty state
        showEmptyState();
        return;
    }
    
    // Sort orders by date (most recent first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log('Creating order cards...');
    
    // Create and append order cards
    orders.forEach(order => {
        try {
            const orderCard = createOrderCard(order);
            orderList.appendChild(orderCard);
        } catch (error) {
            console.error('Error creating order card:', error, order);
        }
    });
    
    console.log('Orders displayed successfully');
}

/**
 * Create an order card element
 * @param {Object} order - Order object
 * @returns {HTMLElement} Order card element
 */
function createOrderCard(order) {
    console.log('Creating card for order:', order._id);
    
    // Create order date elements
    const orderDate = new Date(order.createdAt);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const month = monthNames[orderDate.getMonth()].substring(0, 3);
    const day = orderDate.getDate();
    const year = orderDate.getFullYear();
    
    // Get status class
    const statusClass = getStatusClass(order.status);
    
    // Format order number - Use the actual orderNumber if available, otherwise format from ID
    const formattedOrderNumber = order.orderNumber || formatOrderNumber(order._id);
    
    // Create order card element
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.setAttribute('data-order-id', order._id);
    orderCard.setAttribute('data-order-number', formattedOrderNumber);
    orderCard.setAttribute('data-status', order.status.toLowerCase());
    
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
            <div class="order-number">Order #${formattedOrderNumber} <span class="order-status ${statusClass}">${capitalizeFirstLetter(order.status)}</span></div>
        </div>
    `;
    
    // Create order items section - only show up to 2 items
    const orderItems = document.createElement('div');
    orderItems.className = 'order-items';
    
    // Add each item (but limit to 2 with a "more items" message if there are more)
    const displayItems = order.items.slice(0, 2);
    
    displayItems.forEach(item => {
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
    
    // If there are more items, add a "more items" message
    if (order.items.length > 2) {
        const moreItems = document.createElement('div');
        moreItems.className = 'more-items';
        moreItems.textContent = `+ ${order.items.length - 2} more item${order.items.length - 2 > 1 ? 's' : ''}`;
        orderItems.appendChild(moreItems);
    }
    
    // Create order footer
    const orderFooter = document.createElement('div');
    orderFooter.className = 'order-footer';
    
    // Format total amount
    const formattedTotal = formatCurrency(order.total);
    
    // Very important - Make sure the link to order details is correct!
    orderFooter.innerHTML = `
        <div class="order-total">
            Total: <span class="total-amount">${formattedTotal}</span>
        </div>
        <div class="order-actions">
            <a href="/order-details.html?id=${order._id}" class="view-details">View Order Details</a>
            ${order.status === 'shipped' || order.status === 'processing' ? 
                `<a href="/track.html?orderNumber=${encodeURIComponent(formattedOrderNumber)}&email=${encodeURIComponent(getUserEmail())}" class="track-order-btn">Track Order</a>` 
                : ''}
        </div>
    `;
    
    // Assemble order card
    orderCard.appendChild(orderHeader);
    orderCard.appendChild(orderItems);
    orderCard.appendChild(orderFooter);
    
    console.log('Order card created successfully');
    return orderCard;
}

// Make sure we have a way to get the user's email
function getUserEmail() {
    // Try to get from localStorage
    const email = localStorage.getItem('userEmail');
    if (email) return email;
    
    // Try to get from page data attribute
    const userElement = document.querySelector('[data-user-email]');
    if (userElement) {
        return userElement.getAttribute('data-user-email');
    }
    
    // If not available, return empty string
    return '';
}

/**
 * Get the user's email (for tracking links)
 * @returns {string} User email
 */
function getUserEmail() {
    // First try to get from localStorage
    const email = localStorage.getItem('userEmail');
    if (email) return email;
    
    // If not available, try to get from data attribute on page
    const userEmailElement = document.querySelector('[data-user-email]');
    if (userEmailElement) {
        return userEmailElement.getAttribute('data-user-email');
    }
    
    // Default fallback
    return '';
}

/**
 * Format order number consistently
 * @param {string} orderId - Order ID
 * @returns {string} Formatted order number
 */
function formatOrderNumber(orderId) {
    if (!orderId) return 'ORD-000000-0000';
    
    // Check if there's already an orderNumber format in localStorage
    const formatPreference = localStorage.getItem('orderNumberFormat');
    
    if (formatPreference === 'TS') {
        // Convert ID to string and get last 8 characters
        const idString = orderId.toString();
        const lastEight = idString.length > 8 
            ? idString.slice(-8) 
            : idString.padStart(8, '0');
        
        return 'TS' + lastEight;
    } else {
        // Use ORD-XXXXXX-XXXX format
        const idString = orderId.toString();
        // Take characters from the end to ensure uniqueness
        const sixDigits = idString.length > 6 ? idString.slice(-10, -4) : idString.padStart(6, '0');
        const fourDigits = idString.length > 4 ? idString.slice(-4) : '0000';
        
        return `ORD-${sixDigits}-${fourDigits}`;
    }
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
/**
 * Show empty state when no orders are found
 */
function showEmptyState() {
    console.log('Showing empty state - no orders found');
    
    const orderList = document.querySelector('.order-list');
    
    if (orderList) {
        orderList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-box-open"></i>
                </div>
                <h3>No Orders Found</h3>
                <p>You haven't placed any orders yet.</p>
            </div>
        `;
    }
}