import mongoose from "mongoose";

export interface ILevelProgress {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  languageId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  levelId: mongoose.Types.ObjectId;
  bestScore: number;
  unlocked: boolean;
}

export interface ILevelProgressPopulated
  extends Omit<ILevelProgress, "levelId"> {
  levelId: {
    _id: mongoose.Types.ObjectId;
    order: number;
    tasks: "flash" | "test" | "dictation";
    requiredScore: number;
  };
}
