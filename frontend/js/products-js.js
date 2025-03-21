// frontend/js/products.js
document.addEventListener('DOMContentLoaded', function() {
  // For product listing pages (e.g., laptops.html)
  const productGrid = document.querySelector('.products-grid');
  
  if (productGrid) {
    // Get current page category from URL
    const category = window.location.pathname.split('/').pop().replace('.html', '');
    
    // Fetch products by category
    fetch(`/products/category/${category}`)
      .then(response => response.json())
      .then(products => {
        if (products.length > 0) {
          // Clear any existing products
          productGrid.innerHTML = '';
          
          // Add each product to the grid
          products.forEach(product => {
            productGrid.innerHTML += `
              <div class="product-card" data-product-id="${product.id}">
                <div class="product-img">
                  <img src="images/${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                  <h3 class="product-title">${product.name}</h3>
                  <div class="product-specs">${product.specs}</div>
                  <div class="product-rating">
                    <div class="stars">${getStarRating(product.rating)}</div>
                    <div class="rating-count">(${product.reviews})</div>
                  </div>
                  <div class="product-price">
                    $${product.price} 
                    ${product.originalPrice ? `<span class="product-original-price">$${product.originalPrice}</span>` : ''}
                    ${product.discount ? `<span class="product-discount">-${product.discount}%</span>` : ''}
                  </div>
                  <button class="add-to-cart" data-product-id="${product.id}">Add to Cart</button>
                </div>
              </div>
            `;
          });
          
          // Add event listeners to product cards
          document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function(e) {
              // Don't navigate if the click was on the "Add to Cart" button
              if (e.target.classList.contains('add-to-cart')) {
                return;
              }
              
              const productId = this.getAttribute('data-product-id');
              window.location.href = `/product/${productId}`;
            });
          });
          
          // Add event listeners to "Add to Cart" buttons
          document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function(e) {
              e.stopPropagation();
              const productId = this.getAttribute('data-product-id');
              addToCart(productId);
            });
          });
        }
      })
      .catch(error => {
        console.error('Error fetching products:', error);
      });
  }
  
  // For product detail page
  if (window.location.pathname.includes('/product/')) {
    const productId = window.location.pathname.split('/').pop();
    
    fetch(`/products/${productId}`)
      .then(response => response.json())
      .then(product => {
        // Update product details on the page
        document.querySelector('.product-title').textContent = product.name;
        document.querySelector('.product-description p').textContent = product.description;
        document.querySelector('.current-price').textContent = '$' + product.price;
        
        if (product.originalPrice) {
          document.querySelector('.original-price').textContent = '$' + product.originalPrice;
          document.querySelector('.discount-badge').textContent = '-' + product.discount + '%';
        }
        
        // Update product availability
        document.querySelector('.product-availability').textContent = 
          product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock';
          
        // Update product rating
        document.querySelector('.stars').textContent = getStarRating(product.rating);
        document.querySelector('.reviews-count').textContent = `${product.rating}/5 (${product.reviews} Reviews)`;
        
        // Setup "Add to Cart" button
        const addToCartBtn = document.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
          addToCartBtn.addEventListener('click', function() {
            const quantity = parseInt(document.getElementById('quantity').value);
            addToCart(productId, quantity, product.price, product.name);
          });
        }
      })
      .catch(error => {
        console.error('Error fetching product details:', error);
      });
  }
  
  // Helper function to generate star rating
  function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars += '★';
    }
    
    // Add half star if needed
    if (halfStar) {
      stars += '★';
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars += '☆';
    }
    
    return stars;
  }
  
  // Function to add product to cart
  function addToCart(productId, quantity = 1, price, name) {
    fetch('/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId, quantity, price, name })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Product added to cart!');
        // Update cart count in the header
        updateCartCount(data.totalItems);
      } else {
        alert('Failed to add product to cart: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
      alert('An error occurred while adding the product to cart.');
    });
  }
  
  // Function to update cart count in the header
  function updateCartCount(count) {
    const cartLink = document.querySelector('.user-actions a[href="cart.html"]');
    if (cartLink) {
      cartLink.textContent = `Cart (${count})`;
    }
  }
  
  // Check cart count on page load
  fetch('/cart')
    .then(response => response.json())
    .then(data => {
      updateCartCount(data.totalItems);
    })
    .catch(error => {
      console.error('Error fetching cart:', error);
    });
});
