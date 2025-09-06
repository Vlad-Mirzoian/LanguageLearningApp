import mongoose from "mongoose";

export interface IModule {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  languageId: mongoose.Types.ObjectId;
  order: number;
  requiredScore: number;
  wordsCount: number;
}

export interface IModulePopulated extends Omit<IModule, "languageId"> {
  languageId: {
    _id: mongoose.Types.ObjectId;
    code: string;
    name: string;
  };
}
