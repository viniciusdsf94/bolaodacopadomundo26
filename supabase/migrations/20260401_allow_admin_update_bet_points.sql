-- Allow admins to update bet points for calculating scores after match finishes
-- This is required for the automatic point calculation system to work

CREATE POLICY "Admins can update bet points"
  ON public.bets FOR UPDATE
  TO authenticated
  USING (
    -- Only admins can do this
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );
