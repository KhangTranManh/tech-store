// models/payment-method.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');

const PaymentMethodSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Add index for faster queries by user
    },
    type: {
        type: String,
        enum: ['card', 'bank','cod'],
        required: true,
        default: 'card'
    },
    // Card specific fields
    cardBrand: {
        type: String,
        trim: true
    },
    cardHolder: {
        type: String,
        trim: true
    },
    // We ONLY store the last 4 digits for security reasons
    last4: {
        type: String,
        trim: true
    },
    expiryMonth: {
        type: String,
        trim: true
    },
    expiryYear: {
        type: String,
        trim: true
    },
    // For bank accounts
    bankName: {
        type: String,
        trim: true
    },
    accountHolder: {
        type: String,
        trim: true
    },
    accountType: {
        type: String,
        enum: ['checking', 'savings'],
        default: 'checking'
    },
    branch: {
        type: String,
        trim: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // Common fields
    isDefault: {
        type: Boolean,
        default: false
    },
    // Encrypted token representing the payment method in a payment processor
    // This can be a Stripe card token, PayPal token, etc.
    paymentToken: {
        type: String,
        select: false // Don't return this in normal queries
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: {
        transform: function(doc, ret) {
            // Remove sensitive data when converting to JSON
            delete ret.paymentToken;
            return ret;
        }
    }
});

// Make sure only one payment method can be default per user and per type
PaymentMethodSchema.pre('save', async function(next) {
    // If this payment method is being set as default
    if (this.isDefault) {
        // Find all other payment methods of the same type for this user and un-set them as default
        await this.constructor.updateMany(
            { 
                user: this.user, 
                _id: { $ne: this._id },
                type: this.type 
            },
            { $set: { isDefault: false } }
        );
    }
    
    // If this is the first payment method of this type for a user, make it default
    if (this.isNew) {
        const count = await this.constructor.countDocuments({ 
            user: this.user,
            type: this.type
        });
        
        if (count === 0) {
            this.isDefault = true;
        }
    }
    
    next();
});

// Static method to determine card brand from card number
PaymentMethodSchema.statics.getCardBrand = function(cardNumber) {
    // Remove all non-digits
    const number = cardNumber.toString().replace(/\D/g, '');
    
    // Check card type based on prefix
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6(?:011|5)/.test(number)) return 'Discover';
    if (/^(?:2131|1800|35)/.test(number)) return 'JCB';
    if (/^3(?:0[0-5]|[68])/.test(number)) return 'Diners Club';
    
    return 'Unknown';
};

// Static method for validating card details
PaymentMethodSchema.statics.validateCard = function(cardNumber, expiryMonth, expiryYear) {
    const errors = [];
    
    // Validate card number using Luhn algorithm
    if (!this.validateCardNumber(cardNumber)) {
        errors.push('Invalid card number');
    }
    
    // Validate expiry date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
    
    if (parseInt(expiryYear) < currentYear || 
        (parseInt(expiryYear) === currentYear && parseInt(expiryMonth) < currentMonth)) {
        errors.push('Card has expired');
    }
    
    return errors;
};

// Luhn algorithm for validating card numbers
PaymentMethodSchema.statics.validateCardNumber = function(cardNumber) {
    // Remove all non-digits
    const number = cardNumber.toString().replace(/\D/g, '');
    
    let sum = 0;
    let shouldDouble = false;
    
    // Loop through values starting from the rightmost digit
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number.charAt(i));
        
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    
    return (sum % 10) === 0;
};

// Method to safely get the last 4 digits of a card or bank account
PaymentMethodSchema.statics.getLast4 = function(number) {
    // Remove all non-digits
    const cleanNumber = number.toString().replace(/\D/g, '');
    
    // Return last 4 digits
    return cleanNumber.slice(-4);
};

// Static method to sanitize and validate bank account details
PaymentMethodSchema.statics.validateBankAccount = function(accountNumber, routingNumber) {
    const errors = [];
    
    // Basic account number validation
    if (!/^\d{4,17}$/.test(accountNumber.replace(/\D/g, ''))) {
        errors.push('Invalid account number');
    }
    
    // Basic routing number validation (US)
    if (routingNumber && !/^\d{9}$/.test(routingNumber.replace(/\D/g, ''))) {
        errors.push('Invalid routing number');
    }
    
    return errors;
};

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);