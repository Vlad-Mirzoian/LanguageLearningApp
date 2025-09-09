import { LanguageDTO } from "../language/language.dto";

export interface WordFiltersDTO {
  languageId?: string;
  text?: string;
  limit?: number;
  skip?: number;
}

export interface CreateWordDTO {
  text: string;
  languageId: string;
  example?: string;
}

export interface CheckWordUniqueDTO {
  text?: string;
  languageId?: string;
}

export interface UpdateWordDTO {
  text?: string;
  languageId?: string;
  example?: string;
}

export interface WordPreviewDTO {
  id: string;
  text: string;
  languageId: string;
}

export interface WordFullDTO {
  id: string;
  text: string;
  language: LanguageDTO;
  example?: string;
}
