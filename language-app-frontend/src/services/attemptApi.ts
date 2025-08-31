import api from "./apiClient";
import type { Attempt } from "../types/index";

export const shareAttempt = async (attemptId: string) => {
  const response = await api.post(`/attempts/${attemptId}/share`);
  return response.data;
};

export const viewAttempt = async (token: string): Promise<Attempt> => {
  const response = await api.get(`/attempts/view/${token}`);
  return response.data;
};
