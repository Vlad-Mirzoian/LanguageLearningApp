import {
  LanguageProgressFiltersDTO,
  LevelProgressDTO,
  ModuleProgressDTO,
} from "./language-progress.dto";
import Module from "../module/Module";
import ModuleProgress from "../language-progress/ModuleProgress";
import Language from "../language/Language";
import LevelProgress from "../language-progress/LevelProgress";
import User from "../user/User";
import { LanguageProgressResponse } from "./language-progress.dto";
import { IModuleProgressPopulated } from "./module-progress.interface";
import { ILevelProgressPopulated } from "./level-progress.interface";

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
}
