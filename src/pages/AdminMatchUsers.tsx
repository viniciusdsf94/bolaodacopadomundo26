import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import Flag from "@/components/Flag";
import { useMatches } from "@/hooks/useMatches";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const AdminMatchUsers = () => {
  const { id } = useParams();
  const { data: matches = [] } = useMatches();
  const match = matches.find((m) => m.id === id);

  const { data: usersData = [], isLoading } = useQuery({
    queryKey: ["admin_match_users", id],
    queryFn: async () => {
      // 1. Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name");
      
      if (profilesError) throw profilesError;

      // 2. Fetch all bets for this match
      const { data: bets, error: betsError } = await supabase
        .from("bets")
        .select("*")
        .eq("match_id", id);
      
      if (betsError) throw betsError;

      const betsMap = new Map(bets.map(b => [b.user_id, b]));

      const combined = profiles.map(profile => {
        const bet = betsMap.get(profile.id);
        return {
          ...profile,
          displayName: `${profile.first_name} ${profile.last_name || ""}`.trim(),
          hasBet: !!bet,
          betDetails: bet || null,
        };
      });

      // Sort: Has bet first, then by name
      combined.sort((a, b) => {
        if (a.hasBet && !b.hasBet) return -1;
        if (!a.hasBet && b.hasBet) return 1;
        return a.displayName.localeCompare(b.displayName);
      });

      return combined;
    },
    enabled: !!id,
  });

  if (!match) {
    return (
      <Layout>
        <div className="p-4">Partida não encontrada.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Usuários da Partida</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <Flag src={match.flag_a} alt={match.team_a} size="lg" />
              <span className="text-sm font-bold">{match.team_a}</span>
            </div>
            <span className="text-muted-foreground text-xl font-bold">×</span>
            <div className="flex flex-col items-center gap-2">
              <Flag src={match.flag_b} alt={match.team_b} size="lg" />
              <span className="text-sm font-bold">{match.team_b}</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold mb-4">Status dos Palpites</h2>
          {isLoading ? (
            <p className="text-center text-muted-foreground">Carregando usuários...</p>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-primary mb-3">
                  Já Palpitaram ({usersData.filter((u) => u.hasBet).length})
                </h3>
                <div className="space-y-3">
                  {usersData.filter((u) => u.hasBet).map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-xl border border-primary/50 bg-primary/5 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-display font-bold text-sm">
                          {user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{user.displayName}</p>
                          <p className="text-xs text-primary flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-3 w-3" /> Palpitou
                          </p>
                        </div>
                      </div>
                      
                      {user.betDetails && user.betDetails.points !== null && (
                        <div className="text-right">
                          <p className={`text-xs font-bold ${user.betDetails.points > 0 ? "text-accent" : "text-muted-foreground"}`}>
                            {user.betDetails.points > 0 ? `+${user.betDetails.points}` : "0"} pts
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {usersData.filter((u) => u.hasBet).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Nenhum palpite registrado ainda.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-3">
                  Ainda não palpitaram ({usersData.filter((u) => !u.hasBet).length})
                </h3>
                <div className="space-y-3">
                  {usersData.filter((u) => !u.hasBet).map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-4 opacity-70"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-display font-bold text-sm">
                          {user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-muted-foreground">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <XCircle className="h-3 w-3" /> Não palpitou
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {usersData.filter((u) => !u.hasBet).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Todos os usuários já palpitaram!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminMatchUsers;
