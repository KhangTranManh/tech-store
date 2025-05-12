/**
 * cart-js.js - Complete shopping cart functionality for TechStore
 * Handles both client-side and server-side cart operations
 */

// Configuration and state
let cartInitialized = false;
let isShowingNotification = false;

// API endpoints - modify these to match your server routes
const API_ENDPOINTS = {
  CART: '/api/cart',
  ADD_TO_CART: '/api/cart/add',
  REMOVE_FROM_CART: '/api/cart/remove',
  UPDATE_CART: '/api/cart/update',
  SYNC_CART: '/api/cart/sync',
  CHECKOUT: '/checkout.html'
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  // Prevent duplicate initialization
  if (cartInitialized) return;
  cartInitialized = true;
  
  console.log('Initializing cart functionality...');
  
  // Initialize cart functionality
  initializeCart();
  
  // Set up cart page functionality if on cart page
  if (window.location.pathname.includes('cart.html')) {
    setupCartPage();
  }
  
  // Setup cart sync for checkout page
  if (window.location.pathname.includes('checkout.html')) {
    syncCartWithServer()
      .then(() => {
        console.log('Cart synced for checkout');
      })
      .catch(error => {
        console.error('Checkout cart sync failed:', error);
        showNotification('Unable to prepare cart for checkout', 'error');
      });
  }
});

/**
 * Initialize cart functionality
 * Sets up event listeners and cart counter
 */
function initializeCart() {
  // First, remove any existing event listeners to prevent duplicates
  const addToCartButtons = document.querySelectorAll('.add-to-cart, .add-to-cart-btn');
  
  addToCartButtons.forEach(button => {
    // Clone and replace the button to remove all event listeners
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
  });
  
  // Now add event listeners to all add-to-cart buttons
  const refreshedButtons = document.querySelectorAll('.add-to-cart, .add-to-cart-btn');
  
  refreshedButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation(); // Prevent event bubbling
      
      // Disable button temporarily to prevent double-clicks
      this.disabled = true;
      
      const productId = this.getAttribute('data-product-id');
      if (!productId) {
        console.error('No product ID found on button');
        this.disabled = false;
        return;
      }
      
      // Get product information from the card or detail page
      const productContainer = this.closest('.product-card, .product-info, .product-detail');
      let productName = "Unknown Product";
      let productPrice = 0;
      let productImage = '';
      
      if (productContainer) {
        // Try to find product name
        const nameElement = productContainer.querySelector('.product-title, .product-name, .item-name');
        if (nameElement) {
          productName = nameElement.textContent.trim();
        }
        
        // Try to find product price
        const priceElement = productContainer.querySelector('.product-price, .current-price');
        if (priceElement) {
          // Extract numeric price from text (e.g. "$199.99" -> 199.99)
          const priceMatch = priceElement.textContent.match(/\$?(\d+(\.\d+)?)/);
          if (priceMatch) {
            productPrice = parseFloat(priceMatch[1]);
          }
        }
        
        // Try to find product image
        const imageElement = productContainer.querySelector('img');
        if (imageElement) {
          productImage = imageElement.src;
        }
      }
      
      console.log(`Adding product to cart: ID=${productId}, Name=${productName}, Price=${productPrice}, Image=${productImage}`);
      
      // Add to both local and server cart
      addToCart(productId, productName, productPrice, productImage, this);
    });
  });
  
  // Initialize cart count
  updateCartCountFromLocalStorage();
}
function addToCart(productId, productName, productPrice, productImage = '', buttonElement = null) {
  try {
    // Disable button to prevent multiple clicks
    if (buttonElement) {
      buttonElement.disabled = true;
      buttonElement.textContent = 'Adding...';
    }
    
    // Validate product ID
    if (!productId) {
      console.error('Missing product ID');
      showNotification('Cannot add to cart: Missing product information', 'error');
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Add to Cart';
      }
      return;
    }
    
    console.log('Adding to cart:', { productId, productName, productPrice, productImage });
    
    // Prepare product data
    const price = typeof productPrice === 'string' 
      ? parseFloat(productPrice.replace(/[^0-9.-]+/g, '')) 
      : parseFloat(productPrice) || 0;
    
    // Add to local storage cart first
    addToCartLocal(productId, productName, price, productImage);
    
    // Then send to server
    fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId: productId,
        name: productName || 'Product',
        price: price,
        image: productImage || '',
        quantity: 1
      }),
      credentials: 'include' // Important: include cookies for authentication
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Update UI with server data
        showNotification(`${productName} added to cart!`, 'success');
        updateCartCountUI(data.cart?.itemCount || 1);
      } else {
        throw new Error(data.message || 'Failed to add item to cart');
      }
    })
    .catch(error => {
      console.warn('Error adding to server cart:', error);
      // Already added locally, so still show success notification
      showNotification(`${productName} added to cart!`, 'success');
    })
    .finally(() => {
      // Re-enable the button
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Add to Cart';
      }
    });
    
  } catch (error) {
    console.error('Error in addToCart:', error);
    
    // Show error notification
    showNotification('Error adding to cart', 'error');
    
    // Re-enable the button
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.textContent = 'Add to Cart';
    }
  }
}


/**
 * Updated addToCartLocal function with improved duplicate detection
 */
function addToCartLocal(productId, productName, productPrice, productImage = '') {
  try {
    // Get current cart or initialize if not exists
    let cart = getCartFromLocalStorage();
    
    console.log('Adding to local cart:', { 
      productId, 
      productId_type: typeof productId,
      productName, 
      productPrice, 
      productImage 
    });
    
    // Ensure cart has items array
    if (!cart.items) {
      cart.items = [];
    }
    
    // Validate product data
    if (!productId) {
      console.error('Invalid product data: Missing product ID');
      throw new Error('Product ID is required');
    }
    
    // Normalize the productId to a string for consistent comparison
    const normalizedProductId = String(productId);
    
    // Log cart contents before finding duplicates
    console.log('Current cart items before adding:', 
      cart.items.map(item => ({ 
        id: item.productId, 
        type: typeof item.productId, 
        name: item.name, 
        quantity: item.quantity 
      }))
    );
    
    // Find existing item with normalized ID comparison
    const existingItemIndex = cart.items.findIndex(item => 
      String(item.productId) === normalizedProductId
    );
    
    console.log(`Looking for product ID "${normalizedProductId}" in cart, found at index: ${existingItemIndex}`);
    
    if (existingItemIndex >= 0) {
      console.log(`Product already in cart at index ${existingItemIndex}, updating quantity`);
      // Update quantity if product exists
      const currentQty = parseInt(cart.items[existingItemIndex].quantity) || 0;
      cart.items[existingItemIndex].quantity = Math.min(currentQty + 1, 10); // Max quantity limit
    } else {
      console.log('Adding new product to cart');
      // Add new item with all necessary details
      cart.items.push({
        productId: normalizedProductId, // Store as normalized string
        name: productName || 'Unknown Product',
        price: parseFloat(productPrice) || 0,
        quantity: 1,
        image: productImage || 'images/placeholder.jpg'
      });
    }
    
    // Update item count
    cart.itemCount = cart.items.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
    
    // Save to session storage
    sessionStorage.setItem('cart', JSON.stringify(cart));
    console.log('Cart saved to session storage:', cart);
    
    // Update UI
    updateCartCountUI(cart.itemCount);
    
    // Run debugger
    debugCart();
    
    return cart;
  } catch (error) {
    console.error('Error in addToCartLocal:', error);
    showNotification('Failed to add item to cart', 'error');
    return { items: [], itemCount: 0 };
  }
}
// Add this to getCartFromLocalStorage()
function getCartFromLocalStorage() {
  try {
    const cartData = sessionStorage.getItem('cart');
    if (!cartData) {
      return { items: [], itemCount: 0 };
    }
    
    let cart = JSON.parse(cartData);
    
    // Ensure the cart has the expected structure
    if (!cart.items) cart.items = [];
    
    // DEDUPLICATION: Combine duplicate products
    const uniqueItems = {};
    cart.items.forEach(item => {
      const productIdStr = String(item.productId);
      if (uniqueItems[productIdStr]) {
        uniqueItems[productIdStr].quantity += parseInt(item.quantity || 1);
      } else {
        uniqueItems[productIdStr] = {
          ...item,
          productId: productIdStr,
          quantity: parseInt(item.quantity || 1)
        };
      }
    });
    
    // Replace cart items with deduplicated array
    cart.items = Object.values(uniqueItems);
    
    // Recalculate item count
    cart.itemCount = cart.items.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
    
    // Save the deduplicated cart back to storage
    sessionStorage.setItem('cart', JSON.stringify(cart));
    
    return cart;
  } catch (error) {
    console.error('Error parsing cart from session storage:', error);
    // Return empty cart in case of error
    return { items: [], itemCount: 0 };
  }
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
  // Try different selectors for the cart count element
  const cartCountSelectors = [
    '.user-actions a[href="/cart.html"]',
    'a[href="/cart.html"]',
    'a[href*="cart"]',
    '#cart-link',
    '.cart-link'
  ];
  
  // Find the first matching element
  let cartLink = null;
  for (const selector of cartCountSelectors) {
    cartLink = document.querySelector(selector);
    if (cartLink) break;
  }
  
  if (cartLink) {
    // If the link has a specific format, preserve it
    if (cartLink.textContent.includes('Cart')) {
      cartLink.textContent = `Cart (${count})`;
    } else {
      // Just append the count
      cartLink.textContent += ` (${count})`;
    }
  } else {
    console.warn('Cart count element not found');
  }
}

/**
 * Set up functionality specific to the cart page
 */
function setupCartPage() {
  console.log('Setting up cart page');
  
  // Try to load cart from server first
  fetch(API_ENDPOINTS.CART, {
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch cart from server');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      console.log('Cart loaded from server:', data.cart);
      
      // Find cart container
      const cartContainer = findCartContainer();
      
      if (cartContainer) {
        // Update cart display with server data
        updateCartDisplay(data.cart, cartContainer);
      }
    } else {
      throw new Error(data.message || 'Failed to load cart');
    }
  })
  .catch(error => {
    console.warn('Error loading cart from server, using local cart:', error);
    
    // Fallback to local cart
    const cart = getCartFromLocalStorage();
    const cartContainer = findCartContainer();
    
    if (cartContainer) {
      updateCartDisplay(cart, cartContainer);
    }
  });
}

/**
 * Find the cart container element
 * @returns {HTMLElement|null} The cart container element, or null if not found
 */
function findCartContainer() {
  // Try different possible cart container selectors
  const cartContainers = [
    document.getElementById('cart-content'),
    document.querySelector('.cart-container'),
    document.querySelector('.shopping-cart-container'),
    document.querySelector('main .container'),
    document.querySelector('main')
  ];
  
  // Find the first valid container
  const cartContainer = cartContainers.find(container => container !== null);
  
  if (!cartContainer) {
    console.warn('No cart container found on page');
    return null;
  }
  
  return cartContainer;
}

/**
 * Update the cart display on the cart page
 * @param {Object} cart - Cart data
 * @param {HTMLElement} container - Container element to update
 */
function updateCartDisplay(cart, container) {
  if (!container) {
    container = findCartContainer();
    if (!container) return;
  }
  
  console.log('Updating cart display with data:', cart);
  
  // Check if cart is empty
  if (!cart.items || cart.items.length === 0) {
    // Display empty cart message
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <h3 style="font-size: 24px; margin-bottom: 15px;">Your Shopping Cart is Empty</h3>
        <p style="margin-bottom: 25px; color: #666;">Looks like you haven't added any items to your cart yet.</p>
        <a href="/" style="display: inline-block; padding: 10px 25px; background-color: #ff6b00; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Shop Now</a>
      </div>
    `;
    return;
  }

  // Calculate subtotal
  let subtotal = 0;
  cart.items.forEach(item => {
    const itemPrice = parseFloat(item.price) || 0;
    const itemQuantity = parseInt(item.quantity) || 1;
    subtotal += itemPrice * itemQuantity;
  });
  
  // Generate cart HTML
  const cartHTML = `
    <div class="cart-items-container" style="margin-bottom: 30px;">
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f7f7f7;">
            <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd;">Product</th>
            <th style="padding: 12px 15px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
            <th style="padding: 12px 15px; text-align: center; border-bottom: 1px solid #ddd;">Quantity</th>
            <th style="padding: 12px 15px; text-align: right; border-bottom: 1px solid #ddd;">Total</th>
            <th style="padding: 12px 15px; text-align: center; border-bottom: 1px solid #ddd;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${cart.items.map(item => {
            // Ensure values are valid
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = parseInt(item.quantity) || 1;
            const itemTotal = itemPrice * itemQuantity;
            
            return `
              <tr data-product-id="${item.productId}" style="border-bottom: 1px solid #eee;">
                <td style="padding: 15px; vertical-align: middle;">
                  <div style="display: flex; align-items: center;">
                    <img src="${item.image || 'images/placeholder.jpg'}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: contain; margin-right: 15px; background-color: #f8f8f8; padding: 5px;">
                    <div>
                      <div style="font-weight: bold; color: #333;">${item.name || 'Unknown Product'}</div>
                      <div style="font-size: 14px; color: #666;">${item.specs || ''}</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 15px; vertical-align: middle; text-align: right; color: #ff6b00; font-weight: bold;">$${itemPrice.toFixed(2)}</td>
                <td style="padding: 15px; vertical-align: middle; text-align: center;">
                  <div style="display: flex; align-items: center; justify-content: center;" class="quantity-control">
                    <button class="quantity-btn" data-action="decrease" style="width: 30px; height: 30px; background-color: #f2f2f2; border: 1px solid #ddd; cursor: pointer;">-</button>
                    <input type="number" class="quantity-input" value="${itemQuantity}" min="1" style="width: 40px; height: 30px; border: 1px solid #ddd; text-align: center; margin: 0 5px;">
                    <button class="quantity-btn" data-action="increase" style="width: 30px; height: 30px; background-color: #f2f2f2; border: 1px solid #ddd; cursor: pointer;">+</button>
                  </div>
                </td>
                <td style="padding: 15px; vertical-align: middle; text-align: right; color: #ff6b00; font-weight: bold;">$${itemTotal.toFixed(2)}</td>
                <td style="padding: 15px; vertical-align: middle; text-align: center;">
                  <button class="remove-btn" style="background: none; border: none; color: #999; cursor: pointer; font-size: 14px;">Remove</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div style="display: flex; justify-content: space-between; flex-wrap: wrap; margin-top: 30px;">
        <div style="flex: 1; margin-right: 30px; min-width: 250px;">
          <!-- Coupon code section could go here -->
        </div>
        
        <div style="width: 350px; background-color: #f7f7f7; padding: 25px; border-radius: 8px;">
          <h3 style="font-size: 20px; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Order Summary</h3>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <span>Subtotal</span>
            <span style="font-weight: bold;">$${subtotal.toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <span>Shipping</span>
            <span style="font-weight: bold;">$${(subtotal > 50 ? 0 : 5.99).toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #ddd;">
            <span>Tax</span>
            <span style="font-weight: bold;">$${(subtotal * 0.08).toFixed(2)}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 18px; font-weight: bold;">
            <span>Total</span>
            <span>$${(subtotal + (subtotal > 50 ? 0 : 5.99) + (subtotal * 0.08)).toFixed(2)}</span>
          </div>
          
          <button id="checkout-btn" style="width: 100%; padding: 15px; background-color: #ff6b00; color: white; border: none; border-radius: 4px; font-size: 16px; font-weight: bold; cursor: pointer; margin-bottom: 15px;">Proceed to Checkout</button>
          
          <a href="/" style="display: block; text-align: center; color: #666; text-decoration: none; margin-top: 15px;">Continue Shopping</a>
        </div>
      </div>
    </div>
  `;

  // Update the container with the cart HTML
  container.innerHTML = cartHTML;
  
  // Set up quantity controls
  setupQuantityControls();
  
  // Set up remove buttons
  setupRemoveButtons();
  
  // Set up checkout button
  setupCheckoutButton();
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
          updateCartItemQuantity(productId, quantity);
        }
      });
      
      // Increase quantity
      increaseBtn.addEventListener('click', function() {
        let quantity = parseInt(quantityInput.value);
        quantity++;
        quantityInput.value = quantity;
        updateCartItemQuantity(productId, quantity);
      });
      
      // Input change
      quantityInput.addEventListener('change', function() {
        let quantity = parseInt(this.value);
        if (isNaN(quantity) || quantity < 1) {
          quantity = 1;
          this.value = quantity;
        }
        updateCartItemQuantity(productId, quantity);
      });
    }
  });
}

/**
 * Update cart item quantity both locally and on server
 */
function updateCartItemQuantity(productId, quantity) {
  // Update locally
  updateCartItemQuantityLocal(productId, quantity);
  
  // Normalize productId to string for consistent comparison
  const normalizedProductId = String(productId);
  
  // Update on server
  fetch(API_ENDPOINTS.UPDATE_CART, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      productId: normalizedProductId,
      quantity: quantity
    }),
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to update cart on server');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      console.log('Cart updated on server');
    } else {
      throw new Error(data.message || 'Failed to update cart');
    }
  })
  .catch(error => {
    console.warn('Error updating cart on server:', error);
    // Already updated locally, so no additional action needed
  });
}

// Fix for updateCartItemQuantityLocal in cart-js.js
function updateCartItemQuantityLocal(productId, quantity) {
  // Get current cart
  let cart = getCartFromLocalStorage();
  
  // Normalize productId to string for consistent comparison
  const normalizedProductId = String(productId);
  
  // Find item with string normalization
  const itemIndex = cart.items.findIndex(item => String(item.productId) === normalizedProductId);
  
  if (itemIndex !== -1) {
    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    
    // Update item count
    cart.itemCount = cart.items.reduce((total, item) => total + parseInt(item.quantity || 1), 0);
    
    // Save back to localStorage
    sessionStorage.setItem('cart', JSON.stringify(cart));
    
    // Update display
    const cartContainer = findCartContainer();
    if (cartContainer) {
      updateCartDisplay(cart, cartContainer);
    }
    
    // Update cart count in header
    updateCartCountUI(cart.itemCount);
  } else {
    console.warn(`Product with ID ${normalizedProductId} not found in cart`);
  }
}
// Add a debounce function to prevent rapid add-to-cart clicks
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Modified addToCart with debounce
const debouncedAddToCart = debounce((productId, productName, productPrice, productImage, buttonElement) => {
  addToCart(productId, productName, productPrice, productImage, buttonElement);
}, 300);

//Periodic cart sync function to keep client and server in sync
function setupPeriodicSync() {
  // Sync cart every 5 minutes
  setInterval(() => {
    // Only sync if there are items in the cart
    const cart = getCartFromLocalStorage();
    if (cart.items && cart.items.length > 0) {
      console.log('Performing periodic cart sync');
      syncCartWithServer()
        .then(() => console.log('Periodic sync completed'))
        .catch(error => console.warn('Periodic sync failed:', error));
    }
  }, 5 * 60 * 1000); // 5 minutes
}
// Add this function to your cart.js route file
function deduplicateCart(cart) {
  if (!cart || !cart.items || !cart.items.length === 0) {
    return cart;
  }
  
  const uniqueProductMap = new Map();
  
  // First, group items by their productId (as string)
  cart.items.forEach(item => {
    const productIdStr = String(item.productId);
    
    if (uniqueProductMap.has(productIdStr)) {
      // If this productId already exists, combine quantities
      const existingItem = uniqueProductMap.get(productIdStr);
      existingItem.quantity += parseInt(item.quantity || 1);
    } else {
      // Otherwise, add as a new unique item
      uniqueProductMap.set(productIdStr, {
        ...item,
        productId: productIdStr, // Store as string
        quantity: parseInt(item.quantity || 1)
      });
    }
  });
  
  // Convert back to array
  cart.items = Array.from(uniqueProductMap.values());
  
  // Recalculate total item count
  cart.itemCount = cart.items.reduce((total, item) => total + parseInt(item.quantity || 1), 0);
  
  return cart;
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
      
      if (productId) {
        removeCartItem(productId);
      }
    });
  });
}

/**
 * Remove item from cart (both locally and on server)
 */
function removeCartItem(productId) {
  // Remove locally first
  removeCartItemLocal(productId);
  
  // Then remove from server
  fetch(`${API_ENDPOINTS.REMOVE_FROM_CART}/${productId}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to remove item from server');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      console.log('Item removed from server cart');
    } else {
      throw new Error(data.message || 'Failed to remove item');
    }
  })
  .catch(error => {
    console.warn('Error removing item from server:', error);
    // Already removed locally, so no additional action needed
  });
}
// Fix for removeCartItemLocal in cart-js.js
function removeCartItemLocal(productId) {
  // Get current cart
  let cart = getCartFromLocalStorage();
  
  // Normalize productId to string for consistent comparison
  const normalizedProductId = String(productId);
  
  console.log(`Removing product with ID ${normalizedProductId} from local cart`);
  
  // Remove item with string normalization
  cart.items = cart.items.filter(item => String(item.productId) !== normalizedProductId);
  
  // Update item count
  cart.itemCount = cart.items.reduce((total, item) => total + parseInt(item.quantity || 1), 0);
  
  // Save back to localStorage
  sessionStorage.setItem('cart', JSON.stringify(cart));
  
  // Update display
  const cartContainer = findCartContainer();
  if (cartContainer) {
    updateCartDisplay(cart, cartContainer);
  }
  
  // Update cart count in header
  updateCartCountUI(cart.itemCount);
  
  // Show notification
  showNotification('Item removed from cart', 'success');
}
/**
 * Set up checkout button
 */
function setupCheckoutButton() {
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      // Check if user is logged in
      const isLoggedIn = window.authUtils && window.authUtils.isUserLoggedIn && window.authUtils.isUserLoggedIn();
      
      if (!isLoggedIn) {
        // Redirect to login page
        window.location.href = `/login.html?redirect=${API_ENDPOINTS.CHECKOUT}`;
        return;
      }
      
      // Proceed with checkout - sync cart with server first
      syncCartWithServer()
        .then(() => {
          window.location.href = API_ENDPOINTS.CHECKOUT;
        })
        .catch(error => {
          console.error('Error syncing cart:', error);
          showNotification('Error preparing checkout. Please try again.', 'error');
        });
    });
  }
}

/**
 * Sync the local cart with the server
 * @returns {Promise} Promise that resolves when the cart is synced
 */
function syncCartWithServer() {
  return new Promise((resolve, reject) => {
    // Get local cart
    const cart = getCartFromLocalStorage();
    
    if (!cart.items || cart.items.length === 0) {
      resolve();
      return;
    }

    fetch(API_ENDPOINTS.SYNC_CART, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
          image: item.image
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
        console.log('Cart synced with server successfully');
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

/**
 * Show notification to user
 * @param {string} message - Message to show
 * @param {string} type - Type of notification ('success', 'error', or 'info')
 */
function showNotification(message, type = 'info') {
  if (isShowingNotification) return; // Prevent recursive calls
  
  isShowingNotification = true;
  
  // Create notification element if it doesn't exist
  let notification = document.querySelector('.notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification';
    
    // Add inline styles
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 25px';
    notification.style.borderRadius = '4px';
    notification.style.color = 'white';
    notification.style.zIndex = '1000';
    notification.style.display = 'none';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    
    document.body.appendChild(notification);
  }
  
  // Set notification content and style
  notification.textContent = message;
  notification.style.display = 'block';
  
  // Set color based on type
  if (type === 'success') {
    notification.style.backgroundColor = '#4CAF50';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#f44336';
  } else {
    notification.style.backgroundColor = '#2196F3';
  }
  
  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.style.display = 'none';
    isShowingNotification = false;
  }, 3000);
}

/**
 * Load cart data from the server
 * @returns {Promise} Promise that resolves with the cart data
 */
function loadCartData() {
  return new Promise((resolve, reject) => {
    fetch(API_ENDPOINTS.CART, {
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load cart: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Cart loaded from server:', data.cart);
        
        // Update local storage with server data
        if (data.cart) {
          sessionStorage.setItem('cart', JSON.stringify(data.cart));
          
          // Update cart count in UI
          updateCartCountUI(data.cart.itemCount || 0);
        }
        
        resolve(data.cart);
      } else {
        throw new Error(data.message || 'Failed to load cart data');
      }
    })
    .catch(error => {
      console.warn('Error loading cart from server:', error);
      
      // Fall back to local cart
      const localCart = getCartFromLocalStorage();
      resolve(localCart);
    });
  });
}

/**
 * Clear the entire cart (both locally and on server)
 * @returns {Promise} Promise that resolves when the cart is cleared
 */
function clearCart() {
  return new Promise((resolve, reject) => {
    // Clear local cart
    sessionStorage.removeItem('cart');
    
    // Update UI
    updateCartCountUI(0);
    
    // Clear server cart
    fetch(`${API_ENDPOINTS.CART}/clear`, {
      method: 'DELETE',
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to clear server cart');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Cart cleared on server');
        showNotification('Your cart has been cleared', 'success');
        
        // Update cart display if on cart page
        if (window.location.pathname.includes('cart.html')) {
          const cartContainer = findCartContainer();
          if (cartContainer) {
            updateCartDisplay({ items: [], itemCount: 0 }, cartContainer);
          }
        }
        
        resolve();
      } else {
        throw new Error(data.message || 'Failed to clear cart');
      }
    })
    .catch(error => {
      console.warn('Error clearing server cart:', error);
      // Cart was cleared locally, so still consider it a success
      resolve();
    });
  });
}

/**
 * Check if the user is logged in
 * @returns {boolean} True if the user is logged in, false otherwise
 */
function isUserLoggedIn() {
  return window.authUtils && typeof window.authUtils.isUserLoggedIn === 'function' 
    ? window.authUtils.isUserLoggedIn() 
    : document.body.classList.contains('user-logged-in');
}

/**
 * Transfer guest cart to user cart after login
 * @returns {Promise} Promise that resolves when the cart is transferred
 */
function transferGuestCart() {
  return new Promise((resolve, reject) => {
    // Check if we have a guest cart
    const guestCart = getCartFromLocalStorage();
    
    if (!guestCart.items || guestCart.items.length === 0) {
      // No guest cart to transfer
      resolve();
      return;
    }
    
    // Transfer cart to server
    fetch('/api/cart/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(guestCart),
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to transfer cart');
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('Guest cart transferred successfully');
        
        // Clear local cart since it's now on the server
        sessionStorage.removeItem('cart');
        
        // Update UI with new cart from server
        if (data.cart) {
          updateCartCountUI(data.cart.itemCount || 0);
        }
        
        resolve();
      } else {
        throw new Error(data.message || 'Failed to transfer cart');
      }
    })
    .catch(error => {
      console.warn('Error transferring guest cart:', error);
      // Don't reject, just resolve so the flow continues
      resolve();
    });
  });
}

/**
 * Handle login success event - transfer guest cart to user cart
 * This function can be called from the login success handler
 */
function handleLoginSuccess() {
  transferGuestCart()
    .then(() => {
      console.log('Cart handling after login completed');
      
      // Reload cart data to ensure UI is up to date
      loadCartData()
        .then(cart => {
          // Update cart count
          updateCartCountUI(cart.itemCount || 0);
          
          // Update cart display if on cart page
          if (window.location.pathname.includes('cart.html')) {
            const cartContainer = findCartContainer();
            if (cartContainer) {
              updateCartDisplay(cart, cartContainer);
            }
          }
        });
    })
    .catch(error => {
      console.error('Error handling login cart operations:', error);
    });
}

// Make all cart functions available globally
window.cartFunctions = {
  addToCart,
  addToCartLocal,
  getCartFromLocalStorage,
  updateCartCountFromLocalStorage,
  removeCartItem,
  removeCartItemLocal,
  updateCartItemQuantity,
  updateCartItemQuantityLocal,
  syncCartWithServer,
  clearCart,
  loadCartData,
  transferGuestCart,
  handleLoginSuccess
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

.add-to-cart:disabled,
.add-to-cart-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quantity-control {
  display: flex;
  align-items: center;
}

.quantity-btn {
  width: 30px;
  height: 30px;
  background-color: #f2f2f2;
  border: 1px solid #ddd;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-input {
  width: 40px;
  height: 30px;
  border: 1px solid #ddd;
  text-align: center;
  margin: 0 5px;
}

.product-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
`;
document.head.appendChild(style);
