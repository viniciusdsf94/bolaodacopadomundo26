import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, ListChecks, History, LogOut, Shield, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import PWAInstallBanner from "@/components/PWAInstallBanner";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/palpites", label: "Palpites", icon: ListChecks },
  { path: "/classificacao", label: "Classificação", icon: Trophy },
  { path: "/historico", label: "Histórico", icon: History },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Filtrar itens de navegação: admins veem apenas dashboard
  const filteredNavItems = isAdmin 
    ? [navItems[0]] // Apenas Dashboard
    : navItems; // Todos os itens

  return (
    <div className="min-h-screen bg-background">
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
            <img
              src="/pwa-192x192.png"
              alt="Bolão Copa 26"
              className="h-9 w-9 rounded-lg object-cover"
            />
            <span className="font-display text-lg font-bold text-foreground">
              Bolão <span className="text-gradient-gold">Copa 2026</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Painel de Administração">
                  <Shield className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around py-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="container py-6 pb-24 md:pb-6">{children}</main>
    </div>
  );
};

export default Layout;
