-- ============================================================
-- LIMPEZA DO BANCO DE DADOS
-- Remove: palpites (bets), partidas (matches) e scoring_rules
-- Mantém: usuários (auth.users), perfis (profiles), roles (user_roles)
-- ============================================================

-- 1. Apaga todos os palpites (bets)
--    (já seria feito automaticamente pelo CASCADE ao apagar matches,
--     mas fazemos explicitamente para clareza)
TRUNCATE TABLE public.bets CASCADE;

-- 2. Apaga todas as partidas (matches)
TRUNCATE TABLE public.matches CASCADE;

-- ============================================================
-- O que foi MANTIDO:
--   ✅ auth.users        → logins e senhas
--   ✅ public.profiles   → nomes e dados dos usuários  
--   ✅ public.user_roles → quem é admin / user
--   ✅ public.scoring_rules → regras de pontuação (mantidas)
-- ============================================================

-- Verificação opcional: confira que ficou vazio
-- SELECT COUNT(*) FROM public.matches;
-- SELECT COUNT(*) FROM public.bets;
