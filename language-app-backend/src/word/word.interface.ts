import mongoose from "mongoose";

export interface IWord {
  _id: mongoose.Types.ObjectId;
  text: string;
  languageId: mongoose.Types.ObjectId;
  example?: string;
}

export interface IWordPopulated extends Omit<IWord, "languageId"> {
  languageId: {
    _id: mongoose.Types.ObjectId;
    code: string;
    name: string;
  };
}
