/**
 * TechStore Products JavaScript File
 * Handles product-related functionality
 */
document.addEventListener('DOMContentLoaded', function() {
  // Load products on category pages
  loadProducts();
  
  // Initialize filters
  initializeFilters();
  
  // Initialize product sorting
  initializeSorting();
  
  // Initialize view toggles (grid/list)
  initializeViewToggles();
  
  // Initialize price range sliders
  initializePriceRanges();
  
  // Initialize add to cart buttons (in case they're in the HTML)
  initializeAddToCartButtons();
  
  // Initialize wishlist buttons
  initializeWishlistButtons();


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
          <div class="product-card" data-product-id="${product.id}">
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
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  
  addToCartButtons.forEach(button => {
      button.addEventListener('click', function(e) {
          e.stopPropagation(); // Prevent triggering product card click
          
          const productId = this.getAttribute('data-product-id');
          let productName = "Product";
          
          // Get product name
          const productCard = this.closest('.product-card, .product-info, .deal-card');
          if (productCard) {
              const nameElement = productCard.querySelector('.product-title, .deal-title');
              if (nameElement) {
                  productName = nameElement.textContent;
              }
          }
          
          // Update cart (function defined in main.js)
          if (typeof updateCart === 'function') {
              updateCart(productId, productName);
          }
          
          // Show notification (function defined in main.js)
          if (typeof showNotification === 'function') {
              showNotification(productName + ' added to cart!');
          } else {
              alert(productName + ' added to cart!');
          }
      });
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
function addToWishlist(productId, name, price, image, buttonElement) {
  // Validate inputs
  if (!productId) {
    console.error('Product ID is required');
    showNotification('Unable to add to wishlist. Missing product details.', 'error');
    return;
  }

  // Check if user is logged in
  if (!window.authUtils || !window.authUtils.isUserLoggedIn()) {
    // Redirect to login page
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }

  // Clean and validate data
  const cleanProductId = String(productId).trim();
  const cleanName = (name || 'Unnamed Product').trim();
  const cleanPrice = parseFloat(
    String(price)
      .replace('$', '')
      .replace(',', '')
  ) || 0;
  const cleanImage = image || 'images/product1.jpg';

  // Log the data being sent (for debugging)
  console.log('Wishlist Add Data:', {
    productId: cleanProductId,
    name: cleanName,
    price: cleanPrice,
    image: cleanImage
  });

  // Convert non-ObjectId product IDs to valid MongoDB ObjectId format
  // If the product ID isn't a valid 24-character hex string, generate a deterministic ID
  let formattedProductId = cleanProductId;
  
  // Check if the ID is already a valid MongoDB ObjectId (24 hex chars)
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(cleanProductId);
  
  if (!isValidObjectId) {
    // For demo/development: Use a hash of the product ID to create a consistent valid ObjectId
    // In production, you would likely want to fetch the correct ID from your database
    formattedProductId = hashStringTo24HexChars(cleanProductId);
  }

  // Send request
  fetch('/api/wishlist/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      productId: formattedProductId, 
      name: cleanName, 
      price: cleanPrice,
      image: cleanImage
    }),
    credentials: 'include'
  })
  .then(response => {
    // Log the raw response for debugging
    console.log('Response status:', response.status);
    
    // Check if response is ok
    if (!response.ok) {
      return response.json().then(errorData => {
        throw new Error(errorData.message || 'Failed to add to wishlist');
      });
    }
    
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Show success notification
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
      // Show error from backend
      showNotification(data.message || 'Failed to add to wishlist', 'error');
    }
  })
  .catch(error => {
    console.error('Error adding to wishlist:', error);
    showNotification(error.message || 'Failed to add to wishlist', 'error');
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
  
function initializeWishlistButtons() {
  const wishlistButtons = document.querySelectorAll('.wishlist-btn');
  
  wishlistButtons.forEach(button => {
    // Ensure product ID is set
    if (!button.getAttribute('data-product-id')) {
      // Try to get from parent or set a default
      const productCard = button.closest('.product-card, .product-detail');
      const productId = productCard?.getAttribute('data-product-id') || 'ACR10750H3060';
      button.setAttribute('data-product-id', productId);
    }
    
    // Check if product is already in wishlist (for logged in users)
    const productId = button.getAttribute('data-product-id');
    if (window.authUtils && window.authUtils.isUserLoggedIn()) {
      fetch(`/api/wishlist/check/${productId}`, {
        credentials: 'include'
      })
      .then(response => response.json())
      .then(data => {
        if (data.inWishlist) {
          button.textContent = 'In Wishlist';
          button.classList.add('in-wishlist');
          button.disabled = true;
        }
      })
      .catch(error => {
        console.error('Error checking wishlist status:', error);
      });
    }
    
    button.addEventListener('click', function() {
      // Skip if already in wishlist
      if (this.classList.contains('in-wishlist')) {
        return;
      }
      
      // Get product details
      const productId = this.getAttribute('data-product-id');
      const productContainer = this.closest('.product-card, .product-detail, .product-info');
      
      // Safely extract product details
      const productName = productContainer?.querySelector('.product-title, .deal-title')?.textContent;
      const priceElement = productContainer?.querySelector('.current-price, .product-price');
      const productPrice = priceElement?.textContent;
      const imageElement = productContainer?.querySelector('img');
      const productImage = imageElement?.src;
      
      // Call API to add to wishlist
      addToWishlist(productId, productName, productPrice, productImage, this);
    });
  });
}
  
  // Utility function to show notifications
  function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // If a custom notification function exists, use it
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      // Fallback to browser alert
      alert(message);
    }
  }
  
  // Update wishlist count
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
  
  /**
   * Get product ID from URL
   * @returns {string|null} Product ID from URL or null if not found
   */
  function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

});