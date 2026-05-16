export interface WorldCupTeam {
  name: string;
  code: string;
  flag: string;
}

export const worldCupTeams: WorldCupTeam[] = [
  // Grupo A
  { name: "México", code: "mx", flag: "https://flagcdn.com/w80/mx.png" },
  { name: "África do Sul", code: "za", flag: "https://flagcdn.com/w80/za.png" },
  { name: "República da Coreia", code: "kr", flag: "https://flagcdn.com/w80/kr.png" },
  { name: "República Tcheca", code: "cz", flag: "https://flagcdn.com/w80/cz.png" },
  // Grupo B
  { name: "Canadá", code: "ca", flag: "https://flagcdn.com/w80/ca.png" },
  { name: "Bósnia e Herzegovina", code: "ba", flag: "https://flagcdn.com/w80/ba.png" },
  { name: "Catar", code: "qa", flag: "https://flagcdn.com/w80/qa.png" },
  { name: "Suíça", code: "ch", flag: "https://flagcdn.com/w80/ch.png" },
  // Grupo C
  { name: "Brasil", code: "br", flag: "https://flagcdn.com/w80/br.png" },
  { name: "Marrocos", code: "ma", flag: "https://flagcdn.com/w80/ma.png" },
  { name: "Haiti", code: "ht", flag: "https://flagcdn.com/w80/ht.png" },
  { name: "Escócia", code: "gb-sct", flag: "https://flagcdn.com/w80/gb-sct.png" },
  // Grupo D
  { name: "Estados Unidos", code: "us", flag: "https://flagcdn.com/w80/us.png" },
  { name: "Paraguai", code: "py", flag: "https://flagcdn.com/w80/py.png" },
  { name: "Austrália", code: "au", flag: "https://flagcdn.com/w80/au.png" },
  { name: "Turquia", code: "tr", flag: "https://flagcdn.com/w80/tr.png" },
  // Grupo E
  { name: "Alemanha", code: "de", flag: "https://flagcdn.com/w80/de.png" },
  { name: "Curaçau", code: "cw", flag: "https://flagcdn.com/w80/cw.png" },
  { name: "Costa do Marfim", code: "ci", flag: "https://flagcdn.com/w80/ci.png" },
  { name: "Equador", code: "ec", flag: "https://flagcdn.com/w80/ec.png" },
  // Grupo F
  { name: "Holanda", code: "nl", flag: "https://flagcdn.com/w80/nl.png" },
  { name: "Japão", code: "jp", flag: "https://flagcdn.com/w80/jp.png" },
  { name: "Suécia", code: "se", flag: "https://flagcdn.com/w80/se.png" },
  { name: "Tunísia", code: "tn", flag: "https://flagcdn.com/w80/tn.png" },
  // Grupo G
  { name: "Bélgica", code: "be", flag: "https://flagcdn.com/w80/be.png" },
  { name: "Egito", code: "eg", flag: "https://flagcdn.com/w80/eg.png" },
  { name: "Irã", code: "ir", flag: "https://flagcdn.com/w80/ir.png" },
  { name: "Nova Zelândia", code: "nz", flag: "https://flagcdn.com/w80/nz.png" },
  // Grupo H
  { name: "Espanha", code: "es", flag: "https://flagcdn.com/w80/es.png" },
  { name: "Cabo Verde", code: "cv", flag: "https://flagcdn.com/w80/cv.png" },
  { name: "Arábia Saudita", code: "sa", flag: "https://flagcdn.com/w80/sa.png" },
  { name: "Uruguai", code: "uy", flag: "https://flagcdn.com/w80/uy.png" },
  // Grupo I
  { name: "França", code: "fr", flag: "https://flagcdn.com/w80/fr.png" },
  { name: "Senegal", code: "sn", flag: "https://flagcdn.com/w80/sn.png" },
  { name: "Iraque", code: "iq", flag: "https://flagcdn.com/w80/iq.png" },
  { name: "Noruega", code: "no", flag: "https://flagcdn.com/w80/no.png" },
  // Grupo J
  { name: "Argentina", code: "ar", flag: "https://flagcdn.com/w80/ar.png" },
  { name: "Argélia", code: "dz", flag: "https://flagcdn.com/w80/dz.png" },
  { name: "Áustria", code: "at", flag: "https://flagcdn.com/w80/at.png" },
  { name: "Jordânia", code: "jo", flag: "https://flagcdn.com/w80/jo.png" },
  // Grupo K
  { name: "Portugal", code: "pt", flag: "https://flagcdn.com/w80/pt.png" },
  { name: "República Democrática do Congo", code: "cd", flag: "https://flagcdn.com/w80/cd.png" },
  { name: "Uzbequistão", code: "uz", flag: "https://flagcdn.com/w80/uz.png" },
  { name: "Colômbia", code: "co", flag: "https://flagcdn.com/w80/co.png" },
  // Grupo L
  { name: "Inglaterra", code: "gb-eng", flag: "https://flagcdn.com/w80/gb-eng.png" },
  { name: "Croácia", code: "hr", flag: "https://flagcdn.com/w80/hr.png" },
  { name: "Gana", code: "gh", flag: "https://flagcdn.com/w80/gh.png" },
  { name: "Panamá", code: "pa", flag: "https://flagcdn.com/w80/pa.png" },
];

export const getTeamByName = (name: string) =>
  worldCupTeams.find((t) => t.name === name);
