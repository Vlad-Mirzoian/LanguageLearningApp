import { LevelDTO } from "../level/level.dto";
import { ModulePreviewDTO } from "../module/module.dto";

export interface LanguageProgressFiltersDTO {
  languageId?: string;
  moduleId?: string;
}

export interface LanguageProgressResponse {
  modules: ModuleProgressDTO[];
  levels: LevelProgressDTO[];
}

export interface ModuleProgressPreviewDTO {
  completedLevels: number;
  totalScore: number;
}

export interface ModuleProgressDTO {
  id: string;
  userId: string;
  languageId: string;
  module: ModulePreviewDTO;
  totalLevels: number;
  completedLevels: number;
  totalScore: number;
  unlocked: boolean;
}

export interface LevelProgressDTO {
  id: string;
  userId: string;
  languageId: string;
  moduleId: string;
  level: LevelDTO;
  bestScore: number;
  unlocked: boolean;
}
