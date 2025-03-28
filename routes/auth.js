const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const { transporter } = require('../services/authService');

// Debug middleware
router.use((req, res, next) => {
    console.log('Auth route accessed:', req.method, req.path);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    next();
});

// Existing forgot password route with added logging
router.post('/forgot-password', async (req, res) => {
    console.log('=== FORGOT PASSWORD ROUTE HIT ===');
    console.log('Full request details:');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    try {
        const { email } = req.body;
        
        console.log('Received email:', email);
        
        if (!email) {
            console.log('No email provided');
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        
        // Rest of your existing implementation...
        
        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('No user found with email:', email);
            // For security reasons, still return success
            return res.status(200).json({
                success: true,
                message: 'If your email is registered, you will receive a password reset link'
            });
        }
        
        // Generate reset token
        const token = crypto.randomBytes(20).toString('hex');
        
        // Set token and expiration (1 hour)
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        
        await user.save();
        
        console.log('Password reset token generated:', token);
        
        res.status(200).json({
            success: true,
            message: 'Password reset email sent'
        });
    } catch (error) {
        console.error('Detailed Forgot Password Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending password reset email',
            errorDetails: error.message
        });
    }
});

module.exports = router;