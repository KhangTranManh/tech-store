// frontend/js/login.js
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.querySelector('form');
  const googleLoginBtn = document.querySelector('.social-btn[data-provider="google"]');
  const facebookLoginBtn = document.querySelector('.social-btn[data-provider="facebook"]');
  
  // Regular login form handler
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Form validation
      if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
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
          // Store user data in session storage
          if (window.authUtils) {
            window.authUtils.storeUserData(data.user);
          }
          
          // Show success message
          showNotification('Login successful! Welcome back, ' + data.user.firstName, 'success');
          
          // Transfer guest cart to user account if available
          if (window.cartUtils && window.cartUtils.transferGuestCart) {
            window.cartUtils.transferGuestCart();
          }
          
          // Redirect after successful login
          setTimeout(() => {
            // Check if we have a redirect URL stored
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
            
            if (redirectUrl) {
              // Clear the stored URL
              sessionStorage.removeItem('redirectAfterLogin');
              window.location.href = redirectUrl;
            } else {
              // Default redirect to home page
              window.location.href = '/';
            }
          }, 1000);
        } else {
          showNotification('Login failed: ' + data.message, 'error');
          toggleFormState(loginForm, false);
        }
      })
      .catch(error => {
        console.error('Error during login:', error);
        showNotification('An error occurred during login. Please try again.', 'error');
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
  
  // Helper function to show notifications
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
  
  // Helper function to toggle form state (disabled/enabled)
  function toggleFormState(form, isDisabled) {
    Array.from(form.elements).forEach(element => {
      element.disabled = isDisabled;
    });
    
    // Also disable social login buttons if they exist
    if (googleLoginBtn) googleLoginBtn.disabled = isDisabled;
    if (facebookLoginBtn) facebookLoginBtn.disabled = isDisabled;
  }
});