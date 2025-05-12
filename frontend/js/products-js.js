
/**
* Load products based on the current page
*/
function loadProducts() {
  // Determine which page we're on
  const currentPage = getCurrentPage();
  
  // Get the container where products should be loaded
  let container;
  
  switch(currentPage) {
      case 'laptops':
          container = document.getElementById('laptops-grid') || document.querySelector('.products-grid');
          if (container && container.children.length === 0) {
              loadLaptops(container);
          }
          break;
      case 'gaming-pcs':
          container = document.getElementById('gaming-pcs-grid') || document.querySelector('.products-grid');
          if (container && container.children.length === 0) {
              loadGamingPCs(container);
          }
          break;
      case 'components':
          container = document.getElementById('components-grid') || document.querySelector('.products-grid');
          if (container && container.children.length === 0) {
              loadComponents(container);
          }
          break;
      case 'monitors':
          container = document.getElementById('monitors-grid') || document.querySelector('.products-grid');
          if (container && container.children.length === 0) {
              loadMonitors(container);
          }
          break;
      case 'accessories':
          container = document.getElementById('accessories-grid') || document.querySelector('.products-grid');
          if (container && container.children.length === 0) {
              loadAccessories(container);
          }
          break;
      case 'deals':
          container = document.getElementById('deals-grid') || document.querySelector('.deals-grid');
          if (container && container.children.length === 0) {
              loadDeals(container);
          }
          break;
  }
}

/**
* Determine current page based on URL
*/
function getCurrentPage() {
  const path = window.location.pathname;
  
  if (path.includes('laptops')) return 'laptops';
  if (path.includes('gaming-pcs')) return 'gaming-pcs';
  if (path.includes('components')) return 'components';
  if (path.includes('monitors')) return 'monitors';
  if (path.includes('accessories')) return 'accessories';
  if (path.includes('deals')) return 'deals';
  
  return 'home';
}

/**
* Load laptop products
*/
function loadLaptops(container) {
  // In a real implementation, this would fetch products from an API
  // For demo purposes, we'll use dummy data
  
  const laptops = [
      {
          id: 1,
          name: 'Acer Predator Helios 300 Gaming Laptop',
          specs: 'Intel Core i7, 16GB RAM, 512GB SSD, RTX 3060',
          price: 1199,
          originalPrice: 1499,
          discount: 20,
          image: 'images/product1.jpg',
          rating: 4.7,
          reviewCount: 128
      },
      {
          id: 2,
          name: 'Dell XPS 15 Laptop',
          specs: 'Intel Core i7, 16GB RAM, 1TB SSD, GeForce GTX 1650 Ti',
          price: 1599,
          originalPrice: 1799,
          discount: 11,
          image: 'images/laptop2.jpg',
          rating: 4.9,
          reviewCount: 64
      },
      // More products would be added here
  ];
  
  // Render products
  renderProducts(container, laptops);
}

/**
* Load gaming PC products
*/
function loadGamingPCs(container) {
  // In a real implementation, this would fetch products from an API
  // For demo purposes, we'll use dummy data
  
  const gamingPCs = [
      {
          id: 101,
          name: 'TechStore Titan X Gaming PC',
          specs: 'Intel Core i9-13900K, RTX 4090 24GB, 64GB DDR5, 2TB NVMe SSD',
          price: 3999,
          originalPrice: 4299,
          discount: 7,
          image: 'images/gaming-pc1.jpg',
          rating: 5.0,
          reviewCount: 32
      },
      {
          id: 102,
          name: 'TechStore Velocity Gaming PC',
          specs: 'AMD Ryzen 7 7800X3D, RTX 4070 12GB, 32GB DDR5, 1TB NVMe SSD',
          price: 2199,
          originalPrice: 2499,
          discount: 12,
          image: 'images/gaming-pc2.jpg',
          rating: 4.8,
          reviewCount: 54
      },
      // More products would be added here
  ];
  
  // Render products
  renderProducts(container, gamingPCs);
}

/**
* Load component products
*/
function loadComponents(container) {
  // In a real implementation, this would fetch products from an API
  // For demo purposes, we'll use dummy data
  
  const components = [
      {
          id: 201,
          name: 'NVIDIA GeForce RTX 4070 Graphics Card',
          specs: '12GB GDDR6X, Ray Tracing, DLSS 3.0',
          price: 599,
          originalPrice: 649,
          discount: 8,
          image: 'images/gpu1.jpg',
          rating: 4.9,
          reviewCount: 87
      },
      {
          id: 202,
          name: 'AMD Ryzen 9 7900X Processor',
          specs: '12 Cores, 24 Threads, Up to 5.6GHz, AM5 Socket',
          price: 449,
          originalPrice: 549,
          discount: 18,
          image: 'images/cpu1.jpg',
          rating: 4.9,
          reviewCount: 124
      },
      // More products would be added here
  ];
  
  // Render products
  renderProducts(container, components);
}

/**
* Load monitor products
*/
function loadMonitors(container) {
  // In a real implementation, this would fetch products from an API
  // For demo purposes, we'll use dummy data
  
  const monitors = [
      {
          id: 301,
          name: 'LG UltraGear 27" 1ms 144Hz Gaming Monitor',
          specs: '27" IPS, 2560x1440, HDR10, G-Sync Compatible',
          price: 329,
          originalPrice: 399,
          discount: 18,
          image: 'images/monitor1.jpg',
          rating: 4.9,
          reviewCount: 128
      },
      {
          id: 302,
          name: 'Samsung Odyssey G7 32" Curved Gaming Monitor',
          specs: '32" VA, 2560x1440, 240Hz, 1ms, HDR600',
          price: 649,
          originalPrice: 799,
          discount: 19,
          image: 'images/monitor2.jpg',
          rating: 4.7,
          reviewCount: 96
      },
      // More products would be added here
  ];
  
  // Render products
  renderProducts(container, monitors);
}

/**
* Load accessory products
*/
function loadAccessories(container) {
  // In a real implementation, this would fetch products from an API
  // For demo purposes, we'll use dummy data
  
  const accessories = [
      {
          id: 401,
          name: 'Logitech G Pro X Mechanical Gaming Keyboard',
          specs: 'Tenkeyless Design, RGB, GX Blue Switches',
          price: 129,
          originalPrice: 149,
          discount: 13,
          image: 'images/keyboard1.jpg',
          rating: 4.9,
          reviewCount: 142
      },
      {
          id: 402,
          name: 'Razer DeathAdder V2 Gaming Mouse',
          specs: '20K DPI Optical Sensor, 8 Programmable Buttons',
          price: 69,
          originalPrice: 79,
          discount: 13,
          image: 'images/mouse1.jpg',
          rating: 4.8,
          reviewCount: 98
      },
      // More products would be added here
  ];
  
  // Render products
  renderProducts(container, accessories);
}

/**
* Load deal products
*/
function loadDeals(container) {
  // In a real implementation, this would fetch products from an API
  // For demo purposes, we'll use dummy data
  
  const deals = [
      {
          id: 501,
          name: 'Acer Predator Helios 300 Gaming Laptop',
          price: 1049,
          originalPrice: 1499,
          discount: 30,
          image: 'images/deal1.jpg',
          endDate: '2025-03-25',
          stockPercentage: 45,
          stockRemaining: 9
      },
      {
          id: 502,
          name: 'NVIDIA GeForce RTX 4070 Graphics Card',
          price: 499,
          originalPrice: 649,
          discount: 25,
          image: 'images/deal2.jpg',
          endDate: '2025-03-24',
          stockPercentage: 25,
          stockRemaining: 5
      },
      // More deals would be added here
  ];
  
  // Render deals
  renderDeals(container, deals);
}

/**
* Render products to container
*/
function renderProducts(container, products) {
  if (!container) return;
  
  let html = '';
  
  products.forEach(product => {
      html += `
          <div class="product-card" data-product-id="${product.id}" ${product.slug ? `data-product-slug="${product.slug}"` : ''}>
              <div class="product-img">
                  <img src="${product.image}" alt="${product.name}">
              </div>
              <div class="product-info">
                  <h3 class="product-title">${product.name}</h3>
                  <div class="product-specs">${product.specs}</div>
                  <div class="product-rating">
                      <div class="stars">${renderStars(product.rating)}</div>
                      <div class="rating-count">(${product.reviewCount})</div>
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
  
  container.innerHTML = html;
  
  // Initialize add to cart buttons
  initializeAddToCartButtons();
}

/**
* Render deals to container
*/
function renderDeals(container, deals) {
  if (!container) return;
  
  let html = '';
  
  deals.forEach(deal => {
      // Calculate days remaining
      const endDate = new Date(deal.endDate);
      const today = new Date();
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      html += `
          <div class="deal-card" data-product-id="${deal.id}">
              <div class="deal-badge">-${deal.discount}%</div>
              <div class="deal-img">
                  <img src="${deal.image}" alt="${deal.name}">
              </div>
              <div class="deal-info">
                  <h3 class="deal-title">${deal.name}</h3>
                  <div class="deal-price">
                      <span class="current-price">$${deal.price}</span>
                      <span class="original-price">$${deal.originalPrice}</span>
                      <span class="discount-percent">-${deal.discount}%</span>
                  </div>
                  <div class="deal-savings">Save $${deal.originalPrice - deal.price} today!</div>
                  <div class="deal-expires">Deal ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</div>
                  <div class="deal-stock">
                      <div class="stock-progress" style="width: ${deal.stockPercentage}%;"></div>
                  </div>
                  <div class="stock-text">${deal.stockRemaining} units left at this price</div>
                  <button class="add-to-cart" data-product-id="${deal.id}">Add to Cart</button>
              </div>
          </div>
      `;
  });
  
  container.innerHTML = html;
  
  // Initialize add to cart buttons
  initializeAddToCartButtons();
}

/**
* Initialize product filters
*/
function initializeFilters() {
  const filterCheckboxes = document.querySelectorAll('.filters-sidebar input[type="checkbox"]');
  const filterButton = document.querySelector('.filter-btn');
  const clearFiltersLink = document.querySelector('.clear-filters');
  
  if (filterCheckboxes.length > 0 && filterButton) {
      filterButton.addEventListener('click', function() {
          // In a real implementation, this would apply filters
          // For demo purposes, we'll just show an alert
          alert('Filters would be applied here.');
      });
  }
  
  if (clearFiltersLink) {
      clearFiltersLink.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Reset all checkboxes
          filterCheckboxes.forEach(checkbox => {
              if (checkbox.parentElement.textContent.includes('All')) {
                  checkbox.checked = true;
              } else {
                  checkbox.checked = false;
              }
          });
          
          // Reset price range
          const priceRange = document.getElementById('price-range');
          const maxPriceInput = document.querySelector('.price-input[max]');
          
          if (priceRange && maxPriceInput) {
              priceRange.value = priceRange.max;
              maxPriceInput.value = priceRange.max;
          }
          
          // In a real implementation, this would also reset the product list
          alert('Filters have been cleared.');
      });
  }
}

/**
* Initialize product sorting
*/
function initializeSorting() {
  const sortSelect = document.getElementById('sort-select');
  
  if (sortSelect) {
      sortSelect.addEventListener('change', function() {
          const sortValue = this.value;
          
          // In a real implementation, this would sort the products
          // For demo purposes, we'll just show an alert
          alert(`Products would be sorted by ${sortValue}`);
      });
  }
}

/**
* Initialize view toggles (grid/list)
*/
function initializeViewToggles() {
  const viewButtons = document.querySelectorAll('.view-btn');
  const productsGrid = document.querySelector('.products-grid');
  const productsList = document.querySelector('.products-list');
  
  if (viewButtons.length > 0 && productsGrid) {
      viewButtons.forEach(button => {
          button.addEventListener('click', function() {
              // Remove active class from all buttons
              viewButtons.forEach(btn => btn.classList.remove('active'));
              
              // Add active class to clicked button
              this.classList.add('active');
              
              // Get the view type (grid or list)
              const viewType = this.getAttribute('data-view');
              
              // Toggle views (would need additional code for a complete implementation)
              if (viewType === 'grid' && productsList) {
                  productsGrid.style.display = 'grid';
                  productsList.style.display = 'none';
              } else if (viewType === 'list' && productsList) {
                  productsGrid.style.display = 'none';
                  productsList.style.display = 'block';
              } else {
                  alert('List view is under development.');
              }
          });
      });
  }
}

/**
* Initialize price range sliders
*/
function initializePriceRanges() {
  const priceRange = document.getElementById('price-range');
  
  if (priceRange) {
      const maxValue = priceRange.max;
      const maxPriceInput = document.querySelector(`.price-input[max="${maxValue}"]`);
      
      if (maxPriceInput) {
          // Update input when slider changes
          priceRange.addEventListener('input', function() {
              maxPriceInput.value = this.value;
          });
          
          // Update slider when input changes
          maxPriceInput.addEventListener('input', function() {
              if (parseInt(this.value) > parseInt(maxValue)) {
                  this.value = maxValue;
              }
              priceRange.value = this.value;
          });
      }
  }
}
/**
* Initialize add to cart buttons
*/
function initializeAddToCartButtons() {
  const addToCartButtons = document.querySelectorAll('.add-to-cart, .add-to-cart-btn');
  
  addToCartButtons.forEach(button => {
    // Skip if already initialized
    if (button.dataset.initialized === 'true') return;
    
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation(); // Prevent triggering product card click
      
      // Disable button temporarily to prevent double-clicks
      this.disabled = true;
      const originalText = this.textContent;
      this.textContent = 'Adding...';
      
      const productId = this.getAttribute('data-product-id');
      if (!productId) {
        console.error('No product ID found on button');
        this.disabled = false;
        this.textContent = originalText;
        return;
      }
      
      // Get product details
      const productContainer = this.closest('.product-card, .product-info, .product-detail, .deal-card');
      let productName = "Unknown Product";
      let productPrice = 0;
      let productImage = '';
      
      if (productContainer) {
        // Try to find product name
        const nameElement = productContainer.querySelector('.product-title, .product-name, .item-name, .deal-title');
        if (nameElement) {
          productName = nameElement.textContent.trim();
        }
        
        // Try to find product price
        const priceElement = productContainer.querySelector('.product-price, .current-price, .deal-price .current-price');
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
      
      // Get quantity if available (for product detail page)
      let quantity = 1;
      const quantityInput = document.querySelector('.quantity-input');
      if (quantityInput) {
        quantity = parseInt(quantityInput.value) || 1;
      }
      
      console.log(`Adding product to cart: ID=${productId}, Name=${productName}, Price=${productPrice}, Image=${productImage}, Quantity=${quantity}`);
      
      // Use global updateCart function if available
      if (typeof window.updateCart === 'function') {
        window.updateCart(productId, productName, quantity, productPrice, productImage);
        
        // Re-enable button after a short delay
        setTimeout(() => {
          this.disabled = false;
          this.textContent = originalText;
        }, 1000);
      } else {
        // Fallback to cart-js functions if available
        if (window.cartFunctions && typeof window.cartFunctions.addToCart === 'function') {
          window.cartFunctions.addToCart(productId, productName, productPrice, productImage, this);
        } else {
          // Super fallback if neither is available
          console.log(`Added to cart: ${productName}`);
          alert(`${productName} added to cart!`);
          
          // Re-enable button
          this.disabled = false;
          this.textContent = originalText;
        }
      }
    });
    
    // Mark as initialized to prevent duplicate handlers
    button.dataset.initialized = 'true';
  });
}

/**
* Generate star rating HTML
*/
function renderStars(rating) {
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
const pendingWishlistAdds = new Set();
function addToWishlist(productId, name, price, image, buttonElement) {
  // Validate inputs
  if (!productId) {
    console.error('Product ID is required');
    showNotification('Unable to add to wishlist. Missing product ID.', 'error');
    return;
  }

  // Prevent duplicate requests
  const productKey = productId.toString();
  if (pendingWishlistAdds.has(productKey)) {
    console.log('Already adding this product to wishlist, ignoring duplicate request');
    return;
  }

  // Add to pending set
  pendingWishlistAdds.add(productKey);

  // Check if user is logged in
  if (!window.authUtils || !window.authUtils.isUserLoggedIn()) {
    // Remove from pending set
    pendingWishlistAdds.delete(productKey);
    // Redirect to login page
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }

  // Update button state to indicate loading
  if (buttonElement) {
    buttonElement.disabled = true;
    buttonElement.textContent = 'Adding...';
  }

  // Clean and validate data
  const cleanProductId = String(productId).trim();
  const cleanName = (name || 'Unnamed Product').trim();
  const cleanPrice = parseFloat(
    String(price)
      .replace('$', '')
      .replace(',', '')
  ) || 0;
  const cleanImage = image || '/images/placeholder.jpg';

  // Send request
  fetch('/api/wishlist/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      productId: cleanProductId, 
      name: cleanName, 
      price: cleanPrice,
      image: cleanImage
    }),
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    // Remove from pending set
    pendingWishlistAdds.delete(productKey);
    
    if (data.success) {
      showNotification('Added to wishlist!', 'success');
      
      // Update wishlist count
      updateWishlistCount();
      
      // Update button to show item is in wishlist
      if (buttonElement) {
        buttonElement.textContent = 'In Wishlist';
        buttonElement.classList.add('in-wishlist');
        buttonElement.disabled = true;
      }
    } else {
      showNotification(data.message || 'Failed to add to wishlist', 'error');
      
      // Reset button
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Add to Wishlist';
      }
    }
  })
  .catch(error => {
    // Remove from pending set
    pendingWishlistAdds.delete(productKey);
    
    console.error('Error adding to wishlist:', error);
    showNotification('Failed to add to wishlist. Please try again.', 'error');
    
    // Reset button on error
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.textContent = 'Add to Wishlist';
    }
  });
}

/**
* Hash a string to create a valid 24-character hex string (compatible with MongoDB ObjectId)
* @param {string} str - The string to hash
* @returns {string} A 24-character hex string
*/
function hashStringTo24HexChars(str) {
  // Simple hash function to generate a number from a string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to a hex string and ensure it's 24 characters
  let hexHash = Math.abs(hash).toString(16);

  // Pad to ensure we have 24 characters
  while (hexHash.length < 24) {
    hexHash = hexHash + Math.abs(hash).toString(16);
  }

  // Trim if too long
  return hexHash.slice(0, 24);
}
 // Add this function to initialize wishlist buttons based on their current status
function initializeWishlistButtons() {
  const wishlistButtons = document.querySelectorAll('.wishlist-btn, button[data-action="wishlist"]');
  
  if (!wishlistButtons.length) return;
  
  wishlistButtons.forEach(button => {
    const productId = button.getAttribute('data-product-id');
    
    if (!productId) {
      console.warn('Wishlist button missing product ID');
      return;
    }
    
    // Show loading state
    button.setAttribute('data-original-text', button.textContent);
    button.textContent = 'Checking...';
    button.disabled = true;
    
    // Check if product is in wishlist
    checkWishlistStatus(productId)
      .then(inWishlist => {
        if (inWishlist) {
          // Product is in wishlist - update button
          button.textContent = 'In Wishlist';
          button.classList.add('in-wishlist');
          button.disabled = true;
        } else {
          // Product is not in wishlist - restore button
          button.textContent = button.getAttribute('data-original-text') || 'Add to Wishlist';
          button.classList.remove('in-wishlist');
          button.disabled = false;
        }
      })
      .catch(() => {
        // Error occurred - restore button
        button.textContent = button.getAttribute('data-original-text') || 'Add to Wishlist';
        button.disabled = false;
      });
  });
}
// Add notification function if it doesn't exist
function showNotification(message, type = 'info') {
  console.log(`${type.toUpperCase()}: ${message}`);
  
  // Check if notification element exists, create if not
  let notification = document.querySelector('.notification-toast');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 4px; color: white; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.2); display: none;';
    document.body.appendChild(notification);
  }
  
  // Set styling based on notification type
  if (type === 'success') {
    notification.style.backgroundColor = '#4CAF50';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#f44336';
  } else {
    notification.style.backgroundColor = '#2196F3';
  }
  
  // Set content and display
  notification.textContent = message;
  notification.style.display = 'block';
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}
// Function to update wishlist count in the header
function updateWishlistCount() {
  fetch('/api/wishlist/count', {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    const wishlistCountEl = document.getElementById('wishlist-count');
    if (wishlistCountEl) {
      wishlistCountEl.textContent = data.count || 0;
    }
  })
  .catch(error => {
    console.error('Error updating wishlist count:', error);
  });
}
function loadFeaturedProducts() {
  try {
    const container = document.querySelector('.featured-products .product-grid');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div class="loading">Loading featured products...</div>';
    
    // Define hardcoded featured products with proper IDs and slugs
    const featuredProducts = [
      {
        _id: "681e3143bf1727e8bb3a3d71",
        name: "Acer Predator Helios 300",
        slug: "acer-predator-helios-300",
        price: 1299.99,
        compareAtPrice: 1499.99,
        discount: 13,
        thumbnailUrl: "images/acer3000.jpg",
        sku: "ACR10750H3060"
      },
      {
        _id: "681e3143bf1727e8bb3a3d76",
        name: "NVIDIA GeForce RTX 4080",
        slug: "nvidia-geforce-rtx-4080",
        price: 1199.99,
        compareAtPrice: 1299.99,
        discount: 7,
        thumbnailUrl: "images/4080gi.jpg",
        sku: "NV4080-16GB"
      },
      {
        _id: "681e3143bf1727e8bb3a3d81",
        name: "LG 27GN950-B UltraGear",
        slug: "lg-27gn950-b-ultragear",
        price: 799.99,
        compareAtPrice: 899.99,
        discount: 11,
        thumbnailUrl: "images/lg27.jpg",
        sku: "LG27GN950B"
      },
      {
        _id: "681e3143bf1727e8bb3a3d7c",
        name: "TechStore Voyager",
        slug: "techstore-voyager",
        price: 2299.99,
        compareAtPrice: 2499.99,
        discount: 8,
        thumbnailUrl: "images/voyage.jpg",
        sku: "TSVGR13700K4070"
      }
    ];
    
    // Generate HTML for featured products
    let productsHtml = '';
    featuredProducts.forEach(product => {
      // Format price details
      const regularPrice = product.compareAtPrice || product.price;
      const salePrice = product.price;
      const hasDiscount = regularPrice > salePrice;
      const discountPercent = product.discount || Math.round((1 - salePrice / regularPrice) * 100);
      
      productsHtml += `
        <div class="product-card" data-product-id="${product._id}" data-product-slug="${product.slug}">
          <div class="product-img">
            <img src="${product.thumbnailUrl}" alt="${product.name}">
          </div>
          <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">
              $${typeof salePrice === 'number' ? salePrice.toFixed(2) : salePrice} 
              ${hasDiscount ? `
                <span class="product-original-price">$${typeof regularPrice === 'number' ? regularPrice.toFixed(2) : regularPrice}</span>
                <span class="product-discount">-${discountPercent}%</span>
              ` : ''}
            </div>
            <button class="add-to-cart" data-product-id="${product._id}">Add to Cart</button>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = productsHtml;
    
    // Make product cards clickable
    const productCards = container.querySelectorAll('.product-card');
    productCards.forEach(card => {
      card.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') return;
        
        const productId = this.getAttribute('data-product-id');
        const productSlug = this.getAttribute('data-product-slug');
        
        // Use the updated navigation function
        navigateToProductDetail(productId, productSlug);
      });
    });
    
    // Initialize add to cart buttons
    initializeAddToCartButtons();
    
  } catch (error) {
    console.error('Error loading featured products:', error);
    
    // Show error message if loading fails
    const container = document.querySelector('.featured-products .product-grid');
    if (container) {
      container.innerHTML = '<p>Failed to load featured products. Please try again later.</p>';
    }
  }
}

/**
 * Optional: Fetch featured products from API in the background
 * This won't block the initial display of hardcoded products
 */
async function fetchFeaturedProductsInBackground() {
  try {
    // Try the dedicated featured endpoint first
    let response = await fetch('/api/products/featured/list?limit=10');
    
    // Fall back to the regular endpoint with filter
    if (!response.ok) {
      response = await fetch('/products?isFeatured=true&limit=10');
    }
    
    if (!response.ok) return; // If both fail, just keep using our hardcoded data
    
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) return;
    
    // Log the successful fetch for debugging
    console.log('Successfully fetched featured products from API');
    
    // Note: Here you could update the product data if needed
    // For example, update prices or availability based on API data
    
  } catch (error) {
    console.error('Background fetch of featured products failed:', error);
    // This error is non-critical since we already displayed our hardcoded products
  }
}

/**
 * Render featured products to container
 * @param {HTMLElement} container - Container element for featured products
 * @param {Array} products - Array of product data objects
 */
function renderFeaturedProducts(container, products) {
  if (!container || !products || !products.length) return;
  
  let html = '';
  
  products.forEach(product => {
    // Calculate price details
    const regularPrice = product.compareAtPrice || product.price;
    const salePrice = product.price;
    const hasDiscount = regularPrice > salePrice;
    const discountPercent = product.discount || Math.round((1 - salePrice / regularPrice) * 100);
    
    // Generate HTML for each product card
    html += `
      <div class="product-card" data-product-id="${product._id}" data-product-slug="${product.slug || ''}">
        <div class="product-img">
          <img src="${product.thumbnailUrl || 'images/product-placeholder.jpg'}" alt="${product.name}">
        </div>
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <div class="product-price">
            $${typeof salePrice === 'number' ? salePrice.toFixed(2) : salePrice} 
            ${hasDiscount ? `
              <span class="product-original-price">$${typeof regularPrice === 'number' ? regularPrice.toFixed(2) : regularPrice}</span>
              <span class="product-discount">-${discountPercent}%</span>
            ` : ''}
          </div>
          <button class="add-to-cart" data-product-id="${product._id}">Add to Cart</button>
        </div>
      </div>
    `;
  });
  
  // Update container with the generated HTML
  container.innerHTML = html;
  
  // Make the product cards clickable
  makeProductCardsClickable();
  
  // Initialize add to cart buttons
  initializeAddToCartButtons();
}

/**
 * Generate star rating HTML
 */
function renderStars(rating) {
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

function initializeProductListeners() {
  // Add event listeners to product cards
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    // Make the entire card clickable to view product details
    card.addEventListener('click', function(e) {
      // Don't navigate if clicking on a button
      if (e.target.tagName === 'BUTTON') {
        return;
      }
      
      const productId = this.getAttribute('data-product-id');
      const productSlug = this.getAttribute('data-product-slug');
      
      // Navigate to product detail page
      navigateToProductDetail(productId, productSlug);
    });
  });
  
  // Add event listeners to "View Details" buttons
  const viewDetailsButtons = document.querySelectorAll('.view-details');
  
  viewDetailsButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent triggering the card click
      
      const productId = this.getAttribute('data-product-id');
      const productSlug = this.getAttribute('data-product-slug');
      
      // Navigate to product detail page
      navigateToProductDetail(productId, productSlug);
    });
  });
}
/**
 * Navigate to product detail page
 * @param {string} productId - Product ID
 * @param {string} productSlug - Product slug (SEO-friendly URL)
 */
function navigateToProductDetail(productId, productSlug) {
  // When using slug, navigate to the product detail page with query parameters
  if (productSlug) {
    window.location.href = `/product-detail.html?slug=${productSlug}`;
  } else if (productId) {
    window.location.href = `/product-detail.html?id=${productId}`;
  }
}
function makeProductCardsClickable() {
  // Select all product cards on the page
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    // Make the entire card clickable except for the buttons
    card.addEventListener('click', function(e) {
      // Don't navigate if clicking on a button
      if (e.target.tagName === 'BUTTON') return;
      
      // Get product identifiers
      const productId = this.getAttribute('data-product-id');
      const productSlug = this.getAttribute('data-product-slug');
      
      // Navigate to product detail page
      navigateToProductDetail(productId, productSlug);
    });
  });
}
/**
 * Call this after rendering any products to make them clickable
 */
// Make sure the DOM is loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
  // Load regular products on category pages
  loadProducts();
  
  // Load featured products on pages with featured section
  loadFeaturedProducts();
  
  // Initialize all product interactions
  initializeFilters();
  initializeSorting();
  initializeViewToggles();
  initializePriceRanges();
  initializeAddToCartButtons();
  initializeWishlistButtons();
  initializeProductListeners();
  makeProductCardsClickable();
});
