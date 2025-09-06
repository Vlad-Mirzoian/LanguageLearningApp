import mongoose from "mongoose";
import { IModuleProgress } from "./module-progress.interface";

export interface ModuleProgressDocument extends Document, IModuleProgress {}

const moduleProgressSchema = new mongoose.Schema<ModuleProgressDocument>({
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
  totalLevels: { type: Number, default: 3 },
  completedLevels: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  unlocked: { type: Boolean, default: false },
  achievements: [{ type: String }],
});

moduleProgressSchema.index(
  { userId: 1, languageId: 1, moduleId: 1 },
  { unique: true }
);

export default mongoose.model<ModuleProgressDocument>(
  "ModuleProgress",
  moduleProgressSchema
);
