-- Migration to support penalty shootouts in knockout stage (mata-mata)

-- 1. Alter matches table
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS is_knockout BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS penalty_winner TEXT CHECK (penalty_winner IN ('a', 'b'));

-- 2. Alter bets table
ALTER TABLE public.bets 
ADD COLUMN IF NOT EXISTS penalty_winner TEXT CHECK (penalty_winner IN ('a', 'b'));

-- 3. Insert penalty scoring rule if not exists
INSERT INTO public.scoring_rules (label, description, points)
SELECT 'Vencedor dos Pênaltis', 'Pontos adicionais por acertar o vencedor da disputa de pênaltis no mata-mata', 5
WHERE NOT EXISTS (
  SELECT 1 FROM public.scoring_rules WHERE label = 'Vencedor dos Pênaltis'
);
