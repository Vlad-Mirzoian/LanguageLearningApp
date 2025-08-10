import axios from "axios";
import type {
  AuthResponse,
  Card,
  Category,
  Language,
  ProgressResponse,
  UserProgress,
  Word,
} from "../types";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
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
  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);

export const register = async (data: {
  email: string;
  username: string;
  password: string;
  nativeLanguageId?: string;
  learningLanguagesIds?: string[];
}): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/register", data);
  return response.data;
};

export const login = async (data: {
  identifier: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", data);
  const { setAuth } = useAuthStore.getState();
  setAuth(response.data.user, response.data.token);
  return response.data;
};

export const verifyEmail = async (token: string) => {
  const response = await api.get(`/auth/verify/${token}`);
  return response.data;
};

export const updateUser = async (
  data: Partial<{
    email: string;
    username: string;
    password?: string;
    nativeLanguageId?: string;
    learningLanguagesIds?: string[];
  }>
): Promise<AuthResponse> => {
  const response = await api.put<AuthResponse>("/auth/user", data);
  const { setAuth, token } = useAuthStore.getState();
  setAuth(response.data.user, token);
  return response.data;
};

export const uploadAvatar = async (file: File): Promise<AuthResponse> => {
  const formData = new FormData();
  formData.append("avatar", file);
  const response = await api.post<AuthResponse>(
    "/auth/upload-avatar",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  const { token, setAuth } = useAuthStore.getState();
  setAuth(response.data.user, token);
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
  data: { code: string; name: string }
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
  data: {
    name: string;
    description?: string;
    order: number;
    requiredScore: number;
  }
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
  } = {}
): Promise<Word[]> => {
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
  data: {
    text: string;
    languageId: string;
  }
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
  } = {}
): Promise<Card[]> => {
  const response = await api.get("/cards", { params: filters });
  return response.data;
};

export const createCard = async (data: {
  wordId: string;
  translationId: string;
  categoryId: string;
  meaning?: string;
}): Promise<Card> => {
  const response = await api.post("/cards", data);
  return response.data;
};

export const updateCard = async (
  cardId: string,
  data: {
    wordId: string;
    translationId: string;
    categoryId: string;
    meaning?: string;
  }
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

export const reviewCard = async (
  cardId: string,
  data: { languageId: string; quality: number; attemptId?: string | null }
): Promise<UserProgress> => {
  const response = await api.put(`/cards/${cardId}/review`, data);
  return response.data.progress;
};

export const getUserProgress = async (
  filters: { languageId?: string; categoryId?: string } = {}
): Promise<UserProgress[]> => {
  const response = await api.get("/user-progress", { params: filters });
  return response.data;
};

export default api;
