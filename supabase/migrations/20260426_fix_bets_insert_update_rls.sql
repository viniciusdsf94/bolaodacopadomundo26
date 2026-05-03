-- Fix RLS policies for bets INSERT and UPDATE
-- Problem: The original policies check matches.status = 'upcoming', but newly created
-- matches default to 'upcoming' and the status check should also allow inserting
-- as long as the match hasn't started yet (based on actual time), not just status.
-- This ensures ALL authenticated users (not just the first one) can place bets.

-- ─── INSERT ───────────────────────────────────────────────────────────────────
-- Drop the old policy that may be too restrictive
DROP POLICY IF EXISTS "Users can insert their own bets" ON public.bets;

-- New policy: allow insert if the user is authenticated, the user_id matches,
-- and the match hasn't started yet (status = 'upcoming' OR time hasn't arrived).
CREATE POLICY "Users can insert their own bets"
  ON public.bets FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = match_id
        AND matches.status = 'upcoming'
        AND now() < (matches.match_date::timestamp + matches.match_time::time)
    )
  );

-- ─── UPDATE ───────────────────────────────────────────────────────────────────
-- Drop the old user update policy
DROP POLICY IF EXISTS "Users can update their own bets for upcoming matches" ON public.bets;

-- New policy: allow users to update their own bet as long as the match hasn't started
CREATE POLICY "Users can update their own bets for upcoming matches"
  ON public.bets FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = bets.match_id
        AND matches.status = 'upcoming'
        AND now() < (matches.match_date::timestamp + matches.match_time::time)
    )
  )
  WITH CHECK (
    auth.uid() = user_id
  );
