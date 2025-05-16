// public/js/track.js - Robust version with error handling
document.addEventListener('DOMContentLoaded', function() {
    // Form submission handling
    const trackForm = document.querySelector('.track-form');
    const trackingInfo = document.querySelector('.tracking-info');
    const emptyTracking = document.querySelector('.empty-tracking');
    
    // Exit if required elements don't exist
    if (!trackForm) {
        console.error('Track form not found on page');
        return;
    }
    
    // Hide tracking info initially
    if (trackingInfo) {
        trackingInfo.style.display = 'none';
    }
    
    trackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let orderNumber = document.getElementById('order-number').value.trim();
        const email = document.getElementById('email').value.trim();
        
        // Validate order number and email
        if (!orderNumber || !email) {
            alert('Please enter both Order Number and Email Address.');
            return;
        }
        
        // Format order number to match database format if needed
        // If the order number doesn't start with 'ORD-' but starts with 'TS', convert it
        if (!orderNumber.startsWith('ORD-') && orderNumber.startsWith('TS')) {
            console.log(`Converting order number format from ${orderNumber}`);
            // You might need to adjust this logic based on your actual format conversion
            orderNumber = orderNumber.replace(/^TS/, 'ORD-');
            console.log(`to ${orderNumber}`);
        }
        
        // Show loading indicator
        if (trackingInfo) {
            trackingInfo.style.display = 'block';
            clearTrackingInfo();
            trackingInfo.classList.add('loading-state');
        }
        
        if (emptyTracking) {
            emptyTracking.style.display = 'none';
        }
        
        // Call the tracking API
        fetch(`/api/tracking?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(email)}`)
            .then(response => {
                // Remove loading state
                if (trackingInfo) {
                    trackingInfo.classList.remove('loading-state');
                }
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch tracking: ${response.status} ${response.statusText}`);
                }
                
                return response.json();
            })
            .then(data => {
                console.log('Tracking data received:', data);
                
                if (data.success && data.order) {
                    // Update tracking info with real data
                    updateTrackingInfo(data.order);
                    
                    // Show tracking info panel
                    if (trackingInfo) trackingInfo.style.display = 'block';
                    if (emptyTracking) emptyTracking.style.display = 'none';
                    
                    // On mobile, scroll to the tracking info
                    if (window.innerWidth <= 1024) {
                        trackingInfo.scrollIntoView({behavior: 'smooth'});
                    }
                } else {
                    // Show empty state
                    if (trackingInfo) trackingInfo.style.display = 'none';
                    if (emptyTracking) emptyTracking.style.display = 'block';
                    
                    console.error('No tracking data in response:', data);
                }
            })
            .catch(error => {
                console.error('Error fetching tracking:', error);
                
                // Hide tracking info and show empty state
                if (trackingInfo) trackingInfo.style.display = 'none';
                if (emptyTracking) emptyTracking.style.display = 'block';
                
                // Update error message
                const errorTitle = emptyTracking?.querySelector('h3');
                if (errorTitle) errorTitle.textContent = 'Order Not Found';
                
                const errorMessage = emptyTracking?.querySelector('p');
                if (errorMessage) {
                    errorMessage.textContent = 'We couldn\'t find tracking information for the provided order number and email. Please check your details and try again.';
                }
            });
    });
    
    // Function to clear tracking info
    function clearTrackingInfo() {
        // Helper function to safely clear element content
        function safelyClear(selector, defaultText = '') {
            const element = document.querySelector(selector);
            if (element) element.textContent = defaultText;
        }
        
        // Clear order details
        safelyClear('.detail-item:nth-child(1) .detail-value');
        safelyClear('.detail-item:nth-child(2) .detail-value');
        safelyClear('.detail-item:nth-child(3) .detail-value');
        safelyClear('.detail-item:nth-child(4) .detail-value');
        
        // Clear shipping address
        const addressElement = document.querySelector('.delivery-address');
        if (addressElement) addressElement.innerHTML = '';
        
        // Clear delivery estimate
        safelyClear('.delivery-estimate', 'Estimated Delivery: Loading...');
        
        // Clear carrier and tracking number
        safelyClear('.carrier-logo');
        safelyClear('.tracking-number strong');
        
        // Clear tracking steps
        const stepsContainer = document.querySelector('.tracking-steps');
        if (stepsContainer) {
            stepsContainer.innerHTML = '<div class="loading">Loading tracking details...</div>';
        }
        
        // Clear package items but keep the title
        const packageItems = document.querySelector('.package-items');
        if (packageItems) {
            const title = packageItems.querySelector('.package-title');
            packageItems.innerHTML = '';
            if (title) packageItems.appendChild(title);
        }
    }
    
    // Function to update tracking info with real data
    function updateTrackingInfo(order) {
        console.log('Updating tracking info with:', order);
        
        // Helper function to safely update text content
        function safelyUpdateText(selector, value) {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = value;
            } else {
                console.warn(`Element not found: ${selector}`);
            }
        }
        
        // Update order details with safe selectors
        safelyUpdateText('.detail-item:nth-child(1) .detail-value', order.orderNumber || '');
        
        if (order.orderDate) {
            const orderDate = new Date(order.orderDate);
            safelyUpdateText('.detail-item:nth-child(2) .detail-value', orderDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }));
        }
        
        if (order.status) {
            // Capitalize first letter of status
            const status = order.status.charAt(0).toUpperCase() + order.status.slice(1);
            safelyUpdateText('.detail-item:nth-child(3) .detail-value', status);
        }
        
        safelyUpdateText('.detail-item:nth-child(4) .detail-value', order.paymentMethod || '');
        
        // Update shipping address
        const addressElement = document.querySelector('.delivery-address');
        if (addressElement && order.shippingAddress) {
            const address = order.shippingAddress;
            let addressHtml = `
                ${address.firstName || ''} ${address.lastName || ''}<br>
                ${address.street || ''}${address.apartment ? ', ' + address.apartment : ''}<br>
                ${address.city || ''}, ${address.state || ''} ${address.postalCode || ''}<br>
                ${address.country || ''}
            `;
            addressElement.innerHTML = addressHtml;
        }
        
        // Update estimated delivery
        if (order.estimatedDelivery) {
            const estimatedDate = new Date(order.estimatedDelivery);
            safelyUpdateText('.delivery-estimate', `Estimated Delivery: ${estimatedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`);
        }
        
        // Update tracking number and carrier
        safelyUpdateText('.carrier-logo', order.carrier || 'Standard');
        safelyUpdateText('.tracking-number strong', order.trackingNumber || 'N/A');
        
        // Update tracking steps
        updateTrackingSteps(order.tracking || []);
        
        // Update package items
        updatePackageItems(order.items || []);
    }
   // Function to update tracking steps - modified to ensure Delivered is always last
function updateTrackingSteps(trackingSteps) {
    const stepsContainer = document.querySelector('.tracking-steps');
    if (!stepsContainer) {
        console.warn('Tracking steps container not found');
        return;
    }
    
    // Clear existing steps
    stepsContainer.innerHTML = ''; 
    
    // If no tracking steps, show message
    if (!trackingSteps || trackingSteps.length === 0) {
        stepsContainer.innerHTML = '<div class="no-tracking">No tracking updates available yet.</div>';
        return;
    }
    
    try {
        // Sort tracking steps by timestamp
        const sortedSteps = [...trackingSteps].sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });
        
        // Standard steps in order
        const standardSteps = [
            'Order Placed',
            'Order Processed',
            'Shipped',
            'In Transit',
            'Out for Delivery',
            'Delivered'
        ];
        
        // Keep track of which steps we've already processed
        const processedSteps = new Set();
        
        // Create tracking steps from actual tracking data
        sortedSteps.forEach(step => {
            if (!step.status) return; // Skip invalid steps
            
            processedSteps.add(step.status);
            
            const stepDate = new Date(step.timestamp);
            const stepElement = document.createElement('div');
            stepElement.className = 'tracking-step completed';
            
            stepElement.innerHTML = `
                <div class="step-marker"></div>
                <div class="step-content">
                    <div class="step-title">${step.status}</div>
                    <div class="step-details">${step.description || ''}</div>
                    <div class="step-time">${stepDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })} - ${stepDate.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>
                </div>
            `;
            
            stepsContainer.appendChild(stepElement);
        });
        
        // Check if order is delivered
        const isDelivered = processedSteps.has('Delivered');
        
        // If delivered, don't add any more steps
        if (isDelivered) {
            return;
        }
        
        // Add remaining expected steps
        let foundCurrent = false;
        
        // Only add steps that haven't been processed
        for (const stepName of standardSteps) {
            // Skip steps we've already processed
            if (processedSteps.has(stepName)) continue;
            
            // First unprocessed step is the current step, the rest are upcoming
            const stepElement = document.createElement('div');
            stepElement.className = foundCurrent ? 'tracking-step' : 'tracking-step current';
            foundCurrent = true;
            
            stepElement.innerHTML = `
                <div class="step-marker"></div>
                <div class="step-content">
                    <div class="step-title">${stepName}</div>
                    <div class="step-details">Expected upcoming step</div>
                    <div class="step-time">Expected</div>
                </div>
            `;
            
            stepsContainer.appendChild(stepElement);
        }
    } catch (error) {
        console.error('Error rendering tracking steps:', error);
        stepsContainer.innerHTML = '<div class="error">Error displaying tracking steps</div>';
    }
}

// Add CSS to ensure delivered step is always shown as completed
const trackingStyle = document.createElement('style');
trackingStyle.textContent = `
    .tracking-step.completed .step-marker {
        background-color: #4CAF50 !important;
        border-color: #4CAF50 !important;
    }
`;
document.head.appendChild(trackingStyle);
    
    // Function to update package items
    function updatePackageItems(items) {
        const itemsContainer = document.querySelector('.package-items');
        if (!itemsContainer) {
            console.warn('Package items container not found');
            return;
        }
        
        try {
            // Clear existing items but keep the title
            const packageTitle = itemsContainer.querySelector('.package-title');
            const titleText = packageTitle ? packageTitle.textContent : 'Package Contents';
            
            itemsContainer.innerHTML = '';
            
            // Recreate title
            const titleElement = document.createElement('h3');
            titleElement.className = 'package-title';
            titleElement.textContent = titleText;
            itemsContainer.appendChild(titleElement);
            
            // If no items, show message
            if (!items || items.length === 0) {
                const noItems = document.createElement('div');
                noItems.className = 'no-items';
                noItems.textContent = 'No items in this package';
                itemsContainer.appendChild(noItems);
                return;
            }
            
            // Add each item
            items.forEach(item => {
                if (!item) return; // Skip invalid items
                
                const itemElement = document.createElement('div');
                itemElement.className = 'item';
                
                itemElement.innerHTML = `
                    <div class="item-image">
                        <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name || 'Product'}">
                    </div>
                    <div class="item-details">
                        <div class="item-name">${item.name || 'Unknown Product'}</div>
                        <div class="item-quantity">Quantity: ${item.quantity || 1}</div>
                    </div>
                `;
                
                itemsContainer.appendChild(itemElement);
            });
        } catch (error) {
            console.error('Error rendering package items:', error);
            
            // Create basic error display
            itemsContainer.innerHTML = `
                <h3 class="package-title">Package Contents</h3>
                <div class="error">Error displaying package items</div>
            `;
        }
    }
    
    // Support button functionality
    const supportButtons = document.querySelectorAll('.support-btn');
    
    supportButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.toLowerCase();
            
            if (action.includes('contact')) {
                window.location.href = '/contact.html';
            } else if (action.includes('report')) {
                alert('This would open a form to report issues with your order.');
            } else if (action.includes('view')) {
                window.location.href = '/orders.html';
            }
        });
    });
    
    // Add additional styles
    addTrackingStyles();
    
    // Check URL parameters for direct tracking
    checkUrlForTracking();
    
    // Clear default placeholders on page load
    clearTrackingInfo();
    
    // Function to add required styles
    function addTrackingStyles() {
        if (document.getElementById('tracking-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tracking-styles';
        style.textContent = `
            .loading-state {
                position: relative;
                min-height: 200px;
            }
            
            .loading-state::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 50px;
                height: 50px;
                margin-top: -25px;
                margin-left: -25px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #ff6b00;
                border-radius: 50%;
                animation: spin 2s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading, .no-tracking, .no-items, .error {
                text-align: center;
                color: #666;
                padding: 20px;
                font-style: italic;
            }
            
            .error {
                color: #e74c3c;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Function to check URL for tracking parameters
    function checkUrlForTracking() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderNumber = urlParams.get('orderNumber');
        const email = urlParams.get('email');
        
        if (orderNumber && email) {
            const orderInput = document.getElementById('order-number');
            const emailInput = document.getElementById('email');
            
            if (orderInput && emailInput) {
                // Fill form fields
                orderInput.value = orderNumber;
                emailInput.value = email;
                
                // Submit form automatically
                setTimeout(() => {
                    trackForm.dispatchEvent(new Event('submit'));
                }, 500);
            }
        }
    }
});