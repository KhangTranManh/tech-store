/**
 * global-cart.js - Bridge between product pages and cart functionality
 * Include this on all pages after cart-js.js
 */

// Create a self-executing function to avoid polluting global namespace
(function() {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Initializing global cart integration...');
      
      // Create global updateCart function to be used by product pages
      window.updateCart = function(productId, productName, quantity = 1, productPrice = 0, productImage = '') {
        console.log('updateCart called with:', { productId, productName, quantity, productPrice, productImage });
        
        // Try to enhance product data if needed
        if (!productPrice || productPrice === 0) {
          const priceElement = document.querySelector('.current-price');
          if (priceElement) {
            const priceMatch = priceElement.textContent.match(/\$?(\d+(\.\d+)?)/);
            if (priceMatch) {
              productPrice = parseFloat(priceMatch[1]);
            }
          }
        }
        
        if (!productImage || productImage === '') {
          const imageElement = document.querySelector('.main-image img');
          if (imageElement) {
            productImage = imageElement.src;
          }
        }
        
        // Use cart functions from cart-js.js if available
        if (window.cartFunctions && typeof window.cartFunctions.addToCart === 'function') {
          window.cartFunctions.addToCart(productId, productName, productPrice, productImage);
        } else {
          // Fallback to direct implementation
          addToCartImplementation(productId, productName, quantity, productPrice, productImage);
        }
      };
      
      // Fallback implementation when cart-js.js isn't loaded
      function addToCartImplementation(productId, productName, quantity, productPrice, productImage) {
        try {
          // Get current cart from session storage
          const cartData = sessionStorage.getItem('cart');
          let cart = cartData ? JSON.parse(cartData) : { items: [], itemCount: 0 };
          
          // Ensure cart has items array
          if (!cart.items) {
            cart.items = [];
          }
          
          // Check if product already exists in cart
          const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
          
          if (existingItemIndex >= 0) {
            // Update quantity if product exists
            const currentQty = parseInt(cart.items[existingItemIndex].quantity) || 0;
            cart.items[existingItemIndex].quantity = Math.min(currentQty + quantity, 10); // Max quantity limit
          } else {
            // Add new item
            cart.items.push({
              productId: productId,
              name: productName || 'Unknown Product',
              price: parseFloat(productPrice) || 0,
              quantity: quantity,
              image: productImage || 'images/placeholder.jpg'
            });
          }
          
          // Update item count
          cart.itemCount = cart.items.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
          
          // Save to session storage
          sessionStorage.setItem('cart', JSON.stringify(cart));
          console.log('Cart saved to session storage:', cart);
          
          // Also try to send to server
          fetch('/api/cart/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              productId: productId,
              name: productName || 'Product',
              price: parseFloat(productPrice) || 0,
              image: productImage || '',
              quantity: quantity
            }),
            credentials: 'include'
          }).then(response => {
            return response.json();
          }).then(data => {
            console.log('Server response to add to cart:', data);
            if (data.success) {
              showNotification(`${productName} added to cart!`, 'success');
              updateCartCountUI(data.cart?.itemCount || cart.itemCount);
            } else {
              throw new Error(data.message || 'Unknown error');
            }
          }).catch(error => {
            console.warn('Error adding to server cart:', error);
            // Still show success since we added to local cart
            showNotification(`${productName} added to cart!`, 'success');
            updateCartCountUI(cart.itemCount);
          });
        } catch (error) {
          console.error('Error in addToCartImplementation:', error);
          showNotification('Error adding to cart', 'error');
        }
      }
      
      // Show notification
      function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `cart-notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 25px';
        notification.style.borderRadius = '4px';
        notification.style.color = 'white';
        notification.style.zIndex = '1000';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        
        // Set color based on type
        if (type === 'success') {
          notification.style.backgroundColor = '#4CAF50';
        } else if (type === 'error') {
          notification.style.backgroundColor = '#f44336';
        } else {
          notification.style.backgroundColor = '#2196F3';
        }
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          notification.style.transition = 'opacity 0.5s ease';
          
          // Remove from DOM after fade out
          setTimeout(() => {
            notification.remove();
          }, 500);
        }, 3000);
      }
      
      // Update cart count in UI
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
        }
      }
      
      // Initialize cart count from local storage when page loads
      function initializeCartCount() {
        try {
          const cartData = sessionStorage.getItem('cart');
          if (cartData) {
            const cart = JSON.parse(cartData);
            if (cart && typeof cart.itemCount === 'number') {
              updateCartCountUI(cart.itemCount);
            }
          }
        } catch (error) {
          console.error('Error initializing cart count:', error);
        }
      }
      
      // Run initialization
      initializeCartCount();
    });
  })();
  // Add this function to cart-js.js or global-cart.js 
function debugCart() {
  try {
    console.group("🔍 Cart Debug Information");
    
    // Check session storage
    const cartData = sessionStorage.getItem('cart');
    if (cartData) {
      const localCart = JSON.parse(cartData);
      console.log("Local cart from session storage:", localCart);
      
      if (localCart.items && localCart.items.length > 0) {
        console.table(localCart.items.map(item => ({
          productId: item.productId,
          productId_type: typeof item.productId,
          name: item.name,
          quantity: item.quantity
        })));
      }
    } else {
      console.log("No cart found in session storage");
    }
    
    // Check if we can fetch server cart
    console.log("Attempting to fetch server cart...");
    fetch('/api/cart', {
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log("Server cart:", data.cart);
      
      if (data.cart && data.cart.items && data.cart.items.length > 0) {
        console.table(data.cart.items.map(item => ({
          productId: item.productId,
          productId_type: typeof item.productId,
          name: item.name,
          quantity: item.quantity
        })));
      }
      
      // Check for duplicates
      if (data.cart && data.cart.items && data.cart.items.length > 0) {
        const ids = {};
        const duplicates = [];
        
        data.cart.items.forEach(item => {
          const id = String(item.productId);
          if (ids[id]) {
            duplicates.push(id);
          } else {
            ids[id] = true;
          }
        });
        
        if (duplicates.length > 0) {
          console.warn("⚠️ DUPLICATES FOUND in server cart:", duplicates);
        } else {
          console.log("✅ No duplicates found in server cart");
        }
      }
    })
    .catch(error => {
      console.error("Failed to fetch server cart:", error);
    })
    .finally(() => {
      console.groupEnd();
    });
  } catch (error) {
    console.error("Error in debugCart:", error);
    console.groupEnd();
  }
}