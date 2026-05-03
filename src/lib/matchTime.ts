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
 * A match is considered live if its status is "live" OR if it has started and is not "finished".
 * Finished matches should not appear as live, regardless of time.
 */
export const isMatchLive = (match: Pick<Match, "match_date" | "match_time" | "status">) => {
  if (match.status === "finished") return false;
  return match.status === "live" || isMatchStarted(match);
};

/**
 * Returns true if at least 2 hours have passed since the match started.
 * Used to allow the admin to register/edit the final score.
 */
export const isMatchFinishable = (match: Pick<Match, "match_date" | "match_time">) => {
  const startTime = matchDateTimeBRT(match);
  const twoHoursAfterStart = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
  return nowInBRT() >= twoHoursAfterStart;
};
