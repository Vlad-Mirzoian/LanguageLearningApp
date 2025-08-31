import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { refreshAPI } from "./authAPI";
import type { ApiError } from "../types/index";

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
        return Promise.reject({
          status: 401,
          message: "Unauthorized",
        } as ApiError);
      }
    }
    const formattedError: ApiError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Unexpected error",
      details: error.response?.data,
    };
    return Promise.reject(formattedError);
  }
);

export default api;
