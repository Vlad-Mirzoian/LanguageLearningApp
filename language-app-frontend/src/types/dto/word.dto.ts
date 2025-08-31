export interface WordFiltersDTO {
  languageId?: string;
  text?: string;
  limit?: number;
  skip?: number;
}

export interface CheckWordUniqueDTO {
  text: string;
  languageId: string;
}

export interface CreateWordDTO {
  text: string;
  languageId: string;
}

export interface UpdateWordDTO {
  text?: string;
  languageId?: string;
}
