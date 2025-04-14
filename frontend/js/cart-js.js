// Use a flag to prevent double initialization
// Sync cart with server before checkout
function syncCartWithServer() {
  return new Promise((resolve, reject) => {
    const cart = getCartFromLocalStorage();
    
    if (!cart.items || cart.items.length === 0) {
      resolve();
      return;
    }

    fetch('/cart/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          name: item.name,
          price: item.price
        }))
      }),
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to sync cart');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Clear local storage after successful sync
        sessionStorage.removeItem('cart');
        resolve(data);
      } else {
        throw new Error(data.message || 'Cart sync failed');
      }
    })
    .catch(error => {
      console.error('Cart sync error:', error);
      reject(error);
    });
  });
}

// Add a route to handle cart sync from frontend
function setupCartSyncRoute() {
  if (window.location.pathname === '/checkout.html') {
    // Attempt to sync cart before checkout
    syncCartWithServer()
      .then(() => {
        // Cart synced successfully, proceed with checkout
        console.log('Cart synced for checkout');
      })
      .catch(error => {
        console.error('Checkout cart sync failed:', error);
        showNotification('Unable to prepare cart for checkout', 'error');
      });
  }
}
// Add event listener for cart sync
document.addEventListener('DOMContentLoaded', setupCartSyncRoute);

// Extend global cart functions
window.cartFunctions = {
  ...window.cartFunctions, // Spread existing functions
  syncCartWithServer
};
let cartInitialized = false;



document.addEventListener('DOMContentLoaded', function() {
  // Prevent duplicate initialization
  if (cartInitialized) return;
  cartInitialized = true;
  
  // Initialize cart
  initializeCart();
  
  // Set up cart page functionality if on cart page
  if (window.location.pathname.includes('cart.html')) {
    setupCartPage();
  }
});

// Add this at the top of cart-js.js
let isShowingNotification = false;

/**
 * Initialize cart functionality
 */
function initializeCart() {
  console.log('Initializing cart functionality...');
  
  // First, remove any existing event listeners to prevent duplicates
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  
  addToCartButtons.forEach(button => {
    // Clone and replace the button to remove all event listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
  });
  
  // Now add event listeners to all add-to-cart buttons
  const refreshedButtons = document.querySelectorAll('.add-to-cart');
  
  refreshedButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Disable button temporarily to prevent double-clicks
      this.disabled = true;
      
      const productId = this.getAttribute('data-product-id');
      if (!productId) {
        console.error('No product ID found on button');
        this.disabled = false;
        return;
      }
      
      // Get product information from the card
      const productCard = this.closest('.product-card, .product-info');
      let productName = "Product";
      let productPrice = 0;
      
      if (productCard) {
        const nameElement = productCard.querySelector('.product-title, .product-name, .item-name');
        const priceElement = productCard.querySelector('.product-price');
        
        if (nameElement) {
          productName = nameElement.textContent;
        }
        
        if (priceElement) {
          // Extract numeric price from text (e.g. "$199.99" -> 199.99)
          const priceMatch = priceElement.textContent.match(/\$?(\d+(\.\d+)?)/);
          if (priceMatch) {
            productPrice = parseFloat(priceMatch[1]);
          }
        }
      }
      
      console.log(`Adding product to cart: ID=${productId}, Name=${productName}, Price=${productPrice}`);
      
      try {
        // Add to cart in localStorage
        addToCartLocal(productId, productName, productPrice);
        showNotification(productName + ' added to cart!', 'success');
        
        // Update cart count immediately
        updateCartCountFromLocalStorage();
      } catch (error) {
        console.error('Failed to add product:', error);
        showNotification('Error adding product to cart', 'error');
      }
      
      // Re-enable button after a short delay
      setTimeout(() => {
        this.disabled = false;
      }, 500);
    });
  });
  
  // Initialize cart count
  updateCartCountFromLocalStorage();
}

// In cart-js.js, enhance error handling
function addToCartLocal(productId, productName, productPrice) {
  try {
    let cart = JSON.parse(sessionStorage.getItem('cart') || '{"items":[], "itemCount":0}');
    
    // More robust item addition
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Prevent excessive quantity
      cart.items[existingItemIndex].quantity = Math.min(
        (cart.items[existingItemIndex].quantity || 0) + 1, 
        10 // Max quantity limit
      );
    } else {
      // Validate inputs
      cart.items.push({
        productId: productId,
        name: productName || 'Unnamed Product',
        price: parseFloat(productPrice) || 0,
        quantity: 1,
        image: '' // You might want to add image logic here
      });
    }
    
    // Update item count with safety check
    cart.itemCount = cart.items.reduce((total, item) => total + (item.quantity || 1), 0);
    
    // Limit total cart items
    if (cart.itemCount > 20) {
      showNotification('Cart is full. Remove some items before adding more.', 'error');
      return cart;
    }
    
    sessionStorage.setItem('cart', JSON.stringify(cart));
    return cart;
  } catch (error) {
    console.error('Error in addToCartLocal:', error);
    showNotification('Failed to add item to cart', 'error');
    return { items: [], itemCount: 0 };
  }
}

/**
 * Get cart from local storage
 */
function getCartFromLocalStorage() {
  return JSON.parse(sessionStorage.getItem('cart') || '{"items":[], "itemCount":0}');
}

/**
 * Update cart count from local storage
 */
function updateCartCountFromLocalStorage() {
  const cart = getCartFromLocalStorage();
  updateCartCountUI(cart.itemCount || 0);
}

/**
 * Update the cart count in the UI
 * @param {number} count - Number of items in cart
 */
function updateCartCountUI(count) {
  const cartLink = document.querySelector('.user-actions a[href="/cart.html"]');
  
  if (cartLink) {
    cartLink.textContent = `Cart (${count})`;
  }
}

/**
 * Set up functionality specific to the cart page
 */
function setupCartPage() {
  console.log('Setting up cart page');
  
  // Load cart data from local storage
  const cart = getCartFromLocalStorage();
  
  // Update cart display
  updateCartDisplay(cart);
}

/**
 * Update the cart display on the cart page
 * @param {Object} cart - Cart data
 */
function updateCartDisplay(cart) {
  const cartContainer = document.querySelector('.cart-container');
  if (!cartContainer) return;
  
  if (!cart.items || cart.items.length === 0) {
    cartContainer.innerHTML = `
      <div class="cart-empty">
        <h3>Your Shopping Cart is Empty</h3>
        <p>Looks like you haven't added any items to your cart yet.</p>
        <a href="/" class="shop-now-btn">Shop Now</a>
      </div>
    `;
    return;
  }

  let subtotal = 0;
  const cartHTML = `
    <h1 class="cart-title">Your Shopping Cart</h1>
    <div class="cart-with-items">
      <table class="cart-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${cart.items.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            return `
              <tr data-product-id="${item.productId}">
                <td>
                  <div class="product-info">
                    <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.name}" class="product-img">
                    <div>
                      <div class="product-name">${item.name}</div>
                      <div class="product-specs">${item.specs || ''}</div>
                    </div>
                  </div>
                </td>
                <td class="product-price">$${item.price.toFixed(2)}</td>
                <td>
                  <div class="quantity-control">
                    <button class="quantity-btn" data-action="decrease">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                    <button class="quantity-btn" data-action="increase">+</button>
                  </div>
                </td>
                <td class="product-price">$${itemTotal.toFixed(2)}</td>
                <td>
                  <button class="remove-btn">Remove</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div class="cart-actions">
        <div class="cart-coupons">
          <div class="promo-code">
            <h4>Apply Promo Code</h4>
            <form class="promo-form">
              <input type="text" class="promo-input" placeholder="Enter promo code">
              <button type="submit" class="apply-btn">Apply</button>
            </form>
          </div>
        </div>
        
        <div class="cart-summary">
          <h3 class="summary-title">Order Summary</h3>
          
          <div class="summary-row">
            <span>Subtotal</span>
            <span class="subtotal-amount">$${subtotal.toFixed(2)}</span>
          </div>
          
          <div class="summary-row">
            <span>Shipping</span>
            <span class="shipping-amount">$${(subtotal > 50 ? 0 : 5.99).toFixed(2)}</span>
          </div>
          
          <div class="summary-row">
            <span>Tax</span>
            <span class="tax-amount">$${(subtotal * 0.08).toFixed(2)}</span>
          </div>
          
          <div class="summary-row total">
            <span>Total</span>
            <span class="total-amount">$${(subtotal + (subtotal > 50 ? 0 : 5.99) + (subtotal * 0.08)).toFixed(2)}</span>
          </div>
          
          <button class="checkout-btn" id="checkout-btn">Proceed to Checkout</button>
          
          <a href="/" class="continue-shopping">Continue Shopping</a>
        </div>
      </div>
    </div>
  `;

  cartContainer.innerHTML = cartHTML;
  
  // Set up quantity controls
  setupQuantityControls();
  
  // Set up remove buttons
  setupRemoveButtons();
  
  // Set up checkout button - NEW ADDITION
  setupCheckoutButton();
}
// In your cart.js, add this to the checkout button handler
function setupCheckoutButton() {
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      // First sync cart with server
      window.cartFunctions.syncCartWithServer()
        .then(() => {
          // Then redirect to checkout page
          window.location.href = '/checkout.html';
        })
        .catch(error => {
          console.error('Error syncing cart:', error);
          showNotification('Error preparing checkout. Please try again.', 'error');
        });
    });
  }
}

/**
 * Set up quantity control buttons on cart page
 */
function setupQuantityControls() {
  const quantityControls = document.querySelectorAll('.quantity-control');
  
  quantityControls.forEach(control => {
    const decreaseBtn = control.querySelector('.quantity-btn[data-action="decrease"]');
    const increaseBtn = control.querySelector('.quantity-btn[data-action="increase"]');
    const quantityInput = control.querySelector('.quantity-input');
    const productId = control.closest('tr').getAttribute('data-product-id');
    
    if (decreaseBtn && increaseBtn && quantityInput && productId) {
      // Decrease quantity
      decreaseBtn.addEventListener('click', function() {
        let quantity = parseInt(quantityInput.value);
        if (quantity > 1) {
          quantity--;
          quantityInput.value = quantity;
          updateCartItemQuantityLocal(productId, quantity);
        }
      });
      
      // Increase quantity
      increaseBtn.addEventListener('click', function() {
        let quantity = parseInt(quantityInput.value);
        quantity++;
        quantityInput.value = quantity;
        updateCartItemQuantityLocal(productId, quantity);
      });
      
      // Input change
      quantityInput.addEventListener('change', function() {
        let quantity = parseInt(this.value);
        if (isNaN(quantity) || quantity < 1) {
          quantity = 1;
          this.value = quantity;
        }
        updateCartItemQuantityLocal(productId, quantity);
      });
    }
  });
}

/**
 * Update cart item quantity locally
 */
function updateCartItemQuantityLocal(productId, quantity) {
  // Get current cart
  let cart = getCartFromLocalStorage();
  
  // Find item
  const itemIndex = cart.items.findIndex(item => item.productId === productId);
  
  if (itemIndex !== -1) {
    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    
    // Update item count
    cart.itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
    
    // Save back to localStorage
    sessionStorage.setItem('cart', JSON.stringify(cart));
    
    // Update display
    updateCartDisplay(cart);
    updateCartCountUI(cart.itemCount);
  }
}

/**
 * Set up remove buttons on cart page
 */
function setupRemoveButtons() {
  const removeButtons = document.querySelectorAll('.remove-btn');
  
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const row = this.closest('tr');
      const productId = row.getAttribute('data-product-id');
      
      if (productId && confirm('Remove this item from your cart?')) {
        removeCartItemLocal(productId);
      }
    });
  });
}

/**
 * Remove item from cart locally
 */
function removeCartItemLocal(productId) {
  // Get current cart
  let cart = getCartFromLocalStorage();
  
  // Remove item
  cart.items = cart.items.filter(item => item.productId !== productId);
  
  // Update item count
  cart.itemCount = cart.items.reduce((total, item) => total + item.quantity, 0);
  
  // Save back to localStorage
  sessionStorage.setItem('cart', JSON.stringify(cart));
  
  // Update display
  updateCartDisplay(cart);
  updateCartCountUI(cart.itemCount);
  
  // Show notification
  showNotification('Item removed from cart', 'success');
}

/**
 * Show notification to user
 * @param {string} message - Message to show
 * @param {string} type - Type of notification ('success' or 'error')
 */
function showNotification(message, type = 'info') {
    if (isShowingNotification) return; // Prevent recursive calls
    
    isShowingNotification = true;
    
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification content and style
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
        isShowingNotification = false;
    }, 3000);
}
function syncCartWithServer() {
  return new Promise((resolve, reject) => {
    // Check if user is logged in
    const isLoggedIn = document.body.classList.contains('user-logged-in');
    
    if (!isLoggedIn) {
      // If not logged in, resolve anyway
      resolve();
      return;
    }
    
    // Get local cart
    const localCart = getCartFromLocalStorage();
    
    // If local cart is empty, no need to sync
    if (!localCart.items || localCart.items.length === 0) {
      resolve();
      return;
    }
    
    // Send the entire cart to server in one request
    fetch('/cart/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(localCart),
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Cart synced with server');
        resolve();
      } else {
        reject(new Error(data.message || 'Failed to sync cart'));
      }
    })
    .catch(error => {
      console.error('Error syncing cart with server:', error);
      reject(error);
    });
  });
}

// Make functions available globally
window.cartFunctions = {
  addToCartLocal,
  updateCartCountFromLocalStorage,
  removeCartItemLocal,
  syncCartWithServer
};

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 4px;
    color: white;
    z-index: 1000;
    display: none;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.notification.success {
    background-color: #4CAF50;
}

.notification.error {
    background-color: #f44336;
}

.notification.info {
    background-color: #2196F3;
}

.add-to-cart:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
`;
document.head.appendChild(style);