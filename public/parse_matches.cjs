const fs = require('fs');

// Data extracted manually from jogos.html (FIFA official schedule in Portuguese)
// All times in BRT (Brasília Time)
// Groups A-L, 4 matches each = 48 matches in group stage (first 2 rounds shown)
// The HTML repeats due to pagination but we get all unique matches

const cityMap = {
  'Cidade do México': { country: 'México', stadium: 'Estádio Azteca' },
  'Guadalajara': { country: 'México', stadium: 'Estadio Akron' },
  'Monterrey': { country: 'México', stadium: 'Estadio BBVA' },
  'Toronto': { country: 'Canadá', stadium: 'BMO Field' },
  'Vancouver': { country: 'Canadá', stadium: 'BC Place' },
  'Nova York/Nova Jersey': { country: 'Estados Unidos', stadium: 'MetLife Stadium' },
  'Los Angeles': { country: 'Estados Unidos', stadium: 'SoFi Stadium' },
  'Dallas': { country: 'Estados Unidos', stadium: 'AT&T Stadium' },
  'Houston': { country: 'Estados Unidos', stadium: 'NRG Stadium' },
  'Seattle': { country: 'Estados Unidos', stadium: 'Lumen Field' },
  'Boston': { country: 'Estados Unidos', stadium: 'Gillette Stadium' },
  'Filadélfia': { country: 'Estados Unidos', stadium: 'Lincoln Financial Field' },
  'Miami': { country: 'Estados Unidos', stadium: 'Hard Rock Stadium' },
  'Atlanta': { country: 'Estados Unidos', stadium: 'Mercedes-Benz Stadium' },
  'Kansas City': { country: 'Estados Unidos', stadium: 'Arrowhead Stadium' },
  'Santa Clara': { country: 'Estados Unidos', stadium: "Levi's Stadium" },
};

// Raw matches from the FIFA HTML – all group stage games
// Format: [group, date, time_brt, team_a, team_b, city]
const rawMatches = [
  // Rodada 1 (extraída do HTML)
  ['A', '2026-06-11', '16:00', 'México', 'África do Sul', 'Cidade do México'],
  ['A', '2026-06-11', '23:00', 'República da Coreia', 'República Tcheca', 'Guadalajara'],
  ['B', '2026-06-12', '16:00', 'Canadá', 'Bósnia e Herzegovina', 'Toronto'],
  ['D', '2026-06-12', '22:00', 'Estados Unidos', 'Paraguai', 'Los Angeles'],
  ['B', '2026-06-13', '16:00', 'Catar', 'Suíça', 'Santa Clara'],
  ['C', '2026-06-13', '19:00', 'Brasil', 'Marrocos', 'Nova York/Nova Jersey'],
  ['C', '2026-06-13', '22:00', 'Haiti', 'Escócia', 'Boston'],
  ['D', '2026-06-14', '01:00', 'Austrália', 'Turquia', 'Vancouver'],
  ['E', '2026-06-14', '14:00', 'Alemanha', 'Curaçau', 'Houston'],
  ['E', '2026-06-14', '20:00', 'Costa do Marfim', 'Equador', 'Filadélfia'],
  ['F', '2026-06-14', '17:00', 'Holanda', 'Japão', 'Dallas'],
  ['F', '2026-06-14', '23:00', 'Suécia', 'Tunísia', 'Monterrey'],
  // Rodada 1 continuação (15 de junho)
  ['H', '2026-06-15', '13:00', 'Espanha', 'Cabo Verde', 'Atlanta'],
  ['H', '2026-06-15', '19:00', 'Arábia Saudita', 'Uruguai', 'Miami'],
  ['G', '2026-06-15', '16:00', 'Bélgica', 'Egito', 'Seattle'],
  ['G', '2026-06-15', '22:00', 'Irã', 'Nova Zelândia', 'Los Angeles'],
  ['J', '2026-06-16', '01:00', 'Áustria', 'Jordânia', 'Santa Clara'],
  ['I', '2026-06-16', '16:00', 'França', 'Senegal', 'Nova York/Nova Jersey'],
  ['I', '2026-06-16', '19:00', 'Iraque', 'Noruega', 'Boston'],
  ['J', '2026-06-16', '22:00', 'Argentina', 'Argélia', 'Kansas City'],
  ['K', '2026-06-17', '14:00', 'Portugal', 'República Democrática do Congo', 'Houston'],
  ['L', '2026-06-17', '17:00', 'Inglaterra', 'Croácia', 'Dallas'],
  ['L', '2026-06-17', '20:00', 'Gana', 'Panamá', 'Toronto'],
  ['K', '2026-06-17', '21:00', 'Uzbequistão', 'Colômbia', 'Cidade do México'],
  // Rodada 2
  ['A', '2026-06-18', '13:00', 'República Tcheca', 'África do Sul', 'Atlanta'],
  ['B', '2026-06-18', '16:00', 'Suíça', 'Bósnia e Herzegovina', 'Los Angeles'],
  ['B', '2026-06-18', '19:00', 'Canadá', 'Catar', 'Vancouver'],
  ['A', '2026-06-18', '22:00', 'México', 'República da Coreia', 'Guadalajara'],
  ['D', '2026-06-19', '00:00', 'Turquia', 'Paraguai', 'Santa Clara'],
  ['D', '2026-06-19', '16:00', 'Estados Unidos', 'Austrália', 'Seattle'],
  ['C', '2026-06-19', '19:00', 'Escócia', 'Marrocos', 'Boston'],
  ['C', '2026-06-20', '21:30', 'Brasil', 'Haiti', 'Filadélfia'],
  ['F', '2026-06-20', '23:00', 'Tunísia', 'Japão', 'Monterrey'],
  ['F', '2026-06-20', '14:00', 'Holanda', 'Suécia', 'Houston'],
  ['E', '2026-06-20', '17:00', 'Alemanha', 'Costa do Marfim', 'Toronto'],
  ['E', '2026-06-20', '21:00', 'Equador', 'Curaçau', 'Kansas City'],
  ['H', '2026-06-21', '13:00', 'Espanha', 'Arábia Saudita', 'Atlanta'],
  ['G', '2026-06-21', '16:00', 'Bélgica', 'Irã', 'Los Angeles'],
  ['H', '2026-06-21', '19:00', 'Uruguai', 'Cabo Verde', 'Miami'],
  ['G', '2026-06-21', '22:00', 'Nova Zelândia', 'Egito', 'Vancouver'],
  ['J', '2026-06-22', '14:00', 'Argentina', 'Áustria', 'Dallas'],
  ['I', '2026-06-22', '18:00', 'França', 'Iraque', 'Filadélfia'],
  ['I', '2026-06-22', '21:00', 'Noruega', 'Senegal', 'Nova York/Nova Jersey'],
  ['J', '2026-06-23', '00:00', 'Jordânia', 'Argélia', 'Santa Clara'],
  ['K', '2026-06-23', '14:00', 'Portugal', 'Uzbequistão', 'Houston'],
  ['L', '2026-06-23', '17:00', 'Inglaterra', 'Gana', 'Boston'],
  ['L', '2026-06-23', '20:00', 'Panamá', 'Croácia', 'Toronto'],
  ['K', '2026-06-23', '23:00', 'Colômbia', 'República Democrática do Congo', 'Guadalajara'],
  // Rodada 3 (simultânea por grupo)
  ['B', '2026-06-25', '16:00', 'Suíça', 'Canadá', 'Vancouver'],
  ['B', '2026-06-25', '16:00', 'Bósnia e Herzegovina', 'Catar', 'Seattle'],
  ['C', '2026-06-25', '19:00', 'Escócia', 'Brasil', 'Miami'],
  ['C', '2026-06-25', '19:00', 'Marrocos', 'Haiti', 'Atlanta'],
  ['A', '2026-06-26', '16:00', 'República Tcheca', 'México', 'Dallas'],
  ['A', '2026-06-26', '16:00', 'África do Sul', 'República da Coreia', 'Kansas City'],
  ['D', '2026-06-26', '20:00', 'Austrália', 'Paraguai', 'Houston'],
  ['D', '2026-06-26', '20:00', 'Turquia', 'Estados Unidos', 'Filadélfia'],
  ['E', '2026-06-27', '17:00', 'Alemanha', 'Equador', 'Santa Clara'],
  ['E', '2026-06-27', '17:00', 'Costa do Marfim', 'Curaçau', 'Monterrey'],
  ['F', '2026-06-27', '22:00', 'Holanda', 'Tunísia', 'Nova York/Nova Jersey'],
  ['F', '2026-06-27', '22:00', 'Japão', 'Suécia', 'Los Angeles'],
  ['H', '2026-06-28', '14:00', 'Espanha', 'Uruguai', 'Guadalajara'],
  ['H', '2026-06-28', '14:00', 'Cabo Verde', 'Arábia Saudita', 'Vancouver'],
  ['G', '2026-06-28', '18:00', 'Bélgica', 'Nova Zelândia', 'Toronto'],
  ['G', '2026-06-28', '18:00', 'Egito', 'Irã', 'Boston'],
  ['I', '2026-06-29', '17:00', 'França', 'Noruega', 'Atlanta'],
  ['I', '2026-06-29', '17:00', 'Senegal', 'Iraque', 'Miami'],
  ['J', '2026-06-29', '21:00', 'Argentina', 'Jordânia', 'Seattle'],
  ['J', '2026-06-29', '21:00', 'Argélia', 'Áustria', 'Kansas City'],
  ['K', '2026-06-30', '17:00', 'Portugal', 'Colômbia', 'Dallas'],
  ['K', '2026-06-30', '17:00', 'República Democrática do Congo', 'Uzbequistão', 'Filadélfia'],
  ['L', '2026-06-30', '21:00', 'Inglaterra', 'Panamá', 'Houston'],
  ['L', '2026-06-30', '21:00', 'Croácia', 'Gana', 'Santa Clara'],
];

const matches = rawMatches.map((m, idx) => {
  const [group, date, time_brt, team_a, team_b, city] = m;
  const cityInfo = cityMap[city] || { country: '?', stadium: '?' };
  return {
    match_id: idx + 1,
    date,
    time_brt,
    team_a,
    team_b,
    group,
    stage: 'group_stage',
    stadium: cityInfo.stadium,
    city,
    country: cityInfo.country,
  };
});

fs.writeFileSync('public/jogos-fase-grupos.json', JSON.stringify(matches, null, 2), 'utf8');
console.log(`Written ${matches.length} matches to jogos-fase-grupos.json`);
