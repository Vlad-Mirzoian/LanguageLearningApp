import type { StatsResponse } from "../types";
import api from "./apiClient";

export const getStats = async (
  filters: { languageId?: string } = {}
): Promise<StatsResponse> => {
  const response = await api.get("/stats", { params: filters });
  return response.data;
};
