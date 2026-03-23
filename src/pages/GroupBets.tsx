import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { mockMatches } from "@/lib/mockData";

const GroupBets = () => {
  const finishedOrLive = mockMatches.filter((m) => m.status !== "upcoming");

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Palpites do Grupo</h1>
          <p className="text-muted-foreground text-sm">
            Veja os palpites de todos após o início de cada partida
          </p>
        </div>

        {finishedOrLive.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma partida iniciada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {finishedOrLive.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/partida/${match.id}`}>
                  <div className="rounded-xl border border-border bg-card p-4 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{match.flagA}</span>
                        <div>
                          <p className="text-sm font-medium">
                            {match.teamA} vs {match.teamB}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {match.date}
                          </p>
                        </div>
                        <span className="text-2xl">{match.flagB}</span>
                      </div>
                      {match.status === "finished" && (
                        <span className="font-display font-bold text-foreground">
                          {match.scoreA} × {match.scoreB}
                        </span>
                      )}
                      {match.status === "live" && (
                        <span className="text-xs font-medium text-primary animate-pulse-glow">
                          AO VIVO
                        </span>
                      )}
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

export default GroupBets;
