import {
  StatsByLevel,
  StatsByModule,
  StatsByType,
  StatsResponseDTO,
  StatsSummary,
} from "./stats.dto";
import Attempt from "../attempt/Attempt";
import ModuleProgress from "../language-progress/ModuleProgress";
import Language from "../language/Language";
import LevelProgress from "../language-progress/LevelProgress";
import User from "../user/User";
import { IModuleProgressPopulated } from "../language-progress/module-progress.interface";
import { ILevelProgressPopulated } from "../language-progress/level-progress.interface";
import mongoose from "mongoose";
import { AttemptDTO } from "../attempt/attempt.dto";
import { IAttemptPopulated } from "../attempt/attempt.interface";

type LevelProgressWithModule = ILevelProgressPopulated & {
  moduleId: { _id: mongoose.Types.ObjectId; name: string };
};

export class StatsService {
  static async getStats(
    userId: string,
    languageId: string
  ): Promise<StatsResponseDTO> {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error("User not found");
    }
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

    const moduleProgressQuery = { userId, languageId };
    const levelProgressQuery = { userId, languageId };
    const attemptQuery = { userId, languageId };

    const [moduleProgress, levelProgress, attempts] = await Promise.all([
      ModuleProgress.find(moduleProgressQuery)
        .populate({
          path: "moduleId",
          select: "name order requiredScore",
        })
        .lean<IModuleProgressPopulated[]>(),
      LevelProgress.find(levelProgressQuery)
        .populate({
          path: "levelId",
          select: "order tasks requiredScore pointsReward",
        })
        .populate({
          path: "moduleId",
          select: "name",
        })
        .lean<LevelProgressWithModule[]>(),
      Attempt.find(attemptQuery)
        .populate({
          path: "userId",
          select: "username avatar",
        })
        .populate({
          path: "languageId",
          select: "name",
        })
        .populate({
          path: "moduleId",
          select: "name order",
        })
        .populate({
          path: "levelId",
          select: "order tasks",
        })
        .lean<IAttemptPopulated[]>(),
    ]);

    const initialStats: StatsByType = {
      flash: { correctAnswers: 0, totalAnswers: 0, attempts: 0 },
      test: { correctAnswers: 0, totalAnswers: 0, attempts: 0 },
      dictation: { correctAnswers: 0, totalAnswers: 0, attempts: 0 },
    };
    const statsByType = attempts.reduce<StatsByType>((acc, attempt) => {
      acc[attempt.type].correctAnswers += attempt.correctAnswers;
      acc[attempt.type].totalAnswers += attempt.totalAnswers;
      acc[attempt.type].attempts += 1;
      return acc;
    }, initialStats);

    const statsByModule: StatsByModule = moduleProgress.reduce<StatsByModule>(
      (acc, progress) => {
        const moduleAttempts = attempts.filter(
          (a) =>
            a.moduleId &&
            a.moduleId._id.toString() === progress.moduleId._id.toString()
        );
        acc[progress.moduleId._id.toString()] = {
          moduleName: progress.moduleId.name,
          order: progress.moduleId.order,
          totalScore: progress.totalScore,
          completedLevels: progress.completedLevels,
          totalLevels: progress.totalLevels,
          achievements: progress.achievements,
          attemptCount: moduleAttempts.length,
          avgAttemptScore: moduleAttempts.length
            ? moduleAttempts.reduce((sum, a) => sum + a.score, 0) /
              moduleAttempts.length
            : 0,
          avgCorrectPercentage: moduleAttempts.length
            ? (moduleAttempts.reduce(
                (sum, a) => sum + a.correctAnswers / (a.totalAnswers || 1),
                0
              ) /
                moduleAttempts.length) *
              100
            : 0,
        };
        return acc;
      },
      {} as StatsByModule
    );

    const statsByLevel: StatsByLevel = levelProgress.reduce<StatsByLevel>(
      (acc, progress) => {
        const levelAttempts = attempts.filter(
          (a) =>
            a.levelId &&
            a.levelId._id.toString() === progress.levelId._id.toString()
        );
        acc[progress.levelId._id.toString()] = {
          moduleName: progress.moduleId.name,
          levelOrder: progress.levelId.order,
          task: progress.levelId.tasks,
          bestScore: progress.bestScore,
          unlocked: progress.unlocked,
          attemptCount: levelAttempts.length,
          avgAttemptScore: levelAttempts.length
            ? levelAttempts.reduce((sum, a) => sum + a.score, 0) /
              levelAttempts.length
            : 0,
          avgCorrectPercentage: levelAttempts.length
            ? (levelAttempts.reduce(
                (sum, a) => sum + a.correctAnswers / (a.totalAnswers || 1),
                0
              ) /
                levelAttempts.length) *
              100
            : 0,
        };
        return acc;
      },
      {}
    );

    const summary: StatsSummary = {
      totalModules: moduleProgress.length,
      completedModules: moduleProgress.filter((p) => p.unlocked).length,
      totalLevels: levelProgress.length,
      completedLevels: levelProgress.filter((p) => p.unlocked).length,
      totalAchievements: moduleProgress.reduce(
        (sum, p) => sum + p.achievements.length,
        0
      ),
    };
    const attemptsDTO: AttemptDTO[] = attempts.map((a) => ({
      id: a._id.toString(),
      user: {
        id: (a.userId as any)._id.toString(),
        username: (a.userId as any).username,
        avatar: (a.userId as any).avatar,
      },
      language: {
        id: (a.languageId as any)._id.toString(),
        name: (a.languageId as any).name,
      },
      module: {
        id: (a.moduleId as any)._id.toString(),
        name: (a.moduleId as any).name,
        order: (a.moduleId as any).order,
      },
      level: {
        id: (a.levelId as any)._id.toString(),
        order: (a.levelId as any).order,
        tasks: (a.levelId as any).tasks,
      },
      type: a.type,
      date: a.date.toISOString(),
      score: a.score,
      correctAnswers: a.correctAnswers,
      totalAnswers: a.totalAnswers,
    }));

    return {
      summary,
      statsByType,
      statsByModule,
      statsByLevel,
      attempts: attemptsDTO,
    };
  }
}
