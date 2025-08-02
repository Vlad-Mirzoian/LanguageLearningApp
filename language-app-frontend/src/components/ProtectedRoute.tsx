import { useEffect } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const adminRoutes = [
    "/admin/languages",
    "/admin/categories",
    "/admin/words",
    "/admin/cards",
  ];

  const isAdminRoute = adminRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
    } else if (isAdminRoute && user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, isAdminRoute, navigate]);

  if (!isAuthenticated || !user) return null;
  if (isAdminRoute && user.role !== "admin") return null;

  return <>{children}</>;
};

export default ProtectedRoute;
