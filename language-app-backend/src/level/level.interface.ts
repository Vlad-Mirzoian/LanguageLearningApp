import mongoose from "mongoose";

export interface ILevel {
  _id: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  order: number;
  tasks: "flash" | "test" | "dictation";
  requiredScore: number;
}
