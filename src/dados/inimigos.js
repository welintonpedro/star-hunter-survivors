// ============ INIMIGOS (RN-09 a RN-11) ============
// 10 inimigos por galáxia, cada um com desenho e comportamento próprios (src/comportamentos.js).
// Ajuste os números aqui sem mexer na lógica:
//   hp, speed, damage = vida, velocidade e dano base (a galáxia e o minuto multiplicam)
//   reward, xp = créditos e experiência ao morrer · radius = tamanho do corpo · scale = tamanho do desenho
//   peso = chance de ser sorteado · entra = segundo da partida em que começa a aparecer
//   comp = comportamento · cores = cor de cada letra do desenho

const INIMIGOS = {
  // galáxia 1
  g1_rastejador: { nome: 'Rastejador', comp: 'perseguidor', hp: 12, speed: 70, damage: 10, reward: 2, xp: 1, radius: 14, scale: 3, peso: 4, entra: 0, cores: { a: '#052e16', b: '#22c55e', c: '#fde047', d: '#15803d' } },
  g1_dardo: { nome: 'Dardo', comp: 'rapido', hp: 7, speed: 130, damage: 8, reward: 2, xp: 1, radius: 12, scale: 3, peso: 3, entra: 60, cores: { a: '#052e16', b: '#a3e635', c: '#ecfccb', d: '#4d7c0f', e: '#f97316' } },
  g1_casco: { nome: 'Casco', comp: 'tanque', hp: 50, speed: 45, damage: 18, reward: 6, xp: 3, radius: 20, scale: 4, peso: 1.5, entra: 180, cores: { a: '#042f2e', b: '#14b8a6', c: '#ccfbf1', d: '#0f766e' } },
  g1_cuspidor: { nome: 'Cuspidor', comp: 'atirador', hp: 16, speed: 65, damage: 8, reward: 4, xp: 2, radius: 14, scale: 3, peso: 1.5, entra: 360, cores: { a: '#1a2e05', b: '#65a30d', c: '#fef08a', d: '#3f6212', e: '#f43f5e' } },
  g1_bolha: { nome: 'Bolha Explosiva', comp: 'kamikaze', hp: 10, speed: 80, damage: 26, reward: 3, xp: 1, radius: 15, scale: 3, peso: 1.5, entra: 540, cores: { a: '#431407', b: '#fb923c', c: '#ffedd5', d: '#c2410c', e: '#fde047' } },
  g1_esporo: { nome: 'Esporo', comp: 'divisor', hp: 24, speed: 60, damage: 10, reward: 3, xp: 2, radius: 16, scale: 3, peso: 1.5, entra: 720, cores: { a: '#1a2e05', b: '#bef264', c: '#ffffff', d: '#65a30d' } },
  g1_vespa: { nome: 'Vespa', comp: 'enxame', hp: 4, speed: 115, damage: 6, reward: 1, xp: 1, radius: 10, scale: 2.5, peso: 1, entra: 900, grupo: 5, cores: { a: '#422006', b: '#facc15', c: '#e0f2fe', d: '#a16207', e: '#ef4444' } },
  g1_satelite: { nome: 'Satélite', comp: 'orbitador', hp: 18, speed: 110, damage: 12, reward: 4, xp: 2, radius: 14, scale: 3, peso: 1.2, entra: 1080, cores: { a: '#083344', b: '#2dd4bf', c: '#fde047', d: '#0e7490' } },
  g1_escudeiro: { nome: 'Escudeiro', comp: 'escudo', hp: 30, speed: 55, damage: 14, reward: 5, xp: 3, radius: 16, scale: 3, peso: 1, entra: 1260, cores: { a: '#052e16', b: '#16a34a', c: '#fde047', d: '#14532d', e: '#cbd5e1' } },
  g1_curandeiro: { nome: 'Curandeiro', comp: 'curador', hp: 20, speed: 60, damage: 6, reward: 6, xp: 3, radius: 14, scale: 3, peso: 0.6, entra: 1440, cores: { a: '#14532d', b: '#f0fdf4', c: '#86efac', d: '#bbf7d0', e: '#22c55e' } },
  // galáxia 2
  g2_zigue: { nome: 'Zigue', comp: 'ziguezague', hp: 14, speed: 95, damage: 10, reward: 2, xp: 1, radius: 13, scale: 3, peso: 4, entra: 0, cores: { a: '#450a0a', b: '#ef4444', c: '#fef08a', d: '#991b1b' } },
  g2_ariete: { nome: 'Aríete', comp: 'investida', hp: 22, speed: 70, damage: 20, reward: 3, xp: 2, radius: 15, scale: 3, peso: 2, entra: 60, cores: { a: '#450a0a', b: '#dc2626', c: '#fde68a', d: '#7f1d1d', e: '#fbbf24' } },
  g2_minador: { nome: 'Minador', comp: 'minador', hp: 20, speed: 60, damage: 10, reward: 4, xp: 2, radius: 15, scale: 3, peso: 1.2, entra: 180, cores: { a: '#3b0764', b: '#b91c1c', c: '#fecaca', d: '#fbbf24', e: '#f97316' } },
  g2_lanceiro: { nome: 'Lanceiro', comp: 'laser', hp: 18, speed: 60, damage: 30, reward: 5, xp: 2, radius: 13, scale: 3, peso: 1, entra: 360, cores: { a: '#450a0a', b: '#f43f5e', c: '#ffe4e6', d: '#9f1239', e: '#fde047' } },
  g2_piscante: { nome: 'Piscante', comp: 'teleporte', hp: 14, speed: 60, damage: 12, reward: 4, xp: 2, radius: 13, scale: 3, peso: 1.5, entra: 540, cores: { a: '#4a044e', b: '#e11d48', c: '#fda4af', d: '#881337' } },
  g2_matriarca: { nome: 'Matriarca', comp: 'invocador', hp: 45, speed: 40, damage: 14, reward: 8, xp: 4, radius: 18, scale: 3.5, peso: 0.6, entra: 720, cores: { a: '#450a0a', b: '#ea580c', c: '#fef3c7', d: '#9a3412', e: '#fde047' } },
  g2_gatuno: { nome: 'Gatuno', comp: 'ladrao', hp: 16, speed: 110, damage: 6, reward: 5, xp: 2, radius: 13, scale: 3, peso: 0.8, entra: 900, cores: { a: '#1c1917', b: '#b91c1c', c: '#fde047', d: '#7f1d1d', e: '#22d3ee' } },
  g2_leque: { nome: 'Leque', comp: 'leque', hp: 20, speed: 60, damage: 8, reward: 4, xp: 2, radius: 14, scale: 3, peso: 1, entra: 1080, cores: { a: '#431407', b: '#f97316', c: '#fef9c3', d: '#c2410c', e: '#ef4444' } },
  g2_couraca: { nome: 'Couraça', comp: 'regenerador', hp: 60, speed: 45, damage: 18, reward: 7, xp: 4, radius: 19, scale: 3.5, peso: 0.8, entra: 1260, cores: { a: '#292524', b: '#a8a29e', c: '#fef08a', d: '#57534e', e: '#ef4444' } },
  g2_ima: { nome: 'Ímã Vivo', comp: 'puxador', hp: 30, speed: 55, damage: 12, reward: 6, xp: 3, radius: 16, scale: 3, peso: 0.6, entra: 1440, cores: { a: '#450a0a', b: '#dc2626', c: '#e5e7eb', d: '#7f1d1d', e: '#93c5fd' } },
  // galáxia 3
  g3_espectro: { nome: 'Espectro', comp: 'fantasma', hp: 14, speed: 95, damage: 12, reward: 2, xp: 1, radius: 14, scale: 3, peso: 4, entra: 0, cores: { a: '#2e1065', b: '#a78bfa', c: '#f0abfc', d: '#6d28d9' } },
  g3_espiral: { nome: 'Espiral', comp: 'espiral', hp: 30, speed: 50, damage: 8, reward: 4, xp: 2, radius: 15, scale: 3, peso: 1.2, entra: 60, cores: { a: '#2e1065', b: '#c084fc', c: '#67e8f9', d: '#7e22ce' } },
  g3_estilhaco: { nome: 'Estilhaço', comp: 'estilhaco', hp: 16, speed: 85, damage: 10, reward: 3, xp: 2, radius: 14, scale: 3, peso: 2, entra: 180, cores: { a: '#3b0764', b: '#a855f7', c: '#67e8f9', d: '#6b21a8' } },
  g3_sanguessuga: { nome: 'Sanguessuga', comp: 'sanguessuga', hp: 18, speed: 80, damage: 10, reward: 4, xp: 2, radius: 13, scale: 3, peso: 1.5, entra: 360, cores: { a: '#2e1065', b: '#9333ea', c: '#f5d0fe', d: '#581c87', e: '#f43f5e' } },
  g3_relogio: { nome: 'Bomba-Relógio', comp: 'bomba', hp: 22, speed: 70, damage: 40, reward: 5, xp: 2, radius: 16, scale: 3, peso: 1, entra: 540, cores: { a: '#3b0764', b: '#c026d3', c: '#fdf4ff', d: '#86198f', e: '#f97316' } },
  g3_ricochete: { nome: 'Ricochete', comp: 'ricochete', hp: 14, speed: 170, damage: 12, reward: 4, xp: 2, radius: 15, scale: 3, peso: 1.5, entra: 720, cores: { a: '#1e1b4b', b: '#818cf8', c: '#67e8f9', d: '#4338ca' } },
  g3_nevoa: { nome: 'Névoa', comp: 'nevoa', hp: 40, speed: 45, damage: 12, reward: 6, xp: 3, radius: 17, scale: 3.5, peso: 0.8, entra: 900, cores: { a: '#2e1065', b: '#7c3aed', c: '#e0e7ff', d: '#4c1d95', e: '#e879f9' } },
  g3_clone: { nome: 'Clonador', comp: 'clonador', hp: 16, speed: 80, damage: 10, reward: 3, xp: 2, radius: 14, scale: 3, peso: 1, entra: 1080, cores: { a: '#3b0764', b: '#d946ef', c: '#fae8ff', d: '#a21caf' } },
  g3_sentinela: { nome: 'Sentinela', comp: 'sentinela', hp: 55, speed: 0, damage: 18, reward: 7, xp: 4, radius: 17, scale: 3.5, peso: 0.6, entra: 1260, cores: { a: '#1e1b4b', b: '#6366f1', c: '#67e8f9', d: '#312e81', e: '#f43f5e' } },
  g3_coral: { nome: 'Coral Vivo', comp: 'coral', hp: 25, speed: 50, damage: 14, reward: 5, xp: 3, radius: 15, scale: 3, peso: 1, entra: 1440, cores: { a: '#3b0764', b: '#e879f9', c: '#fef9c3', d: '#a21caf' } },
  // filhotes (só aparecem nascidos de outro inimigo)
  g1_esporinho: { nome: 'Esporinho', comp: 'perseguidor', hp: 8, speed: 95, damage: 6, reward: 1, xp: 1, radius: 9, scale: 3, peso: 0, entra: -1, cores: { a: '#1a2e05', b: '#bef264', c: '#ffffff', d: '#65a30d' } },
  g2_larva: { nome: 'Larva', comp: 'perseguidor', hp: 6, speed: 100, damage: 6, reward: 1, xp: 1, radius: 9, scale: 3, peso: 0, entra: -1, cores: { a: '#450a0a', b: '#fb923c', c: '#fef3c7', d: '#9a3412' } }
};

// Ordem de entrada de cada galáxia (índice da galáxia → lista de ids)
const INIMIGOS_POR_GALAXIA = [
  ['g1_rastejador', 'g1_dardo', 'g1_casco', 'g1_cuspidor', 'g1_bolha', 'g1_esporo', 'g1_vespa', 'g1_satelite', 'g1_escudeiro', 'g1_curandeiro'],
  ['g2_zigue', 'g2_ariete', 'g2_minador', 'g2_lanceiro', 'g2_piscante', 'g2_matriarca', 'g2_gatuno', 'g2_leque', 'g2_couraca', 'g2_ima'],
  ['g3_espectro', 'g3_espiral', 'g3_estilhaco', 'g3_sanguessuga', 'g3_relogio', 'g3_ricochete', 'g3_nevoa', 'g3_clone', 'g3_sentinela', 'g3_coral']
];

// Desenhos 12×12 (a = contorno, b = corpo, c = brilho/olhos, d = sombra, e = destaque)
const ARTE_INIMIGOS = {
  g1_rastejador: ['..a......a..', '...a....a...', '..abbbbbba..', '.abbbbbbbba.', 'abbcbbbbcbba', 'abbcbbbbcbba', 'abbbbbbbbbba', 'abdbbbbbbdba', '.abddbbddba.', '..abbbbbba..', '.a..a..a..a.', 'a..a....a..a'],
  g1_dardo: ['.....aa.....', '....abba....', '....abba....', '...abccba...', '...abccba...', '..abbbbbba..', '.abbddddbba.', 'abbd.aa.dbba', 'abd..ee..dba', 'aa...ee...aa', '.....ee.....', '............'],
  g1_casco: ['...aaaaaa...', '..abbbbbba..', '.abddbbddba.', 'abdddbbdddba', 'abbbbbbbbbba', 'abccbbbbccba', 'abccbbbbccba', 'abbbbbbbbbba', 'abdddbbdddba', '.abddbbddba.', '..abbbbbba..', '...aa..aa...'],
  g1_cuspidor: ['....aaaa....', '...abbbba...', '..abcbbcba..', '..abbbbbba..', '.aabbeebbaa.', 'abbbaeeabbba', 'abbbbaabbbba', '.abbbbbbbba.', '..abbddbba..', '...abddba...', '....abba....', '.....aa.....'],
  g1_bolha: ['.....ee.....', '.....e......', '....aaaa....', '..aabbbbaa..', '.abbcbbbbba.', '.abccbbbbba.', 'abbbbbbbbbba', 'abbbbbbbbbba', 'abbbbbbbdbba', '.abbbbbddba.', '..aabbbbaa..', '....aaaa....'],
  g1_esporo: ['..aaa..aaa..', '.abbbaabbba.', 'abcbbbbbcbba', 'abbbbddbbbba', 'abbbbddbbbba', '.abbbaabbba.', '.abbbaabbba.', 'abbbbddbbbba', 'abcbbddbcbba', 'abbbbbbbbbba', '.abbbaabbba.', '..aaa..aaa..'],
  g1_vespa: ['............', '..aa....aa..', '.acca..acca.', '.acca..acca.', '..aabbbbaa..', '...abeeba...', '...abbbba...', '...adddda...', '...abbbba...', '....adda....', '.....aa.....', '............'],
  g1_satelite: ['.....aa.....', '....acca....', '..a.abba.a..', '.aba.aa.aba.', 'abbbaaaabbba', 'abcbbbbbbcba', 'abcbbbbbbcba', 'abbbaaaabbba', '.aba.aa.aba.', '..a.abba.a..', '....adda....', '.....aa.....'],
  g1_escudeiro: ['eeeeeeeeeeee', 'eaaaaaaaaaae', '.abbbbbbbba.', '.abcbbbbcba.', '.abbbbbbbba.', '..abbddbba..', '..abbbbbba..', '...abddba...', '..ab.aa.ba..', '..a..aa..a..', '.a...aa...a.', '............'],
  g1_curandeiro: ['....aaaa....', '...abbbba...', '..abbeebba..', '..abeeeeba..', '..abbeebba..', '...abbbba...', '..aabbbbaa..', '.abbbccbbba.', '.abbccccbba.', '.abbbccbbba.', '..abbbbbba..', '...aa..aa...'],
  g1_esporinho: ['............', '............', '....aaaa....', '...abbbba...', '..abcbbcba..', '..abbddbba..', '..abbddbba..', '...abbbba...', '....aaaa....', '............', '............', '............'],
  g2_zigue: ['a..........a', 'ba........ab', '.ba......ab.', '.abaaaaaaba.', '..abbccbba..', '..abccccba..', '..abbccbba..', '.abaaaaaaba.', '.ba......ab.', 'ba........ab', 'a..........a', '............'],
  g2_ariete: ['....aaaa....', '...acccca...', '..abbbbbba..', '.abbbbbbbba.', 'abbdbbbbdbba', 'abbdbbbbdbba', 'abbbbbbbbbba', 'abbeeeeeebba', '.abbbbbbbba.', '..aabbbbaa..', '..aa....aa..', '.aa......aa.'],
  g2_minador: ['...aaaaaa...', '..abbbbbba..', '.abcbbbbcba.', '.abbbbbbbba.', 'aaaaaaaaaaaa', 'abdbdbdbdbda', 'aaaaaaaaaaaa', '....aeea....', '...aeeeea...', '....aeea....', '.....aa.....', '............'],
  g2_lanceiro: ['.....ee.....', '.....ee.....', '....aeea....', '....abba....', '...abccba...', '..abbccbba..', '.abbbbbbbba.', 'abbdbbbbdbba', 'abd.abba.dba', 'aa..abba..aa', '....adda....', '.....aa.....'],
  g2_piscante: ['.a........a.', '..a..aa..a..', '....abba....', '...abccba...', '.aabcccbbaa.', 'abbbccbbbbba', 'abbbbbbbbbba', '.aabbbbbbaa.', '...abddba...', '....abba....', '..a..aa..a..', '.a........a.'],
  g2_matriarca: ['..aa....aa..', '.abba..abba.', '.abbaaaabba.', '..abbbbbba..', '.abcbbbbcba.', 'abbbbddbbbba', 'abbbddddbbba', 'abbbbddbbbba', '.abeebbeeba.', '.aeea..aeea.', '..aa....aa..', '............'],
  g2_gatuno: ['............', '...aaaaaa...', '..abbbbbba..', '.aaaaaaaaaa.', '.acca..acca.', '.aaaaaaaaaa.', '..abbbbbba..', '..abdbbdba..', '.abbbbbbeea.', '.abbbbbbeea.', '..aa....aa..', '............'],
  g2_leque: ['a....aa....a', '.a..abba..a.', '..aabbbbaa..', '.abbcbbcbba.', 'abbbbbbbbbba', 'abdbbbbbbdba', '.abdbbbbdba.', '..abeeeeba..', '...abeeba...', '....aeea....', '.....aa.....', '............'],
  g2_couraca: ['.aa.aaaa.aa.', 'abbabbbbabba', 'abddbbbbddba', '.abbcbbcbba.', 'aabbbbbbbbaa', 'abdbbeebbdba', 'abdbbeebbdba', 'aabbbbbbbbaa', '.abbbbbbbba.', 'abddbbbbddba', 'abbabbbbabba', '.aa.aaaa.aa.'],
  g2_ima: ['.aaa....aaa.', 'abbba..abbba', 'abeba..abeba', 'abbba..abbba', 'abbbaaaabbba', '.abbbbbbbba.', '.abbccccbba.', '..abbbbbba..', '...abddba...', '....abba....', '.....aa.....', '............'],
  g2_larva: ['............', '............', '............', '...aaaaa....', '..abbbbba...', '.abcbbbbbaa.', '.abbbdbdbbba', '..aabbbbbaa.', '....aaaa....', '............', '............', '............'],
  g3_espectro: ['....aaaa....', '..aabbbbaa..', '.abbbbbbbba.', '.abccbbccba.', '.abccbbccba.', '.abbbbbbbba.', '.abbbddbbba.', '.abbbbbbbba.', '.abbbbbbbba.', '.ab.ab.ab.a.', '.a..a..a..a.', '............'],
  g3_espiral: ['.....aa.....', '...aabba....', '..abbbbba...', '.abbaaabba..', '.aba.cc.aba.', '.aba.cc.aba.', '..aba..abba.', '...abaabba..', '....abbba...', '.aa..aaa....', 'abba........', '.aa.........'],
  g3_estilhaco: ['.....a......', '....aba..a..', '.a.abcba.ab.', '.babcccbaba.', '..abcccccba.', '.abcccccccba', 'abcccccccba.', '.abcccccba..', '.ababcccba..', '..ba.abcba.a', '..a...aba...', '.......a....'],
  g3_sanguessuga: ['....aaaa....', '...abbbba...', '..abbbbbba..', '..abeeeeba..', '..aeaeeaea..', '...abbbba...', '...abbbba...', '...abddba...', '..abbddbba..', '..abbbbbba..', '...abbbba...', '....aaaa....'],
  g3_relogio: ['...aaaaaa...', '..abbbbbba..', '.abbbccbbba.', 'abbbbccbbbba', 'abbbbccbbbba', 'abbbbcccccba', 'abbbbbbbbbba', 'abbbbbbbbbba', '.abbbbbbbba.', '..abbbbbba..', '...aaaaaa...', '....aeea....'],
  g3_ricochete: ['a....aa....a', '.a..abba..a.', '..aabccbaa..', '..abccccba..', '.abccccccba.', 'abccccccccba', 'abccccccccba', '.abccccccba.', '..abccccba..', '..aabccbaa..', '.a..abba..a.', 'a....aa....a'],
  g3_nevoa: ['..e..ee..e..', '.e.aaaaaa.e.', '..abbbbbba..', '.abbcbbcbba.', 'eabbbbbbbbae', '.abbbddbbba.', '.abbddddbba.', 'eabbbddbbbae', '.abbbbbbbba.', '..abbbbbba..', '.e.aaaaaa.e.', '..e..ee..e..'],
  g3_clone: ['..aaaa.aaaa.', '.abbba.abbba', '.abcba.abcba', '.abbba.abbba', '.abdba.abdba', '.abbba.abbba', '..aaa...aaa.', '..abba.abba.', '...aa...aa..', '............', '............', '............'],
  g3_sentinela: ['.....aa.....', '....aeea....', '....aeea....', '...abbbba...', '..abccccba..', '.abbcddcbba.', 'abbbcddcbbba', '.abbccccbba.', '..abbbbbba..', '.aaaaaaaaaa.', 'abdbdbdbdbda', 'aaaaaaaaaaaa'],
  g3_coral: ['.a..a...a.a.', 'abaab..abab.', '.abba.abba..', '..abbabba.a.', '...abbbaab..', '..abcbbbba..', '.abbbbcbba..', '.abbbbbbba..', '..abbbbbba..', '...abddba...', '....abba....', '.....aa.....']
};

if (typeof module !== 'undefined') module.exports = { INIMIGOS, INIMIGOS_POR_GALAXIA, ARTE_INIMIGOS };
