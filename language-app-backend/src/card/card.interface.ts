import mongoose from "mongoose";

export interface ICard {
  _id: mongoose.Types.ObjectId;
  wordId: mongoose.Types.ObjectId;
  translationId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  example?: string;
}

export interface ICardPopulated
  extends Omit<ICard, "wordId" | "translationId" | "moduleId"> {
  wordId: {
    _id: mongoose.Types.ObjectId;
    text: string;
    languageId: mongoose.Types.ObjectId;
  };
  translationId: {
    _id: mongoose.Types.ObjectId;
    text: string;
    languageId: mongoose.Types.ObjectId;
  };
  moduleId: {
    _id: mongoose.Types.ObjectId;
    name: string;
    order: number;
    requiredScore: number;
  };
}
