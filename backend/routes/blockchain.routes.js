const express = require('express');
const router = express.Router();

module.exports = (blockchain) => {
    // Get full blockchain
    router.get('/', (req, res) => {
        try {
            const chain = blockchain.getChain();
            res.json({
                chain,
                length: chain.length,
                latestBlock: blockchain.getLatestBlock()
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Validate blockchain
    router.get('/validate', (req, res) => {
        try {
            const validation = blockchain.validateChain();
            res.json(validation);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
