// frontend/js/register.js
document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.querySelector('form');
  const googleLoginBtn = document.querySelector('.social-btn[data-provider="google"]');
  const facebookLoginBtn = document.querySelector('.social-btn[data-provider="facebook"]');
  
  // Regular registration form handler
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const newsletter = document.getElementById('newsletter').checked;
      
      // Basic form validation
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }
      
      // Check if passwords match
      if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
      }
      
      // Password strength validation
      if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
      }
      
      // Disable form while processing
      toggleFormState(registerForm, true);
      showNotification('Creating your account...', 'info');
      
      fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          firstName, 
          lastName, 
          email, 
          password,
          isSubscribed: newsletter
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Show success message
          showNotification('Registration successful! Welcome, ' + firstName, 'success');
          
          // Redirect to home page after successful registration
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          showNotification('Registration failed: ' + data.message, 'error');
          toggleFormState(registerForm, false);
        }
      })
      .catch(error => {
        console.error('Error during registration:', error);
        showNotification('An error occurred during registration. Please try again.', 'error');
        toggleFormState(registerForm, false);
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