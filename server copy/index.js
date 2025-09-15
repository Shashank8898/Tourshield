import { Blockchain, Transaction } from './blockchain.js';
import { generateKeyPair, signData } from '../QRcode/src/tourchain/cryptoUtils.js';

// Generate issuer keys
const { publicKey, privateKey } = generateKeyPair();

// Create blockchain
const tourChain = new Blockchain();

// Create a transaction (Alice's ID)
const dataFingerprint = 'sha256hashofAliceData';
const aliceSignature = signData(privateKey, dataFingerprint);

// const txAlice = new Transaction(
//   "did:tourshield:alice-8891",
//   dataFingerprint,
//   publicKey,
//   aliceSignature,
//   { fullName: "Alice Johnson", 
//     dateOfBirth: "1990-05",
//     nationality: "USA",
//     medicalConditions: "None",
//     ContactNumber: "+1234567890",
//     bloodGroup: "O+",
//   },
//     { tripId: "trip-1234", destinationTo: "Paris",destinationFrom: 'India', date: "2024-12-01" }
// );

// // Add and mine transaction
// tourChain.addTransaction(txAlice);
// tourChain.minePendingTransactions();

// console.log(JSON.stringify(tourChain, null, 2));
