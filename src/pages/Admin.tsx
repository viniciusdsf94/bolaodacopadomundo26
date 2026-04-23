import { useState } from "react";
import { Plus, Save, Settings, CalendarDays, CheckCircle2, Trophy, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import Layout from "@/components/Layout";
import TeamSelect from "@/components/TeamSelect";
import { useMatches, useScoringRules } from "@/hooks/useMatches";
import { useRanking } from "@/hooks/useRanking";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateBR } from "@/lib/formatDate";
import { toast } from "sonner";
import { updateMatchBetsPoints } from "@/lib/calculatePoints";
import { isMatchLive } from "@/lib/matchTime";
import { useEffect } from "react";

const Admin = () => {
  const { data: matches = [] } = useMatches();
  const { data: rules = [] } = useScoringRules();
  const { data: ranking = [] } = useRanking();
  const queryClient = useQueryClient();

  // Garante que a regra "Empate Garantido" exista
  useEffect(() => {
    if (rules.length > 0) {
      const hasEmpate = rules.some(r => r.label.toLowerCase().includes("empate garantido"));
      if (!hasEmpate) {
        supabase.from("scoring_rules").insert({
          label: "Empate Garantido",
          description: "Pontos garantidos ao apostar em um empate, independente do resultado",
          points: 1
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["scoring_rules"] });
        });
      }
    }
  }, [rules, queryClient]);

  const sortedMatches = [...matches].sort((a, b) => {
    if (a.status === "finished" && b.status !== "finished") return 1;
    if (a.status !== "finished" && b.status === "finished") return -1;
    return 0;
  });

  const [newMatch, setNewMatch] = useState({
    teamA: "", teamB: "", flagA: "", flagB: "", date: "", time: "", multiplier: "1",
  });

  // Estado para o modal de confirmação
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    matchId: string;
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
  }>({
    isOpen: false,
    matchId: "",
    teamA: "",
    teamB: "",
    scoreA: 0,
    scoreB: 0,
  });

  const [isConfirming, setIsConfirming] = useState(false);
  
  // Estado para controlar os inputs de score
  const [scoreInputs, setScoreInputs] = useState<Record<string, { a: string; b: string }>>({});

  const handleAddMatch = async () => {
    if (!newMatch.teamA || !newMatch.teamB || !newMatch.date || !newMatch.time) return;
    const { error } = await supabase.from("matches").insert({
      team_a: newMatch.teamA,
      team_b: newMatch.teamB,
      flag_a: newMatch.flagA,
      flag_b: newMatch.flagB,
      match_date: newMatch.date,
      match_time: newMatch.time,
      multiplier: parseFloat(newMatch.multiplier) || 1,
    });
    if (error) {
      toast.error("Erro ao adicionar partida");
    } else {
      toast.success("Partida adicionada!");
      setNewMatch({ teamA: "", teamB: "", flagA: "", flagB: "", date: "", time: "", multiplier: "1" });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    }
  };

  const handleUpdateResult = async (id: string, scoreA: number, scoreB: number) => {
    const { error } = await supabase
      .from("matches")
      .update({ score_a: scoreA, score_b: scoreB, status: "finished" })
      .eq("id", id);
    if (error) toast.error("Erro ao atualizar resultado");
    else {
      toast.success("Resultado salvo!");
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    }
  };

  const handleGoLive = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from("matches")
        .update({ status: "live" })
        .eq("id", matchId);
      
      if (error) throw error;
      
      toast.success("Partida ao vivo! 🔴");
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    } catch (error) {
      toast.error("Erro ao colocar partida ao vivo");
    }
  };

  // Nova função para abrir o modal de confirmação
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFinishMatch = (match: any, scoreA: string, scoreB: string) => {
    const finalScoreA = parseInt(scoreA);
    const finalScoreB = parseInt(scoreB);
    
    if (isNaN(finalScoreA) || isNaN(finalScoreB)) {
      toast.error("Insira placar válido (números inteiros)");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      matchId: match.id,
      teamA: match.team_a,
      teamB: match.team_b,
      scoreA: finalScoreA,
      scoreB: finalScoreB,
    });
  };

  // Função para confirmar a finalização (atualiza resultado E calcula pontos)
  const handleConfirmFinish = async () => {
    if (!confirmDialog.matchId) return;

    setIsConfirming(true);

    try {
      // 1. Atualizar resultado da partida
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          score_a: confirmDialog.scoreA,
          score_b: confirmDialog.scoreB,
          status: "finished",
        })
        .eq("id", confirmDialog.matchId);

      if (updateError) throw updateError;

      // 2. Calcular e atualizar os pontos de todas as apostas
      await updateMatchBetsPoints(
        confirmDialog.matchId,
        confirmDialog.scoreA,
        confirmDialog.scoreB
      );

      // 3. Invalidar caches
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      await queryClient.invalidateQueries({ queryKey: ["my_bets"] });
      await queryClient.invalidateQueries({ queryKey: ["bets"] });
      await queryClient.refetchQueries({ queryKey: ["ranking"] });

      toast.success(`${confirmDialog.teamA} ${confirmDialog.scoreA}×${confirmDialog.scoreB} ${confirmDialog.teamB} - Pontos calculados!`);

      // Fechar modal
      setConfirmDialog({ isOpen: false, matchId: "", teamA: "", teamB: "", scoreA: 0, scoreB: 0 });
      
      // Limpar input
      setScoreInputs((prev) => ({
        ...prev,
        [confirmDialog.matchId]: { a: "", b: "" },
      }));
    } catch (error) {
      console.error("❌ Erro ao confirmar partida:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMsg = (error as any).message || "Erro ao confirmar partida";
      toast.error(errorMsg);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleUpdateRule = async (id: string, points: number) => {
    const { error } = await supabase
      .from("scoring_rules")
      .update({ points })
      .eq("id", id);
    if (error) toast.error("Erro ao atualizar regra");
    else queryClient.invalidateQueries({ queryKey: ["scoring_rules"] });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Administração</h1>
          <p className="text-muted-foreground text-sm">Gerencie partidas e regras de pontuação</p>
        </div>

        <Tabs defaultValue="matches">
          <TabsList className="bg-secondary">
            <TabsTrigger value="matches" className="gap-1">
              <CalendarDays className="h-4 w-4" /> Partidas
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-1">
              <Settings className="h-4 w-4" /> Pontuação
            </TabsTrigger>
            <TabsTrigger value="ranking" className="gap-1">
              <Trophy className="h-4 w-4" /> Classificação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="space-y-4 mt-4">
            <div className="rounded-xl border border-border bg-gradient-card p-4 space-y-4">
              <h3 className="font-display font-bold text-sm">Nova Partida</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Time A</p>
                  <TeamSelect
                    label="País"
                    value={newMatch.teamA}
                    onChange={(name, flag) => setNewMatch((p) => ({ ...p, teamA: name, flagA: flag }))}
                    excludeTeam={newMatch.teamB}
                  />
                </div>
                <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Time B</p>
                  <TeamSelect
                    label="País"
                    value={newMatch.teamB}
                    onChange={(name, flag) => setNewMatch((p) => ({ ...p, teamB: name, flagB: flag }))}
                    excludeTeam={newMatch.teamA}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={newMatch.date} onChange={(e) => setNewMatch((p) => ({ ...p, date: e.target.value }))} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Horário</Label>
                  <Input type="time" value={newMatch.time} onChange={(e) => setNewMatch((p) => ({ ...p, time: e.target.value }))} className="bg-secondary border-border" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Multiplicador</Label>
                  <Input type="number" min={1} step={0.5} value={newMatch.multiplier} onChange={(e) => setNewMatch((p) => ({ ...p, multiplier: e.target.value }))} className="bg-secondary border-border font-display font-bold" />
                </div>
              </div>
              <Button onClick={handleAddMatch} className="w-full gap-1">
                <Plus className="h-4 w-4" /> Adicionar Partida
              </Button>
            </div>

            <div className="space-y-2">
              {sortedMatches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                      {match.flag_a && <img src={match.flag_a} alt={match.team_a} className="h-6 w-8 rounded object-cover" />}
                      <span className="text-sm font-medium">{match.team_a}</span>
                      <span className="text-muted-foreground text-xs">vs</span>
                      <span className="text-sm font-medium">{match.team_b}</span>
                      {match.flag_b && <img src={match.flag_b} alt={match.team_b} className="h-6 w-8 rounded object-cover" />}
                    </div>
                    {match.multiplier > 1 && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">×{match.multiplier}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{formatDateBR(match.match_date)} {match.match_time?.slice(0, 5)}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" min={0} placeholder="0"
                        value={scoreInputs[match.id]?.a ?? match.score_a ?? ""}
                        onChange={(e) => {
                          setScoreInputs((prev) => ({
                            ...prev,
                            [match.id]: {
                              a: e.target.value,
                              b: prev[match.id]?.b ?? (match.score_b?.toString() || ""),
                            },
                          }));
                        }}
                        className="w-14 text-center bg-secondary border-border font-bold"
                      />
                      <span className="text-muted-foreground">×</span>
                      <Input
                        type="number" min={0} placeholder="0"
                        value={scoreInputs[match.id]?.b ?? match.score_b ?? ""}
                        onChange={(e) => {
                          setScoreInputs((prev) => ({
                            ...prev,
                            [match.id]: {
                              a: prev[match.id]?.a ?? (match.score_a?.toString() || ""),
                              b: e.target.value,
                            },
                          }));
                        }}
                        className="w-14 text-center bg-secondary border-border font-bold"
                      />
                    </div>
                    <div className="flex gap-2">
                      {!isMatchLive(match) && match.status !== "finished" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleGoLive(match.id)}
                          className="gap-1"
                        >
                          <Radio className="h-4 w-4" />
                          Ao Vivo
                        </Button>
                      )}
                      
                      {isMatchLive(match) && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            handleFinishMatch(
                              match,
                              scoreInputs[match.id]?.a ?? match.score_a?.toString() ?? "0",
                              scoreInputs[match.id]?.b ?? match.score_b?.toString() ?? "0"
                            )
                          }
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Finalizar
                        </Button>
                      )}

                      {match.status === "finished" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleFinishMatch(
                              match,
                              scoreInputs[match.id]?.a ?? match.score_a?.toString() ?? "0",
                              scoreInputs[match.id]?.b ?? match.score_b?.toString() ?? "0"
                            )
                          }
                          className="gap-1 border-accent text-accent hover:bg-accent/10"
                        >
                          <Save className="h-4 w-4" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              Ajuste os pontos para cada critério de acerto. O multiplicador da partida será aplicado sobre esses valores.
            </p>
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{rule.label}</p>
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={0}
                    defaultValue={rule.points}
                    onBlur={(e) => handleUpdateRule(rule.id, parseInt(e.target.value) || 0)}
                    className="w-20 text-center bg-secondary border-border font-display font-bold"
                  />
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="ranking" className="space-y-3 mt-4">
            <div className="rounded-xl border border-border bg-gradient-card p-4">
              <h3 className="font-display font-bold text-sm mb-4">Classificação Geral</h3>
              
              {ranking.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma classificação disponível ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {ranking.map((player, index) => {
                    const medal =
                      index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}º`;
                    return (
                      <motion.div
                        key={player.user_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold w-8 text-center">{medal}</span>
                          <div>
                            <p className="text-sm font-medium">
                              {player.first_name} {player.last_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-accent">{player.total_points}</p>
                          <p className="text-xs text-muted-foreground">pontos</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de confirmação de finalização */}
        <AlertDialog open={confirmDialog.isOpen} onOpenChange={(isOpen) => {
          if (!isOpen) {
            setConfirmDialog({ isOpen: false, matchId: "", teamA: "", teamB: "", scoreA: 0, scoreB: 0 });
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Salvar Resultado?</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {confirmDialog.teamA} <span className="text-accent">{confirmDialog.scoreA}</span>
                  {" "}×{" "}
                  <span className="text-accent">{confirmDialog.scoreB}</span> {confirmDialog.teamB}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Os pontos serão calculados automaticamente para todos os palpites!
                </p>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isConfirming}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmFinish}
                disabled={isConfirming}
                className="bg-accent"
              >
                {isConfirming ? "Salvando..." : "Confirmar e Calcular Pontos"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Admin;
