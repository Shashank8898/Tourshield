dotenv.config();


import express from "express";
import cors from "cors";
import dotenv from 'dotenv'; 
import { TripBlock, TripBlockchain } from "./services/blockchain.js";
import authRoutes from "./routes/authRoutes.js";  // ⬅️ import your router
import { connectToMongoDB } from "./config/db.js";
import User from "./model/User.js";
import crypto from "crypto";

connectToMongoDB();

const app = express();
const PORT = process.env.PORT
app.use(express.json()); // <-- This parses JSON requests

// Middleware
app.use(cors());

 

app.post("/trip", async (req, res) => {
  try {
    const {
      userId,
      destination,
      startDate,
      endDate,
      tripType,
      transport,
      accommodation,
      activities,
    } = req.body;

    console.log("Received trip data:", req.body);

    // Validate required fields
    if (!userId || !destination || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required trip information." });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Normalize activities
    const activitiesArray = Array.isArray(activities)
      ? activities
      : activities?.split(",").map((a) => a.trim()) || [];

    // Create trip info object
    const tripInfo = {
      destination,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      tripType: tripType || "N/A",
      transport: transport || "N/A",
      accommodation: accommodation || "N/A",
      activities: activitiesArray,
    };

    // Generate SHA-256 hash of tripInfo
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(tripInfo))
      .digest("hex");

    // Save trip info + hash as tripId in user document
    user.tripId = hash; 
    user.trips = [...(user.trips || []), { ...tripInfo, tripId: hash }]; // optional trips array
    await user.save();

    res.json({
      message: "Trip Digital ID created successfully!",
      tripId: hash,
      tripInfo,
    });

  } catch (err) {
    console.error("Error creating trip ID:", err);
    res.status(500).json({ error: "Server error" });
  }
});



app.use('/User',authRoutes)

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
