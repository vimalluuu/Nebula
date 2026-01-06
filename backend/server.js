require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Blockchain = require('./blockchain/Blockchain');
const { authenticateToken, login } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize blockchain
const blockchain = new Blockchain();

// Clear audit storage on startup (for testing/development)
const auditStorage = require('./utils/audit-storage');
auditStorage.clearAll();
console.log('🧹 Cleared all audit data on startup');

// Auto-seed if blockchain is empty (only genesis block)
if (blockchain.getChain().length === 1) {
    console.log('🌱 Blockchain is empty, auto-seeding with sample data...');
    const { v4: uuidv4 } = require('uuid');

    const sampleTenders = [
        {
            id: uuidv4(),
            title: 'Road Construction Project - NH 44',
            description: 'Construction of 50km highway stretch with modern infrastructure',
            budget: 25000000,
            deadline: '2026-03-15',
            requirements: 'ISO certified, 10+ years experience',
            status: 'OPEN',
            createdBy: 'gov@demo.com',
            createdAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            title: 'School Building Renovation',
            description: 'Complete renovation of 5 government schools',
            budget: 8000000,
            deadline: '2026-02-28',
            requirements: 'Civil engineering certification required',
            status: 'OPEN',
            createdBy: 'gov@demo.com',
            createdAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            title: 'Water Supply Pipeline Installation',
            description: 'Installation of water supply network for rural areas',
            budget: 15000000,
            deadline: '2026-04-10',
            requirements: 'Plumbing and civil works expertise',
            status: 'OPEN',
            createdBy: 'gov@demo.com',
            createdAt: new Date().toISOString()
        }
    ];

    sampleTenders.forEach(tender => {
        blockchain.addBlock('TENDER', tender, 'AgenciesMSP');
    });

    console.log(`✅ Auto-seeded ${sampleTenders.length} sample tenders`);
}

// Middleware
app.use(cors());
app.use(express.json());

// Public routes (no authentication required)
app.post('/api/auth/login', login);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend server running' });
});

// Initialize route modules
const tenderRoutes = require('./routes/tender.routes')(blockchain);
const contractRoutes = require('./routes/contract.routes')(blockchain);
const bidRoutes = require('./routes/bid.routes')(blockchain);
const blockchainRoutes = require('./routes/blockchain.routes')(blockchain);
const auditRoutes = require('./routes/audit.routes')(blockchain);
const notificationRoutes = require('./routes/notification.routes')(blockchain);
const vendorRoutes = require('./routes/vendor.routes')(blockchain);
const paymentRoutes = require('./routes/payment.routes')(blockchain);

// Public read-only routes (no auth) - Must come BEFORE protected routes
app.use('/api/public/tenders', tenderRoutes);
app.use('/api/public/contracts', contractRoutes);

// Protected routes (authentication required)
app.use('/api/tenders', authenticateToken, tenderRoutes);
app.use('/api/bids', authenticateToken, bidRoutes);
app.use('/api/contracts', authenticateToken, contractRoutes);
app.use('/api/blockchain', authenticateToken, blockchainRoutes);
app.use('/api/audit', authenticateToken, auditRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/vendors', authenticateToken, vendorRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📦 Blockchain initialized with genesis block`);
    console.log(`🔐 Demo users available - check auth.js for credentials`);
});

module.exports = { app, blockchain };
