// checkout.js - Handles all checkout page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (window.authUtils && !window.authUtils.isUserLoggedIn()) {
        // If not logged in, redirect to login page
        window.location.href = '/login.html?redirect=checkout.html';
        return;
    }
    
    // Variables to track selected address and payment method
    let selectedAddressId = null;
    let selectedPaymentMethodId = null;
    let cartData = null;
    
    // Initialize page
    initCheckoutPage();
    
    // Initialize checkout page
    function initCheckoutPage() {
        // Load user's data
        loadUserAddresses();
        loadUserPaymentMethods();
        loadCartData();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Load user's saved addresses
    function loadUserAddresses() {
        const addressList = document.getElementById('address-list');
        
        if (!addressList) return;
        
        addressList.innerHTML = '<div class="loading-info">Loading addresses...</div>';
        
        // Fetch user's addresses from server
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
            addressList.innerHTML = `
                <div class="no-address-msg">
                    <p>Unable to load your addresses. Please try again.</p>
                    <button class="add-new-btn" id="add-address-btn">+ Add New Address</button>
                </div>
            `;
        });
    }
    
    // Display user's addresses
    function displayAddresses(addresses) {
        const addressList = document.getElementById('address-list');
        
        if (!addressList) return;
        
        // Clear previous content
        addressList.innerHTML = '';
        
        if (!addresses || addresses.length === 0) {
            // Display empty state
            addressList.innerHTML = `
                <div class="no-address-msg">
                    <p>You don't have any saved addresses.</p>
                    <button class="add-new-btn" id="add-address-btn">+ Add New Address</button>
                </div>
            `;
            return;
        }
        
        // Get default address
        const defaultAddress = addresses.find(addr => addr.isDefault);
        
        // Display each address
        addresses.forEach(address => {
            const addressElement = document.createElement('div');
            addressElement.className = 'address-card';
            addressElement.dataset.id = address._id;
            
            // If this is default address, select it automatically
            if (address.isDefault) {
                addressElement.classList.add('selected');
                selectedAddressId = address._id;
            }
            
            // Format address type label
            const addressTypeLabel = address.addressType.charAt(0).toUpperCase() + address.addressType.slice(1);
            
            addressElement.innerHTML = `
                <div class="address-type">${addressTypeLabel}</div>
                <div class="recipient-name">${address.firstName} ${address.lastName}</div>
                <div class="address-details">
                    ${address.street}${address.apartment ? ', ' + address.apartment : ''}<br>
                    ${address.city}, ${address.state} ${address.postalCode}<br>
                    ${address.country}<br>
                    ${address.phone}
                </div>
            `;
            
            // Add click event to select this address
            addressElement.addEventListener('click', function() {
                // Remove selected class from all addresses
                document.querySelectorAll('.address-card').forEach(card => {
                    card.classList.remove('selected');
                });
                
                // Add selected class to this address
                this.classList.add('selected');
                
                // Update selected address ID
                selectedAddressId = this.dataset.id;
                
                // Check if we can enable Place Order button
                updateOrderButtonState();
            });
            
            addressList.appendChild(addressElement);
        });
        
        // If no address was selected, select the default or first one
        if (!selectedAddressId && addresses.length > 0) {
            const firstAddress = addressList.querySelector('.address-card');
            if (firstAddress) {
                firstAddress.classList.add('selected');
                selectedAddressId = firstAddress.dataset.id;
            }
        }
        
        // Update order button state
        updateOrderButtonState();
    }
    
    // Load user's saved payment methods
    function loadUserPaymentMethods() {
        const paymentMethodList = document.getElementById('payment-method-list');
        
        if (!paymentMethodList) return;
        
        paymentMethodList.innerHTML = '<div class="loading-info">Loading payment methods...</div>';
        
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
            paymentMethodList.innerHTML = `
                <div class="no-payment-msg">
                    <p>Unable to load your payment methods. Please try again.</p>
                    <button class="add-new-btn" id="add-payment-btn">+ Add New Payment Method</button>
                </div>
            `;
        });
    }
    
    // Display user's payment methods
    function displayPaymentMethods(paymentMethods) {
        const paymentMethodList = document.getElementById('payment-method-list');
        
        if (!paymentMethodList) return;
        
        // Clear previous content
        paymentMethodList.innerHTML = '';
        
        if (!paymentMethods || paymentMethods.length === 0) {
            // Display empty state
            paymentMethodList.innerHTML = `
                <div class="no-payment-msg">
                    <p>You don't have any saved payment methods.</p>
                    <button class="add-new-btn" id="add-payment-btn">+ Add New Payment Method</button>
                </div>
            `;
            return;
        }
        
        // Filter just credit cards for now (we can add bank accounts later)
        const creditCards = paymentMethods.filter(method => method.type === 'card');
        
        if (creditCards.length === 0) {
            paymentMethodList.innerHTML = `
                <div class="no-payment-msg">
                    <p>You don't have any saved credit cards.</p>
                    <button class="add-new-btn" id="add-payment-btn">+ Add New Payment Method</button>
                </div>
            `;
            return;
        }
        
        // Display each credit card
        creditCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'payment-method-card';
            cardElement.dataset.id = card._id;
            
            // If this is default payment method, select it automatically
            if (card.isDefault) {
                cardElement.classList.add('selected');
                selectedPaymentMethodId = card._id;
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
            
            cardElement.innerHTML = `
                <div class="card-type">
                    <i class="${cardBrandClass}">${cardBrandIcon}</i> ${card.cardBrand || 'Credit Card'}
                </div>
                <div class="card-number">${maskedNumber}</div>
                <div class="card-holder">${card.cardHolder || 'Cardholder Name'}</div>
                <div class="card-expiry">Expires: ${expiry}</div>
            `;
            
            // Add click event to select this payment method
            cardElement.addEventListener('click', function() {
                // Remove selected class from all payment methods
                document.querySelectorAll('.payment-method-card').forEach(card => {
                    card.classList.remove('selected');
                });
                
                // Add selected class to this payment method
                this.classList.add('selected');
                
                // Update selected payment method ID
                selectedPaymentMethodId = this.dataset.id;
                
                // Check if we can enable Place Order button
                updateOrderButtonState();
            });
            
            paymentMethodList.appendChild(cardElement);
        });
        
        // If no payment method was selected, select the default or first one
        if (!selectedPaymentMethodId && creditCards.length > 0) {
            const firstCard = paymentMethodList.querySelector('.payment-method-card');
            if (firstCard) {
                firstCard.classList.add('selected');
                selectedPaymentMethodId = firstCard.dataset.id;
            }
        }
        
        // Update order button state
        updateOrderButtonState();
    }
    
    // Load cart data from database
    function loadCartData() {
        const orderSummaryItems = document.getElementById('order-summary-items');
        
        if (!orderSummaryItems) return;
        
        orderSummaryItems.innerHTML = '<div class="loading-info">Loading cart items...</div>';
        
        // Fetch cart data from server
        fetch('/cart', {  // Use your server endpoint
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch cart data');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                cartData = data.cart;
                displayOrderSummary(data.cart);
            } else {
                showStatusMessage('Failed to load cart data: ' + data.message, 'error');
                displayEmptyCart();
            }
        })
        .catch(error => {
            console.error('Error fetching cart data:', error);
            orderSummaryItems.innerHTML = `
                <div class="error-message">
                    <p>Unable to load your cart. Please try again later.</p>
                </div>
            `;
            displayEmptyCart();
        });
    }
    
    // Display empty cart message
    function displayEmptyCart() {
        const orderSummaryItems = document.getElementById('order-summary-items');
        if (!orderSummaryItems) return;
        
        orderSummaryItems.innerHTML = `
            <div class="empty-cart-message">
                <p>Your cart is empty.</p>
                <a href="/" class="add-new-btn">Continue Shopping</a>
            </div>
        `;
        
        // Update totals
        const subtotalElement = document.getElementById('subtotal');
        const shippingCostElement = document.getElementById('shipping-cost');
        const taxAmountElement = document.getElementById('tax-amount');
        const totalAmountElement = document.getElementById('total-amount');
        
        if (subtotalElement) subtotalElement.textContent = '$0.00';
        if (shippingCostElement) shippingCostElement.textContent = '$0.00';
        if (taxAmountElement) taxAmountElement.textContent = '$0.00';
        if (totalAmountElement) totalAmountElement.textContent = '$0.00';
        
        // Disable the place order button
        const placeOrderBtn = document.getElementById('place-order-btn');
        if (placeOrderBtn) {
            placeOrderBtn.disabled = true;
        }
    }
    
    // Display order summary
    function displayOrderSummary(cart) {
        const orderSummaryItems = document.getElementById('order-summary-items');
        const subtotalElement = document.getElementById('subtotal');
        const shippingCostElement = document.getElementById('shipping-cost');
        const taxAmountElement = document.getElementById('tax-amount');
        const totalAmountElement = document.getElementById('total-amount');
        
        if (!orderSummaryItems) return;
        
        // Clear previous content
        orderSummaryItems.innerHTML = '';
        
        if (!cart || !cart.items || cart.items.length === 0) {
            displayEmptyCart();
            return;
        }
        
        // Calculate totals
        const subtotal = cart.items.reduce((total, item) => {
            const price = parseFloat(item.price || 0);
            const quantity = parseInt(item.quantity || 1);
            return total + (price * quantity);
        }, 0);
        
        const shipping = subtotal > 100 ? 0 : 10; // Free shipping for orders over $100
        const tax = subtotal * 0.08; // Assuming 8% tax
        const total = subtotal + shipping + tax;
        
        // Update total elements
        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (shippingCostElement) shippingCostElement.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
        if (taxAmountElement) taxAmountElement.textContent = `$${tax.toFixed(2)}`;
        if (totalAmountElement) totalAmountElement.textContent = `$${total.toFixed(2)}`;
        
        // Display each item
        cart.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'summary-item';
            
            const price = parseFloat(item.price || 0);
            const quantity = parseInt(item.quantity || 1);
            const itemTotal = price * quantity;
            
            itemElement.innerHTML = `
                <img src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}" class="summary-item-img">
                <div class="summary-item-details">
                    <div class="summary-item-name">${item.name}</div>
                    <div class="summary-item-quantity">Qty: ${quantity}</div>
                    <div class="summary-item-price">$${itemTotal.toFixed(2)}</div>
                </div>
            `;
            
            orderSummaryItems.appendChild(itemElement);
        });
        
        // Enable place order button if address and payment method are selected
        updateOrderButtonState();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Add address button
        const addAddressBtn = document.getElementById('add-address-btn');
        if (addAddressBtn) {
            addAddressBtn.addEventListener('click', showAddAddressForm);
        }
        
        // Add payment method button
        const addPaymentBtn = document.getElementById('add-payment-btn');
        if (addPaymentBtn) {
            addPaymentBtn.addEventListener('click', showAddPaymentForm);
        }
        
        // Address form modal close buttons
        const closeAddressFormBtn = document.getElementById('close-address-form');
        const cancelAddressBtn = document.getElementById('cancel-address-btn');
        if (closeAddressFormBtn) {
            closeAddressFormBtn.addEventListener('click', hideAddressForm);
        }
        if (cancelAddressBtn) {
            cancelAddressBtn.addEventListener('click', hideAddressForm);
        }
        
        // Payment form modal close buttons
        const closePaymentFormBtn = document.getElementById('close-payment-form');
        const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
        if (closePaymentFormBtn) {
            closePaymentFormBtn.addEventListener('click', hidePaymentForm);
        }
        if (cancelPaymentBtn) {
            cancelPaymentBtn.addEventListener('click', hidePaymentForm);
        }
        
        // Address form submission
        const addressForm = document.getElementById('address-form');
        if (addressForm) {
            addressForm.addEventListener('submit', submitAddressForm);
        }
        
        // Payment form submission
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', submitPaymentForm);
        }
        
        // Place order button
        const placeOrderBtn = document.getElementById('place-order-btn');
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', placeOrder);
        }
        
        // View orders button in success modal
        const viewOrdersBtn = document.getElementById('view-orders-btn');
        if (viewOrdersBtn) {
            viewOrdersBtn.addEventListener('click', function() {
                window.location.href = '/orders.html';
            });
        }
        
        // Setup credit card display interaction
        setupCreditCardDisplay();
    }
    
    // Show add address form
    function showAddAddressForm() {
        const addressFormModal = document.getElementById('address-form-modal');
        const addressForm = document.getElementById('address-form');
        
        if (addressFormModal && addressForm) {
            // Reset form
            addressForm.reset();
            document.getElementById('address-id').value = '';
            document.getElementById('address-form-title').textContent = 'Add New Address';
            
            // Show modal
            addressFormModal.classList.add('active');
        }
    }
    
    // Hide address form
    function hideAddressForm() {
        const addressFormModal = document.getElementById('address-form-modal');
        
        if (addressFormModal) {
            addressFormModal.classList.remove('active');
        }
    }
    
    // Show add payment method form
    function showAddPaymentForm() {
        const paymentFormModal = document.getElementById('payment-form-modal');
        const paymentForm = document.getElementById('payment-form');
        
        if (paymentFormModal && paymentForm) {
            // Reset form
            paymentForm.reset();
            document.getElementById('payment-id').value = '';
            document.getElementById('payment-form-title').textContent = 'Add Payment Method';
            
            // Enable card fields (in case they were disabled from editing)
            document.getElementById('card-number').disabled = false;
            document.getElementById('cvv').disabled = false;
            
            // Reset credit card display
            document.getElementById('card-number-display').textContent = '•••• •••• •••• ••••';
            document.getElementById('card-holder-display').textContent = 'YOUR NAME';
            document.getElementById('card-expiry-display').textContent = 'MM/YY';
            document.getElementById('card-signature-display').textContent = 'Your Name';
            document.getElementById('card-cvv-display').textContent = '•••';
            
            // Reset credit card flip
            document.getElementById('credit-card-display').classList.remove('flipped');
            
            // Show modal
            paymentFormModal.classList.add('active');
        }
    }
    
    // Hide payment method form
    function hidePaymentForm() {
        const paymentFormModal = document.getElementById('payment-form-modal');
        
        if (paymentFormModal) {
            paymentFormModal.classList.remove('active');
        }
    }
    
    // Submit address form
    function submitAddressForm(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            phone: document.getElementById('phone').value,
            street: document.getElementById('street').value,
            apartment: document.getElementById('apartment').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            postalCode: document.getElementById('postal-code').value,
            country: document.getElementById('country').value,
            addressType: document.getElementById('address-type').value,
            isDefault: document.getElementById('is-default').checked
        };
        
        // Validate form data
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.street || 
            !formData.city || !formData.state || !formData.postalCode || !formData.country) {
            showStatusMessage('Please fill in all required fields', 'error');
            return;
        }
        
        // Get address ID if editing
        const addressId = document.getElementById('address-id').value;
        const isUpdate = !!addressId;
        
        // API endpoint and method
        const url = isUpdate ? `/api/addresses/${addressId}` : '/api/addresses';
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
                loadUserAddresses();
            } else {
                // Show error message
                showStatusMessage('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error placing order:', error);
            showStatusMessage('An error occurred while placing your order. Please try again.', 'error');
        });
    }
    
    // Show order success modal
    function showOrderSuccessModal(order) {
        const orderSuccessModal = document.getElementById('order-success-modal');
        const orderNumber = document.getElementById('order-number');
        const orderDetails = document.getElementById('success-order-details');
        
        if (orderSuccessModal && orderNumber && orderDetails) {
            // Set order number
            orderNumber.textContent = order.orderNumber || order._id;
            
            // Calculate totals
            const subtotal = order.subtotal || cartData.items.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
            
            const shipping = order.shippingCost || (subtotal > 100 ? 0 : 10);
            const tax = order.tax || (subtotal * 0.08);
            const total = order.total || (subtotal + shipping + tax);
            
            // Format order date
            const orderDate = new Date(order.createdAt || Date.now());
            const formattedDate = orderDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Set order details
            orderDetails.innerHTML = `
                <h4 style="margin-bottom: 10px;">Order Summary</h4>
                <div style="margin-bottom: 15px;">
                    <div><strong>Order Date:</strong> ${formattedDate}</div>
                    <div><strong>Payment Method:</strong> Credit Card ending in ${order.paymentLast4 || '****'}</div>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Subtotal:</strong></span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Shipping:</strong></span>
                    <span>${shipping === 0 ? 'Free' : `${shipping.toFixed(2)}`}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span><strong>Tax:</strong></span>
                    <span>${tax.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            `;
            
            // Show modal
            orderSuccessModal.classList.add('active');
        }
    }
    
    // Clear cart after successful order
    function clearCart() {
        // Send request to clear cart
        fetch('/cart/clear', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        })
        .then(() => {
            // Update cart count in header (if function exists)
            if (typeof updateCartCount === 'function') {
                updateCartCount(0);
            }
        })
        .catch(error => {
            console.error('Error clearing cart:', error);
        });
    }
    
    // Show status message
function showStatusMessage(message, type = 'success') {
    const statusMessage = document.getElementById('status-message');
    
    if (!statusMessage) return;
    
    // Set message text
    statusMessage.textContent = message;
    
    // Set message type class
    statusMessage.className = 'status-message';
    if (type === 'success') {
        statusMessage.style.backgroundColor = '#e8f5e9';
        statusMessage.style.color = '#2e7d32';
        statusMessage.style.border = '1px solid #c8e6c9';
    } else if (type === 'error') {
        statusMessage.style.backgroundColor = '#ffebee';
        statusMessage.style.color = '#c62828';
        statusMessage.style.border = '1px solid #ffcdd2';
    } else if (type === 'info') {
        statusMessage.style.backgroundColor = '#e3f2fd';
        statusMessage.style.color = '#1565c0';
        statusMessage.style.border = '1px solid #bbdefb';
    }
    
    // Show message
    statusMessage.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }
    
    // Scroll to message
    statusMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
    // Submit payment form
    function submitPaymentForm(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            cardNumber: document.getElementById('card-number').value.replace(/\s/g, ''),
            cardHolder: document.getElementById('card-holder').value,
            expiryMonth: document.getElementById('expiry-month').value,
            expiryYear: document.getElementById('expiry-year').value,
            cvv: document.getElementById('cvv').value,
            isDefault: document.getElementById('is-default-payment').checked
        };
        
        // Validate form data
        if (!formData.cardNumber || !formData.cardHolder || !formData.expiryMonth || 
            !formData.expiryYear || !formData.cvv) {
            showStatusMessage('Please fill in all required fields', 'error');
            return;
        }
        
        // Skip card number validation if it contains asterisks (editing mode)
        if (!formData.cardNumber.includes('*')) {
            // Validate card number (simple check)
            if (!/^\d{13,19}$/.test(formData.cardNumber)) {
                showStatusMessage('Please enter a valid card number (13-19 digits)', 'error');
                return;
            }
        }
        
        // Get payment ID if editing
        const paymentId = document.getElementById('payment-id').value;
        const isUpdate = !!paymentId;
        
        // API endpoint and method
        const url = isUpdate ? `/api/payment-methods/${paymentId}` : '/api/payment-methods';
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
                    isUpdate ? 'Payment method updated successfully!' : 'Payment method added successfully!', 
                    'success'
                );
                
                // Hide form
                hidePaymentForm();
                
                // Reload payment methods
                loadUserPaymentMethods();
            } else {
                // Show error message
                showStatusMessage('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error saving payment method:', error);
            showStatusMessage('An error occurred while saving your payment method. Please try again.', 'error');
        });
    }
    
    // Setup interactive credit card display
    function setupCreditCardDisplay() {
        const cardNumber = document.getElementById('card-number');
        const cardHolder = document.getElementById('card-holder');
        const expiryMonth = document.getElementById('expiry-month');
        const expiryYear = document.getElementById('expiry-year');
        const cvv = document.getElementById('cvv');
        const creditCardDisplay = document.getElementById('credit-card-display');
        
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
                document.getElementById('card-number-display').textContent = value || '•••• •••• •••• ••••';
            });
        }
        
        // Update cardholder name as user types
        if (cardHolder) {
            cardHolder.addEventListener('input', function() {
                const value = this.value.toUpperCase();
                document.getElementById('card-holder-display').textContent = value || 'YOUR NAME';
                document.getElementById('card-signature-display').textContent = this.value || 'Your Name';
            });
        }
        
        // Update expiry date as user selects
        if (expiryMonth && expiryYear) {
            const updateExpiry = function() {
                const month = expiryMonth.value || 'MM';
                const year = expiryYear.value ? expiryYear.value.substring(2) : 'YY';
                document.getElementById('card-expiry-display').textContent = `${month}/${year}`;
            };
            
            expiryMonth.addEventListener('change', updateExpiry);
            expiryYear.addEventListener('change', updateExpiry);
        }
        
        // Flip card when user focuses on CVV
        if (cvv && creditCardDisplay) {
            cvv.addEventListener('focus', function() {
                creditCardDisplay.classList.add('flipped');
                document.getElementById('card-cvv-display').textContent = this.value.replace(/./g, '•') || '•••';
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
                document.getElementById('card-cvv-display').textContent = this.value.replace(/./g, '•') || '•••';
            });
        }
        
        // Allow clicking on card to flip it
        if (creditCardDisplay) {
            creditCardDisplay.addEventListener('click', function() {
                this.classList.toggle('flipped');
            });
        }
    }
    
    // Update the place order button state based on selections
    function updateOrderButtonState() {
        const placeOrderBtn = document.getElementById('place-order-btn');
        
        if (placeOrderBtn) {
            // Enable button only if both address and payment method are selected and cart has items
            if (selectedAddressId && selectedPaymentMethodId && cartData && cartData.items && cartData.items.length > 0) {
                placeOrderBtn.disabled = false;
            } else {
                placeOrderBtn.disabled = true;
            }
        }
    }
    
 // Place order
function placeOrder() {
    // Validate selections
    if (!selectedAddressId) {
        showStatusMessage('Please select a shipping address', 'error');
        return;
    }
    
    if (!selectedPaymentMethodId) {
        showStatusMessage('Please select a payment method', 'error');
        return;
    }
    
    if (!cartData || !cartData.items || cartData.items.length === 0) {
        showStatusMessage('Your cart is empty', 'error');
        return;
    }
    
    // Create order data
    const orderData = {
        addressId: selectedAddressId,
        paymentMethodId: selectedPaymentMethodId
    };
    
    // Show processing message
    showStatusMessage('Processing your order...', 'info');
    
    // Send order to server
    fetch('/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData),
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show success message
            showStatusMessage('Order placed successfully!', 'success');
            
            // Show order success modal
            showOrderSuccessModal(data.order);
            
            // Clear cart
            clearCart();
        } else {
            // Show error message
            showStatusMessage('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error placing order:', error);
        showStatusMessage('An error occurred while placing your order. Please try again.', 'error');
    });
};
setupEventListeners();
});

                