import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Flag from "@/components/Flag";
import { useMatches, useScoringRules, useBets } from "@/hooks/useMatches";
import { formatDateBR } from "@/lib/formatDate";

const MatchDetails = () => {
  const { id } = useParams();
  const { data: matches = [] } = useMatches();
  const { data: scoringRules = [] } = useScoringRules();
  const { data: matchBets = [] } = useBets(id);

  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <Layout>
        <p className="text-muted-foreground">Partida não encontrada.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <Link to="/palpites">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-border bg-gradient-card p-6 text-center"
        >
          {match.multiplier > 1 && <p className="text-xs font-bold text-accent mb-2">Multiplicador ×{match.multiplier}</p>}
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <Flag src={match.flag_a} alt={match.team_a} size="lg" />
              <span className="text-sm font-medium">{match.team_a}</span>
            </div>
            <div className="font-display text-4xl font-black text-foreground">
              {match.score_a ?? "-"} <span className="text-muted-foreground">:</span> {match.score_b ?? "-"}
            </div>
            <div className="flex flex-col items-center gap-1">
              <Flag src={match.flag_b} alt={match.team_b} size="lg" />
              <span className="text-sm font-medium">{match.team_b}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{formatDateBR(match.match_date)} • {match.match_time?.slice(0, 5)}</p>
        </motion.div>

        <div>
          <h2 className="font-display text-lg font-bold mb-3">Regras de Pontuação</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {scoringRules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Target className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{rule.label}</p>
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                </div>
                <span className="font-display font-bold text-primary text-sm">+{rule.points}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold mb-3">Palpites do Grupo</h2>
          {match.status === "upcoming" ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground text-sm">
                Os palpites ficam disponíveis após o início da partida.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {matchBets.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Nenhum palpite registrado para esta partida.
                </p>
              ) : (
                matchBets.map((bet, i) => (
                  <motion.div
                    key={bet.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-display font-bold text-sm">
                      {bet.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium">{bet.user_id.slice(0, 8)}</span>
                    <span className="font-display font-bold text-foreground">
                      {bet.score_a} × {bet.score_b}
                    </span>
                    {bet.points !== null && (
                      <span className={`font-display font-bold text-sm ${bet.points > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {bet.points > 0 ? `+${bet.points}` : bet.points} pts
                      </span>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MatchDetails;
