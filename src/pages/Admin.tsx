import { useState } from "react";
import { Plus, Save, Settings, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import TeamSelect from "@/components/TeamSelect";
import { useMatches, useScoringRules } from "@/hooks/useMatches";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateBR } from "@/lib/formatDate";
import { toast } from "sonner";

const Admin = () => {
  const { data: matches = [] } = useMatches();
  const { data: rules = [] } = useScoringRules();
  const queryClient = useQueryClient();

  const [newMatch, setNewMatch] = useState({
    teamA: "", teamB: "", flagA: "", flagB: "", date: "", time: "", multiplier: "1",
  });

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
              {matches.map((match, i) => (
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
                        defaultValue={match.score_a ?? ""}
                        onBlur={(e) => {
                          const scoreA = parseInt(e.target.value) || 0;
                          handleUpdateResult(match.id, scoreA, match.score_b ?? 0);
                        }}
                        className="w-14 text-center bg-secondary border-border font-bold"
                      />
                      <span className="text-muted-foreground">×</span>
                      <Input
                        type="number" min={0} placeholder="0"
                        defaultValue={match.score_b ?? ""}
                        onBlur={(e) => {
                          const scoreB = parseInt(e.target.value) || 0;
                          handleUpdateResult(match.id, match.score_a ?? 0, scoreB);
                        }}
                        className="w-14 text-center bg-secondary border-border font-bold"
                      />
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
