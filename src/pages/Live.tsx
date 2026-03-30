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
                  <div className="rounded-xl border border-primary/30 bg-card p-4 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-xs text-muted-foreground leading-tight whitespace-nowrap">
                          <p>{formatDateBR(match.match_date)}</p>
                          <p>{match.match_time?.slice(0, 5)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Flag src={match.flag_a} alt={match.team_a} />
                            <span className="text-sm font-medium">{match.team_a}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">vs</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{match.team_b}</span>
                            <Flag src={match.flag_b} alt={match.team_b} />
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-primary animate-pulse-glow">AO VIVO</span>
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
