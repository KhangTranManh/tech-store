// routes/payment-methods.js
const express = require('express');
const router = express.Router();
const PaymentMethod = require('../models/payment-method');
const { isAuthenticated } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /api/payment-methods
 * @desc    Get all payment methods for the logged in user
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        // Find all payment methods for the current user
        const paymentMethods = await PaymentMethod.find({ user: req.user._id })
            .sort({ isDefault: -1, createdAt: -1 }) // Sort default methods first, then by creation date
            .exec();
        
        res.status(200).json({
            success: true,
            count: paymentMethods.length,
            paymentMethods
        });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment methods',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/payment-methods/:id
 * @desc    Get a single payment method by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        const paymentMethod = await PaymentMethod.findById(req.params.id);
        
        // Check if payment method exists
        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }
        
        // Check if payment method belongs to current user
        if (paymentMethod.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this payment method'
            });
        }
        
        res.status(200).json({
            success: true,
            paymentMethod
        });
    } catch (error) {
        console.error('Error fetching payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment method',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/payment-methods
 * @desc    Create a new payment method
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const {
            cardNumber,
            cardHolder,
            expiryMonth,
            expiryYear,
            cvv,
            isDefault,
            // Bank account fields could be added here
        } = req.body;
        
        // Validate card information
        const cardErrors = PaymentMethod.validateCard(cardNumber, expiryMonth, expiryYear);
        
        if (cardErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: cardErrors[0]
            });
        }
        
        // Determine card brand
        const cardBrand = PaymentMethod.getCardBrand(cardNumber);
        
        // Get last 4 digits
        const last4 = PaymentMethod.getLast4(cardNumber);
        
        // In a production environment, you would send card info to a payment processor
        // like Stripe and get back a token, rather than storing card details directly
        
        // Create a simulated payment token (in production, this would come from Stripe/PayPal/etc.)
        const paymentToken = `sim_${cardBrand.toLowerCase()}_${Date.now()}_${last4}`;
        
        // Create new payment method
        const newPaymentMethod = new PaymentMethod({
            user: req.user._id,
            type: 'card',
            cardBrand,
            cardHolder,
            last4,
            expiryMonth,
            expiryYear,
            isDefault: !!isDefault,
            paymentToken
        });
        
        // Save payment method
        await newPaymentMethod.save();
        
        res.status(201).json({
            success: true,
            message: 'Payment method added successfully',
            paymentMethod: newPaymentMethod
        });
    } catch (error) {
        console.error('Error creating payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding payment method',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/payment-methods/:id
 * @desc    Update a payment method
 * @access  Private
 */
router.put('/:id', async (req, res) => {
    try {
        const paymentMethod = await PaymentMethod.findById(req.params.id);
        
        // Check if payment method exists
        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }
        
        // Check if payment method belongs to current user
        if (paymentMethod.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this payment method'
            });
        }
        
        const {
            cardHolder,
            expiryMonth,
            expiryYear,
            isDefault
        } = req.body;
        
        // Validate expiry date if provided
        if (expiryMonth && expiryYear) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            
            if (parseInt(expiryYear) < currentYear || 
                (parseInt(expiryYear) === currentYear && parseInt(expiryMonth) < currentMonth)) {
                return res.status(400).json({
                    success: false,
                    message: 'Card has expired'
                });
            }
        }
        
        // Update payment method fields
        if (cardHolder) paymentMethod.cardHolder = cardHolder;
        if (expiryMonth) paymentMethod.expiryMonth = expiryMonth;
        if (expiryYear) paymentMethod.expiryYear = expiryYear;
        paymentMethod.isDefault = !!isDefault;
        
        // Save updated payment method
        await paymentMethod.save();
        
        res.status(200).json({
            success: true,
            message: 'Payment method updated successfully',
            paymentMethod
        });
    } catch (error) {
        console.error('Error updating payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment method',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/payment-methods/:id/default
 * @desc    Set a payment method as the default
 * @access  Private
 */
router.put('/:id/default', async (req, res) => {
    try {
        const paymentMethod = await PaymentMethod.findById(req.params.id);
        
        // Check if payment method exists
        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }
        
        // Check if payment method belongs to current user
        if (paymentMethod.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this payment method'
            });
        }
        
        // Make this payment method the default
        paymentMethod.isDefault = true;
        
        // Save updated payment method
        await paymentMethod.save();
        
        res.status(200).json({
            success: true,
            message: 'Payment method set as default successfully',
            paymentMethod
        });
    } catch (error) {
        console.error('Error setting default payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting default payment method',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/payment-methods/:id
 * @desc    Delete a payment method
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const paymentMethod = await PaymentMethod.findById(req.params.id);
        
        // Check if payment method exists
        if (!paymentMethod) {
            return res.status(404).json({
                success: false,
                message: 'Payment method not found'
            });
        }
        
        // Check if payment method belongs to current user
        if (paymentMethod.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this payment method'
            });
        }
        
        // Store if this was the default method and its type
        const wasDefault = paymentMethod.isDefault;
        const methodType = paymentMethod.type;
        
        // Delete payment method
        await paymentMethod.remove();
        
        // If this was the default payment method, set another one as default
        if (wasDefault) {
            const anotherPaymentMethod = await PaymentMethod.findOne({
                user: req.user._id,
                type: methodType
            });
            
            if (anotherPaymentMethod) {
                anotherPaymentMethod.isDefault = true;
                await anotherPaymentMethod.save();
            }
        }
        
        res.status(200).json({
            success: true,
            message: 'Payment method deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting payment method',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/payment-methods/bank
 * @desc    Add a bank account as a payment method
 * @access  Private
 */
router.post('/bank', async (req, res) => {
    try {
        const {
            bankName,
            accountHolder,
            accountNumber,
            accountType,
            branch,
            isDefault
        } = req.body;
        
        // Validate bank account info
        if (!bankName || !accountHolder || !accountNumber) {
            return res.status(400).json({
                success: false,
                message: 'Bank name, account holder, and account number are required'
            });
        }
        
        // Basic validation
        if (accountNumber.length < 4) {
            return res.status(400).json({
                success: false,
                message: 'Invalid account number'
            });
        }
        
        // Get last 4 digits
        const last4 = PaymentMethod.getLast4(accountNumber);
        
        // Create new payment method
        const newBankAccount = new PaymentMethod({
            user: req.user._id,
            type: 'bank',
            bankName,
            accountHolder,
            last4,
            accountType: accountType || 'checking',
            branch,
            isDefault: !!isDefault,
            isVerified: false // Bank accounts start as unverified
        });
        
        // Save payment method
        await newBankAccount.save();
        
        res.status(201).json({
            success: true,
            message: 'Bank account added successfully',
            paymentMethod: newBankAccount
        });
    } catch (error) {
        console.error('Error adding bank account:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding bank account',
            error: error.message
        });
    }
});

module.exports = router;