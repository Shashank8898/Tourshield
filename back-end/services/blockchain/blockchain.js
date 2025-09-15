const crypto = require("crypto");
const { verifySignature } = require("./cryptoUtils.js");

class Transaction {
  constructor(id, dataFingerprint, issuerPublicKey, signature, metadata = {}, tripEvent = null) {
    this.id = id;
    this.dataFingerprint = dataFingerprint;
    this.issuerPublicKey = issuerPublicKey;
    this.signature = signature;
    this.metadata = {
      FullName: metadata.fullName,
      DateOfBirth: metadata.dateOfBirth,
      Nationality: metadata.nationality,
      MedicalConditions: metadata.medicalConditions,
      ContactNumber: metadata.ContactNumber,
      BloodGroup: metadata.bloodGroup || "Unknown",
      IssuedAt: Date.now(),
    };
    this.tripEvent = tripEvent;
  }

  // Whenever the tourist needs to be verified
  verify() {
    return verifySignature(this.issuerPublicKey, this.dataFingerprint, this.signature);
  }
}

class Block {
  constructor(index, timestamp, transactions, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
    this.transactions = transactions;
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(this.index + this.timestamp + this.nonce + this.previousHash + JSON.stringify(this.transactions))
      .digest("hex");
  }

  // Mine block (optional)
  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      this.nonce++;
      this.hash = this.calculateHash();
      console.log("Mining... Nonce:", this.nonce, "Hash:", this.hash);
    }
    console.log("Block mined:", this.hash);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
  }

  createGenesisBlock() {
    return new Block(0, "01/01/2000", [], "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction) {
    this.pendingTransactions.push(transaction);
  }

  minePendingTransactions() {
    const block = new Block(
      this.chain.length,
      Date.now().toString(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);
    this.chain.push(block);
    this.pendingTransactions = [];
  }
}

module.exports = { Transaction, Block, Blockchain };
