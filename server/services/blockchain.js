import crypto from "crypto";

class TripBlock {
  constructor(index, tripData, previousHash = "") {
    this.index = index;
    this.timestamp = new Date().toISOString();
    this.tripData = tripData;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.tripData)
      )
      .digest("hex");
  }
}

class TripBlockchain {
  constructor(existingChain = null) {
    if (existingChain && existingChain.length > 0) {
      // Load existing blockchain from DB
      this.chain = existingChain;
    } else {
      this.chain = [this.createGenesisBlock()];
    }
  }

  createGenesisBlock() {
    return new TripBlock(0, { note: "Genesis Trip Block" }, "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTrip(tripData) {
    // Enforce single-trip rule: remove previous block except genesis
    if (this.chain.length > 1) {
      this.chain.pop();
    }

    const newBlock = new TripBlock(
      this.chain.length,
      tripData,
      this.getLatestBlock().hash
    );
    this.chain.push(newBlock);
    return newBlock;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash) return false;
    }
    return true;
  }
}

export { TripBlock, TripBlockchain };
