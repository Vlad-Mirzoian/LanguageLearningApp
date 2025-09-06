import mongoose from "mongoose";

export interface IAttempt {
  _id: string;
  attemptId: string;
  userId: mongoose.Types.ObjectId;
  languageId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  levelId: mongoose.Types.ObjectId;
  type: "flash" | "test" | "dictation";
  date: Date;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  shareToken?: string | null;
  shareTokenExpires?: Date | null;
}

export interface IAttemptPopulated
  extends Omit<IAttempt, "userId" | "languageId" | "moduleId" | "levelId"> {
  userId: {
    _id: string;
    username: string;
    avatar: string;
  };
  languageId: {
    _id: string;
    name: string;
  };
  moduleId: {
    _id: string;
    name: string;
    order: number;
  };
  levelId: {
    _id: string;
    order: number;
    tasks: "flash" | "test" | "dictation";
  };
}
