export interface LanguageDTO {
  id: string;
  code: string;
  name: string;
}

export interface LanguageMiniDTO {
  id: string;
  name: string;
}

export interface CreateLanguageDTO {
  code: string;
  name: string;
}

export interface UpdateLanguageDTO {
  code?: string;
  name?: string;
}
