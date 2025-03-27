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

// Make showNotification available globally
window.showNotification = showNotification;