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
        .select("user_id, points, match_id");

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
          const match = matchesData.find((m: any) => m.id === bet.match_id);
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

export interface CuriosityItem {
  type: "montanha_russa" | "nostradamus" | "zicado" | "rei_do_muro" | "pe_quente" | "pe_frio";
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
      // 1. Fetch finished matches (sorted chronologically)
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select("id, match_date, match_time, score_a, score_b, status")
        .eq("status", "finished");
      if (matchesError) throw matchesError;

      // 2. Fetch all bets
      const { data: bets, error: betsError } = await supabase
        .from("bets")
        .select("match_id, user_id, score_a, score_b, points");
      if (betsError) throw betsError;

      // 3. Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name");
      if (profilesError) throw profilesError;

      // 4. Fetch point adjustments to calculate history
      const { data: adjustments, error: adjustmentsError } = await supabase
        .from("point_adjustments")
        .select("user_id, points, created_at");
      if (adjustmentsError) throw adjustmentsError;

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

      uniqueDates.forEach((date) => {
        const matchesOnDate = (matches || []).filter(m => m.match_date === date).map(m => m.id);
        (bets || []).forEach(bet => {
          if (matchesOnDate.includes(bet.match_id) && bet.points) {
            cumulativePoints[bet.user_id] = (cumulativePoints[bet.user_id] || 0) + bet.points;
          }
        });
        (adjustments || []).forEach((adj: any) => {
          if (adj.date === date) {
            cumulativePoints[adj.user_id] = (cumulativePoints[adj.user_id] || 0) + adj.points;
          }
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

      let nostradamusUser: any = null;
      let maxExactStreak = 0;

      userList.forEach(u => {
        let currentStreak = 0;

        sortedMatches.forEach(m => {
          const bet = (bets || []).find(b => b.user_id === u.id && b.match_id === m.id);
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
          const bet = (bets || []).find(b => b.user_id === u.id && b.match_id === m.id);
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

      // Rei do Muro: Most correct ties (cumulative)
      let reiDoMuroUser: any = null;
      let maxCorrectTies = 0;

      userList.forEach(u => {
        let correctTies = 0;

        sortedMatches.forEach(m => {
          const bet = (bets || []).find(b => b.user_id === u.id && b.match_id === m.id);
          if (bet && bet.score_a === bet.score_b && m.score_a === m.score_b) {
            correctTies++;
          }
        });

        if (correctTies > maxCorrectTies) {
          maxCorrectTies = correctTies;
          reiDoMuroUser = u;
        }
      });

      // Pé Quente & Pé Frio (Winner streaks)
      let peQuenteUser: any = null;
      let maxWinnerStreak = 0;

      let peFrioUser: any = null;
      let maxLoserStreak = 0;

      userList.forEach(u => {
        let currentWinnerStreak = 0;
        let currentLoserStreak = 0;

        sortedMatches.forEach(m => {
          const bet = (bets || []).find(b => b.user_id === u.id && b.match_id === m.id);
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

      if (reiDoMuroUser && maxCorrectTies >= 3) {
        curiosities.push({
          type: "rei_do_muro",
          title: "🤝 Rei do Muro",
          description: `Acertou a ocorrência de empate em ${maxCorrectTies} ${maxCorrectTies === 1 ? 'jogo' : 'jogos'}.`,
          userName: `${reiDoMuroUser.first_name} ${reiDoMuroUser.last_name || ''}`.trim(),
          value: `${maxCorrectTies} empates`,
          icon: "🤝"
        });
      }

      return curiosities;
    },
    staleTime: 30000,
  });
};

