import mongoose from "mongoose";
import { ILevel } from "./level.interface";

export interface LevelDocument extends Document, ILevel {}

const levelSchema = new mongoose.Schema<LevelDocument>({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },
  order: { type: Number, required: true },
  tasks: { type: String, enum: ["flash", "test", "dictation"], required: true },
  requiredScore: { type: Number, default: 80 },
});

levelSchema.index({ moduleId: 1, order: 1 }, { unique: true });

export default mongoose.model<LevelDocument>("Level", levelSchema);
