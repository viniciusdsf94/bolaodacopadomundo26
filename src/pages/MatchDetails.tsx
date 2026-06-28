import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Target, Check, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Flag from "@/components/Flag";
import { useAuth } from "@/hooks/useAuth";
import { useMatches, useScoringRules, useBets } from "@/hooks/useMatches";
import { useRanking } from "@/hooks/useRanking";
import { formatDateBR } from "@/lib/formatDate";
import { supabase } from "@/integrations/supabase/client";
import { updateMatchBetsPoints, calculateBetPoints } from "@/lib/calculatePoints";
import { getBetPointsBreakdown } from "@/lib/getBetPointsBreakdown";
import { sortMatchBets } from "@/lib/matchBetsSort";

const MatchDetails = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: matches = [] } = useMatches();
  const { data: scoringRules = [] } = useScoringRules();
  const { data: matchBets = [] } = useBets(id);

  const [scoreA, setScoreA] = useState<string>("");
  const [scoreB, setScoreB] = useState<string>("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);
  const [penaltyWinner, setPenaltyWinner] = useState<string | null>(null);

  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <Layout>
        <p className="text-muted-foreground">Partida não encontrada.</p>
      </Layout>
    );
  }

  const { data: ranking = [] } = useRanking();

  const userPositions = new Map<string, number>(
    ranking.map((user) => [user.user_id, user.position])
  );

  const sortedMatchBets = sortMatchBets(matchBets, userPositions, match.status === "finished");

  const handleConfirmResult = async () => {
    if (!id || !scoreA || !scoreB) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos do placar.",
        variant: "destructive",
      });
      return;
    }

    const finalScoreA = parseInt(scoreA);
    const finalScoreB = parseInt(scoreB);

    if (isNaN(finalScoreA) || isNaN(finalScoreB)) {
      toast({
        title: "Erro",
        description: "Os placar devem ser números válidos.",
        variant: "destructive",
      });
      return;
    }

    if (match.is_knockout && finalScoreA === finalScoreB && !penaltyWinner) {
      toast({
        title: "Erro",
        description: "Por favor, escolha o vencedor dos pênaltis.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Atualizar o resultado da partida
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          score_a: finalScoreA,
          score_b: finalScoreB,
          status: "finished",
          penalty_winner: (match.is_knockout && finalScoreA === finalScoreB) ? penaltyWinner : null,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // 2. Calcular e atualizar os pontos de todas as apostas
      
      try {
        await updateMatchBetsPoints(id, finalScoreA, finalScoreB);
      } catch (pointsError) {
        console.error("❌ ERRO ao atualizar pontos:", pointsError);
        throw pointsError;
      }

      // 3. Invalidar caches
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      await queryClient.invalidateQueries({ queryKey: ["my_bets"] });
      await queryClient.invalidateQueries({ queryKey: ["bets"] });
      // Força refetch do ranking
      await queryClient.refetchQueries({ queryKey: ["ranking"] });

      toast({
        title: "Sucesso",
        description: "Resultado confirmado e pontos calculados!",
      });

      // Limpar formulário
      setScoreA("");
      setScoreB("");
      setPenaltyWinner(null);
      setShowConfirmDialog(false);

      // Recarregar dados após um pequeno delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).message || "Erro ao confirmar resultado.";
      console.error("Erro ao confirmar resultado:", error);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          className="rounded-2xl border border-border bg-gradient-card p-6 text-center relative"
        >
          <div className="absolute top-4 left-4 text-left">
            <p className="text-xs text-muted-foreground font-medium">{formatDateBR(match.match_date)} • {match.match_time?.slice(0, 5)}</p>
          </div>
          {match.multiplier > 1 && (
            <div className="absolute top-4 right-4 text-right">
              <p className="text-xs font-bold text-accent">Multiplicador ×{match.multiplier}</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex flex-col items-center gap-1 w-28">
              <Flag src={match.flag_a} alt={match.team_a} size="lg" />
              <span className="text-sm font-medium text-center leading-tight">
                {match.team_a}
                {match.status === "finished" && match.is_knockout && match.score_a === match.score_b && match.penalty_winner === "a" && (
                  <span className="block text-[10px] font-bold text-primary">(Pênaltis)</span>
                )}
              </span>
            </div>
            <div className="font-display text-4xl font-black text-foreground shrink-0">
              {match.status === "finished" ? (
                <>{match.score_a} <span className="text-muted-foreground">×</span> {match.score_b}</>
              ) : (
                <span className="text-muted-foreground">×</span>
              )}
            </div>
            <div className="flex flex-col items-center gap-1 w-28">
              <Flag src={match.flag_b} alt={match.team_b} size="lg" />
              <span className="text-sm font-medium text-center leading-tight">
                {match.team_b}
                {match.status === "finished" && match.is_knockout && match.score_a === match.score_b && match.penalty_winner === "b" && (
                  <span className="block text-[10px] font-bold text-primary">(Pênaltis)</span>
                )}
              </span>
            </div>
          </div>

          {(match.stadium || match.city) && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>
                {[match.stadium, match.city, match.country]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          )}
        </motion.div>

        <div>
          <h2 className="font-display text-lg font-bold mb-3">Palpites do Grupo</h2>
          {!isAdmin && match.status === "live" && (
            <div className="rounded-xl border border-border bg-card p-4 text-center mb-4">
              <p className="text-muted-foreground text-sm">
                ⏱️ Partida em andamento. Resultado será informado em breve.
              </p>
            </div>
          )}
          {isAdmin && match.status === "live" && match.score_a === null && (
            <div className="rounded-xl border border-accent bg-accent/5 p-4 mb-4">
              <p className="text-sm font-medium mb-3">📊 Informar Resultado Final</p>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Gols {match.team_a}</label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    placeholder="0"
                    className="font-display text-lg"
                  />
                </div>
                <span className="text-xl font-bold">×</span>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Gols {match.team_b}</label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    placeholder="0"
                    className="font-display text-lg"
                  />
                </div>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isLoading || (match.is_knockout && scoreA !== "" && scoreB !== "" && parseInt(scoreA) === parseInt(scoreB) && !penaltyWinner)}
                  className="gap-1"
                >
                  <Check className="h-4 w-4" /> Confirmar
                </Button>
              </div>

              {/* Seletor de vencedor de pênaltis se for mata-mata e empate */}
              {match.is_knockout && scoreA !== "" && scoreB !== "" && parseInt(scoreA) === parseInt(scoreB) && (
                <div className="mt-3 pt-3 border-t border-accent/20 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Quem venceu nos pênaltis?</span>
                  <div className="flex gap-2 justify-center w-full max-w-[240px]">
                    <Button
                      type="button"
                      onClick={() => setPenaltyWinner("a")}
                      variant={penaltyWinner === "a" ? "default" : "outline"}
                      className={`flex-1 h-8 text-xs transition-all duration-200 ${
                        penaltyWinner === "a" 
                          ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {match.team_a}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setPenaltyWinner("b")}
                      variant={penaltyWinner === "b" ? "default" : "outline"}
                      className={`flex-1 h-8 text-xs transition-all duration-200 ${
                        penaltyWinner === "b" 
                          ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {match.team_b}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            {sortedMatchBets.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                Nenhum palpite registrado para esta partida.
              </p>
            ) : (
                sortedMatchBets.map((bet, i) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const profile = (bet as any).profiles;
                  const displayName = profile?.first_name 
                    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
                    : bet.user_id.slice(0, 8);
                  const initials = displayName
                    .split(" ")
                    .map((word: string) => word[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                  <motion.div
                    key={bet.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-display font-bold text-sm">
                      {initials}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{displayName}</span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {userPositions.has(bet.user_id) && (
                          <span>#{userPositions.get(bet.user_id)} no ranking geral</span>
                        )}
                        {match.is_knockout && bet.penalty_winner && (
                          <>
                            <span>•</span>
                            <span className={`font-semibold ${
                              match.status === "finished" && match.score_a === match.score_b
                                ? bet.penalty_winner === match.penalty_winner
                                  ? "text-primary font-bold"
                                  : "text-destructive"
                                : "text-accent"
                            }`}>
                              Pênaltis: {bet.penalty_winner === "a" ? match.team_a : match.team_b}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="font-display font-bold text-foreground">
                      {bet.score_a} × {bet.score_b}
                    </span>
                    {bet.points !== null && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenTooltipId(openTooltipId === bet.id ? null : bet.id);
                          }}
                          className={`font-display font-bold text-sm cursor-help ${bet.points > 0 ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {bet.points > 0 ? `+${Math.trunc(bet.points * 10) / 10}` : Math.trunc(bet.points * 10) / 10} pts
                        </button>

                        {/* Tooltip Mobile/Click */}
                        {openTooltipId === bet.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute bottom-full right-0 mb-2 z-50 bg-popover border border-border rounded-md shadow-lg p-3 w-56 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(() => {
                              const breakdown = getBetPointsBreakdown(
                                { score_a: bet.score_a, score_b: bet.score_b, penalty_winner: bet.penalty_winner },
                                {
                                  score_a: match.score_a,
                                  score_b: match.score_b,
                                  multiplier: match.multiplier,
                                  scoring_rules: scoringRules,
                                  is_knockout: match.is_knockout,
                                  penalty_winner: match.penalty_winner,
                                }
                              );

                              const earnedRules = breakdown.rules.filter(r => r.earned);

                              return (
                                <div className="space-y-1">
                                  {earnedRules.length > 0 ? (
                                    <>
                                      {earnedRules.map((rule, idx) => (
                                        <div key={idx}>
                                          <span>{rule.name}</span>
                                          <span className="ml-1 font-bold text-primary">+{rule.points}</span>
                                        </div>
                                      ))}
                                      {breakdown.multiplier > 1 && (
                                        <div className="border-t border-border/50 pt-1 mt-1">
                                          Subtotal: {breakdown.rules.reduce((acc, r) => acc + (r.earned ? r.points : 0), 0)}
                                          <span className="ml-1">× {breakdown.multiplier}</span>
                                        </div>
                                      )}
                                      <div className="font-bold text-primary border-t border-border/50 pt-1 mt-1">
                                        Total: {breakdown.total}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-muted-foreground">
                                      Nenhuma regra acertada
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            
                            {/* Arrow do tooltip */}
                            <div className="absolute top-full right-3 -mt-1">
                              <div className="border-4 border-transparent border-t-popover"></div>
                            </div>
                          </motion.div>
                        )}

                        {/* Overlay para fechar ao clicar fora */}
                        {openTooltipId === bet.id && (
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenTooltipId(null)}
                          />
                        )}
                      </div>
                    )}
                  </motion.div>
                  );
                })
              )}
            </div>
        </div>

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
                <div className="font-display font-bold text-primary text-sm text-right whitespace-nowrap">
                  {match.multiplier > 1 ? (
                    <span className="flex items-center gap-1 justify-end">
                      <span className="text-xs font-normal text-muted-foreground">
                        +{rule.points} × {match.multiplier} =
                      </span>
                      +{Math.trunc(rule.points * match.multiplier * 10) / 10}
                    </span>
                  ) : (
                    <span>+{rule.points}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ Confirmar Resultado</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja confirmar o resultado como{" "}
                  <span className="font-bold text-foreground">
                    {scoreA} × {scoreB}
                  </span>
                  {match.is_knockout && scoreA !== "" && scoreB !== "" && parseInt(scoreA) === parseInt(scoreB) && (
                    <>
                      {" "}com vitória do{" "}
                      <span className="font-bold text-primary">
                        {penaltyWinner === "a" ? match.team_a : match.team_b}
                      </span>{" "}nos pênaltis
                    </>
                  )}
                  ? Esta ação vai calcular os pontos de todas as apostas e não poderá ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmResult}
                  disabled={isLoading}
                  className="bg-primary"
                >
                  <Check className="h-4 w-4 mr-1" /> {isLoading ? "Confirmando..." : "Confirmar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Layout>
  );
};

export default MatchDetails;
