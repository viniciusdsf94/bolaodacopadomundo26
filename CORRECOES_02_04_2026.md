# Correções Aplicadas - 02/04/2026

## Problemas Encontrados

### 1. Erro ao Buscar Bets
**Erro:** `PGRST200 - Could not find a relationship between 'bets' and 'profiles'`

**Causa:** A query estava tentando fazer um join entre `bets` e `profiles`, mas não há foreign key entre essas tabelas.

**Solução:**
- Removida a tentativa de join direto: `.select("*, profiles(first_name, last_name)")`
- Implementada duas queries separadas:
  1. Buscar bets normalmente
  2. Buscar profiles em paralelo
  3. Combinar dados em memória (mapping)
- A tabela profiles pode não existir no banco, então adicionado try/catch para não quebrar se não encontrar

**Arquivo modificado:** `src/hooks/useMatches.ts`

### 2. Erro 406 Not Acceptable ao Verificar Admin
**Erro:** Status 406 na requisição para `user_roles`

**Causa:** Uso de `.single()` sem resultado retorna 406. Quando o usuário não é admin, não há registro na tabela `user_roles`, causando erro.

**Solução:**
- Removido `.single()` da query
- Query agora retorna um array
- Verificação mudou de `data?.role === "admin"` para `data.length > 0 && data[0]?.role === "admin"`
- Se não houver registro, `isAdmin` fica `false` automaticamente

**Arquivo modificado:** `src/hooks/useAuth.tsx`

## RLS Policy Fix

Também foi preparada a correção da RLS policy (arquivo `supabase/migrations/20260401_fix_bets_rls_policy.sql`), mas **ainda precisa ser executada** via Supabase Dashboard.

### Como Aplicar:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. **SQL Editor** → **Novo Query**
4. Cole o conteúdo de: `supabase/migrations/20260401_fix_bets_rls_policy.sql`
5. Clique em **Run**

## Status Atual

✅ **Frontend corrigido** - Agora consegue buscar bets sem erros
✅ **Admin check corrigido** - Não mais 406 quando usuário não é admin
⏳ **RLS Policy** - Aguardando execução manual no Supabase

## Próximos Testes

1. Crie uma partida
2. Faça um palpite
3. Abra o console (F12) para ver logs
4. Clique na partida para ver se os palpites aparecem
5. **Esperado:** Palpites aparecem com nomes dos usuários ✅

Se continuar com erros, verifique:
- Se a tabela `profiles` foi criada (execute `supabase/setup_profiles.sql` se não foi)
- Se a RLS policy foi atualizada
- Console do navegador para mais detalhes
