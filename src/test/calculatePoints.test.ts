import { describe, it, expect } from "vitest";
import { calculateBetPoints } from "../lib/calculatePoints";

const mockScoringRules = [
  { id: "1", label: "Placar Exato", description: "", points: 10 },
  { id: "2", label: "Vencedor Correto", description: "", points: 5 },
  { id: "3", label: "Diferença de Gols", description: "", points: 3 },
  { id: "4", label: "Gols do Vencedor", description: "", points: 2 },
  { id: "5", label: "Gols do Perdedor", description: "", points: 2 },
  { id: "6", label: "Empate Garantido", description: "", points: 1 },
  { id: "7", label: "Vencedor dos Pênaltis", description: "", points: 4 },
];

describe("calculateBetPoints with Knockout & Penalties", () => {
  it("Scenario 1: Knockout match, actual score 1-1, penalty winner 'a'. Bet: 2-1 (predicted A wins in normal time), penalty winner 'b'. User should get 0 points.", () => {
    const bet = { score_a: 2, score_b: 1, penalty_winner: "b" };
    const match = {
      score_a: 1,
      score_b: 1,
      multiplier: 1,
      scoring_rules: mockScoringRules,
      is_knockout: true,
      penalty_winner: "a"
    };

    const points = calculateBetPoints(bet, match);
    // User got everything wrong (both the score/winner in regular time, and the penalty winner)
    // score_a !== score_b so no draw points, betWinner ('a') !== matchWinner ('draw'), so 0 points.
    expect(points).toBe(0);
  });

  it("Scenario 2: Knockout match, actual score 1-1, penalty winner 'b'. Bet: 2-1 (predicted A wins in normal time), penalty winner 'b'. User should get penalty winner points (4 points) even though they got normal time wrong.", () => {
    const bet = { score_a: 2, score_b: 1, penalty_winner: "b" };
    const match = {
      score_a: 1,
      score_b: 1,
      multiplier: 1,
      scoring_rules: mockScoringRules,
      is_knockout: true,
      penalty_winner: "b"
    };

    const points = calculateBetPoints(bet, match);
    // User got normal time wrong, but guessed the penalty winner correctly.
    // 4 points (Vencedor dos Pênaltis)
    expect(points).toBe(4);
  });

  it("Scenario 3: Knockout match, actual score 1-1, penalty winner 'a'. Bet: 1-1 (predicted draw), penalty winner 'a'. User should get exact score (10) + draw points (1) + penalty points (4) = 15 points.", () => {
    const bet = { score_a: 1, score_b: 1, penalty_winner: "a" };
    const match = {
      score_a: 1,
      score_b: 1,
      multiplier: 1,
      scoring_rules: mockScoringRules,
      is_knockout: true,
      penalty_winner: "a"
    };

    const points = calculateBetPoints(bet, match);
    // Placar Exato (10) + Empate Garantido (1) + Vencedor dos Pênaltis (4) = 15 points
    expect(points).toBe(15);
  });

  it("Scenario 4: Group stage match (is_knockout=false), actual score 1-1. Bet: 1-1, penalty winner 'a'. User should get exact score (10) + draw points (1) = 11 points (no penalty points).", () => {
    const bet = { score_a: 1, score_b: 1, penalty_winner: "a" };
    const match = {
      score_a: 1,
      score_b: 1,
      multiplier: 1,
      scoring_rules: mockScoringRules,
      is_knockout: false,
      penalty_winner: "a"
    };

    const points = calculateBetPoints(bet, match);
    // Placar Exato (10) + Empate Garantido (1) = 11 points (penalty winner ignored because it's not knockout)
    expect(points).toBe(11);
  });

  it("Scenario 5: Multiplier check. Knockout match, actual score 1-1, penalty winner 'b', multiplier 2. Bet: 2-1, penalty winner 'b'. User should get 8 points.", () => {
    const bet = { score_a: 2, score_b: 1, penalty_winner: "b" };
    const match = {
      score_a: 1,
      score_b: 1,
      multiplier: 2,
      scoring_rules: mockScoringRules,
      is_knockout: true,
      penalty_winner: "b"
    };

    const points = calculateBetPoints(bet, match);
    // 4 points * 2 multiplier = 8 points
    expect(points).toBe(8);
  });
});
