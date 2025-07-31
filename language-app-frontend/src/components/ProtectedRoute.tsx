import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
    } else if (
      (window.location.pathname.startsWith("/admin/languages") ||
        window.location.pathname.startsWith("/admin/categories")) &&
      user.role !== "admin"
    ) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  return isAuthenticated &&
    (!(
      window.location.pathname.startsWith("/admin/languages") ||
      window.location.pathname.startsWith("/admin/categories")
    ) ||
      user?.role === "admin") ? (
    <>{children}</>
  ) : null;
};

export default ProtectedRoute;
