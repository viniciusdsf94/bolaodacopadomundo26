import { useMemo, useState, useRef, useEffect } from "react";
import { formatDateBR } from "@/lib/formatDate";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [bets, setBets] = useState<Record<string, { a: string; b: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const activeDayRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const getAdjustedDate = (match: Match) => {
    if (match.match_time?.startsWith("01:00")) {
      const [y, m, d] = match.match_date.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      date.setDate(date.getDate() - 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return match.match_date;
  };

  const adjustedMatches = useMemo(() => {
    return matches.map((m) => ({
      ...m,
      displayDate: getAdjustedDate(m),
    }));
  }, [matches]);

  const sortedDates = useMemo(() => {
    const dates = [...new Set(adjustedMatches.map((m) => m.displayDate))];
    return dates.sort((a, b) => a.localeCompare(b));
  }, [adjustedMatches]);

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

  useEffect(() => {
    if (activeDayRef.current) {
      activeDayRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [dateIndex]);

  const getDayBetStatus = (dateStr: string) => {
    const dayMatches = adjustedMatches.filter((m) => m.displayDate === dateStr);
    if (dayMatches.length === 0) return "none";
    
    const upcomingMatches = dayMatches.filter(m => !isMatchStarted(m));
    if (upcomingMatches.length === 0) return "locked";

    const hasBetsForAllUpcoming = upcomingMatches.every(m => 
      myBets.some(b => b.match_id === m.id)
    );

    return hasBetsForAllUpcoming ? "complete" : "pending";
  };

  const matchesForDay = useMemo(() => {
    const dayMatches = adjustedMatches.filter((m) => m.displayDate === currentDate);
    return dayMatches.sort((a, b) => {
      const isA01 = a.match_time?.startsWith("01:00");
      const isB01 = b.match_time?.startsWith("01:00");

      if (isA01 && !isB01) return 1;
      if (!isA01 && isB01) return -1;

      return (a.match_time || "").localeCompare(b.match_time || "");
    });
  }, [adjustedMatches, currentDate]);

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
    const existingBet = myBets.find((b) => b.match_id === match.id);

    // Use existing bet values if not being edited
    const scoreA = bet?.a || (existingBet ? String(existingBet.score_a) : "");
    const scoreB = bet?.b || (existingBet ? String(existingBet.score_b) : "");

    if (!scoreA || !scoreB) {
      toast.error("Preencha o placar dos dois times");
      return;
    }

    setSaving(match.id);

    if (existingBet) {
      const { error } = await supabase
        .from("bets")
        .update({ score_a: parseInt(scoreA), score_b: parseInt(scoreB) })
        .eq("id", existingBet.id);
      if (error) toast.error("Erro ao atualizar palpite");
      else toast.success("Palpite alterado com sucesso!");
    } else {
      const { error } = await supabase.from("bets").insert({
        match_id: match.id,
        user_id: user.id,
        score_a: parseInt(scoreA),
        score_b: parseInt(scoreB),
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
        <div className="flex items-center gap-2 w-full max-w-5xl mx-auto">
          <Button
            variant="outline"
            size="icon"
            disabled={dateIndex <= 0}
            onClick={() => setDateIndex((i) => Math.max(0, i - 1))}
            className="h-14 w-11 shrink-0 border-border bg-card/50 hover:bg-secondary text-foreground transition-all duration-200 shadow-sm"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div 
            ref={scrollContainerRef}
            className="flex-1 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-2 px-1 scroll-smooth"
          >
            {sortedDates.map((dateStr, idx) => {
              const [y, m, d] = dateStr.split("-").map(Number);
              const date = new Date(y, m - 1, d);
              const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase().replace(".", "").slice(0, 3);
              const dayNum = date.getDate();
              const monthName = date.toLocaleDateString("pt-BR", { month: "short" }).toLowerCase().replace(".", "").slice(0, 3);
              
              const isActive = dateStr === currentDate;
              const status = getDayBetStatus(dateStr);
              
              return (
                <button
                  key={dateStr}
                  ref={isActive ? activeDayRef : null}
                  onClick={() => setDateIndex(idx)}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl min-w-[70px] h-[80px] border transition-all duration-300 select-none outline-none ${
                    isActive
                      ? "border-primary bg-gradient-to-b from-primary/20 to-primary/5 text-foreground font-semibold shadow-[0_0_15px_rgba(34,197,94,0.25)] scale-105 z-10"
                      : "border-border bg-card/30 hover:bg-card/75 text-muted-foreground hover:text-foreground hover:border-zinc-700"
                  }`}
                >
                  {/* Status Indicator Dot */}
                  {status === "complete" && (
                    <span 
                      className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(34,197,94,0.7)]" 
                      title="Palpites concluídos para este dia" 
                    />
                  )}
                  {status === "pending" && (
                    <span 
                      className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(245,158,11,0.7)] animate-pulse" 
                      title="Há palpites pendentes neste dia" 
                    />
                  )}
                  
                  <span className="text-[10px] uppercase font-black tracking-wider opacity-60 leading-none">{weekday}</span>
                  <span className="text-xl font-extrabold leading-none my-1 font-display">{dayNum}</span>
                  <span className="text-[10px] font-medium opacity-70 leading-none">{monthName}</span>
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            disabled={dateIndex >= sortedDates.length - 1}
            onClick={() => setDateIndex((i) => Math.min(sortedDates.length - 1, i + 1))}
            className="h-14 w-11 shrink-0 border-border bg-card/50 hover:bg-secondary text-foreground transition-all duration-200 shadow-sm"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Date Label */}
        <div className="text-center bg-zinc-900/30 py-2.5 rounded-xl border border-zinc-800/40 max-w-sm mx-auto shadow-sm">
          <p className="font-display font-black text-sm tracking-widest text-primary uppercase">
            {dateLabel}
          </p>
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
                    onClick={() => {
                      if (isLocked) {
                        navigate(`/partida/${match.id}`);
                      }
                    }}
                    className={`relative rounded-xl border p-4 text-center transition-colors ${isLocked
                        ? "border-border bg-card opacity-70 cursor-pointer hover:border-border/80"
                        : "border-primary/20 bg-gradient-card shadow-glow"
                      }`}
                  >
                    {/* Match header */}
                    <div className="absolute top-3 left-4 right-14 text-left flex items-center gap-1 min-w-0">
                      {isLocked ? (
                        <Lock className="h-3 w-3 text-destructive shrink-0" />
                      ) : (
                        <Clock className="h-3 w-3 text-accent shrink-0" />
                      )}
                      <span className={`text-[10px] sm:text-xs font-medium shrink-0 ${isLocked ? "text-destructive" : "text-accent"}`}>
                        {match.match_time?.slice(0, 5)}
                        {match.match_date !== match.displayDate && " (Dia seguinte)"}
                      </span>
                      {(match.stadium || match.city) && (
                        <>
                          <span className="text-muted-foreground/40 shrink-0">·</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {[match.stadium, match.city, match.country].filter(Boolean).join(" · ")}
                          </span>
                        </>
                      )}
                    </div>

                    {match.multiplier > 1 && (
                      <div className="absolute top-3 right-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                          ×{match.multiplier}
                        </span>
                      </div>
                    )}

                    {/* Score input */}
                    <div className="flex items-start justify-center gap-4 mt-8">
                      <div className="flex flex-col items-center gap-1.5 w-[80px]">
                        <Flag src={match.flag_a} alt={match.team_a} size="lg" />
                        <span className="text-xs sm:text-sm font-medium text-center leading-tight">{match.team_a}</span>
                      </div>

                      <div className="flex items-center gap-2">
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
                          onClick={(e) => e.stopPropagation()}
                          className="w-12 h-12 text-center font-display text-xl font-black bg-secondary border-border rounded-xl"
                        />

                        <span className="text-muted-foreground font-medium text-lg">×</span>

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
                          onClick={(e) => e.stopPropagation()}
                          className="w-12 h-12 text-center font-display text-xl font-black bg-secondary border-border rounded-xl"
                        />
                      </div>

                      <div className="flex flex-col items-center gap-1.5 w-[80px]">
                        <Flag src={match.flag_b} alt={match.team_b} size="lg" />
                        <span className="text-xs sm:text-sm font-medium text-center leading-tight">{match.team_b}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center mt-3 gap-2">
                      {match.status === "finished" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/partida/${match.id}`);
                          }}
                        >
                          Ver detalhes
                        </Button>
                      )}
                      {!isLocked && (
                        <Button
                          size="sm"
                          className="gap-1 text-xs h-8"
                          disabled={saving === match.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave(match);
                          }}
                        >
                          <Check className="h-3.5 w-3.5" /> {saving === match.id ? "Salvando..." : existingBet ? "Editar" : "Salvar"}
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
