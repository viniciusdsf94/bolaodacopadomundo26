import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { checkAndStartMatches } from "@/lib/autoStartMatches";

/**
 * Hook que verifica se há partidas que devem começar
 * Roda continuamente a cada 10 segundos
 */
export const useAutoStartMatches = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Roda na primeira vez
    checkAndStartMatches(queryClient);

    // Depois roda a cada 10 segundos
    const interval = setInterval(() => {
      checkAndStartMatches(queryClient);
    }, 10000);

    // Limpar interval ao desmontar
    return () => clearInterval(interval);
  }, [queryClient]);
};
