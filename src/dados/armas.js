// ============ ARMAS ============
// stats(l) = atributos no nível l (1 a 5). evo = item passivo que faz o COMBO.
const WEAPONS = {
  pulsar: {
    name: 'Canhão Pulsar', abbr: 'CP', color: 0xfde047, hidden: false,
    evo: 'multi', evoName: 'Tempestade Estelar',
    desc: ['Atira no inimigo mais próximo', '+1 projétil', '+40% dano', '+1 perfuração', '+1 projétil e +30% dano'],
    stats: (l) => ({ cd: 0.55, dmg: 10 * (l >= 3 ? 1.4 : 1) * (l >= 5 ? 1.3 : 1), amount: 1 + (l >= 2 ? 1 : 0) + (l >= 5 ? 1 : 0), pierce: l >= 4 ? 1 : 0 }),
    evolve: (s) => { s.dmg *= 1.5; s.pierce += 2; s.ring = true; }
  },
  missiles: {
    name: 'Mísseis Teleguiados', abbr: 'MT', color: 0xf97316, hidden: false,
    evo: 'amp', evoName: 'Enxame Nuclear',
    desc: ['Mísseis que perseguem e explodem', '+1 míssil', '+30% área da explosão', '+40% dano', '+1 míssil e -20% recarga'],
    stats: (l) => ({ cd: 1.6 * (l >= 5 ? 0.8 : 1), dmg: 16 * (l >= 4 ? 1.4 : 1), amount: 1 + (l >= 2 ? 1 : 0) + (l >= 5 ? 1 : 0), radius: 55 * (l >= 3 ? 1.3 : 1) }),
    evolve: (s) => { s.amount += 3; s.radius *= 1.6; s.dmg *= 1.5; s.cd *= 0.8; }
  },
  orbital: {
    name: 'Anel Orbital', abbr: 'AO', color: 0x38bdf8, hidden: false,
    evo: 'cooler', evoName: 'Halo Eterno',
    desc: ['Esferas giram ao seu redor', '+1 esfera', '+40% dano', '+25% raio da órbita', '+1 esfera e giro mais rápido'],
    stats: (l) => ({ cd: 0, dmg: 8 * (l >= 3 ? 1.4 : 1), amount: 2 + (l >= 2 ? 1 : 0) + (l >= 5 ? 1 : 0), radius: 72 * (l >= 4 ? 1.25 : 1), spin: 3 * (l >= 5 ? 1.4 : 1), size: 1 }),
    evolve: (s) => { s.amount += 2; s.dmg *= 2; s.radius *= 1.2; s.size = 1.6; s.knock = true; }
  },
  shock: {
    name: 'Onda de Choque', abbr: 'OC', color: 0xa78bfa, hidden: false,
    evo: 'armor', evoName: 'Aura Vampírica',
    desc: ['Pulso que fere e empurra ao redor', '+20% raio', '+40% dano', '-20% recarga', '+20% raio e +30% dano'],
    stats: (l) => ({ cd: 2.6 * (l >= 4 ? 0.8 : 1), dmg: 12 * (l >= 3 ? 1.4 : 1) * (l >= 5 ? 1.3 : 1), radius: 110 * (l >= 2 ? 1.2 : 1) * (l >= 5 ? 1.2 : 1) }),
    evolve: (s) => { s.cd *= 0.5; s.radius *= 1.4; s.heal = true; }
  },
  chain: {
    name: 'Raio em Cadeia', abbr: 'RC', color: 0x67e8f9, hidden: true,
    evo: 'core', evoName: 'Tempestade Elétrica',
    desc: ['Raio que salta entre inimigos', '+2 saltos', '+40% dano', '+1 raio extra', '+2 saltos e -20% recarga'],
    stats: (l) => ({ cd: 1.5 * (l >= 5 ? 0.8 : 1), dmg: 15 * (l >= 3 ? 1.4 : 1), jumps: 3 + (l >= 2 ? 2 : 0) + (l >= 5 ? 2 : 0), amount: 1 + (l >= 4 ? 1 : 0) }),
    evolve: (s) => { s.amount += 2; s.jumps += 3; s.dmg *= 1.5; }
  },
  disc: {
    name: 'Disco Serra', abbr: 'DS', color: 0xe5e7eb, hidden: true,
    evo: 'magnet', evoName: 'Vórtice Serrilhado',
    desc: ['Disco que vai e volta cortando tudo', '+1 disco', '+40% dano', '+30% tamanho', '+1 disco e -20% recarga'],
    stats: (l) => ({ cd: 1.8 * (l >= 5 ? 0.8 : 1), dmg: 14 * (l >= 3 ? 1.4 : 1), amount: 1 + (l >= 2 ? 1 : 0) + (l >= 5 ? 1 : 0), size: l >= 4 ? 1.3 : 1, range: 320 }),
    evolve: (s) => { s.amount += 2; s.size *= 1.5; s.dmg *= 1.6; s.range *= 1.3; s.pull = true; }
  }
};

// ============ ITENS PASSIVOS ============
const PASSIVES = {
  core:   { name: 'Núcleo de Energia', abbr: 'NE', color: 0xef4444, desc: '+10% dano em tudo', max: 5 },
  cooler: { name: 'Refrigerador',      abbr: 'RF', color: 0x60a5fa, desc: '-8% recarga das armas', max: 5 },
  amp:    { name: 'Amplificador',      abbr: 'AM', color: 0xc084fc, desc: '+10% área', max: 5 },
  multi:  { name: 'Multiplicador',     abbr: 'MU', color: 0xfacc15, desc: '+1 projétil em todas as armas', max: 2 },
  armor:  { name: 'Blindagem',         abbr: 'BL', color: 0x94a3b8, desc: '+20% vida máxima', max: 5 },
  magnet: { name: 'Ímã',               abbr: 'IM', color: 0x22d3ee, desc: '+30% alcance de coleta', max: 5 },
  engine: { name: 'Motor Iônico',      abbr: 'MI', color: 0x4ade80, desc: '+10% velocidade da nave', max: 5 },
  regen:  { name: 'Nanorreparo',       abbr: 'NR', color: 0xf472b6, desc: '+0,5 de vida por segundo', max: 5 }
};
function comboWeaponFor(pid) { return Object.keys(WEAPONS).find((k) => WEAPONS[k].evo === pid); }

