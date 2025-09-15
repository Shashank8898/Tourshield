import mongoose from "mongoose";



export async function connectToMongoDB() {
  try {
    const uri = process.env.MONGO_URL; // Your MongoDB connection string in .env
    if (!uri) throw new Error("MONGO_URI not defined in .env");

    await mongoose.connect(uri, {
   
    });

    console.log("✅ Connected to MongoDB");
    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Stop the app if DB connection fails
  }
}