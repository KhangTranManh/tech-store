// payment-methods.js - Handles payment method management functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (window.authUtils && !window.authUtils.isUserLoggedIn()) {
        // If not logged in, redirect to login page
        window.location.href = '/login.html?redirect=payment-methods.html';
        return;
    }
    
    // Load user data for sidebar
    loadUserProfile();
    
    // Load user's payment methods
    loadPaymentMethods();
    
    // Initialize payment form modal
    initPaymentForm();
    
    // Set up logout button
    setupLogoutButton();
    
    // Setup credit card display interaction
    setupCreditCardDisplay();
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
                window.location.href = '/login.html?redirect=payment-methods.html';
            }
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        window.location.href = '/login.html?redirect=payment-methods.html';
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
 * Load user's payment methods from the server
 */
function loadPaymentMethods() {
    const paymentMethodsList = document.getElementById('paymentMethodsList');
    
    // Show loading state
    if (paymentMethodsList) {
        paymentMethodsList.innerHTML = '<div class="loading-payment-methods">Loading your payment methods...</div>';
    }
    
    // Fetch payment methods from server
    fetch('/api/payment-methods', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch payment methods');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displayPaymentMethods(data.paymentMethods);
        } else {
            showStatusMessage('Failed to load payment methods: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error fetching payment methods:', error);
        showStatusMessage('An error occurred while loading your payment methods. Please try again.', 'error');
    });
}

/**
 * Display payment methods in the list
 * @param {Array} paymentMethods - Array of payment method objects
 */
function displayPaymentMethods(paymentMethods) {
    const paymentMethodsList = document.getElementById('paymentMethodsList');
    
    if (!paymentMethodsList) return;
    
    // Clear previous content
    paymentMethodsList.innerHTML = '';
    
    if (!paymentMethods || paymentMethods.length === 0) {
        // Display empty state
        paymentMethodsList.innerHTML = `
            <div class="empty-payment-methods">
                <i>💳</i>
                <h3>No payment methods found</h3>
                <p>You haven't added any payment methods yet.</p>
                <button class="add-btn" onclick="document.getElementById('addPaymentBtn').click()"><i>+</i> Add Payment Method</button>
            </div>
        `;
        return;
    }
    
    // Separate credit cards and bank accounts
    const creditCards = paymentMethods.filter(method => method.type === 'card');
    const bankAccounts = paymentMethods.filter(method => method.type === 'bank');
    
    // Add credit cards section
    if (creditCards.length > 0) {
        const cardSectionHeading = document.createElement('h3');
        cardSectionHeading.className = 'section-subtitle';
        cardSectionHeading.textContent = 'Credit/Debit Cards';
        cardSectionHeading.style.margin = '0 0 15px 0';
        cardSectionHeading.style.gridColumn = '1 / -1';
        paymentMethodsList.appendChild(cardSectionHeading);
        
        creditCards.forEach(card => {
            const cardElement = createCreditCardElement(card);
            paymentMethodsList.appendChild(cardElement);
        });
    }
    
    // Add bank accounts section
    if (bankAccounts.length > 0) {
        const bankSectionHeading = document.createElement('h3');
        bankSectionHeading.className = 'section-subtitle';
        bankSectionHeading.textContent = 'Bank Accounts';
        bankSectionHeading.style.margin = '20px 0 15px 0';
        bankSectionHeading.style.gridColumn = '1 / -1';
        paymentMethodsList.appendChild(bankSectionHeading);
        
        bankAccounts.forEach(bank => {
            const bankElement = createBankAccountElement(bank);
            paymentMethodsList.appendChild(bankElement);
        });
    }
}

/**
 * Create a credit card element
 * @param {Object} card - Card object
 * @returns {HTMLElement} Card element
 */
function createCreditCardElement(card) {
    // Create card element
    const cardElement = document.createElement('div');
    cardElement.className = 'payment-method-card';
    cardElement.dataset.id = card._id;
    
    // Add default badge if it's the default payment method
    if (card.isDefault) {
        cardElement.classList.add('default');
        const defaultBadge = document.createElement('div');
        defaultBadge.className = 'default-badge';
        defaultBadge.textContent = 'Default';
        cardElement.appendChild(defaultBadge);
    }
    
    // Determine card brand icon
    let cardBrandIcon = '💳';
    let cardBrandClass = '';
    
    if (card.cardBrand) {
        const brand = card.cardBrand.toLowerCase();
        if (brand === 'visa') {
            cardBrandIcon = '💳';
            cardBrandClass = 'visa';
        } else if (brand === 'mastercard') {
            cardBrandIcon = '💳';
            cardBrandClass = 'mastercard';
        } else if (brand === 'amex' || brand === 'american express') {
            cardBrandIcon = '💳';
            cardBrandClass = 'amex';
        } else if (brand === 'discover') {
            cardBrandIcon = '💳';
            cardBrandClass = 'discover';
        }
    }
    
    // Format card number with asterisks
    const lastFour = card.last4 || '0000';
    const maskedNumber = `•••• •••• •••• ${lastFour}`;
    
    // Format expiry date
    const expiryMonth = card.expiryMonth || '01';
    const expiryYear = card.expiryYear || '2025';
    const expiry = `${expiryMonth}/${expiryYear.substring(2)}`;
    
    // Create card content
    cardElement.innerHTML = `
        <div class="card-type">
            <i class="${cardBrandClass}">${cardBrandIcon}</i> ${card.cardBrand || 'Credit Card'}
        </div>
        
        <div class="card-number">${maskedNumber}</div>
        
        <div class="card-holder">${card.cardHolder || 'Cardholder Name'}</div>
        
        <div class="card-expiry">Expires: ${expiry}</div>
        
        <div class="card-actions">
            <button class="card-action-btn edit" data-id="${card._id}">Edit</button>
            ${!card.isDefault ? `<button class="card-action-btn default" data-id="${card._id}">Set as Default</button>` : ''}
            <button class="card-action-btn delete" data-id="${card._id}">Delete</button>
        </div>
    `;
    
    // Add event listeners to buttons
    const editButton = cardElement.querySelector('.edit');
    const deleteButton = cardElement.querySelector('.delete');
    const defaultButton = cardElement.querySelector('.default');
    
    editButton.addEventListener('click', function() {
        editPaymentMethod(card);
    });
    
    deleteButton.addEventListener('click', function() {
        deletePaymentMethod(card._id);
    });
    
    if (defaultButton) {
        defaultButton.addEventListener('click', function() {
            setDefaultPaymentMethod(card._id);
        });
    }
    
    return cardElement;
}

/**
 * Create a bank account element
 * @param {Object} bankAccount - Bank account object
 * @returns {HTMLElement} Bank account element
 */
function createBankAccountElement(bankAccount) {
    // Create bank account element
    const bankElement = document.createElement('div');
    bankElement.className = 'payment-method-card';
    bankElement.dataset.id = bankAccount._id;
    
    // Add default badge if it's the default payment method
    if (bankAccount.isDefault) {
        bankElement.classList.add('default');
        const defaultBadge = document.createElement('div');
        defaultBadge.className = 'default-badge';
        defaultBadge.textContent = 'Default';
        bankElement.appendChild(defaultBadge);
    }
    
    // Create verified badge if account is verified
    let verifiedBadge = '';
    if (bankAccount.isVerified) {
        verifiedBadge = '<span style="background-color: #4caf50; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 10px;">Verified</span>';
    }
    
    // Format account number with asterisks
    const lastFour = bankAccount.last4 || '0000';
    const maskedNumber = `* ${lastFour}`;
    
    // Create bank account content
    bankElement.innerHTML = `
        <div class="card-type">
            <i style="color: #4caf50;">🏦</i> ${bankAccount.bankName}${verifiedBadge}
        </div>
        
        <div style="margin: 10px 0;">
            <div><strong>Account Holder:</strong> ${bankAccount.accountHolder}</div>
            <div><strong>Account Number:</strong> ${maskedNumber}</div>
            ${bankAccount.branch ? `<div><strong>Branch:</strong> ${bankAccount.branch}</div>` : ''}
        </div>
        
        <div class="card-actions">
            <button class="card-action-btn edit" data-id="${bankAccount._id}">Edit</button>
            ${!bankAccount.isDefault ? `<button class="card-action-btn default" data-id="${bankAccount._id}">Set as Default</button>` : ''}
            <button class="card-action-btn delete" data-id="${bankAccount._id}">Delete</button>
        </div>
    `;
    
    // Add event listeners to buttons
    const editButton = bankElement.querySelector('.edit');
    const deleteButton = bankElement.querySelector('.delete');
    const defaultButton = bankElement.querySelector('.default');
    
    editButton.addEventListener('click', function() {
        editPaymentMethod(bankAccount);
    });
    
    deleteButton.addEventListener('click', function() {
        deletePaymentMethod(bankAccount._id);
    });
    
    if (defaultButton) {
        defaultButton.addEventListener('click', function() {
            setDefaultPaymentMethod(bankAccount._id);
        });
    }
    
    return bankElement;
}

/**
 * Initialize the payment form modal
 */
function initPaymentForm() {
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    const paymentFormContainer = document.getElementById('paymentFormContainer');
    const closeFormBtn = document.getElementById('closeFormBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const paymentForm = document.getElementById('paymentForm');
    
    // Show modal when "Add Payment Method" button is clicked
    addPaymentBtn.addEventListener('click', function() {
        // Reset form
        paymentForm.reset();
        document.getElementById('paymentId').value = '';
        document.getElementById('formTitle').textContent = 'Add Payment Method';

        // Enable card number and CVV fields (fix for the issue)
    document.getElementById('cardNumber').disabled = false;
    document.getElementById('cvv').disabled = false;
        
        // Clear any previous error messages
        hideFormStatusMessage();
        
        // Reset credit card display
        document.getElementById('cardNumberDisplay').textContent = '•••• •••• •••• ••••';
        document.getElementById('cardHolderDisplay').textContent = 'YOUR NAME';
        document.getElementById('cardExpiryDisplay').textContent = 'MM/YY';
        document.getElementById('cardSignatureDisplay').textContent = 'Your Name';
        document.getElementById('cardCvvDisplay').textContent = '•••';
        
        // Reset credit card flip
        document.getElementById('creditCardDisplay').classList.remove('flipped');
        
        // Show modal
        paymentFormContainer.classList.add('active');
    });
    
    // Hide modal when close button is clicked
    closeFormBtn.addEventListener('click', hidePaymentForm);
    
    // Hide modal when cancel button is clicked
    cancelBtn.addEventListener('click', hidePaymentForm);
    
    // Hide modal when clicking outside the form
    paymentFormContainer.addEventListener('click', function(e) {
        if (e.target === paymentFormContainer) {
            hidePaymentForm();
        }
    });
    
    // Handle form submission
    paymentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            paymentId: document.getElementById('paymentId').value,
            cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
            cardHolder: document.getElementById('cardHolder').value,
            expiryMonth: document.getElementById('expiryMonth').value,
            expiryYear: document.getElementById('expiryYear').value,
            cvv: document.getElementById('cvv').value,
            isDefault: document.getElementById('isDefault').checked
        };
        
        // Validate form data
        if (!validatePaymentForm(formData)) {
            return;
        }
        
        // Show loading message
        showFormStatusMessage('Saving payment method...', 'info');
        
        // Determine if this is an add or update operation
        const isUpdate = !!formData.paymentId;
        
        // API endpoint and method
        const url = isUpdate 
            ? `/api/payment-methods/${formData.paymentId}` 
            : '/api/payment-methods';
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
                // Show success message on the main page
                showStatusMessage(
                    isUpdate ? 'Payment method updated successfully!' : 'Payment method added successfully!', 
                    'success'
                );
                
                // Hide form
                hidePaymentForm();
                
                // Reload payment methods
                loadPaymentMethods();
            } else {
                // Show error message in the form
                showFormStatusMessage('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error saving payment method:', error);
            showFormStatusMessage('An error occurred while saving your payment method. Please try again.', 'error');
        });
    });
}

/**
 * Hide the payment form modal
 */
function hidePaymentForm() {
    const paymentFormContainer = document.getElementById('paymentFormContainer');
    paymentFormContainer.classList.remove('active');
    
    // Hide any form status messages
    hideFormStatusMessage();
}

/**
 * Edit an existing payment method
 * @param {Object} paymentMethod - Payment method object to edit
 */
function editPaymentMethod(paymentMethod) {
    // Only handle credit cards for now
    if (paymentMethod.type !== 'card') {
        showStatusMessage('Editing bank accounts is not supported in this version.', 'error');
        return;
    }
    
    // Update form title
    document.getElementById('formTitle').textContent = 'Edit Payment Method';
    
    // Populate form fields - we don't have the full card number due to security
    document.getElementById('paymentId').value = paymentMethod._id;
    document.getElementById('cardNumber').value = `•••• •••• •••• ${paymentMethod.last4}`;
    document.getElementById('cardNumber').disabled = true; // Disable editing card number for security
    document.getElementById('cardHolder').value = paymentMethod.cardHolder;
    document.getElementById('expiryMonth').value = paymentMethod.expiryMonth;
    document.getElementById('expiryYear').value = paymentMethod.expiryYear;
    document.getElementById('cvv').value = '•••';
    document.getElementById('cvv').disabled = true; // Disable editing CVV for security
    document.getElementById('isDefault').checked = paymentMethod.isDefault;
    
    // Update credit card display
    document.getElementById('cardNumberDisplay').textContent = `•••• •••• •••• ${paymentMethod.last4}`;
    document.getElementById('cardHolderDisplay').textContent = paymentMethod.cardHolder.toUpperCase();
    document.getElementById('cardExpiryDisplay').textContent = `${paymentMethod.expiryMonth}/${paymentMethod.expiryYear.substring(2)}`;
    document.getElementById('cardSignatureDisplay').textContent = paymentMethod.cardHolder;
    document.getElementById('cardCvvDisplay').textContent = '•••';
    
    // Show form
    document.getElementById('paymentFormContainer').classList.add('active');
}

/**
 * Delete a payment method
 * @param {string} paymentId - ID of the payment method to delete
 */
function deletePaymentMethod(paymentId) {
    if (!confirm('Are you sure you want to delete this payment method?')) {
        return;
    }
    
    fetch(`/api/payment-methods/${paymentId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStatusMessage('Payment method deleted successfully!', 'success');
            loadPaymentMethods();
        } else {
            showStatusMessage('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting payment method:', error);
        showStatusMessage('An error occurred while deleting the payment method. Please try again.', 'error');
    });
}

/**
 * Set a payment method as the default
 * @param {string} paymentId - ID of the payment method to set as default
 */
function setDefaultPaymentMethod(paymentId) {
    fetch(`/api/payment-methods/${paymentId}/default`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showStatusMessage('Default payment method updated successfully!', 'success');
            loadPaymentMethods();
        } else {
            showStatusMessage('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error setting default payment method:', error);
        showStatusMessage('An error occurred while updating the default payment method. Please try again.', 'error');
    });
}

/**
 * Validate the payment form
 * @param {Object} formData - Form data to validate
 * @returns {boolean} Whether the form data is valid
 */
function validatePaymentForm(formData) {
    // Check if editing
    const isEditing = !!formData.paymentId;
    
    // Skip card number and CVV validation if editing
    if (!isEditing) {
        // Validate card number
        const cardNumberRegex = /^[0-9]{13,19}$/;
        if (!cardNumberRegex.test(formData.cardNumber)) {
            showFormStatusMessage('Please enter a valid card number (13-19 digits).', 'error');
            return false;
        }
        
        // Validate CVV
        const cvvRegex = /^[0-9]{3,4}$/;
        if (!cvvRegex.test(formData.cvv)) {
            showFormStatusMessage('Please enter a valid CVV (3-4 digits).', 'error');
            return false;
        }
    }
    
    // Validate cardholder name
    if (!formData.cardHolder) {
        showFormStatusMessage('Please enter the cardholder name.', 'error');
        return false;
    }
    
    // Validate expiry date
    if (!formData.expiryMonth || !formData.expiryYear) {
        showFormStatusMessage('Please select a valid expiry date.', 'error');
        return false;
    }
    
    // Check if card is expired
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
    
    if (parseInt(formData.expiryYear) < currentYear || 
        (parseInt(formData.expiryYear) === currentYear && parseInt(formData.expiryMonth) < currentMonth)) {
        showFormStatusMessage('This card has expired. Please use a valid card.', 'error');
        return false;
    }
    
    return true;
}

/**
 * Setup interactive credit card display
 */
function setupCreditCardDisplay() {
    const cardNumber = document.getElementById('cardNumber');
    const cardHolder = document.getElementById('cardHolder');
    const expiryMonth = document.getElementById('expiryMonth');
    const expiryYear = document.getElementById('expiryYear');
    const cvv = document.getElementById('cvv');
    const creditCardDisplay = document.getElementById('creditCardDisplay');
    
    // Format card number as user types
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            // Skip if disabled (editing mode)
            if (this.disabled) return;
            
            // Remove non-digits
            let value = this.value.replace(/\D/g, '');
            
            // Add spaces every 4 digits
            if (value.length > 0) {
                value = value.match(/.{1,4}/g).join(' ');
            }
            
            // Update input value
            this.value = value;
            
            // Update card display
            document.getElementById('cardNumberDisplay').textContent = value || '•••• •••• •••• ••••';
        });
    }
    
    // Update cardholder name as user types
    if (cardHolder) {
        cardHolder.addEventListener('input', function() {
            const value = this.value.toUpperCase();
            document.getElementById('cardHolderDisplay').textContent = value || 'YOUR NAME';
            document.getElementById('cardSignatureDisplay').textContent = this.value || 'Your Name';
        });
    }
    
    // Update expiry date as user selects
    if (expiryMonth && expiryYear) {
        const updateExpiry = function() {
            const month = expiryMonth.value || 'MM';
            const year = expiryYear.value ? expiryYear.value.substring(2) : 'YY';
            document.getElementById('cardExpiryDisplay').textContent = `${month}/${year}`;
        };
        
        expiryMonth.addEventListener('change', updateExpiry);
        expiryYear.addEventListener('change', updateExpiry);
    }
    
    // Flip card when user focuses on CVV
    if (cvv && creditCardDisplay) {
        cvv.addEventListener('focus', function() {
            creditCardDisplay.classList.add('flipped');
            // Update CVV display
            document.getElementById('cardCvvDisplay').textContent = this.value.replace(/./g, '•') || '•••';
        });
        
        cvv.addEventListener('blur', function() {
            creditCardDisplay.classList.remove('flipped');
        });
        
        cvv.addEventListener('input', function() {
            // Skip if disabled (editing mode)
            if (this.disabled) return;
            
            // Only allow digits
            this.value = this.value.replace(/\D/g, '');
            
            // Limit to 4 characters
            if (this.value.length > 4) {
                this.value = this.value.substring(0, 4);
            }
            
            // Update CVV display
            document.getElementById('cardCvvDisplay').textContent = this.value.replace(/./g, '•') || '•••';
        });
    }
    
    // Allow clicking on card to flip it
    if (creditCardDisplay) {
        creditCardDisplay.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
    }
}

/**
 * Show form status message
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success', 'error', or 'info')
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
        formStatusMessage.textContent = '';
    }
}

/**
 * Show status message on the main page
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