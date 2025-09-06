import mongoose from "mongoose";
import { ILanguage } from "./language.interface";

export interface LanguageDocument extends Document, ILanguage {}

const languageSchema = new mongoose.Schema<LanguageDocument>({
  code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, unique: true, trim: true },
});

export default mongoose.model<LanguageDocument>("Language", languageSchema);
