import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { UserRole } from "../types";
import { dashboardPathFor, useAuth } from "../lib/auth/AuthProvider";

type ProtectedRouteProps = {
  roles?: UserRole[];
};

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={dashboardPathFor(user.role)} replace />;
  }

  return <Outlet />;
}
