export interface User {
  email: string;
  username: string;
  role: "user" | "admin";
  interfaceLanguage: Language;
  nativeLanguageId?: string | null;
  learningLanguagesIds?: string[];
  avatar?: string;
}

export interface Language {
  _id: string;
  code: string;
  name: string;
}

export interface Module {
  _id: string;
  name: string;
  description: string;
  languageId: Language;
  order: number;
  requiredScore: number;
  wordsCount: number;
}

export interface ModuleResponse {
  modules: Module[];
  total: number;
}

export interface ModuleProgress {
  _id: string;
  userId: string;
  languageId: string;
  moduleId: Module;
  totalLevels: number;
  completedLevels: number;
  totalScore: number;
  unlocked: boolean;
  achievements: string[];
}

export interface Level {
  _id: string;
  moduleId: string;
  order: number;
  tasks: "flash" | "test" | "dictation";
  requiredScore: number;
  pointsReward: number;
}

export interface LevelProgress {
  _id: string;
  userId: string;
  languageId: string;
  moduleId: string;
  levelId: Level;
  bestScore: number;
  unlocked: boolean;
}

export interface Word {
  _id: string;
  text: string;
  languageId: Language;
}

export interface WordResponse {
  words: Word[];
  total: number;
}

export interface Card {
  _id: string;
  wordId: Word;
  translationId: Word;
  moduleId: Module;
  example?: string;
  interval: number;
  nextReview: string;
  easiness: number;
  repetitions: number;
  lastReviewed: string;
}

export interface CardResponse {
  cards: Card[];
  total: number;
}

export interface TestCard {
  _id: string;
  word: Word;
  module: Module;
  example?: string;
  options: { text: string; isCorrect: boolean }[];
}

export interface UserProgress {
  _id: string;
  userId: string;
  languageId: string;
  moduleId: Module;
  totalCards: number;
  score: number;
  bestScore: number;
  unlocked: boolean;
  attemptId: string | null;
}

export interface Attempt {
  _id: string;
  userId: User;
  languageId: Language;
  moduleId?: Module;
  levelId?: Level;
  type: "flash" | "test" | "dictation";
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  date: string;
}

export interface StatsByType {
  [key: string]: {
    correctAnswers: number;
    totalAnswers: number;
    attempts: number;
  };
}

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
    task: string;
    bestScore: number;
    unlocked: boolean;
    attemptCount: number;
    avgAttemptScore: number;
    avgCorrectPercentage: number;
  };
}

export interface StatsSummary {
  totalModules: number;
  completedModules: number;
  totalLevels: number;
  completedLevels: number;
  totalAchievements: number;
}

export interface StatsResponse {
  summary: StatsSummary;
  statsByType: StatsByType;
  statsByModule: StatsByModule;
  statsByLevel: StatsByLevel;
  attempts: Attempt[];
}

export interface LeaderboardEntry {
  username: string;
  totalScore: number;
  avgAttemptScore: number;
  avgCorrectPercentage: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}
