const express = require('express');
const router = express.Router();

module.exports = (blockchain) => {
    // Register a new vendor
    router.post('/register', (req, res) => {
        try {
            const {
                name, companyName, registrationNumber,
                address, phone, category, yearsInBusiness
            } = req.body;

            // Check if vendor already exists
            const existingVendor = blockchain.getChain().find(
                block => block.type === 'VENDOR' && block.data.email === req.user.email
            );

            if (existingVendor) {
                return res.status(400).json({ error: 'Vendor already registered' });
            }

            const vendor = {
                email: req.user.email,
                name,
                companyName,
                registrationNumber,
                address,
                phone,
                category,
                yearsInBusiness: parseInt(yearsInBusiness),
                status: 'ACTIVE',
                totalBids: 0,
                wonContracts: 0,
                completedContracts: 0,
                averageRating: 0,
                totalValueDelivered: 0,
                registeredAt: new Date().toISOString()
            };

            // Record on blockchain
            const block = blockchain.addBlock('VENDOR', vendor, req.user.mspId);

            res.status(201).json({
                message: 'Vendor registered successfully',
                vendor,
                blockHash: block.hash,
                blockIndex: block.index
            });
        } catch (error) {
            console.error('Vendor registration error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get vendor profile
    router.get('/:email', (req, res) => {
        try {
            const { email } = req.params;

            // Find vendor block
            const vendorBlock = blockchain.getChain().find(
                block => block.type === 'VENDOR' && block.data.email === email
            );

            if (!vendorBlock) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const vendor = { ...vendorBlock.data };

            // Get all bids by this vendor
            const bidBlocks = blockchain.getChain().filter(
                block => block.type === 'BID' && block.data.vendorEmail === email
            );
            vendor.totalBids = bidBlocks.length;

            // Get all contracts won by this vendor
            const contractBlocks = blockchain.getChain().filter(
                block => block.type === 'CONTRACT' && block.data.winningBid.vendorEmail === email
            );
            vendor.wonContracts = contractBlocks.length;

            // Calculate total value delivered
            vendor.totalValueDelivered = contractBlocks.reduce(
                (sum, block) => sum + block.data.winningBid.amount, 0
            );

            // Get all ratings
            const ratingBlocks = blockchain.getChain().filter(
                block => block.type === 'VENDOR_RATING' && block.data.vendorEmail === email
            );

            const ratings = ratingBlocks.map(block => ({
                ...block.data,
                blockHash: block.hash,
                blockIndex: block.index
            }));

            if (ratings.length > 0) {
                vendor.averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
            }

            vendor.ratings = ratings;

            res.json({
                vendor,
                blockHash: vendorBlock.hash,
                blockIndex: vendorBlock.index
            });
        } catch (error) {
            console.error('Get vendor error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get all vendors
    router.get('/', (req, res) => {
        try {
            const vendorBlocks = blockchain.getBlocksByType('VENDOR');

            const vendors = vendorBlocks.map(block => {
                const vendor = { ...block.data };

                // Get bid count
                const bidCount = blockchain.getChain().filter(
                    b => b.type === 'BID' && b.data.vendorEmail === vendor.email
                ).length;
                vendor.totalBids = bidCount;

                // Get contract count
                const contractCount = blockchain.getChain().filter(
                    b => b.type === 'CONTRACT' && b.data.winningBid.vendorEmail === vendor.email
                ).length;
                vendor.wonContracts = contractCount;

                // Get ratings
                const ratingBlocks = blockchain.getChain().filter(
                    b => b.type === 'VENDOR_RATING' && b.data.vendorEmail === vendor.email
                );

                if (ratingBlocks.length > 0) {
                    vendor.averageRating = ratingBlocks.reduce((sum, r) => sum + r.data.rating, 0) / ratingBlocks.length;
                }

                return {
                    ...vendor,
                    blockHash: block.hash,
                    blockIndex: block.index
                };
            });

            res.json({ vendors });
        } catch (error) {
            console.error('Get all vendors error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Rate a vendor
    router.post('/rate', (req, res) => {
        try {
            const { vendorEmail, contractId, rating, review } = req.body;

            // Verify user is government official
            if (req.user.role !== 'government') {
                return res.status(403).json({ error: 'Only government officials can rate vendors' });
            }

            // Validate rating
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ error: 'Rating must be between 1 and 5' });
            }

            // Check if contract exists
            const contractBlock = blockchain.getBlockById(contractId);
            if (!contractBlock || contractBlock.type !== 'CONTRACT') {
                return res.status(404).json({ error: 'Contract not found' });
            }

            // Check if contract belongs to this vendor
            if (contractBlock.data.winningBid.vendorEmail !== vendorEmail) {
                return res.status(400).json({ error: 'Contract does not belong to this vendor' });
            }

            // Check if already rated
            const existingRating = blockchain.getChain().find(
                block => block.type === 'VENDOR_RATING' &&
                    block.data.contractId === contractId
            );

            if (existingRating) {
                return res.status(400).json({ error: 'Contract already rated' });
            }

            const vendorRating = {
                vendorEmail,
                contractId,
                rating: parseInt(rating),
                review: review || '',
                ratedBy: req.user.email,
                ratedAt: new Date().toISOString()
            };

            // Record on blockchain
            const block = blockchain.addBlock('VENDOR_RATING', vendorRating, req.user.mspId);

            res.status(201).json({
                message: 'Vendor rated successfully',
                rating: vendorRating,
                blockHash: block.hash,
                blockIndex: block.index
            });
        } catch (error) {
            console.error('Vendor rating error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Blacklist a vendor
    router.post('/blacklist', (req, res) => {
        try {
            const { vendorEmail, reason } = req.body;

            // Verify user is government official or auditor
            if (req.user.role !== 'government' && req.user.role !== 'auditor') {
                return res.status(403).json({ error: 'Only government officials or auditors can blacklist vendors' });
            }

            const blacklistRecord = {
                vendorEmail,
                reason,
                blacklistedBy: req.user.email,
                blacklistedAt: new Date().toISOString(),
                status: 'BLACKLISTED'
            };

            // Record on blockchain
            const block = blockchain.addBlock('VENDOR_BLACKLIST', blacklistRecord, req.user.mspId);

            res.status(201).json({
                message: 'Vendor blacklisted successfully',
                blacklist: blacklistRecord,
                blockHash: block.hash,
                blockIndex: block.index
            });
        } catch (error) {
            console.error('Vendor blacklist error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Check if vendor is blacklisted
    router.get('/blacklist/:vendorEmail', (req, res) => {
        try {
            const { vendorEmail } = req.params;

            const blacklistBlock = blockchain.getChain().find(
                block => block.type === 'VENDOR_BLACKLIST' &&
                    block.data.vendorEmail === vendorEmail
            );

            if (blacklistBlock) {
                res.json({
                    isBlacklisted: true,
                    blacklist: {
                        ...blacklistBlock.data,
                        blockHash: blacklistBlock.hash,
                        blockIndex: blacklistBlock.index
                    }
                });
            } else {
                res.json({ isBlacklisted: false });
            }
        } catch (error) {
            console.error('Check blacklist error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
