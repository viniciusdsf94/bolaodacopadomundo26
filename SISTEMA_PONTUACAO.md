# Sistema de Pontuação

## Visão Geral

O sistema de pontuação calcula automaticamente os pontos de cada aposta baseado no resultado final da partida após o admin confirmar o resultado.

## Regras de Pontuação

### 1. **Placar Exato** ⭐ (Maior pontuação)
- O placar da aposta deve ser **exatamente igual** ao resultado
- Exemplo: Palpite `2×1`, Resultado `2×1` ✅
- Exemplo: Palpite `2×0`, Resultado `2×1` ❌
- **Importante:** Se o placar for exato, as outras regras não são verificadas

### 2. **Vencedor Correto** (Base para outras regras)
- O time que o usuário apostou como vencedor deve ser o mesmo que venceu
- Exemplo: Palpite `2×0` (Time A vence), Resultado `5×1` (Time A vence) ✅
- Exemplo: Palpite `2×0` (Time A vence), Resultado `0×2` (Time B vence) ❌
- **Necessário:** Esta é a base para ganhar pontos nas próximas regras

### 3. **Diferença de Gols**
- A diferença entre os gols deve ser a mesma (score_a - score_b)
- Requer: Acertar o vencedor primeiro
- Exemplo: Palpite `2×0` (diff=2), Resultado `4×2` (diff=2) ✅
- Exemplo: Palpite `2×0` (diff=2), Resultado `3×1` (diff=2) ✅

### 4. **Gols do Vencedor**
- O número de gols do time vencedor deve estar correto
- Requer: Acertar o vencedor primeiro
- Exemplo: Palpite `2×0`, Resultado `2×1` (Time A venceu com 2 gols) ✅
- Exemplo: Palpite `2×0`, Resultado `0×2` (Time A errou o vencedor) ❌

### 5. **Gols do Perdedor**
- O número de gols do time perdedor deve estar correto
- Requer: Acertar o vencedor primeiro
- Exemplo: Palpite `2×0`, Resultado `2×1` (Time B perdeu com 1 gol) ✅
- Exemplo: Palpite `2×0`, Resultado `0×2` (Time A errou o vencedor) ❌

## Multiplicador

Cada partida pode ter um multiplicador que aumenta os pontos finais.

- Exemplo: Pontuação = 10, Multiplicador = 1.5
- Resultado: 10 × 1.5 = 15 pontos

## Fluxo de Confirmação de Resultado

1. **Admin clica em "Confirmar"** na página de detalhes da partida quando ela está em status "live"
2. **Preenche o placar final** (score_a × score_b)
3. **Sistema exibe um dialog** de dupla confirmação com aviso:
   - Mostra o placar que será confirmado
   - Avisa que a ação não poderá ser desfeita
4. **Admin clica em "Confirmar"** novamente
5. **Sistema executa:**
   - ✅ Atualiza o resultado na tabela `matches`
   - ✅ Altera status da partida para `finished`
   - ✅ Calcula pontos para TODAS as apostas
   - ✅ Atualiza o campo `points` em cada aposta
6. **Página recarrega** com os palpites atualizados mostrando os pontos

## Implementação Técnica

### Arquivo: `src/lib/calculatePoints.ts`

**Função Principal:** `calculateBetPoints(bet, match)`

```typescript
calculateBetPoints(
  { score_a: 2, score_b: 0 },  // Aposta do usuário
  {
    score_a: 2,                 // Resultado real
    score_b: 1,
    multiplier: 1.5,
    scoring_rules: [...]        // Array de regras do banco
  }
)
```

**Função de Atualização:** `updateMatchBetsPoints(matchId, score_a, score_b)`
- Busca todas as apostas da partida
- Calcula pontos para cada uma
- Atualiza o banco de dados

### Arquivo: `src/pages/MatchDetails.tsx`

**Estados:**
- `scoreA`, `scoreB` - Placar informado pelo admin
- `showConfirmDialog` - Controla o dialog de confirmação
- `isLoading` - Mostra loading durante atualização

**Componentes:**
- Campo de entrada para `score_a` e `score_b`
- Botão "Confirmar" (visível apenas para admins quando status = "live")
- AlertDialog para dupla confirmação

## Adição de Novas Regras

Para adicionar uma nova regra de pontuação:

1. **Acesse o banco Supabase**
2. **Vá para a tabela `scoring_rules`**
3. **Insira uma nova linha:**
   - `label`: Ex: "Gols do 1º Tempo"
   - `description`: Descrição da regra
   - `points`: Pontuação (ex: 5)

4. **Atualize a função `calculateBetPoints`** se precisar de lógica especial:
   ```typescript
   const rule = match.scoring_rules.find(r => r.label.toLowerCase().includes("novo"));
   if (/* condição */) {
     totalPoints += rule?.points || 0;
   }
   ```

## Testes Sugeridos

### Cenário 1: Placar Exato
- Palpite: `2×1`
- Resultado: `2×1`
- Esperado: Máxima pontuação (apenas regra de placar exato)

### Cenário 2: Vencedor + Diferença
- Palpite: `3×1` (diff=2)
- Resultado: `4×2` (diff=2, mesmo vencedor)
- Esperado: Pontos de vencedor + pontos de diferença

### Cenário 3: Vencedor Errado
- Palpite: `2×0` (Time A vence)
- Resultado: `0×2` (Time B vence)
- Esperado: 0 pontos

### Cenário 4: Gols Vencedor
- Palpite: `2×0`
- Resultado: `2×1`
- Esperado: Pontos de vencedor + pontos de gols vencedor

### Cenário 5: Multiplicador
- Pontos base: 10
- Multiplicador: 2
- Esperado: 20 pontos
