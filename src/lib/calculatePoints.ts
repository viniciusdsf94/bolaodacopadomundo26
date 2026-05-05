import { supabase } from "@/integrations/supabase/client";

interface ScoringRule {
  id: string;
  label: string;
  description: string;
  points: number;
}

export interface BetScore {
  score_a: number;
  score_b: number;
}

export interface MatchScore {
  score_a: number;
  score_b: number;
  multiplier: number;
  scoring_rules: ScoringRule[];
}

/**
 * Calcula os pontos de uma aposta baseado no resultado da partida
 */
export function calculateBetPoints(
  bet: BetScore,
  match: MatchScore
): number {
  let totalPoints = 0;

  const betDifference = bet.score_a - bet.score_b;
  const matchDifference = match.score_a - match.score_b;

  const betWinner = bet.score_a > bet.score_b ? "a" : bet.score_b > bet.score_a ? "b" : "draw";
  const matchWinner = match.score_a > match.score_b ? "a" : match.score_b > match.score_a ? "b" : "draw";

  // Encontrar as regras de pontuação
  const ruleExato = match.scoring_rules.find(r => r.label.toLowerCase().includes("placar exato"));
  const ruleVencedor = match.scoring_rules.find(r => r.label.toLowerCase().includes("vencedor"));
  const ruleDiferenca = match.scoring_rules.find(r => r.label.toLowerCase().includes("diferença") || r.label.toLowerCase().includes("saldo"));
  const ruleGolsVencedor = match.scoring_rules.find(r => r.label.toLowerCase().includes("gols do vencedor"));
  const ruleGolsPerdedor = match.scoring_rules.find(r => r.label.toLowerCase().includes("gols do perdedor"));
  const ruleEmpateGarantido = match.scoring_rules.find(r => r.label.toLowerCase().includes("empate garantido"));

  // 0. Empate Garantido (independente do resultado da partida)
  if (bet.score_a === bet.score_b) {
    totalPoints += ruleEmpateGarantido?.points || 0;
  }

  // 1. Placar Exato
  if (bet.score_a === match.score_a && bet.score_b === match.score_b) {
    totalPoints += ruleExato?.points || 0;
    return totalPoints * match.multiplier; // Se acertou exato, não precisa validar outras regras
  }

  // 2. Vencedor Correto (necessário para as outras regras)
  if (betWinner === matchWinner) {
    totalPoints += ruleVencedor?.points || 0;

    // 3. Diferença de Gols
    if (betDifference === matchDifference) {
      totalPoints += ruleDiferenca?.points || 0;
    }

    // 4. Gols do Vencedor
    if (matchWinner === "a" && bet.score_a === match.score_a) {
      totalPoints += ruleGolsVencedor?.points || 0;
    } else if (matchWinner === "b" && bet.score_b === match.score_b) {
      totalPoints += ruleGolsVencedor?.points || 0;
    }

    // 5. Gols do Perdedor
    if (matchWinner === "a" && bet.score_b === match.score_b) {
      totalPoints += ruleGolsPerdedor?.points || 0;
    } else if (matchWinner === "b" && bet.score_a === match.score_a) {
      totalPoints += ruleGolsPerdedor?.points || 0;
    }
  }

  return totalPoints * match.multiplier;
}

/**
 * Atualiza os pontos de todas as apostas de uma partida
 */
export async function updateMatchBetsPoints(
  matchId: string,
  score_a: number,
  score_b: number
): Promise<void> {
  try {
    // 1. Buscar os dados da partida
    const { data: matchData, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError) throw matchError;

    // 2. Buscar as regras de pontuação
    const { data: scoringRules, error: rulesError } = await supabase
      .from("scoring_rules")
      .select("*");

    if (rulesError) throw rulesError;

    // 3. Buscar todas as apostas da partida
    const { data: bets, error: betsError } = await supabase
      .from("bets")
      .select("*")
      .eq("match_id", matchId);

    if (betsError) throw betsError;

    // 4. Calcular pontos para cada aposta
    const updates = bets.map(bet => {
      const points = calculateBetPoints(
        { score_a: bet.score_a, score_b: bet.score_b },
        {
          score_a,
          score_b,
          multiplier: matchData.multiplier,
          scoring_rules: scoringRules,
        }
      );

      return {
        id: bet.id,
        points,
      };
    });

    // 5. Atualizar as apostas com os pontos calculados
    for (const update of updates) {
      const { data, error: updateError } = await supabase
        .from("bets")
        .update({ points: update.points })
        .eq("id", update.id)
        .select();
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar aposta ${update.id}:`, {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
        });
        throw updateError;
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar pontos das apostas:", error);
    throw error;
  }
}
