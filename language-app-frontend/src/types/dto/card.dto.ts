export interface CardFiltersDTO {
  wordText?: string;
  moduleName?: string;
  limit?: number;
  skip?: number;
}

export interface CreateCardDTO {
  firstWordId: string;
  secondWordId: string;
  moduleIds: string[];
}

export interface UpdateCardDTO {
  firstWordId?: string;
  secondWordId?: string;
  moduleIds?: string[];
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
