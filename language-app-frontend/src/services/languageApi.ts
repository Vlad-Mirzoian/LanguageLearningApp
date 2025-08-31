import api from "./apiClient";
import type { Language } from "../types/index";
import type {
  CreateLanguageDTO,
  UpdateLanguageDTO,
} from "../types/index";

export const getLanguages = async (): Promise<Language[]> => {
  const response = await api.get("/languages");
  return response.data;
};

export const createLanguage = async (
  data: CreateLanguageDTO
): Promise<Language> => {
  const response = await api.post("/languages", data);
  return response.data;
};

export const updateLanguage = async (
  languageId: string,
  data: UpdateLanguageDTO
): Promise<Language> => {
  const response = await api.put(`/languages/${languageId}`, data);
  return response.data;
};

export const deleteLanguage = async (
  languageId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/languages/${languageId}`);
  return response.data;
};
