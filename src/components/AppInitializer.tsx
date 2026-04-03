import { useAutoStartMatches } from "@/hooks/useAutoStartMatches";

/**
 * Componente que inicializa a verificação de partidas ao vivo
 * Deve estar dentro do QueryClientProvider e AuthProvider
 */
export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  useAutoStartMatches();
  return <>{children}</>;
};
