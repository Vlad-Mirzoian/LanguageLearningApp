import {
  LanguageProgressFiltersDTO,
  LevelProgressDTO,
  ModuleProgressDTO,
} from "./language-progress.dto";
import Module from "../module/Module";
import ModuleProgress from "../language-progress/ModuleProgress";
import Language from "../language/Language";
import Level from "../level/Level";
import LevelProgress from "../language-progress/LevelProgress";
import User from "../user/User";
import { LanguageProgressResponse } from "./language-progress.dto";
import {
  IModuleProgress,
  IModuleProgressPopulated,
} from "./module-progress.interface";
import {
  ILevelProgress,
  ILevelProgressPopulated,
} from "./level-progress.interface";
import { ILevel } from "../level/level.interface";
import mongoose from "mongoose";
import { LevelDTO } from "../level/level.dto";

interface ProgressQuery {
  userId: string;
  languageId?: string;
  moduleId?: string;
}

export class LanguageProgressService {
  static async getLanguageProgress(
    userId: string,
    data: LanguageProgressFiltersDTO
  ): Promise<LanguageProgressResponse> {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error("User not found");
    }
    const { languageId, moduleId } = data;
    if (languageId) {
      const language = await Language.findById(languageId).lean();
      if (!language) {
        throw new Error("Language not found");
      }
      if (
        !(user.nativeLanguageId && user.nativeLanguageId.equals(languageId)) &&
        !(user.learningLanguagesIds ?? []).some(
          (id) => id && id.equals(languageId)
        )
      ) {
        throw new Error("Access to this language is restricted");
      }
    }
    if (moduleId) {
      const module = await Module.findById(moduleId).lean();
      if (!module) {
        throw new Error("Module not found");
      }
    }

    const moduleProgressQuery: ProgressQuery = { userId: userId };
    if (languageId) moduleProgressQuery.languageId = languageId;
    if (moduleId) moduleProgressQuery.moduleId = moduleId;

    const levelProgressQuery: ProgressQuery = { userId: userId };
    if (languageId) levelProgressQuery.languageId = languageId;
    if (moduleId) levelProgressQuery.moduleId = moduleId;

    const [modulesRaw, levelsRaw] = await Promise.all([
      ModuleProgress.find(moduleProgressQuery)
        .populate({ path: "moduleId", select: "name order requiredScore" })
        .lean<IModuleProgressPopulated[]>(),
      LevelProgress.find(levelProgressQuery)
        .populate({ path: "levelId", select: "order tasks requiredScore" })
        .lean<ILevelProgressPopulated[]>(),
    ]);

    const modules: ModuleProgressDTO[] = modulesRaw.map((mp) => ({
      id: mp._id.toString(),
      userId: mp.userId.toString(),
      languageId: mp.languageId.toString(),
      module: {
        id: mp.moduleId._id.toString(),
        name: mp.moduleId.name,
        order: mp.moduleId.order,
        requiredScore: mp.moduleId.requiredScore,
      },
      totalLevels: mp.totalLevels,
      completedLevels: mp.completedLevels,
      totalScore: mp.totalScore,
      unlocked: mp.unlocked,
    }));
    const levels: LevelProgressDTO[] = levelsRaw.map((lp) => ({
      id: lp._id.toString(),
      userId: lp.userId.toString(),
      languageId: lp.languageId.toString(),
      moduleId: lp.moduleId.toString(),
      level: {
        id: lp.levelId._id.toString(),
        order: lp.levelId.order,
        tasks: lp.levelId.tasks,
        requiredScore: lp.levelId.requiredScore,
      },
      bestScore: lp.bestScore,
      unlocked: lp.unlocked,
    }));
    return { modules, levels };
  }

  static async updateLevelProgress(
    userId: string,
    languageId: string,
    moduleId: string,
    levelId: string,
    score: number,
    moduleOrder: number
  ): Promise<{ levelProgress: LevelProgressDTO; levelCompleted: boolean }> {
    const level = await Level.findById(levelId).lean();
    if (!level) {
      throw new Error("Level not found");
    }
    let levelProgress = await LevelProgress.findOne({
      userId,
      languageId,
      moduleId,
      levelId,
    });
    if (!levelProgress) {
      levelProgress = await LevelProgress.create({
        userId,
        languageId,
        moduleId,
        levelId,
        bestScore: score,
        unlocked: level.order === 1 && moduleOrder === 1,
      });
    } else if (score > levelProgress.bestScore) {
      levelProgress.bestScore = score;
      await levelProgress.save();
    }

    const levelCompleted = levelProgress.bestScore >= level.requiredScore;
    if (levelCompleted && !levelProgress.unlocked) {
      levelProgress.unlocked = true;
      await levelProgress.save();
    }
    const levelPopulated = await Level.findById(levelId).lean<LevelDTO>();
    if (!levelPopulated) {
      throw new Error("Level not found");
    }
    const levelProgressDTO: LevelProgressDTO = {
      id: levelProgress._id.toString(),
      userId: levelProgress.userId.toString(),
      languageId: levelProgress.languageId.toString(),
      moduleId: levelProgress.moduleId.toString(),
      level: levelPopulated,
      bestScore: levelProgress.bestScore,
      unlocked: levelProgress.unlocked,
    };
    return { levelProgress: levelProgressDTO, levelCompleted };
  }

  static async updateModuleProgress(
    userId: string,
    languageId: string,
    moduleId: string
  ): Promise<ModuleProgressDTO> {
    const allLevels = await LevelProgress.find({
      userId,
      languageId,
      moduleId,
    })
      .populate("levelId")
      .lean<ILevelProgressPopulated[]>();

    const totalLevelsCount = await Level.countDocuments({ moduleId });

    const completedLevels = allLevels.filter(
      (lp) => lp.bestScore >= lp.levelId.requiredScore
    ).length;

    const moduleTotalPoints =
      (allLevels.reduce((sum, lp) => {
        const levelPercent = Math.min(
          (lp.bestScore / lp.levelId.requiredScore) * 100,
          100
        );
        return sum + levelPercent;
      }, 0) /
        (totalLevelsCount * 100)) *
      100;

    const moduleProgress: ModuleProgressDTO =
      await ModuleProgress.findOneAndUpdate(
        { userId, languageId, moduleId },
        {
          $set: {
            totalLevels: totalLevelsCount,
            completedLevels,
            totalScore: moduleTotalPoints,
          },
          $setOnInsert: {
            unlocked: (await Module.findById(moduleId).lean())?.order === 1,
            achievements: [],
          },
        },
        { new: true, upsert: true }
      );

    return moduleProgress;
  }

  static async unlockNextLevelAndModule(
    userId: string,
    languageId: string,
    moduleId: string,
    levelId: string,
    levelCompleted: boolean
  ): Promise<void> {
    if (!levelCompleted) return;

    const currentLevel = await Level.findById(levelId).lean();
    if (!currentLevel) return;

    const nextLevel = await Level.findOne({
      moduleId,
      order: currentLevel.order + 1,
    }).lean();

    if (nextLevel) {
      await LevelProgress.findOneAndUpdate(
        {
          userId,
          languageId,
          moduleId,
          levelId: nextLevel._id,
        },
        { $set: { unlocked: true } },
        { upsert: true }
      );
    }

    const moduleProgress = await ModuleProgress.findOne({
      userId,
      languageId,
      moduleId,
    }).lean();
    const currentModule = await Module.findById(moduleId).lean();
    if (!moduleProgress || !currentModule) return;

    if (moduleProgress.totalScore >= currentModule.requiredScore) {
      const nextModule = await Module.findOne({
        languageId,
        order: currentModule.order + 1,
      }).lean();

      if (nextModule) {
        let nextModuleProgress = await ModuleProgress.findOne({
          userId,
          languageId,
          moduleId: nextModule._id,
        });

        if (!nextModuleProgress) {
          nextModuleProgress = await ModuleProgress.create({
            userId,
            languageId,
            moduleId: nextModule._id,
            totalLevels: await Level.countDocuments({
              moduleId: nextModule._id,
            }),
            completedLevels: 0,
            totalScore: 0,
            unlocked: true,
            achievements: [],
          });

          const levels = await Level.find({ moduleId: nextModule._id })
            .sort({ order: 1 })
            .lean();

          for (const level of levels) {
            await LevelProgress.create({
              userId,
              languageId,
              moduleId: nextModule._id,
              levelId: level._id,
              bestScore: 0,
              unlocked: level.order === 1,
            });
          }
        } else if (!nextModuleProgress.unlocked) {
          nextModuleProgress.unlocked = true;
          await nextModuleProgress.save();

          const existingLevels = await LevelProgress.countDocuments({
            userId,
            languageId,
            moduleId: nextModule._id,
          });

          if (existingLevels === 0) {
            const levels = await Level.find({ moduleId: nextModule._id })
              .sort({ order: 1 })
              .lean();

            for (const level of levels) {
              await LevelProgress.create({
                userId,
                languageId,
                moduleId: nextModule._id,
                levelId: level._id,
                bestScore: 0,
                unlocked: level.order === 1,
              });
            }
          }
        }
      }
    }
  }
}
