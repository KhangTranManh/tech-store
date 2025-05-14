document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.querySelector('form');
  const googleLoginBtn = document.querySelector('.social-btn[data-provider="google"]');
  const facebookLoginBtn = document.querySelector('.social-btn[data-provider="facebook"]');
  
  // Regular login form handler
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();

      // Clear any previous error messages
      clearErrors();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Form validation
      if (!email || !password) {
        if (!email) showError('email', 'Email is required');
        if (!password) showError('password', 'Password is required');
        return;
      }
      
      // Disable form while processing
      toggleFormState(loginForm, true);
      showNotification('Logging in...', 'info');
      
      fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Debug: Log user data from server
          console.log('Login successful. User data:', data.user);
          
          // Store user data in session storage
          if (window.authUtils) {
            window.authUtils.storeUserData(data.user);
            
            // Debug: Verify data was stored correctly
            const storedData = sessionStorage.getItem('authUser');
            if (storedData) {
              console.log('User data stored in session:', JSON.parse(storedData));
            }
          }
          
          // Show success message
          showNotification('Login successful! Welcome back, ' + data.user.firstName, 'success');
          
          // Transfer guest cart to user account if available
          if (window.cartUtils && window.cartUtils.transferGuestCart) {
            window.cartUtils.transferGuestCart();
          }
          
          // Redirect after successful login
          setTimeout(() => {
            // Check if user is admin
            if (data.user && data.user.role === 'admin') {
              console.log('Admin user detected. Redirecting to admin tracking page...');
              
              // UPDATED: Redirect to admintrack.html (not /admin/tracking.html)
              window.location.href = '/admintrack.html';
            } else {
              console.log('Regular user detected. Redirecting to regular page...');
              
              // Regular user flow - check for redirect URL
              const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
              
              if (redirectUrl) {
                // Clear the stored URL
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
              } else {
                // Default redirect to home page
                window.location.href = '/';
              }
            }
          }, 1000);
        } else {
          // Show error notification
          showNotification('Login failed: ' + data.message, 'error');
          
          // Also show error under password field
          showError('password', data.message || 'Invalid email or password');
          
          // Clear password field and focus on it
          document.getElementById('password').value = '';
          document.getElementById('password').focus();
          
          toggleFormState(loginForm, false);
        }
      })
      .catch(error => {
        console.error('Error during login:', error);
        showNotification('An error occurred during login. Please try again.', 'error');
        showError('password', 'An error occurred. Please try again.');
        toggleFormState(loginForm, false);
      });
    });
  }
  
  // Google login button handler
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = '/auth/google';
    });
  }
  
  // Facebook login button handler
  if (facebookLoginBtn) {
    facebookLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = '/auth/facebook';
    });
  }
  
  /**
   * Show error message for a field
   * @param {string} fieldId - ID of the field
   * @param {string} message - Error message to display
   */
  function showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
    
    // Add error class to input
    const inputElement = document.getElementById(fieldId);
    if (inputElement) {
      inputElement.classList.add('input-error');
    }
  }
  
  /**
   * Clear all error messages
   */
  function clearErrors() {
    // Clear all error messages
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.textContent = '';
      element.style.display = 'none';
    });
    
    // Remove error class from inputs
    const inputElements = document.querySelectorAll('.input-error');
    inputElements.forEach(element => {
      element.classList.remove('input-error');
    });
  }
  
  /**
   * Toggle form state (enable/disable fields)
   * @param {HTMLFormElement} form - Form to toggle
   * @param {boolean} disabled - Whether to disable the form
   */
  function toggleFormState(form, disabled) {
    Array.from(form.elements).forEach(element => {
      element.disabled = disabled;
    });
    
    // Also disable social login buttons if they exist
    if (googleLoginBtn) googleLoginBtn.disabled = disabled;
    if (facebookLoginBtn) facebookLoginBtn.disabled = disabled;
  }
  
  /**
   * Helper function to show notifications
   */
  function showNotification(message, type = 'info') {
    // Check if we have a notification function from main.js
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      // Fallback alert if the main.js function isn't available
      if (type === 'error') {
        alert('Error: ' + message);
      } else {
        alert(message);
      }
    }
  }
});