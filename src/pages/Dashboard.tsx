import { Trophy, TrendingUp, Target, Flame, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Flag from "@/components/Flag";
import { Button } from "@/components/ui/button";
import { useMatches, useMyBets } from "@/hooks/useMatches";
import { useRanking, useHistoricalRanking } from "@/hooks/useRanking";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { formatDateBR } from "@/lib/formatDate";
import { isMatchStarted, isMatchLive } from "@/lib/matchTime";

const Dashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data: matches = [] } = useMatches();
  const { data: myBets = [] } = useMyBets();
  const { data: ranking = [] } = useRanking();

  const todayStr = (() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const todayUpcoming = matches.filter(
    (m) => m.match_date === todayStr && !isMatchStarted(m)
  );
  const todayBetMatchIds = new Set(myBets.filter((b) => todayUpcoming.some((m) => m.id === b.match_id)).map((b) => b.match_id));
  const remainingBets = todayUpcoming.filter((m) => !todayBetMatchIds.has(m.id)).length;
  const liveCount = matches.filter((m) => isMatchLive(m)).length;

  const myRank = ranking.find((r) => r.user_id === user?.id);
  const totalPoints = myRank?.total_points || 0;

  const todayPoints = myBets
    .filter((b) => matches.some((m) => m.id === b.match_id && m.match_date === todayStr))
    .reduce((sum, b) => sum + (b.points ?? 0), 0);

  const displayName = profile?.first_name ?? user?.email?.split("@")[0] ?? "Jogador";

  const { data: historical = { chartData: [], users: [] } } = useHistoricalRanking();

  const currentPosition = myRank?.position || 0;
  
  let previousPosition = currentPosition;
  if (historical.chartData.length >= 2 && user?.id) {
    const prevDayData = historical.chartData[historical.chartData.length - 2];
    const prevPos = prevDayData[user.id];
    if (typeof prevPos === "number") {
      previousPosition = prevPos;
    }
  }
  
  const positionDiff = previousPosition - currentPosition;

  const statCards = [
    { label: "Palpites restantes hoje", value: String(remainingBets), icon: Target, link: "/palpites" },
    { 
      label: "Seus Pontos", 
      value: String(totalPoints), 
      icon: TrendingUp, 
      link: undefined,
      isPoints: true,
      todayPoints: todayPoints
    },
    { label: "Jogos ao Vivo", value: String(liveCount), icon: Flame, link: "/ao-vivo" },
    { 
      label: "Sua Posição", 
      value: currentPosition > 0 ? `${currentPosition}º` : "—", 
      icon: Trophy, 
      link: "/classificacao",
      isRank: true
    },
  ];

  const nextMatches = matches
    .filter((m) => !isMatchStarted(m))
    .slice(0, 3);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Olá, <span className="text-gradient-gold">{displayName}</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm">Confira a classificação do bolão</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            const content = (
              <div className="rounded-xl border border-border p-4 bg-gradient-card hover:bg-secondary/50 transition-colors relative">
                <Icon className="h-5 w-5 mb-2 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <p className="font-display text-2xl font-bold">{stat.value}</p>
                  {stat.isRank && currentPosition > 0 && (
                    <div className={`flex items-center text-xs font-bold ${positionDiff > 0 ? 'text-green-500' : positionDiff < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {positionDiff > 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : positionDiff < 0 ? <ArrowDown className="h-3 w-3 mr-0.5" /> : <Minus className="h-3 w-3 mr-0.5" />}
                      {Math.abs(positionDiff)}
                    </div>
                  )}
                  {stat.isPoints && stat.todayPoints > 0 && (
                    <div className="flex items-center text-xs font-bold text-green-500">
                      <ArrowUp className="h-3 w-3 mr-0.5" />
                      {stat.todayPoints}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            );
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {stat.link ? <Link to={stat.link} className="block">{content}</Link> : content}
              </motion.div>
            );
          })}
        </div>

        <div>
          <Link to="/palpites">
            <Button className="w-full gap-2 text-sm font-display">
              <Target className="h-4 w-4" /> Faça seus palpites para os jogos de hoje
            </Button>
          </Link>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold mb-3">Próximos Jogos</h2>
          <div className="space-y-2">
            {nextMatches.map((match) => (
              <Link
                key={match.id}
                to="/palpites"
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-secondary/50 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Flag src={match.flag_a} alt={match.team_a} />
                  <span className="text-sm font-medium">{match.team_a}</span>
                </div>
                <div className="flex flex-col items-center px-2">
                  <span className="text-xs text-muted-foreground">{formatDateBR(match.match_date)}</span>
                  <span className="font-display font-bold text-accent text-sm">{match.match_time?.slice(0, 5)}</span>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-sm font-medium">{match.team_b}</span>
                  <Flag src={match.flag_b} alt={match.team_b} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
