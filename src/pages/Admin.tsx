import { useState } from "react";
import { Plus, Save, Settings, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import TeamSelect from "@/components/TeamSelect";
import { mockMatches, mockScoringRules, type Match, type ScoringRule } from "@/lib/mockData";

const Admin = () => {
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [rules, setRules] = useState<ScoringRule[]>(mockScoringRules);
  const [newMatch, setNewMatch] = useState({
    teamA: "", teamB: "", flagA: "", flagB: "", date: "", time: "", multiplier: "1",
  });

  const handleAddMatch = () => {
    if (!newMatch.teamA || !newMatch.teamB) return;
    const match: Match = {
      id: Date.now().toString(),
      teamA: newMatch.teamA,
      teamB: newMatch.teamB,
      flagA: newMatch.flagA,
      flagB: newMatch.flagB,
      date: newMatch.date,
      time: newMatch.time,
      multiplier: parseFloat(newMatch.multiplier) || 1,
      status: "upcoming",
    };
    setMatches((prev) => [...prev, match]);
    setNewMatch({ teamA: "", teamB: "", flagA: "", flagB: "", date: "", time: "", multiplier: "1" });
  };

  const handleUpdateResult = (id: string, scoreA: string, scoreB: string) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, scoreA: parseInt(scoreA) || 0, scoreB: parseInt(scoreB) || 0, status: "finished" as const }
          : m
      )
    );
  };

  const handleUpdateRule = (id: string, points: number) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, points } : r)));
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
            {/* Add match form */}
            <div className="rounded-xl border border-border bg-gradient-card p-4 space-y-4">
              <h3 className="font-display font-bold text-sm">Nova Partida</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Team A */}
                <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Time A</p>
                  <TeamSelect
                    label="País"
                    value={newMatch.teamA}
                    onChange={(name, flag) => setNewMatch((p) => ({ ...p, teamA: name, flagA: flag }))}
                    excludeTeam={newMatch.teamB}
                  />
                </div>

                {/* Team B */}
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
                  <Input
                    type="date"
                    value={newMatch.date}
                    onChange={(e) => setNewMatch((p) => ({ ...p, date: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Horário</Label>
                  <Input
                    type="time"
                    value={newMatch.time}
                    onChange={(e) => setNewMatch((p) => ({ ...p, time: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Multiplicador</Label>
                  <Input
                    type="number"
                    min={1}
                    step={0.5}
                    value={newMatch.multiplier}
                    onChange={(e) => setNewMatch((p) => ({ ...p, multiplier: e.target.value }))}
                    className="bg-secondary border-border font-display font-bold"
                  />
                </div>
              </div>

              <Button onClick={handleAddMatch} className="w-full gap-1">
                <Plus className="h-4 w-4" /> Adicionar Partida
              </Button>
            </div>

            {/* Match list */}
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
                      {match.flagA && (
                        <img src={match.flagA} alt={match.teamA} className="h-6 w-8 rounded object-cover" />
                      )}
                      <span className="text-sm font-medium">{match.teamA}</span>
                      <span className="text-muted-foreground text-xs">vs</span>
                      <span className="text-sm font-medium">{match.teamB}</span>
                      {match.flagB && (
                        <img src={match.flagB} alt={match.teamB} className="h-6 w-8 rounded object-cover" />
                      )}
                    </div>
                    {match.multiplier > 1 && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">
                        ×{match.multiplier}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDateBR(match.date)} {match.time}
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        defaultValue={match.scoreA ?? ""}
                        onChange={(e) => handleUpdateResult(match.id, e.target.value, String(match.scoreB ?? 0))}
                        className="w-14 text-center bg-secondary border-border font-bold"
                      />
                      <span className="text-muted-foreground">×</span>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        defaultValue={match.scoreB ?? ""}
                        onChange={(e) => handleUpdateResult(match.id, String(match.scoreA ?? 0), e.target.value)}
                        className="w-14 text-center bg-secondary border-border font-bold"
                      />
                      <Button size="icon" variant="ghost" className="text-primary">
                        <Save className="h-4 w-4" />
                      </Button>
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
              <div
                key={rule.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{rule.label}</p>
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={rule.points}
                    onChange={(e) => handleUpdateRule(rule.id, parseInt(e.target.value) || 0)}
                    className="w-20 text-center bg-secondary border-border font-display font-bold"
                  />
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
              </div>
            ))}
            <Button className="gap-1">
              <Save className="h-4 w-4" /> Salvar regras
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
