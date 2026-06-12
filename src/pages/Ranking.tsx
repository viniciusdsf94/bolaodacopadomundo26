import { useState, useEffect, useRef } from "react";
import { Trophy, ChevronUp, ChevronDown, Minus, Sparkles, Check, RotateCcw, Eye, EyeOff, Users } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Layout from "@/components/Layout";
import PointAdjustmentsHistory from "@/components/PointAdjustmentsHistory";
import { useRanking, useHistoricalRanking, useCuriosities } from "@/hooks/useRanking";
import { useAuth } from "@/hooks/useAuth";

const COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#eab308', '#06b6d4', '#d946ef', '#f43f5e', '#a855f7'
];

const Ranking = () => {
  const { user: currentUser } = useAuth();
  const { data: ranking = [], isLoading } = useRanking();
  const { data: historical = { chartData: [], users: [] }, isLoading: isHistoricalLoading } = useHistoricalRanking();
  const { data: curiosities = [], isLoading: isCuriositiesLoading } = useCuriosities();

  const displayChartData = historical.chartData;
  const displayUsers = historical.users;

  const [activeUserIds, setActiveUserIds] = useState<string[]>([]);
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);

  useEffect(() => {
    if (displayUsers && displayUsers.length > 0 && activeUserIds.length === 0) {
      if (currentUser?.id && displayUsers.some(u => u.id === currentUser.id)) {
        setActiveUserIds([currentUser.id]);
      } else {
        const leaderId = ranking[0]?.user_id || displayUsers[0]?.id;
        if (leaderId) {
          setActiveUserIds([leaderId]);
        }
      }
    }
  }, [currentUser, displayUsers, ranking]);

  const getMedalIcon = (position: number) => {
    if (position === 1) return "🥇";
    if (position === 2) return "🥈";
    if (position === 3) return "🥉";
    return null;
  };

  if (isLoading || isHistoricalLoading || isCuriositiesLoading) {
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

        {/* Curiosidades Section */}
        {curiosities && curiosities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80">
            <div className="col-span-full flex items-center justify-between">
              <h3 className="font-display font-bold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                Curiosidades do Bolão
              </h3>
            </div>
            {curiosities.map((item, idx) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700/80 p-4 rounded-lg flex gap-3 transition-all duration-300"
              >
                <div className="text-3xl flex items-center justify-center bg-zinc-900/60 rounded-lg p-2 h-12 w-12 border border-zinc-800 shrink-0">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                      {item.title}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {item.userName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                  <div className="text-xs font-bold text-gradient-gold pt-1">
                    {item.value}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {ranking.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Carregando classificação...</p>
            </div>
          ) : (
            ranking.map((user, index) => {
              const medal = getMedalIcon(user.position);
              const isTopThree = user.position <= 3;
              
              const isMovingUp = user.trend === 'up';
              const isMovingDown = user.trend === 'down';
              
              const containerClasses = isMovingUp
                ? "border-green-500/50 bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)] z-10 scale-[1.02] transition-colors duration-500"
                : isMovingDown
                  ? "border-red-500/50 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)] z-0 scale-[0.98] transition-colors duration-500"
                  : isTopThree
                    ? "border-zinc-700 bg-gradient-to-r from-zinc-800/40 to-transparent shadow-sm transition-colors duration-500"
                    : "border-border bg-gradient-to-r from-zinc-800/40 to-transparent hover:from-secondary/20 hover:to-transparent transition-colors duration-500";

              return (
                <motion.div
                  layout
                  key={user.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    layout: { type: "spring", stiffness: 100, damping: 20 },
                    opacity: { delay: index * 0.05 }
                  }}
                  className={`rounded-lg border p-4 flex items-center justify-between relative ${containerClasses}`}
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
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <span>Posição #{user.position}</span>
                        {user.trend === 'up' && (
                          <span className="flex items-center text-green-500 ml-1 font-bold" title={`Subiu ${user.position_change} posições`}>
                            <ChevronUp className="h-4 w-4 mr-0.5" />
                            {user.position_change}
                          </span>
                        )}
                        {user.trend === 'down' && (
                          <span className="flex items-center text-red-500 ml-1 font-bold" title={`Caiu ${user.position_change} posições`}>
                            <ChevronDown className="h-4 w-4 mr-0.5" />
                            {user.position_change}
                          </span>
                        )}
                        {user.trend === 'none' && <Minus className="h-3 w-3 text-muted-foreground/40 ml-1" title="Manteve a posição" />}
                      </div>
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
                      const userId = props.dataKey as string;
                      const isActive = activeUserIds.includes(userId);
                      const isHovered = hoveredUserId === userId;
                      
                      if (!isActive && !isHovered) return null as any;
                      
                      const points = props.payload[`${userId}_points`];
                      return [`${value}º lugar (${points} pts)`, name];
                    }}
                  />
                  {displayUsers.map((user, index) => {
                    const isActive = activeUserIds.includes(user.id);
                    const isHovered = hoveredUserId === user.id;
                    const isCurrentUser = currentUser?.id === user.id;
                    
                    let opacity = 0.1;
                    if (hoveredUserId) {
                      opacity = isHovered ? 1.0 : 0.03;
                    } else {
                      opacity = isActive ? 1.0 : 0.1;
                    }

                    const strokeWidth = isHovered ? 4.5 : (isActive ? (isCurrentUser ? 4 : 3) : 1.5);
                    const strokeDasharray = (isCurrentUser && !isHovered) ? "4 4" : undefined;

                    return (
                      <Line
                        key={user.id}
                        type="monotone"
                        dataKey={user.id}
                        name={`${user.first_name} ${user.last_name || ''}`.trim()}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={strokeWidth}
                        strokeOpacity={opacity}
                        strokeDasharray={strokeDasharray}
                        dot={isActive ? { r: 3, strokeWidth: 1 } : false}
                        activeDot={isActive ? { r: 6 } : false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda Interativa e Controles */}
            <div className="mt-6 border-t border-zinc-800/80 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Participantes (clique para destacar)
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveUserIds(displayUsers.map(u => u.id))}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-foreground transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ativar Todos
                  </button>
                  <button
                    onClick={() => {
                      if (currentUser?.id && displayUsers.some(u => u.id === currentUser.id)) {
                        setActiveUserIds([currentUser.id]);
                      } else {
                        const leaderId = ranking[0]?.user_id || displayUsers[0]?.id;
                        if (leaderId) {
                          setActiveUserIds([leaderId]);
                        }
                      }
                    }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-foreground transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Resetar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {displayUsers.map((user, index) => {
                  const isActive = activeUserIds.includes(user.id);
                  const color = COLORS[index % COLORS.length];
                  const isCurrentUser = currentUser?.id === user.id;

                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        setActiveUserIds(prev => {
                          if (prev.includes(user.id)) {
                            return prev.filter(id => id !== user.id);
                          } else {
                            return [...prev, user.id];
                          }
                        });
                      }}
                      onMouseEnter={() => setHoveredUserId(user.id)}
                      onMouseLeave={() => setHoveredUserId(null)}
                      className={`flex items-center justify-between gap-2 p-2 rounded-lg text-left border transition-all text-xs ${
                        isActive
                          ? "bg-zinc-800/80 border-zinc-700 text-white shadow-sm"
                          : "bg-zinc-900/30 border-zinc-800/50 text-muted-foreground hover:border-zinc-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: color,
                            boxShadow: isActive ? `0 0 6px ${color}` : 'none',
                            opacity: isActive ? 1 : 0.4
                          }}
                        />
                        <span className={`truncate ${isActive ? "font-medium" : ""}`}>
                          {user.first_name} {isCurrentUser ? "(Você)" : ""}
                        </span>
                      </div>
                      
                      {isActive && (
                        <Check className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}



        <PointAdjustmentsHistory />
      </div>
    </Layout>
  );
};

export default Ranking;
