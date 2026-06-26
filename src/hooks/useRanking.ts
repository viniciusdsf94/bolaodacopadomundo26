/* eslint-disable @typescript-eslint/no-explicit-any */
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

const fetchAllBetsWithResult = async (selectFields: string): Promise<{ data: any[] | null; error: any | null }> => {
  try {
    let allBets: any[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from("bets")
        .select(selectFields)
        .range(page * pageSize, (page + 1) * pageSize - 1);
        
      if (error) return { data: null, error };
      if (!data || data.length === 0) break;
      
      allBets = [...allBets, ...data];
      if (data.length < pageSize) break;
      page++;
    }
    
    return { data: allBets, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
};

export const useRanking = () => {
  return useQuery({
    queryKey: ["ranking"],
    queryFn: async () => {
      // Fetch profiles with total_points from profiles table
      const { data: usersData, error: usersError } = await (supabase as any)
        .from("profiles")
        .select("id, first_name, last_name, total_points");
      
      if (usersError) throw new Error(usersError.message);

      // Fetch historical positions to calculate trends (up/down/none)
      const { data: historyData, error: historyError } = await (supabase as any)
        .from("v_historical_rankings")
        .select("user_id, date, position, total_points");

      const hasHistory = !historyError && historyData && historyData.length > 0;
      
      // Find the unique dates in history
      const uniqueDates = hasHistory 
        ? Array.from(new Set(historyData.map(h => h.date))).sort() 
        : [];
      
      const latestDate = uniqueDates[uniqueDates.length - 1];
      const prevDate = uniqueDates[uniqueDates.length - 2];

      // Map previous positions
      const prevPositionsMap: Record<string, number> = {};
      if (prevDate) {
        historyData
          .filter(h => h.date === prevDate)
          .forEach(h => {
            prevPositionsMap[h.user_id] = h.position;
          });
      }

      // Map current positions (from the latest historical record)
      const currentPositionsMap: Record<string, number> = {};
      if (latestDate) {
        historyData
          .filter(h => h.date === latestDate)
          .forEach(h => {
            currentPositionsMap[h.user_id] = h.position;
          });
      }

      // Build ranking data
      const rankingData: RankingUser[] = (usersData || [])
        .map((user: any) => {
          const currentPos = currentPositionsMap[user.id] || 0;
          const prevPos = prevPositionsMap[user.id] || 0;
          
          let trend: 'up' | 'down' | 'none' = 'none';
          let change = 0;

          if (currentPos && prevPos) {
            change = prevPos - currentPos;
            if (change > 0) trend = 'up';
            else if (change < 0) trend = 'down';
          }

          return {
            user_id: user.id,
            email: "",
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            total_points: user.total_points || 0,
            position: currentPos || 1, // Fallback if no history yet
            trend,
            position_change: Math.abs(change)
          };
        });

      // If there was no history, sort by total_points to assign positions
      if (!latestDate) {
        rankingData.sort((a, b) => b.total_points - a.total_points);
        rankingData.forEach((r, idx) => {
          r.position = idx + 1;
        });
      } else {
        // Sort by position according to the view
        rankingData.sort((a, b) => a.position - b.position);
      }

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
      const { data, error } = await (supabase as any)
        .from("v_historical_rankings")
        .select("user_id, date, position, total_points, first_name, last_name")
        .order("date", { ascending: true });

      if (error) throw new Error(error.message);

      if (!data || data.length === 0) {
        const { data: profiles } = await (supabase as any).from("profiles").select("id, first_name, last_name");
        return { chartData: [], users: profiles || [] };
      }

      // Mapear dados para o formato esperado pelo recharts e pelo frontend
      const chartDataMap: Record<string, ChartDataPoint> = {};
      const usersMap: Record<string, { id: string; first_name: string; last_name: string }> = {};

      data.forEach((row: any) => {
        const dateStr = row.date;
        if (!chartDataMap[dateStr]) {
          chartDataMap[dateStr] = { date: dateStr };
        }
        chartDataMap[dateStr][row.user_id] = row.position;
        chartDataMap[dateStr][`${row.user_id}_points`] = row.total_points;

        usersMap[row.user_id] = {
          id: row.user_id,
          first_name: row.first_name,
          last_name: row.last_name
        };
      });

      return {
        chartData: Object.values(chartDataMap),
        users: Object.values(usersMap)
      };
    },
    staleTime: 30000,
  });
};

export interface CuriosityItem {
  type: "montanha_russa" | "nostradamus" | "zicado" | "maior_pontuador_dia" | "pe_quente" | "pe_frio";
  title: string;
  description: string;
  userName: string;
  value: string | number;
  icon: string;
}

export const useCuriosities = () => {
  return useQuery({
    queryKey: ["curiosities"],
    queryFn: async () => {
      // Fetch dados em paralelo
      const [matchesResult, betsResult, profilesResult, adjustmentsResult] = await Promise.all([
        supabase.from("matches").select("id, match_date, match_time, score_a, score_b, status").eq("status", "finished"),
        fetchAllBetsWithResult("match_id, user_id, score_a, score_b, points"),
        supabase.from("profiles").select("id, first_name, last_name"),
        supabase.from("point_adjustments").select("user_id, points, created_at")
      ]);

      if (matchesResult.error) throw matchesResult.error;
      if (betsResult.error) throw betsResult.error;
      if (profilesResult.error) throw profilesResult.error;
      if (adjustmentsResult.error) throw adjustmentsResult.error;

      const matches = matchesResult.data;
      const bets = betsResult.data;
      const profiles = profilesResult.data;
      const adjustments = adjustmentsResult.data;

      const userList = profiles || [];
      const matchDates: Record<string, string> = {};
      (matches || []).forEach((m) => {
        matchDates[m.id] = m.match_date;
      });

      const adjDates: string[] = [];
      (adjustments || []).forEach((adj: any) => {
        const d = new Date(adj.created_at.replace(" ", "T")).toISOString().split('T')[0];
        adj.date = d;
        adjDates.push(d);
      });

      const uniqueDates = Array.from(new Set([...Object.values(matchDates), ...adjDates])).sort();
      const cumulativePoints: Record<string, number> = {};
      userList.forEach(u => cumulativePoints[u.id] = 0);

      const positionsHistory: Record<string, number[]> = {};
      userList.forEach(u => positionsHistory[u.id] = []);

      // Group bets by date for O(1) matching
      const betsByDate: Record<string, typeof bets> = {};
      (bets || []).forEach(bet => {
        const date = matchDates[bet.match_id];
        if (date) {
          if (!betsByDate[date]) betsByDate[date] = [];
          betsByDate[date].push(bet);
        }
      });

      // Group adjustments by date for O(1) matching
      const adjustmentsByDate: Record<string, typeof adjustments> = {};
      (adjustments || []).forEach((adj: any) => {
        const date = adj.date;
        if (date) {
          if (!adjustmentsByDate[date]) adjustmentsByDate[date] = [];
          adjustmentsByDate[date].push(adj);
        }
      });

      uniqueDates.forEach((date) => {
        const betsOnDate = betsByDate[date] || [];
        betsOnDate.forEach(bet => {
          if (bet.points) {
            cumulativePoints[bet.user_id] = (cumulativePoints[bet.user_id] || 0) + bet.points;
          }
        });

        const adjsOnDate = adjustmentsByDate[date] || [];
        adjsOnDate.forEach((adj: any) => {
          cumulativePoints[adj.user_id] = (cumulativePoints[adj.user_id] || 0) + adj.points;
        });

        const rankingForDate = userList.map(u => ({
          userId: u.id,
          points: cumulativePoints[u.id] || 0
        })).sort((a, b) => b.points - a.points);

        rankingForDate.forEach((r, idx) => {
          positionsHistory[r.userId].push(idx + 1);
        });
      });

      // Find the biggest jump on the LATEST day
      let biggestJumpUser: any = null;
      let maxJump = 0;
      let jumpDate = "";

      if (uniqueDates.length >= 2) {
        const latestIdx = uniqueDates.length - 1;
        const prevIdx = latestIdx - 1;

        userList.forEach(u => {
          const history = positionsHistory[u.id];
          if (history && history[prevIdx] !== undefined && history[latestIdx] !== undefined) {
            const jump = history[prevIdx] - history[latestIdx];
            if (jump > maxJump) {
              maxJump = jump;
              biggestJumpUser = u;
              jumpDate = uniqueDates[latestIdx];
            }
          }
        });
      }

      // Nostradamus: Current active streak of exact scores
      const sortedMatches = [...(matches || [])].sort((a, b) => {
        const dateTimeA = `${a.match_date}T${a.match_time || "00:00:00"}`;
        const dateTimeB = `${b.match_date}T${b.match_time || "00:00:00"}`;
        return dateTimeA.localeCompare(dateTimeB);
      });

      // Index bets by `${user_id}_${match_id}` for O(1) lookups
      const betsMap = new Map<string, typeof bets[0]>();
      (bets || []).forEach(bet => {
        betsMap.set(`${bet.user_id}_${bet.match_id}`, bet);
      });

      let nostradamusUser: any = null;
      let maxExactStreak = 0;

      userList.forEach(u => {
        let currentStreak = 0;

        sortedMatches.forEach(m => {
          const bet = betsMap.get(`${u.id}_${m.id}`);
          if (bet) {
            const isExact = bet.score_a === m.score_a && bet.score_b === m.score_b;
            if (isExact) {
              currentStreak++;
            } else {
              currentStreak = 0;
            }
          } else {
            currentStreak = 0;
          }
        });

        if (currentStreak > maxExactStreak) {
          maxExactStreak = currentStreak;
          nostradamusUser = u;
        }
      });

      // Zicado: Current active streak of 0 points
      let zicadoUser: any = null;
      let maxZeroStreak = 0;

      userList.forEach(u => {
        let currentStreak = 0;

        sortedMatches.forEach(m => {
          const bet = betsMap.get(`${u.id}_${m.id}`);
          if (bet && bet.points === 0) {
            currentStreak++;
          } else if (bet && (bet.points || 0) > 0) {
            currentStreak = 0;
          } else {
            currentStreak = 0;
          }
        });

        if (currentStreak > maxZeroStreak) {
          maxZeroStreak = currentStreak;
          zicadoUser = u;
        }
      });

      // Maior pontuador do dia anterior (última data com partidas finalizadas antes de hoje)
      let highestScorerUser: any = null;
      let highestScorerPoints = 0;
      let highestScorerDate = "";

      const todayStr = (() => {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      })();

      // Find the last date prior to today that has finished matches or adjustments
      let latestDateOverall = "";
      const finished = (matches || []).filter((m: any) => m.status === "finished" && m.match_date < todayStr);
      if (finished.length > 0) {
        const dates = finished.map((m: any) => m.match_date);
        latestDateOverall = dates.reduce((max, d) => d > max ? d : max, dates[0]);
      }

      if (adjustments && adjustments.length > 0) {
        const adjDatesOnly = adjustments
          .map((a: any) => new Date(a.created_at.replace(" ", "T")).toISOString().split('T')[0])
          .filter((d: string) => d < todayStr);
        if (adjDatesOnly.length > 0) {
          const maxAdjDate = adjDatesOnly.reduce((max, d) => d > max ? d : max, adjDatesOnly[0]);
          if (!latestDateOverall || maxAdjDate > latestDateOverall) {
            latestDateOverall = maxAdjDate;
          }
        }
      }

      if (latestDateOverall) {
        const dailyPoints: Record<string, number> = {};
        userList.forEach(u => dailyPoints[u.id] = 0);

        // Sum points for matches finished on this latest date
        const betsOnLatestDate = betsByDate[latestDateOverall] || [];
        betsOnLatestDate.forEach(bet => {
          if (bet.points) {
            dailyPoints[bet.user_id] = (dailyPoints[bet.user_id] || 0) + bet.points;
          }
        });

        // Sum points for adjustments on this latest date
        (adjustments || []).forEach((adj: any) => {
          const adjDate = new Date(adj.created_at.replace(" ", "T")).toISOString().split('T')[0];
          if (adjDate === latestDateOverall) {
            dailyPoints[adj.user_id] = (dailyPoints[adj.user_id] || 0) + adj.points;
          }
        });

        // Find the user with the maximum points
        let maxPoints = -1;
        let bestUser: any = null;
        userList.forEach(u => {
          const pts = dailyPoints[u.id] || 0;
          if (pts > maxPoints) {
            maxPoints = pts;
            bestUser = u;
          }
        });

        // Only show if the user actually gained points
        if (bestUser && maxPoints > 0) {
          highestScorerUser = bestUser;
          highestScorerPoints = maxPoints;
          highestScorerDate = latestDateOverall;
        }
      }

      // Pé Quente & Pé Frio (Winner streaks)
      let peQuenteUser: any = null;
      let maxWinnerStreak = 0;

      let peFrioUser: any = null;
      let maxLoserStreak = 0;

      userList.forEach(u => {
        let currentWinnerStreak = 0;
        let currentLoserStreak = 0;

        sortedMatches.forEach(m => {
          const bet = betsMap.get(`${u.id}_${m.id}`);
          if (bet) {
            const betWinner = bet.score_a > bet.score_b ? "a" : bet.score_b > bet.score_a ? "b" : "draw";
            const matchWinner = m.score_a > m.score_b ? "a" : m.score_b > m.score_a ? "b" : "draw";
            const correctWinner = betWinner === matchWinner;

            if (correctWinner) {
              currentWinnerStreak++;
              currentLoserStreak = 0;
            } else {
              currentLoserStreak++;
              currentWinnerStreak = 0;
            }
          } else {
            currentWinnerStreak = 0;
            currentLoserStreak = 0;
          }
        });

        if (currentWinnerStreak > maxWinnerStreak) {
          maxWinnerStreak = currentWinnerStreak;
          peQuenteUser = u;
        }

        if (currentLoserStreak > maxLoserStreak) {
          maxLoserStreak = currentLoserStreak;
          peFrioUser = u;
        }
      });

      const curiosities: CuriosityItem[] = [];

      if (biggestJumpUser && maxJump > 4) {
        const [y, m, d] = jumpDate.split('-');
        const formattedDate = `${d}/${m}`;
        curiosities.push({
          type: "montanha_russa",
          title: "🎢 Montanha-Russa",
          description: `Subiu ${maxJump} ${maxJump === 1 ? 'posição' : 'posições'} no ranking geral no dia ${formattedDate}!`,
          userName: `${biggestJumpUser.first_name} ${biggestJumpUser.last_name || ''}`.trim(),
          value: `+${maxJump} ${maxJump === 1 ? 'posição' : 'posições'}`,
          icon: "🎢"
        });
      }

      if (peQuenteUser && maxWinnerStreak >= 3) {
        curiosities.push({
          type: "pe_quente",
          title: "🔥 Pé Quente",
          description: `Acertou o vencedor de pelo menos ${maxWinnerStreak} jogos seguidos. Está com a visão em dia!`,
          userName: `${peQuenteUser.first_name} ${peQuenteUser.last_name || ''}`.trim(),
          value: `${maxWinnerStreak} acertos seguidos`,
          icon: "🔥"
        });
      }

      if (peFrioUser && maxLoserStreak >= 3) {
        curiosities.push({
          type: "pe_frio",
          title: "🤡 Pé Frio",
          description: `Errou o vencedor de ${maxLoserStreak} jogos seguidos. Mais perdido que o VAR!`,
          userName: `${peFrioUser.first_name} ${peFrioUser.last_name || ''}`.trim(),
          value: `${maxLoserStreak} erros seguidos`,
          icon: "🤡"
        });
      }

      if (nostradamusUser && maxExactStreak >= 3) {
        curiosities.push({
          type: "nostradamus",
          title: "🔮 Nostradamus",
          description: `Acertou o placar exato de ${maxExactStreak} ${maxExactStreak === 1 ? 'jogo' : 'jogos'} seguidos!`,
          userName: `${nostradamusUser.first_name} ${nostradamusUser.last_name || ''}`.trim(),
          value: `${maxExactStreak} seguidos`,
          icon: "🔮"
        });
      }

      if (zicadoUser && maxZeroStreak >= 3) {
        curiosities.push({
          type: "zicado",
          title: "🧊 Zicado",
          description: `Ficou ${maxZeroStreak} ${maxZeroStreak === 1 ? 'jogo' : 'jogos'} seguidos sem pontuar nada. Que azar!`,
          userName: `${zicadoUser.first_name} ${zicadoUser.last_name || ''}`.trim(),
          value: `${maxZeroStreak} jogos zerados`,
          icon: "🧊"
        });
      }

      if (highestScorerUser && highestScorerPoints > 0) {
        const [y, m, d] = highestScorerDate.split('-');
        const formattedDate = `${d}/${m}`;
        curiosities.unshift({
          type: "maior_pontuador_dia",
          title: "🏆 Destaque de Ontem",
          description: `Fez a maior pontuação nos jogos do dia ${formattedDate}, acumulando ${highestScorerPoints} pontos!`,
          userName: `${highestScorerUser.first_name} ${highestScorerUser.last_name || ''}`.trim(),
          value: `${highestScorerPoints} pontos`,
          icon: "🏆"
        });
      }

      return curiosities;
    },
    staleTime: 30000,
  });
};

