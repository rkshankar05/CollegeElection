import { Navigate } from "react-router-dom";
import { isLoggedIn, getUserRole } from "../utils/auth";

export default function ProtectedRoute({ children, role }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (role && getUserRole() !== role) return <Navigate to="/" replace />;
  return children;
}
