export interface User {
  email: string;
  username: string;
  role: "user" | "admin";
  nativeLanguageId?: string;
  learningLanguagesIds?: string[];
  avatar?: string | null;
}

export interface Language {
  _id: string;
  code: string;
  name: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  order: number;
  requiredScore: number;
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
  categoryId: Category;
  meaning?: string;
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
  category: Category;
  options: { text: string; isCorrect: boolean }[];
}

export interface UserProgress {
  _id: string;
  userId: string;
  languageId: string;
  categoryId: string;
  totalCards: number;
  score: number;
  maxScore: number;
  unlocked: boolean;
  attemptId: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}
