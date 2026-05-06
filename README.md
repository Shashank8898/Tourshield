# TourShield 🛡️

**TourShield** is a tourist safety platform that combines blockchain technology, real-time emergency support, and trip monitoring to create a secure, transparent travel experience.

---

## Features

### 🔗 Blockchain-Powered Records
- Immutable, tamper-proof storage of trip data
- Cryptographically hashed blocks ensure data integrity
- Verifiable travel history through transparent records
- Proof-of-Work mechanism prevents malicious block injection

### 🆘 SOS Emergency Button
- Instantly notifies selected emergency contacts via Email or WhatsApp
- Automatically shares live location with the emergency alert
- Enables rapid response in critical situations

### 🗺️ Trip Monitoring
- Securely records and stores trip events on the blockchain
- Generates QR codes for easy trip data verification and retrieval
- Maintains a chronological log of travel activities

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Blockchain | Custom SHA-256 + Proof-of-Work |
| Notifications | Nodemailer |
| Real-time | Socket.io |
| Utilities | QR Code Generator |

---

## How It Works

1. **Register** — Users sign up and their data is securely stored in the system.
2. **Record Events** — Each trip event is hashed and added as a new block to the blockchain.
3. **Verify** — QR codes are generated per block for easy, on-demand verification.
4. **SOS Alert** — Users trigger an alert that sends their live location and message to trusted contacts.
5. **Mine** — New blocks are validated via Proof-of-Work before being committed to the chain.

---

## Demo

▶️ [Watch the demo on YouTube](https://youtu.be/2YxqpQj0ai8)

---

## Security

- **Hash integrity** — Block data is verified against its stored hash on every read.
- **Proof-of-Work** — Nonce-based mining prevents unauthorized block injection.
- **Transparency** — All trip events are auditable, building trust between travelers and verifiers.
