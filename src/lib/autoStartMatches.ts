import { supabase } from "@/integrations/supabase/client";
import { matchDateTimeBRT } from "./matchTime";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Verifica e coloca partidas ao vivo automaticamente
 * quando o horário de início é atingido
 */
export const checkAndStartMatches = async (queryClient?: ReturnType<typeof useQueryClient>) => {
  try {
    const now = new Date();
    
    // Busca todas as partidas que ainda não começaram
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: upcomingMatches, error } = await (supabase as any)
      .from("matches")
      .select("*")
      .eq("status", "upcoming");
    
    if (error) throw error;
    if (!upcomingMatches || upcomingMatches.length === 0) {
      console.log(`🔍 [${now.toLocaleTimeString('pt-BR')}] Nenhuma partida 'upcoming' encontrada`);
      return;
    }
    
    console.log(`🔍 [${now.toLocaleTimeString('pt-BR')}] Verificando ${upcomingMatches.length} partidas...`);
    
    // Verifica quais partidas devem começar agora
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchesToStart = upcomingMatches.filter((match: any) => {
      const matchStartTime = matchDateTimeBRT(match);
      const shouldStart = now >= matchStartTime;
      if (shouldStart) {
        console.log(`   ⏰ ${match.team_a} vs ${match.team_b}: DEVE COMEÇAR (agora: ${now.toLocaleTimeString('pt-BR')}, previsto: ${matchStartTime.toLocaleTimeString('pt-BR')})`);
      }
      return shouldStart;
    });
    
    if (matchesToStart.length === 0) {
      console.log(`   ✋ Nenhuma partida pronta para começar`);
      return;
    }
    
    console.log(`🚀 Iniciando ${matchesToStart.length} partida(s)...`);
    
    // Coloca cada partida ao vivo
    for (const match of matchesToStart) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("matches")
        .update({ status: "live" })
        .eq("id", match.id);
      
      console.log(`✅ Auto-iniciado: ${match.team_a} vs ${match.team_b}`);
    }
    
    // Refetch dos caches para atualizar a interface
    if (queryClient) {
      console.log("🔄 Refetchando matches...");
      await queryClient.refetchQueries({ queryKey: ["matches"] });
      console.log("✅ Matches refetchados!");
    } else {
      console.warn("⚠️ QueryClient não fornecido - caches NÃO foram refetchados!");
    }
  } catch (error) {
    console.error("❌ Erro ao verificar partidas:", error);
  }
};
