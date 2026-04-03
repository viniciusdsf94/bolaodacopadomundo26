import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface UserRouteProps {
  children: ReactNode;
}

/**
 * Componente que protege rotas apenas para usuários comuns (não-admin)
 * Admins são redirecionados para /admin
 */
const UserRoute = ({ children }: UserRouteProps) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default UserRoute;
