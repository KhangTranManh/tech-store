// models/address.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    addressType: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home'
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    street: {
        type: String,
        required: true,
        trim: true
    },
    apartment: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    postalCode: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true,
        default: 'United States'
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Make sure only one address can be default per user
AddressSchema.pre('save', async function(next) {
    // If this address is being set as default
    if (this.isDefault) {
        // Find all other addresses for this user and un-set them as default
        await this.constructor.updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
    
    // If this is the first address for a user, make it default
    if (this.isNew) {
        const count = await this.constructor.countDocuments({ user: this.user });
        if (count === 0) {
            this.isDefault = true;
        }
    }
    
    next();
});

module.exports = mongoose.model('Address', AddressSchema);