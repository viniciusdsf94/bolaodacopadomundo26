import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Se está autenticado, vai pro dashboard, senão vai pro login
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
};

export default RootRoute;
