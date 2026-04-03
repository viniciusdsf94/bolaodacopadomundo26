import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { useRanking } from "@/hooks/useRanking";

const Ranking = () => {
  const { data: ranking = [], isLoading } = useRanking();

  const getMedalIcon = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return null;
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
          <h1 className="font-display text-2xl font-bold">
            <Trophy className="inline-block mr-2 text-gradient-gold" />
            Classificação
          </h1>
          <p className="text-muted-foreground text-sm">
            Confira os pontos de todos os participantes
          </p>
        </div>

        <div className="space-y-2">
          {ranking.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando classificação...</p>
            </div>
          ) : (
            ranking.map((user, index) => {
              const medal = getMedalIcon(user.position);
              const isTopThree = user.position <= 3;

              return (
                <motion.div
                  key={user.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-lg border p-4 flex items-center justify-between ${
                    isTopThree
                      ? "border-primary/30 bg-gradient-to-r from-primary/10 to-transparent shadow-glow"
                      : "border-border bg-card hover:bg-secondary/30 transition-colors"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10">
                      {medal ? (
                        <span className="text-2xl">{medal}</span>
                      ) : (
                        <span className="font-display font-bold text-lg text-muted-foreground">
                          #{user.position}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-display font-bold text-foreground">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Posição #{user.position}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-gradient-gold">
                      {user.total_points}
                    </p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {ranking.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-display font-bold mb-3 flex items-center gap-2">
              🏆 Resumo
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gradient-gold">🥇</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ranking[0]?.first_name} {ranking[0]?.last_name}
                </p>
                <p className="font-display font-bold">{ranking[0]?.total_points} pts</p>
              </div>
              {ranking[1] && (
                <div>
                  <p className="text-2xl font-bold">🥈</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ranking[1]?.first_name} {ranking[1]?.last_name}
                  </p>
                  <p className="font-display font-bold">{ranking[1]?.total_points} pts</p>
                </div>
              )}
              {ranking[2] && (
                <div>
                  <p className="text-2xl font-bold">🥉</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ranking[2]?.first_name} {ranking[2]?.last_name}
                  </p>
                  <p className="font-display font-bold">{ranking[2]?.total_points} pts</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Ranking;
