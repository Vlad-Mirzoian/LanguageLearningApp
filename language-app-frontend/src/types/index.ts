export interface User {
  email: string;
  role: "user" | "admin";
  nativeLanguageId: Language;
  learningLanguagesIds: Language[];
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
}

export interface Word {
  _id: string;
  text: string;
  languageId: Language;
  categoryId?: Category;
  meaning?: string;
}

export interface Card {
  _id: string;
  wordId: Word;
  translationId: Word;
  interval: number;
  nextReview: string;
  easiness: number;
  repetitions: number;
  lastReviewed: string;
}

export interface LanguageStat {
  nativeLanguageId: { id: string; name: string };
  learningLanguagesIds: { id: string; name: string };
  total: number;
  learned: number;
}

export interface CategoryStat {
  wordCategory: { id: string; name: string };
  translationCategory: { id: string; name: string };
  total: number;
  learned: number;
}

export interface ProgressData {
  totalCards: number;
  reviewedToday: number;
  learnedCards: number;
  languagesStats: LanguageStat[];
  categoriesStats: CategoryStat[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
