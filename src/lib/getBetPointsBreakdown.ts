import { BetScore, MatchScore } from "./calculatePoints";

export interface PointsBreakdown {
  rules: Array<{
    name: string;
    points: number;
    earned: boolean;
  }>;
  multiplier: number;
  total: number;
}

/**
 * Retorna um detalhamento de quais regras foram acertadas
 */
export function getBetPointsBreakdown(
  bet: BetScore,
  match: MatchScore
): PointsBreakdown {
  const breakdown: PointsBreakdown = {
    rules: [],
    multiplier: match.multiplier,
    total: 0,
  };

  const betDifference = bet.score_a - bet.score_b;
  const matchDifference = match.score_a - match.score_b;

  const betWinner = bet.score_a > bet.score_b ? "a" : bet.score_b > bet.score_a ? "b" : "draw";
  const matchWinner = match.score_a > match.score_b ? "a" : match.score_b > match.score_a ? "b" : "draw";

  // Encontrar as regras
  const ruleExato = match.scoring_rules.find(r => r.label.toLowerCase().includes("placar exato"));
  const ruleVencedor = match.scoring_rules.find(r => r.label.toLowerCase().includes("vencedor"));
  const ruleDiferenca = match.scoring_rules.find(r => r.label.toLowerCase().includes("diferença") || r.label.toLowerCase().includes("saldo"));
  const ruleGolsVencedor = match.scoring_rules.find(r => r.label.toLowerCase().includes("gols do vencedor"));
  const ruleGolsPerdedor = match.scoring_rules.find(r => r.label.toLowerCase().includes("gols do perdedor"));
  const ruleEmpateGarantido = match.scoring_rules.find(r => r.label.toLowerCase().includes("empate garantido"));

  let totalBeforeMultiplier = 0;

  // 0. Empate Garantido
  const isBetDraw = bet.score_a === bet.score_b;
  const drawPoints = ruleEmpateGarantido?.points || 0;
  if (ruleEmpateGarantido) {
    breakdown.rules.push({
      name: ruleEmpateGarantido.label || "Empate Garantido",
      points: drawPoints,
      earned: isBetDraw,
    });
    if (isBetDraw) totalBeforeMultiplier += drawPoints;
  }

  // 1. Placar Exato
  const exactMatch = bet.score_a === match.score_a && bet.score_b === match.score_b;
  const exactPoints = ruleExato?.points || 0;
  breakdown.rules.push({
    name: ruleExato?.label || "Placar Exato",
    points: exactPoints,
    earned: exactMatch,
  });

  if (exactMatch) {
    totalBeforeMultiplier += exactPoints;
    breakdown.total = totalBeforeMultiplier * match.multiplier;
    return breakdown;
  }

  // 2. Vencedor Correto
  const winnerCorrect = betWinner === matchWinner;
  const winnerPoints = ruleVencedor?.points || 0;
  breakdown.rules.push({
    name: ruleVencedor?.label || "Vencedor Correto",
    points: winnerPoints,
    earned: winnerCorrect,
  });

  if (winnerCorrect) {
    totalBeforeMultiplier += winnerPoints;

    // 3. Diferença de Gols
    const differenceMatcher = betDifference === matchDifference;
    const differencePoints = ruleDiferenca?.points || 0;
    breakdown.rules.push({
      name: ruleDiferenca?.label || "Diferença de Gols",
      points: differencePoints,
      earned: differenceMatcher,
    });
    if (differenceMatcher) totalBeforeMultiplier += differencePoints;

    // 4. Gols do Vencedor
    let winnerGoalsCorrect = false;
    if (matchWinner === "a" && bet.score_a === match.score_a) {
      winnerGoalsCorrect = true;
    } else if (matchWinner === "b" && bet.score_b === match.score_b) {
      winnerGoalsCorrect = true;
    }
    const winnerGoalsPoints = ruleGolsVencedor?.points || 0;
    breakdown.rules.push({
      name: ruleGolsVencedor?.label || "Gols do Vencedor",
      points: winnerGoalsPoints,
      earned: winnerGoalsCorrect,
    });
    if (winnerGoalsCorrect) totalBeforeMultiplier += winnerGoalsPoints;

    // 5. Gols do Perdedor
    let loserGoalsCorrect = false;
    if (matchWinner === "a" && bet.score_b === match.score_b) {
      loserGoalsCorrect = true;
    } else if (matchWinner === "b" && bet.score_a === match.score_a) {
      loserGoalsCorrect = true;
    }
    const loserGoalsPoints = ruleGolsPerdedor?.points || 0;
    breakdown.rules.push({
      name: ruleGolsPerdedor?.label || "Gols do Perdedor",
      points: loserGoalsPoints,
      earned: loserGoalsCorrect,
    });
    if (loserGoalsCorrect) totalBeforeMultiplier += loserGoalsPoints;
  }

  breakdown.total = totalBeforeMultiplier * match.multiplier;
  return breakdown;
}
