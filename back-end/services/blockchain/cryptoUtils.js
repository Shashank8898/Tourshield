const crypto = require('crypto');

// Generate key pair (only once per issuer)
function generateKeyPair() {
  return crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
}

// Sign data
function signData(privateKey, data) {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'hex');
}

// Verify signature
function verifySignature(publicKey, data, signature) {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  verify.end();
  return verify.verify(publicKey, signature, 'hex');
}

module.exports = {
  generateKeyPair,
  signData,
  verifySignature
};
