import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Search } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Flag from "@/components/Flag";
import { useMatches } from "@/hooks/useMatches";
import { formatDateBR } from "@/lib/formatDate";
import { Input } from "@/components/ui/input";

const GroupBets = () => {
  const { data: matches = [], isLoading } = useMatches();
  const [searchTeam, setSearchTeam] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const finishedOrLive = matches
    .filter((m) => m.status !== "upcoming")
    .sort((a, b) => b.match_date.localeCompare(a.match_date) || b.match_time.localeCompare(a.match_time));

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  const uniqueTeamsMap = new Map<string, string>();
  finishedOrLive.forEach(m => {
    if (!uniqueTeamsMap.has(m.team_a)) uniqueTeamsMap.set(m.team_a, m.flag_a);
    if (!uniqueTeamsMap.has(m.team_b)) uniqueTeamsMap.set(m.team_b, m.flag_b);
  });
  
  const uniqueTeams = Array.from(uniqueTeamsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const filteredTeams = uniqueTeams.filter(([team]) => 
    team.toLowerCase().includes(searchTeam.toLowerCase())
  );

  const filteredMatches = finishedOrLive.filter(m => 
    searchTeam === "" || 
    m.team_a.toLowerCase().includes(searchTeam.toLowerCase()) || 
    m.team_b.toLowerCase().includes(searchTeam.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Histórico</h1>
          <p className="text-muted-foreground text-sm">
            Todas as partidas já realizadas
          </p>
        </div>

        {finishedOrLive.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text"
              placeholder="Buscar por seleção..."
              value={searchTeam}
              onChange={(e) => {
                setSearchTeam(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="pl-10 bg-card border-border w-full"
            />
            {isDropdownOpen && filteredTeams.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full z-50 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredTeams.map(([team, flag]) => (
                  <div 
                    key={team}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-secondary transition-colors text-sm"
                    onClick={() => {
                      setSearchTeam(team);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Flag src={flag} alt={team} size="sm" />
                    <span className="font-medium">{team}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filteredMatches.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma partida encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/partida/${match.id}`}>
                  <div className="relative rounded-xl border border-border bg-card p-4 hover:bg-secondary/50 transition-colors cursor-pointer text-center flex flex-col gap-3">
                    <div className="absolute top-3 left-4 text-left">
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{formatDateBR(match.match_date)}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{match.match_time?.slice(0, 5)}</p>
                    </div>

                    <div className="flex items-start justify-center gap-4 mt-6">
                      <div className="flex flex-col items-center gap-1.5 w-[80px]">
                        <Flag src={match.flag_a} alt={match.team_a} size="lg" />
                        <span className="text-xs sm:text-sm font-medium text-center leading-tight">{match.team_a}</span>
                      </div>

                      <div className="font-display text-2xl font-black text-foreground min-w-[60px]">
                        {match.status === "finished" || match.status === "live" ? (
                          <>{match.score_a ?? 0} <span className="text-muted-foreground font-medium text-lg">×</span> {match.score_b ?? 0}</>
                        ) : (
                          <span className="text-muted-foreground text-lg font-medium">×</span>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-1.5 w-[80px]">
                        <Flag src={match.flag_b} alt={match.team_b} size="lg" />
                        <span className="text-xs sm:text-sm font-medium text-center leading-tight">{match.team_b}</span>
                      </div>
                    </div>

                    {match.status === "live" && (
                      <div className="flex justify-center mt-1">
                        <span className="text-[10px] font-bold tracking-wider text-primary bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 animate-pulse-glow">
                          AO VIVO
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GroupBets;
