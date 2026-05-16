import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankingUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  total_points: number;
  position: number;
  trend: 'up' | 'down' | 'none';
  position_change: number;
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

      // Fetch point adjustments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: adjustmentsData, error: adjustmentsError } = await (supabase as any)
        .from("point_adjustments")
        .select("id, user_id, points, created_at");

      if (adjustmentsError) {
        throw new Error(adjustmentsError.message);
      }

      // Agrupar por usuário e somar pontos
      const userPoints: Record<string, number> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (betsData || []).forEach((bet: any) => {
        userPoints[bet.user_id] = (userPoints[bet.user_id] || 0) + (bet.points || 0);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (adjustmentsData || []).forEach((adj: any) => {
        userPoints[adj.user_id] = (userPoints[adj.user_id] || 0) + (adj.points || 0);
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

      // Fetch all matches to find live and latest finished
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matchesData, error: matchesError } = await (supabase as any)
        .from("matches")
        .select("id, status, match_date, match_time");
      if (matchesError) throw new Error(matchesError.message);

      const hasLiveMatches = matchesData.some((m: any) => m.status === "live");

      let latestFinishedMatches: string[] = [];
      let latestAdjustments: string[] = [];
      let hasRecentUpdates = false;

      if (!hasLiveMatches) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finished = matchesData.filter((m: any) => m.status === "finished");
        
        let latestTime = 0;
        
        if (finished.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          finished.sort((a: any, b: any) => {
            const dateA = new Date(`${a.match_date}T${a.match_time}`).getTime();
            const dateB = new Date(`${b.match_date}T${b.match_time}`).getTime();
            return dateB - dateA;
          });
          latestTime = new Date(`${finished[0].match_date}T${finished[0].match_time}`).getTime();
        }

        const adjs = [...(adjustmentsData || [])];
        if (adjs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          adjs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const latestAdjTime = new Date(adjs[0].created_at).getTime();
          if (latestAdjTime > latestTime) {
            latestTime = latestAdjTime;
          }
        }

        if (latestTime > 0) {
          // Agrupar todas as atualizações que aconteceram dentro de uma janela de 5 minutos desse último evento
          const windowMs = 300000; // 5 minutos
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          latestFinishedMatches = finished.filter((m: any) => {
            return (latestTime - new Date(`${m.match_date}T${m.match_time}`).getTime()) < windowMs;
          }).map((m: any) => m.id);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          latestAdjustments = adjs.filter((a: any) => {
            return (latestTime - new Date(a.created_at).getTime()) < windowMs;
          }).map((a: any) => a.id);
          
          hasRecentUpdates = latestFinishedMatches.length > 0 || latestAdjustments.length > 0;
        }
      }

      // Calculate previous points by subtracting points from latest events
      const userPrevPoints: Record<string, number> = { ...userPoints };
      if (!hasLiveMatches && hasRecentUpdates) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (betsData || []).forEach((bet: any) => {
          if (latestFinishedMatches.includes(bet.match_id)) {
            userPrevPoints[bet.user_id] -= (bet.points || 0);
          }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adjustmentsData || []).forEach((adj: any) => {
          if (latestAdjustments.includes(adj.id)) {
            userPrevPoints[adj.user_id] -= (adj.points || 0);
          }
        });
      }

      // Calculate previous ranking positions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prevRankingList = (usersData || []).map((user: any) => ({
        user_id: user.id,
        prev_points: userPrevPoints[user.id] || 0
      })).sort((a, b) => {
        if (b.prev_points !== a.prev_points) return b.prev_points - a.prev_points;
        return a.user_id.localeCompare(b.user_id); // Tie-breaker estável
      });

      const prevPositions: Record<string, number> = {};
      prevRankingList.forEach((u, index) => {
        prevPositions[u.user_id] = index + 1;
      });

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
          trend: 'none' as 'up' | 'down' | 'none',
          position_change: 0
        }))
        .sort((a, b) => {
          if (b.total_points !== a.total_points) return b.total_points - a.total_points;
          return a.user_id.localeCompare(b.user_id); // Mesmo tie-breaker
        })
        .map((user, index) => {
          const currentPos = index + 1;
          const prevPos = prevPositions[user.user_id];
          let trend: 'up' | 'down' | 'none' = 'none';
          let change = 0;

          if (!hasLiveMatches && hasRecentUpdates) {
            change = prevPos - currentPos;
            if (currentPos < prevPos) trend = 'up';
            else if (currentPos > prevPos) trend = 'down';
          }

          return {
            ...user,
            position: currentPos,
            trend,
            position_change: Math.abs(change)
          };
        });

      return rankingData;
    },
    staleTime: 30000, // Cache por 30 segundos
    gcTime: 5 * 60 * 1000, // Garbage collection após 5 minutos
  });
};

export interface ChartDataPoint {
  date: string;
  [userId: string]: string | number; // userId -> position
}

export const useHistoricalRanking = () => {
  return useQuery({
    queryKey: ["historical_ranking"],
    queryFn: async () => {
      // 1. Fetch finished matches
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: matchesData, error: matchesError } = await (supabase as any)
        .from("matches")
        .select("id, match_date, status")
        .eq("status", "finished")
        .order("match_date", { ascending: true });

      if (matchesError) throw new Error(matchesError.message);

      // 2. Fetch all bets
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: betsData, error: betsError } = await (supabase as any)
        .from("bets")
        .select("match_id, user_id, points");

      if (betsError) throw new Error(betsError.message);

      // 3. Fetch all profiles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profilesData, error: profilesError } = await (supabase as any)
        .from("profiles")
        .select("id, first_name, last_name");

      if (profilesError) throw new Error(profilesError.message);

      // 4. Fetch point adjustments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: adjustmentsData, error: adjustmentsError } = await (supabase as any)
        .from("point_adjustments")
        .select("user_id, points, created_at");

      if (adjustmentsError) throw new Error(adjustmentsError.message);

      if (!matchesData || matchesData.length === 0) return { chartData: [], users: profilesData || [] };

      // Map match_id to match_date
      const matchDates: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      matchesData.forEach((m: any) => {
        matchDates[m.id] = m.match_date;
      });

      // Map adjustment dates
      const adjDates: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (adjustmentsData || []).forEach((adj: any) => {
        const d = new Date(adj.created_at).toISOString().split('T')[0];
        adj.date = d;
        adjDates.push(d);
      });

      // Get unique sorted dates
      const uniqueDates = Array.from(new Set([...Object.values(matchDates), ...adjDates])).sort();

      const chartData: ChartDataPoint[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userList = profilesData || [];

      // For each date, compute cumulative points
      const cumulativePoints: Record<string, number> = {};
      userList.forEach(u => cumulativePoints[u.id] = 0);

      uniqueDates.forEach((date) => {
        // Find matches that happened exactly on this date
        const matchesOnDate = matchesData.filter(m => m.match_date === date).map(m => m.id);
        
        // Add points for bets on those matches
        betsData.forEach(bet => {
          if (matchesOnDate.includes(bet.match_id) && bet.points) {
            cumulativePoints[bet.user_id] = (cumulativePoints[bet.user_id] || 0) + bet.points;
          }
        });

        // Add points for adjustments on this date
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adjustmentsData || []).forEach((adj: any) => {
          if (adj.date === date) {
            cumulativePoints[adj.user_id] = (cumulativePoints[adj.user_id] || 0) + adj.points;
          }
        });

        // Compute rankings for this date
        const rankingForDate = userList.map(u => ({
          userId: u.id,
          points: cumulativePoints[u.id] || 0
        })).sort((a, b) => b.points - a.points);

        // Assign positions (handling ties could mean same position, but simple index + 1 is fine for now)
        const dataPoint: ChartDataPoint = { date };
        rankingForDate.forEach((r, idx) => {
          dataPoint[r.userId] = idx + 1;
          dataPoint[`${r.userId}_points`] = r.points;
        });

        chartData.push(dataPoint);
      });

      return {
        chartData,
        users: userList
      };
    },
    staleTime: 30000,
  });
};
