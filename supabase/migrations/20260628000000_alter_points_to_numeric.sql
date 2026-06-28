-- Migration to alter points columns to NUMERIC to support float values
-- Drops dependent triggers before altering column type, then re-creates them

-- 1. Drop dependent triggers
DROP TRIGGER IF EXISTS update_points_on_bets_change ON public.bets;
DROP TRIGGER IF EXISTS update_points_on_adjustments_change ON public.point_adjustments;

-- 2. Alter column types
ALTER TABLE public.bets ALTER COLUMN points TYPE NUMERIC;
ALTER TABLE public.point_adjustments ALTER COLUMN points TYPE NUMERIC;
ALTER TABLE public.profiles ALTER COLUMN total_points TYPE NUMERIC;

-- 3. Re-create triggers
CREATE TRIGGER update_points_on_bets_change
  AFTER INSERT OR UPDATE OF points OR DELETE ON public.bets
  FOR EACH ROW EXECUTE FUNCTION public.update_user_total_points();

CREATE TRIGGER update_points_on_adjustments_change
  AFTER INSERT OR UPDATE OF points OR DELETE ON public.point_adjustments
  FOR EACH ROW EXECUTE FUNCTION public.update_user_total_points();
