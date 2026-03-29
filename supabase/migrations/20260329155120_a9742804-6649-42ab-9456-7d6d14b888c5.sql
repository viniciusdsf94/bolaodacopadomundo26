
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  flag_a TEXT NOT NULL DEFAULT '',
  flag_b TEXT NOT NULL DEFAULT '',
  match_date DATE NOT NULL,
  match_time TIME NOT NULL,
  multiplier NUMERIC NOT NULL DEFAULT 1,
  score_a INTEGER,
  score_b INTEGER,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone"
  ON public.matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete matches"
  ON public.matches FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bets table
CREATE TABLE public.bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_a INTEGER NOT NULL,
  score_b INTEGER NOT NULL,
  points INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)
);

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bets"
  ON public.bets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all bets for started matches"
  ON public.bets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = bets.match_id
      AND matches.status IN ('live', 'finished')
    )
  );

CREATE POLICY "Users can insert their own bets"
  ON public.bets FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = match_id
      AND matches.status = 'upcoming'
    )
  );

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

CREATE TRIGGER update_bets_updated_at
  BEFORE UPDATE ON public.bets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scoring rules table
CREATE TABLE public.scoring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scoring rules are viewable by everyone"
  ON public.scoring_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert scoring rules"
  ON public.scoring_rules FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update scoring rules"
  ON public.scoring_rules FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete scoring rules"
  ON public.scoring_rules FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_scoring_rules_updated_at
  BEFORE UPDATE ON public.scoring_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
