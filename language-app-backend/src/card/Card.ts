import mongoose from "mongoose";
import { ICard } from "./card.interface";

export interface CardDocument extends Document, ICard {}

const cardSchema = new mongoose.Schema<CardDocument>({
  firstWordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Word",
    required: true,
  },
  secondWordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Word",
    required: true,
  },
  moduleIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },
  ],
});

cardSchema.index({ firstWordId: 1, secondWordId: 1 }, { unique: true });
cardSchema.index({ firstWordId: 1 });
cardSchema.index({ secondWordId: 1 });
cardSchema.index({ moduleIds: 1 });

export default mongoose.model<CardDocument>("Card", cardSchema);
