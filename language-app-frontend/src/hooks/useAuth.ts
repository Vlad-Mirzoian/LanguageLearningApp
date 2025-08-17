import { loginAPI, logoutAPI, refreshAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";
import type { User } from "../types";

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
}

export const useAuth = (): AuthHook => {
  const { user, token, setAuth, setUser, clearAuth } = useAuthStore();

  const login = async (identifier: string, password: string) => {
    const data = await loginAPI({ identifier, password });
    setAuth(data.user, data.token);
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
  };
};
