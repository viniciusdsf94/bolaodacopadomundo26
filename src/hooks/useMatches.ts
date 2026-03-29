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
      let query = supabase.from("bets").select("*");
      if (matchId) query = query.eq("match_id", matchId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
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
