-- ============================================================
-- MIGRAÇÃO: Adiciona estádio, cidade e país na tabela matches
-- Execute no Supabase SQL Editor
-- ============================================================

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS stadium TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS city    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '';

-- Verificação
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'matches'
  AND column_name IN ('stadium', 'city', 'country');
