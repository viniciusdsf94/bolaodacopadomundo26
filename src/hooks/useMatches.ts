import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Match = Tables<"matches">;

export const useMatches = () => {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: true })
        .order("match_time", { ascending: true });
      if (error) throw error;
      return data as Match[];
    },
  });
};

export const useScoringRules = () => {
  return useQuery({
    queryKey: ["scoring_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scoring_rules")
        .select("*")
        .order("points", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useBets = (matchId?: string) => {
  return useQuery({
    queryKey: ["bets", matchId],
    queryFn: async () => {
      // Buscar apenas os bets
      let query = supabase
        .from("bets")
        .select("*");
      if (matchId) query = query.eq("match_id", matchId);
      const { data: betsData, error: betsError } = await query;
      if (betsError) {
        console.error("Erro ao buscar bets:", betsError);
        throw betsError;
      }

      // Tentar buscar profiles (pode falhar se não estiver criada)
      let profilesData = [];
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (supabase as any).from("profiles").select("id, first_name, last_name");
        if (!response.error) {
          profilesData = response.data || [];
        }
      } catch {
        console.warn("Tabela profiles não encontrada, continuando sem profile data");
      }

      // Mapear profiles por user_id para acesso rápido
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profilesMap = new Map(profilesData.map((p: any) => [p.id, p]));

      // Combinar bets com profiles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrichedBets = (betsData || []).map((bet: any) => ({
        ...bet,
        profiles: profilesMap.get(bet.user_id) || { first_name: null, last_name: null },
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return enrichedBets as any[];
    },
    enabled: !!matchId,
  });
};

export const useMyBets = () => {
  return useQuery({
    queryKey: ["my_bets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bets")
        .select("*");
      if (error) throw error;
      return data;
    },
  });
};
