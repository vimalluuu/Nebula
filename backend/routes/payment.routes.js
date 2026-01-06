const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

module.exports = (blockchain) => {
    // Create a payment transaction
    router.post('/create', (req, res) => {
        try {
            const { contractId, amount, milestone, description, paymentType } = req.body;

            // Verify user is government official
            if (req.user.role !== 'government') {
                return res.status(403).json({ error: 'Only government officials can create payments' });
            }

            // Find the contract
            const contractBlock = blockchain.getBlockById(contractId);
            if (!contractBlock || contractBlock.type !== 'CONTRACT') {
                return res.status(404).json({ error: 'Contract not found' });
            }

            const contract = contractBlock.data;

            // Create payment record
            const payment = {
                id: uuidv4(),
                contractId,
                tenderId: contract.tenderId,
                vendorEmail: contract.winningBid.vendorEmail,
                vendorName: contract.winningBid.vendorName,
                amount: parseFloat(amount),
                milestone: milestone || 'Payment',
                description: description || 'Contract payment',
                paymentType: paymentType || 'MILESTONE',
                status: 'DISBURSED',
                approvedBy: req.user.email,
                disbursedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };

            // Record on blockchain
            const block = blockchain.addBlock('PAYMENT', payment, req.user.mspId);

            res.status(201).json({
                message: 'Payment recorded successfully',
                payment,
                blockHash: block.hash,
                blockIndex: block.index
            });
        } catch (error) {
            console.error('Payment creation error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Record milestone completion
    router.post('/milestone', (req, res) => {
        try {
            const { contractId, milestoneName, description } = req.body;

            // Verify user is government official
            if (req.user.role !== 'government') {
                return res.status(403).json({ error: 'Only government officials can record milestones' });
            }

            // Find the contract
            const contractBlock = blockchain.getBlockById(contractId);
            if (!contractBlock || contractBlock.type !== 'CONTRACT') {
                return res.status(404).json({ error: 'Contract not found' });
            }

            const milestone = {
                id: uuidv4(),
                contractId,
                name: milestoneName,
                description: description || '',
                completedBy: req.user.email,
                completedAt: new Date().toISOString()
            };

            // Record on blockchain
            const block = blockchain.addBlock('MILESTONE', milestone, req.user.mspId);

            res.status(201).json({
                message: 'Milestone recorded successfully',
                milestone,
                blockHash: block.hash,
                blockIndex: block.index
            });
        } catch (error) {
            console.error('Milestone recording error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get all payments for a contract
    router.get('/contract/:contractId', (req, res) => {
        try {
            const { contractId } = req.params;

            const paymentBlocks = blockchain.getChain().filter(
                block => block.type === 'PAYMENT' && block.data.contractId === contractId
            );

            const payments = paymentBlocks.map(block => ({
                ...block.data,
                blockHash: block.hash,
                blockIndex: block.index,
                timestamp: block.timestamp
            }));

            // Calculate total paid
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

            res.json({
                payments,
                totalPaid,
                count: payments.length
            });
        } catch (error) {
            console.error('Get payments error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get all payments for a vendor
    router.get('/vendor/:vendorEmail', (req, res) => {
        try {
            const { vendorEmail } = req.params;

            const paymentBlocks = blockchain.getChain().filter(
                block => block.type === 'PAYMENT' && block.data.vendorEmail === vendorEmail
            );

            const payments = paymentBlocks.map(block => ({
                ...block.data,
                blockHash: block.hash,
                blockIndex: block.index,
                timestamp: block.timestamp
            }));

            // Calculate total received
            const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

            res.json({
                payments,
                totalReceived,
                count: payments.length
            });
        } catch (error) {
            console.error('Get vendor payments error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get all payments (government/auditor only)
    router.get('/all', (req, res) => {
        try {
            // Verify user is government or auditor
            if (req.user.role !== 'government' && req.user.role !== 'auditor') {
                return res.status(403).json({ error: 'Access denied' });
            }

            const paymentBlocks = blockchain.getBlocksByType('PAYMENT');
            const payments = paymentBlocks.map(block => ({
                ...block.data,
                blockHash: block.hash,
                blockIndex: block.index,
                timestamp: block.timestamp
            }));

            // Calculate total disbursed
            const totalDisbursed = payments.reduce((sum, p) => sum + p.amount, 0);

            res.json({
                payments,
                totalDisbursed,
                count: payments.length
            });
        } catch (error) {
            console.error('Get all payments error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get milestones for a contract
    router.get('/milestones/:contractId', (req, res) => {
        try {
            const { contractId } = req.params;

            const milestoneBlocks = blockchain.getChain().filter(
                block => block.type === 'MILESTONE' && block.data.contractId === contractId
            );

            const milestones = milestoneBlocks.map(block => ({
                ...block.data,
                blockHash: block.hash,
                blockIndex: block.index,
                timestamp: block.timestamp
            }));

            res.json({
                milestones,
                count: milestones.length
            });
        } catch (error) {
            console.error('Get milestones error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
