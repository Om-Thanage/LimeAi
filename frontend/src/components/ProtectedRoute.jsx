import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" />;
  }

  return children;
} 