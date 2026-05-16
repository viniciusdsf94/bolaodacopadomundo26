const fs = require('fs');

const flagMap = {
  "México": "https://flagcdn.com/w80/mx.png",
  "África do Sul": "https://flagcdn.com/w80/za.png",
  "República da Coreia": "https://flagcdn.com/w80/kr.png",
  "República Tcheca": "https://flagcdn.com/w80/cz.png",
  "Canadá": "https://flagcdn.com/w80/ca.png",
  "Bósnia e Herzegovina": "https://flagcdn.com/w80/ba.png",
  "Catar": "https://flagcdn.com/w80/qa.png",
  "Suíça": "https://flagcdn.com/w80/ch.png",
  "Brasil": "https://flagcdn.com/w80/br.png",
  "Marrocos": "https://flagcdn.com/w80/ma.png",
  "Haiti": "https://flagcdn.com/w80/ht.png",
  "Escócia": "https://flagcdn.com/w80/gb-sct.png",
  "Estados Unidos": "https://flagcdn.com/w80/us.png",
  "Paraguai": "https://flagcdn.com/w80/py.png",
  "Austrália": "https://flagcdn.com/w80/au.png",
  "Turquia": "https://flagcdn.com/w80/tr.png",
  "Alemanha": "https://flagcdn.com/w80/de.png",
  "Curaçau": "https://flagcdn.com/w80/cw.png",
  "Costa do Marfim": "https://flagcdn.com/w80/ci.png",
  "Equador": "https://flagcdn.com/w80/ec.png",
  "Holanda": "https://flagcdn.com/w80/nl.png",
  "Japão": "https://flagcdn.com/w80/jp.png",
  "Suécia": "https://flagcdn.com/w80/se.png",
  "Tunísia": "https://flagcdn.com/w80/tn.png",
  "Bélgica": "https://flagcdn.com/w80/be.png",
  "Egito": "https://flagcdn.com/w80/eg.png",
  "Irã": "https://flagcdn.com/w80/ir.png",
  "Nova Zelândia": "https://flagcdn.com/w80/nz.png",
  "Espanha": "https://flagcdn.com/w80/es.png",
  "Cabo Verde": "https://flagcdn.com/w80/cv.png",
  "Arábia Saudita": "https://flagcdn.com/w80/sa.png",
  "Uruguai": "https://flagcdn.com/w80/uy.png",
  "França": "https://flagcdn.com/w80/fr.png",
  "Senegal": "https://flagcdn.com/w80/sn.png",
  "Iraque": "https://flagcdn.com/w80/iq.png",
  "Noruega": "https://flagcdn.com/w80/no.png",
  "Argentina": "https://flagcdn.com/w80/ar.png",
  "Argélia": "https://flagcdn.com/w80/dz.png",
  "Áustria": "https://flagcdn.com/w80/at.png",
  "Jordânia": "https://flagcdn.com/w80/jo.png",
  "Portugal": "https://flagcdn.com/w80/pt.png",
  "República Democrática do Congo": "https://flagcdn.com/w80/cd.png",
  "Uzbequistão": "https://flagcdn.com/w80/uz.png",
  "Colômbia": "https://flagcdn.com/w80/co.png",
  "Inglaterra": "https://flagcdn.com/w80/gb-eng.png",
  "Croácia": "https://flagcdn.com/w80/hr.png",
  "Gana": "https://flagcdn.com/w80/gh.png",
  "Panamá": "https://flagcdn.com/w80/pa.png",
};

const round3dates = [
  '2026-06-25', '2026-06-26', '2026-06-27',
  '2026-06-28', '2026-06-29', '2026-06-30',
];

const matches = JSON.parse(fs.readFileSync('public/jogos-fase-grupos.json', 'utf8'));

const escape = (str) => str.replace(/'/g, "''");

let sql = `-- ============================================================
-- INSERÇÃO DOS 72 JOGOS DA FASE DE GRUPOS - COPA DO MUNDO 2026
-- Inclui: estádio, cidade e país de cada partida
-- IMPORTANTE: Execute PRIMEIRO a migração 20260516_add_location_to_matches.sql
-- Execute DEPOIS de limpar as tabelas com 20260516_reset_matches_and_bets.sql
-- ============================================================

INSERT INTO public.matches (team_a, team_b, flag_a, flag_b, match_date, match_time, multiplier, status, stadium, city, country)
VALUES\n`;

const rows = matches.map((m) => {
  const flagA = flagMap[m.team_a] || '';
  const flagB = flagMap[m.team_b] || '';
  const time = m.time_brt + ':00';
  const multiplier = round3dates.includes(m.date) ? '1.5' : '1.0';
  return `  ('${escape(m.team_a)}', '${escape(m.team_b)}', '${flagA}', '${flagB}', '${m.date}', '${time}', ${multiplier}, 'upcoming', '${escape(m.stadium)}', '${escape(m.city)}', '${escape(m.country)}')`;
});

sql += rows.join(',\n') + ';\n\n';
sql += `-- Verificação: deve retornar 72\nSELECT COUNT(*) AS total_partidas FROM public.matches;\n`;

fs.writeFileSync('supabase/migrations/20260516_insert_group_stage_matches.sql', sql, 'utf8');
console.log(`SQL gerado com ${matches.length} partidas (com estádio, cidade e país).`);
