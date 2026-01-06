const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const router = express.Router();

module.exports = (blockchain) => {
    // Submit bid
    router.post('/', async (req, res) => {
        try {
            const { tenderId, amount, proposal, timeline, fileUrl, fileName, fileType } = req.body;

            if (!tenderId || !amount || !proposal) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Verify tender exists
            const tenderBlock = blockchain.getBlockById(tenderId);
            if (!tenderBlock || tenderBlock.type !== 'TENDER') {
                return res.status(404).json({ error: 'Tender not found' });
            }

            const bid = {
                id: uuidv4(),
                tenderId,
                amount,
                proposal,
                timeline,
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                fileType: fileType || null,
                vendorEmail: req.user.email,
                vendorName: req.user.name,
                status: 'SUBMITTED',
                submittedAt: new Date().toISOString()
            };

            const block = blockchain.addBlock('BID', bid, req.user.mspId);

            // Call AI service for anomaly detection
            let aiAnalysis = null;
            try {
                const allBids = blockchain.getBlocksByType('BID')
                    .filter(b => b.data.tenderId === tenderId)
                    .map(b => b.data);

                const aiResponse = await axios.post(
                    `${process.env.AI_SERVICE_URL || 'http://localhost:5001'}/detect`,
                    { tenderId, bids: allBids }
                );
                aiAnalysis = aiResponse.data;
            } catch (aiError) {
                console.warn('AI service unavailable:', aiError.message);
            }

            // 🔔 CREATE NOTIFICATION FOR AUDITORS
            try {
                const notificationStorage = require('../utils/notification-storage');
                // Get all auditors from blockchain (users with role 'auditor')
                // For now, we'll use a hardcoded auditor email - in production, query user database
                const auditorEmail = 'auditor@demo.com';

                notificationStorage.createNotification({
                    id: uuidv4(),
                    userId: auditorEmail,
                    type: 'NEW_BID',
                    title: `📋 New Bid Submitted: ${tenderBlock.data.title}`,
                    message: `A new bid has been submitted by ${req.user.name} for tender "${tenderBlock.data.title}" worth ₹${amount.toLocaleString()}`,
                    data: {
                        bidId: bid.id,
                        tenderId,
                        tenderTitle: tenderBlock.data.title,
                        bidAmount: amount,
                        vendorName: req.user.name,
                        submittedAt: bid.submittedAt
                    },
                    read: false,
                    createdAt: new Date().toISOString()
                });
            } catch (notifError) {
                console.error('Failed to create notification:', notifError);
                // Don't fail the bid submission if notification fails
            }

            res.status(201).json({
                message: 'Bid submitted successfully',
                bid,
                blockHash: block.hash,
                blockIndex: block.index,
                aiAnalysis
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get bids for a tender
    router.get('/tender/:tenderId', (req, res) => {
        try {
            const bidBlocks = blockchain.getBlocksByType('BID')
                .filter(block => block.data.tenderId === req.params.tenderId);

            const bids = bidBlocks.map(block => ({
                ...block.data,
                blockHash: block.hash,
                blockIndex: block.index,
                timestamp: block.timestamp
            }));

            res.json({ bids });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
