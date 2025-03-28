// Reset Password JavaScript Functionality
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reset-password-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const tokenInput = document.getElementById('token');
    
    // Extract token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    // If no token is present, show error
    if (!token) {
        form.style.display = 'none';
        errorMessage.style.display = 'block';
        return;
    }
    
    // Set token in hidden input
    tokenInput.value = token;
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Validate password
            if (password.length < 6) {
                showNotification('Password must be at least 6 characters long', 'error');
                return;
            }
            
            // Check if passwords match
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            // Validate password strength
            if (!isStrongPassword(password)) {
                showNotification('Password must contain at least one uppercase letter and one number', 'error');
                return;
            }
            
            // Disable form while processing
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Resetting...';
            
            // Send password reset request
            fetch('/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    token: token,
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message
                    form.style.display = 'none';
                    successMessage.style.display = 'block';
                    
                    // Show notification
                    showNotification('Password reset successful!', 'success');
                    
                    // Redirect to login page after 3 seconds
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 3000);
                } else {
                    // Show error message
                    showNotification(data.message || 'Failed to reset password. Please try again.', 'error');
                    
                    // Re-enable form
                    submitButton.disabled = false;
                    submitButton.textContent = 'Reset Password';
                    
                    // If token is invalid, show error message
                    if (data.message && data.message.includes('invalid') || data.message.includes('expired')) {
                        form.style.display = 'none';
                        errorMessage.style.display = 'block';
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('An error occurred. Please try again later.', 'error');
                
                // Re-enable form
                submitButton.disabled = false;
                submitButton.textContent = 'Reset Password';
            });
        });
    }
    
    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {boolean} - Whether password is strong enough
     */
    function isStrongPassword(password) {
        // Check for at least one uppercase letter
        const hasUppercase = /[A-Z]/.test(password);
        
        // Check for at least one number
        const hasNumber = /\d/.test(password);
        
        return hasUppercase && hasNumber;
    }
    
    /**
     * Show notification to user
     * @param {string} message - Message to show
     * @param {string} type - Type of notification ('success', 'error', 'info')
     */
    function showNotification(message, type = 'info') {
        // Check if showNotification is available from main.js
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback notification implementation
        alert(message);
    }
});