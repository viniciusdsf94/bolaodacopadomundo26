export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  date: string;
  time: string;
  group: string;
  scoreA?: number;
  scoreB?: number;
  status: "upcoming" | "live" | "finished";
}

export interface Bet {
  id: string;
  matchId: string;
  userId: string;
  scoreA: number;
  scoreB: number;
  points?: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  totalPoints: number;
  rank: number;
}

export interface ScoringRule {
  id: string;
  label: string;
  description: string;
  points: number;
}

export const mockMatches: Match[] = [
  { id: "1", teamA: "Brasil", teamB: "Sérvia", flagA: "🇧🇷", flagB: "🇷🇸", date: "2026-06-14", time: "16:00", group: "A", status: "upcoming" },
  { id: "2", teamA: "Argentina", teamB: "Arábia Saudita", flagA: "🇦🇷", flagB: "🇸🇦", date: "2026-06-14", time: "13:00", group: "B", scoreA: 2, scoreB: 1, status: "finished" },
  { id: "3", teamA: "Alemanha", teamB: "Japão", flagA: "🇩🇪", flagB: "🇯🇵", date: "2026-06-15", time: "10:00", group: "C", status: "upcoming" },
  { id: "4", teamA: "Espanha", teamB: "Costa Rica", flagA: "🇪🇸", flagB: "🇨🇷", date: "2026-06-15", time: "16:00", group: "D", scoreA: 7, scoreB: 0, status: "finished" },
  { id: "5", teamA: "França", teamB: "Austrália", flagA: "🇫🇷", flagB: "🇦🇺", date: "2026-06-16", time: "19:00", group: "E", status: "live" },
  { id: "6", teamA: "Portugal", teamB: "Gana", flagA: "🇵🇹", flagB: "🇬🇭", date: "2026-06-16", time: "16:00", group: "F", status: "upcoming" },
];

export const mockPlayers: Player[] = [
  { id: "1", name: "Carlos", avatar: "C", totalPoints: 42, rank: 1 },
  { id: "2", name: "Maria", avatar: "M", totalPoints: 38, rank: 2 },
  { id: "3", name: "João", avatar: "J", totalPoints: 35, rank: 3 },
  { id: "4", name: "Ana", avatar: "A", totalPoints: 30, rank: 4 },
  { id: "5", name: "Pedro", avatar: "P", totalPoints: 25, rank: 5 },
  { id: "6", name: "Lúcia", avatar: "L", totalPoints: 20, rank: 6 },
];

export const mockBets: Bet[] = [
  { id: "1", matchId: "2", userId: "1", scoreA: 2, scoreB: 1, points: 10 },
  { id: "2", matchId: "2", userId: "2", scoreA: 3, scoreB: 0, points: 3 },
  { id: "3", matchId: "2", userId: "3", scoreA: 1, scoreB: 1, points: 0 },
  { id: "4", matchId: "4", userId: "1", scoreA: 5, scoreB: 0, points: 5 },
  { id: "5", matchId: "4", userId: "2", scoreA: 7, scoreB: 0, points: 10 },
];

export const mockScoringRules: ScoringRule[] = [
  { id: "1", label: "Placar Exato", description: "Acertou o placar exato da partida", points: 10 },
  { id: "2", label: "Vencedor", description: "Acertou o vencedor da partida (ou empate)", points: 5 },
  { id: "3", label: "Saldo de Gols", description: "Acertou a diferença de gols da partida", points: 3 },
  { id: "4", label: "Gols do Vencedor", description: "Acertou o número de gols do vencedor", points: 2 },
  { id: "5", label: "Gols do Perdedor", description: "Acertou o número de gols do perdedor", points: 2 },
];
