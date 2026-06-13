export interface SortableBet {
  user_id: string;
  points: number | null;
  [key: string]: any;
}

/**
 * Sorts users' match predictions (bets) based on the match status:
 * - If not finished: sorts by overall classification position ascending (1st place first).
 * - If finished: sorts by points earned in this match descending. Ties are broken using overall classification position ascending.
 */
export function sortMatchBets<T extends SortableBet>(
  bets: T[],
  userPositions: Map<string, number>,
  isFinished: boolean
): T[] {
  return [...bets].sort((a, b) => {
    const posA = userPositions.get(a.user_id) ?? 999999;
    const posB = userPositions.get(b.user_id) ?? 999999;

    if (isFinished) {
      const pointsA = a.points ?? 0;
      const pointsB = b.points ?? 0;

      if (pointsB !== pointsA) {
        return pointsB - pointsA;
      }
      return posA - posB;
    } else {
      return posA - posB;
    }
  });
}
