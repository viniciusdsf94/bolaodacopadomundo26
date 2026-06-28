-- Migration to alter points columns to NUMERIC to support float values
-- This allows calculations with multipliers to have decimal values (e.g. 7.5 points)

-- 1. Alter points column in bets
ALTER TABLE public.bets ALTER COLUMN points TYPE NUMERIC;

-- 2. Alter points column in point_adjustments
ALTER TABLE public.point_adjustments ALTER COLUMN points TYPE NUMERIC;

-- 3. Alter total_points column in profiles
ALTER TABLE public.profiles ALTER COLUMN total_points TYPE NUMERIC;
