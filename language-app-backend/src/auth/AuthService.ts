import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from "./auth.dto";
import { IUser, IUserPopulated } from "../user/user.interface";
import { UserDTO } from "../user/user.dto";
import mongoose from "mongoose";
import User, { UserDocument } from "../user/User";
import Language from "../language/Language";
import { EmailService } from "./EmailService";

export class AuthService {
  static async registerUser(data: RegisterRequest): Promise<void> {
    const {
      email,
      username,
      password,
      interfaceLanguageId,
      nativeLanguageId,
      learningLanguagesIds,
    } = data;

    const existingUser = await User.findOne({
      $or: [{ email }, { username: username.toLowerCase() }],
    }).lean();
    if (existingUser) {
      throw new Error("Email or username already exists");
    }

    const intLang = await Language.findById(interfaceLanguageId).lean();
    if (!intLang) {
      throw new Error("Interface language not found");
    }

    if (nativeLanguageId) {
      const natLang = await Language.findById(nativeLanguageId).lean();
      if (!natLang) {
        throw new Error("Native language not found");
      }
    }
    if (learningLanguagesIds && learningLanguagesIds.length > 0) {
      const langs = await Language.find({
        _id: { $in: learningLanguagesIds },
      }).lean();
      if (langs.length !== learningLanguagesIds.length) {
        throw new Error("One or more learning languages not found");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const user = new User({
      email,
      username: username.toLowerCase(),
      password: hashedPassword,
      interfaceLanguageId,
      nativeLanguageId,
      learningLanguagesIds,
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });
    await user.save();
    await EmailService.sendVerificationEmail(user.email, verificationToken);
  }

  static async verifyUser(token: string): Promise<UserDocument> {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      throw new Error("User not found");
    }
    if (user.isVerified) {
      throw new Error("Email already verified");
    }
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    return user.save();
  }

  static async loginUser(data: LoginRequest): Promise<LoginResponse> {
    const { identifier, password } = data;
    const user = (await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    }).populate("interfaceLanguageId")) as IUser;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid credentials");
    }
    if (!user.isVerified) {
      throw new Error("Please verify your email before logging in");
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );

    const refreshToken = crypto.randomBytes(32).toString("hex");
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        refreshToken: refreshTokenHash,
        refreshTokenExpires,
      },
      { new: true }
    )
      .populate("interfaceLanguageId", "code name")
      .lean<IUserPopulated>();
    if (!updatedUser) {
      throw new Error("Failed to update user with refresh token");
    }
    const userDTO: UserDTO = {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role,
      interfaceLanguage: {
        id: updatedUser.interfaceLanguageId._id.toString(),
        code: updatedUser.interfaceLanguageId.code,
        name: updatedUser.interfaceLanguageId.name,
      },
      nativeLanguageId: updatedUser.nativeLanguageId?.toString() || null,
      learningLanguagesIds:
        updatedUser.learningLanguagesIds?.map((id) => id.toString()) || [],
      avatar: updatedUser.avatar || null,
    };
    return { user: userDTO, accessToken, refreshToken };
  }

  static async refreshToken(
    refreshToken?: string
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    if (!refreshToken) {
      throw new Error("Refresh token not provided");
    }
    const users: IUser[] = await User.find({
      refreshTokenExpires: { $gt: new Date() },
      refreshToken: { $exists: true },
    });
    let matchedUser: IUser | null = null;
    for (const u of users) {
      if (
        u.refreshToken &&
        (await bcrypt.compare(refreshToken, u.refreshToken))
      ) {
        matchedUser = u;
        break;
      }
    }
    if (!matchedUser) {
      throw new Error("Invalid refresh token");
    }
    const accessToken = jwt.sign(
      { userId: matchedUser._id, role: matchedUser.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );
    const newRefreshToken = crypto.randomBytes(32).toString("hex");
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const newRefreshTokenExpires = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );
    await User.updateOne(
      { _id: matchedUser._id },
      {
        refreshToken: newRefreshTokenHash,
        refreshTokenExpires: newRefreshTokenExpires,
      }
    );
    return { accessToken, newRefreshToken };
  }

  static async logoutUser(userId: string): Promise<void> {
    await User.updateOne(
      {
        _id: new mongoose.Types.ObjectId(userId),
      },
      {
        refreshToken: null,
        refreshTokenExpires: null,
      }
    );
  }

  static async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    const { email } = data;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }
    if (!user.isVerified) {
      throw new Error(
        "Please verify your email before resetting your password"
      );
    }
    const resetToken = uuidv4();
    const resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();
    await EmailService.sendResetPasswordEmail(user.email, resetToken);
  }

  static async resetPassword(
    token: string,
    data: ResetPasswordRequest
  ): Promise<UserDocument> {
    const { password } = data;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      throw new Error("Invalid or expired token");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    return user.save();
  }
}
