import mongoose from "mongoose";
import { ILanguage } from "../language/language.interface";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  password: string;
  interfaceLanguageId: mongoose.Types.ObjectId;
  nativeLanguageId?: mongoose.Types.ObjectId | null;
  learningLanguagesIds?: mongoose.Types.ObjectId[];
  isVerified: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
  refreshToken?: string | null;
  refreshTokenExpires?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  avatar?: string | null;
  role: "user" | "admin";
}

export interface IUserPopulated extends Omit<IUser, "interfaceLanguageId"> {
  interfaceLanguageId: {
    _id: mongoose.Types.ObjectId;
    code: string;
    name: string;
  };
}
