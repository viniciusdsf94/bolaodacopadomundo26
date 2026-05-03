-- Permite que qualquer usuário autenticado veja todos os perfis (necessário para Ranking e Lista de Usuários)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Permite que administradores vejam todos os palpites, mesmo de partidas que ainda não começaram
DROP POLICY IF EXISTS "Admins can view all bets" ON public.bets;

CREATE POLICY "Admins can view all bets"
  ON public.bets FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
