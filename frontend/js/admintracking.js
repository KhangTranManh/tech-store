// adminTracking.js - Enhanced version with better error handling and functionality

document.addEventListener('DOMContentLoaded', function() {
    // Reference to DOM elements
    const orderSelect = document.getElementById('order-select');
    const statusTypeSelect = document.getElementById('status');
    const customStatusInput = document.getElementById('custom-status');
    const locationInput = document.getElementById('location');
    const dateTimeInput = document.getElementById('date-time');
    const notesInput = document.getElementById('notes');
    const carrierSelect = document.getElementById('carrier');
    const trackingNumberInput = document.getElementById('tracking-number');
    const notifySelect = document.getElementById('notify');
    const addStatusForm = document.querySelector('.status-form form');
    const editStatusForm = document.querySelector('.status-form:nth-of-type(2) form');
    const timelineContainer = document.querySelector('.tracking-timeline');
    const orderInfoSection = document.querySelector('.order-info');
    const customerViewPreview = document.querySelector('.customer-view .tracking-steps');
    

    // Set current date and time for the datetime input
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
    if (dateTimeInput) {
        dateTimeInput.value = formattedDate;
    }

    // Common function to handle API responses
    async function handleApiResponse(response) {
        if (!response.ok) {
            // Try to parse error message from response
            let errorMessage = `Server error (${response.status})`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                
                // Check for auth-related errors
                if (response.status === 401 || response.status === 403) {
                    // Redirect to login with return URL
                    const returnUrl = encodeURIComponent(window.location.pathname);
                    window.location.href = `/login.html?redirect=${returnUrl}`;
                    throw new Error('Authentication required. Redirecting to login...');
                }
            } catch (e) {
                // If can't parse JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        return response.json();
    }
    
    // Function to fetch orders with improved error handling
    function fetchOrders() {
        // Show loading state
        if (orderSelect) {
            orderSelect.innerHTML = '<option value="">Loading orders...</option>';
        }
        
        fetch('/api/admin/orders')
            .then(handleApiResponse)
            .then(data => {
                if (data.success && data.data && data.data.length > 0) {
                    // Populate order dropdown
                    orderSelect.innerHTML = '<option value="">Select an order...</option>';
                    
                    data.data.forEach(order => {
                        const option = document.createElement('option');
                        option.value = order._id;
                        
                        // Format the display text consistently
                        // This will display the order number in your preferred format
                        const orderNumber = order.orderNumber || order._id;
                        const userEmail = order.user && order.user.email ? order.user.email : 'Unknown user';
                        const status = order.status ? `(${order.status.charAt(0).toUpperCase() + order.status.slice(1)}` : '';
                        const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '';
                        
                        option.textContent = `${orderNumber} - ${userEmail} ${status}, ${orderDate})`;
                        
                        orderSelect.appendChild(option);
                    });
                } else {
                    orderSelect.innerHTML = '<option value="">No orders found</option>';
                }
            })
            .catch(error => {
                console.error('Error fetching orders:', error);
                orderSelect.innerHTML = `<option value="">Error: ${error.message}</option>`;
            });
    }
    
    // Function to fetch and display order details
    function fetchOrderDetails(orderId) {
        if (!orderId) return;
        
        // Show loading state
        if (orderInfoSection) {
            orderInfoSection.innerHTML = '<div class="loading">Loading order details...</div>';
        }
        
        if (timelineContainer) {
            timelineContainer.innerHTML = '<div class="timeline-track"></div><div class="loading">Loading tracking data...</div>';
        }
        
        fetch(`/api/admin/orders/${orderId}`)
            .then(handleApiResponse)
            .then(data => {
                if (data.success && data.data) {
                    const order = data.data;
                    displayOrderDetails(order);
                    renderTrackingTimeline(order.tracking || []);
                    updateCustomerViewPreview(order.tracking || []);
                    
                    // Update tracking number in add status form if available
                    if (trackingNumberInput && order.trackingNumber) {
                        trackingNumberInput.value = order.trackingNumber;
                    }
                    
                    // Update carrier in dropdown if available
                    if (carrierSelect && order.carrier) {
                        // Find matching option or default to "other"
                        const carrierOptions = Array.from(carrierSelect.options).map(opt => opt.value.toLowerCase());
                        const matchedCarrier = carrierOptions.includes(order.carrier.toLowerCase()) 
                            ? order.carrier.toLowerCase() 
                            : 'other';
                        carrierSelect.value = matchedCarrier;
                    }
                } else {
                    console.error('Error: Invalid order data format');
                    if (orderInfoSection) {
                        orderInfoSection.innerHTML = '<div class="error">Failed to load order details</div>';
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching order details:', error);
                if (orderInfoSection) {
                    orderInfoSection.innerHTML = `<div class="error">Error: ${error.message}</div>`;
                }
            });
    }
    
    // Function to display order details with enhanced data
    function displayOrderDetails(order) {
        if (!orderInfoSection) return;
        
        // Clear previous content
        orderInfoSection.innerHTML = '';
        
        // Format address if available
        let addressHtml = 'No address provided';
        if (order.shippingAddress) {
            const addr = order.shippingAddress;
            addressHtml = `
                ${addr.firstName || ''} ${addr.lastName || ''}<br>
                ${addr.street || ''}${addr.apartment ? ', ' + addr.apartment : ''}<br>
                ${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}<br>
                ${addr.country || ''}
            `;
        }
        
        // Format payment method
        let paymentMethod = 'Not specified';
        if (order.paymentType === 'cod') {
            paymentMethod = 'Cash on Delivery';
        } else if (order.paymentType === 'card' && order.paymentLast4) {
            paymentMethod = `Credit Card (****${order.paymentLast4})`;
        } else if (order.paymentType) {
            paymentMethod = order.paymentType.charAt(0).toUpperCase() + order.paymentType.slice(1);
        }
        
        // Create order info grid with more details
        const infoHtml = `
            <div class="info-group">
                <div class="info-label">Order Number</div>
                <div class="info-value">${order.orderNumber || order._id}</div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Customer</div>
                <div class="info-value">${order.user?.firstName || ''} ${order.user?.lastName || ''}</div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Customer Email</div>
                <div class="info-value">${order.user?.email || 'Not provided'}</div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Order Date</div>
                <div class="info-value">${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}</div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Shipping Method</div>
                <div class="info-value">${order.shippingMethod || 'Standard'}</div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Payment Method</div>
                <div class="info-value">${paymentMethod}</div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Order Total</div>
                <div class="info-value">$${order.total ? order.total.toFixed(2) : '0.00'}</div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Tracking Number</div>
                <div class="info-value">${order.trackingNumber || 'Not assigned'}</div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Current Status</div>
                <div class="info-value"><span class="status-badge status-${order.status?.toLowerCase() || 'pending'}">${order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}</span></div>
            </div>
            
            <div class="info-group shipping-address">
                <div class="info-label">Shipping Address</div>
                <div class="info-value">${addressHtml}</div>
            </div>
        `;
        
        orderInfoSection.innerHTML = infoHtml;
    }
    // Function to render tracking timeline with improved UI
function renderTrackingTimeline(trackingSteps) {
    if (!timelineContainer) return;
    
    // Clear previous content
    const timelineTrack = timelineContainer.querySelector('.timeline-track');
    if (!timelineTrack) {
        // Create the timeline track if it doesn't exist
        timelineContainer.innerHTML = '<div class="timeline-track"></div>';
    } else {
        // Remove all timeline steps, but keep the track
        Array.from(timelineContainer.children).forEach(child => {
            if (!child.classList.contains('timeline-track')) {
                child.remove();
            }
        });
    }
    
    // If no tracking steps, show empty state
    if (!trackingSteps || trackingSteps.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'timeline-step empty-state';
        emptyState.innerHTML = `
            <div class="step-indicator"></div>
            <div class="step-content">
                <div class="step-title">No tracking updates</div>
                <div class="step-description">Add a tracking status to start building the timeline</div>
            </div>
        `;
        timelineContainer.appendChild(emptyState);
        return;
    }
    
    // Sort tracking steps by date (oldest first for proper timeline display)
    const sortedSteps = [...trackingSteps].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Check if order is delivered
    const isDelivered = sortedSteps.some(step => 
        step.status && step.status.toLowerCase() === 'delivered'
    );
    
    // Add each tracking step to the timeline
    sortedSteps.forEach((step, index) => {
        // All steps are completed if delivered or if not the last step
        const isCompleted = isDelivered || index < sortedSteps.length - 1;
        // Step is current only if it's the last step and not delivered
        const isCurrent = !isDelivered && index === sortedSteps.length - 1;
        
        const stepElement = document.createElement('div');
        stepElement.className = `timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`;
        stepElement.setAttribute('data-id', step._id || '');
        
        const stepDate = new Date(step.timestamp);
        const formattedDate = `${stepDate.toLocaleDateString()} - ${stepDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        stepElement.innerHTML = `
            <div class="step-indicator ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}"></div>
            <div class="step-content">
                <div class="step-title">${step.status || 'Status Update'}</div>
                <div class="step-date">${formattedDate}</div>
                <div class="step-description">${step.description || ''}</div>
                ${step.location ? `<div class="step-location">Location: ${step.location}</div>` : ''}
                ${step.carrier ? `<div class="step-carrier">Carrier: ${step.carrier}</div>` : ''}
            </div>
            <div class="step-actions">
                <button class="action-btn edit-step" data-id="${step._id || index}">Edit</button>
                <button class="action-btn delete-step" data-id="${step._id || index}">Delete</button>
            </div>
        `;
        
        timelineContainer.appendChild(stepElement);
    });
    
    // Add event listeners to edit and delete buttons
    timelineContainer.querySelectorAll('.edit-step').forEach(button => {
        button.addEventListener('click', function() {
            const stepId = this.getAttribute('data-id');
            editTrackingStep(stepId);
        });
    });
    
    timelineContainer.querySelectorAll('.delete-step').forEach(button => {
        button.addEventListener('click', function() {
            const stepId = this.getAttribute('data-id');
            deleteTrackingStep(stepId);
        });
    });
}

// Add this to updateCustomerViewPreview function to ensure delivered is shown as final state
function updateCustomerViewPreview(trackingSteps) {
    if (!customerViewPreview) return;
    
    // Clear previous content
    customerViewPreview.innerHTML = '';
    
    // If no tracking steps, show empty state
    if (!trackingSteps || trackingSteps.length === 0) {
        customerViewPreview.innerHTML = '<div class="no-tracking">No tracking updates available yet.</div>';
        return;
    }
    
    // Sort tracking steps by timestamp (oldest first)
    const sortedSteps = [...trackingSteps].sort((a, b) => {
        return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    // Check if delivered
    const isDelivered = sortedSteps.some(step => 
        step.status && step.status.toLowerCase() === 'delivered'
    );
    
    // Standard steps to ensure all are displayed
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
        
        customerViewPreview.appendChild(stepElement);
    });
    
    // If delivered, don't add any more steps
    if (isDelivered) {
        return;
    }
    
    // Add remaining expected steps
    let foundCurrent = false;
    
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
        
        customerViewPreview.appendChild(stepElement);
    }
}

// Add CSS to your adminTracking.js to ensure timeline display matches your requirements
const timelineStyle = document.createElement('style');
timelineStyle.textContent = `
    .timeline-step.completed .step-indicator {
        background-color: #4CAF50 !important;
        border-color: #4CAF50 !important;
    }
    
    .timeline-step.active .step-indicator {
        background-color: #ff6b00 !important;
        border-color: #ff6b00 !important;
    }
    
    /* For customer timeline view */
    .tracking-step.completed .step-marker {
        background-color: #4CAF50 !important;
        border-color: #4CAF50 !important;
    }
    
    .tracking-step.current .step-marker {
        background-color: #ff6b00 !important;
        border-color: #ff6b00 !important;
    }
`;
document.head.appendChild(timelineStyle);
    
    // Function to update the customer view preview
    function updateCustomerViewPreview(trackingSteps) {
        if (!customerViewPreview) return;
        
        // Clear previous content
        customerViewPreview.innerHTML = '';
        
        // If no tracking steps, show empty state
        if (!trackingSteps || trackingSteps.length === 0) {
            customerViewPreview.innerHTML = '<div class="no-tracking">No tracking updates available yet.</div>';
            return;
        }
        
        // Sort tracking steps by timestamp (oldest first for customer view)
        const sortedSteps = [...trackingSteps].sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });
        
        // Standard steps to ensure all are displayed
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
            
            customerViewPreview.appendChild(stepElement);
        });
        
        // Add remaining expected steps
        let foundCurrent = false;
        
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
            
            customerViewPreview.appendChild(stepElement);
        }
    }
    
    // Function to edit a tracking step
    function editTrackingStep(stepId) {
        // Find the timeline step
        const stepElement = document.querySelector(`.timeline-step[data-id="${stepId}"]`);
        if (!stepElement) return;
        
        // Get the step data
        const title = stepElement.querySelector('.step-title').textContent;
        const description = stepElement.querySelector('.step-description').textContent;
        const locationElement = stepElement.querySelector('.step-location');
        const location = locationElement ? locationElement.textContent.replace('Location: ', '') : '';
        const carrierElement = stepElement.querySelector('.step-carrier');
        const carrier = carrierElement ? carrierElement.textContent.replace('Carrier: ', '') : '';
        
        // Populate the edit form
        const editStatusSelect = document.getElementById('edit-status');
        const editTitleInput = document.getElementById('edit-title');
        const editLocationInput = document.getElementById('edit-location');
        const editNotesInput = document.getElementById('edit-notes');
        const editDateTimeInput = document.getElementById('edit-date-time');
        const editTrackingIdInput = document.getElementById('edit-tracking-id');
        
        if (editStatusSelect) editStatusSelect.value = getStatusValue(title);
        if (editTitleInput) editTitleInput.value = title;
        if (editLocationInput) editLocationInput.value = location;
        if (editNotesInput) editNotesInput.value = description;
        
        // Set the tracking ID in the hidden field
        if (editTrackingIdInput) editTrackingIdInput.value = stepId;
        
        // Try to extract the date from the step
        const dateElement = stepElement.querySelector('.step-date');
        if (dateElement && editDateTimeInput) {
            try {
                const dateStr = dateElement.textContent.split(' - ')[0];
                const timeStr = dateElement.textContent.split(' - ')[1];
                const date = new Date(dateStr + ' ' + timeStr);
                
                // Format for datetime-local input
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                
                editDateTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            } catch (e) {
                console.error('Error parsing date:', e);
                editDateTimeInput.value = formattedDate; // Fall back to current date/time
            }
        }
        
        // Scroll to the edit form
        const editForm = document.querySelector('.status-form:nth-of-type(2)');
        if (editForm) {
            editForm.scrollIntoView({ behavior: 'smooth' });
            editForm.classList.add('highlight');
            setTimeout(() => {
                editForm.classList.remove('highlight');
            }, 1000);
        }
    }
    
    // Helper function to map status title to value
    function getStatusValue(title) {
        const statusMap = {
            'Order Placed': 'order_placed',
            'Order Processed': 'processing',
            'Shipped': 'shipped',
            'In Transit': 'in_transit',
            'Out for Delivery': 'out_for_delivery',
            'Delivered': 'delivered'
        };
        
        return statusMap[title] || 'custom';
    }
    
    // Function to delete a tracking step with improved error handling
    function deleteTrackingStep(stepId) {
        if (confirm('Are you sure you want to delete this tracking step?')) {
            const orderId = orderSelect ? orderSelect.value : null;
            if (!orderId) {
                alert('Please select an order first');
                return;
            }
            
            // Show loading indicator
            const stepElement = document.querySelector(`.timeline-step[data-id="${stepId}"]`);
            if (stepElement) {
                stepElement.classList.add('loading');
            }
            
            fetch(`/api/admin/orders/${orderId}/tracking/${stepId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(handleApiResponse)
            .then(data => {
                if (data.success) {
                    // Refresh the order details
                    fetchOrderDetails(orderId);
                    
                    // Show success message
                    showNotification('Tracking step deleted successfully', 'success');
                } else {
                    console.error('Error:', data.message);
                    showNotification(data.message || 'Failed to delete tracking step', 'error');
                    
                    // Remove loading state
                    if (stepElement) {
                        stepElement.classList.remove('loading');
                    }
                }
            })
            .catch(error => {
                console.error('Error deleting tracking step:', error);
                showNotification('Failed to delete tracking step: ' + error.message, 'error');
                
                // Remove loading state
                if (stepElement) {
                    stepElement.classList.remove('loading');
                }
            });
        }
    }
    
    // Function to add a new tracking status with improved validation
    function addTrackingStatus(formData) {
        const orderId = orderSelect ? orderSelect.value : null;
        if (!orderId) {
            showNotification('Please select an order first', 'warning');
            return;
        }
        
        // Validate required fields
        if (!formData.status) {
            showNotification('Status is required', 'warning');
            return;
        }
        
        // Show loading state on the form
        const submitBtn = addStatusForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Adding...';
        }
        
        fetch(`/api/admin/orders/${orderId}/tracking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(handleApiResponse)
        .then(data => {
            if (data.success) {
                // Refresh the order details
                fetchOrderDetails(orderId);
                
                // Reset the form
                addStatusForm.reset();
                
                // Reset date/time input
                if (dateTimeInput) {
                    dateTimeInput.value = formattedDate;
                }
                
                // Show success message
                showNotification('Tracking status added successfully', 'success');
            } else {
                console.error('Error:', data.message);
                showNotification(data.message || 'Failed to add tracking status', 'error');
            }
        })
        .catch(error => {
            console.error('Error adding tracking status:', error);
            showNotification('Failed to add tracking status: ' + error.message, 'error');
        })
        .finally(() => {
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Add Status Update';
            }
        });
    }
    
    // Helper function to show notifications
    function showNotification(message, type = 'info') {
        // Check if notification container exists, create if not
        let notifContainer = document.querySelector('.notification-container');
        if (!notifContainer) {
            notifContainer = document.createElement('div');
            notifContainer.className = 'notification-container';
            document.body.appendChild(notifContainer);
            
            // Add styles if not already in stylesheet
            if (!document.querySelector('#notification-styles')) {
                const style = document.createElement('style');
                style.id = 'notification-styles';
                style.innerHTML = `
                    .notification-container {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 9999;
                    }
                    .notification {
                        padding: 12px 20px;
                        margin-bottom: 10px;
                        border-radius: 4px;
                        color: white;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                        animation: notification-slide 0.3s ease-out;
                    }
                    .notification.success { background-color: #2ecc71; }
                    .notification.error { background-color: #e74c3c; }
                    .notification.warning { background-color: #f39c12; }
                    .notification.info { background-color: #3498db; }
                    @keyframes notification-slide {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to container
        notifContainer.appendChild(notification);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Update existing tracking step
    function updateTrackingStep(trackingId, formData) {
        const orderId = orderSelect ? orderSelect.value : null;
        if (!orderId) {
            showNotification('Please select an order first', 'warning');
            return;
        }
        
        // Validate required fields
        if (!formData.status) {
            showNotification('Status is required', 'warning');
            return;
        }
        
        // Show loading state
        const submitBtn = editStatusForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Saving...';
        }
        
        fetch(`/api/admin/orders/${orderId}/tracking/${trackingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(handleApiResponse)
        .then(data => {
            if (data.success) {
                // Refresh the order details
                fetchOrderDetails(orderId);
                
                // Reset the form
                editStatusForm.reset();
                
                // Show success message
                showNotification('Tracking status updated successfully', 'success');
            } else {
                console.error('Error:', data.message);
                showNotification(data.message || 'Failed to update tracking status', 'error');
            }
        })
        .catch(error => {
            console.error('Error updating tracking status:', error);
            showNotification('Failed to update tracking status: ' + error.message, 'error');
        })
        .finally(() => {
            // Reset button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Save Changes';
            }
        });
    }
    
    // Event listener for status type selection
    if (statusTypeSelect) {
        statusTypeSelect.addEventListener('change', function() {
            const customStatusField = document.getElementById('custom-status');
            if (customStatusField) {
                customStatusField.parentElement.style.display = this.value === 'custom' ? 'block' : 'none';
            }
        });
    }
    
    // Event listener for order selection
    if (orderSelect) {
        orderSelect.addEventListener('change', function() {
            const orderId = this.value;
            if (orderId) {
                fetchOrderDetails(orderId);
            } else {
                // Clear order details
                if (orderInfoSection) {
                    orderInfoSection.innerHTML = '';
                }
                
                // Clear timeline
                if (timelineContainer) {
                    timelineContainer.innerHTML = '<div class="timeline-track"></div>';
                }
                
                // Clear customer preview
                if (customerViewPreview) {
                    customerViewPreview.innerHTML = '';
                }
            }
        });
    }
    
    // Event listener for add status form submission
    if (addStatusForm) {
        addStatusForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const statusType = statusTypeSelect.value;
            const title = statusType === 'custom' ? customStatusInput.value : statusTypeSelect.options[statusTypeSelect.selectedIndex].text;
            
            if (statusType === 'custom' && !customStatusInput.value.trim()) {
                showNotification('Please enter a custom status title', 'warning');
                return;
            }
            
            const formData = {
                status: title,
                location: locationInput.value,
                description: notesInput.value,
                timestamp: dateTimeInput.value ? new Date(dateTimeInput.value).toISOString() : new Date().toISOString(),
                carrier: carrierSelect.value,
                trackingNumber: trackingNumberInput ? trackingNumberInput.value : null,
                notify: notifySelect.value === 'yes'
            };
            
            addTrackingStatus(formData);
        });
    }
    
    // Event listener for edit status form submission
    if (editStatusForm) {
        editStatusForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const editStatusSelect = document.getElementById('edit-status');
            const editTitleInput = document.getElementById('edit-title');
            const editLocationInput = document.getElementById('edit-location');
            const editNotesInput = document.getElementById('edit-notes');
            const editDateTimeInput = document.getElementById('edit-date-time');
            const editTrackingIdInput = document.getElementById('edit-tracking-id');
            
            if (!editTrackingIdInput || !editTrackingIdInput.value) {
                showNotification('No tracking step selected for editing', 'warning');
                return;
            }
            
            const trackingId = editTrackingIdInput.value;
            const title = editTitleInput.value;
            
            if (!title.trim()) {
                showNotification('Please enter a status title', 'warning');
                return;
            }
            
            const formData = {
                status: title,
                location: editLocationInput.value,
                description: editNotesInput.value,
                timestamp: editDateTimeInput.value ? new Date(editDateTimeInput.value).toISOString() : new Date().toISOString()
            };
            
            updateTrackingStep(trackingId, formData);
        });
    }
    
    // Event listener for cancel edit button
    // Event listener for cancel edit button
    const cancelEditBtn = document.getElementById('cancel-edit');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Reset edit form
            if (editStatusForm) {
                editStatusForm.reset();
            }
            
            // Scroll back to the timeline
            if (timelineContainer) {
                timelineContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Add event listener for tracking number updates in the add form
    if (trackingNumberInput && carrierSelect) {
        // When tracking number is updated, automatically save it to the order
        trackingNumberInput.addEventListener('blur', function() {
            const orderId = orderSelect ? orderSelect.value : null;
            if (!orderId || !this.value.trim()) return;
            
            // Check if tracking number changed from what's displayed in the order info
            const currentTrackingNumber = document.querySelector('.info-group:nth-of-type(8) .info-value');
            if (currentTrackingNumber && currentTrackingNumber.textContent === this.value) return;
            
            // Update tracking number
            fetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    trackingNumber: this.value,
                    carrier: carrierSelect.value
                })
            })
            .then(handleApiResponse)
            .then(data => {
                if (data.success) {
                    // Show success message
                    showNotification('Tracking number updated successfully', 'success');
                    
                    // Update the displayed tracking number
                    if (currentTrackingNumber) {
                        currentTrackingNumber.textContent = this.value;
                    }
                }
            })
            .catch(error => {
                console.error('Error updating tracking number:', error);
                showNotification('Failed to update tracking number. Will apply when you add a status.', 'info');
            });
        });
    }
    
    // Add keyboard shortcut for quick status additions
    document.addEventListener('keydown', function(e) {
        // Alt+N to focus on the add new status form
        if (e.altKey && e.key === 'n' && addStatusForm) {
            e.preventDefault();
            statusTypeSelect.focus();
            addStatusForm.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Alt+S to submit the add form
        if (e.altKey && e.key === 's' && addStatusForm) {
            e.preventDefault();
            const submitBtn = addStatusForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.click();
        }
    });
    
    // Function to refresh data periodically
    function setupAutoRefresh() {
        const refreshInterval = 5 * 60 * 1000; // 5 minutes
        
        setInterval(() => {
            const orderId = orderSelect ? orderSelect.value : null;
            if (orderId) {
                console.log('Auto-refreshing order data...');
                fetchOrderDetails(orderId);
            }
        }, refreshInterval);
        
        // Also refresh the order list occasionally
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                console.log('Auto-refreshing order list...');
                fetchOrders();
            }
        }, refreshInterval * 3); // Every 15 minutes
    }
    
    // Check if order ID is provided in URL and select it
    function checkForOrderIdInUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderIdParam = urlParams.get('orderId');
        
        if (orderIdParam && orderSelect) {
            // Wait a bit for orders to load
            setTimeout(() => {
                // Find option with matching orderId
                const option = Array.from(orderSelect.options).find(opt => opt.value === orderIdParam);
                if (option) {
                    orderSelect.value = orderIdParam;
                    fetchOrderDetails(orderIdParam);
                    showNotification('Order loaded from URL', 'info');
                }
            }, 500);
        }
    }
    
    // Add quick status buttons for common status transitions
    function addQuickStatusButtons() {
        const quickActionsDiv = document.createElement('div');
        quickActionsDiv.className = 'quick-actions';
        quickActionsDiv.innerHTML = `
            <h3>Quick Actions</h3>
            <div class="quick-buttons">
                <button class="quick-status-btn" data-status="Order Processed">Mark as Processed</button>
                <button class="quick-status-btn" data-status="Shipped">Mark as Shipped</button>
                <button class="quick-status-btn" data-status="In Transit">Mark as In Transit</button>
                <button class="quick-status-btn" data-status="Out for Delivery">Mark as Out for Delivery</button>
                <button class="quick-status-btn" data-status="Delivered">Mark as Delivered</button>
            </div>
        `;
        
        // Inject quick actions after order info
        if (orderInfoSection) {
            orderInfoSection.parentNode.insertBefore(quickActionsDiv, orderInfoSection.nextSibling);
            
            // Add event listeners to quick status buttons
            quickActionsDiv.querySelectorAll('.quick-status-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const status = this.getAttribute('data-status');
                    const orderId = orderSelect ? orderSelect.value : null;
                    
                    if (!orderId) {
                        showNotification('Please select an order first', 'warning');
                        return;
                    }
                    
                    // Pre-fill form fields
                    if (statusTypeSelect) {
                        const statusValue = getStatusValue(status);
                        statusTypeSelect.value = statusValue;
                        
                        // Trigger change event to handle custom status field visibility
                        statusTypeSelect.dispatchEvent(new Event('change'));
                    }
                    
                    if (notesInput) {
                        notesInput.value = `Order ${status.toLowerCase()}`;
                    }
                    
                    // Scroll to form
                    addStatusForm.scrollIntoView({ behavior: 'smooth' });
                    
                    // Focus on location field
                    if (locationInput) {
                        locationInput.focus();
                    }
                });
            });
        }
    }
    
    // Function to initialize customer calendar preview
    function initCustomerCalendarPreview() {
        // If calendar preview container exists
        const calendarPreview = document.querySelector('.calendar-preview');
        if (!calendarPreview) return;
        
        // Get current order ID
        const orderId = orderSelect ? orderSelect.value : null;
        if (!orderId) return;
        
        // Generate calendar event preview (for future feature)
        const previewHtml = `
            <div class="calendar-event">
                <div class="event-header">Add to Calendar</div>
                <div class="event-body">
                    <p>Customers can add delivery dates to their calendar.</p>
                    <button class="preview-calendar-btn">Generate Calendar Link</button>
                </div>
            </div>
        `;
        
        calendarPreview.innerHTML = previewHtml;
        
        // Add event listener for calendar button
        const calendarBtn = calendarPreview.querySelector('.preview-calendar-btn');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', function() {
                // Example function to generate calendar link
                generateCalendarLink(orderId);
            });
        }
    }
    
    // Example function to generate calendar link
    function generateCalendarLink(orderId) {
        // In a real implementation, this would generate a proper calendar event
        // For now, just show a notification
        showNotification('Calendar link feature coming soon!', 'info');
    }
    
    // Function to add a search filter for orders
    function addOrderSearchFilter() {
        if (!orderSelect) return;
        
        // Create a search input
        const searchContainer = document.createElement('div');
        searchContainer.className = 'order-search';
        searchContainer.innerHTML = `
            <input type="text" id="order-search" placeholder="Search orders by number, email or status...">
            <select id="status-filter">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
            </select>
            <button id="refresh-orders" class="btn btn-primary">Refresh</button>
        `;
        
        // Insert before the order select
        orderSelect.parentNode.insertBefore(searchContainer, orderSelect);
        
        // Add event listeners
        const searchInput = document.getElementById('order-search');
        const statusFilter = document.getElementById('status-filter');
        const refreshBtn = document.getElementById('refresh-orders');
        
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterOrders();
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                filterOrders();
            });
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                fetchOrders();
                showNotification('Orders refreshed', 'info');
            });
        }
        
        // Function to filter orders
        function filterOrders() {
            const searchText = searchInput ? searchInput.value.toLowerCase() : '';
            const statusText = statusFilter ? statusFilter.value.toLowerCase() : '';
            
            if (!orderSelect) return;
            
            // Loop through all options (except the first placeholder)
            Array.from(orderSelect.options).forEach((option, index) => {
                if (index === 0) return; // Skip placeholder
                
                const optionText = option.textContent.toLowerCase();
                const matchesSearch = !searchText || optionText.includes(searchText);
                const matchesStatus = !statusText || optionText.includes(statusText);
                
                // Show/hide based on filters
                option.style.display = matchesSearch && matchesStatus ? '' : 'none';
            });
        }
    }
    
    // Initialize additional UI features
    function initUI() {
        // Setup auto-refresh
        setupAutoRefresh();
        
        // Check for order ID in URL
        checkForOrderIdInUrl();
        
        // Add quick status buttons
        addQuickStatusButtons();
        
        // Add order search filter
        addOrderSearchFilter();
        
        // Add loading indicator styles
        const style = document.createElement('style');
        style.textContent = `
            .loading {
                position: relative;
                min-height: 50px;
                padding: 15px;
                text-align: center;
                color: #666;
            }
            .loading:after {
                content: '';
                position: absolute;
                width: 20px;
                height: 20px;
                top: 50%;
                left: 50%;
                margin-top: -10px;
                margin-left: -10px;
                border: 2px solid #3498db;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spinner 0.8s linear infinite;
            }
            @keyframes spinner {
                to { transform: rotate(360deg); }
            }
            .timeline-step.loading .step-actions {
                opacity: 0.5;
                pointer-events: none;
            }
            .highlight {
                animation: highlight-pulse 1s ease-out;
            }
            @keyframes highlight-pulse {
                0% { background-color: #f8f9fa; }
                50% { background-color: #e9f5ff; }
                100% { background-color: #f8f9fa; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Fetch orders when the page loads
    fetchOrders();
    
    // Initialize UI enhancements
    initUI();


    addMessageViewingCapability();

});
// Function to add Quick Action buttons
function addQuickActionButtons() {
    const actionContainer = document.createElement('div');
    actionContainer.className = 'quick-actions';
    actionContainer.innerHTML = `
        <h3>Quick Actions</h3>
        <div class="action-buttons">
            <button class="quick-action-btn" data-status="Order Processed">Mark as Processed</button>
            <button class="quick-action-btn" data-status="Shipped">Mark as Shipped</button>
            <button class="quick-action-btn" data-status="In Transit">Mark as In Transit</button>
            <button class="quick-action-btn" data-status="Out for Delivery">Mark as Out for Delivery</button>
            <button class="quick-action-btn" data-status="Delivered">Mark as Delivered</button>
        </div>
    `;
    
    // Add to the DOM - insert after the order selection area
    const orderSelect = document.getElementById('order-select');
    if (orderSelect && orderSelect.parentNode) {
        orderSelect.parentNode.insertBefore(actionContainer, orderSelect.nextSibling);
    }
    
    // Add event listeners to quick action buttons
    const quickActionButtons = document.querySelectorAll('.quick-action-btn');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            const orderId = document.getElementById('order-select').value;
            
            if (!orderId) {
                alert('Please select an order first');
                return;
            }
            
            // Confirm action
            if (confirm(`Are you sure you want to mark this order as "${status}"?`)) {
                // Create tracking update with this status
                const formData = {
                    status: status,
                    description: `Order marked as ${status.toLowerCase()}`,
                    timestamp: new Date().toISOString(),
                    location: 'Distribution Center',
                    carrier: 'Standard Shipping'
                };
                
                // Add tracking status
                addTrackingStatus(formData);
            }
        });
    });
    // Add this function to adminTracking.js to integrate message viewing capabilities

// Function to add message viewing capability to admin tracking page
function addMessageViewingCapability() {
    // Create a message section in the interface
    const messageSection = document.createElement('section');
    messageSection.className = 'tracking-panel messages-panel';
    messageSection.innerHTML = `
        <div class="panel-header">
            <h2 class="panel-title">Recent Customer Messages</h2>
            <a href="/admin/messages" class="btn btn-primary">View All Messages</a>
        </div>
        
        <div class="message-list">
            <div class="message-filters">
                <button class="filter-btn active" data-filter="all">All</button>
                <button class="filter-btn" data-filter="new">New</button>
                <button class="filter-btn" data-filter="in-progress">In Progress</button>
                <button class="filter-btn" data-filter="resolved">Resolved</button>
            </div>
            
            <div class="messages-container">
                <div class="loading">Loading messages...</div>
            </div>
        </div>
        
        <div class="message-detail" style="display: none;">
            <div class="message-header">
                <h3 class="message-subject"></h3>
                <div class="message-meta">
                    <span class="message-from"></span>
                    <span class="message-date"></span>
                </div>
            </div>
            <div class="message-body"></div>
            <div class="message-actions">
                <div class="status-group">
                    <label>Status:</label>
                    <select class="status-select">
                        <option value="new">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
                <div class="reply-form">
                    <textarea placeholder="Type your reply here..."></textarea>
                    <button class="reply-btn btn btn-success">Send Reply</button>
                </div>
            </div>
        </div>
    `;
    const mainContainer = document.querySelector('main.container');
    if (mainContainer) {
        mainContainer.appendChild(messageSection);
    }
    // Add CSS for messages
    const messageStyles = document.createElement('style');
    messageStyles.textContent = `
        .messages-panel {
            margin-top: 30px;
        }
        
        .message-list {
            margin-bottom: 20px;
        }
        
        .messages-container {
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .message-card {
            padding: 15px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .message-card:hover {
            background-color: #f5f5f5;
        }
        
        .message-card.unread {
            border-left: 3px solid #3498db;
            background-color: #f8f9fa;
        }
        
        .message-card.active {
            background-color: #e9f5ff;
        }
        
        .message-card-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .message-card-subject {
            font-weight: bold;
            color: #333;
        }
        
        .message-card-date {
            color: #888;
            font-size: 14px;
        }
        
        .message-card-preview {
            color: #666;
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .message-card-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            font-size: 14px;
        }
        
        .message-card-sender {
            color: #555;
        }
        
        .message-status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            text-transform: uppercase;
        }
        
        .message-status.new {
            background-color: #e3f2fd;
            color: #1976d2;
        }
        
        .message-status.in-progress {
            background-color: #fff8e1;
            color: #ff8f00;
        }
        
        .message-status.resolved {
            background-color: #e8f5e9;
            color: #388e3c;
        }
        
        .message-detail {
            background-color: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            margin-top: 20px;
        }
        
        .message-header {
            margin-bottom: 20px;
        }
        
        .message-subject {
            font-size: 20px;
            margin-bottom: 10px;
        }
        
        .message-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            color: #666;
            font-size: 14px;
        }
        
        .message-body {
            padding: 20px 0;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        
        .message-actions {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .status-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-select {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .reply-form {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .reply-form textarea {
            width: 100%;
            height: 120px;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            resize: vertical;
        }
        
        .reply-btn {
            align-self: flex-end;
        }
        
        .no-messages {
            padding: 30px;
            text-align: center;
            color: #888;
        }
    `;
    document.head.appendChild(messageStyles);
    
    // Fetch recent messages from the API
    fetchRecentMessages();
    
    // Add event listeners for message filter buttons
    const filterButtons = document.querySelectorAll('.messages-panel .filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get filter value
            const filter = this.getAttribute('data-filter');
            
            // Fetch messages with filter
            fetchRecentMessages(filter);
        });
    });
    
    // Function to fetch recent messages
    function fetchRecentMessages(filter = 'all') {
        const messagesContainer = document.querySelector('.messages-container');
        if (!messagesContainer) return;
        
        // Show loading state
        messagesContainer.innerHTML = '<div class="loading">Loading messages...</div>';
        
        // Build query parameters
        let url = '/api/messages';
        if (filter !== 'all') {
            url += `?status=${filter}`;
        }
        
        // Fetch messages
        fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(handleApiResponse)
        .then(data => {
            if (data.success && data.data) {
                displayMessages(data.data);
            } else {
                messagesContainer.innerHTML = '<div class="no-messages">No messages found</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching messages:', error);
            messagesContainer.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        });
    }
    
    // Function to display messages
    function displayMessages(messages) {
        const messagesContainer = document.querySelector('.messages-container');
        if (!messagesContainer) return;
        
        // Clear container
        messagesContainer.innerHTML = '';
        
        // If no messages, show empty state
        if (!messages || messages.length === 0) {
            messagesContainer.innerHTML = '<div class="no-messages">No messages found</div>';
            return;
        }
        
        // Display each message
        messages.forEach(message => {
            const messageDate = new Date(message.createdAt);
            const formattedDate = messageDate.toLocaleDateString();
            
            // Create message card
            const messageCard = document.createElement('div');
            messageCard.className = `message-card ${message.isRead ? '' : 'unread'}`;
            messageCard.setAttribute('data-id', message._id);
            
            // Truncate message preview
            const previewText = message.message && message.message.length > 100 
                ? message.message.substring(0, 100) + '...' 
                : message.message || '';
            
            messageCard.innerHTML = `
                <div class="message-card-header">
                    <div class="message-card-subject">${message.subject || 'No Subject'}</div>
                    <div class="message-card-date">${formattedDate}</div>
                </div>
                <div class="message-card-preview">${previewText}</div>
                <div class="message-card-footer">
                    <div class="message-card-sender">${message.name} <${message.email}></div>
                    <div class="message-status ${message.status}">${message.status}</div>
                </div>
            `;
            
            // Add click event to view message details
            messageCard.addEventListener('click', function() {
                // Remove active class from all cards
                document.querySelectorAll('.message-card').forEach(card => {
                    card.classList.remove('active');
                });
                
                // Add active class to clicked card
                this.classList.add('active');
                
                // Mark as read if unread
                if (this.classList.contains('unread')) {
                    this.classList.remove('unread');
                    
                    // Update read status in API
                    updateMessageReadStatus(message._id);
                }
                
                // Show message details
                viewMessageDetails(message._id);
            });
            
            messagesContainer.appendChild(messageCard);
        });
    }
    
    // Function to view message details
    function viewMessageDetails(messageId) {
        const messageDetail = document.querySelector('.message-detail');
        if (!messageDetail) return;
        
        // Show loading state
        messageDetail.style.display = 'block';
        messageDetail.innerHTML = '<div class="loading">Loading message details...</div>';
        
        // Fetch message details
        fetch(`/api/messages/${messageId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(handleApiResponse)
        .then(data => {
            if (data.success && data.data) {
                displayMessageDetails(data.data);
            } else {
                messageDetail.innerHTML = '<div class="error">Failed to load message details</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching message details:', error);
            messageDetail.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        });
    }
    
    // Function to display message details
    function displayMessageDetails(message) {
        const messageDetail = document.querySelector('.message-detail');
        if (!messageDetail) return;
        
        // Format date
        const messageDate = new Date(message.createdAt);
        const formattedDate = `${messageDate.toLocaleDateString()} ${messageDate.toLocaleTimeString()}`;
        
        // Update message detail content
        messageDetail.innerHTML = `
            <div class="message-header">
                <h3 class="message-subject">${message.subject || 'No Subject'}</h3>
                <div class="message-meta">
                    <span class="message-from">From: ${message.name} <${message.email}></span>
                    <span class="message-date">Date: ${formattedDate}</span>
                    ${message.phone ? `<span class="message-phone">Phone: ${message.phone}</span>` : ''}
                </div>
            </div>
            <div class="message-body">${message.message.replace(/\n/g, '<br>')}</div>
            <div class="message-actions">
                <div class="status-group">
                    <label>Status:</label>
                    <select class="status-select" data-id="${message._id}">
                        <option value="new" ${message.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="in-progress" ${message.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${message.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                    <button class="btn btn-primary update-status-btn">Update Status</button>
                </div>
                <div class="reply-form">
                    <textarea placeholder="Type your reply here..."></textarea>
                    <button class="reply-btn btn btn-success" data-id="${message._id}" data-email="${message.email}">Send Reply</button>
                </div>
            </div>
        `;
        
        // Add event listener to update status button
        const updateStatusBtn = messageDetail.querySelector('.update-status-btn');
        if (updateStatusBtn) {
            updateStatusBtn.addEventListener('click', function() {
                const statusSelect = messageDetail.querySelector('.status-select');
                const messageId = statusSelect.getAttribute('data-id');
                const status = statusSelect.value;
                
                updateMessageStatus(messageId, status);
            });
        }
        
        // Add event listener to reply button
        const replyBtn = messageDetail.querySelector('.reply-btn');
        if (replyBtn) {
            replyBtn.addEventListener('click', function() {
                const messageId = this.getAttribute('data-id');
                const email = this.getAttribute('data-email');
                const replyText = messageDetail.querySelector('.reply-form textarea').value;
                
                if (!replyText.trim()) {
                    showNotification('Please enter a reply message', 'warning');
                    return;
                }
                
                sendReply(messageId, email, replyText);
            });
        }
    }
    
    // Function to update message read status
    function updateMessageReadStatus(messageId) {
        fetch(`/api/messages/${messageId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(handleApiResponse)
        .then(data => {
            // Message is now marked as read in the database
            console.log('Message marked as read:', messageId);
        })
        .catch(error => {
            console.error('Error marking message as read:', error);
        });
    }
    
    // Function to update message status
    function updateMessageStatus(messageId, status) {
        fetch(`/api/messages/${messageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        })
        .then(handleApiResponse)
        .then(data => {
            if (data.success) {
                showNotification('Message status updated successfully', 'success');
                
                // Update status in message card
                const messageCard = document.querySelector(`.message-card[data-id="${messageId}"]`);
                if (messageCard) {
                    const statusElement = messageCard.querySelector('.message-status');
                    if (statusElement) {
                        statusElement.className = `message-status ${status}`;
                        statusElement.textContent = status;
                    }
                }
            } else {
                showNotification('Failed to update message status', 'error');
            }
        })
        .catch(error => {
            console.error('Error updating message status:', error);
            showNotification('Error: ' + error.message, 'error');
        });
    }
    
    // Function to send reply to a message
    function sendReply(messageId, email, replyText) {
        // Disable reply button to prevent multiple submissions
        const replyBtn = document.querySelector(`.reply-btn[data-id="${messageId}"]`);
        if (replyBtn) {
            replyBtn.disabled = true;
            replyBtn.innerHTML = 'Sending...';
        }
        
        fetch(`/api/messages/${messageId}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ replyText })
        })
        .then(handleApiResponse)
        .then(data => {
            if (data.success) {
                showNotification('Reply sent successfully', 'success');
                
                // Clear reply text
                const textarea = document.querySelector('.reply-form textarea');
                if (textarea) {
                    textarea.value = '';
                }
                
                // Update message status to in-progress
                updateMessageStatus(messageId, 'in-progress');
            } else {
                showNotification('Failed to send reply', 'error');
            }
        })
        .catch(error => {
            console.error('Error sending reply:', error);
            showNotification('Error: ' + error.message, 'error');
        })
        .finally(() => {
            // Re-enable reply button
            if (replyBtn) {
                replyBtn.disabled = false;
                replyBtn.innerHTML = 'Send Reply';
            }
        });
    }
}

// Add this line at the end of the document.addEventListener('DOMContentLoaded', function() { ... }) in adminTracking.js
addMessageViewigCapability();

    // Add a style for quick action buttons
    const style = document.createElement('style');
    style.textContent = `
        .quick-actions {
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 6px;
        }
        
        .quick-actions h3 {
            margin-bottom: 10px;
            font-size: 16px;
            color: #333;
        }
        
        .action-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .quick-action-btn {
            padding: 8px 12px;
            background-color: #e9ecef;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .quick-action-btn:hover {
            background-color: #6c757d;
            color: white;
        }
    `;
    document.head.appendChild(style);
}