const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { addVendor, findVendorByEmail, updateVendor } = require('../utils/storage');
const router = express.Router();

// Vendor Registration
router.post('/register', async (req, res) => {
    try {
        const {
            companyName,
            registrationNumber,
            email,
            password,
            contactPerson,
            phone,
            address,
            city,
            state,
            pincode
        } = req.body;

        // Validation
        if (!companyName || !registrationNumber || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if vendor already exists
        const existingVendor = findVendorByEmail(email);
        if (existingVendor) {
            return res.status(400).json({ error: 'Vendor with this email already exists' });
        }

        // Create vendor
        const vendor = {
            id: uuidv4(),
            companyName,
            registrationNumber,
            email,
            password, // In production, hash this!
            contactPerson,
            phone,
            address,
            city,
            state,
            pincode,
            status: 'PENDING_APPROVAL',
            createdAt: new Date().toISOString(),
            approvedAt: null
        };

        // Save vendor
        const saved = addVendor(vendor);
        if (!saved) {
            return res.status(500).json({ error: 'Failed to register vendor' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                email: vendor.email,
                role: 'vendor',
                mspId: 'VendorsMSP',
                name: vendor.companyName,
                vendorId: vendor.id
            },
            process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Vendor registered successfully',
            token,
            user: {
                email: vendor.email,
                role: 'vendor',
                mspId: 'VendorsMSP',
                name: vendor.companyName,
                vendorId: vendor.id,
                status: vendor.status
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get vendor profile
router.get('/profile', (req, res) => {
    try {
        const { email } = req.user;
        const vendor = findVendorByEmail(email);

        if (!vendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        // Remove password from response
        const { password, ...vendorData } = vendor;
        res.json({ vendor: vendorData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update vendor profile
router.put('/profile', (req, res) => {
    try {
        const { email } = req.user;
        const updates = req.body;

        // Don't allow updating email or password through this endpoint
        delete updates.email;
        delete updates.password;
        delete updates.id;

        const updated = updateVendor(email, updates);

        if (!updated) {
            return res.status(500).json({ error: 'Failed to update profile' });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
