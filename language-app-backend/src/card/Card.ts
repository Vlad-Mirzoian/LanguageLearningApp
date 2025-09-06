import mongoose from "mongoose";
import { ICard } from "./card.interface";

export interface CardDocument extends Document, ICard {}

const cardSchema = new mongoose.Schema<CardDocument>({
  wordId: { type: mongoose.Schema.Types.ObjectId, ref: "Word", required: true },
  translationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Word",
    required: true,
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },
  example: { type: String, default: "" },
});

cardSchema.index({ wordId: 1, translationId: 1 }, { unique: true });
cardSchema.index({ wordId: 1 });
cardSchema.index({ translationId: 1 });
cardSchema.index({ moduleId: 1 });

export default mongoose.model<CardDocument>("Card", cardSchema);
