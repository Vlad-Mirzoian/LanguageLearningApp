import mongoose from "mongoose";
import { IWord } from "./word.interface";

export interface WordDocument extends Document, IWord {}

const wordSchema = new mongoose.Schema<WordDocument>({
  text: { type: String, required: true, trim: true },
  languageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Language",
    required: true,
  },
});

wordSchema.index({ text: 1, languageId: 1 }, { unique: true });
wordSchema.index({ languageId: 1 });

export default mongoose.model<WordDocument>("Word", wordSchema);
