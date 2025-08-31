import { useEffect } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, user } = useAuth();

  const adminRoutes = [
    "/admin/languages",
    "/admin/modules",
    "/admin/words",
    "/admin/cards",
  ];

  const isAdminRoute = adminRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (isAdminRoute && user?.role !== "admin") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isAdminRoute, user?.role, navigate]);

  if (!isAuthenticated || !user) return null;
  if (isAdminRoute && user.role !== "admin") return null;

  return <>{children}</>;
};

export default ProtectedRoute;
