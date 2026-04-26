import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // 🌟 Inalis ang UserRole import dito
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // 🌟 Ginawang string[] para flexible
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const location = useLocation();

  // 1. If no one is logged in, kick them back to the login page
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 2. Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    setTimeout(() => toast.error("Access Denied: You do not have permission to view that page."), 0);
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;