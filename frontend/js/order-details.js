// order-details.js - Add this to your js/order-details.js file
document.addEventListener('DOMContentLoaded', function() {
    // Get order ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    if (orderId) {
        loadOrderDetails(orderId);
    } else {
        showError('Order ID not provided');
    }
});

// Load order details
function loadOrderDetails(orderId) {
    const contentContainer = document.getElementById('order-details-content');
    
    if (!contentContainer) return;
    
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
        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displayOrderDetails(data.order);
        } else {
            showError('Failed to load order details: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error fetching order details:', error);
        showError('Unable to load order details. Please try again later.');
    });
}

// Display order details
function displayOrderDetails(order) {
    const contentContainer = document.getElementById('order-details-content');
    
    if (!contentContainer) return;
    
    // Format order number (TS + last 8 digits of order ID)
    const orderNumber = 'TS' + order._id.toString().slice(-8);
    
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
                            <div class="tracking-number">Tracking Number: ${order.trackingNumber || 'TSTRACK123456789'}</div>
                            <a href="#" class="tracking-link">Track your package</a>
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