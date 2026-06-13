import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import RootRoute from "@/components/RootRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import UserRoute from "@/components/UserRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Bets from "./pages/Bets";
import GroupBets from "./pages/GroupBets";
import Live from "./pages/Live";
import Ranking from "./pages/Ranking";
import MatchDetails from "./pages/MatchDetails";
import Admin from "./pages/Admin";
import AdminMatchUsers from "./pages/AdminMatchUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Register />} />
              <Route path="/dashboard" element={<UserRoute><Dashboard /></UserRoute>} />
              <Route path="/palpites" element={<UserRoute><Bets /></UserRoute>} />
              <Route path="/classificacao" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
              <Route path="/historico" element={<UserRoute><GroupBets /></UserRoute>} />
              <Route path="/ao-vivo" element={<UserRoute><Live /></UserRoute>} />
              <Route path="/partida/:id" element={<ProtectedRoute><MatchDetails /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/admin/partida/:id" element={<AdminRoute><AdminMatchUsers /></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
