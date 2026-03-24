export interface WorldCupTeam {
  name: string;
  code: string;
  flag: string;
}

export const worldCupTeams: WorldCupTeam[] = [
  { name: "Alemanha", code: "de", flag: "https://flagcdn.com/w80/de.png" },
  { name: "Arábia Saudita", code: "sa", flag: "https://flagcdn.com/w80/sa.png" },
  { name: "Argentina", code: "ar", flag: "https://flagcdn.com/w80/ar.png" },
  { name: "Austrália", code: "au", flag: "https://flagcdn.com/w80/au.png" },
  { name: "Bélgica", code: "be", flag: "https://flagcdn.com/w80/be.png" },
  { name: "Bolívia", code: "bo", flag: "https://flagcdn.com/w80/bo.png" },
  { name: "Brasil", code: "br", flag: "https://flagcdn.com/w80/br.png" },
  { name: "Camarões", code: "cm", flag: "https://flagcdn.com/w80/cm.png" },
  { name: "Canadá", code: "ca", flag: "https://flagcdn.com/w80/ca.png" },
  { name: "Catar", code: "qa", flag: "https://flagcdn.com/w80/qa.png" },
  { name: "Chile", code: "cl", flag: "https://flagcdn.com/w80/cl.png" },
  { name: "Colômbia", code: "co", flag: "https://flagcdn.com/w80/co.png" },
  { name: "Coreia do Sul", code: "kr", flag: "https://flagcdn.com/w80/kr.png" },
  { name: "Costa Rica", code: "cr", flag: "https://flagcdn.com/w80/cr.png" },
  { name: "Croácia", code: "hr", flag: "https://flagcdn.com/w80/hr.png" },
  { name: "Dinamarca", code: "dk", flag: "https://flagcdn.com/w80/dk.png" },
  { name: "Equador", code: "ec", flag: "https://flagcdn.com/w80/ec.png" },
  { name: "Escócia", code: "gb-sct", flag: "https://flagcdn.com/w80/gb-sct.png" },
  { name: "Espanha", code: "es", flag: "https://flagcdn.com/w80/es.png" },
  { name: "Estados Unidos", code: "us", flag: "https://flagcdn.com/w80/us.png" },
  { name: "França", code: "fr", flag: "https://flagcdn.com/w80/fr.png" },
  { name: "Gana", code: "gh", flag: "https://flagcdn.com/w80/gh.png" },
  { name: "Honduras", code: "hn", flag: "https://flagcdn.com/w80/hn.png" },
  { name: "Inglaterra", code: "gb-eng", flag: "https://flagcdn.com/w80/gb-eng.png" },
  { name: "Irã", code: "ir", flag: "https://flagcdn.com/w80/ir.png" },
  { name: "Japão", code: "jp", flag: "https://flagcdn.com/w80/jp.png" },
  { name: "Marrocos", code: "ma", flag: "https://flagcdn.com/w80/ma.png" },
  { name: "México", code: "mx", flag: "https://flagcdn.com/w80/mx.png" },
  { name: "Nigéria", code: "ng", flag: "https://flagcdn.com/w80/ng.png" },
  { name: "Países Baixos", code: "nl", flag: "https://flagcdn.com/w80/nl.png" },
  { name: "Panamá", code: "pa", flag: "https://flagcdn.com/w80/pa.png" },
  { name: "Paraguai", code: "py", flag: "https://flagcdn.com/w80/py.png" },
  { name: "Peru", code: "pe", flag: "https://flagcdn.com/w80/pe.png" },
  { name: "Polônia", code: "pl", flag: "https://flagcdn.com/w80/pl.png" },
  { name: "Portugal", code: "pt", flag: "https://flagcdn.com/w80/pt.png" },
  { name: "Senegal", code: "sn", flag: "https://flagcdn.com/w80/sn.png" },
  { name: "Sérvia", code: "rs", flag: "https://flagcdn.com/w80/rs.png" },
  { name: "Suíça", code: "ch", flag: "https://flagcdn.com/w80/ch.png" },
  { name: "Trinidad e Tobago", code: "tt", flag: "https://flagcdn.com/w80/tt.png" },
  { name: "Tunísia", code: "tn", flag: "https://flagcdn.com/w80/tn.png" },
  { name: "Turquia", code: "tr", flag: "https://flagcdn.com/w80/tr.png" },
  { name: "Uruguai", code: "uy", flag: "https://flagcdn.com/w80/uy.png" },
  { name: "Venezuela", code: "ve", flag: "https://flagcdn.com/w80/ve.png" },
];

export const getTeamByName = (name: string) =>
  worldCupTeams.find((t) => t.name === name);
