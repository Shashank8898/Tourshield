import crypto from 'crypto';

// Generate key pair (only once per issuer)
export function generateKeyPair() {
  return crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
}

// Sign data
export function signData(privateKey, data) {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'hex');
}

// Verify signature
export function verifySignature(publicKey, data, signature) {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  verify.end();
  return verify.verify(publicKey, signature, 'hex');
}
