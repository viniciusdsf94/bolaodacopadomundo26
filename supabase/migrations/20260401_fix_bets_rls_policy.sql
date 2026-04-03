-- Fix RLS policy for viewing bets in started matches
-- This policy allows users to view all bets for matches that have started (live or finished)

-- Drop the old policies that may conflict
DROP POLICY IF EXISTS "Users can view all bets for started matches" ON public.bets;
DROP POLICY IF EXISTS "Users can view bets for started matches" ON public.bets;

-- Create an improved policy that combines viewing own bets AND viewing bets for started matches
-- A match is considered "started" if:
-- 1. Status is 'live' or 'finished', OR
-- 2. Status is 'upcoming' but match_date + match_time has already passed (match has started)
CREATE POLICY "Users can view bets for started matches"
  ON public.bets FOR SELECT
  TO authenticated
  USING (
    -- Either it's their own bet
    auth.uid() = user_id
    OR
    -- Or the match has started/is live/finished
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = bets.match_id
      AND (
        matches.status IN ('live', 'finished')
        OR
        -- Match has started (current time >= match time)
        -- Compare timestamps in UTC for simplicity
        (matches.status = 'upcoming' 
         AND now() >= (matches.match_date::timestamp + matches.match_time::time)::timestamp with time zone)
      )
    )
  );

