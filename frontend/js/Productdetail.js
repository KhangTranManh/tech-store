/**
 * Product Detail Page JavaScript
 * Handles fetching and displaying product details from database
 * Includes fallback data for development/demo purposes
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize product detail page components
  loadProductDetails();
  initializeThumbnails();
  initializeTabFunctionality();
  initializeQuantitySelector();
  initializeActionButtons();
});

/**
 * Load product details from API based on URL parameter
 */
async function loadProductDetails() {
  try {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
      console.warn('No product ID found in URL, using default display');
      return;
    }
    
    // Show loading state
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="spinner"></div><p>Loading product details...</p>';
    loadingIndicator.style.cssText = 'text-align: center; padding: 20px; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(255,255,255,0.9); border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000;';
    
    document.body.appendChild(loadingIndicator);
    
    // Try to fetch product data from API
    let product = null;
    
    try {
      const response = await fetch(`/api/products/${productId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.product) {
          product = data.product;
        }
      }
    } catch (apiError) {
      console.warn('API call failed, using fallback data:', apiError);
      // Continue and use fallback data
    }
    
    // If API call failed or returned no data, use fallback data
    if (!product) {
      console.log('Using fallback product data for ID:', productId);
      product = getFallbackProductData(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
    }
    
    // Update page title
    document.title = `${product.name} - TechStore`;
    
    // Update breadcrumb
    updateBreadcrumb(product);
    
    // Update product gallery
    updateProductGallery(product);
    
    // Update product info
    updateProductInfo(product);
    
    // Update product tabs
    updateProductTabs(product);
    
    // Remove loading indicator
    loadingIndicator.remove();
    
  } catch (error) {
    console.error('Error loading product details:', error);
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) loadingIndicator.remove();
    
    // Show error message
    showErrorMessage(error.message || 'Failed to load product details');
  }
}

/**
 * Get fallback product data when API is not available
 * This is used for development and demo purposes
 */
function getFallbackProductData(productId) {
  // Hardcoded product data for demo purposes
  const fallbackProducts = {
    "681e3143bf1727e8bb3a3d71": {
      _id: "681e3143bf1727e8bb3a3d71",
      name: "Acer Predator Helios 300",
      slug: "acer-predator-helios-300",
      description: "The Acer Predator Helios 300 is a powerful gaming laptop featuring a 15.6\" Full HD IPS display, 10th Gen Intel Core i7 processor, NVIDIA GeForce RTX 3060 graphics, 16GB DDR4 RAM, and a fast 512GB NVMe SSD. Perfect for gaming, content creation, and demanding applications.",
      price: 1299.99,
      compareAtPrice: 1499.99,
      discount: 13,
      stock: 15,
      thumbnailUrl: "images/acer3000.jpg",
      additionalImages: [
        "images/acer3000.jpg",
        "images/gaminglaptop.jpg",
        "images/acer3000.jpg"
      ],
      rating: 4.7,
      reviewCount: 128,
      brand: "Acer",
      modelNumber: "PH315-53-71HN",
      sku: "ACR10750H3060",
      category: { name: "Laptops", slug: "laptops" },
      subCategory: { name: "Gaming Laptops", slug: "gaming-laptops" },
      specs: "Processor: Intel Core i7-10750H (6-core, 12-thread), Graphics: NVIDIA GeForce RTX 3060 6GB GDDR6, Memory: 16GB DDR4 3200MHz (Upgradable to 32GB), Storage: 512GB NVMe SSD, Display: 15.6\" Full HD IPS, 144Hz, 3ms response time, Operating System: Windows 11 Home",
      detailedDescription: `
        <h4>Powerful Performance</h4>
        <p>Equipped with a 10th Gen Intel Core i7-10750H processor featuring 6 cores and 12 threads, this laptop delivers impressive processing power for gaming and multitasking. The NVIDIA GeForce RTX 3060 graphics card with 6GB GDDR6 memory enables realistic ray-traced graphics and cutting-edge AI features in games.</p>
        
        <h4>Immersive Display</h4>
        <p>Experience smooth, responsive gameplay on the 15.6" Full HD IPS display with a 144Hz refresh rate and 3ms response time. The display features a 72% NTSC color gamut for vibrant, accurate colors whether you're gaming or creating content.</p>
        
        <h4>Advanced Cooling</h4>
        <p>Acer's 4th Gen AeroBlade 3D Fan technology keeps the system cool even during extended gaming sessions. The custom-engineered fan design, strategically placed intake and exhaust vents, and heat pipes ensure optimal thermal performance.</p>
        
        <h4>Customizable RGB Keyboard</h4>
        <p>The 4-zone RGB backlit keyboard allows for customizable lighting effects. The WASD and arrow keys are highlighted for quick identification during intense gaming sessions.</p>
        
        <h4>Fast Storage and Memory</h4>
        <p>With 16GB of DDR4 3200MHz memory and a 512GB PCIe NVMe SSD, this laptop offers fast boot times, quick application launches, and smooth multitasking. The memory can be upgraded to 32GB, and there's room for additional storage drives.</p>
        
        <h4>Connectivity Options</h4>
        <p>Stay connected with a full range of ports including USB 3.2 Type-C, USB 3.2 Type-A, USB 2.0, HDMI 2.0, Mini DisplayPort 1.4, and an RJ-45 Ethernet port. Wireless connectivity includes Killer Wi-Fi 6 AX1650i and Bluetooth 5.1.</p>
      `,
      faqs: [
        {
          question: "Can the RAM be upgraded?",
          answer: "Yes, the laptop has two RAM slots. It comes with 16GB (2x8GB) and can be upgraded to a maximum of 32GB (2x16GB) DDR4 memory."
        },
        {
          question: "Does this laptop have an additional storage bay?",
          answer: "Yes, in addition to the 512GB NVMe SSD, there is an empty 2.5\" drive bay for additional storage expansion."
        },
        {
          question: "What is the battery life like?",
          answer: "Battery life varies depending on usage, but typically lasts up to 6 hours for regular tasks. For gaming, it's recommended to use the power adapter for optimal performance."
        },
        {
          question: "Does this laptop support external displays?",
          answer: "Yes, you can connect external displays using the HDMI 2.0 port or Mini DisplayPort 1.4. The USB Type-C port also supports DisplayPort over USB-C."
        }
      ]
    },
    "681e3143bf1727e8bb3a3d76": {
      _id: "681e3143bf1727e8bb3a3d76",
      name: "NVIDIA GeForce RTX 4080",
      slug: "nvidia-geforce-rtx-4080",
      description: "The NVIDIA GeForce RTX 4080 delivers extreme gaming performance with 16GB of high-speed GDDR6X memory, DLSS 3 with AI frame generation, and advanced ray tracing capabilities.",
      price: 1199.99,
      compareAtPrice: 1299.99,
      discount: 7,
      stock: 8,
      thumbnailUrl: "images/4080gi.jpg",
      additionalImages: [
        "images/4080gi.jpg",
        "images/graphiccard.jpg",
        "images/4080gi.jpg"
      ],
      rating: 4.9,
      reviewCount: 94,
      brand: "NVIDIA",
      modelNumber: "RTX 4080-FE",
      sku: "NV4080-16GB",
      category: { name: "Components", slug: "components" },
      subCategory: { name: "Graphics Cards", slug: "graphics-cards" },
      specs: "16GB GDDR6X, 9728 CUDA Cores, PCIe 4.0, 2.5 Slot Design"
    },
    "681e3143bf1727e8bb3a3d81": {
      _id: "681e3143bf1727e8bb3a3d81",
      name: "LG 27GN950-B UltraGear",
      slug: "lg-27gn950-b-ultragear",
      description: "The LG 27GN950-B UltraGear is a 27\" 4K gaming monitor with 144Hz refresh rate, 1ms response time, and outstanding color performance with VESA DisplayHDR 600 certification and 98% DCI-P3 color gamut.",
      price: 799.99,
      compareAtPrice: 899.99,
      discount: 11,
      stock: 9,
      thumbnailUrl: "images/lg27.jpg",
      additionalImages: [
        "images/lg27.jpg",
        "images/monitor.jpg",
        "images/lg27.jpg"
      ],
      rating: 4.8,
      reviewCount: 92,
      brand: "LG",
      modelNumber: "27GN950-B",
      sku: "LG27GN950B",
      category: { name: "Monitors", slug: "monitors" },
      subCategory: { name: "Gaming Monitors", slug: "gaming-monitors" },
      specs: "27\" Nano IPS, 3840x2160, 144Hz, 1ms, HDR600, DCI-P3 98%"
    },
    "681e3143bf1727e8bb3a3d7c": {
      _id: "681e3143bf1727e8bb3a3d7c",
      name: "TechStore Voyager",
      slug: "techstore-voyager",
      description: "The TechStore Voyager delivers exceptional gaming performance at a reasonable price, featuring the Intel Core i7-13700K processor, NVIDIA RTX 4070 graphics, and 32GB of DDR5 memory in a stylish mid-tower case.",
      price: 2299.99,
      compareAtPrice: 2499.99,
      discount: 8,
      stock: 8,
      thumbnailUrl: "images/voyage.jpg",
      additionalImages: [
        "images/voyage.jpg",
        "images/pcgaming.jpg",
        "images/voyage.jpg"
      ],
      rating: 4.8,
      reviewCount: 64,
      brand: "TechStore",
      modelNumber: "TS-VGR-2023",
      sku: "TSVGR13700K4070",
      category: { name: "Gaming PCs", slug: "gaming-pcs" },
      subCategory: { name: "Mid-Range Gaming PCs", slug: "mid-range-gaming-pcs" },
      specs: "Intel Core i7-13700K, RTX 4070 12GB, 32GB DDR5-5200, 1TB NVMe SSD + 2TB HDD"
    }
  };
  
  // Return the fallback data for the requested product ID
  return fallbackProducts[productId];
}

/**
 * Update breadcrumb navigation
 */
function updateBreadcrumb(product) {
  const breadcrumb = document.querySelector('.breadcrumb');
  if (!breadcrumb) return;
  
  let html = '<a href="/">Home</a> &gt; ';
  
  if (product.category && product.category.name) {
    html += `<a href="/${product.category.slug || '#'}.html">${product.category.name}</a> &gt; `;
  }
  
  if (product.subCategory && product.subCategory.name) {
    html += `<a href="/${product.subCategory.slug || '#'}.html">${product.subCategory.name}</a> &gt; `;
  }
  
  html += product.name;
  
  breadcrumb.innerHTML = html;
}

// Rest of your existing functions remain the same...

/**
 * Update product gallery with main image and thumbnails
 */
function updateProductGallery(product) {
  // Update main image
  const mainImageContainer = document.querySelector('.main-image');
  if (mainImageContainer) {
    const mainImageUrl = product.thumbnailUrl || 'images/product-placeholder.jpg';
    mainImageContainer.innerHTML = `<img src="${mainImageUrl}" alt="${product.name}">`;
  }
  
  // Update thumbnails
  const thumbnailContainer = document.querySelector('.thumbnail-container');
  if (thumbnailContainer && product.additionalImages && product.additionalImages.length > 0) {
    let thumbnailsHTML = '';
    
    // Add main thumbnail
    thumbnailsHTML += `
      <div class="thumbnail active">
        <img src="${product.thumbnailUrl}" alt="${product.name} - Main View">
      </div>
    `;
    
    // Add additional thumbnails
    product.additionalImages.forEach((image, index) => {
      thumbnailsHTML += `
        <div class="thumbnail">
          <img src="${image}" alt="${product.name} - View ${index + 2}">
        </div>
      `;
    });
    
    thumbnailContainer.innerHTML = thumbnailsHTML;
    
    // Re-initialize thumbnails after updating content
    initializeThumbnails();
  }
}

/**
 * Update product information section
 */
function updateProductInfo(product) {
  // Update product title
  const productTitle = document.querySelector('.product-title');
  if (productTitle) productTitle.textContent = product.name;
  
  // Update product rating stars
  const starsElement = document.querySelector('.stars');
  if (starsElement) {
    const rating = product.rating || 0;
    const fullStars = Math.floor(rating);
    const halfStar = (rating % 1) >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) starsHTML += '★';
    if (halfStar) starsHTML += '★';
    for (let i = 0; i < emptyStars; i++) starsHTML += '☆';
    
    starsElement.textContent = starsHTML;
  }
  
  // Update review count
  const reviewsCount = document.querySelector('.reviews-count');
  if (reviewsCount) {
    reviewsCount.textContent = `${(product.rating || 0).toFixed(1)}/5 (${product.reviewCount || 0} Reviews)`;
  }
  
  // Update pricing
  const currentPrice = document.querySelector('.current-price');
  if (currentPrice) currentPrice.textContent = `$${product.price.toFixed(2)}`;
  
  const originalPrice = document.querySelector('.original-price');
  if (originalPrice && product.compareAtPrice) {
    originalPrice.textContent = `$${product.compareAtPrice.toFixed(2)}`;
  }
  
  const discountBadge = document.querySelector('.discount-badge');
  if (discountBadge && product.discount) {
    discountBadge.textContent = `-${product.discount}%`;
  }
  
  // Update availability
  const availability = document.querySelector('.product-availability');
  if (availability) {
    if (product.stock > 0) {
      availability.textContent = `In Stock (${product.stock} units)`;
      availability.style.color = '#4CAF50';
    } else {
      availability.textContent = 'Out of Stock';
      availability.style.color = '#f44336';
    }
  }
  
  // Update description
  const description = document.querySelector('.product-description p');
  if (description) description.textContent = product.description;
  
  // Update specs list
  const specsList = document.querySelector('.spec-list');
  if (specsList && product.specs) {
    const specs = product.specs.split(',');
    let specsHTML = '';
    
    if (specs.length > 0) {
      specs.forEach(spec => {
        // Check if spec has a key-value format
        const parts = spec.includes(':') ? spec.split(':') : null;
        
        if (parts && parts.length > 1) {
          specsHTML += `<li><span>${parts[0].trim()}:</span> ${parts[1].trim()}</li>`;
        } else {
          specsHTML += `<li>${spec.trim()}</li>`;
        }
      });
    } else if (product.features && product.features.length > 0) {
      // Fall back to features if specs not in expected format
      product.features.forEach(feature => {
        specsHTML += `<li>${feature}</li>`;
      });
    }
    
    specsList.innerHTML = specsHTML;
  }
  
  // Update product meta information
  const brandInfo = document.querySelector('.product-meta div:nth-child(1) span');
  if (brandInfo) brandInfo.textContent = product.brand || 'N/A';
  
  const modelInfo = document.querySelector('.product-meta div:nth-child(2) span');
  if (modelInfo) modelInfo.textContent = product.modelNumber || 'N/A';
  
  const skuInfo = document.querySelector('.product-meta div:nth-child(3) span');
  if (skuInfo) skuInfo.textContent = product.sku || 'N/A';
  
  const categoryInfo = document.querySelector('.product-meta div:nth-child(4) span');
  if (categoryInfo && product.category) {
    categoryInfo.textContent = product.category.name || 'N/A';
  }
  
  // Update action buttons with product ID
  const addToCartBtn = document.querySelector('.add-to-cart-btn');
  if (addToCartBtn) addToCartBtn.setAttribute('data-product-id', product._id);
  
  const wishlistBtn = document.querySelector('.wishlist-btn');
  if (wishlistBtn) wishlistBtn.setAttribute('data-product-id', product._id);
}

/**
 * Update product tabs with detailed information
 */
function updateProductTabs(product) {
  // Description tab
  const descriptionTab = document.getElementById('description');
  if (descriptionTab) {
    let descriptionHTML = '<h3>Product Description</h3>';
    
    if (product.detailedDescription) {
      descriptionHTML += product.detailedDescription;
    } else {
      descriptionHTML += `<p>${product.description}</p>`;
    }
    
    descriptionTab.innerHTML = descriptionHTML;
  }
  
  // Specifications tab
  const specificationsTab = document.getElementById('specifications');
  if (specificationsTab) {
    let specsHTML = '<h3>Technical Specifications</h3>';
    
    if (product.detailedSpecs) {
      // Loop through detailed specifications
      Object.entries(product.detailedSpecs).forEach(([key, spec]) => {
        if (spec && spec.title && spec.details && spec.details.length > 0) {
          specsHTML += `
            <div style="margin-bottom: 20px;">
              <h4>${spec.title}</h4>
              <ul>
                ${spec.details.map(detail => `<li>${detail}</li>`).join('')}
              </ul>
            </div>
          `;
        }
      });
    } else if (product.specs) {
      // Use simple specs if detailed specs not available
      specsHTML += `
        <div style="margin-bottom: 20px;">
          <ul>
            ${product.specs.split(',').map(spec => `<li>${spec.trim()}</li>`).join('')}
          </ul>
        </div>
      `;
    } else if (product.features && product.features.length > 0) {
      // Use features if no specs available
      specsHTML += `
        <div style="margin-bottom: 20px;">
          <ul>
            ${product.features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
      `;
    } else {
      specsHTML += '<p>Specifications not available for this product.</p>';
    }
    
    specificationsTab.innerHTML = specsHTML;
  }
  
  // Reviews tab (placeholder for now)
  const reviewsTab = document.getElementById('reviews');
  if (reviewsTab) {
    reviewsTab.innerHTML = `
      <h3>Customer Reviews</h3>
      <p>Customer reviews will be available soon.</p>
    `;
  }
  
  // FAQs tab
  const faqsTab = document.getElementById('faqs');
  if (faqsTab) {
    let faqsHTML = '<h3>Frequently Asked Questions</h3>';
    
    if (product.faqs && product.faqs.length > 0) {
      product.faqs.forEach(faq => {
        faqsHTML += `
          <div style="margin-bottom: 20px;">
            <h4>Q: ${faq.question}</h4>
            <p>A: ${faq.answer}</p>
          </div>
        `;
      });
    } else {
      faqsHTML += '<p>No FAQs available for this product.</p>';
    }
    
    faqsTab.innerHTML = faqsHTML;
  }
}

/**
 * Update related products section
 */
function updateRelatedProducts(relatedProducts) {
  if (!relatedProducts || relatedProducts.length === 0) return;
  
  const relatedGrid = document.querySelector('.related-grid');
  if (!relatedGrid) return;
  
  let productsHTML = '';
  
  relatedProducts.forEach(product => {
    // Calculate price details
    const regularPrice = product.compareAtPrice || product.price;
    const salePrice = product.price;
    const hasDiscount = regularPrice > salePrice;
    const discountPercent = product.discount || Math.round((1 - salePrice / regularPrice) * 100);
    
    productsHTML += `
      <div class="product-card" data-product-id="${product._id}" data-product-slug="${product.slug}">
        <div class="product-img">
          <img src="${product.thumbnailUrl || 'images/product-placeholder.jpg'}" alt="${product.name}">
        </div>
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <div class="product-price">
            $${salePrice.toFixed(2)} 
            ${hasDiscount ? `
              <span class="product-original-price">$${regularPrice.toFixed(2)}</span>
              <span class="product-discount">-${discountPercent}%</span>
            ` : ''}
          </div>
          <button class="add-to-cart" data-product-id="${product._id}">Add to Cart</button>
        </div>
      </div>
    `;
  });
  
  relatedGrid.innerHTML = productsHTML;
  
  // Add click event to related product cards
  const productCards = relatedGrid.querySelectorAll('.product-card');
  productCards.forEach(card => {
    card.addEventListener('click', function(e) {
      // Don't navigate if clicking on a button
      if (e.target.tagName === 'BUTTON') return;
      
      const productId = this.getAttribute('data-product-id');
      window.location.href = `product-detail.html?id=${productId}`;
    });
  });
  
  // Initialize add to cart buttons for related products
  const addToCartButtons = relatedGrid.querySelectorAll('.add-to-cart');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent triggering the product card click
      
      const productId = this.getAttribute('data-product-id');
      const productName = this.closest('.product-info').querySelector('.product-title').textContent;
      
      // If cart.js is loaded, use its updateCart function
      if (typeof window.updateCart === 'function') {
        window.updateCart(productId, productName, 1);
      } else {
        console.log('Added to cart:', productName);
        alert(`${productName} added to cart!`);
      }
    });
  });
}

/**
 * Initialize thumbnail clicks
 */
function initializeThumbnails() {
  const thumbnails = document.querySelectorAll('.thumbnail');
  const mainImageEl = document.querySelector('.main-image img');
  
  if (!thumbnails.length || !mainImageEl) return;
  
  thumbnails.forEach(thumbnail => {
    thumbnail.addEventListener('click', function() {
      // Remove active class from all thumbnails
      thumbnails.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked thumbnail
      this.classList.add('active');
      
      // Update main image source
      const thumbnailImg = this.querySelector('img');
      if (thumbnailImg) {
        mainImageEl.src = thumbnailImg.src;
        mainImageEl.alt = thumbnailImg.alt;
      }
    });
  });
}

/**
 * Initialize tab functionality
 */
function initializeTabFunctionality() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  if (!tabButtons.length || !tabPanes.length) return;
  
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Show corresponding tab pane
      if (tabPanes[index]) {
        tabPanes[index].classList.add('active');
      }
    });
  });
}

/**
 * Initialize quantity selector
 */
function initializeQuantitySelector() {
  const quantityInput = document.getElementById('quantity');
  const decreaseBtn = document.querySelector('.quantity-control .quantity-btn:first-child');
  const increaseBtn = document.querySelector('.quantity-control .quantity-btn:last-child');
  
  if (!quantityInput || !decreaseBtn || !increaseBtn) return;
  
  // Decrease quantity
  decreaseBtn.addEventListener('click', function() {
    let value = parseInt(quantityInput.value) || 1;
    if (value > 1) {
      quantityInput.value = value - 1;
    }
  });
  
  // Increase quantity
  increaseBtn.addEventListener('click', function() {
    let value = parseInt(quantityInput.value) || 1;
    const max = parseInt(quantityInput.getAttribute('max')) || 99;
    if (value < max) {
      quantityInput.value = value + 1;
    }
  });
  
  // Validate input
  quantityInput.addEventListener('change', function() {
    let value = parseInt(this.value) || 1;
    const min = parseInt(this.getAttribute('min')) || 1;
    const max = parseInt(this.getAttribute('max')) || 99;
    
    if (value < min) value = min;
    if (value > max) value = max;
    
    this.value = value;
  });
}

/**
 * Initialize action buttons (Add to Cart and Wishlist)
 */
function initializeActionButtons() {
  // Add to Cart button
  const addToCartBtn = document.querySelector('.add-to-cart-btn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', function() {
      const productId = this.getAttribute('data-product-id');
      const productName = document.querySelector('.product-title').textContent;
      const quantity = parseInt(document.getElementById('quantity').value) || 1;
      
      // If cart.js is loaded, use its updateCart function
      if (typeof window.updateCart === 'function') {
        window.updateCart(productId, productName, quantity);
      } else {
        console.log('Added to cart:', productName, 'Quantity:', quantity);
        alert(`${quantity} x ${productName} added to cart!`);
      }
    });
  }
  
  // Wishlist button
  const wishlistBtn = document.querySelector('.wishlist-btn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', function() {
      const productId = this.getAttribute('data-product-id');
      const productName = document.querySelector('.product-title').textContent;
      const productPrice = document.querySelector('.current-price').textContent;
      const productImg = document.querySelector('.main-image img').src;
      
      // If addToWishlist function is available, use it
      if (typeof window.addToWishlist === 'function') {
        window.addToWishlist(productId, productName, productPrice, productImg, this);
      } else {
        console.log('Added to wishlist:', productName);
        alert(`${productName} added to wishlist!`);
      }
    });
  }
}

/**
 * Show error message
 */
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = 'background-color: #ffebee; border: 1px solid #ffcdd2; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center;';
  
  errorDiv.innerHTML = `
    <h3 style="color: #d32f2f; margin-top: 0;">Error Loading Product</h3>
    <p>${message}</p>
    <button onclick="window.location.reload()" style="background-color: #ff6b00; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Try Again</button>
  `;
  
  const container = document.querySelector('.product-container');
  if (container) {
    container.prepend(errorDiv);
  }
}