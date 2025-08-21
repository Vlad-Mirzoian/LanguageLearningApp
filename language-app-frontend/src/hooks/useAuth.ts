import { AxiosError } from "axios";
import {
  loginAPI,
  logoutAPI,
  refreshAPI,
  updateUserAPI,
  uploadAvatarAPI,
} from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useInterfaceLanguageStore } from "../store/interfaceLanguageStore";
import type { User } from "../types";
import i18next from "i18next";

interface AuthHook {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (user: User | null, token: string | null) => void;
  setUser: (user: User | null) => void;
  login: (idenitifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
  updateUser: (data: Partial<User>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

export const useAuth = (): AuthHook => {
  const { user, token, setAuth, setUser, clearAuth } = useAuthStore();

  const login = async (identifier: string, password: string) => {
    const data = await loginAPI({ identifier, password });
    setAuth(data.user, data.token);
    if (data.user?.interfaceLanguage) {
      const lang = data.user.interfaceLanguage;
      useInterfaceLanguageStore.getState().setLocale(lang.code, lang._id);
      await i18next.changeLanguage(lang.code);
    }
  };

  const logout = async () => {
    try {
      await logoutAPI();
    } finally {
      clearAuth();
    }
  };

  const refreshToken = async (): Promise<string> => {
    try {
      const { token: newToken } = await refreshAPI();
      setAuth(user, newToken);
      return newToken;
    } catch (error) {
      clearAuth();
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const updatedUser = await updateUserAPI(data);
      const authStore = useAuthStore.getState();
      authStore.setUser({
        ...authStore.user,
        ...updatedUser,
      });
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        clearAuth();
      }
      throw error;
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const response = await uploadAvatarAPI(file);
      const authStore = useAuthStore.getState();
      if (authStore.user) {
        authStore.setUser({
          ...authStore.user,
          avatar: response.avatar,
        });
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        clearAuth();
      }
      throw error;
    }
  };

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === "admin",
    setAuth,
    setUser,
    login,
    logout,
    refreshToken,
    updateUser,
    uploadAvatar,
  };
};
