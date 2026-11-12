import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../helpers/useAuth";

/** Redirects to /login when nobody is signed in. */
export default function RequireAuth() {
  const user = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
