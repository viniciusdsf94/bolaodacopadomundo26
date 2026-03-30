/**
 * Match time utilities using America/Sao_Paulo timezone (GMT-3).
 * All comparisons use the real wall-clock time in BRT.
 */

import type { Match } from "@/hooks/useMatches";

/** Get current date/time in São Paulo timezone */
const nowInBRT = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

/** Build a Date object for a match in BRT */
export const matchDateTimeBRT = (match: Pick<Match, "match_date" | "match_time">) => {
  // match_date = "2026-06-14", match_time = "16:00:00"
  const [y, m, d] = match.match_date.split("-").map(Number);
  const [h, min] = match.match_time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0);
};

/**
 * Returns true if the match has already started (current BRT time >= match time).
 * Used to lock bets.
 */
export const isMatchStarted = (match: Pick<Match, "match_date" | "match_time">) => {
  return nowInBRT() >= matchDateTimeBRT(match);
};

/**
 * Returns true if the match is currently live.
 * A match is considered live if it started less than ~3 hours ago
 * (rough estimate; admin should update status for precision).
 */
export const isMatchLive = (match: Pick<Match, "match_date" | "match_time" | "status">) => {
  if (match.status === "live") return true;
  const now = nowInBRT();
  const start = matchDateTimeBRT(match);
  const elapsed = (now.getTime() - start.getTime()) / (1000 * 60);
  return elapsed >= 0 && elapsed <= 180; // within 3 hours of start
};
