import { AttemptDTO } from "../attempt/attempt.dto";
import { ModuleProgressPreviewDTO } from "../language-progress/language-progress.dto";
import { ModulePreviewDTO } from "../module/module.dto";
import { WordPreviewDTO } from "../word/word.dto";

export interface CardFiltersDTO {
  moduleId?: string;
  example?: string;
  limit?: number;
  skip?: number;
}

export interface ReviewCardsFiltersDTO {
  languageId?: string;
  moduleId?: string;
}

export interface CardDTO {
  id: string;
  word: WordPreviewDTO;
  translation: WordPreviewDTO;
  module: ModulePreviewDTO;
  example?: string;
}

export interface TestCardDTO {
  id: string;
  word: WordPreviewDTO;
  module: ModulePreviewDTO;
  example?: string;
  options: { text: string; isCorrect: boolean }[];
}

export interface CreateCardDTO {
  wordId: string;
  translationId: string;
  moduleId: string;
  example?: string;
}

export interface SubmitCardDTO {
  languageId: string;
  type: "flash" | "test" | "dictation";
  attemptId?: string | null;
  answer: string;
  levelId?: string;
}

export interface SubmitCardResponse {
  attempt: AttemptDTO;
  isCorrect: boolean;
  correctTranslation: string;
  quality: number;
  levelCompleted: boolean;
  levelScore: number;
  moduleProgress: ModuleProgressPreviewDTO;
}

export interface UpdateCardDTO {
  wordId?: string;
  translationId?: string;
  moduleId?: string;
  example?: string;
}
