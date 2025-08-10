import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";

interface AuthHook {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (user: User | null, token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuth = (): AuthHook => {
  const { user, token, setAuth, setUser, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const logout = async () => {
    clearAuth();
    navigate("/login");
  };

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === "admin",
    setAuth,
    setUser,
    logout,
  };
};
