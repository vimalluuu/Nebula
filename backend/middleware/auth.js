const jwt = require('jsonwebtoken');

// Hardcoded test users for demo
const DEMO_USERS = {
    'gov@demo.com': { password: 'demo123', role: 'government', mspId: 'AgenciesMSP', name: 'Government Official' },
    'vendor1@demo.com': { password: 'demo123', role: 'vendor', mspId: 'VendorsMSP', name: 'Vendor 1' },
    'vendor2@demo.com': { password: 'demo123', role: 'vendor', mspId: 'VendorsMSP', name: 'Vendor 2' },
    'vendor3@demo.com': { password: 'demo123', role: 'vendor', mspId: 'VendorsMSP', name: 'Vendor 3' },
    'auditor@demo.com': { password: 'demo123', role: 'auditor', mspId: 'AuditorsMSP', name: 'Auditor' }
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

const login = (req, res) => {
    const { email, password } = req.body;

    // First check demo users
    let user = DEMO_USERS[email];

    // If not a demo user, check registered vendors
    if (!user) {
        const { findVendorByEmail } = require('../utils/storage');
        const vendor = findVendorByEmail(email);

        if (vendor && vendor.password === password) {
            user = {
                password: vendor.password,
                role: 'vendor',
                mspId: 'VendorsMSP',
                name: vendor.companyName
            };
        }
    }

    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { email, role: user.role, mspId: user.mspId, name: user.name },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        { expiresIn: '7d' }
    );

    res.json({
        token,
        user: { email, role: user.role, mspId: user.mspId, name: user.name }
    });
};

const register = (req, res) => {
    const { email, password, companyName, ...otherDetails } = req.body;

    // Check if user already exists in DEMO_USERS
    if (DEMO_USERS[email]) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const { findVendorByEmail, addVendor } = require('../utils/storage');

    // Check if vendor already exists in storage
    if (findVendorByEmail(email)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    // Create new vendor
    const newVendor = {
        email,
        password,
        companyName,
        role: 'vendor',
        mspId: 'VendorsMSP',
        name: companyName, // Use company name as display name
        ...otherDetails,
        registeredAt: new Date().toISOString()
    };

    if (addVendor(newVendor)) {
        // Generate token
        const token = jwt.sign(
            { email, role: 'vendor', mspId: 'VendorsMSP', name: companyName },
            process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                email,
                role: 'vendor',
                mspId: 'VendorsMSP',
                name: companyName
            }
        });
    } else {
        res.status(500).json({ error: 'Failed to register vendor' });
    }
};

module.exports = { authenticateToken, login, register, DEMO_USERS };
