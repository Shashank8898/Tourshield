// Block.js
import mongoose from "mongoose";

export const BlockSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true }, // ensures 1 ID per user
  index: { type: Number, required: true },
  timestamp: { type: String, required: true },
  data: { type: Object, required: true },
  previousHash: { type: String, default: "" },
  hash: { type: String, required: true },
});

export const Block = mongoose.model("Block", BlockSchema);
