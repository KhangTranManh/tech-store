// adminTracking.js - Add this to your frontend/js directory

document.addEventListener('DOMContentLoaded', function() {
    // Reference to DOM elements
    const orderSelect = document.getElementById('order-select');
    const statusTypeSelect = document.getElementById('status');
    const customStatusInput = document.getElementById('custom-status');
    const locationInput = document.getElementById('location');
    const dateTimeInput = document.getElementById('date-time');
    const notesInput = document.getElementById('notes');
    const carrierSelect = document.getElementById('carrier');
    const notifySelect = document.getElementById('notify');
    const addStatusForm = document.querySelector('.status-form form');
    const timelineContainer = document.querySelector('.tracking-timeline');
    const orderInfoSection = document.querySelector('.order-info');
    
    // Set current date and time for the datetime input
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
    if (dateTimeInput) {
        dateTimeInput.value = formattedDate;
    }
    // In adminTracking.js - Check the function that populates the order dropdown
function fetchOrders() {
    // Show loading state
    if (orderSelect) {
      orderSelect.innerHTML = '<option value="">Loading orders...</option>';
    }
    
    fetch('/api/admin/orders')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          // Populate order dropdown
          orderSelect.innerHTML = '<option value="">Select an order...</option>';
          
          data.data.forEach(order => {
            const option = document.createElement('option');
            option.value = order._id;
            
            // Format the display text to include user email
            // Make sure you're getting the email from the populated user field
            const userEmail = order.user && order.user.email ? order.user.email : 'Unknown user';
            option.textContent = `${order.orderNumber || order._id} - ${userEmail}`;
            
            orderSelect.appendChild(option);
          });
        } else {
          orderSelect.innerHTML = '<option value="">No orders found</option>';
        }
      })
      .catch(error => {
        console.error('Error fetching orders:', error);
        orderSelect.innerHTML = '<option value="">Error loading orders</option>';
      });
  }
    
    // Function to fetch and display order details
    function fetchOrderDetails(orderId) {
        if (!orderId) return;
        
        fetch(`/api/admin/orders/${orderId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch order details');
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.data) {
                    displayOrderDetails(data.data);
                    renderTrackingTimeline(data.data.tracking || []);
                } else {
                    console.error('Error: Invalid order data format');
                }
            })
            .catch(error => {
                console.error('Error fetching order details:', error);
            });
    }
    
    // Function to display order details
    function displayOrderDetails(order) {
        if (!orderInfoSection) return;
        
        // Clear previous content
        orderInfoSection.innerHTML = '';
        
        // Create order info grid
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
                <div class="info-label">Order Date</div>
                <div class="info-value">${new Date(order.createdAt).toLocaleDateString()}</div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Shipping Method</div>
                <div class="info-value">${order.shippingMethod || 'Standard'}</div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Tracking Number</div>
                <div class="info-value">${order.trackingNumber || 'Not assigned'}</div>
            </div>
            
            <div class="info-group">
                <div class="info-label">Current Status</div>
                <div class="info-value"><span class="status-badge status-${order.status?.toLowerCase() || 'pending'}">${order.status || 'Pending'}</span></div>
            </div>
        `;
        
        orderInfoSection.innerHTML = infoHtml;
    }
    
    // Function to render tracking timeline
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
            emptyState.className = 'timeline-step';
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
        
        // Sort tracking steps by date
        const sortedSteps = [...trackingSteps].sort((a, b) => {
            return new Date(a.timestamp) - new Date(b.timestamp);
        });
        
        // Add each tracking step to the timeline
        sortedSteps.forEach((step, index) => {
            const isCompleted = index < sortedSteps.length - 1;
            const isCurrent = index === sortedSteps.length - 1;
            
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
        
        // Populate the edit form
        document.getElementById('edit-status').value = getStatusValue(title);
        document.getElementById('edit-title').value = title;
        document.getElementById('edit-location').value = location;
        document.getElementById('edit-notes').value = description;
        
        // Scroll to the edit form
        document.querySelector('.status-form:nth-of-type(2)').scrollIntoView({ behavior: 'smooth' });
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
    
    // Function to delete a tracking step
    function deleteTrackingStep(stepId) {
        if (confirm('Are you sure you want to delete this tracking step?')) {
            const orderId = orderSelect ? orderSelect.value : null;
            if (!orderId) return;
            
            fetch(`/api/admin/orders/${orderId}/tracking/${stepId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete tracking step');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Refresh the order details
                    fetchOrderDetails(orderId);
                    
                    // Show success message
                    alert('Tracking step deleted successfully');
                } else {
                    console.error('Error:', data.message);
                }
            })
            .catch(error => {
                console.error('Error deleting tracking step:', error);
                alert('Failed to delete tracking step');
            });
        }
    }
    
    // Function to add a new tracking status
    function addTrackingStatus(formData) {
        const orderId = orderSelect ? orderSelect.value : null;
        if (!orderId) {
            alert('Please select an order first');
            return;
        }
        
        fetch(`/api/admin/orders/${orderId}/tracking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to add tracking status');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Refresh the order details
                fetchOrderDetails(orderId);
                
                // Reset the form
                addStatusForm.reset();
                
                // Set current date and time for the datetime input
                const now = new Date();
                const formattedDate = now.toISOString().slice(0, 16);
                if (dateTimeInput) {
                    dateTimeInput.value = formattedDate;
                }
                
                // Show success message
                alert('Tracking status added successfully');
            } else {
                console.error('Error:', data.message);
            }
        })
        .catch(error => {
            console.error('Error adding tracking status:', error);
            alert('Failed to add tracking status');
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
            }
        });
    }
    
    // Event listener for add status form submission
    if (addStatusForm) {
        addStatusForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const statusType = statusTypeSelect.value;
            const title = statusType === 'custom' ? customStatusInput.value : statusTypeSelect.options[statusTypeSelect.selectedIndex].text;
            
            const formData = {
                status: title,
                location: locationInput.value,
                description: notesInput.value,
                timestamp: dateTimeInput.value ? new Date(dateTimeInput.value).toISOString() : new Date().toISOString(),
                carrier: carrierSelect.value,
                notify: notifySelect.value === 'yes'
            };
            
            addTrackingStatus(formData);
        });
    }
    
    // Fetch orders when the page loads
    fetchOrders();
});