import mongoose from "mongoose";
import { IUser } from "./user.interface";

export interface UserDocument extends Document, IUser {}

const userSchema = new mongoose.Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    interfaceLanguageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: true,
    },
    nativeLanguageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      default: null,
    },
    learningLanguagesIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Language",
        default: [],
      },
    ],
    avatar: {
      type: String,
      default: "",
    },
    refreshToken: { type: String, default: null },
    refreshTokenExpires: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpires: { type: Date, default: null },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ nativeLanguageId: 1 });
userSchema.index({ learningLanguagesIds: 1 });
userSchema.index(
  { resetPasswordToken: 1 },
  {
    unique: true,
    partialFilterExpression: { resetPasswordToken: { $type: "string" } },
  }
);

export default mongoose.model<UserDocument>("User", userSchema);
