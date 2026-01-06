const express = require('express');
const router = express.Router();
const auditStorage = require('../utils/audit-storage');


module.exports = (blockchain) => {
    // Save bid flag (APPROVED/FLAGGED)
    router.post('/flag-bid', (req, res) => {
        try {
            console.log('Flag-bid request:', { body: req.body, user: req.user });
            const { tenderId, bidId, flag } = req.body;

            // Check if user is authenticated
            if (!req.user) {
                console.error('No user in request');
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Verify user is auditor
            if (req.user.role !== 'auditor') {
                return res.status(403).json({ error: 'Only auditors can flag bids' });
            }

            // Validate flag value
            if (flag !== null && flag !== 'APPROVED' && flag !== 'FLAGGED') {
                return res.status(400).json({ error: 'Invalid flag value' });
            }

            // Save flag
            const audit = auditStorage.saveBidFlag(tenderId, bidId, flag);
            console.log('Flag saved successfully:', audit);

            res.json({
                success: true,
                message: 'Bid flag saved',
                bidFlags: audit.bidFlags
            });
        } catch (error) {
            console.error('Error in flag-bid:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Submit audit review for a tender
    router.post('/submit/:tenderId', (req, res) => {
        try {
            console.log('Submit audit request:', { params: req.params, body: req.body, user: req.user });
            const { tenderId } = req.params;
            const { notes } = req.body;

            // Check if user is authenticated
            if (!req.user) {
                console.error('No user in request');
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Verify user is auditor
            if (req.user.role !== 'auditor') {
                return res.status(403).json({ error: 'Only auditors can submit audit reviews' });
            }

            // Submit audit
            const audit = auditStorage.submitAudit(tenderId, req.user.email, notes);
            console.log('Audit submitted successfully:', audit);

            res.json({
                success: true,
                message: 'Audit review submitted successfully',
                audit: {
                    submitted: audit.submitted,
                    submittedAt: audit.submittedAt,
                    submittedBy: audit.submittedBy,
                    notes: audit.notes
                }
            });
        } catch (error) {
            console.error('Error in submit audit:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Clear audit data for a tender (for testing)
    router.delete('/clear/:tenderId', (req, res) => {
        try {
            const { tenderId } = req.params;
            console.log('Clearing audit data for tender:', tenderId);

            auditStorage.clearAudit(tenderId);

            res.json({
                success: true,
                message: 'Audit data cleared for tender'
            });
        } catch (error) {
            console.error('Error clearing audit:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Clear all audit data (for testing)
    router.delete('/clear-all', (req, res) => {
        try {
            console.log('Clearing all audit data');
            auditStorage.clearAll();

            res.json({
                success: true,
                message: 'All audit data cleared'
            });
        } catch (error) {
            console.error('Error clearing all audits:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get bid flags for a tender
    router.get('/review/:tenderId', (req, res) => {
        try {
            const { tenderId } = req.params;
            const bidFlags = auditStorage.getBidFlags(tenderId);

            res.json({
                tenderId,
                bidFlags
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });


    // Get audit status for a tender (updated to use new storage)
    router.post('/validate/:tenderId', (req, res) => {
        try {
            const { tenderId } = req.params;
            const { auditStatus, aiRiskScore, aiExplanation, auditorComments } = req.body;

            // Verify user is auditor
            if (req.user.role !== 'auditor') {
                return res.status(403).json({ error: 'Only auditors can validate tenders' });
            }

            // Validate audit status
            const validStatuses = ['CLEARED', 'FLAGGED', 'HIGH_RISK'];
            if (!validStatuses.includes(auditStatus)) {
                return res.status(400).json({ error: 'Invalid audit status' });
            }

            // Find tender on blockchain
            const tenderBlock = blockchain.getBlockById(tenderId);
            if (!tenderBlock || tenderBlock.type !== 'TENDER') {
                return res.status(404).json({ error: 'Tender not found' });
            }

            // Check if already validated
            const existingAudit = blockchain.getChain().find(
                block => block.type === 'AUDIT' && block.data.tenderId === tenderId
            );
            if (existingAudit) {
                return res.status(400).json({ error: 'Tender already validated' });
            }

            // Create audit record
            const auditData = {
                id: require('uuid').v4(),
                tenderId,
                tenderTitle: tenderBlock.data.title,
                auditStatus,
                aiRiskScore: aiRiskScore || 'PENDING',
                aiExplanation: aiExplanation || 'No AI analysis available',
                auditorComments: auditorComments || '',
                auditorEmail: req.user.email,
                auditorName: req.user.name,
                validatedAt: new Date().toISOString()
            };

            // Record on blockchain
            const block = blockchain.addBlock('AUDIT', auditData, req.user.mspId);

            res.status(201).json({
                message: 'Audit validation recorded on blockchain',
                audit: auditData,
                blockHash: block.hash,
                blockIndex: block.index
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get audit status for a tender (using new storage system)
    router.get('/status/:tenderId', (req, res) => {
        try {
            console.log('Get audit status request:', { params: req.params });
            const { tenderId } = req.params;

            // Get audit status from storage
            const status = auditStorage.getAuditStatus(tenderId);
            console.log('Audit status retrieved:', status);

            res.json(status);
        } catch (error) {
            console.error('Error getting audit status:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Get all pending validations (for auditors)
    router.get('/pending', (req, res) => {
        try {
            // Verify user is auditor
            if (req.user.role !== 'auditor') {
                return res.status(403).json({ error: 'Only auditors can view pending validations' });
            }

            // Get all tenders
            const tenderBlocks = blockchain.getBlocksByType('TENDER');

            // Get all audits
            const auditBlocks = blockchain.getBlocksByType('AUDIT');
            const validatedTenderIds = new Set(auditBlocks.map(b => b.data.tenderId));

            // Find tenders that are closed but not validated
            const pendingValidations = tenderBlocks
                .filter(block => {
                    const tender = block.data;
                    const isClosed = new Date(tender.deadline) < new Date();
                    const notValidated = !validatedTenderIds.has(tender.id);
                    return isClosed && notValidated && tender.status !== 'AWARDED';
                })
                .map(block => ({
                    ...block.data,
                    blockHash: block.hash,
                    blockIndex: block.index,
                    bidCount: blockchain.getChain().filter(
                        b => b.type === 'BID' && b.data.tenderId === block.data.id
                    ).length
                }));

            res.json({ pendingValidations });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
