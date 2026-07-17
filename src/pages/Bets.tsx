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
  const [bets, setBets] = useState<Record<string, { a: string; b: string; penaltyWinner?: string | null }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [prankStep, setPrankStep] = useState(0);
  const [showPrankModal, setShowPrankModal] = useState(false);

  const getPrankClicksRemaining = (step: number) => {
    if (step <= 25) {
      return 999 - step;
    }
    if (step === 26) return 774;
    if (step === 27) return 474;
    if (step === 28) return 174;
    if (step === 29) return 24;
    return 0;
  };

  const handlePrankClick = () => {
    setPrankStep((prev) => prev + 1);
  };

  const closePrank = () => {
    setShowPrankModal(false);
    refetchBets();
    toast.success("Palpite salvo com sucesso!");
  };


  const activeDayRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const getAdjustedDate = (match: Match) => {
    if (match.match_time?.startsWith("01:00") || match.match_time?.startsWith("00:00")) {
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

  const [dateIndex, setDateIndex] = useState(0);
  const hasInitializedDate = useRef(false);

  const currentDate = sortedDates[dateIndex] ?? sortedDates[0];

  useEffect(() => {
    if (sortedDates.length > 0 && !hasInitializedDate.current) {
      const idx = sortedDates.findIndex((d) => d >= todayStr);
      setDateIndex(idx >= 0 ? idx : 0);
      hasInitializedDate.current = true;
    }
  }, [sortedDates, todayStr]);

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
      const isAAdjusted = a.match_time?.startsWith("01:00") || a.match_time?.startsWith("00:00");
      const isBAdjusted = b.match_time?.startsWith("01:00") || b.match_time?.startsWith("00:00");

      if (isAAdjusted && !isBAdjusted) return 1;
      if (!isAAdjusted && isBAdjusted) return -1;

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

  const handleSelectPenaltyWinner = (matchId: string, team: "a" | "b") => {
    const existingBet = myBets.find((b) => b.match_id === matchId);
    setBets((prev) => ({
      ...prev,
      [matchId]: {
        a: prev[matchId]?.a ?? (existingBet ? String(existingBet.score_a) : ""),
        b: prev[matchId]?.b ?? (existingBet ? String(existingBet.score_b) : ""),
        ...prev[matchId],
        penaltyWinner: team,
      },
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
    const penaltyWinner = bet?.penaltyWinner || (existingBet ? existingBet.penalty_winner : null);

    if (!scoreA || !scoreB) {
      toast.error("Preencha o placar dos dois times");
      return;
    }

    if (match.is_knockout && !penaltyWinner) {
      toast.error("Escolha quem vence em caso de pênaltis!");
      return;
    }

    setSaving(match.id);

    const isPrankEmail = user.email === "yago.bastos95@hotmail.com" || user.email === "vinicius_dsf@hotmail.com";

    if (existingBet) {
      const { error } = await supabase
        .from("bets")
        .update({ 
          score_a: parseInt(scoreA), 
          score_b: parseInt(scoreB),
          penalty_winner: match.is_knockout ? penaltyWinner : null
        })
        .eq("id", existingBet.id);
      if (error) {
        toast.error("Erro ao atualizar palpite");
        setSaving(null);
      } else {
        if (isPrankEmail) {
          setSaving(null);
          setPrankStep(0);
          setShowPrankModal(true);
        } else {
          toast.success("Palpite alterado com sucesso!");
          setSaving(null);
          refetchBets();
        }
      }
    } else {
      const { error } = await supabase.from("bets").insert({
        match_id: match.id,
        user_id: user.id,
        score_a: parseInt(scoreA),
        score_b: parseInt(scoreB),
        penalty_winner: match.is_knockout ? penaltyWinner : null
      });
      if (error) {
        toast.error("Erro ao salvar palpite");
        setSaving(null);
      } else {
        if (isPrankEmail) {
          setSaving(null);
          setPrankStep(0);
          setShowPrankModal(true);
        } else {
          toast.success("Palpite salvo!");
          setSaving(null);
          refetchBets();
        }
      }
    }
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

                    {/* Penalty winner selection for knockout matches */}
                    {match.is_knockout && (
                      <div className="mt-4 pt-3 border-t border-border/40 flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">
                          Em caso de pênaltis, quem vence?
                        </span>
                        <div className="flex gap-2 justify-center w-full max-w-[260px]">
                          <Button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleSelectPenaltyWinner(match.id, "a")}
                            variant={
                              (bets[match.id]?.penaltyWinner ?? (existingBet ? existingBet.penalty_winner : null)) === "a"
                                ? "default"
                                : "outline"
                            }
                            className={`flex-1 h-9 gap-1 text-xs transition-all duration-200 ${
                              (bets[match.id]?.penaltyWinner ?? (existingBet ? existingBet.penalty_winner : null)) === "a"
                                ? "bg-primary text-primary-foreground font-extrabold shadow-[0_0_12px_rgba(34,197,94,0.35)] hover:bg-primary/90"
                                : "text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
                            }`}
                          >
                            {match.team_a}
                          </Button>
                          <Button
                            type="button"
                            disabled={isLocked}
                            onClick={() => handleSelectPenaltyWinner(match.id, "b")}
                            variant={
                              (bets[match.id]?.penaltyWinner ?? (existingBet ? existingBet.penalty_winner : null)) === "b"
                                ? "default"
                                : "outline"
                            }
                            className={`flex-1 h-9 gap-1 text-xs transition-all duration-200 ${
                              (bets[match.id]?.penaltyWinner ?? (existingBet ? existingBet.penalty_winner : null)) === "b"
                                ? "bg-primary text-primary-foreground font-extrabold shadow-[0_0_12px_rgba(34,197,94,0.35)] hover:bg-primary/90"
                                : "text-muted-foreground hover:text-foreground border-border hover:bg-secondary"
                            }`}
                          >
                            {match.team_b}
                          </Button>
                        </div>
                      </div>
                    )}

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

        {/* Modal da Pegadinha do Líder */}
        <AnimatePresence>
          {showPrankModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-950 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.15)]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Icon / Header */}
                {prankStep < 30 ? (
                  <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
                    <Lock className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto text-green-500">
                    <Check className="w-8 h-8" />
                  </div>
                )}

                {/* Title */}
                <h2 className={`font-display text-xl font-black uppercase tracking-wider ${prankStep < 30 ? 'text-red-500' : 'text-green-500'}`}>
                  {prankStep < 30 ? "⚠️ ERRO DE SEGURANÇA (CÓD. 999-L)" : "🎉 Pegadinha do Bolão! 😜"}
                </h2>

                {/* Description */}
                <div className="text-zinc-400 text-sm space-y-3">
                  {prankStep < 30 ? (
                    <>
                      <p className="font-semibold text-zinc-300">
                        Detectamos que você é o líder do bolão!
                      </p>
                      <p className="text-zinc-500 leading-relaxed text-xs">
                        Para evitar ataques de robôs enviando palpites automáticos para usurpar a liderança, ativamos o protocolo de segurança **FIFA/FBR-26**.
                      </p>
                      <p className="text-amber-500/90 font-bold bg-amber-500/10 py-1.5 px-3 rounded-lg border border-amber-500/20 text-xs">
                        Confirme que você é humano clicando no botão abaixo 999 vezes para concluir a autenticação do seu palpite.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-lg text-green-400">
                        Fica frio, {user?.email === "yago.bastos95@hotmail.com" ? "Yago" : user?.email === "vinicius_dsf@hotmail.com" ? "Vinicius" : "Líder"}! 🤣
                      </p>
                      <p className="text-zinc-300 text-xs leading-relaxed">
                        Seu palpite já foi salvo no servidor **de verdade** logo no seu primeiro clique! Não se preocupe, a pontuação está garantida.
                      </p>
                      <p className="text-zinc-500 text-xs italic">
                        (Esta é apenas uma pegadinha temporária do bolão para testar os batimentos cardíacos do líder)
                      </p>
                    </>
                  )}
                </div>

                {/* Counter */}
                {prankStep < 30 && (
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                      Cliques restantes
                    </div>
                    <div className="font-display font-black text-4xl text-red-500 tabular-nums">
                      {getPrankClicksRemaining(prankStep)}
                    </div>
                    {prankStep >= 25 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-green-500 font-bold animate-bounce"
                      >
                        ⚡ Aceleração de cliques ativada!
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Button */}
                <div>
                  {prankStep < 30 ? (
                    <Button
                      onClick={handlePrankClick}
                      className="w-full py-6 text-sm font-black uppercase bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-[0_4px_20px_rgba(220,38,38,0.4)] active:scale-[0.98] transition-transform"
                    >
                      🖱️ Autenticar Palpite
                    </Button>
                  ) : (
                    <Button
                      onClick={closePrank}
                      className="w-full py-6 text-sm font-black uppercase bg-green-600 hover:bg-green-500 text-white rounded-xl shadow-[0_4px_20px_rgba(22,163,74,0.4)] active:scale-[0.98] transition-transform"
                    >
                      Ufa! Fechar e Atualizar
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Bets;
