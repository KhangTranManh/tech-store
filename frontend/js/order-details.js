// order-details.js - Updated with consistent order number formatting
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded for order details page');
    
    // Get order ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    console.log('Order ID from URL:', orderId);
    
    if (orderId) {
        loadOrderDetails(orderId);
    } else {
        showError('Order ID not provided. Please select an order from your order history.');
    }
});
// Load order details
function loadOrderDetails(orderId) {
    console.log('Loading details for order:', orderId);
    
    const contentContainer = document.getElementById('order-details-content');
    
    if (!contentContainer) {
        console.error('Order details container not found');
        return;
    }
    
    contentContainer.innerHTML = '<div class="loading">Loading order details...</div>';
    
    // Fetch order details from API
    fetch(`/api/orders/${orderId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        console.log('Order details API response status:', response.status);
        
        // Handle authentication issues
        if (response.status === 401) {
            // Redirect to login
            window.location.href = `/login.html?redirect=/order-details.html?id=${orderId}`;
            throw new Error('Authentication required. Redirecting to login...');
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch order details: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Order details data:', data);
        
        if (data.success && data.order) {
            displayOrderDetails(data.order);
        } else {
            showError('Failed to load order details: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error fetching order details:', error);
        
        // Don't show error if we're redirecting to login
        if (!error.message.includes('Redirecting to login')) {
            showError('Unable to load order details. Please try again later.');
        }
    });
}
// Display order details
function displayOrderDetails(order) {
    const contentContainer = document.getElementById('order-details-content');
    
    if (!contentContainer) return;
    
    // Format order number - Use the actual orderNumber if available, otherwise format from ID
    const orderNumber = order.orderNumber || formatOrderNumber(order._id);
    
    // Format date
    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Prepare status class
    const statusClass = order.status.toLowerCase();
    
    // Prepare HTML for order details
    let html = `
        <div class="order-details-panel">
            <div class="panel-header">
                <div class="order-meta">
                    <div class="order-number">Order #${orderNumber}
                        <span class="order-status-label status-${statusClass}">${
                            order.status.charAt(0).toUpperCase() + order.status.slice(1)
                        }</span>
                    </div>
                    <div class="order-date">Placed on ${formattedDate}</div>
                </div>
                
                ${(order.status === 'pending' || order.status === 'processing') ? `
                    <div class="order-actions">
                        <button id="cancel-order-btn" class="cancel-btn">Cancel Order</button>
                    </div>
                ` : ''}
            </div>
            
            <div class="order-body">
                <div class="order-section">
                    <h3 class="section-title">Items</h3>
                    <div class="order-items">
    `;
    
    // Add each item
    order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        html += `
            <div class="order-item">
                <div class="item-image">
                    <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">$${parseFloat(item.price).toFixed(2)}</div>
                    <div class="item-quantity">Quantity: ${item.quantity}</div>
                </div>
            </div>
        `;
    });
    
    // Get shipping address
    const address = order.shippingAddress;
    const addressHtml = address ? `
        <div class="address-name">${address.firstName} ${address.lastName}</div>
        <div class="address-line">${address.street}${address.apartment ? ', ' + address.apartment : ''}</div>
        <div class="address-line">${address.city}, ${address.state} ${address.postalCode}</div>
        <div class="address-line">${address.country}</div>
        <div class="address-line">${address.phone}</div>
    ` : '<div class="address-line">No address information available</div>';
    
    // Add shipping and payment info
    html += `
                    </div>
                </div>
                
                <div class="order-section">
                    <h3 class="section-title">Shipping Information</h3>
                    <div class="address-box">
                        ${addressHtml}
                    </div>
                    
                    ${order.status === 'shipped' || order.status === 'delivered' ? `
                        <div class="tracking-info">
                            <div class="tracking-number">Tracking Number: ${order.trackingNumber || 'N/A'}</div>
                            <a href="/track.html?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(getUserEmail())}" class="tracking-link">Track your package</a>
                        </div>
                    ` : ''}
                </div>
                
                <div class="order-section">
                    <h3 class="section-title">Payment Information</h3>
                    <div class="payment-box">
                        <div class="payment-method">${order.paymentMethod ? order.paymentMethod.cardBrand || 'Credit Card' : 'Credit Card'}</div>
                        <div class="payment-info">Card ending in ${order.paymentLast4 || '****'}</div>
                    </div>
                </div>
                
                <div class="order-section">
                    <h3 class="section-title">Order Summary</h3>
                    <div class="order-summary">
                        <div class="summary-row">
                            <span class="summary-label">Subtotal</span>
                            <span class="summary-value">$${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Shipping</span>
                            <span class="summary-value">${
                                order.shippingCost === 0 ? 'Free' : '$' + order.shippingCost.toFixed(2)
                            }</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Tax</span>
                            <span class="summary-value">$${order.tax.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Total</span>
                            <span class="summary-value">$${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Set the HTML content
    contentContainer.innerHTML = html;
    
    // Add event listener for cancel button
    const cancelBtn = document.getElementById('cancel-order-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to cancel this order?')) {
                cancelOrder(order._id);
            }
        });
    }
}

function formatOrderNumber(orderId) {
    if (!orderId) return 'ORD-000000-0000';
    
    // If the input is already an order number, return it
    if (typeof orderId === 'string' && (orderId.startsWith('ORD-') || orderId.startsWith('TS'))) {
        return orderId;
    }
    
    // Check if there's already an orderNumber format in localStorage
    const formatPreference = localStorage.getItem('orderNumberFormat') || 'ORD';
    
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

// Get user email for tracking link
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

// Cancel an order
function cancelOrder(orderId) {
    fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Order cancelled successfully');
            loadOrderDetails(orderId); // Refresh the page
        } else {
            alert('Failed to cancel order: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error cancelling order:', error);
        alert('An error occurred while cancelling the order');
    });
}

// Show error message
function showError(message) {
    const contentContainer = document.getElementById('order-details-content');
    
    if (!contentContainer) return;
    
    contentContainer.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <p><a href="/orders.html">Return to order history</a></p>
        </div>
    `;
}