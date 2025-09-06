export interface CardFiltersDTO {
  moduleId?: string;
  example?: string;
  limit?: number;
  skip?: number;
}

export interface CreateCardDTO {
  wordId: string;
  translationId: string;
  moduleId: string;
  example?: string;
}

export interface UpdateCardDTO {
  wordId?: string;
  translationId?: string;
  moduleId?: string;
  example?: string;
}

export interface ReviewCardsFiltersDTO {
  languageId: string;
  moduleId?: string;
}

export interface SubmitCardDTO {
  languageId: string;
  type: "flash" | "test" | "dictation";
  attemptId?: string | null;
  answer?: string;
  levelId?: string;
}
