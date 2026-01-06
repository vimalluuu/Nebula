const Block = require('./Block');

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
    }

    createGenesisBlock() {
        return new Block(0, Date.now(), 'GENESIS', { message: 'Genesis Block' }, 'SYSTEM', '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(type, data, mspId) {
        const latestBlock = this.getLatestBlock();
        const newBlock = new Block(
            latestBlock.index + 1,
            Date.now(),
            type,
            data,
            mspId,
            latestBlock.hash
        );
        this.chain.push(newBlock);
        return newBlock;
    }

    getChain() {
        return this.chain;
    }

    validateChain() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Verify hash integrity
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return { valid: false, error: `Block ${i} has been tampered with` };
            }

            // Verify chain linkage
            if (currentBlock.previousHash !== previousBlock.hash) {
                return { valid: false, error: `Block ${i} chain linkage broken` };
            }
        }
        return { valid: true };
    }

    getBlocksByType(type) {
        return this.chain.filter(block => block.type === type);
    }

    getBlockById(id) {
        return this.chain.find(block => block.data.id === id);
    }

    // MSP-based access control simulation
    canAccess(mspId, blockType, action) {
        const accessRules = {
            'AgenciesMSP': ['TENDER', 'BID', 'CONTRACT', 'PAYMENT'],
            'VendorsMSP': ['TENDER', 'BID'],
            'AuditorsMSP': ['TENDER', 'BID', 'CONTRACT', 'PAYMENT'],
            'PublicMSP': ['TENDER', 'CONTRACT']
        };

        return accessRules[mspId]?.includes(blockType) || false;
    }
}

module.exports = Blockchain;
