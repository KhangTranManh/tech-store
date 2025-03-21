// frontend/js/register.js
document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.querySelector('form');
  
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // Check if passwords match
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      
      fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ firstName, lastName, email, password })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Show success message
          alert('Registration successful! Welcome, ' + firstName);
          
          // Redirect to home page after successful registration
          window.location.href = '/';
        } else {
          alert('Registration failed: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error during registration:', error);
        alert('An error occurred during registration. Please try again.');
      });
    });
  }
});
