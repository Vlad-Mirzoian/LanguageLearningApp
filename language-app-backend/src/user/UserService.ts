import mongoose from "mongoose";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs/promises";
import {
  UpdateInterfaceLanguageRequest,
  UpdateUserRequest,
  UserDTO,
} from "./user.dto";
import { IUser, IUserPopulated } from "./user.interface";
import User from "./User";
import Language from "../language/Language";
import ModuleProgress from "../language-progress/ModuleProgress";
import LevelProgress from "../language-progress/LevelProgress";
import Module from "../module/Module";
import Level from "../level/Level";
import { ILevel } from "../level/level.interface";
import { LanguageDTO } from "../language/language.dto";

export class UserService {
  static async uploadAvatar(userId: string, filename: string): Promise<IUser> {
    const avatarPath = `/uploads/avatars/${filename}`;
    const user = (await User.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      { avatar: avatarPath },
      { new: true, lean: true }
    )) as IUser;
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  static async deleteAvatar(userId: string): Promise<void> {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error("User not found");
    if (user.avatar) {
      const filePath = path.join(process.cwd(), "uploads/avatars", path.basename(user.avatar));
      try {
        await fs.unlink(filePath);
      } catch (err) {
        throw new Error(`Failed to delete avatar file: ${filePath}`);
      }
    }
    await User.findByIdAndUpdate(userId, { avatar: "" }, { new: true });
  }

  static async updateInterfaceLanguage(
    userId: string,
    data: UpdateInterfaceLanguageRequest
  ): Promise<LanguageDTO> {
    const { interfaceLanguageId } = data;
    if (interfaceLanguageId) {
      const lang = await Language.findById(interfaceLanguageId).lean();
      if (!lang) {
        throw new Error("Preferred language not found");
      }
    }
    const user = await User.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      { interfaceLanguageId },
      { new: true }
    )
      .populate("interfaceLanguageId", "code name")
      .lean<IUserPopulated>();
    if (!user) {
      throw new Error("User not found");
    }
    const language: LanguageDTO = {
      id: user.interfaceLanguageId._id.toString(),
      code: user.interfaceLanguageId.code,
      name: user.interfaceLanguageId.name,
    };
    return language;
  }

  static async updateUser(
    userId: string,
    data: UpdateUserRequest
  ): Promise<UserDTO> {
    const {
      email,
      username,
      password,
      nativeLanguageId,
      learningLanguagesIds,
    } = data;
    const user = (await User.findById(
      new mongoose.Types.ObjectId(userId)
    ).lean()) as IUser;
    if (!user) {
      throw new Error("User not found");
    }
    const currentLearningLanguages = user.learningLanguagesIds || [];
    const newLanguages = (learningLanguagesIds || []).filter(
      (langId) =>
        !currentLearningLanguages.some(
          (currentId: mongoose.Types.ObjectId) =>
            currentId.toString() === langId
        )
    );
    const removedLanguages = currentLearningLanguages.filter(
      (langId: mongoose.Types.ObjectId) =>
        !(learningLanguagesIds || []).some(
          (newId) => newId === langId.toString()
        )
    );
    if (removedLanguages.length > 0) {
      await Promise.all([
        ModuleProgress.deleteMany({
          userId: new mongoose.Types.ObjectId(userId),
          languageId: { $in: removedLanguages },
        }),
        LevelProgress.deleteMany({
          userId: new mongoose.Types.ObjectId(userId),
          languageId: { $in: removedLanguages },
        }),
      ]);
    }
    const updateData: Partial<UpdateUserRequest> = {};
    if (email) updateData.email = email;
    if (username) updateData.username = username.toLowerCase();
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (nativeLanguageId !== undefined) {
      updateData.nativeLanguageId =
        nativeLanguageId !== null ? nativeLanguageId : null;
    }
    if (learningLanguagesIds) {
      updateData.learningLanguagesIds = learningLanguagesIds;
    }
    const updatedUser = await User.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(userId) },
      updateData,
      { new: true }
    )
      .populate("interfaceLanguageId", "code name")
      .lean<IUserPopulated>();
    if (!updatedUser) {
      throw new Error("User not found");
    }
    for (const langId of newLanguages) {
      const firstModule = await Module.findOne({ languageId: langId }).sort({
        order: 1,
      });
      if (!firstModule) {
        console.warn(`No modules found for language ID: ${langId}`);
        continue;
      }
      const levels = await Level.find({ moduleId: firstModule._id })
        .sort({ order: 1 })
        .lean();
      if (levels.length === 0) {
        console.warn(`No levels found for module ID: ${firstModule._id}`);
        continue;
      }
      await Promise.all([
        ModuleProgress.create({
          userId: new mongoose.Types.ObjectId(userId),
          languageId: langId,
          moduleId: firstModule._id,
          totalLevels: levels.length,
          completedLevels: 0,
          bestScore: 0,
          unlocked: firstModule.order === 1,
          achievements: [],
        }),
        LevelProgress.insertMany(
          levels.map((level: ILevel, index: number) => ({
            userId: new mongoose.Types.ObjectId(userId),
            languageId: langId,
            moduleId: firstModule._id,
            levelId: level._id,
            bestScore: 0,
            unlocked: index === 0,
          }))
        ),
      ]);
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
    return userDTO;
  }

  static async deleteUser(userId: string): Promise<void> {
    const user = await User.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(userId),
    });
    if (!user) {
      throw new Error("User not found");
    }
  }
}
