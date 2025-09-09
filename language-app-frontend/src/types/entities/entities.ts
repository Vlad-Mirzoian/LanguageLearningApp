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
  id: string;
  code: string;
  name: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  language: Language;
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
  module: Module;
  totalLevels: number;
  completedLevels: number;
  totalScore: number;
  unlocked: boolean;
  achievements: string[];
}

export interface Level {
  id: string;
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
  level: Level;
  bestScore: number;
  unlocked: boolean;
}

export interface Word {
  id: string;
  text: string;
  language: Language;
  example?: string;
}

export interface WordResponse {
  words: Word[];
  total: number;
}

export interface Card {
  id: string;
  firstWord: Word;
  secondWord: Word;
  modules: Module[];
}

export interface ReviewCard {
  id: string;
  module: Module;
  translation: Word;
  original: Word;
  options: { text: string; isCorrect: boolean }[];
  example: string | undefined;
}

export interface CardResponse {
  cards: Card[];
  total: number;
}

export interface TestCard {
  id: string;
  word: Word;
  module: Module;
  options: { text: string; isCorrect: boolean }[];
}

export interface Attempt {
  _id: string;
  user: User;
  language: Language;
  module?: Module;
  level?: Level;
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
