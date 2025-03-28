// Forgot Password JavaScript Functionality
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('forgot-password-form');
    const successMessage = document.getElementById('success-message');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            
            if (!email) {
                showNotification('Please enter your email address', 'error');
                return;
            }
            
            // Disable form while processing
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            
            // Send password reset request
            fetch('/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message
                    form.style.display = 'none';
                    successMessage.style.display = 'block';
                    
                    // Show notification
                    showNotification('Password reset email sent!', 'success');
                    
                    // Redirect to login page after 5 seconds
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 5000);
                } else {
                    // Show error message
                    showNotification(data.message || 'Failed to send reset email. Please try again.', 'error');
                    
                    // Re-enable form
                    submitButton.disabled = false;
                    submitButton.textContent = 'Reset Password';
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