import { AttemptDTO } from "../attempt/attempt.dto";

export interface StatsResponseDTO {
  summary: StatsSummary;
  statsByType: StatsByType;
  statsByModule: StatsByModule;
  statsByLevel: StatsByLevel;
  attempts: AttemptDTO[];
}

export interface StatsSummary {
  totalModules: number;
  completedModules: number;
  totalLevels: number;
  completedLevels: number;
  totalAchievements: number;
}

type AttemptType = "flash" | "test" | "dictation";
export type StatsByType = Record<
  AttemptType,
  {
    correctAnswers: number;
    totalAnswers: number;
    attempts: number;
  }
>;

export interface StatsByModule {
  [moduleId: string]: {
    moduleName: string;
    order: number;
    totalScore: number;
    completedLevels: number;
    totalLevels: number;
    achievements: string[];
    attemptCount: number;
    avgAttemptScore: number;
    avgCorrectPercentage: number;
  };
}

export interface StatsByLevel {
  [levelId: string]: {
    moduleName: string;
    levelOrder: number;
    task: "flash" | "test" | "dictation";
    bestScore: number;
    unlocked: boolean;
    attemptCount: number;
    avgAttemptScore: number;
    avgCorrectPercentage: number;
  };
}
