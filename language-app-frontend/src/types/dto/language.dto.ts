export interface CreateLanguageDTO {
  code: string;
  name: string;
}

export interface UpdateLanguageDTO {
  code?: string;
  name?: string;
}
