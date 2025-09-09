import mongoose from "mongoose";

export interface ICard {
  _id: mongoose.Types.ObjectId;
  firstWordId: mongoose.Types.ObjectId;
  secondWordId: mongoose.Types.ObjectId;
  moduleIds: mongoose.Types.ObjectId[];
}

export interface ICardPopulated
  extends Omit<ICard, "firstWordId" | "secondWordId" | "moduleIds"> {
  firstWordId: {
    _id: mongoose.Types.ObjectId;
    text: string;
    example?: string;
    languageId: mongoose.Types.ObjectId;
  };
  secondWordId: {
    _id: mongoose.Types.ObjectId;
    text: string;
    example?: string;
    languageId: mongoose.Types.ObjectId;
  };
  moduleIds: {
    _id: mongoose.Types.ObjectId;
    name: string;
    order: number;
    requiredScore: number;
  }[];
}
