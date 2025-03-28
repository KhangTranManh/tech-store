// account-settings.js
document.addEventListener('DOMContentLoaded', initializeAccountSettings);

/**
 * Main initialization function for account settings page
 */
function initializeAccountSettings() {
    // Check if user is logged in
    if (window.authUtils && !window.authUtils.isUserLoggedIn()) {
        // If not logged in, redirect to login page
        window.location.href = '/login.html?redirect=account-settings.html';
        return;
    }
    
    // Initialize the tabs
    initializeTabs();
    
    // Load user data
    loadUserData();
    
    // Initialize form handlers
    initializeProfileForm();
    initializePasswordForm();
    initializePreferencesForm();
    initializeSecurityForm();
    
    // Setup logout button
    setupLogoutButton();
    
    // Setup danger zone buttons
    setupDangerZoneButtons();
}
/**
 * Toggle form state (enable/disable fields)
 * @param {HTMLFormElement} form - Form to toggle
 * @param {boolean} disabled - Whether to disable the form
 */
function toggleFormState(form, disabled) {
    // Disable/enable all form elements
    Array.from(form.elements).forEach(element => {
        element.disabled = disabled;
    });
}
/**
 * Initialize tab switching functionality
 */
function initializeTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.querySelector(`.tab-content[data-tab-content="${tabName}"]`).classList.add('active');
            
            // Hide any status messages when switching tabs
            hideStatusMessage();
        });
    });
}

/**
 * Load user data from the server and populate forms
 */
function loadUserData() {
    // Try to get from session storage first for quick loading
    const storedData = sessionStorage.getItem('authUser');
    if (storedData) {
        try {
            const userData = JSON.parse(storedData);
            populateUserData(userData);
        } catch (error) {
            console.error('Error parsing stored user data:', error);
        }
    }
    
    // Always fetch fresh data from server
    fetch('/auth/user', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Update UI with user data
            populateUserData(data.user);
            
            // Store updated user data
            sessionStorage.setItem('authUser', JSON.stringify(data.user));
        } else {
            showStatusMessage('Error loading user data: ' + data.message, 'error');
            
            // If authentication failed, redirect to login
            if (data.message === 'Not authenticated') {
                window.location.href = '/login.html?redirect=account-settings.html';
            }
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        showStatusMessage('Error loading user data. Please try again.', 'error');
    });
}

/**
 * Populate user data into all forms and UI elements
 * @param {Object} userData - User data from the server
 */
function populateUserData(userData) {
    // Update sidebar user info
    updateSidebarUserInfo(userData);
    
    // Populate profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.firstName.value = userData.firstName || '';
        profileForm.lastName.value = userData.lastName || '';
        profileForm.email.value = userData.email || '';
        profileForm.phone.value = userData.phone || '';
    }
    
    // Populate preferences form
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
        // Email notifications
        if (userData.preferences) {
            document.getElementById('orderUpdates').checked = userData.preferences.orderUpdates !== false; // Default to true
            document.getElementById('promotions').checked = !!userData.preferences.promotions;
            document.getElementById('newsletter').checked = !!userData.preferences.newsletter || !!userData.isSubscribed;
            document.getElementById('productAlerts').checked = !!userData.preferences.productAlerts;
            
            // Currency preference
            if (userData.preferences.currency) {
                document.getElementById('currency').value = userData.preferences.currency;
            }
        } else {
            // Set defaults if no preferences exist
            document.getElementById('orderUpdates').checked = true;
            document.getElementById('newsletter').checked = !!userData.isSubscribed;
        }
    }
    
    // Populate security form
    const securityForm = document.getElementById('securityForm');
    if (securityForm && userData.security) {
        document.getElementById('twoFactorAuth').checked = !!userData.security.twoFactorEnabled;
        if (userData.security.twoFactorEnabled && userData.security.twoFactorPhone) {
            document.getElementById('phoneAuthGroup').style.display = 'block';
            document.getElementById('phoneAuth').value = userData.security.twoFactorPhone;
        }
        
        document.getElementById('loginAlerts').checked = !!userData.security.loginAlerts;
        
        if (userData.security.sessionTimeout) {
            document.getElementById('sessionTimeout').value = userData.security.sessionTimeout;
        }
    }
}

/**
 * Update the user info in the sidebar
 * @param {Object} userData - User data from the server
 */
function updateSidebarUserInfo(userData) {
    // Update avatar
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar && userData.firstName) {
        userAvatar.textContent = userData.firstName.charAt(0).toUpperCase();
    }
    
    // Update name
    const userName = document.getElementById('userName');
    if (userName) {
        userName.textContent = `${userData.firstName} ${userData.lastName}`;
    }
    
    // Update email
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = userData.email;
    }
}

/**
 * Initialize the profile form with event handlers
 */
function initializeProfileForm() {
    const profileForm = document.getElementById('profileForm');
    const cancelButton = document.getElementById('cancelProfileBtn');
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateProfileForm()) {
                return;
            }
            
            // Disable form while processing
            toggleFormState(profileForm, true);
            
            // Get form data
            const formData = {
                firstName: profileForm.firstName.value,
                lastName: profileForm.lastName.value,
                email: profileForm.email.value,
                phone: profileForm.phone.value || null
            };
            
            // Send form data to server
            fetch('/auth/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showStatusMessage('Profile updated successfully!', 'success');
                    
                    // Update stored user data
                    if (data.user) {
                        sessionStorage.setItem('authUser', JSON.stringify(data.user));
                        // Update sidebar info
                        updateSidebarUserInfo(data.user);
                    } else {
                        // Refresh user data if the response doesn't include updated user data
                        loadUserData();
                    }
                } else {
                    showStatusMessage('Failed to update profile: ' + data.message, 'error');
                }
                
                // Re-enable form
                toggleFormState(profileForm, false);
            })
            .catch(error => {
                console.error('Error updating profile:', error);
                showStatusMessage('An error occurred while updating your profile. Please try again.', 'error');
                toggleFormState(profileForm, false);
            });
        });
    }
    
    // Handle cancel button
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            // Reset form to original user data
            loadUserData();
            hideStatusMessage();
        });
    }
}

/**
 * Validate the profile form
 * @returns {boolean} Whether the form is valid
 */
function validateProfileForm() {
    const profileForm = document.getElementById('profileForm');
    
    // Basic validation
    if (!profileForm.firstName.value.trim()) {
        showStatusMessage('First name is required', 'error');
        profileForm.firstName.focus();
        return false;
    }
    
    if (!profileForm.lastName.value.trim()) {
        showStatusMessage('Last name is required', 'error');
        profileForm.lastName.focus();
        return false;
    }
    
    if (!profileForm.email.value.trim()) {
        showStatusMessage('Email is required', 'error');
        profileForm.email.focus();
        return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileForm.email.value.trim())) {
        showStatusMessage('Please enter a valid email address', 'error');
        profileForm.email.focus();
        return false;
    }
    
    // Phone validation (if provided)
    if (profileForm.phone.value.trim()) {
        const phoneRegex = /^\+?[0-9\s\-\(\)]{10,20}$/;
        if (!phoneRegex.test(profileForm.phone.value.trim())) {
            showStatusMessage('Please enter a valid phone number', 'error');
            profileForm.phone.focus();
            return false;
        }
    }
    
    return true;
}

/**
 * Initialize the password form with event handlers
 */
function initializePasswordForm() {
    const passwordForm = document.getElementById('passwordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordStrengthBar = document.getElementById('passwordStrengthBar');
    const passwordStrengthText = document.getElementById('passwordStrengthText');
    const passwordMatchStatus = document.getElementById('passwordMatchStatus');
    const cancelButton = document.getElementById('cancelPasswordBtn');
    
    if (passwordForm) {
        // Password strength meter
        if (newPasswordInput && passwordStrengthBar && passwordStrengthText) {
            newPasswordInput.addEventListener('input', function() {
                const strength = checkPasswordStrength(this.value);
                updatePasswordStrengthIndicator(strength);
            });
        }
        
        // Password match check
        if (newPasswordInput && confirmPasswordInput && passwordMatchStatus) {
            confirmPasswordInput.addEventListener('input', function() {
                checkPasswordsMatch();
            });
            
            newPasswordInput.addEventListener('input', function() {
                if (confirmPasswordInput.value) {
                    checkPasswordsMatch();
                }
            });
        }
        
        // Form submission
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validatePasswordForm()) {
                return;
            }
            
            // Disable form while processing
            toggleFormState(passwordForm, true);
            
            // Get form data
            const formData = {
                currentPassword: passwordForm.currentPassword.value,
                newPassword: passwordForm.newPassword.value
            };
            
            // Send form data to server
            fetch('/auth/password/change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showStatusMessage('Password updated successfully!', 'success');
                    
                    // Clear form
                    passwordForm.reset();
                    passwordStrengthBar.className = 'password-strength-bar';
                    passwordStrengthBar.style.width = '0';
                    passwordStrengthText.textContent = 'Password strength: Not set';
                    passwordMatchStatus.textContent = '';
                } else {
                    showStatusMessage('Failed to update password: ' + data.message, 'error');
                }
                
                // Re-enable form
                toggleFormState(passwordForm, false);
            })
            .catch(error => {
                console.error('Error updating password:', error);
                showStatusMessage('An error occurred while updating your password. Please try again.', 'error');
                toggleFormState(passwordForm, false);
            });
        });
    }
    
    // Handle cancel button
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            // Reset form
            passwordForm.reset();
            passwordStrengthBar.className = 'password-strength-bar';
            passwordStrengthBar.style.width = '0';
            passwordStrengthText.textContent = 'Password strength: Not set';
            passwordMatchStatus.textContent = '';
            hideStatusMessage();
        });
    }
}

/**
 * Check password strength
 * @param {string} password - Password to check
 * @returns {string} Strength level: 'weak', 'medium', or 'strong'
 */
function checkPasswordStrength(password) {
    if (!password) {
        return 'none';
    }
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) {
        strength += 1;
    }
    
    // Contains lowercase letters
    if (/[a-z]/.test(password)) {
        strength += 1;
    }
    
    // Contains uppercase letters
    if (/[A-Z]/.test(password)) {
        strength += 1;
    }
    
    // Contains numbers
    if (/[0-9]/.test(password)) {
        strength += 1;
    }
    
    // Contains special characters
    if (/[^A-Za-z0-9]/.test(password)) {
        strength += 1;
    }
    
    // Determine strength level
    if (strength <= 2) {
        return 'weak';
    } else if (strength <= 4) {
        return 'medium';
    } else {
        return 'strong';
    }
}

/**
 * Update password strength indicator
 * @param {string} strength - Password strength level
 */
function updatePasswordStrengthIndicator(strength) {
    const passwordStrengthBar = document.getElementById('passwordStrengthBar');
    const passwordStrengthText = document.getElementById('passwordStrengthText');
    
    // Remove all classes
    passwordStrengthBar.className = 'password-strength-bar';
    
    switch (strength) {
        case 'weak':
            passwordStrengthBar.classList.add('strength-weak');
            passwordStrengthText.textContent = 'Password strength: Weak';
            break;
        case 'medium':
            passwordStrengthBar.classList.add('strength-medium');
            passwordStrengthText.textContent = 'Password strength: Medium';
            break;
        case 'strong':
            passwordStrengthBar.classList.add('strength-strong');
            passwordStrengthText.textContent = 'Password strength: Strong';
            break;
        default:
            passwordStrengthBar.style.width = '0';
            passwordStrengthText.textContent = 'Password strength: Not set';
    }
}

/**
 * Check if passwords match and update UI
 */
function checkPasswordsMatch() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const passwordMatchStatus = document.getElementById('passwordMatchStatus');
    
    if (!confirmPassword) {
        passwordMatchStatus.textContent = '';
        return;
    }
    
    if (newPassword === confirmPassword) {
        passwordMatchStatus.textContent = 'Passwords match';
        passwordMatchStatus.className = 'password-match-status match-success';
    } else {
        passwordMatchStatus.textContent = 'Passwords do not match';
        passwordMatchStatus.className = 'password-match-status match-error';
    }
}

/**
 * Validate the password form
 * @returns {boolean} Whether the form is valid
 */
function validatePasswordForm() {
    const passwordForm = document.getElementById('passwordForm');
    
    // Current password is required
    if (!passwordForm.currentPassword.value.trim()) {
        showStatusMessage('Current password is required', 'error');
        passwordForm.currentPassword.focus();
        return false;
    }
    
    // New password is required
    if (!passwordForm.newPassword.value.trim()) {
        showStatusMessage('New password is required', 'error');
        passwordForm.newPassword.focus();
        return false;
    }
    
    // Password strength validation
    const strength = checkPasswordStrength(passwordForm.newPassword.value);
    if (strength === 'weak') {
        showStatusMessage('Please choose a stronger password', 'error');
        passwordForm.newPassword.focus();
        return false;
    }
    
    // Confirm password must match
    if (passwordForm.newPassword.value !== passwordForm.confirmPassword.value) {
        showStatusMessage('Passwords do not match', 'error');
        passwordForm.confirmPassword.focus();
        return false;
    }
    
    return true;
}

/**
 * Initialize the preferences form with event handlers
 */
function initializePreferencesForm() {
    const preferencesForm = document.getElementById('preferencesForm');
    const cancelButton = document.getElementById('cancelPreferencesBtn');
    
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Disable form while processing
            toggleFormState(preferencesForm, true);
            
            // Get form data
            const formData = {
                preferences: {
                    orderUpdates: document.getElementById('orderUpdates').checked,
                    promotions: document.getElementById('promotions').checked,
                    newsletter: document.getElementById('newsletter').checked,
                    productAlerts: document.getElementById('productAlerts').checked,
                    currency: document.getElementById('currency').value
                }
            };
            
            // Send form data to server
            fetch('/auth/preferences/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showStatusMessage('Preferences updated successfully!', 'success');
                    
                    // Update stored user data
                    if (data.user) {
                        sessionStorage.setItem('authUser', JSON.stringify(data.user));
                    } else {
                        // Refresh user data if the response doesn't include updated user data
                        loadUserData();
                    }
                } else {
                    showStatusMessage('Failed to update preferences: ' + data.message, 'error');
                }
                
                // Re-enable form
                toggleFormState(preferencesForm, false);
            })
            .catch(error => {
                console.error('Error updating preferences:', error);
                showStatusMessage('An error occurred while updating your preferences. Please try again.', 'error');
                toggleFormState(preferencesForm, false);
            });
        });
    }
    
    // Handle cancel button
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            // Reset form to original user data
            loadUserData();
            hideStatusMessage();
        });
    }
}

/**
 * Initialize the security form with event handlers
 */
function initializeSecurityForm() {
    const securityForm = document.getElementById('securityForm');
    const twoFactorCheckbox = document.getElementById('twoFactorAuth');
    const phoneAuthGroup = document.getElementById('phoneAuthGroup');
    const cancelButton = document.getElementById('cancelSecurityBtn');
    
    // Toggle phone input visibility when two-factor checkbox changes
    if (twoFactorCheckbox && phoneAuthGroup) {
        twoFactorCheckbox.addEventListener('change', function() {
            phoneAuthGroup.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    if (securityForm) {
        securityForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (twoFactorCheckbox.checked && !validatePhoneForTwoFactor()) {
                return;
            }
            
            // Disable form while processing
            toggleFormState(securityForm, true);
            
            // Get form data
            const formData = {
                security: {
                    twoFactorEnabled: twoFactorCheckbox.checked,
                    twoFactorPhone: twoFactorCheckbox.checked ? document.getElementById('phoneAuth').value : null,
                    loginAlerts: document.getElementById('loginAlerts').checked,
                    sessionTimeout: document.getElementById('sessionTimeout').value
                }
            };
            
            // Send form data to server
            fetch('/auth/security/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showStatusMessage('Security settings updated successfully!', 'success');
                    
                    // Update stored user data
                    if (data.user) {
                        sessionStorage.setItem('authUser', JSON.stringify(data.user));
                    } else {
                        // Refresh user data if the response doesn't include updated user data
                        loadUserData();
                    }
                } else {
                    showStatusMessage('Failed to update security settings: ' + data.message, 'error');
                }
                
                // Re-enable form
                toggleFormState(securityForm, false);
            })
            .catch(error => {
                console.error('Error updating security settings:', error);
                showStatusMessage('An error occurred while updating your security settings. Please try again.', 'error');
                toggleFormState(securityForm, false);
            });
        });
    }
    
    // Handle cancel button
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            // Reset form to original user data
            loadUserData();
            hideStatusMessage();
        });
    }
}

/**
 * Validate phone number for two-factor authentication
 * @returns {boolean} Whether the phone number is valid
 */
function validatePhoneForTwoFactor() {
    const phoneInput = document.getElementById('phoneAuth');
    
    if (!phoneInput.value.trim()) {
        showStatusMessage('Phone number is required for two-factor authentication', 'error');
        phoneInput.focus();
        return false;
    }
    
    // Simple phone validation
    const phoneRegex = /^\+?[0-9\s\-\(\)]{10,20}$/;
    if (!phoneRegex.test(phoneInput.value.trim())) {
        showStatusMessage('Please enter a valid phone number for two-factor authentication', 'error');
        phoneInput.focus();
        return false;
    }
    
    return true;
}

/**
 * Setup the logout button
 */
function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Clear any stored data
                    sessionStorage.removeItem('authUser');
                    
                    // Show success notification if available
                    if (typeof window.showNotification === 'function') {
                        window.showNotification('Logged out successfully!', 'success');
                    }
                    
                    // Redirect to home page
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    if (typeof window.showNotification === 'function') {
                        window.showNotification('Logout failed. Please try again.', 'error');
                    } else {
                        alert('Logout failed. Please try again.');
                    }
                }
            })
            .catch(error => {
                console.error('Error during logout:', error);
                if (typeof window.showNotification === 'function') {
                    window.showNotification('An error occurred during logout. Please try again.', 'error');
                } else {
                    alert('An error occurred during logout. Please try again.');
                }
            });
        });
    }

}
/**
 * Show status message
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success' or 'error')
 */
function showStatusMessage(message, type = 'success') {
    const statusMessage = document.getElementById('statusMessage');
    
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message status-' + type;
        statusMessage.style.display = 'block';
        
        // Scroll to message if not visible
        if (!isElementInViewport(statusMessage)) {
            statusMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

/**
 * Hide status message
 */
function hideStatusMessage() {
    const statusMessage = document.getElementById('statusMessage');
    
    if (statusMessage) {
        statusMessage.style.display = 'none';
    }
}

/**
 * Check if an element is in the viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Whether the element is in the viewport
 */
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Setup danger zone buttons
 */
function setupDangerZoneButtons() {
    const logoutAllDevicesBtn = document.getElementById('logoutAllDevicesBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    // Logout from all devices button
    if (logoutAllDevicesBtn) {
        logoutAllDevicesBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to log out from all devices? You will need to log in again on this device.')) {
                // Disable button to prevent multiple clicks
                this.disabled = true;
                
                fetch('/auth/logout-all', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Clear any stored data
                        sessionStorage.removeItem('authUser');
                        
                        // Show success notification
                        if (typeof window.showNotification === 'function') {
                            window.showNotification('Logged out from all devices successfully!', 'success');
                        } else {
                            alert('Logged out from all devices successfully!');
                        }
                        
                        // Redirect to login page
                        setTimeout(() => {
                            window.location.href = '/login.html';
                        }, 1500);
                    } else {
                        this.disabled = false;
                        showStatusMessage('Failed to log out from all devices: ' + data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error logging out from all devices:', error);
                    this.disabled = false;
                    showStatusMessage('An error occurred. Please try again.', 'error');
                });
            }
        });
    }
    
    // Delete account button
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            if (confirm('WARNING: Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.')) {
                // Additional confirmation prompt
                const email = prompt('For security reasons, please enter your email address to confirm account deletion:');
                
                if (email) {
                    // Get current user email for comparison
                    const userData = JSON.parse(sessionStorage.getItem('authUser') || '{}');
                    
                    if (email === userData.email) {
                        // Disable button to prevent multiple clicks
                        this.disabled = true;
                        
                        fetch('/auth/account/delete', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ email }),
                            credentials: 'include'
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                // Clear any stored data
                                sessionStorage.removeItem('authUser');
                                
                                // Show success notification
                                if (typeof window.showNotification === 'function') {
                                    window.showNotification('Your account has been permanently deleted.', 'success');
                                } else {
                                    alert('Your account has been permanently deleted.');
                                }
                                
                                // Redirect to home page
                                setTimeout(() => {
                                    window.location.href = '/';
                                }, 1500);
                            } else {
                                this.disabled = false;
                                showStatusMessage('Failed to delete account: ' + data.message, 'error');
                            }
                        })
                        .catch(error => {
                            console.error('Error deleting account:', error);
                            this.disabled = false;
                            showStatusMessage('An error occurred. Please try again.', 'error');
                        });
                    } else {
                        showStatusMessage('Email address does not match your account. Account deletion cancelled.', 'error');
                    }
                } else {
                    // User cancelled the email confirmation prompt
                    showStatusMessage('Account deletion cancelled.', 'error');
                }
            }
        });
    }
}
