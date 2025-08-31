import api from "./apiClient";
import type { LeaderboardEntry } from "../types/index";

export const getLeaderboard = async (data: {
  languageId: string;
}): Promise<LeaderboardEntry[]> => {
  const response = await api.get("/leaderboard", { params: data });
  return response.data;
};
