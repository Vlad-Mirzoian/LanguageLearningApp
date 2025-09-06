import mongoose from "mongoose";
import { IModule } from "./module.interface";

export interface ModuleDocument extends Document, IModule {}

const moduleSchema = new mongoose.Schema<ModuleDocument>({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  languageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Language",
    required: true,
  },
  order: { type: Number, required: true },
  requiredScore: { type: Number, default: 80 },
  wordsCount: { type: Number, default: 0 },
});

moduleSchema.index({ languageId: 1, order: 1 }, { unique: true });

export default mongoose.model<ModuleDocument>("Module", moduleSchema);
