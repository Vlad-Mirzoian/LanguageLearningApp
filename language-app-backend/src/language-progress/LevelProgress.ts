import mongoose from "mongoose";
import { ILevelProgress } from "./level-progress.interface";

export interface LevelProgressDocument extends Document, ILevelProgress {}

const levelProgressSchema = new mongoose.Schema<LevelProgressDocument>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  languageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Language",
    required: true,
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },
  levelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Level",
    required: true,
  },
  bestScore: { type: Number, default: 0 },
  unlocked: { type: Boolean, default: false },
});

levelProgressSchema.index(
  { userId: 1, languageId: 1, moduleId: 1, levelId: 1 },
  { unique: true }
);

export default mongoose.model<LevelProgressDocument>(
  "LevelProgress",
  levelProgressSchema
);
