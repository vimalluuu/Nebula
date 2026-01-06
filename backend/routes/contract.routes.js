const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

module.exports = (blockchain) => {
    // Award contract with audit validation
    router.post('/award', (req, res) => {
        try {
            const { tenderId, bidId, reason, justification } = req.body;

            if (!tenderId || !bidId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Find tender
            const tenderBlock = blockchain.getBlockById(tenderId);
            if (!tenderBlock || tenderBlock.type !== 'TENDER') {
                return res.status(404).json({ error: 'Tender not found' });
            }

            // Check if contract already exists for this tender
            const existingContract = blockchain.getChain().find(
                block => block.type === 'CONTRACT' && block.data.tenderId === tenderId
            );
            if (existingContract) {
                return res.status(400).json({
                    error: 'Contract already awarded',
                    message: 'This tender has already been awarded to a vendor',
                    existingContract: existingContract.data
                });
            }

            // ⭐ MANDATORY AUDIT VALIDATION CHECK (using new audit storage system)
            const auditStorage = require('../utils/audit-storage');
            const auditStatus = auditStorage.getAuditStatus(tenderId);

            if (!auditStatus.submitted) {
                return res.status(403).json({
                    error: 'Audit validation required',
                    message: 'Tender must be reviewed and submitted by auditor before award can be made'
                });
            }

            // ⭐ RISK-BASED AWARD CONTROLS
            // Check if the specific bid being awarded was flagged
            const bidFlag = auditStatus.bidFlags[bidId];

            if (bidFlag === 'FLAGGED') {
                return res.status(403).json({
                    error: 'Cannot award flagged bid',
                    message: 'This bid was flagged by the auditor and cannot be awarded',
                    auditDetails: {
                        flaggedBids: auditStatus.flaggedBids,
                        approvedBids: auditStatus.approvedBids
                    }
                });
            }

            if (bidFlag !== 'APPROVED') {
                return res.status(403).json({
                    error: 'Bid not approved',
                    message: 'This bid was not approved by the auditor',
                    auditDetails: {
                        bidStatus: bidFlag || 'NOT_REVIEWED',
                        approvedBids: auditStatus.approvedBids
                    }
                });
            }

            // Find winning bid
            const bidBlock = blockchain.getBlockById(bidId);
            if (!bidBlock || bidBlock.type !== 'BID') {
                return res.status(404).json({ error: 'Bid not found' });
            }

            if (bidBlock.data.tenderId !== tenderId) {
                return res.status(400).json({ error: 'Bid does not belong to this tender' });
            }

            // Create contract
            const contract = {
                id: uuidv4(),
                tenderId,
                bidId,
                tenderTitle: tenderBlock.data.title,
                winningBid: bidBlock.data,
                awardedBy: req.user.email,
                reason: reason || 'Best proposal',
                justification: justification || null, // Store justification if provided
                auditStatus: auditStatus, // Record audit status in contract
                status: 'AWARDED',
                awardedAt: new Date().toISOString()
            };

            // Record on blockchain
            const block = blockchain.addBlock('CONTRACT', contract, req.user.mspId);

            // Update tender status
            tenderBlock.data.status = 'AWARDED';

            // 🔔 CREATE NOTIFICATION FOR VENDOR
            try {
                const notificationStorage = require('../utils/notification-storage');
                notificationStorage.createNotification({
                    id: uuidv4(),
                    userId: bidBlock.data.vendorEmail,
                    type: 'CONTRACT_AWARDED',
                    title: `🎉 Contract Awarded: ${tenderBlock.data.title}`,
                    message: `Congratulations! You have been awarded the contract for "${tenderBlock.data.title}" worth ₹${bidBlock.data.amount.toLocaleString()}`,
                    data: {
                        contractId: contract.id,
                        tenderId,
                        tenderTitle: tenderBlock.data.title,
                        contractValue: bidBlock.data.amount,
                        awardedAt: contract.awardedAt
                    },
                    read: false,
                    createdAt: new Date().toISOString()
                });
            } catch (notifError) {
                console.error('Failed to create notification:', notifError);
                // Don't fail the contract award if notification fails
            }

            res.status(201).json({
                message: 'Contract awarded successfully',
                contract,
                blockHash: block.hash,
                blockIndex: block.index,
                auditStatus: auditStatus
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get all contracts
    router.get('/', (req, res) => {
        try {
            const contractBlocks = blockchain.getBlocksByType('CONTRACT');
            const contracts = contractBlocks.map(block => ({
                ...block.data,
                blockHash: block.hash,
                blockIndex: block.index,
                timestamp: block.timestamp
            }));

            res.json({ contracts });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
