import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankingUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  total_points: number;
  position: number;
}

export const useRanking = () => {
  return useQuery({
    queryKey: ["ranking"],
    queryFn: async () => {
      // Buscar todos os usuários e seus pontos totais
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: betsData, error: betsError } = await (supabase as any)
        .from("bets")
        .select("user_id, points");

      if (betsError) {
        throw new Error(betsError.message);
      }

      // Agrupar por usuário e somar pontos
      const userPoints: Record<string, number> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (betsData || []).forEach((bet: any) => {
        userPoints[bet.user_id] = (userPoints[bet.user_id] || 0) + (bet.points || 0);
      });

      // Buscar informações de TODOS os usuários (profiles)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: usersData, error: usersError } = await (supabase as any)
        .from("profiles")
        .select("id, first_name, last_name")
        .order("first_name", { ascending: true });

      if (usersError) {
        throw new Error(usersError.message);
      }

      // Montar ranking com TODOS os usuários
      const rankingData: RankingUser[] = (usersData || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((user: any) => ({
          user_id: user.id,
          email: "", // Será preenchido depois se necessário
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          total_points: userPoints[user.id] || 0,
          position: 0, // Será atualizado depois
        }))
        .sort((a, b) => b.total_points - a.total_points)
        .map((user, index) => ({
          ...user,
          position: index + 1,
        }));

      return rankingData;
    },
    staleTime: 30000, // Cache por 30 segundos
    gcTime: 5 * 60 * 1000, // Garbage collection após 5 minutos
  });
};
