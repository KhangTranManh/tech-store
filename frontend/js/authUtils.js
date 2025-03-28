/**
 * TechStore Authentication Utilities
 * Manages user authentication state and UI
 */

// Initialize auth state when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  updateAuthUI();
});

/**
 * Check if user is logged in (from session storage or cookies)
 * @returns {boolean} Whether user is logged in
 */
function isUserLoggedIn() {
  // First check if we have auth data in sessionStorage
  const authData = sessionStorage.getItem('authUser');
  
  if (authData) {
    return true;
  }
  
  // Check for authentication cookie as fallback
  return document.cookie.split(';').some(cookie => {
    return cookie.trim().startsWith('isLoggedIn=true');
  });
}

/**
 * Get current user data
 * @returns {Object|null} User data object or null if not logged in
 */
function getCurrentUser() {
  // Try to get user data from session storage
  const authData = sessionStorage.getItem('authUser');
  
  if (authData) {
    try {
      return JSON.parse(authData);
    } catch (error) {
      console.error('Error parsing auth data:', error);
    }
  }
  
  return null;
}

/**
 * Check authentication status from server API
 * Updates session storage based on response
 * With error handling for missing endpoints
 */
function checkAuthStatus() {
  // First, check if we already have user data in session
  if (isUserLoggedIn()) {
    updateAuthUI();
    return;
  }
  
  // If no session data, try the API call but catch errors
  fetch('/auth/check', {
    method: 'GET',
    credentials: 'include' // Include cookies
  })
  .then(response => {
    if (!response.ok) {
      // If the API endpoint is not found (404) or has an error,
      // fall back to session-based authentication only
      console.warn('Auth check API not available. Using local authentication only.');
      return { isLoggedIn: false };
    }
    return response.json();
  })
  .then(data => {
    if (data.isLoggedIn) {
      // If we're logged in but don't have user data, make another call to get it
      if (!sessionStorage.getItem('authUser')) {
        fetch('/auth/user', {
          method: 'GET',
          credentials: 'include'
        })
        .then(response => {
          if (!response.ok) {
            console.warn('User API not available. Using limited authentication.');
            return { success: false };
          }
          return response.json();
        })
        .then(userData => {
          if (userData.success) {
            sessionStorage.setItem('authUser', JSON.stringify(userData.user));
          } else {
            // Create minimal user data if API call fails
            const minimalUser = { isLoggedIn: true };
            sessionStorage.setItem('authUser', JSON.stringify(minimalUser));
          }
          updateAuthUI();
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
          updateAuthUI();
        });
      }
    } else {
      // Clear session storage if not logged in
      sessionStorage.removeItem('authUser');
      updateAuthUI();
    }
  })
  .catch(error => {
    console.error('Error checking auth status:', error);
    // Continue with UI update even if API check fails
    updateAuthUI();
  });
}

/**
 * Update UI elements based on authentication state
 */
function updateAuthUI() {
  const userActionsDiv = document.querySelector('.user-actions');
  if (!userActionsDiv) return;
  
  const isLoggedIn = isUserLoggedIn();
  
  if (isLoggedIn) {
    // If logged in, show Account link and hide Login/Register
    const links = userActionsDiv.querySelectorAll('a');
    
    // Look for "Login" and "Register" links to hide them
    links.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim().toLowerCase();
      
      if (href === '/login.html' || text === 'login' || 
          href === '/register.html' || text === 'register') {
        link.style.display = 'none';
      }
    });
    
    // Check if Account link already exists
    const accountLink = Array.from(links).find(link => 
      link.getAttribute('href') === '/account.html' || 
      link.textContent.trim().toLowerCase() === 'account'
    );
    
    if (!accountLink) {
      // Create and add Account link before Cart link
      const accountLink = document.createElement('a');
      accountLink.href = '/account.html';
      accountLink.textContent = 'Account';
      
      // Find the Cart link to insert before it
      const cartLink = Array.from(links).find(link => 
        link.textContent.trim().toLowerCase().includes('cart')
      );
      
      if (cartLink) {
        userActionsDiv.insertBefore(accountLink, cartLink);
      } else {
        // If no cart link, just append to the end
        userActionsDiv.appendChild(accountLink);
      }
    }
  } else {
    // If not logged in, show Login/Register and hide Account
    const links = userActionsDiv.querySelectorAll('a');
    
    // Show Login and Register links
    links.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim().toLowerCase();
      
      if (href === '/login.html' || text === 'login' || 
          href === '/register.html' || text === 'register') {
        link.style.display = '';
      }
      
      // Hide Account link if it exists
      if (href === '/account.html' || text === 'account') {
        link.style.display = 'none';
      }
    });
  }
}

/**
 * Store user data after successful login
 * @param {Object} userData - User data to store
 */
function storeUserData(userData) {
  if (userData) {
    sessionStorage.setItem('authUser', JSON.stringify(userData));
    
    // Set a cookie as fallback (expires in 1 day)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1);
    document.cookie = `isLoggedIn=true; expires=${expiryDate.toUTCString()}; path=/`;
    
    // Update UI after storing data
    updateAuthUI();
  }
}

/**
 * Clear user data on logout
 */
function clearUserData() {
  sessionStorage.removeItem('authUser');
  
  // Clear the authentication cookie
  document.cookie = 'isLoggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Update UI after clearing data
  updateAuthUI();
}

/**
 * Handle user logout (with fallback for missing endpoint)
 * @param {Event} event - Click event
 */
function handleLogout(event) {
  if (event) event.preventDefault();
  
  // Try to call the logout API
  fetch('/auth/logout', {
    method: 'GET',
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      // If API fails, just do local logout
      console.warn('Logout API not available. Performing local logout.');
      clearUserData();
      window.location.href = '/';
      return null;
    }
    return response.json();
  })
  .then(data => {
    if (data && data.success) {
      clearUserData();
      window.location.href = '/';
    } else if (data) {
      // If the server reported an error but we got a response
      console.warn('Logout failed on server. Performing local logout.');
      clearUserData();
      window.location.href = '/';
    }
  })
  .catch(error => {
    console.error('Error during logout:', error);
    // Even if the API call fails, do local logout
    clearUserData();
    window.location.href = '/';
  });
}

/**
 * Show notification when available
 */
function showNotification(message, type) {
  if (typeof window.showNotification === 'function') {
    window.showNotification(message, type);
  } else {
    console.log(`${type}: ${message}`);
    // Only show alert for errors
    if (type === 'error') {
      alert(message);
    }
  }
}

// Export functions for use in other scripts
window.authUtils = {
  isUserLoggedIn,
  getCurrentUser,
  checkAuthStatus,
  updateAuthUI,
  storeUserData,
  clearUserData,
  handleLogout
};