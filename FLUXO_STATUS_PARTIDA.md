# Explicação do Sistema de Status de Partida

## Como Funciona

### 1. **Criação de Partida (Admin)**
- Admin cria uma nova partida com:
  - Times (A e B)
  - Data
  - Horário
  - Multiplicador
- ❌ Admin NÃO precisa definir manualmente o status (já vira "upcoming")
- ✅ Status padrão = `"upcoming"`

### 2. **Palpites (Usuário Comum)**
- Enquanto a partida estiver com status `"upcoming"` E o horário não chegou:
  - ✅ Pode fazer palpite
  - ✅ Pode editar palpite
- Quando o horário chega:
  - ❌ Não consegue mais editar palpites
  - ✅ Palpites ficam bloqueados

### 3. **Durante o Jogo**
- Frontend calcula que a partida está "live" usando `isMatchLive()`
  - Verifica se passou o horário
  - Ou se status = "live"
- Status no banco continua = `"upcoming"` (não muda automaticamente)
- ✅ Palpites podem ser visualizados
- ✅ Admin pode ver a partida e confirmar resultado

### 4. **Final da Partida (Admin)**
- Admin vai na página de detalhes da partida
- Admin preenche o placar final (ex: 2 × 1)
- Admin clica "Confirmar" e valida em um dialog
- Sistema:
  - Atualiza score_a e score_b
  - Muda status para `"finished"`
  - Calcula pontos para TODAS as apostas
  - Atualiza campo `points` em cada aposta

## Fluxo Completo - Exemplo

```
HORA 1: 14:00 - Admin cria partida
   Brasil vs Argentina
   Data: 2026-04-01
   Horário: 16:00
   Status: "upcoming" ✅

HORA 2: 15:30 - Usuário faz palpite
   Palpite: 2 × 1 (Brasil vence)
   Status ainda: "upcoming"
   ✅ Consegue salvar

HORA 3: 16:00 - Horário da partida chega
   Frontend vê: isMatchLive() = true
   Usuário: ❌ Não consegue mais editar
   Palpite: ✅ Continua visível
   Status no banco: ainda "upcoming" (Normal!)

HORA 4: 17:45 - Jogo terminou (Brasil 2 × 1 Argentina)
   Admin vai em /partida/:id
   Admin vê: Campo de resultado
   Admin preenche: 2 × 1
   Admin clica: "Confirmar"
   
   Sistema:
   - Salva score_a=2, score_b=1
   - Muda status para "finished"
   - Calcula: Usuário acertou placar exato = máxima pontuação!
   - Atualiza bets.points = [pontos calculados]

HORA 5: 18:00 - Resultado confirmado
   Status no banco: "finished" ✅
   Palpites: ✅ Mostram os pontos ganhos
   Dashboard: ✅ Mostra novos pontos totais
```

## RLS Policy (Visualização de Palpites)

A policy permite visualizar palpites de uma partida se:

1. É o palpite próprio (qualquer hora), OU
2. A partida começou, definido por:
   - Status = "live" OU "finished", OU
   - Status = "upcoming" MAS horário atual >= horário da partida

```sql
auth.uid() = user_id
OR
EXISTS (
  SELECT 1 FROM public.matches
  WHERE matches.id = bets.match_id
  AND (
    matches.status IN ('live', 'finished')
    OR
    (matches.status = 'upcoming' 
     AND now() >= match_time_in_brt)
  )
)
```

## Estados Possíveis

| Status | Palpite? | Ver Palpites? | Editar Resultado? |
|--------|----------|---------------|-------------------|
| upcoming (futuro) | ✅ Pode | ❌ Não | ❌ Não |
| upcoming (passou horário) | ❌ Não | ✅ Sim | ✅ Sim (admin) |
| live | ❌ Não | ✅ Sim | ✅ Sim (admin) |
| finished | ❌ Não | ✅ Sim | ❌ Não (pronto) |

## Solução Aplicada

A RLS policy foi atualizada para considerar o horário da partida, não apenas o status no banco. Isso alinha o comportamento do frontend com o do banco de dados.

**Arquivo:** `supabase/migrations/20260401_fix_bets_rls_policy.sql`

Execute via Supabase Dashboard → SQL Editor
