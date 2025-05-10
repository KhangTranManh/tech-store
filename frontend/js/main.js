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
 * Update cart (simulation)
 */
function updateCart(productId, productName) {
    // In a real implementation, this would make an API call to update the cart
    console.log('Added to cart:', productName, 'ID:', productId);
    
    // Update cart count (simulated)
    const cartCount = document.querySelector('.user-actions a:last-child');
    if (cartCount) {
        const currentCount = parseInt(cartCount.textContent.match(/\d+/) || 0);
        cartCount.textContent = cartCount.textContent.replace(/\(\d+\)/, `(${currentCount + 1})`);
    }
}

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

// featuredProductsComponent.js
async function loadFeaturedProducts() {
    try {
      const response = await fetch('/api/products?isFeatured=true&limit=4');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to load featured products');
      }
      
      const productsContainer = document.querySelector('.featured-products .product-grid');
      
      if (!productsContainer) {
        return;
      }
      
      productsContainer.innerHTML = data.products.map(product => {
        const discountPercentage = Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
        
        return `
          <div class="product-card">
            <a href="/product/${product.slug}">
              <div class="product-img">
                <img src="${product.thumbnailUrl || '/images/placeholder.jpg'}" alt="${product.name}">
              </div>
              <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">
                  $${product.price.toFixed(2)} 
                  ${product.compareAtPrice > product.price ? 
                    `<span class="product-original-price">$${product.compareAtPrice.toFixed(2)}</span>
                    <span class="product-discount">-${discountPercentage}%</span>` : 
                    ''}
                </div>
              </div>
            </a>
            <button class="add-to-cart" data-product-id="${product._id}">Add to Cart</button>
          </div>
        `;
      }).join('');
      
      // Initialize add to cart buttons
      initializeAddToCartButtons();
      
    } catch (error) {
      console.error('Error loading featured products:', error);
    }
  }

/**
 * Initialize Add to Cart buttons
 */
function initializeAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productId = this.getAttribute('data-product-id');
            const productTitle = this.closest('.product-card').querySelector('.product-title').textContent;
            
            // Call the updateCart function (assuming it exists in your main.js)
            if (window.updateCart) {
                window.updateCart(productId, productTitle);
            }
            
            // Show notification (assuming it exists in your main.js)
            if (window.showNotification) {
                window.showNotification(productTitle + ' added to cart!');
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
// Make showNotification available globally
window.showNotification = showNotification;