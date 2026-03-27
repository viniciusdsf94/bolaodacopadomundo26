import { Trophy, TrendingUp, Target, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Flag from "@/components/Flag";
import { Button } from "@/components/ui/button";
import { mockPlayers, mockMatches } from "@/lib/mockData";
import { formatDateBR } from "@/lib/formatDate";

const Dashboard = () => {
  const todayStr = (() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const todayUpcoming = mockMatches.filter(
    (m) => m.date === todayStr && m.status === "upcoming"
  );
  const remainingBets = todayUpcoming.length;
  const liveCount = mockMatches.filter((m) => m.status === "live").length;

  const statCards = [
    { label: "Sua Posição", value: "2º", icon: Trophy, accent: true, link: undefined },
    { label: "Pontos", value: "38", icon: TrendingUp, link: undefined },
    { label: "Palpites restantes hoje", value: String(remainingBets), icon: Target, link: undefined },
    { label: "Jogos ao Vivo", value: String(liveCount), icon: Flame, link: "/ao-vivo" },
  ];

  const nextMatches = [...mockMatches].filter((m) => m.status === "upcoming").sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 3);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold">
            Olá, <span className="text-gradient-gold">Maria</span> 👋
          </h1>
          <p className="text-muted-foreground text-sm">Confira a classificação do bolão</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl border border-border p-4 ${
                  stat.accent ? "bg-primary/10 border-primary/30" : "bg-gradient-card"
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${stat.accent ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Palpites */}
        <div>
          <Link to="/palpites">
            <Button className="w-full gap-2 text-sm font-display">
              <Target className="h-4 w-4" /> Faça seus palpites para os jogos de hoje
            </Button>
          </Link>
        </div>

        {/* Ranking */}
        <div>
          <h2 className="font-display text-lg font-bold mb-3">Classificação</h2>
          <div className="space-y-2">
            {mockPlayers.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 rounded-xl border border-border p-3 ${
                  i < 3 ? "bg-gradient-card" : "bg-card"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-display font-bold text-sm ${
                    i === 0
                      ? "bg-accent text-accent-foreground"
                      : i === 1
                      ? "bg-muted text-foreground"
                      : i === 2
                      ? "bg-orange-900/30 text-orange-400"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {player.rank}
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-display font-bold text-sm text-foreground">
                  {player.avatar}
                </div>
                <span className="flex-1 font-medium text-sm">{player.name}</span>
                <span className="font-display font-bold text-primary">{player.totalPoints} pts</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Next matches */}
        <div>
          <h2 className="font-display text-lg font-bold mb-3">Próximos Jogos</h2>
          <div className="space-y-2">
            {nextMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2">
                  <Flag src={match.flagA} alt={match.teamA} />
                  <span className="text-sm font-medium">{match.teamA}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">{formatDateBR(match.date)}</span>
                  <span className="font-display font-bold text-accent text-sm">{match.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{match.teamB}</span>
                  <Flag src={match.flagB} alt={match.teamB} />
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
