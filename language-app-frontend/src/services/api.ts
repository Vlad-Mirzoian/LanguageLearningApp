import axios from "axios";
import type {
  Attempt,
  AuthResponse,
  Card,
  CardResponse,
  Category,
  Language,
  LeaderboardEntry,
  StatsByType,
  TestCard,
  User,
  UserProgress,
  Word,
  WordResponse,
} from "../types";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.needsRefresh &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const { token: newToken } = await refreshAPI();
        useAuthStore.getState().setAuth(useAuthStore.getState().user, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export const register = async (data: {
  email: string;
  username: string;
  password: string;
  interfaceLanguageId: string;
  nativeLanguageId?: string;
  learningLanguagesIds?: string[];
}): Promise<User> => {
  const response = await api.post<User>("/auth/register", data);
  return response.data;
};

export const loginAPI = async (data: {
  identifier: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", data);
  return response.data;
};

export const refreshAPI = async (): Promise<{ token: string }> => {
  const response = await api.post("/auth/refresh");
  return response.data;
};

export const logoutAPI = async (): Promise<void> => {
  await api.post("/auth/logout");
};

export const verifyEmail = async (token: string) => {
  const response = await api.get(`/auth/verify/${token}`);
  return response.data;
};

export const updateUserAPI = async (
  data: Partial<{
    email: string;
    username: string;
    password?: string;
    nativeLanguageId?: string;
    learningLanguagesIds?: string[];
  }>
): Promise<User> => {
  const response = await api.put<User>("/auth/user", data);
  return response.data;
};

export const updateInterfaceLanguage = async (
  interfaceLanguageId: string
): Promise<Language> => {
  const response = await api.put("/auth/interface-language", {
    interfaceLanguageId,
  });
  return response.data;
};

export const uploadAvatarAPI = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await api.post<User>("/auth/upload-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
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
  const response = await api.post(`/auth/reset-password/${token}`, data);
  return response.data;
};

export const getLanguages = async (): Promise<Language[]> => {
  const response = await api.get("/languages");
  return response.data;
};

export const createLanguage = async (data: {
  code: string;
  name: string;
}): Promise<Language> => {
  const response = await api.post("/languages", data);
  return response.data;
};

export const updateLanguage = async (
  languageId: string,
  data: Partial<{ code: string; name: string }>
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

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get("/categories");
  return response.data;
};

export const createCategory = async (data: {
  name: string;
  description?: string;
  order: number;
  requiredScore: number;
}): Promise<Category> => {
  const response = await api.post("/categories", data);
  return response.data;
};

export const updateCategory = async (
  categoryId: string,
  data: Partial<{
    name: string;
    description?: string;
    order: number;
    requiredScore: number;
  }>
): Promise<Category> => {
  const response = await api.put(`/categories/${categoryId}`, data);
  return response.data;
};

export const deleteCategory = async (
  categoryId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/categories/${categoryId}`);
  return response.data;
};

export const updateCategoryOrders = async (
  orders: { id: string; order: number }[]
): Promise<{ message: string }> => {
  const response = await api.put("/categories/order", { orders });
  return response.data;
};

export const getWords = async (
  filters: {
    languageId?: string;
    text?: string;
    limit?: number;
    skip?: number;
  } = {}
): Promise<WordResponse> => {
  const response = await api.get("/words", { params: filters });
  return response.data;
};

export const checkWordUnique = async (data: {
  text: string;
  languageId: string;
}): Promise<{ isUnique: boolean }> => {
  const response = await api.get("/words/check-unique", { params: data });
  return response.data;
};

export const createWord = async (data: {
  text: string;
  languageId: string;
}): Promise<Word> => {
  const response = await api.post("/words", data);
  return response.data;
};

export const updateWord = async (
  wordId: string,
  data: Partial<{
    text: string;
    languageId: string;
  }>
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

export const getCards = async (
  filters: {
    categoryId?: string;
    example?: string;
    limit?: number;
    skip?: number;
  } = {}
): Promise<CardResponse> => {
  const response = await api.get("/cards", { params: filters });
  return response.data;
};

export const createCard = async (data: {
  wordId: string;
  translationId: string;
  categoryId: string;
  example?: string;
}): Promise<Card> => {
  const response = await api.post("/cards", data);
  return response.data;
};

export const updateCard = async (
  cardId: string,
  data: Partial<{
    wordId: string;
    translationId: string;
    categoryId: string;
    example?: string;
  }>
): Promise<Card> => {
  const response = await api.put(`/cards/${cardId}`, data);
  return response.data;
};

export const deleteCard = async (
  cardId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/cards/${cardId}`);
  return response.data;
};

export const getReviewCards = async (filters: {
  languageId: string;
  categoryId?: string;
}): Promise<{ cards: Card[]; attemptId: string | null }> => {
  const response = await api.get("/cards/review", { params: filters });
  return response.data;
};

export const getTestCards = async (filters: {
  languageId: string;
  categoryId?: string;
}): Promise<{ cards: TestCard[]; attemptId: string | null }> => {
  const response = await api.get("/cards/test", { params: filters });
  return response.data;
};

export const submitCard = async (
  cardId: string,
  data: {
    languageId: string;
    type: "flash" | "test" | "dictation";
    attemptId?: string | null;
    answer?: string;
  }
): Promise<{
  isCorrect: boolean;
  correctTranslation: string;
  quality: number;
  attempt: Attempt;
}> => {
  const response = await api.post(`/cards/${cardId}/submit`, data);
  return response.data;
};

export const getUserProgress = async (
  filters: { languageId?: string; categoryId?: string } = {}
): Promise<UserProgress[]> => {
  const response = await api.get("/user-progress", { params: filters });
  return response.data;
};

export const getStats = async (
  filters: { languageId?: string } = {}
): Promise<{
  progress: UserProgress[];
  statsByType: StatsByType;
  attempts: Attempt[];
}> => {
  const response = await api.get("/stats", { params: filters });
  return response.data;
};

export const shareAttempt = async (attemptId: string) => {
  const response = await api.post(`/attempts/${attemptId}/share`);
  return response.data;
};

export const viewAttempt = async (token: string): Promise<Attempt> => {
  const response = await api.get(`/attempts/view/${token}`);
  return response.data;
};

export const getLeaderboard = async (data: {
  languageId: string;
}): Promise<LeaderboardEntry[]> => {
  const response = await api.get("/leaderboard", { params: data });
  return response.data;
};

export default api;
