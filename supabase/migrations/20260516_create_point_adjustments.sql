CREATE TABLE public.point_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  justification TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.point_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view point adjustments"
  ON public.point_adjustments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert point adjustments"
  ON public.point_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );
