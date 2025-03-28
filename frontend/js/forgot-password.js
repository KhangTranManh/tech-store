// Forgot Password Request Function
function forgotPassword(email) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        throw new Error('Email is required');
    }
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }

    // Send password reset request
    return fetch('/auth/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
    .then(response => {
        // Handle response parsing
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Failed to send password reset request');
            });
        }
        return response.json();
    })
    .then(data => {
        // Validate successful response
        if (!data.success) {
            throw new Error(data.message || 'Unknown error occurred');
        }
        return data;
    });
}

// Optional: Wrapper function for form submission
function handleForgotPasswordSubmission(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('email');
    const submitButton = event.target.querySelector('button[type="submit"]');
    const successMessage = document.getElementById('success-message');

    // Disable button and show processing state
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    try {
        // Attempt forgot password request
        forgotPassword(emailInput.value.trim())
            .then(result => {
                // Hide form, show success message
                event.target.style.display = 'none';
                successMessage.style.display = 'block';

                // Optional: Redirect after 5 seconds
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 5000);
            })
            .catch(error => {
                // Show error notification
                alert(error.message);
            })
            .finally(() => {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = 'Reset Password';
            });
    } catch (validationError) {
        // Handle validation errors
        alert(validationError.message);
        submitButton.disabled = false;
        submitButton.textContent = 'Reset Password';
    }
}

// Event listener for forgot password form
document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPasswordSubmission);
    }
});