-- 1. Adicionar coluna total_points em public.profiles se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0;

-- 2. Atualizar pontuações existentes de usuários ativos
UPDATE public.profiles p
SET total_points = COALESCE((
  SELECT SUM(COALESCE(b.points, 0)) 
  FROM public.bets b 
  WHERE b.user_id = p.id
), 0) + COALESCE((
  SELECT SUM(COALESCE(pa.points, 0)) 
  FROM public.point_adjustments pa 
  WHERE pa.user_id = p.id
), 0);

-- 3. Criar ou substituir a função de cálculo automático de total_points
CREATE OR REPLACE FUNCTION public.update_user_total_points()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Identificar o user_id da operação
  IF (TG_OP = 'DELETE') THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  -- Recalcular e atualizar na tabela profiles
  UPDATE public.profiles
  SET total_points = COALESCE((
    SELECT SUM(COALESCE(points, 0))
    FROM public.bets
    WHERE user_id = target_user_id
  ), 0) + COALESCE((
    SELECT SUM(COALESCE(points, 0))
    FROM public.point_adjustments
    WHERE user_id = target_user_id
  ), 0)
  WHERE id = target_user_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar triggers para atualizar perfis quando bets mudarem
DROP TRIGGER IF EXISTS update_points_on_bets_change ON public.bets;
CREATE TRIGGER update_points_on_bets_change
  AFTER INSERT OR UPDATE OF points OR DELETE ON public.bets
  FOR EACH ROW EXECUTE FUNCTION public.update_user_total_points();

-- 5. Criar triggers para atualizar perfis quando point_adjustments mudarem
DROP TRIGGER IF EXISTS update_points_on_adjustments_change ON public.point_adjustments;
CREATE TRIGGER update_points_on_adjustments_change
  AFTER INSERT OR UPDATE OF points OR DELETE ON public.point_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.update_user_total_points();

-- 6. Criar a View de Histórico de Rankings v_historical_rankings
DROP VIEW IF EXISTS public.v_historical_rankings CASCADE;
CREATE OR REPLACE VIEW public.v_historical_rankings AS
WITH daily_points AS (
  -- Pontos vindos de apostas de partidas finalizadas
  SELECT b.user_id, m.match_date AS date, SUM(COALESCE(b.points, 0)) AS points
  FROM public.bets b
  JOIN public.matches m ON b.match_id = m.id
  WHERE m.status = 'finished'
  GROUP BY b.user_id, m.match_date
  
  UNION ALL
  
  -- Pontos vindos de ajustes de pontuação por data
  SELECT pa.user_id, pa.created_at::date AS date, SUM(COALESCE(pa.points, 0)) AS points
  FROM public.point_adjustments pa
  GROUP BY pa.user_id, pa.created_at::date
),
aggregated_daily AS (
  -- Agrupar pontos do mesmo dia para cada usuário
  SELECT user_id, date, SUM(points) AS points
  FROM daily_points
  GROUP BY user_id, date
),
unique_dates AS (
  -- Todas as datas com algum evento de pontuação
  SELECT DISTINCT date FROM aggregated_daily
),
unique_users AS (
  -- Todos os usuários
  SELECT id AS user_id FROM public.profiles
),
user_dates AS (
  -- Grade completa de cada usuário para cada data
  SELECT u.user_id, d.date
  FROM unique_users u
  CROSS JOIN unique_dates d
),
user_date_points AS (
  -- Mapear os pontos ganhos por dia (ou 0 se nenhum)
  SELECT 
    ud.user_id, 
    ud.date,
    COALESCE(ad.points, 0) AS daily_points
  FROM user_dates ud
  LEFT JOIN aggregated_daily ad ON ud.user_id = ad.user_id AND ud.date = ad.date
),
cumulative AS (
  -- Calcular a soma acumulada de pontos ao longo das datas para cada usuário
  SELECT 
    user_id,
    date,
    SUM(daily_points) OVER (PARTITION BY user_id ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS total_points
  FROM user_date_points
),
ranked AS (
  -- Atribuir posições de ranking baseadas na pontuação acumulada do dia
  SELECT 
    user_id,
    date,
    total_points,
    RANK() OVER (PARTITION BY date ORDER BY total_points DESC, user_id ASC) AS position
  FROM cumulative
)
-- Retornar os dados consolidados juntando informações de perfil
SELECT 
  r.user_id,
  r.date,
  r.total_points,
  r.position,
  p.first_name,
  p.last_name
FROM ranked r
JOIN public.profiles p ON r.user_id = p.id;

-- Habilitar leitura da View
GRANT SELECT ON public.v_historical_rankings TO authenticated, anon;
