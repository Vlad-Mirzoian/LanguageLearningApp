import mongoose from "mongoose";

export interface ILanguage {
  _id: mongoose.Types.ObjectId;
  code: string;
  name: string;
}
