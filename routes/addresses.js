// routes/addresses.js
const express = require('express');
const router = express.Router();
const Address = require('../models/address');
const { isAuthenticated } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * @route   GET /api/addresses
 * @desc    Get all addresses for the logged in user
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        // Find all addresses for the current user
        const addresses = await Address.find({ user: req.user._id })
            .sort({ isDefault: -1, createdAt: -1 }) // Sort default address first, then by creation date
            .exec();
        
        res.status(200).json({
            success: true,
            count: addresses.length,
            addresses
        });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching addresses',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/addresses/:id
 * @desc    Get a single address by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);
        
        // Check if address exists
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }
        
        // Check if address belongs to current user
        if (address.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this address'
            });
        }
        
        res.status(200).json({
            success: true,
            address
        });
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching address',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/addresses
 * @desc    Create a new address
 * @access  Private
 */
router.post('/', async (req, res) => {
    try {
        const {
            addressType,
            firstName,
            lastName,
            phone,
            street,
            apartment,
            city,
            state,
            postalCode,
            country,
            isDefault
        } = req.body;
        
        // Create new address
        const newAddress = new Address({
            user: req.user._id,
            addressType,
            firstName,
            lastName,
            phone,
            street,
            apartment,
            city,
            state,
            postalCode,
            country,
            isDefault: !!isDefault
        });
        
        // Save address
        await newAddress.save();
        
        res.status(201).json({
            success: true,
            message: 'Address created successfully',
            address: newAddress
        });
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating address',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/addresses/:id
 * @desc    Update an address
 * @access  Private
 */
router.put('/:id', async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);
        
        // Check if address exists
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }
        
        // Check if address belongs to current user
        if (address.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this address'
            });
        }
        
        const {
            addressType,
            firstName,
            lastName,
            phone,
            street,
            apartment,
            city,
            state,
            postalCode,
            country,
            isDefault
        } = req.body;
        
        // Update address fields
        address.addressType = addressType;
        address.firstName = firstName;
        address.lastName = lastName;
        address.phone = phone;
        address.street = street;
        address.apartment = apartment;
        address.city = city;
        address.state = state;
        address.postalCode = postalCode;
        address.country = country;
        address.isDefault = !!isDefault;
        
        // Save updated address
        await address.save();
        
        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            address
        });
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating address',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/addresses/:id/default
 * @desc    Set an address as the default
 * @access  Private
 */
router.put('/:id/default', async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);
        
        // Check if address exists
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }
        
        // Check if address belongs to current user
        if (address.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this address'
            });
        }
        
        // Make this address the default
        address.isDefault = true;
        
        // Save updated address
        await address.save();
        
        res.status(200).json({
            success: true,
            message: 'Address set as default successfully',
            address
        });
    } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({
            success: false,
            message: 'Error setting default address',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/addresses/:id
 * @desc    Delete an address
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);
        
        // Check if address exists
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }
        
        // Check if address belongs to current user
        if (address.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this address'
            });
        }
        
        // Check if trying to delete default address
        if (address.isDefault) {
            // Find another address to make default
            const anotherAddress = await Address.findOne({
                user: req.user._id,
                _id: { $ne: address._id }
            });
            
            if (anotherAddress) {
                anotherAddress.isDefault = true;
                await anotherAddress.save();
            }
        }
        
        // Delete address
        await address.remove();
        
        res.status(200).json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting address',
            error: error.message
        });
    }
});

module.exports = router;