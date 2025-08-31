import { AuthAPI, UserAPI } from "../services/index";
import { useAuthStore } from "../store/authStore";
import { useInterfaceLanguageStore } from "../store/interfaceLanguageStore";
import type { ApiError, User } from "../types/index";
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
    const data = await AuthAPI.loginAPI({ identifier, password });
    setAuth(data.user, data.token);
    if (data.user?.interfaceLanguage) {
      const lang = data.user.interfaceLanguage;
      useInterfaceLanguageStore.getState().setLocale(lang.code, lang._id);
      await i18next.changeLanguage(lang.code);
    }
  };

  const logout = async () => {
    try {
      await AuthAPI.logoutAPI();
    } finally {
      clearAuth();
    }
  };

  const refreshToken = async (): Promise<string> => {
    try {
      const { token: newToken } = await AuthAPI.refreshAPI();
      setAuth(user, newToken);
      return newToken;
    } catch (error) {
      clearAuth();
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const response = await UserAPI.updateUserAPI(data);
      const authStore = useAuthStore.getState();
      authStore.setUser({
        ...authStore.user,
        ...response.user,
      });
    } catch (err) {
      const error = err as ApiError;
      if (error.status === 401) {
        clearAuth();
      }
      throw error;
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const response = await UserAPI.uploadAvatarAPI(file);
      const authStore = useAuthStore.getState();
      if (authStore.user) {
        authStore.setUser({
          ...authStore.user,
          avatar: response.avatar,
        });
      }
    } catch (err) {
      const error = err as ApiError;
      if (error.status === 401) {
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
