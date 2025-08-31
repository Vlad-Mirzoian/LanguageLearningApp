import api from "./apiClient";
import type { WordResponse, Word } from "../types/index";
import type {
  CheckWordUniqueDTO,
  CreateWordDTO,
  UpdateWordDTO,
  WordFiltersDTO,
} from "../types/index";

export const getWords = async (
  filters: WordFiltersDTO = {}
): Promise<WordResponse> => {
  const response = await api.get("/words", { params: filters });
  return response.data;
};

export const checkWordUnique = async (
  data: CheckWordUniqueDTO
): Promise<{ isUnique: boolean }> => {
  const response = await api.get("/words/check-unique", { params: data });
  return response.data;
};

export const createWord = async (data: CreateWordDTO): Promise<Word> => {
  const response = await api.post("/words", data);
  return response.data;
};

export const updateWord = async (
  wordId: string,
  data: UpdateWordDTO
): Promise<Word> => {
  const response = await api.put(`/words/${wordId}`, data);
  return response.data;
};

export const deleteWord = async (
  wordId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/words/${wordId}`);
  return response.data;
};
