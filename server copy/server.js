import express from "express";
import QRCode from "qrcode";
import cors from "cors";
import { Blockchain, Transaction } from './blockchain.js';
import { generateKeyPair, signData } from './cryptoUtils.js';



const app = express();
app.use(cors());
app.use(express.json());


// Generate issuer keys
const { publicKey, privateKey } = generateKeyPair();

// Create blockchain
const tourChain = new Blockchain();

// Create a transaction (Alice's ID)
const dataFingerprint = 'sha256hashofAliceData';
const aliceSignature = signData(privateKey, dataFingerprint);

const txAlice = new Transaction(
  "did:tourshield:alice-8891",
  dataFingerprint,
  publicKey,
  aliceSignature,
  { fullName: "Alice Johnson", 
    dateOfBirth: "1990-05",
    nationality: "USA",
    medicalConditions: "None",
    ContactNumber: "+1234567890",
    bloodGroup: "O+",
  },
    { tripId: "trip-1234", destinationTo: "Paris",destinationFrom: 'India', date: "2024-12-01" }
);

// Add and mine transaction
tourChain.addTransaction(txAlice);
tourChain.minePendingTransactions();

// API to get block QR
app.get("/block/:index/qr", async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const block = tourChain.findBlockByIndex(index);
    if (!block) return res.status(404).json({ error: "Block not found" });

    const blockString = JSON.stringify(block, null, 2);
    const qrImage = await QRCode.toDataURL(blockString); // base64 image

    res.json({ qr: qrImage }); // send base64 to frontend
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "QR generation failed" });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
