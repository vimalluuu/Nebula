const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

module.exports = (blockchain) => {
    // Create tender
    router.post('/', (req, res) => {
        try {
            const { title, description, budget, deadline, requirements, fileUrl, fileName, fileType } = req.body;

            if (!title || !budget || !deadline) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const tender = {
                id: uuidv4(),
                title,
                description,
                budget,
                deadline,
                requirements,
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                fileType: fileType || null,
                status: 'OPEN',
                createdBy: req.user.email,
                createdAt: new Date().toISOString()
            };

            const block = blockchain.addBlock('TENDER', tender, req.user.mspId);

            res.status(201).json({
                message: 'Tender created successfully',
                tender,
                blockHash: block.hash,
                blockIndex: block.index
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get all tenders
    router.get('/', (req, res) => {
        try {
            const tenderBlocks = blockchain.getBlocksByType('TENDER');
            const tenders = tenderBlocks.map(block => ({
                ...block.data,
                blockHash: block.hash,
                blockIndex: block.index,
                timestamp: block.timestamp
            }));

            res.json({ tenders });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get tender by ID
    router.get('/:id', (req, res) => {
        try {
            const block = blockchain.getBlockById(req.params.id);

            if (!block || block.type !== 'TENDER') {
                return res.status(404).json({ error: 'Tender not found' });
            }

            res.json({
                tender: block.data,
                blockHash: block.hash,
                blockIndex: block.index,
                timestamp: block.timestamp
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
