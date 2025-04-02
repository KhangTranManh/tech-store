// addresses.js - Handles address management functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (window.authUtils && !window.authUtils.isUserLoggedIn()) {
        // If not logged in, redirect to login page
        window.location.href = '/login.html?redirect=addresses.html';
        return;
    }
    
    // Load user data for sidebar
    loadUserProfile();
    
    // Load user's addresses
    loadAddresses();
    
    // Initialize address form modal
    initAddressForm();
    
    // Set up logout button
    setupLogoutButton();
});

/**
 * Load user profile data for the sidebar
 */
function loadUserProfile() {
    // Try to get user data from session storage first
    const storedData = sessionStorage.getItem('authUser');
    if (storedData) {
        try {
            const userData = JSON.parse(storedData);
            updateUserInfo(userData);
        } catch (error) {
            console.error('Error parsing stored user data:', error);
        }
    }
    
    // Always fetch fresh data from server
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
            sessionStorage.setItem('authUser', JSON.stringify(data.user));
        } else {
            // If authentication failed, redirect to login
            if (data.message === 'Not authenticated') {
                window.location.href = '/login.html?redirect=addresses.html';
            }
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        window.location.href = '/login.html?redirect=addresses.html';
    });
}

/**
 * Update user info in the sidebar
 */
function updateUserInfo(userData) {
    // Update avatar
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar && userData.firstName) {
        userAvatar.textContent = userData.firstName.charAt(0).toUpperCase();
    }
    
    // Update name
    const userName = document.getElementById('userName');
    if (userName) {
        userName.textContent = `${userData.firstName} ${userData.lastName}`;
    }
    
    // Update email
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = userData.email;
    }
}

/**
 * Set up logout button functionality
 */
function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    
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
                    sessionStorage.removeItem('authUser');
                    
                    if (typeof window.showNotification === 'function') {
                        window.showNotification('Logged out successfully!', 'success');
                    }
                    
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
}

/**
 * Load user's addresses from the server
 */
function loadAddresses() {
    const addressesList = document.getElementById('addressesList');
    
    // Show loading state
    if (addressesList) {
        addressesList.innerHTML = '<div class="loading-addresses">Loading your addresses...</div>';
    }
    
    // Fetch addresses from server
    fetch('/api/addresses', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch addresses');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displayAddresses(data.addresses);
        } else {
            showStatusMessage('Failed to load addresses: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error fetching addresses:', error);
        showStatusMessage('An error occurred while loading your addresses. Please try again.', 'error');
    });
}

/**
 * Display addresses in the addresses list
 * @param {Array} addresses - Array of address objects
 */
function displayAddresses(addresses) {
    const addressesList = document.getElementById('addressesList');
    
    if (!addressesList) return;
    
    // Clear previous content
    addressesList.innerHTML = '';
    
    if (!addresses || addresses.length === 0) {
        // Display empty state
        addressesList.innerHTML = `
            <div class="empty-addresses">
                <i>📍</i>
                <h3>No addresses found</h3>
                <p>You haven't added any addresses yet.</p>
                <button class="add-btn" onclick="document.getElementById('addAddressBtn').click()"><i>+</i> Add New Address</button>
            </div>
        `;
        return;
    }
    
    // Create and append address cards
    addresses.forEach(address => {
        const addressCard = createAddressCard(address);
        addressesList.appendChild(addressCard);
    });
}

/**
 * Create an address card element
 * @param {Object} address - Address object
 * @returns {HTMLElement} Address card element
 */
function createAddressCard(address) {
    // Create address card element
    const addressCard = document.createElement('div');
    addressCard.className = 'address-card';
    addressCard.dataset.id = address._id;
    
    // Add default badge if it's the default address
    if (address.isDefault) {
        addressCard.classList.add('default');
        const defaultBadge = document.createElement('div');
        defaultBadge.className = 'default-badge';
        defaultBadge.textContent = 'Default';
        addressCard.appendChild(defaultBadge);
    }
    
    // Format address type with icon
    let addressTypeIcon = '🏠';
    if (address.addressType === 'work') {
        addressTypeIcon = '🏢';
    } else if (address.addressType === 'other') {
        addressTypeIcon = '📍';
    }
        
        // Create address card content
        addressCard.innerHTML = `
            <div class="address-type">
                <i>${addressTypeIcon}</i> ${capitalizeFirstLetter(address.addressType)} Address
            </div>
            
            <div class="address-name">${address.firstName} ${address.lastName}</div>
            
            <div class="address-details">
                ${address.street}${address.apartment ? ', ' + address.apartment : ''}<br>
                ${address.city}, ${address.state} ${address.postalCode}<br>
                ${address.country}
            </div>
            
            <div class="address-phone">${address.phone}</div>
            
            <div class="address-actions">
                <button class="address-action-btn edit" data-id="${address._id}">Edit</button>
                ${!address.isDefault ? `<button class="address-action-btn default" data-id="${address._id}">Set as Default</button>` : ''}
                <button class="address-action-btn delete" data-id="${address._id}">Delete</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const editButton = addressCard.querySelector('.edit');
        const deleteButton = addressCard.querySelector('.delete');
        const defaultButton = addressCard.querySelector('.default');
        
        editButton.addEventListener('click', function() {
            editAddress(address);
        });
        
        deleteButton.addEventListener('click', function() {
            deleteAddress(address._id);
        });
        
        if (defaultButton) {
            defaultButton.addEventListener('click', function() {
                setDefaultAddress(address._id);
            });
        }
        
        return addressCard;
        }
        
        /**
         * Initialize address form modal
         */
        function initAddressForm() {
            const addAddressBtn = document.getElementById('addAddressBtn');
            const addressFormContainer = document.getElementById('addressFormContainer');
            const closeFormBtn = document.getElementById('closeFormBtn');
            const cancelBtn = document.getElementById('cancelBtn');
            const addressForm = document.getElementById('addressForm');
            
            // Show modal when "Add Address" button is clicked
            addAddressBtn.addEventListener('click', function() {
                // Reset form
                addressForm.reset();
                document.getElementById('addressId').value = '';
                document.getElementById('formTitle').textContent = 'Add New Address';

                hideFormStatusMessage();

                
                // Show modal
                addressFormContainer.classList.add('active');
            });
            
            // Hide modal when close button is clicked
            closeFormBtn.addEventListener('click', hideAddressForm);
            
            // Hide modal when cancel button is clicked
            cancelBtn.addEventListener('click', hideAddressForm);
            
            // Hide modal when clicking outside the form
            addressFormContainer.addEventListener('click', function(e) {
                if (e.target === addressFormContainer) {
                    hideAddressForm();
                }
            });
            
            // Handle form submission
            addressForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form data
                const formData = {
                    addressId: document.getElementById('addressId').value,
                    addressType: document.getElementById('addressType').value,
                    firstName: document.getElementById('firstName').value,
                    lastName: document.getElementById('lastName').value,
                    phone: document.getElementById('phone').value,
                    street: document.getElementById('street').value,
                    apartment: document.getElementById('apartment').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    postalCode: document.getElementById('postalCode').value,
                    country: document.getElementById('country').value,
                    isDefault: document.getElementById('isDefault').checked
                };
                
                // Validate form data
                if (!validateAddressForm(formData)) {
                    return;
                }
                
                // Determine if this is an add or update operation
                const isUpdate = !!formData.addressId;
                
                // API endpoint and method
                const url = isUpdate 
                    ? `/api/addresses/${formData.addressId}` 
                    : '/api/addresses';
                const method = isUpdate ? 'PUT' : 'POST';
                
                // Send data to server
                fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData),
                    credentials: 'include'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Show success message
                        showStatusMessage(
                            isUpdate ? 'Address updated successfully!' : 'Address added successfully!', 
                            'success'
                        );
                        
                        // Hide form
                        hideAddressForm();
                        
                        // Reload addresses
                        loadAddresses();
                    } else {
                        showStatusMessage('Error: ' + data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error saving address:', error);
                    showStatusMessage('An error occurred while saving your address. Please try again.', 'error');
                });
            });
        }
        
        /**
         * Hide the address form modal
         */
        function hideAddressForm() {
            const addressFormContainer = document.getElementById('addressFormContainer');
            addressFormContainer.classList.remove('active');
        }
        
        /**
         * Edit an existing address
         * @param {Object} address - Address object to edit
         */
        function editAddress(address) {
            // Update form title
            document.getElementById('formTitle').textContent = 'Edit Address';
            
            // Populate form fields
            document.getElementById('addressId').value = address._id;
            document.getElementById('addressType').value = address.addressType;
            document.getElementById('firstName').value = address.firstName;
            document.getElementById('lastName').value = address.lastName;
            document.getElementById('phone').value = address.phone;
            document.getElementById('street').value = address.street;
            document.getElementById('apartment').value = address.apartment || '';
            document.getElementById('city').value = address.city;
            document.getElementById('state').value = address.state;
            document.getElementById('postalCode').value = address.postalCode;
            document.getElementById('country').value = address.country;
            document.getElementById('isDefault').checked = address.isDefault;
            
            // Show form
            document.getElementById('addressFormContainer').classList.add('active');
        }
        
        /**
         * Delete an address
         * @param {string} addressId - ID of the address to delete
         */
        function deleteAddress(addressId) {
            if (!confirm('Are you sure you want to delete this address?')) {
                return;
            }
            
            fetch(`/api/addresses/${addressId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showStatusMessage('Address deleted successfully!', 'success');
                    loadAddresses();
                } else {
                    showStatusMessage('Error: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting address:', error);
                showStatusMessage('An error occurred while deleting the address. Please try again.', 'error');
            });
        }
        
        /**
         * Set an address as the default shipping address
         * @param {string} addressId - ID of the address to set as default
         */
        function setDefaultAddress(addressId) {
            fetch(`/api/addresses/${addressId}/default`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showStatusMessage('Default address updated successfully!', 'success');
                    loadAddresses();
                } else {
                    showStatusMessage('Error: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error setting default address:', error);
                showStatusMessage('An error occurred while updating the default address. Please try again.', 'error');
            });
        }
        
        /**
 * Validate the address form
 * @param {Object} formData - Form data to validate
 * @returns {boolean} Whether the form data is valid
 */
function validateAddressForm(formData) {
    // Check required fields
    const requiredFields = ['firstName', 'lastName', 'phone', 'street', 'city', 'state', 'postalCode', 'country'];
    for (const field of requiredFields) {
        if (!formData[field]) {
            showFormStatusMessage(`Please fill in all required fields.`, 'error');
            return false;
        }
    }
    
    // Validate phone number format
    const phoneRegex = /^\+?[0-9\s\-\(\)]{10,20}$/;
    if (!phoneRegex.test(formData.phone)) {
        showFormStatusMessage('Please enter a valid phone number.', 'error');
        return false;
    }
    
    // Validate postal code format
    const postalRegex = /^[0-9A-Z\s\-]{3,10}$/i;
    if (!postalRegex.test(formData.postalCode)) {
        showFormStatusMessage('Please enter a valid postal/ZIP code.', 'error');
        return false;
    }
    
    return true;
}

/**
 * Show form status message (inside the modal)
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success' or 'error')
 */
function showFormStatusMessage(message, type = 'success') {
    const formStatusMessage = document.getElementById('formStatusMessage');
    
    if (!formStatusMessage) return;
    
    formStatusMessage.textContent = message;
    formStatusMessage.className = `status-message status-${type}`;
    formStatusMessage.style.display = 'block';
}

/**
 * Hide form status message
 */
function hideFormStatusMessage() {
    const formStatusMessage = document.getElementById('formStatusMessage');
    
    if (formStatusMessage) {
        formStatusMessage.style.display = 'none';
    }
}

/**
 * Show status message (on the main page)
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success' or 'error')
 */
function showStatusMessage(message, type = 'success') {
    const statusMessage = document.getElementById('statusMessage');
    
    if (!statusMessage) return;
    
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
    
    // Auto-hide after 5 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
    
    // Scroll to message
    statusMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
        /**
         * Capitalize first letter of a string
         * @param {string} string - String to capitalize
         * @returns {string} Capitalized string
         */
        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }