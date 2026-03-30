import { Trophy, TrendingUp, Target, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Flag from "@/components/Flag";
import { Button } from "@/components/ui/button";
import { useMatches, useMyBets } from "@/hooks/useMatches";
import { useAuth } from "@/hooks/useAuth";
import { formatDateBR } from "@/lib/formatDate";
import { isMatchStarted, isMatchLive } from "@/lib/matchTime";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: matches = [] } = useMatches();
  const { data: myBets = [] } = useMyBets();

  const todayStr = (() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const todayUpcoming = matches.filter(
    (m) => m.match_date === todayStr && m.status === "upcoming"
  );
  const todayBetMatchIds = new Set(myBets.filter((b) => todayUpcoming.some((m) => m.id === b.match_id)).map((b) => b.match_id));
  const remainingBets = todayUpcoming.filter((m) => !todayBetMatchIds.has(m.id)).length;
  const liveCount = matches.filter((m) => m.status === "live").length;

  const totalPoints = myBets.reduce((sum, b) => sum + (b.points ?? 0), 0);

  const displayName = user?.email?.split("@")[0] ?? "Jogador";

  const statCards = [
    { label: "Palpites restantes hoje", value: String(remainingBets), icon: Target, link: "/palpites" },
    { label: "Seus Pontos", value: String(totalPoints), icon: TrendingUp, link: undefined },
    { label: "Jogos ao Vivo", value: String(liveCount), icon: Flame, link: "/ao-vivo" },
    { label: "Em breve", value: "—", icon: Trophy, link: undefined },
  ];

  const nextMatches = matches
    .filter((m) => m.status === "upcoming")
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
              <div className="rounded-xl border border-border p-4 bg-gradient-card hover:bg-secondary/50 transition-colors">
                <Icon className="h-5 w-5 mb-2 text-muted-foreground" />
                <p className="font-display text-2xl font-bold">{stat.value}</p>
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
              <div
                key={match.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2">
                  <Flag src={match.flag_a} alt={match.team_a} />
                  <span className="text-sm font-medium">{match.team_a}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">{formatDateBR(match.match_date)}</span>
                  <span className="font-display font-bold text-accent text-sm">{match.match_time?.slice(0, 5)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{match.team_b}</span>
                  <Flag src={match.flag_b} alt={match.team_b} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
