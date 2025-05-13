/**
 * TechStore Main JavaScript File
 * Contains common functionality used across the site
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu functionality
    initializeMobileMenu();
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize cart functionality
    initializeCart();
    
    // Add scroll event listeners
    initializeScrollEffects();
    
    // Initialize product interaction
    initializeProductInteractions();
    
    // Check authentication status and update UI
    if (window.authUtils) {
        window.authUtils.checkAuthStatus();
    }
});

/**
 * Mobile menu functionality
 */
function initializeMobileMenu() {
    // This would be implemented for mobile menu toggle
    const mobileMenuToggle = document.createElement('button');
    mobileMenuToggle.className = 'mobile-menu-toggle';
    mobileMenuToggle.innerHTML = '☰';
    
    const header = document.querySelector('header');
    if (header) {
        header.appendChild(mobileMenuToggle);
        
        mobileMenuToggle.addEventListener('click', function() {
            document.body.classList.toggle('mobile-menu-active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (document.body.classList.contains('mobile-menu-active') && 
            !event.target.closest('nav') && 
            !event.target.closest('.mobile-menu-toggle')) {
            document.body.classList.remove('mobile-menu-active');
        }
    });
}

/**
 * Search functionality
 */
function initializeSearch() {
    const searchForm = document.querySelector('.search-bar');
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    
    if (searchForm && searchInput && searchButton) {
        // Prevent empty searches
        searchForm.addEventListener('submit', function(e) {
            if (!searchInput.value.trim()) {
                e.preventDefault();
                searchInput.focus();
            }
        });
        
        // Focus search input when clicking on the search bar
        searchForm.addEventListener('click', function() {
            searchInput.focus();
        });
        
        // Process search on button click
        searchButton.addEventListener('click', function() {
            if (searchInput.value.trim()) {
                window.location.href = '/search-results.html?q=' + encodeURIComponent(searchInput.value.trim());
            } else {
                searchInput.focus();
            }
        });
    }
}

/**
 * Cart functionality
 */
function initializeCart() {
    // This would handle cart operations like add to cart, update cart, etc.
    // For demonstration purposes, we'll just initialize the add to cart buttons
    
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get product information
            let productName = "Product";
            let productId = this.getAttribute('data-product-id') || '0';
            
            // If button is inside a product card, get the product name
            const productCard = this.closest('.product-card, .product-info');
            if (productCard) {
                const nameElement = productCard.querySelector('.product-title, .item-name');
                if (nameElement) {
                    productName = nameElement.textContent;
                }
            }
            
            // Simulate adding to cart
            updateCart(productId, productName);
            
            // Show confirmation
            showNotification(productName + ' added to cart!');
        });
    });
}

/**
 * Update cart - FIXED VERSION
 * This function needs to be updated to work with your cart-js.js system
 */
function updateCart(productId, productName, quantity = 1, productPrice = 0, productImage = '') {
    console.log('Main updateCart called with:', { productId, productName, quantity, productPrice, productImage });
    
    // IMPORTANT: Don't override - forward to cart-js.js functions if available
    if (window.cartFunctions && typeof window.cartFunctions.addToCart === 'function') {
      // Use the cart-js.js implementation
      window.cartFunctions.addToCart(productId, productName, productPrice, productImage);
      return;
    }
    
    // Fallback implementation if cart-js.js isn't loaded yet
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
      
      // Try to send to server if API is available
      if (fetch) {
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
          credentials: 'include' // Important: include cookies for authentication
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to add to server cart');
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            console.log('Product added to server cart successfully');
          }
        })
        .catch(error => {
          console.warn('Error adding to server cart:', error);
          // Already added locally, so no need to show error
        });
      }
    } catch (error) {
      console.error('Error in updateCart fallback implementation:', error);
    }
    
    // Update cart count in UI
    const cartCount = document.querySelector('.user-actions a:last-child');
    if (cartCount) {
      const currentCount = parseInt(cartCount.textContent.match(/\d+/) || 0);
      cartCount.textContent = cartCount.textContent.replace(/\(\d+\)/, `(${currentCount + 1})`);
    }
    
    // Show notification
    showNotification(productName + ' added to cart!', 'success');
  }
  
  // Make updateCart function available globally
  window.updateCart = updateCart;

/**
 * Show notification
 * Make this function globally available for use in other scripts
 */
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', function() {
        document.body.removeChild(notification);
    });
    
    notification.appendChild(closeButton);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(function() {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

/**
 * Scroll effects
 */
function initializeScrollEffects() {
    // Sticky header on scroll
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    
    if (header) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 50) {
                header.classList.add('sticky');
                
                if (scrollTop > lastScrollTop) {
                    // Scrolling down
                    header.classList.add('header-hidden');
                } else {
                    // Scrolling up
                    header.classList.remove('header-hidden');
                }
            } else {
                header.classList.remove('sticky');
                header.classList.remove('header-hidden');
            }
            
            lastScrollTop = scrollTop;
        });
    }
    
    // Back to top button
    const backToTopButton = document.createElement('button');
    backToTopButton.className = 'back-to-top';
    backToTopButton.innerHTML = '&uarr;';
    backToTopButton.title = 'Back to Top';
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    document.body.appendChild(backToTopButton);
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
}

/**
 * Initialize product interactions
 */
function initializeProductInteractions() {
    // Quick view functionality (would be expanded in a real implementation)
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Only trigger if not clicking on a button or link
            if (!e.target.closest('button') && !e.target.closest('a')) {
                const productTitle = card.querySelector('.product-title');
                const productUrl = '/product-detail.html?id=' + (card.getAttribute('data-product-id') || '1');
                
                if (productTitle) {
                    window.location.href = productUrl;
                }
            }
        });
    });
}

/**
 * Category Loader
 * Dynamically loads categories from the API and displays them in the featured categories section
 */

document.addEventListener('DOMContentLoaded', function() {
    loadFeaturedCategories();
});

/**
 * Load featured categories from the API
 */
async function loadFeaturedCategories() {
    try {
        // Get the container element
        const categoryGrid = document.querySelector('.category-grid');
        if (!categoryGrid) return;

        // Show loading state
        categoryGrid.innerHTML = '<div class="loading">Loading categories...</div>';

        // Fetch categories from API
        const response = await fetch('/api/categories?isFeatured=true&level=0');
        
        if (!response.ok) {
            // If API fails, use fallback categories
            loadFallbackCategories(categoryGrid);
            return;
        }

        const data = await response.json();
        
        // Check if we have categories
        if (!data.success || !data.categories || data.categories.length === 0) {
            loadFallbackCategories(categoryGrid);
            return;
        }

        // Define image mapping for categories (slug to image filename)
        const imageMapping = {
            'laptops': 'gaminglaptop.jpg',
            'gaming-pcs': 'pcgaming.jpg',
            'components': 'graphicard.jpg',
            'monitors': 'monitor.jpg'
        };

        // Map category slugs to specific HTML pages
        const urlMapping = {
            'laptops': '/laptops.html',
            'gaming-pcs': '/gaming-pcs.html',
            'components': '/components.html',
            'monitors': '/monitors.html'
        };

        // Create category cards
        const categoryCards = data.categories.map(category => {
            // Get the correct image or use a default
            const imageSrc = imageMapping[category.slug] || 'default-category.jpg';
            
            // Get the correct URL - use the mapping if available, otherwise use the slug
            const categoryUrl = urlMapping[category.slug] || `/${category.slug}.html`;
            
            return `
                <div class="category-card">
                    <a href="${categoryUrl}">
                        <div class="category-img">
                            <img src="images/${imageSrc}" alt="${category.name}">
                        </div>
                        <div class="category-title">${category.name}</div>
                    </a>
                </div>
            `;
        }).join('');

        // Update the grid with the new cards
        categoryGrid.innerHTML = categoryCards;

    } catch (error) {
        console.error('Error loading categories:', error);
        
        // Show error message and use fallback
        loadFallbackCategories(document.querySelector('.category-grid'));
    }
}

/**
 * Fallback function for when API fails
 */
function loadFallbackCategories(categoryGrid) {
    if (!categoryGrid) return;
    
    // Hardcoded categories that match your seeded data
    const fallbackCategories = [
        { name: "Laptops", slug: "laptops", url: "/laptops.html" },
        { name: "Gaming PCs", slug: "gaming-pcs", url: "/gaming-pcs.html" },
        { name: "Components", slug: "components", url: "/components.html" },
        { name: "Monitors", slug: "monitors", url: "/monitors.html" }
    ];
    
    // Create category cards
    const categoryCards = fallbackCategories.map(category => {
        // Determine which image to use based on the slug
        let imageSrc;
        switch(category.slug) {
            case 'laptops':
                imageSrc = 'gaminglaptop.jpg';
                break;
            case 'gaming-pcs':
                imageSrc = 'pcgaming.jpg';
                break;
            case 'components':
                imageSrc = 'graphicard.jpg';
                break;
            case 'monitors':
                imageSrc = 'monitor.jpg';
                break;
            default:
                imageSrc = 'default-category.jpg';
        }
        
        return `
            <div class="category-card">
                <a href="${category.url}">
                    <div class="category-img">
                        <img src="images/${imageSrc}" alt="${category.name}">
                    </div>
                    <div class="category-title">${category.name}</div>
                </a>
            </div>
        `;
    }).join('');
    
    // Update the grid with the fallback cards
    categoryGrid.innerHTML = categoryCards;
}
/**
 * Featured Products Loader
 * Fetches and displays one featured product from each main category
 */

document.addEventListener('DOMContentLoaded', function() {
    loadFeaturedProducts();
});
/**
 * Load featured products - displays featured products from API or fallback data
 */
async function loadFeaturedProducts() {
    try {
      const container = document.querySelector('.featured-products .product-grid');
      
      if (!container) {
        // No featured products container on this page
        return;
      }
      
      // Show loading state
      container.innerHTML = '<div class="loading">Loading featured products...</div>';
      
      // Try to fetch featured products from API
      let featuredProducts = [];
      try {
        // Try the dedicated featured endpoint first (with the correct URL path)
        let response = await fetch('/products/featured/list?limit=4');
        
        // Fall back to the regular endpoint with filter if the dedicated endpoint fails
        if (!response.ok) {
          response = await fetch('/products?isFeatured=true&limit=4');
        }
        
        if (response.ok) {
          const data = await response.json();
          featuredProducts = data.products || [];
        } else {
          throw new Error('Failed to load featured products');
        }
      } catch (error) {
        console.warn('API fetch failed, using fallback data:', error);
        // Use fallback data if API fetch fails
        featuredProducts = getFallbackFeaturedProducts();
      }
      
      // If no products were found, use fallback data
      if (featuredProducts.length === 0) {
        featuredProducts = getFallbackFeaturedProducts();
      }
      
      // Render featured products
      renderFeaturedProducts(container, featuredProducts);
      
    } catch (error) {
      console.error('Error loading featured products:', error);
      
      const container = document.querySelector('.featured-products .product-grid');
      if (container) {
        container.innerHTML = '<p>Failed to load featured products. Please try again later.</p>';
      }
    }
  }
  
/**
 * Initialize add-to-cart buttons for product cards
 */
function initializeAddToCartButtons() {
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  
  addToCartButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const productId = this.getAttribute('data-product-id');
      const productCard = this.closest('.product-card');
      const productName = productCard.querySelector('.product-title').textContent;
      const productPriceText = productCard.querySelector('.product-price').textContent.trim();
      
      // Extract price from the text (e.g., "$599 $649 -8%")
      let productPrice = parseFloat(productPriceText.replace(/[^\d.]/g, ''));
      // If this fails, default to 0
      if (isNaN(productPrice)) productPrice = 0;
      
      // Get product image
      const productImageElement = productCard.querySelector('.product-img img');
      const productImage = productImageElement ? productImageElement.getAttribute('src') : '';
      
      // Call the global updateCart function
      if (window.updateCart) {
        window.updateCart(productId, productName, 1, productPrice, productImage);
      } else {
        console.warn('updateCart function not available');
        
        // Show notification manually if the function is not available
        if (window.showNotification) {
          window.showNotification(productName + ' added to cart!', 'success');
        } else {
          alert(productName + ' added to cart!');
        }
      }
    });
  });
}

/**
 * Fallback function for when API fails
 */
function loadFallbackProducts(productGrid) {
    if (!productGrid) return;
    
    // Hardcoded fallback products
    const fallbackProducts = [
        {
            id: "fallback1",
            name: "Acer Predator Helios 300 Gaming Laptop",
            price: 1199,
            originalPrice: 1499,
            discount: 20,
            imageUrl: "images/acer3000.jpg",
            category: "laptops"
        },
        {
            id: "fallback2",
            name: "NVIDIA GeForce RTX 4070 Graphics Card",
            price: 599,
            originalPrice: 649,
            discount: 8,
            imageUrl: "images/4070gi.jpg",
            category: "components"
        },
        {
            id: "fallback3",
            name: "LG UltraGear 27\" 1ms 144Hz Gaming Monitor",
            price: 329,
            originalPrice: 399,
            discount: 18,
            imageUrl: "images/lg27.jpg",
            category: "monitors"
        },
        {
            id: "fallback4",
            name: "TechStore Voyager Gaming PC",
            price: 1599,
            originalPrice: 1799,
            discount: 11,
            imageUrl: "images/voyage.jpg",
            category: "gaming-pcs"
        }
    ];
    
    // Create product cards
    const productCards = fallbackProducts.map(product => {
        return `
            <div class="product-card">
                <a href="/product-detail.html?id=${product.id}">
                    <div class="product-img">
                        <img src="${product.imageUrl}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-price">
                            $${product.price} <span class="product-original-price">$${product.originalPrice}</span>
                            <span class="product-discount">-${product.discount}%</span>
                        </div>
                    </div>
                </a>
                <button class="add-to-cart" data-product-id="${product.id}">Add to Cart</button>
            </div>
        `;
    }).join('');
    
    // Update the grid with the fallback cards
    productGrid.innerHTML = productCards;
    
    // Initialize Add to Cart buttons for fallback products
    initializeAddToCartButtons();
}
/**
 * Product category pages initialization and filtering functionality
 * This code handles product display and filtering for all category pages
 */

// Add this to your main.js file
document.addEventListener('DOMContentLoaded', function() {
  // Check which category page we're on
  const isGamingPCPage = window.location.pathname.includes('gaming-pcs');
  const isComponentsPage = window.location.pathname.includes('components');
  const isLaptopsPage = window.location.pathname.includes('laptops');
  const isMonitorsPage = window.location.pathname.includes('monitors');
  
  // Initialize the appropriate page
  if (isGamingPCPage) {
    initializeCategoryPage('gaming-pcs');
  } else if (isComponentsPage) {
    initializeCategoryPage('components');
  } else if (isLaptopsPage) {
    initializeCategoryPage('laptops');
  } else if (isMonitorsPage) {
    initializeCategoryPage('monitors');
  }
});

/**
 * Initialize a category page with products and filtering
 * @param {string} categorySlug - The slug of the category (gaming-pcs, components, laptops, monitors)
 */
function initializeCategoryPage(categorySlug) {
  // Get the products container
  const productsContainer = document.querySelector('.products-grid');
  if (!productsContainer) return;
  
  // Show loading state
  productsContainer.innerHTML = '<div class="loading">Loading products...</div>';
  
  // Get filter elements
  const filterGroups = document.querySelectorAll('.filter-group');
  const priceRange = document.getElementById('price-range');
  const minPriceInput = document.querySelector('.price-input[min]');
  const maxPriceInput = document.querySelector('.price-input[max]');
  const filterBtn = document.querySelector('.filter-btn');
  const clearFiltersBtn = document.querySelector('.clear-filters');
  const sortSelect = document.getElementById('sort-select');
  const resultCount = document.querySelector('.results-count');
  const viewButtons = document.querySelectorAll('.view-btn');
  
  // Data storage
  let allProducts = [];
  let filteredProducts = [];
  let categoryData = [];
  
  // Enable global access for quick debugging
  window.techstore = window.techstore || {};
  window.techstore.products = { all: [], filtered: [] };
  
  // Load products for this category
  loadCategoryProducts(categorySlug);

  /**
   * Load products for the specified category
   */
  async function loadCategoryProducts(category) {
    try {
      console.log('Loading products for category:', category);
      
      // Show loading state
      productsContainer.innerHTML = '<div class="loading">Loading products...</div>';
      
      // Try multiple API endpoints with fallbacks
      let productsData = null;
      let errorMessage = null;
      
      // Try main API endpoint first
      try {
        console.log('Trying main category API endpoint');
        const response = await fetch(`/api/categories/${category}/products`);
        const data = await response.json();
        
        console.log('Main API response:', data);
        
        if (response.ok && data.success && Array.isArray(data.products)) {
          productsData = data.products;
          console.log(`Found ${productsData.length} products from main API`);
        } else {
          errorMessage = data.message || `API error: ${response.status}`;
          console.warn('Main API error:', errorMessage);
        }
      } catch (apiError) {
        console.error('Main API call failed:', apiError);
        errorMessage = apiError.message;
      }
      
      // If main API failed, try embedded products endpoint
      if (!productsData) {
        try {
          console.log('Trying embedded products endpoint');
          const embResponse = await fetch(`/api/categories/${category}/embedded-products`);
          const embData = await embResponse.json();
          
          if (embResponse.ok && embData.success && Array.isArray(embData.products)) {
            productsData = embData.products;
            console.log(`Found ${productsData.length} products from embedded endpoint`);
          } else {
            console.warn('Embedded endpoint error:', embData.message);
          }
        } catch (embError) {
          console.error('Embedded API call failed:', embError);
        }
      }
      
      // If all API calls failed, check for window.embeddedProductData
      if (!productsData && window.embeddedProductData && window.embeddedCategoryData) {
        console.log('Using window.embeddedProductData');
        const categoryData = window.embeddedCategoryData;
        const embeddedProducts = window.embeddedProductData;
        
        // Find the category ID
        const categoryObj = categoryData.find(cat => cat.slug === category);
        const categoryId = categoryObj ? categoryObj._id : null;
        
        if (categoryId) {
          // Find subcategories
          const subcategoryIds = categoryData
            .filter(cat => cat.parent === categoryId)
            .map(cat => cat._id);
          
          // Filter products
          productsData = embeddedProducts.filter(product => 
            product.category === categoryId || 
            subcategoryIds.includes(product.subCategory)
          );
          
          console.log(`Found ${productsData.length} products from window.embeddedProductData`);
        }
      }
      
      // If we still don't have products, show empty state
      if (!productsData || productsData.length === 0) {
        console.log('No products found for this category');
        productsContainer.innerHTML = `
          <div class="no-products">
            <h3>No products found</h3>
            <p>We couldn't find any products in this category. Please try another category or check back later.</p>
            ${errorMessage ? `<p class="error-details">Error: ${errorMessage}</p>` : ''}
          </div>
        `;
        if (resultCount) {
          resultCount.textContent = 'Showing 0 of 0 products';
        }
        return;
      }
      
      // We have products, continue with normal flow
      allProducts = productsData;
      filteredProducts = [...allProducts];
      
      // Store for debugging
      window.techstore.products.all = allProducts;
      window.techstore.products.filtered = filteredProducts;
      
      // Try to load categories (for filter functionality)
      try {
        const catResponse = await fetch('/api/categories');
        const catData = await catResponse.json();
        if (catData.success && Array.isArray(catData.categories)) {
          categoryData = catData.categories;
        }
      } catch (catError) {
        console.warn('Failed to load categories for filtering:', catError);
      }
      
      // Render the products
      renderProducts(filteredProducts, productsContainer);
      
      // Update product count
      updateProductCount(filteredProducts.length, allProducts.length);
      
      // Set up filter event listeners
      setupFilterEventListeners();
    } catch (error) {
      console.error(`Error loading ${category} products:`, error);
      productsContainer.innerHTML = `
        <div class="api-error">
          <h3>Unable to load products</h3>
          <p>We're having trouble connecting to our product database. Please try again later.</p>
          <p>Error details: ${error.message}</p>
        </div>
      `;
    }
  }

  /**
   * Render products in the specified container
   */
  function renderProducts(products, container) {
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    if (!products || products.length === 0) {
      container.innerHTML = '<div class="no-products">No products found matching your criteria. Try adjusting your filters.</div>';
      return;
    }
    
    // Create product cards
    const productCards = products.map(product => {
      // Calculate discount and original price HTML
      let discountHTML = '';
      let originalPriceHTML = '';
      
      if (product.isOnSale && product.discount > 0) {
        discountHTML = `<span class="product-discount">-${Math.round(product.discount)}%</span>`;
      }
      
      if (product.compareAtPrice && product.compareAtPrice > product.price) {
        originalPriceHTML = `<span class="product-original-price">$${product.compareAtPrice.toFixed(2)}</span>`;
      }
      
      // Create rating stars
      const fullStars = Math.floor(product.rating || 0);
      const hasHalfStar = (product.rating || 0) % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
      
      let starsHTML = '';
      for (let i = 0; i < fullStars; i++) {
        starsHTML += '★';
      }
      if (hasHalfStar) {
        starsHTML += '☆';
      }
      for (let i = 0; i < emptyStars; i++) {
        starsHTML += '☆';
      }
      
      // Product thumbnail - fix for image path if needed
      let thumbnailUrl = product.thumbnailUrl || 'images/placeholder.jpg';
      
      // If thumbnailUrl contains "frontend" in an odd way, fix it
      thumbnailUrl = thumbnailUrl.replace('frontendimages', 'images/');
      
      // Create the product card
      return `
        <div class="product-card" data-product-id="${product._id}">
          <div class="product-img">
            <img src="${thumbnailUrl}" alt="${product.name}">
          </div>
          <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-specs">${product.specs || ''}</div>
            <div class="product-rating">
              <div class="stars">${starsHTML}</div>
              <div class="rating-count">(${product.reviewCount || 0})</div>
            </div>
            <div class="product-price">
              $${product.price.toFixed(2)} ${originalPriceHTML}
              ${discountHTML}
            </div>
            <button class="add-to-cart" data-product-id="${product._id}">Add to Cart</button>
            <button class="compare-btn" data-product-id="${product._id}">Add to Compare</button>
          </div>
        </div>
      `;
    }).join('');
    
    // Add product cards to container
    container.innerHTML = productCards;
    
    // Initialize add to cart buttons
    initializeAddToCartButtons();
  }
  
  /**
   * Update the product count display
   */
  function updateProductCount(count, total) {
    if (resultCount) {
      total = total || count;
      resultCount.textContent = `Showing ${count} of ${total} products`;
    }
  }
  
  /**
   * Set up event listeners for filters and sorting
   */
  function setupFilterEventListeners() {
    // Filter button click
    if (filterBtn) {
      filterBtn.addEventListener('click', applyFilters);
    }
    
    // Clear filters button click
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Sort select change
    if (sortSelect) {
      sortSelect.addEventListener('change', function() {
        // Sort products
        filteredProducts = sortProducts(filteredProducts, this.value);
        
        // Re-render products
        renderProducts(filteredProducts, productsContainer);
      });
    }
    
    // Price range input change
    if (priceRange && maxPriceInput) {
      priceRange.addEventListener('input', function() {
        maxPriceInput.value = this.value;
      });
    }
    
    // Max price input change
    if (maxPriceInput && priceRange) {
      maxPriceInput.addEventListener('input', function() {
        priceRange.value = this.value;
      });
    }
    
    // View switching functionality
    if (viewButtons && viewButtons.length > 0) {
      viewButtons.forEach(button => {
        button.addEventListener('click', function() {
          // Remove active class from all buttons
          viewButtons.forEach(btn => btn.classList.remove('active'));
          
          // Add active class to clicked button
          this.classList.add('active');
          
          // Get the view type (grid or list)
          const viewType = this.getAttribute('data-view');
          
          // Toggle views (would need additional code for list view implementation)
          if (viewType === 'grid') {
            productsContainer.style.display = 'grid';
          } else {
            // This would switch to list view in a complete implementation
            alert('List view is under development');
          }
        });
      });
    }
  }
  
  /**
   * Apply filters to products based on user selections
   */
  function applyFilters() {
    let filtered = [...allProducts];
    
    // Price filter
    const minPrice = parseFloat(minPriceInput?.value || 0);
    const maxPrice = parseFloat(maxPriceInput?.value || 5000);
    
    filtered = filtered.filter(product => 
      product.price >= minPrice && product.price <= maxPrice
    );
    
    // Process each filter group
    filterGroups.forEach(group => {
      const groupTitle = group.querySelector('h3')?.textContent.toLowerCase();
      const checkedInputs = Array.from(group.querySelectorAll('input[type="checkbox"]:checked'));
      
      // Skip if no inputs checked or "All X" is the only one checked
      if (checkedInputs.length === 0 || 
          (checkedInputs.length === 1 && checkedInputs[0].parentElement.textContent.includes('All'))) {
        return;
      }
      
      // Get checked values
      const checkedValues = checkedInputs.map(input => 
        input.parentElement.textContent.trim().toLowerCase()
      );
      
      // Apply different filters based on the group title
      switch (groupTitle) {
        case 'categories':
        case 'pc types':
        case 'component type':
        case 'monitor type':
          // Filter by subcategory
          filtered = filterBySubcategory(filtered, checkedValues, categorySlug);
          break;
          
        case 'brand':
          // Filter by brand
          filtered = filtered.filter(product => 
            checkedValues.some(brand => 
              (product.brand?.toLowerCase().includes(brand.toLowerCase())) ||
              (product.name?.toLowerCase().includes(brand.toLowerCase()))
            )
          );
          break;
          
        case 'processor':
          // Filter by processor
          filtered = filtered.filter(product => 
            checkedValues.some(processor => 
              (product.specs?.toLowerCase().includes(processor.toLowerCase()))
            )
          );
          break;
          
        case 'graphics':
        case 'graphics card':
          // Filter by graphics card
          filtered = filtered.filter(product => 
            checkedValues.some(gpu => 
              (product.specs?.toLowerCase().includes(gpu.toLowerCase()))
            )
          );
          break;
          
        case 'ram':
          // Filter by RAM size
          filtered = filtered.filter(product => 
            checkedValues.some(ram => {
              const ramValue = ram.replace(/gb|\+/gi, '').trim();
              return (product.specs?.toLowerCase().includes(ramValue + 'gb'));
            })
          );
          break;
          
        case 'storage':
          // Filter by storage
          filtered = filtered.filter(product => 
            checkedValues.some(storage => {
              const storageValue = storage.replace(/gb|tb|\+/gi, '').trim();
              return (product.specs?.toLowerCase().includes(storageValue + 'gb') || 
                      product.specs?.toLowerCase().includes(storageValue + 'tb'));
            })
          );
          break;
          
        case 'screen size':
          // Filter by screen size
          filtered = filtered.filter(product => 
            checkedValues.some(size => {
              if (size.includes('and below')) {
                const maxSize = parseInt(size);
                return product.specs?.toLowerCase().includes('"') && 
                       parseInt(product.specs.split('"')[0].trim()) <= maxSize;
              } else if (size.includes('and above')) {
                const minSize = parseInt(size);
                return product.specs?.toLowerCase().includes('"') && 
                       parseInt(product.specs.split('"')[0].trim()) >= minSize;
              } else if (size.includes('-')) {
                const [min, max] = size.split('-').map(s => parseInt(s));
                const screenSize = parseInt(product.specs?.split('"')[0].trim());
                return product.specs?.toLowerCase().includes('"') && 
                       screenSize >= min && screenSize <= max;
              }
              return false;
            })
          );
          break;
          
        case 'resolution':
          // Filter by resolution
          filtered = filtered.filter(product => 
            checkedValues.some(resolution => {
              if (resolution.includes('full hd')) {
                return product.specs?.toLowerCase().includes('1920x1080') || 
                       product.specs?.toLowerCase().includes('full hd');
              } else if (resolution.includes('qhd')) {
                return product.specs?.toLowerCase().includes('2560x1440') || 
                       product.specs?.toLowerCase().includes('qhd');
              } else if (resolution.includes('4k')) {
                return product.specs?.toLowerCase().includes('3840x2160') || 
                       product.specs?.toLowerCase().includes('4k');
              } else if (resolution.includes('5k')) {
                return product.specs?.toLowerCase().includes('5120x2880') || 
                       product.specs?.toLowerCase().includes('5k');
              } else if (resolution.includes('ultrawide')) {
                return product.specs?.toLowerCase().includes('ultrawide') || 
                       product.specs?.toLowerCase().includes('21:9') || 
                       product.specs?.toLowerCase().includes('32:9');
              }
              return false;
            })
          );
          break;
          
        case 'refresh rate':
          // Filter by refresh rate
          filtered = filtered.filter(product => 
            checkedValues.some(rate => {
              const rateValue = parseInt(rate);
              if (rate.includes('+')) {
                return product.specs?.toLowerCase().includes('hz') && 
                       parseInt(product.specs.match(/\d+hz/i)[0]) >= rateValue;
              } else {
                return product.specs?.toLowerCase().includes(`${rateValue}hz`);
              }
            })
          );
          break;
      }
    });
    
    // Apply sorting
    if (sortSelect) {
      filtered = sortProducts(filtered, sortSelect.value);
    }
    
    // Update filtered products and render
    filteredProducts = filtered;
    renderProducts(filteredProducts, productsContainer);
    
    // Update product count
    updateProductCount(filteredProducts.length, allProducts.length);
  }
  
  /**
   * Filter products by subcategory
   */
  function filterBySubcategory(products, subcategoryNames, parentCategorySlug) {
    // Map friendly names to actual subcategory slugs
    const subcategoryMapping = {
      // Gaming PCs subcategories
      'high-end gaming pcs': 'high-end-gaming-pcs',
      'mid-range gaming pcs': 'mid-range-gaming-pcs',
      'entry-level gaming pcs': 'entry-level-gaming-pcs',
      'custom build pcs': 'custom-build-pcs',
      
      // Laptop subcategories
      'gaming laptops': 'gaming-laptops',
      'business laptops': 'business-laptops',
      'ultrabooks': 'ultrabooks',
      '2-in-1 laptops': '2-in-1-laptops',
      'chromebooks': 'chromebooks',
      
      // Components subcategories
      'graphics cards': 'graphics-cards',
      'processors': 'processors',
      'motherboards': 'motherboards',
      'memory (ram)': 'memory-ram',
      'storage': 'storage',
      
      // Monitor subcategories
      'gaming monitors': 'gaming-monitors',
      'ultrawide monitors': 'ultrawide-monitors',
      '4k monitors': '4k-monitors',
      'professional monitors': 'professional-monitors',
      'curved monitors': 'curved-monitors'
    };
    
    // Find the actual subcategory IDs from the category data
    const subcategorySlugs = subcategoryNames.map(name => subcategoryMapping[name] || name);
    const subcategoryIds = categoryData
      .filter(cat => subcategorySlugs.includes(cat.slug) && cat.parent)
      .map(cat => cat._id);
    
    // If no subcategory IDs found, try filtering by keywords
    if (subcategoryIds.length === 0) {
      return products.filter(product => {
        return subcategoryNames.some(subcatName => {
          // Extract keywords from the subcategory name
          const keywords = subcatName.split(' ');
          // Check if product name or description contains these keywords
          return keywords.some(keyword => 
            product.name?.toLowerCase().includes(keyword) || 
            product.description?.toLowerCase().includes(keyword) || 
            product.tags?.some(tag => tag.toLowerCase().includes(keyword))
          );
        });
      });
    }
    
    // Filter products that belong to the selected subcategories
    return products.filter(product => 
      subcategoryIds.includes(product.subCategory)
    );
  }
  
  /**
   * Clear all filters and reset to default view
   */
  function clearFilters() {
    // Reset checkboxes - check "All" for each category, uncheck others
    filterGroups.forEach(group => {
      const checkboxes = group.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((checkbox, index) => {
        checkbox.checked = (index === 0 && checkbox.parentElement.textContent.includes('All')); 
      });
    });
    
    // Reset price range
    if (minPriceInput) minPriceInput.value = '0';
    if (maxPriceInput) {
      const maxValue = maxPriceInput.getAttribute('max') || '5000';
      maxPriceInput.value = maxValue;
      if (priceRange) priceRange.value = maxValue;
    }
    
    // Reset sort to default
    if (sortSelect) sortSelect.value = 'featured';
    
    // Reset filtered products
    filteredProducts = [...allProducts];
    
    // Render all products
    renderProducts(filteredProducts, productsContainer);
    
    // Update count
    updateProductCount(filteredProducts.length, allProducts.length);
  }
  
  /**
   * Sort products based on the selected option
   */
  function sortProducts(products, sortBy) {
    const sorted = [...products];
    
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'featured':
      default:
        // Sort by featured first, then by rating
        sorted.sort((a, b) => {
          if ((a.isFeatured || false) !== (b.isFeatured || false)) {
            return (b.isFeatured || false) ? 1 : -1;
          }
          return (b.rating || 0) - (a.rating || 0);
        });
    }
    
    return sorted;
  }
  
}
// Make showNotification available globally
window.showNotification = showNotification;

