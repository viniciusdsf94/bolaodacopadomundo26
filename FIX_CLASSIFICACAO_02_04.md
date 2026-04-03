# Fix Classificação Não Atualizar - 02/04/2026

## Problema Identificado

Quando o admin confirmava o resultado de uma partida, os pontos eram calculados e salvos no banco, mas a página de classificação **não refletia as mudanças** até recarregar completamente a página.

## Causa Raiz

1. **Hook useRanking usava useState** em vez de useQuery
   - Isso significava que não tinha suporte a invalidação/refetch de cache
   - React Query não conseguia atualizar os dados automaticamente

2. **Falta de invalidação de cache** em MatchDetails
   - Após confirmar resultado, não havia notificação ao React Query para atualizar os dados

## Solução Aplicada

### 1. **Migrrar useRanking de useState para useQuery** ✅
**Arquivo:** `src/hooks/useRanking.ts`

- Removido useState e useEffect
- Convertido para useQuery com:
  - `queryKey: ["ranking"]` - Chave identificadora
  - `staleTime: 30000` - Cache válido por 30 segundos
  - `gcTime: 5 * 60 * 1000` - Garbage collection após 5 minutos
- Agora retorna: `{ data: ranking[], isLoading, error }`

### 2. **Atualizar Ranking.tsx para nova interface** ✅
**Arquivo:** `src/pages/Ranking.tsx`

- Mudou de `{ ranking, loading }` para `{ data: ranking, isLoading }`
- Removido import desnecessário `Medal`

### 3. **Invalidar cache em MatchDetails** ✅
**Arquivo:** `src/pages/MatchDetails.tsx`

- Adicionado `useQueryClient` do React Query
- Após confirmar resultado:
  ```typescript
  await queryClient.invalidateQueries({ queryKey: ["matches"] });
  await queryClient.invalidateQueries({ queryKey: ["my_bets"] });
  await queryClient.invalidateQueries({ queryKey: ["bets"] });
  await queryClient.refetchQueries({ queryKey: ["ranking"] });
  ```
- Força refetch imediato do ranking

## Como Testar

1. Crie uma partida com status "upcoming"
2. Faça alguns palpites com diferentes contas
3. Mude o status para "live" ou espere o horário
4. Admin confirma o resultado no MatchDetails
5. **Esperado:** Classificação atualiza automaticamente sem recarregar! ✅

## Estados do Cache

| Situação | Comportamento |
|----------|--------------|
| Abertura página Classificação | Busca dados do servidor |
| Usuário muda de página e volta | Usa cache (30s válido) |
| Admin confirma resultado | Invalida cache + refetch |
| Após refetch | Dados atualizados exibidos |

## Benefícios

✅ Classificação atualiza em tempo real após confirmar resultado
✅ Cache inteligente reduz requisições desnecessárias
✅ Melhor UX - não precisa recarregar página
✅ Código mais mantível com useQuery

## Próximas Melhorias Possíveis

- [ ] Real-time subscriptions do Supabase (atualização instantânea)
- [ ] Animação visual de mudança de posição
- [ ] Notificação quando usuário entra em top 3
