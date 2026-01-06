const crypto = require('crypto');

class Block {
  constructor(index, timestamp, type, data, mspId, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.type = type; // 'TENDER', 'BID', 'CONTRACT', 'PAYMENT'
    this.data = data;
    this.mspId = mspId; // VendorsMSP, AgenciesMSP, AuditorsMSP, PublicMSP
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
        this.previousHash +
        this.timestamp +
        this.type +
        JSON.stringify(this.data) +
        this.mspId
      )
      .digest('hex');
  }
}

module.exports = Block;
