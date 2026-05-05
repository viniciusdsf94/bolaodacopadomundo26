import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "@/components/Layout";
import { useRanking, useHistoricalRanking } from "@/hooks/useRanking";

const COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#eab308', '#06b6d4', '#d946ef', '#f43f5e', '#a855f7'
];

const Ranking = () => {
  const { data: ranking = [], isLoading } = useRanking();
  const { data: historical = { chartData: [], users: [] }, isLoading: isHistoricalLoading } = useHistoricalRanking();

  const getMedalIcon = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return null;
  };

  if (isLoading || isHistoricalLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  const displayChartData = historical.chartData;
  const displayUsers = historical.users;

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

        {displayChartData.length > 1 && (
          <div className="rounded-lg border border-border bg-card p-4 overflow-hidden mt-6">
            <h3 className="font-display font-bold mb-4 flex items-center gap-2">
              📈 Histórico de Posições
            </h3>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => {
                    const [y, m, d] = value.split('-');
                    return `${d}/${m}`;
                  }}
                />
                <YAxis 
                  reversed 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickCount={displayUsers.length || 1}
                  domain={[1, displayUsers.length || 1]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '12px' }}
                  labelFormatter={(label) => {
                    const [y, m, d] = label.split('-');
                    return `${d}/${m}/${y}`;
                  }}
                  formatter={(value, name, props) => {
                    const points = props.payload[`${props.dataKey}_points`];
                    return [`${value}º lugar (${points} pts)`, name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                />
                {displayUsers.map((user, index) => (
                  <Line
                    key={user.id}
                    type="monotone"
                    dataKey={user.id}
                    name={`${user.first_name} ${user.last_name || ''}`.trim()}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

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
