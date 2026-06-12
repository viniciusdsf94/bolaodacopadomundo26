import { Link } from "react-router-dom";
import { Radio } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Flag from "@/components/Flag";
import { useMatches } from "@/hooks/useMatches";
import { formatDateBR } from "@/lib/formatDate";
import { isMatchLive } from "@/lib/matchTime";

const Live = () => {
  const { data: matches = [], isLoading } = useMatches();
  const liveMatches = matches.filter((m) => isMatchLive(m));

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Jogos ao Vivo</h1>
          <p className="text-muted-foreground text-sm">Partidas acontecendo agora</p>
        </div>

        {liveMatches.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Radio className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma partida ao vivo no momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {liveMatches.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/partida/${match.id}`}>
                  <div className="rounded-xl border border-primary/30 bg-card p-4 hover:bg-secondary/50 transition-colors cursor-pointer flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      {/* Time A */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Flag src={match.flag_a} alt={match.team_a} />
                        <span className="text-xs sm:text-sm font-medium truncate">{match.team_a}</span>
                      </div>
                      
                      {/* Centro (Horário / Placar) */}
                      <div className="flex flex-col items-center px-2 sm:px-4 shrink-0">
                        <span className="text-[10px] text-muted-foreground leading-none mb-1">
                          {formatDateBR(match.match_date)} • {match.match_time?.slice(0, 5)}
                        </span>
                        <div className="font-display text-lg sm:text-xl font-black text-foreground">
                          {match.score_a ?? 0} <span className="text-muted-foreground font-medium text-sm sm:text-base">×</span> {match.score_b ?? 0}
                        </div>
                      </div>
                      
                      {/* Time B */}
                      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <span className="text-xs sm:text-sm font-medium truncate text-right">{match.team_b}</span>
                        <Flag src={match.flag_b} alt={match.team_b} />
                      </div>
                    </div>

                    {/* Texto "AO VIVO" abaixo no centro */}
                    <div className="flex justify-center">
                      <span className="text-[10px] font-bold tracking-wider text-primary bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 animate-pulse-glow">
                        AO VIVO
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Live;
