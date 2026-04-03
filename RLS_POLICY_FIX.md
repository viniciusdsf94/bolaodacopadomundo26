# Fix RLS Policy para Visualizar Bets

## Problema Identificado

Quando uma partida muda de status para "live" (começou), os palpites não aparecem na página de detalhes da partida mesmo que o usuário possa vê-los.

### Contexto do Sistema

O sistema funciona assim:
1. **Admin cria partida** → Status fica `"upcoming"` (padrão do banco)
2. **Usuário faz palpite** enquanto status é `"upcoming"`
3. **Horário da partida chega** → Frontend calcula que a partida está "live" (usando `isMatchLive()`)
4. **Problema:** RLS policy no banco ainda vê status como `"upcoming"` e bloqueia visualizar palpites

### Causa Raiz

A RLS policy de visualização de bets estava verificando apenas:
- Status exatamente = "live" ou "finished"
- NÃO considerava que uma partida com status "upcoming" pode ter começado baseado na hora

## Solução

Combinar as duas policies em uma única policy que:
1. Permite ver bets próprios (qualquer hora)
2. Permite ver bets de partidas que começaram, considerando AMBOS:
   - Status é "live" ou "finished", OU
   - Status é "upcoming" MAS o horário atual >= horário da partida

```sql
DROP POLICY IF EXISTS "Users can view all bets for started matches" ON public.bets;
DROP POLICY IF EXISTS "Users can view bets for started matches" ON public.bets;

CREATE POLICY "Users can view bets for started matches"
  ON public.bets FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = bets.match_id
      AND (
        matches.status IN ('live', 'finished')
        OR
        (matches.status = 'upcoming' 
         AND now() >= (matches.match_date::timestamp + matches.match_time::time)::timestamp with time zone)
      )
    )
  );
```

## Como Aplicar

### Via Supabase Dashboard (Recomendado)

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Crie uma **Nova Query**
5. Cole o conteúdo do arquivo `supabase/migrations/20260401_fix_bets_rls_policy.sql`
6. Clique em **Run**
7. Verifique a mensagem de sucesso

### Via CLI

```bash
supabase db push
```

## Teste Depois de Aplicar

1. **Crie uma partida nova** com uma data/hora próxima (ex: 5 minutos no futuro)
2. **Faça um palpite** com uma conta não-admin enquanto ainda é "upcoming"
3. **Espere o horário chegar** ou ajuste o relógio do servidor se necessário
4. **Clique na partida**
5. **Esperado:** O palpite deve aparecer! ✅

## Verificação da Policy

Para verificar se a policy foi aplicada corretamente:

1. No **Supabase Dashboard**
2. Vá para **Database → Policies**
3. Procure pela tabela `bets`
4. Verifique se existe apenas UMA policy de SELECT chamada **"Users can view bets for started matches"**
5. Clique nela para ver a definição completa
6. Deve conter a lógica que considera o horário da partida

## Explicação Técnica

A comparison `now() >= (matches.match_date::timestamp + matches.match_time::time)::timestamp with time zone` funciona assim:

- `now()` = Hora atual em UTC
- `matches.match_date::timestamp` = Converte data (YYYY-MM-DD) para timestamp
- `matches.match_time::time` = Extrai a hora como tipo time
- `+` = Concatena data + hora em um timestamp
- `::timestamp with time zone` = Converte para timestamp with timezone
- O resultado é comparado: se agora >= hora da partida, a partida começou

Isso garante que o banco siga a mesma lógica que o frontend usa com `isMatchLive()`.

