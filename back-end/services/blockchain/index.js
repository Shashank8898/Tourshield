// import { Blockchain, Transaction } from './blockchain.js';
// import { generateKeyPair, signData } from './cryptoUtils.js';

// // Generate issuer keys
// const { publicKey, privateKey } = generateKeyPair();

// // Create blockchain
// const tourChain = new Blockchain();

// // Create a transaction (Alice's ID)
// const dataFingerprint = 'sha256hashofAliceData';
// const aliceSignature = signData(privateKey, dataFingerprint);

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
// // tourChain.addTransaction(txAlice);
// // tourChain.minePendingTransactions();

// // const block = tourChain.chain[1];
// // block.transactions.forEach(tx => {
// //   console.log('Transaction ID:', tx.id);
// //   console.log('Tourist Name:', tx.metadata.fullName);
// //   console.log('Date of Birth:', tx.metadata.dateOfBirth);
// //   console.log('Nationality:', tx.metadata.nationality);
// //   console.log('Medical Conditions:', tx.metadata.medicalConditions);
// //   console.log('Contact Number:', tx.metadata.contactNumber);
// //   console.log('Blood Group:', tx.metadata.bloodGroup);
// //   console.log('Issued At:', new Date(tx.metadata.issuedAt).toLocaleString());
// //   console.log('Trip Event:', tx.tripEvent);
// //   console.log('-----');
// // });