import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import type { User } from "../types";

interface AuthHook {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (user: User | null, token: string | null) => void;
  logout: () => Promise<void>;
}

export const useAuth = () => {
  const { user, token, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      clearAuth();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      clearAuth();
      navigate("/login");
    }
  };

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === "admin",
    setAuth,
    logout,
  };
};
