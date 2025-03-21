// frontend/js/cart.js
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the cart page
  const cartContainer = document.querySelector('.cart-with-items');
  const cartEmptyContainer = document.querySelector('.cart-empty');
  
  if (cartContainer || cartEmptyContainer) {
    loadCart();
  }
  
  function loadCart() {
    fetch('/cart')
      .then(response => response.json())
      .then(data => {
        if (data.items.length === 0) {
          // Show empty cart message
          if (cartContainer) cartContainer.style.display = 'none';
          if (cartEmptyContainer) cartEmptyContainer.style.display = 'block';
        } else {
          // Show cart items
          if (cartContainer) cartContainer.style.display = 'block';
          if (cartEmptyContainer) cartEmptyContainer.style.display = 'none';
          
          // Update cart table
          updateCartItems(data.items);
          
          // Update summary
          updateCartSummary(data);
        }
        
        // Update cart count in header
        updateCartCount(data.totalItems);
      })
      .catch(error => {
        console.error('Error loading cart:', error);
      });
  }
  
  function updateCartItems(items) {
    const cartTableBody = document.querySelector('.cart-table tbody');
    if (!cartTableBody) return;
    
    // Clear current items
    cartTableBody.innerHTML = '';
    
    // Add each item to the table
    items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="product-info">
            <img src="images/product${item.productId}.jpg" alt="${item.name}" class="product-img">
            <div>
              <div class="product-name">${item.name}</div>
            </div>
          </div>
        </td>
        <td class="product-price">${item.price}</td>
        <td>
          <div class="quantity-control">
            <button class="quantity-btn decrease" data-product-id="${item.productId}">-</button>
            <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-product-id="${item.productId}">
            <button class="quantity-btn increase" data-product-id="${item.productId}">+</button>
          </div>
        </td>
        <td class="product-price">${(item.price * item.quantity).toFixed(2)}</td>
        <td>
          <button class="remove-btn" data-product-id="${item.productId}">Remove</button>
        </td>
      `;
      
      cartTableBody.appendChild(row);
    });
    
    // Add event listeners for quantity buttons
    document.querySelectorAll('.quantity-btn.decrease').forEach(button => {
      button.addEventListener('click', function() {
        const productId = this.getAttribute('data-product-id');
        const input = document.querySelector(`.quantity-input[data-product-id="${productId}"]`);
        let value = parseInt(input.value);
        if (value > 1) {
          updateItemQuantity(productId, value - 1);
        }
      });
    });
    
    document.querySelectorAll('.quantity-btn.increase').forEach(button => {
      button.addEventListener('click', function() {
        const productId = this.getAttribute('data-product-id');
        const input = document.querySelector(`.quantity-input[data-product-id="${productId}"]`);
        let value = parseInt(input.value);
        updateItemQuantity(productId, value + 1);
      });
    });
    
    // Add event listeners for quantity input changes
    document.querySelectorAll('.quantity-input').forEach(input => {
      input.addEventListener('change', function() {
        const productId = this.getAttribute('data-product-id');
        let value = parseInt(this.value);
        if (value < 1) value = 1;
        updateItemQuantity(productId, value);
      });
    });
    
    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-btn').forEach(button => {
      button.addEventListener('click', function() {
        const productId = this.getAttribute('data-product-id');
        removeItem(productId);
      });
    });
  }
  
  function updateCartSummary(data) {
    // Update subtotal
    const subtotalElement = document.querySelector('.summary-row:first-child span:last-child');
    if (subtotalElement) {
      subtotalElement.textContent = `${data.subtotal.toFixed(2)}`;
    }
    
    // Calculate tax (10% for demo)
    const tax = data.subtotal * 0.1;
    const taxElement = document.querySelector('.summary-row:nth-child(3) span:last-child');
    if (taxElement) {
      taxElement.textContent = `${tax.toFixed(2)}`;
    }
    
    // Calculate total
    const total = data.subtotal + tax;
    const totalElement = document.querySelector('.summary-row.total span:last-child');
    if (totalElement) {
      totalElement.textContent = `${total.toFixed(2)}`;
    }
  }
  
  function updateItemQuantity(productId, quantity) {
    fetch('/cart/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId, quantity })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Reload cart to show updated information
        loadCart();
      } else {
        alert('Failed to update cart: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error updating cart:', error);
      alert('An error occurred while updating the cart.');
    });
  }
  
  function removeItem(productId) {
    fetch(`/cart/remove/${productId}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Reload cart to show updated information
        loadCart();
      } else {
        alert('Failed to remove item: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error removing item:', error);
      alert('An error occurred while removing the item from cart.');
    });
  }
  
  // Function to update cart count in the header
  function updateCartCount(count) {
    const cartLink = document.querySelector('.user-actions a[href="cart.html"]');
    if (cartLink) {
      cartLink.textContent = `Cart (${count})`;
    }
  }
  
  // Set up checkout button
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function() {
      alert('This is a demo site. In a real application, this would proceed to checkout.');
    });
  }
});