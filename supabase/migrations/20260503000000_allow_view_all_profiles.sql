-- Permite que qualquer usuário autenticado veja todos os perfis
-- Isso é necessário para que a listagem de usuários e o ranking funcionem corretamente
-- e mostrem o nome de todos os participantes.

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
