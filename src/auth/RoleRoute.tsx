import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export default function RoleRoute({
  allow,
  children,
}: {
  allow: Array<"admin" | "faculty" | "student">;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
