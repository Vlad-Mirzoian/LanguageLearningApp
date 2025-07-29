import axios from "axios";
import type { AuthResponse, Card, Category, Language } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const register = async (data: {
  email: string;
  password: string;
  nativeLanguageId?: string;
  learningLanguagesIds?: string[];
}) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const login = async (data: { email: string; password: string }) => {
  const response = await api.post<AuthResponse>("/auth/login", data);
  localStorage.setItem("token", response.data.token);
  localStorage.setItem("user", JSON.stringify(response.data.user));
  return response.data;
};

export const verifyEmail = async (token: string) => {
  const response = await api.get(`/auth/verify/${token}`);
  return response.data;
};

export const forgotPassword = async (data: { email: string }) => {
  const response = await api.post(`/auth/forgot-password`, data);
  return response.data;
};

export const resetPassword = async (
  token: string,
  data: { password: string }
) => {
  const response = await api.post(`/auth/reset-password/${token}`, {
    password: data.password,
  });
  return response.data;
};

export const logout = async () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getLanguages = async (): Promise<Language[]> => {
  const response = await api.get("/languages");
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get("/categories");
  return response.data;
};

export const getReviewCards = async (filters: {
  languageId?: string;
  categoryId?: string;
}): Promise<Card[]> => {
  const response = await api.get("/cards/review", { params: filters });
  return response.data;
};

export const reviewCard = async (
  cardId: string,
  data: { languageId: string; quality: number }
): Promise<Card[]> => {
  const response = await api.put(`/cards/${cardId}/review`, {
    languageId: data.languageId,
    quality: data.quality,
  });
  return response.data;
};

export default api;
