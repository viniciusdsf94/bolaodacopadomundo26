-- Drop the conflicting policy that restricts updates to upcoming matches
-- This was blocking admins from updating points after match finished
DROP POLICY IF EXISTS "Users can update their own bets for upcoming matches" ON public.bets;

-- Create new UPDATE policies that properly handle both users and admins
-- Users can only update their own bets for upcoming matches
CREATE POLICY "Users can update their own bets for upcoming matches"
  ON public.bets FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = bets.match_id
      AND matches.status = 'upcoming'
    )
  );

-- Admins can update any bet (for calculating points after match finishes)
-- This policy already exists but we want to ensure it's correct
-- Note: If "Admins can update bet points" policy exists, this is redundant but safe
