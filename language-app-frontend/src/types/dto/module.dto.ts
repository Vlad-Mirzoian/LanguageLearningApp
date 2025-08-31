export interface ModuleFiltersDTO {
  languageId?: string;
  name?: string;
  limit?: number;
  skip?: number;
}

export interface CreateModuleDTO {
  name: string;
  description?: string;
  order: number;
  requiredScore: number;
}

export interface UpdateModuleDTO {
  name?: string;
  description?: string;
  order?: number;
  requiredScore?: number;
}

export interface UpdateModuleOrdersDTO {
  id: string;
  order: number;
}
