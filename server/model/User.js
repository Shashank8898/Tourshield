// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String }, // hashed password for normal signup
  googleId: { type: String }, // for google signup
  createdAt: { type: Date, default: Date.now },
  tripId: {
    type: String, 
    required: false,
  },
});

export default mongoose.model("User", userSchema);
