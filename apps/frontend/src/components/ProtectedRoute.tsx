// apps/frontend/src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Поки контекст перевіряє localStorage, не робимо редирект
  if (isLoading) {
    return (
      <div style={{ color: "#fff", textAlign: "center", marginTop: "50px" }}>
        Завантаження...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
