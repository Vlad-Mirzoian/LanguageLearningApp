import { useAuthStore } from "../store/authStore";
import { logout } from "../services/api";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const { user, token, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      clearAuth();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === "admin",
    setAuth,
    logout: handleLogout,
  };
};
