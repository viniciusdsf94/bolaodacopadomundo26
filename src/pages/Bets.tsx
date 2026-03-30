import { useMemo, useState } from "react";
import { formatDateBR } from "@/lib/formatDate";
import { Link } from "react-router-dom";
import { Check, Lock, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { isMatchStarted } from "@/lib/matchTime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import Flag from "@/components/Flag";
import { useMatches, useMyBets, type Match } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Bets = () => {
  const { data: matches = [], isLoading } = useMatches();
  const { data: myBets = [], refetch: refetchBets } = useMyBets();
  const { user } = useAuth();
  const [bets, setBets] = useState<Record<string, { a: string; b: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const sortedDates = useMemo(() => {
    const dates = [...new Set(matches.map((m) => m.match_date))];
    return dates.sort((a, b) => a.localeCompare(b));
  }, [matches]);

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
    () => matches.filter((m) => m.match_date === currentDate),
    [matches, currentDate]
  );

  const getDateLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((date.getTime() - today.getTime()) / 86400000);

    if (diff === 0) return "Hoje";
    if (diff === -1) return "Ontem";
    if (diff === 1) return "Amanhã";

    const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
    const dayNum = date.getDate();
    const monthName = date.toLocaleDateString("pt-BR", { month: "long" });
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}. ${dayNum} de ${monthName}`;
  };

  const dateLabel = currentDate ? getDateLabel(currentDate) : "";

  const handleChange = (matchId: string, team: "a" | "b", value: string) => {
    setBets((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team]: value },
    }));
  };

  const handleSave = async (match: Match) => {
    if (!user) return;
    if (isMatchStarted(match)) {
      toast.error("Este jogo já começou!");
      return;
    }
    const bet = bets[match.id];
    if (!bet?.a || !bet?.b) {
      toast.error("Preencha o placar dos dois times");
      return;
    }

    setSaving(match.id);
    const existingBet = myBets.find((b) => b.match_id === match.id);

    if (existingBet) {
      const { error } = await supabase
        .from("bets")
        .update({ score_a: parseInt(bet.a), score_b: parseInt(bet.b) })
        .eq("id", existingBet.id);
      if (error) toast.error("Erro ao atualizar palpite");
      else toast.success("Palpite atualizado!");
    } else {
      const { error } = await supabase.from("bets").insert({
        match_id: match.id,
        user_id: user.id,
        score_a: parseInt(bet.a),
        score_b: parseInt(bet.b),
      });
      if (error) toast.error("Erro ao salvar palpite");
      else toast.success("Palpite salvo!");
    }

    setSaving(null);
    refetchBets();
  };

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
                const isLocked = isMatchStarted(match);
                const existingBet = myBets.find((b) => b.match_id === match.id);
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
                          <span className={`font-medium ${isLocked ? "text-destructive" : "text-accent"}`}>{match.match_time?.slice(0, 5)}</span>
                          {match.multiplier > 1 ? ` • ×${match.multiplier}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Score input */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <Flag src={match.flag_a} alt={match.team_a} />
                        <span className="text-xs font-medium text-center leading-tight">{match.team_a}</span>
                      </div>

                      <Input
                        type="number"
                        min={0}
                        max={20}
                        disabled={isLocked}
                        value={
                          isLocked && match.score_a !== null
                            ? match.score_a
                            : bets[match.id]?.a ?? (existingBet ? String(existingBet.score_a) : "")
                        }
                        onChange={(e) => handleChange(match.id, "a", e.target.value)}
                        className="w-12 text-center font-display font-bold bg-secondary border-border"
                      />

                      <span className="text-muted-foreground font-bold">×</span>

                      <Input
                        type="number"
                        min={0}
                        max={20}
                        disabled={isLocked}
                        value={
                          isLocked && match.score_b !== null
                            ? match.score_b
                            : bets[match.id]?.b ?? (existingBet ? String(existingBet.score_b) : "")
                        }
                        onChange={(e) => handleChange(match.id, "b", e.target.value)}
                        className="w-12 text-center font-display font-bold bg-secondary border-border"
                      />

                      <div className="flex flex-col items-center gap-1 flex-1">
                        <Flag src={match.flag_b} alt={match.team_b} />
                        <span className="text-xs font-medium text-center leading-tight">{match.team_b}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center mt-3 gap-2">
                      {match.status === "finished" && (
                        <Link to={`/partida/${match.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-primary">
                            Ver detalhes
                          </Button>
                        </Link>
                      )}
                      {!isLocked && (
                        <Button
                          size="sm"
                          className="gap-1 text-xs"
                          disabled={saving === match.id}
                          onClick={() => handleSave(match)}
                        >
                          <Check className="h-3.5 w-3.5" /> {saving === match.id ? "Salvando..." : "Salvar"}
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
