import { AttemptDTO } from "../attempt/attempt.dto";
import { ModuleProgressPreviewDTO } from "../language-progress/language-progress.dto";
import { ModulePreviewDTO, ModuleReviewDTO } from "../module/module.dto";
import { WordPreviewDTO } from "../word/word.dto";

export interface CardFiltersDTO {
  wordText?: string;
  moduleName?: string;
  limit?: number;
  skip?: number;
}

export interface ReviewCardsFiltersDTO {
  languageId?: string;
  moduleId?: string;
}

export interface CardDTO {
  id: string;
  firstWord: WordPreviewDTO;
  secondWord: WordPreviewDTO;
  modules: ModulePreviewDTO[];
}

export interface ReviewCardDTO {
  id: string;
  module: ModuleReviewDTO;
  translation: WordPreviewDTO;
  original: WordPreviewDTO;
  options: { text: string; isCorrect: boolean }[];
  example: string | undefined;
}

export interface CreateCardDTO {
  firstWordId: string;
  secondWordId: string;
  moduleIds: string[];
}

export interface SubmitCardRequest {
  languageId: string;
  type: "flash" | "test" | "dictation";
  attemptId: string;
  answer: string;
  levelId: string;
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
  firstWordId?: string;
  secondWordId?: string;
  moduleIds?: string[];
}
