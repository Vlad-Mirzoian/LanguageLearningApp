import { LanguageDTO } from "../language/language.dto";

export interface ModuleSummaryDTO {
  id: string;
  name: string;
  order: number;
}

export interface ModulePreviewDTO {
  id: string;
  name: string;
  order: number;
  requiredScore: number;
}

export interface ModuleReviewDTO {
  id: string;
  name: string;
  order: number;
  languageId: string;
  requiredScore: number;
}

export interface ModuleFullDTO {
  id: string;
  name: string;
  description: string;
  language: LanguageDTO;
  order: number;
  requiredScore: number;
}

export interface ModuleFiltersDTO {
  languageId?: string;
  name?: string;
  limit?: number;
  skip?: number;
}

export interface CreateModuleDTO {
  name: string;
  description?: string;
  languageId: string;
  order: number;
  requiredScore: number;
}

export interface UpdateModuleDTO {
  name?: string;
  description?: string;
  languageId?: string;
  order?: number;
  requiredScore?: number;
}

export interface UpdateModuleOrdersDTO {
  id: string;
  order: number;
}
