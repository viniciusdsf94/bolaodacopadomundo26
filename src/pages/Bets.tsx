import { useState } from "react";
import { formatDateBR } from "@/lib/formatDate";
import { Link } from "react-router-dom";
import { Check, Lock, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Flag from "@/components/Flag";
import { mockMatches } from "@/lib/mockData";

const Bets = () => {
  const [bets, setBets] = useState<Record<string, { a: string; b: string }>>({});

  const handleChange = (matchId: string, team: "a" | "b", value: string) => {
    setBets((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team]: value },
    }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Palpites</h1>
          <p className="text-muted-foreground text-sm">
            Insira seus palpites antes do início de cada jogo
          </p>
        </div>

        <div className="space-y-3">
          {mockMatches.map((match, i) => {
            const isLocked = match.status !== "upcoming";
            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border p-4 ${
                  isLocked
                    ? "border-border bg-card opacity-70"
                    : "border-primary/20 bg-gradient-card shadow-glow"
                }`}
              >
                {/* Match header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">
                    {formatDateBR(match.date)}{match.multiplier > 1 ? ` • ×${match.multiplier}` : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    {isLocked ? (
                      <Lock className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-accent" />
                    )}
                    <span className={`text-xs font-medium ${isLocked ? "text-destructive" : "text-accent"}`}>
                      {match.time}
                    </span>
                  </div>
                </div>

                {/* Score input */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-1 items-center gap-2">
                    <Flag src={match.flagA} alt={match.teamA} />
                    <span className="text-sm font-medium flex-1">{match.teamA}</span>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      disabled={isLocked}
                      value={
                        isLocked && match.scoreA !== undefined
                          ? match.scoreA
                          : bets[match.id]?.a ?? ""
                      }
                      onChange={(e) => handleChange(match.id, "a", e.target.value)}
                      className="w-14 text-center font-display font-bold bg-secondary border-border"
                    />
                  </div>

                  <span className="text-muted-foreground font-bold">×</span>

                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      disabled={isLocked}
                      value={
                        isLocked && match.scoreB !== undefined
                          ? match.scoreB
                          : bets[match.id]?.b ?? ""
                      }
                      onChange={(e) => handleChange(match.id, "b", e.target.value)}
                      className="w-14 text-center font-display font-bold bg-secondary border-border"
                    />
                    <span className="text-sm font-medium flex-1 text-right">{match.teamB}</span>
                    <Flag src={match.flagB} alt={match.teamB} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-3">
                  {match.status === "finished" && (
                    <Link to={`/partida/${match.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-primary">
                        Ver detalhes
                      </Button>
                    </Link>
                  )}
                  {!isLocked && (
                    <Button size="sm" className="ml-auto gap-1 text-xs">
                      <Check className="h-3.5 w-3.5" /> Salvar
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Bets;
