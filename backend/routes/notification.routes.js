const express = require('express');
const router = express.Router();

module.exports = (blockchain) => {
    // Get notifications for a vendor
    router.get('/:vendorEmail', (req, res) => {
        try {
            const { vendorEmail } = req.params;

            // Verify user is accessing their own notifications
            if (req.user.email !== vendorEmail && req.user.role !== 'auditor') {
                return res.status(403).json({ error: 'Cannot access other vendor notifications' });
            }

            // Find all contracts awarded to this vendor
            const contractBlocks = blockchain.getBlocksByType('CONTRACT');
            const vendorContracts = contractBlocks.filter(
                block => block.data.winningBid.vendorEmail === vendorEmail
            );

            // Find all bids by this vendor
            const bidBlocks = blockchain.getBlocksByType('BID');
            const vendorBids = bidBlocks.filter(
                block => block.data.vendorEmail === vendorEmail
            );

            const notifications = [];

            // Add award notifications
            vendorContracts.forEach(block => {
                notifications.push({
                    id: block.data.id,
                    type: 'AWARD',
                    title: `Tender Awarded: ${block.data.tenderTitle}`,
                    message: `Congratulations! You have been awarded the tender "${block.data.tenderTitle}"`,
                    contractValue: block.data.winningBid.amount,
                    awardedAt: block.data.awardedAt,
                    blockHash: block.hash,
                    blockIndex: block.index,
                    read: false
                });
            });

            // Add bid confirmation notifications
            vendorBids.forEach(block => {
                notifications.push({
                    id: block.data.id,
                    type: 'BID_SUBMITTED',
                    title: 'Bid Submitted Successfully',
                    message: `Your bid for tender has been recorded on blockchain`,
                    bidAmount: block.data.amount,
                    submittedAt: block.data.submittedAt,
                    blockHash: block.hash,
                    blockIndex: block.index,
                    read: true // Mark old notifications as read
                });
            });

            // Sort by date (newest first)
            notifications.sort((a, b) =>
                new Date(b.awardedAt || b.submittedAt) - new Date(a.awardedAt || a.submittedAt)
            );

            res.json({ notifications });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
