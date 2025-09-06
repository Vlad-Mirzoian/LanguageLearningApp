import mongoose from "mongoose";

export interface IModuleProgress {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  languageId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  totalLevels: number;
  completedLevels: number;
  totalScore: number;
  unlocked: boolean;
  achievements: string[];
}

export interface IModuleProgressPopulated
  extends Omit<IModuleProgress, "moduleId"> {
  moduleId: {
    _id: mongoose.Types.ObjectId;
    name: string;
    order: number;
    requiredScore: number;
  };
}
