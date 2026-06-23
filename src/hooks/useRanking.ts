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

export const useRanking = () => {
  return useQuery({
    queryKey: ["ranking"],
    queryFn: async () => {
      // Buscar dados em paralelo
      const [betsResult, adjustmentsResult, usersResult, matchesResult] = await Promise.all([
        (supabase as any).from("bets").select("user_id, points, match_id"),
        (supabase as any).from("point_adjustments").select("id, user_id, points, created_at"),
        (supabase as any).from("profiles").select("id, first_name, last_name").order("first_name", { ascending: true }),
        (supabase as any).from("matches").select("id, status, match_date, match_time")
      ]);

      if (betsResult.error) throw new Error(betsResult.error.message);
      if (adjustmentsResult.error) throw new Error(adjustmentsResult.error.message);
      if (usersResult.error) throw new Error(usersResult.error.message);
      if (matchesResult.error) throw new Error(matchesResult.error.message);

      const betsData = betsResult.data;
      const adjustmentsData = adjustmentsResult.data;
      const usersData = usersResult.data;
      const matchesData = matchesResult.data;

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

      // Mapear partidas por id para busca rápida
      const matchesMap: Record<string, any> = {};
      (matchesData || []).forEach((m: any) => {
        matchesMap[m.id] = m;
      });

      // Encontrar a última data em que houve alguma partida finalizada ou ajuste de pontos
      const finished = matchesData.filter((m: any) => m.status === "finished");
      let latestDateOverall = "";

      if (finished.length > 0) {
        const dates = finished.map((m: any) => m.match_date);
        latestDateOverall = dates.reduce((max, d) => d > max ? d : max, dates[0]);
      }

      if (adjustmentsData && adjustmentsData.length > 0) {
        const adjDates = adjustmentsData.map((a: any) => new Date(a.created_at.replace(" ", "T")).toISOString().split('T')[0]);
        const maxAdjDate = adjDates.reduce((max, d) => d > max ? d : max, adjDates[0]);
        if (!latestDateOverall || maxAdjDate > latestDateOverall) {
          latestDateOverall = maxAdjDate;
        }
      }

      // Calcular pontos anteriores desconsiderando os eventos da última data (para ver a tendência em relação ao dia anterior)
      const userPrevPoints: Record<string, number> = { ...userPoints };
      
      if (latestDateOverall) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (betsData || []).forEach((bet: any) => {
          const match = matchesMap[bet.match_id];
          if (match && match.status === "finished" && match.match_date === latestDateOverall) {
            userPrevPoints[bet.user_id] = (userPrevPoints[bet.user_id] || 0) - (bet.points || 0);
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adjustmentsData || []).forEach((adj: any) => {
          const adjDate = new Date(adj.created_at.replace(" ", "T")).toISOString().split('T')[0];
          if (adjDate === latestDateOverall) {
            userPrevPoints[adj.user_id] = (userPrevPoints[adj.user_id] || 0) - (adj.points || 0);
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

          if (prevPos) {
            change = prevPos - currentPos;
            if (change > 0) trend = 'up';
            else if (change < 0) trend = 'down';
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
      // Fetch dados em paralelo
      const [matchesResult, betsResult, profilesResult, adjustmentsResult] = await Promise.all([
        (supabase as any).from("matches").select("id, match_date, status").eq("status", "finished").order("match_date", { ascending: true }),
        (supabase as any).from("bets").select("match_id, user_id, points"),
        (supabase as any).from("profiles").select("id, first_name, last_name"),
        (supabase as any).from("point_adjustments").select("user_id, points, created_at")
      ]);

      if (matchesResult.error) throw new Error(matchesResult.error.message);
      if (betsResult.error) throw new Error(betsResult.error.message);
      if (profilesResult.error) throw new Error(profilesResult.error.message);
      if (adjustmentsResult.error) throw new Error(adjustmentsResult.error.message);

      const matchesData = matchesResult.data;
      const betsData = betsResult.data;
      const profilesData = profilesResult.data;
      const adjustmentsData = adjustmentsResult.data;

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
        const d = new Date(adj.created_at.replace(" ", "T")).toISOString().split('T')[0];
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

      // Group bets by date for O(1) matching
      const betsByDate: Record<string, typeof betsData> = {};
      (betsData || []).forEach(bet => {
        const date = matchDates[bet.match_id];
        if (date) {
          if (!betsByDate[date]) betsByDate[date] = [];
          betsByDate[date].push(bet);
        }
      });

      // Group adjustments by date for O(1) matching
      const adjustmentsByDate: Record<string, typeof adjustmentsData> = {};
      (adjustmentsData || []).forEach((adj: any) => {
        const date = adj.date;
        if (date) {
          if (!adjustmentsByDate[date]) adjustmentsByDate[date] = [];
          adjustmentsByDate[date].push(adj);
        }
      });

      uniqueDates.forEach((date) => {
        // Add points for bets on this date
        const betsOnDate = betsByDate[date] || [];
        betsOnDate.forEach(bet => {
          if (bet.points) {
            cumulativePoints[bet.user_id] = (cumulativePoints[bet.user_id] || 0) + bet.points;
          }
        });

        // Add points for adjustments on this date
        const adjsOnDate = adjustmentsByDate[date] || [];
        adjsOnDate.forEach((adj: any) => {
          cumulativePoints[adj.user_id] = (cumulativePoints[adj.user_id] || 0) + adj.points;
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
        supabase.from("bets").select("match_id, user_id, score_a, score_b, points"),
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

      // Maior pontuador do dia anterior (última data com partidas finalizadas)
      let highestScorerUser: any = null;
      let highestScorerPoints = 0;
      let highestScorerDate = "";

      // Find the last date that has finished matches or adjustments
      let latestDateOverall = "";
      const finished = (matches || []).filter((m: any) => m.status === "finished");
      if (finished.length > 0) {
        const dates = finished.map((m: any) => m.match_date);
        latestDateOverall = dates.reduce((max, d) => d > max ? d : max, dates[0]);
      }

      if (adjustments && adjustments.length > 0) {
        const adjDatesOnly = adjustments.map((a: any) => new Date(a.created_at.replace(" ", "T")).toISOString().split('T')[0]);
        const maxAdjDate = adjDatesOnly.reduce((max, d) => d > max ? d : max, adjDatesOnly[0]);
        if (!latestDateOverall || maxAdjDate > latestDateOverall) {
          latestDateOverall = maxAdjDate;
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

