import { useMemo, useState } from "react";
import { formatDateBR } from "@/lib/formatDate";
import { Link } from "react-router-dom";
import { Check, Lock, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import Flag from "@/components/Flag";
import { mockMatches } from "@/lib/mockData";

const Bets = () => {
  const [bets, setBets] = useState<Record<string, { a: string; b: string }>>({});

  // Get sorted unique dates
  const sortedDates = useMemo(() => {
    const dates = [...new Set(mockMatches.map((m) => m.date))];
    return dates.sort((a, b) => a.localeCompare(b));
  }, []);

  // Find today's date or closest future date as default
  const todayStr = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const defaultIndex = useMemo(() => {
    const idx = sortedDates.findIndex((d) => d >= todayStr);
    return idx >= 0 ? idx : 0;
  }, [sortedDates, todayStr]);

  const [dateIndex, setDateIndex] = useState(defaultIndex);

  const currentDate = sortedDates[dateIndex] ?? sortedDates[0];

  const matchesForDay = useMemo(
    () =>
      [...mockMatches]
        .filter((m) => m.date === currentDate)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [currentDate]
  );

  const isToday = currentDate === todayStr;

  const dateLabel = isToday ? "Hoje" : formatDateBR(currentDate);

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
          <h1 className="font-display text-2xl font-bold">Meus Palpites</h1>
          <p className="text-muted-foreground text-sm">
            Insira seus palpites antes do início de cada jogo
          </p>
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            disabled={dateIndex <= 0}
            onClick={() => setDateIndex((i) => Math.max(0, i - 1))}
            className="text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-display font-bold text-base min-w-[80px] text-center">
            {dateLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            disabled={dateIndex >= sortedDates.length - 1}
            onClick={() => setDateIndex((i) => Math.min(sortedDates.length - 1, i + 1))}
            className="text-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentDate}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {matchesForDay.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                Nenhum jogo nesta data
              </p>
            ) : (
              matchesForDay.map((match, i) => {
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
                      <div className="flex items-center gap-1">
                        {isLocked ? (
                          <Lock className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-accent" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          <span className={`font-medium ${isLocked ? "text-destructive" : "text-accent"}`}>{match.time}</span>
                          {match.multiplier > 1 ? ` • ×${match.multiplier}` : ""}
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
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Bets;
