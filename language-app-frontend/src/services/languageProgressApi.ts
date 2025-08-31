import api from "./apiClient";
import type {
  LanguageProgressFiltersDTO,
  ModuleProgress,
  LevelProgress,
} from "../types/index";

export const getLanguageProgress = async (
  filters: LanguageProgressFiltersDTO = {}
): Promise<{ modules: ModuleProgress[]; levels: LevelProgress[] }> => {
  const response = await api.get("/language-progress", { params: filters });
  return response.data;
};
