import { describe, it, expect } from "vitest";
import { sortMatchBets } from "../lib/matchBetsSort";

describe("sortMatchBets", () => {
  const mockBets = [
    { id: "1", user_id: "userA", points: 3, score_a: 2, score_b: 1 },
    { id: "2", user_id: "userB", points: 9, score_a: 1, score_b: 1 },
    { id: "3", user_id: "userC", points: 0, score_a: 0, score_b: 3 },
    { id: "4", user_id: "userD", points: 9, score_a: 2, score_b: 2 },
  ];

  // Map of overall ranking positions:
  // userA: 4th
  // userB: 2nd
  // userC: 1st
  // userD: 3rd
  const userPositions = new Map<string, number>([
    ["userC", 1],
    ["userB", 2],
    ["userD", 3],
    ["userA", 4],
  ]);

  it("should sort by overall classification position ascending when match is not finished", () => {
    const sorted = sortMatchBets(mockBets, userPositions, false);
    
    // Expect: userC (1st), userB (2nd), userD (3rd), userA (4th)
    expect(sorted.map(b => b.user_id)).toEqual(["userC", "userB", "userD", "userA"]);
  });

  it("should sort by game points descending when match is finished", () => {
    const sorted = sortMatchBets(mockBets, userPositions, true);

    // Points:
    // userB = 9
    // userD = 9
    // userA = 3
    // userC = 0
    //
    // For ties (userB & userD both have 9 points):
    // userB ranking = 2, userD ranking = 3. Since 2 < 3, userB should be before userD.
    //
    // Expect: userB, userD, userA, userC
    expect(sorted.map(b => b.user_id)).toEqual(["userB", "userD", "userA", "userC"]);
  });

  it("should place users with missing ranking positions at the end", () => {
    const betsWithNewUser = [
      ...mockBets,
      { id: "5", user_id: "userNew", points: 12, score_a: 1, score_b: 0 }
    ];
    
    // Test for unfinished: userNew should be last (position defaults to 999999)
    const sortedUnfinished = sortMatchBets(betsWithNewUser, userPositions, false);
    expect(sortedUnfinished[sortedUnfinished.length - 1].user_id).toBe("userNew");

    // Test for finished: userNew has 12 points (max points). They should be first despite missing position!
    const sortedFinished = sortMatchBets(betsWithNewUser, userPositions, true);
    expect(sortedFinished[0].user_id).toBe("userNew");
  });
});
