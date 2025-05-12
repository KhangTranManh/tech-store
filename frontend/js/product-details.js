// ProductDetail.js - Loads product details dynamically while maintaining your existing format

document.addEventListener('DOMContentLoaded', function() {
    // Initialize product detail page
    initializeProductDetail();
  });
  
  function initializeProductDetail() {
    // Check if we're on a product detail page
    const productContainer = document.querySelector('.product-detail');
    if (!productContainer) return;
    
    // Extract product ID or slug from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const productSlug = urlParams.get('slug');
    
    // If we have an ID or slug, fetch the product
    if (productId || productSlug) {
      loadProductDetails(productId, productSlug);
    } else {
      console.warn('No product identifier found in URL');
    }
    
    // Initialize UI components
    initializeImageGallery();
    initializeProductTabs();
    initializeQuantitySelector();
    initializeAddToCartButton();
    initializeWishlistButton();
  }
  
  async function loadProductDetails(productId, productSlug) {
    try {
      // Show loading state if needed
      
      // Build the API URL for your endpoint structure
      let url;
      if (productId) {
        url = `/products/${productId}`;
      } else if (productSlug) {
        url = `/products/${productSlug}`;
      } else {
        throw new Error('No product identifier provided');
      }
      
      // Fetch product data
      let productData;
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product data: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.product) {
          throw new Error('Product data not available');
        }
        
        productData = data.product;
        
        // Load related products if they're in the response
        if (data.relatedProducts) {
          updateRelatedProducts(data.relatedProducts);
        } else {
          // Fetch related products using your endpoint
          fetchRelatedProducts(productData._id);
        }
        
      } catch (apiError) {
        console.warn('API fetch failed, using fallback data:', apiError);
        // Use fallback data
        productData = getFallbackProductData(productId, productSlug);
      }
      
      // Update the page with product details
      if (productData) {
        updateProductDetails(productData);
        updateBreadcrumbs(productData);
        updateDocumentTitle(productData);
      }
      
    } catch (error) {
      console.error('Error loading product details:', error);
    }
  }
  
  
  
  /**
   * Update product details on the page
   */
  function updateProductDetails(product) {
    // Skip if no product data provided
    if (!product) return;
    
    // Update product title
    const titleElement = document.querySelector('.product-title');
    if (titleElement) {
      titleElement.textContent = product.name;
    }
    
    // Update product images
    updateProductImages(product);
    
    // Update product rating and reviews
    const starsElement = document.querySelector('.stars');
    const reviewsCountElement = document.querySelector('.reviews-count');
    
    if (starsElement && product.rating) {
      starsElement.innerHTML = renderStars(product.rating);
    }
    
    if (reviewsCountElement && product.rating) {
      reviewsCountElement.textContent = `${product.rating}/5 (${product.reviewCount || 0} Reviews)`;
    }
    
    // Update pricing information
    const pricingElement = document.querySelector('.product-pricing');
    if (pricingElement) {
      let pricingHtml = `<span class="current-price">$${product.price}</span>`;
      
      if (product.compareAtPrice && product.compareAtPrice > product.price) {
        pricingHtml += `<span class="original-price">$${product.compareAtPrice}</span>`;
        
        if (product.discount) {
          pricingHtml += `<span class="discount-badge">-${product.discount}%</span>`;
        } else {
          // Calculate discount percentage if not provided
          const discountPercent = Math.round((1 - product.price / product.compareAtPrice) * 100);
          pricingHtml += `<span class="discount-badge">-${discountPercent}%</span>`;
        }
      }
      
      pricingElement.innerHTML = pricingHtml;
    }
    
    // Update availability status
    const availabilityElement = document.querySelector('.product-availability');
    if (availabilityElement && typeof product.stock !== 'undefined') {
      if (product.stock > 0) {
        availabilityElement.textContent = `In Stock (${product.stock} units)`;
        availabilityElement.style.color = '#4CAF50';
      } else {
        availabilityElement.textContent = 'Out of Stock';
        availabilityElement.style.color = '#f44336';
      }
    }
    
    // Update product description
    const descriptionElement = document.querySelector('.product-description');
    if (descriptionElement && product.description) {
      descriptionElement.innerHTML = `<p>${product.description}</p>`;
    }
    
    // Update specifications list
    const specListElement = document.querySelector('.spec-list');
    if (specListElement && product.specs) {
      let specsHtml = '';
      
      // If specs is an array of objects
      if (Array.isArray(product.specs)) {
        product.specs.forEach(spec => {
          specsHtml += `<li><span>${spec.name}:</span> ${spec.value}</li>`;
        });
      } 
      // If specs is an object with properties
      else if (product.detailedSpecs) {
        const specs = product.detailedSpecs;
        if (specs.processor) specsHtml += `<li><span>Processor:</span> ${specs.processor.details[0]}</li>`;
        if (specs.graphics) specsHtml += `<li><span>Graphics:</span> ${specs.graphics.details[0]}</li>`;
        if (specs.memory) specsHtml += `<li><span>Memory:</span> ${specs.memory.details[0]}</li>`;
        if (specs.storage) specsHtml += `<li><span>Storage:</span> ${specs.storage.details[0]}</li>`;
        if (specs.display) specsHtml += `<li><span>Display:</span> ${specs.display.details[0]}</li>`;
        if (specs.operatingSystem) specsHtml += `<li><span>Operating System:</span> ${specs.operatingSystem.details[0]}</li>`;
      }
      
      specListElement.innerHTML = specsHtml;
    }
    
    // Update product metadata
    const metaElement = document.querySelector('.product-meta');
    if (metaElement) {
      metaElement.innerHTML = `
        <div>Brand: <span>${product.brand || 'N/A'}</span></div>
        <div>Model: <span>${product.modelNumber || 'N/A'}</span></div>
        <div>SKU: <span>${product.sku || 'N/A'}</span></div>
        <div>Category: <span>${product.subCategory?.name || product.category?.name || 'N/A'}</span></div>
        <div>Tags: <span>${Array.isArray(product.tags) ? product.tags.join(', ') : 'N/A'}</span></div>
      `;
    }
    
    // Update add to cart button and wishlist button with product ID
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    const wishlistBtn = document.querySelector('.wishlist-btn');
    
    if (addToCartBtn) {
      addToCartBtn.setAttribute('data-product-id', product._id);
    }
    
    if (wishlistBtn) {
      wishlistBtn.setAttribute('data-product-id', product._id);
    }
    
    // Update tab contents
    updateTabContents(product);
  }
  
  /**
   * Update product images
   */
  function updateProductImages(product) {
    if (!product || !product.thumbnailUrl) return;
    
    // Update main image
    const mainImageElement = document.querySelector('.main-image img');
    if (mainImageElement) {
      mainImageElement.src = product.thumbnailUrl;
      mainImageElement.alt = product.name;
    }
    
    // Update thumbnails
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    if (thumbnailContainer && product.additionalImages && product.additionalImages.length > 0) {
      let thumbnailsHtml = `
        <div class="thumbnail active">
          <img src="${product.thumbnailUrl}" alt="Main view">
        </div>
      `;
      
      // Add additional images as thumbnails
      product.additionalImages.forEach((imgSrc, index) => {
        thumbnailsHtml += `
          <div class="thumbnail">
            <img src="${imgSrc}" alt="View ${index + 2}">
          </div>
        `;
      });
      
      thumbnailContainer.innerHTML = thumbnailsHtml;
      
      // Re-initialize image gallery functionality
      initializeImageGallery();
    }
  }
  
  /**
   * Update breadcrumb navigation
   */
  function updateBreadcrumbs(product) {
    if (!product) return;
    
    const breadcrumbElement = document.querySelector('.breadcrumb');
    if (!breadcrumbElement) return;
    
    let breadcrumbHtml = `
      <a href="/">Home</a> &gt; 
    `;
    
    // Add category link if available
    if (product.category && product.category.name) {
      const categorySlug = product.category.slug || product.category.name.toLowerCase().replace(/\s+/g, '-');
      breadcrumbHtml += `<a href="/${categorySlug}.html">${product.category.name}</a> &gt; `;
    }
    
    // Add subcategory link if available
    if (product.subCategory && product.subCategory.name) {
      const subCategorySlug = product.subCategory.slug || product.subCategory.name.toLowerCase().replace(/\s+/g, '-');
      breadcrumbHtml += `<a href="/${subCategorySlug}.html">${product.subCategory.name}</a> &gt; `;
    }
    
    // Add product name
    breadcrumbHtml += product.name;
    
    breadcrumbElement.innerHTML = breadcrumbHtml;
  }
  
  /**
   * Update tab contents (description, specifications, reviews, FAQs)
   */
  function updateTabContents(product) {
    if (!product) return;
    
    // Update description tab
    const descriptionTab = document.getElementById('description');
    if (descriptionTab && product.detailedDescription) {
      descriptionTab.innerHTML = product.detailedDescription;
    }
    
    // Update specifications tab with detailed specs
    const specificationsTab = document.getElementById('specifications');
    if (specificationsTab && product.detailedSpecs) {
      let specsHtml = '<h3>Technical Specifications</h3>';
      
      // Generate HTML for each specification section
      Object.entries(product.detailedSpecs).forEach(([key, section]) => {
        if (section && section.details && section.details.length > 0) {
          specsHtml += `
            <div style="margin-bottom: 20px;">
              <h4>${section.title || key.charAt(0).toUpperCase() + key.slice(1)}</h4>
              <ul>
                ${section.details.map(detail => `<li>${detail}</li>`).join('')}
              </ul>
            </div>
          `;
        }
      });
      
      specificationsTab.innerHTML = specsHtml;
    }
    
    // Update reviews tab title with count
    const reviewsTab = document.querySelector('.tab-btn:nth-child(3)');
    if (reviewsTab && product.reviewCount) {
      reviewsTab.textContent = `Reviews (${product.reviewCount})`;
    }
    
    // Update FAQs tab content
    const faqsTab = document.getElementById('faqs');
    if (faqsTab && product.faqs && product.faqs.length > 0) {
      let faqsHtml = '<h3>Frequently Asked Questions</h3>';
      
      product.faqs.forEach(faq => {
        faqsHtml += `
          <div style="margin-bottom: 20px;">
            <h4>Q: ${faq.question}</h4>
            <p>A: ${faq.answer}</p>
          </div>
        `;
      });
      
      faqsTab.innerHTML = faqsHtml;
    }
  }
  
  /**
   * Update document title with product name
   */
  function updateDocumentTitle(product) {
    if (product && product.name) {
      document.title = `${product.name} - TechStore`;
    }
  }
  
  /**
   * Update related products section
   */
  function updateRelatedProducts(relatedProducts) {
    if (!relatedProducts || !relatedProducts.length) return;
    
    const relatedGrid = document.querySelector('.related-grid');
    if (!relatedGrid) return;
    
    let relatedHtml = '';
    
    relatedProducts.forEach(product => {
      const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
      const discountPercent = product.discount || (hasDiscount ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0);
      
      relatedHtml += `
        <div class="product-card" data-product-id="${product._id}" ${product.slug ? `data-product-slug="${product.slug}"` : ''}>
          <div class="product-img">
            <img src="${product.thumbnailUrl || 'images/product-placeholder.jpg'}" alt="${product.name}">
          </div>
          <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-price">
              $${product.price} 
              ${hasDiscount ? `
                <span class="product-original-price">$${product.compareAtPrice}</span>
                <span class="product-discount">-${discountPercent}%</span>
              ` : ''}
            </div>
            <button class="add-to-cart" data-product-id="${product._id}">Add to Cart</button>
          </div>
        </div>
      `;
    });
    
    relatedGrid.innerHTML = relatedHtml;
    
    // Make related product cards clickable
    makeRelatedProductsClickable();
  }
  
  /**
   * Fetch related products from API
   */
  async function fetchRelatedProducts(productId) {
    if (!productId) return;
    
    try {
      const response = await fetch(`/api/products/${productId}/related?limit=4`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch related products: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.products && data.products.length > 0) {
        updateRelatedProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
      // Fallback would be to keep the existing related products
    }
  }
  
  /**
   * Make related product cards clickable
   */
  function makeRelatedProductsClickable() {
    const productCards = document.querySelectorAll('.related-grid .product-card');
    
    productCards.forEach(card => {
      card.addEventListener('click', function(e) {
        // Prevent navigation if clicking on a button
        if (e.target.tagName === 'BUTTON') return;
        
        const productId = this.getAttribute('data-product-id');
        const productSlug = this.getAttribute('data-product-slug');
        
        // Navigate to product detail page
        if (productSlug) {
          window.location.href = `/product/${productSlug}`;
        } else if (productId) {
          window.location.href = `/product-detail.html?id=${productId}`;
        }
      });
    });
    
    // Initialize add to cart buttons on related products
    const addToCartButtons = document.querySelectorAll('.related-grid .add-to-cart');
    
    addToCartButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent card click
        
        const productId = this.getAttribute('data-product-id');
        const productName = this.closest('.product-card').querySelector('.product-title').textContent;
        
        // Call addToCart function if available
        if (typeof window.updateCart === 'function') {
          window.updateCart(productId, productName, 1);
        } else {
          // Fallback if cart functions not available
          console.log(`Added to cart: ${productName}`);
          alert(`${productName} added to cart!`);
        }
      });
    });
  }
  
  /**
   * Initialize image gallery functionality
   */
  function initializeImageGallery() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.querySelector('.main-image img');
    
    if (!thumbnails.length || !mainImage) return;
    
    thumbnails.forEach(thumbnail => {
      thumbnail.addEventListener('click', function() {
        // Update main image with the thumbnail image
        const thumbnailImg = this.querySelector('img');
        if (thumbnailImg) {
          mainImage.src = thumbnailImg.src;
          mainImage.alt = thumbnailImg.alt;
        }
        
        // Update active state
        thumbnails.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }
  
  /**
   * Initialize product tabs functionality
   */
  function initializeProductTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    if (!tabButtons.length || !tabPanes.length) return;
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons and panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Determine which pane to show based on button text
        let tabId;
        if (this.textContent.toLowerCase().includes('description')) {
          tabId = 'description';
        } else if (this.textContent.toLowerCase().includes('specification')) {
          tabId = 'specifications';
        } else if (this.textContent.toLowerCase().includes('review')) {
          tabId = 'reviews';
        } else if (this.textContent.toLowerCase().includes('faq')) {
          tabId = 'faqs';
        }
        
        // Show the corresponding tab pane
        if (tabId) {
          const pane = document.getElementById(tabId);
          if (pane) {
            pane.classList.add('active');
          }
        }
      });
    });
  }
  
  /**
   * Initialize quantity selector
   */
  function initializeQuantitySelector() {
    const quantityInput = document.querySelector('.quantity-input');
    const quantityButtons = document.querySelectorAll('.quantity-btn');
    
    if (!quantityInput || !quantityButtons.length) return;
    
    // Handle quantity decrease/increase buttons
    quantityButtons.forEach(button => {
      button.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value) || 1;
        
        if (this.textContent === '-') {
          // Decrease quantity (minimum 1)
          quantityInput.value = Math.max(1, currentValue - 1);
        } else {
          // Increase quantity (could add a maximum check against stock)
          quantityInput.value = currentValue + 1;
        }
      });
    });
    
    // Validate manually entered values
    quantityInput.addEventListener('change', function() {
      let value = parseInt(this.value) || 1;
      // Ensure minimum quantity of 1
      if (value < 1) value = 1;
      this.value = value;
    });
  }
  

function initializeAddToCartButton() {
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    
    if (!addToCartBtn) return;
    
    addToCartBtn.addEventListener('click', function() {
      const productId = this.getAttribute('data-product-id');
      const productName = document.querySelector('.product-title').textContent;
      const quantity = parseInt(document.querySelector('.quantity-input').value) || 1;
      
      // Use the cart functions if available
      if (typeof window.updateCart === 'function') {
        window.updateCart(productId, productName, quantity);
      } else {
        console.log(`Added to cart: ${productName} (${quantity})`);
        alert(`${productName} (${quantity}) added to cart!`);
      }
    });
}
/**
 * Initialize Wishlist button
 */
function initializeWishlistButton() {
    const wishlistBtn = document.querySelector('.wishlist-btn');
    
    if (!wishlistBtn) return;
    
    wishlistBtn.addEventListener('click', function() {
      // Skip if already in wishlist
      if (this.classList.contains('in-wishlist')) {
        return;
      }
      
      const productId = this.getAttribute('data-product-id');
      const productName = document.querySelector('.product-title').textContent;
      const productPrice = document.querySelector('.current-price').textContent;
      const productImage = document.querySelector('.main-image img').src;
      
      // Use wishlist functions if available
      if (typeof window.addToWishlist === 'function') {
        window.addToWishlist(productId, productName, productPrice, productImage, this);
      } else {
        // Simple fallback
        console.log(`Added to wishlist: ${productName}`);
        alert(`${productName} added to wishlist!`);
        
        // Update button state
        this.textContent = 'In Wishlist';
        this.classList.add('in-wishlist');
      }
    });
    
    // Check if product is already in wishlist
    const productId = wishlistBtn.getAttribute('data-product-id');
    if (productId && window.authUtils && typeof window.authUtils.isUserLoggedIn === 'function' && window.authUtils.isUserLoggedIn()) {
      fetch(`/api/wishlist/check/${productId}`, {
        credentials: 'include'
      })
      .then(response => response.json())
      .then(data => {
        if (data.inWishlist) {
          wishlistBtn.textContent = 'In Wishlist';
          wishlistBtn.classList.add('in-wishlist');
        }
      })
      .catch(error => {
        console.error('Error checking wishlist status:', error);
      });
    }
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
  // Add this function to your ProductDetail.js file or wherever your product page logic lives
function checkWishlistStatus(productId) {
  // Skip if not logged in or no product ID
  if (!window.authUtils || !window.authUtils.isUserLoggedIn() || !productId) {
    return Promise.resolve(false);
  }
  
  // Make API call to check wishlist status
  return fetch(`/api/wishlist/check/${productId}`, {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    return data.inWishlist || false;
  })
  .catch(error => {
    console.error('Error checking wishlist status:', error);
    return false;
  });
}



    