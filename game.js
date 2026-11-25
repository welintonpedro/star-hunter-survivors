// =====================================================
// STAR HUNTER SURVIVORS — Protótipo v0.2
// Navinha estilo "Vampire Survivors" + idle (progresso offline)
// Novidades v0.2: mapa grande com locais únicos, minimapa, meteoros
// que quebram e soltam itens, subchefes, 6 armas (2 escondidas),
// 8 itens passivos e COMBOS (evoluções) ao abrir baús.
// Toda a arte é gerada por código: não precisa de assets externos.
// Controles: WASD/setas ou arrastar | ESPAÇO = automático | 1/2/3 = escolher
// =====================================================

const W = 960, H = 540;
const WORLD = 6000;              // tamanho do mapa de cada galáxia
const SAVE_KEY = 'star_hunter_survivors_save_v1';
const BOSS_TIME = 240;           // chefe aos 4 minutos
const ELITE_EVERY = 60;          // subchefe a cada minuto
const SWARM_EVERY = 50;          // enxame atravessando a tela
const RING_EVERY = 40;           // cerco em anel
const OFFLINE_CAP_HOURS = 8;
const OFFLINE_EFFICIENCY = 0.3;
const AUTO_REWARD_MULT = 0.6;
const MAX_ENEMIES = 200;
const MAX_WEAPONS = 4, MAX_PASSIVES = 4, MAX_WEAPON_LEVEL = 5;
const ROCK_COUNT = 140;

// ============ PIXEL ART (cada letra = 1 pixel, "." = transparente) ============
const ART = {
  ship1: ['.......aa.......', '......abba......', '......abba......', '.....abccba.....', '.....abccba.....', '....aabbbbaa....', '...aabbbbbbaa...', '..aabbddddbbaa..', '.aabbbddddbbbaa.', 'aabbbbbbbbbbbbaa', 'abbaabbbbbbaabba', 'ab..aabbbbaa..ba', 'a....aeeeea....a', '......e..e......', '................', '................'],
  ship2: ['................', '.......aa.......', '......abba......', '.a....abba....a.', '.ba..abccba..ab.', '.bba.abccba.abb.', '.bbbabbbbbbabbb.', '.bbbbbddddbbbbb.', '.bbbbbddddbbbbb.', '.abbbbbbbbbbbba.', '..abbbbbbbbbba..', '...aabbbbbbaa...', '....a.eeee.a....', '......e..e......', '................', '................'],
  ship3: ['.......aa.......', '.......bb.......', '......abba......', '......abba......', '.....abccba.....', '.....abccba.....', '....abbddbba....', '...abbbddbbba...', '..abbbbbbbbbba..', '.abbaabbbbaabba.', 'abba..abba..abba', 'aba...abba...aba', 'aa....aeea....aa', '.......ee.......', '................', '................'],
  bug: ['..a......a..', '...a....a...', '..abbbbbba..', '.abbbbbbbba.', 'abbcbbbbcbba', 'abbcbbbbcbba', 'abbbbbbbbbba', '.abbbbbbbba.', '..ab.ab.ba..', '.ab..ab..ba.', '.a...a....a.', '............'],
  saucer: ['....aaaa....', '...acccca...', '..acccccca..', 'aaaaaaaaaaaa', 'abbdbbdbbdba', 'abbbbbbbbbba', '.aaaaaaaaaa.', '..a..a.a..a.'],
  diamond: ['.....a.....', '....aba....', '...abcba...', '..abcccba..', '.abcccccba.', 'abcccccccba', '.abcccccba.', '..abcccba..', '...abcba...', '....aba....', '.....a.....'],
  rock: ['....aaaa....', '..aabbbbaa..', '.abbbcbbbba.', '.abcbbbbcba.', 'abbbbbbbbbba', 'abbcbbbbbbba', 'abbbbbbcbbba', 'abbbbbbbbbba', '.abcbbbbbba.', '.abbbbbcbba.', '..aabbbbaa..', '....aaaa....'],
  chest: ['.aaaaaaaa.', 'abbbbbbbba', 'abbbccbbba', 'aaaaccaaaa', 'abbbbbbbba', 'abbbbbbbba', 'abbbbbbbba', 'aaaaaaaaaa'],
  heal: ['..aaaa..', '..abba..', 'aaabbaaa', 'abbbbbba', 'abbbbbba', 'aaabbaaa', '..abba..', '..aaaa..'],
  coin: ['...aa...', '..abba..', '.abbbba.', 'abbccbba', 'abbccbba', 'abbbbbba', '.abbbba.', '..aaaa..'],
  magnet: ['cc....cc', 'ab....ba', 'ab....ba', 'ab....ba', 'abb..bba', '.abbbba.', '..aaaa..', '........'],
  bomb: ['.....c..', '....c...', '..aaaa..', '.abbbba.', 'abbcbbba', 'abbbbbba', '.abbbba.', '..aaaa..'],
  wbox: ['..aaaa..', '.abccba.', 'abccccba', 'acccccca', 'acccccca', 'abccccba', '.abccba.', '..aaaa..']
};

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

// ============ NAVES ============
const SHIPS = [
  { id: 'falcao', name: 'Falcão', art: 'ship1', galaxy: 0, cost: 0, hp: 100, speed: 210, dmgMult: 1, cdMult: 1, start: 'pulsar',
    palette: { a: '#0b1a33', b: '#3b82f6', c: '#a5f3fc', d: '#1d4ed8', e: '#f97316' }, desc: 'Equilibrada. Boa para começar.' },
  { id: 'tita', name: 'Titã', art: 'ship2', galaxy: 1, cost: 400, hp: 170, speed: 175, dmgMult: 1.25, cdMult: 1.1, start: 'missiles',
    palette: { a: '#2a0f0f', b: '#f59e0b', c: '#fef3c7', d: '#b45309', e: '#ef4444' }, desc: 'Lenta e resistente. Dano alto.' },
  { id: 'agulha', name: 'Agulha', art: 'ship3', galaxy: 2, cost: 1500, hp: 75, speed: 250, dmgMult: 0.85, cdMult: 0.7, start: 'orbital',
    palette: { a: '#1a0b2e', b: '#e5e7eb', c: '#f0abfc', d: '#a855f7', e: '#22d3ee' }, desc: 'Frágil e veloz. Recarga rápida.' }
];

// ============ GALÁXIAS ============
const GALAXIES = [
  { name: 'Nebulosa Esmeralda', bg: '#04140d', starTint: 0x86efac, hpMult: 1, speedMult: 1, rewardMult: 1,
    alien: { a: '#052e16', b: '#22c55e', c: '#fde047', d: '#15803d' }, planet: ['#0e7490', '#22d3ee'],
    planetNames: ['Kepler-7', 'Vesta Prime'], relic: 'Coroa Estelar' },
  { name: 'Cinturão Rubro', bg: '#170507', starTint: 0xfca5a5, hpMult: 2.4, speedMult: 1.12, rewardMult: 3,
    alien: { a: '#450a0a', b: '#ef4444', c: '#fef08a', d: '#991b1b' }, planet: ['#9a3412', '#fb923c'],
    planetNames: ['Ignis', 'Magmara'], relic: 'Olho de Rubi' },
  { name: 'Abismo Violeta', bg: '#0d0518', starTint: 0xd8b4fe, hpMult: 5.5, speedMult: 1.25, rewardMult: 8,
    alien: { a: '#2e1065', b: '#a855f7', c: '#67e8f9', d: '#6b21a8' }, planet: ['#4c1d95', '#e879f9'],
    planetNames: ['Nyx', 'Umbra-9'], relic: 'Prisma do Vazio' }
];

const ENEMY_TYPES = {
  bug:     { scale: 3, hp: 12, speed: 70,  damage: 10, reward: 2, xp: 1, radius: 14 },
  diamond: { scale: 3, hp: 7,  speed: 125, damage: 8,  reward: 2, xp: 1, radius: 12 },
  saucer:  { scale: 4, hp: 45, speed: 48,  damage: 18, reward: 6, xp: 3, radius: 20 }
};

const META_UPGRADES = [
  { id: 'dmg',    name: 'Canhões',          desc: '+10% dano',           base: 60 },
  { id: 'hp',     name: 'Blindagem',        desc: '+10% vida',           base: 60 },
  { id: 'rate',   name: 'Refrigeração',     desc: '+6% cadência',        base: 80 },
  { id: 'magnet', name: 'Ímã',              desc: '+15% alcance coleta', base: 50 },
  { id: 'idle',   name: 'Drones de Coleta', desc: '+25% ganho offline',  base: 120 }
];
function metaCost(u, lvl) { return Math.floor(u.base * Math.pow(1.6, lvl)); }

// ============ SAVE ============
function defaultSave() {
  return { credits: 0, owned: { falcao: true }, cleared: [false, false, false],
    meta: { dmg: 0, hp: 0, rate: 0, magnet: 0, idle: 0 }, bestRate: [0, 0, 0], lastSeen: Date.now() };
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw), d = defaultSave();
      return Object.assign(d, s, { meta: Object.assign(d.meta, s.meta || {}) });
    }
  } catch (e) { /* sem localStorage */ }
  return defaultSave();
}
function writeSave(s) {
  s.lastSeen = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* ignora */ }
}
let SAVE = loadSave();
window.addEventListener('beforeunload', () => writeSave(SAVE));

function idleRatePerMin() {
  let rate = 0;
  SHIPS.forEach((sh) => { if (SAVE.owned[sh.id]) rate += SAVE.bestRate[sh.galaxy] || 0; });
  return rate * OFFLINE_EFFICIENCY * (1 + SAVE.meta.idle * 0.25);
}
function computeOffline() {
  const now = Date.now();
  const mins = Math.min(OFFLINE_CAP_HOURS * 60, Math.max(0, (now - (SAVE.lastSeen || now)) / 60000));
  if (mins < 1) return { mins: 0, credits: 0 };
  return { mins, credits: Math.floor(idleRatePerMin() * mins) };
}

// ============ UTILITÁRIOS ============
function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1) + 'k';
  return String(n);
}
function fmtTime(sec) { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return m + ':' + (s < 10 ? '0' : '') + s; }
function hexToInt(hex) { return parseInt(hex.replace('#', ''), 16); }
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

// Locais únicos de cada galáxia: sempre nas mesmas posições (semente fixa)
function genPOIs(gi) {
  const rnd = mulberry32(1234 + gi * 977);
  const gal = GALAXIES[gi];
  const hidden = Object.keys(WEAPONS).filter((k) => WEAPONS[k].hidden);
  if (rnd() < 0.5) hidden.reverse();
  const list = [
    { type: 'planet', name: 'Planeta ' + gal.planetNames[0], weapon: hidden[0] },
    { type: 'planet', name: 'Planeta ' + gal.planetNames[1], weapon: hidden[1] },
    { type: 'station', name: 'Estação de Reparo' },
    { type: 'nest', name: 'Ninho Alienígena' },
    { type: 'nest', name: 'Ninho Alienígena' },
    { type: 'blackhole', name: 'Buraco Negro' },
    { type: 'relic', name: gal.relic }
  ];
  const c = WORLD / 2;
  list.forEach((p) => {
    for (let tries = 0; tries < 200; tries++) {
      const x = 500 + rnd() * (WORLD - 1000), y = 500 + rnd() * (WORLD - 1000);
      if (Math.hypot(x - c, y - c) < 900) continue;
      if (list.some((o) => o !== p && o.x !== undefined && Math.hypot(o.x - x, o.y - y) < 1000)) continue;
      p.x = x; p.y = y; break;
    }
    if (p.x === undefined) { p.x = 600 + rnd() * (WORLD - 1200); p.y = 600 + rnd() * (WORLD - 1200); }
  });
  return list;
}

// ============ GERADORES DE TEXTURA ============
function pixelTexture(scene, key, rows, palette, scale) {
  const h = rows.length, w = rows[0].length;
  const tex = scene.textures.createCanvas(key, w * scale, h * scale);
  const ctx = tex.getContext();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.' || !palette[ch]) continue;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  tex.refresh();
}
function gfxTexture(scene, key, w, h, draw) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}
function bossTexture(scene, key, gal) {
  const a = hexToInt(gal.alien.a), b = hexToInt(gal.alien.b), c = hexToInt(gal.alien.c), d = hexToInt(gal.alien.d);
  gfxTexture(scene, key, 112, 112, (g) => {
    g.fillStyle(a); g.fillCircle(56, 56, 54);
    g.fillStyle(b); g.fillCircle(56, 56, 48);
    g.fillStyle(d);
    for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; g.fillCircle(56 + Math.cos(an) * 38, 56 + Math.sin(an) * 38, 7); }
    g.fillStyle(0xffffff); g.fillCircle(56, 56, 20);
    g.fillStyle(c); g.fillCircle(56, 56, 13);
    g.fillStyle(0x000000); g.fillCircle(56, 56, 6);
  });
}
function planetTexture(scene, key, cols) {
  const a = hexToInt(cols[0]), b = hexToInt(cols[1]);
  gfxTexture(scene, key, 200, 200, (g) => {
    g.lineStyle(6, b, 0.5); g.strokeEllipse(100, 100, 196, 60);
    g.fillStyle(a); g.fillCircle(100, 100, 70);
    g.fillStyle(b, 0.5); g.fillCircle(80, 80, 45);
    g.fillStyle(b, 0.35); g.fillEllipse(100, 115, 120, 18);
    g.fillStyle(0xffffff, 0.25); g.fillCircle(72, 70, 14);
  });
}
function starTexture(scene, key, size, count, maxR) {
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.7).toFixed(2) + ')';
    const r = 1 + Math.floor(Math.random() * maxR);
    ctx.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * size), r, r);
  }
  tex.refresh();
}
function nebulaTexture(scene, key) {
  const tex = scene.textures.createCanvas(key, 256, 256);
  const ctx = tex.getContext();
  const grd = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256);
  tex.refresh();
}

// ============ BOTÃO SIMPLES ============
function makeButton(scene, x, y, w, h, label, onClick, opts) {
  opts = opts || {};
  const bg = scene.add.rectangle(x, y, w, h, opts.color !== undefined ? opts.color : 0x1e3a8a)
    .setStrokeStyle(2, opts.stroke !== undefined ? opts.stroke : 0x60a5fa);
  const txt = scene.add.text(x, y, label, {
    fontFamily: 'Arial', fontSize: (opts.size || 16) + 'px', color: opts.textColor || '#ffffff', align: 'center',
    wordWrap: opts.wrap ? { width: w - 16 } : undefined
  }).setOrigin(0.5);
  if (opts.disabled) {
    bg.setFillStyle(0x27272a).setStrokeStyle(2, 0x52525b);
    txt.setColor('#71717a');
  } else {
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setAlpha(0.8));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', () => onClick());
  }
  if (opts.fixed) { bg.setScrollFactor(0); txt.setScrollFactor(0); }
  if (opts.depth !== undefined) { bg.setDepth(opts.depth); txt.setDepth(opts.depth + 1); }
  return { bg, txt, setLabel(t) { txt.setText(t); }, destroy() { bg.destroy(); txt.destroy(); } };
}

// =====================================================
// CENA 1: BOOT
// =====================================================
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    SHIPS.forEach((s) => pixelTexture(this, 'ship_' + s.id, ART[s.art], s.palette, 3));
    GALAXIES.forEach((g, i) => {
      pixelTexture(this, 'bug_' + i, ART.bug, g.alien, ENEMY_TYPES.bug.scale);
      pixelTexture(this, 'diamond_' + i, ART.diamond, g.alien, ENEMY_TYPES.diamond.scale);
      pixelTexture(this, 'saucer_' + i, ART.saucer, g.alien, ENEMY_TYPES.saucer.scale);
      bossTexture(this, 'boss_' + i, g);
      planetTexture(this, 'planet_' + i, g.planet);
      gfxTexture(this, 'nest_' + i, 120, 120, (gr) => {
        const a = hexToInt(g.alien.a), b = hexToInt(g.alien.b), d = hexToInt(g.alien.d);
        gr.fillStyle(a); gr.fillCircle(60, 60, 56);
        gr.fillStyle(d); gr.fillCircle(45, 50, 30); gr.fillCircle(75, 70, 28); gr.fillCircle(62, 38, 22);
        gr.fillStyle(b);
        [[40, 45], [70, 65], [60, 35], [50, 80], [80, 45]].forEach((p) => gr.fillEllipse(p[0], p[1], 14, 18));
      });
    });
    pixelTexture(this, 'rock', ART.rock, { a: '#3f3f46', b: '#78716c', c: '#57534e' }, 4);
    pixelTexture(this, 'crystal', ART.rock, { a: '#164e63', b: '#22d3ee', c: '#a5f3fc' }, 4);
    pixelTexture(this, 'chest', ART.chest, { a: '#78350f', b: '#f59e0b', c: '#fef08a' }, 3);
    pixelTexture(this, 'heal', ART.heal, { a: '#7f1d1d', b: '#ef4444' }, 3);
    pixelTexture(this, 'coin', ART.coin, { a: '#713f12', b: '#facc15', c: '#fef9c3' }, 3);
    pixelTexture(this, 'magnetItem', ART.magnet, { a: '#1e3a8a', b: '#3b82f6', c: '#e5e7eb' }, 3);
    pixelTexture(this, 'bomb', ART.bomb, { a: '#111827', b: '#374151', c: '#f97316' }, 3);
    pixelTexture(this, 'wbox', ART.wbox, { a: '#581c87', b: '#c084fc', c: '#f5d0fe' }, 4);
    gfxTexture(this, 'bullet', 10, 10, (g) => { g.fillStyle(0xfde047); g.fillCircle(5, 5, 4); g.fillStyle(0xffffff); g.fillCircle(5, 5, 2); });
    gfxTexture(this, 'ebullet', 12, 12, (g) => { g.fillStyle(0xf43f5e); g.fillCircle(6, 6, 5); g.fillStyle(0xffe4e6); g.fillCircle(6, 6, 2); });
    gfxTexture(this, 'gem', 10, 10, (g) => { g.fillStyle(0x22d3ee); g.fillTriangle(5, 0, 10, 5, 5, 10); g.fillTriangle(5, 0, 0, 5, 5, 10); });
    gfxTexture(this, 'orb', 16, 16, (g) => { g.fillStyle(0x38bdf8, 0.5); g.fillCircle(8, 8, 8); g.fillStyle(0xe0f2fe); g.fillCircle(8, 8, 4); });
    gfxTexture(this, 'spark', 4, 4, (g) => { g.fillStyle(0xffffff); g.fillRect(0, 0, 4, 4); });
    gfxTexture(this, 'missile', 8, 16, (g) => {
      g.fillStyle(0xe5e7eb); g.fillRect(2, 4, 4, 9);
      g.fillStyle(0xef4444); g.fillTriangle(2, 4, 6, 4, 4, 0);
      g.fillStyle(0xf97316); g.fillRect(3, 13, 2, 3);
    });
    gfxTexture(this, 'disc', 26, 26, (g) => {
      g.fillStyle(0x9ca3af); g.fillCircle(13, 13, 12);
      g.fillStyle(0xe5e7eb); g.fillCircle(13, 13, 9);
      g.fillStyle(0x374151); g.fillCircle(13, 13, 4);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.fillCircle(13 + Math.cos(a) * 12, 13 + Math.sin(a) * 12, 2); }
    });
    gfxTexture(this, 'station', 96, 96, (g) => {
      g.fillStyle(0x475569); g.fillRect(8, 42, 80, 12); g.fillRect(42, 8, 12, 80);
      g.fillStyle(0x94a3b8); g.fillCircle(48, 48, 20);
      g.fillStyle(0x22c55e); g.fillRect(44, 36, 8, 24); g.fillRect(36, 44, 24, 8);
      g.fillStyle(0x38bdf8); [[10, 48], [86, 48], [48, 10], [48, 86]].forEach((p) => g.fillCircle(p[0], p[1], 5));
    });
    gfxTexture(this, 'blackhole', 240, 240, (g) => {
      g.fillStyle(0x7c3aed, 0.12); g.fillCircle(120, 120, 118);
      g.fillStyle(0x7c3aed, 0.2); g.fillCircle(120, 120, 90);
      g.lineStyle(4, 0xc4b5fd, 0.6);
      for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(120, 120, 50 + i * 15, i, i + 2.2); g.strokePath(); }
      g.fillStyle(0x000000); g.fillCircle(120, 120, 40);
      g.lineStyle(3, 0xf5d0fe, 0.9); g.strokeCircle(120, 120, 42);
    });
    gfxTexture(this, 'relic', 48, 48, (g) => {
      const pts = [];
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 22, a = -Math.PI / 2 + i * Math.PI / 5; pts.push({ x: 24 + Math.cos(a) * r, y: 24 + Math.sin(a) * r }); }
      g.fillStyle(0xfacc15); g.fillPoints(pts, true);
      g.fillStyle(0xfef9c3); g.fillCircle(24, 24, 6);
    });
    starTexture(this, 'stars_far', 256, 70, 1);
    starTexture(this, 'stars_near', 256, 22, 2);
    nebulaTexture(this, 'nebula');

    const off = computeOffline();
    if (off.credits > 0) SAVE.credits += off.credits;
    writeSave(SAVE);
    this.registry.set('offline', off);
    this.scene.start('Hangar');
  }
}

// =====================================================
// CENA 2: HANGAR
// =====================================================
class HangarScene extends Phaser.Scene {
  constructor() { super('Hangar'); }
  create() {
    this.cameras.main.setBackgroundColor('#070b1a');
    this.stars = this.add.tileSprite(0, 0, W, H, 'stars_far').setOrigin(0).setAlpha(0.6);
    this.items = [];
    this.build();
    const off = this.registry.get('offline');
    if (off && off.credits > 0) { this.registry.set('offline', null); this.showOffline(off); }
    this.time.addEvent({ delay: 10000, loop: true, callback: () => writeSave(SAVE) });
  }
  update(t, dt) { this.stars.tilePositionY -= dt * 0.01; }
  keep(o) { this.items.push(o); return o; }
  build() {
    this.items.forEach((i) => i.destroy());
    this.items = [];
    this.keep(this.add.text(W / 2, 34, 'STAR HUNTER SURVIVORS', {
      fontFamily: 'Arial Black, Arial', fontSize: '34px', color: '#fde047', stroke: '#7c2d12', strokeThickness: 6
    }).setOrigin(0.5));
    this.keep(this.add.text(W / 2, 74, 'Créditos: ' + fmt(SAVE.credits), { fontFamily: 'Arial', fontSize: '20px', color: '#a5f3fc' }).setOrigin(0.5));

    SHIPS.forEach((s, i) => {
      const x = 230 + i * 250, y = 225;
      const owned = !!SAVE.owned[s.id];
      const gal = GALAXIES[s.galaxy];
      const prevCleared = s.galaxy === 0 || SAVE.cleared[s.galaxy - 1];
      this.keep(this.add.rectangle(x, y, 225, 245, 0x0f172a, 0.92).setStrokeStyle(2, owned ? 0x60a5fa : 0x334155));
      const spr = this.keep(this.add.image(x, y - 78, 'ship_' + s.id).setScale(1.2));
      if (!owned) spr.setTint(0x475569);
      this.keep(this.add.text(x, y - 28, s.name, { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
      this.keep(this.add.text(x, y - 6, gal.name + (SAVE.cleared[s.galaxy] ? '  (conquistada)' : ''), {
        fontFamily: 'Arial', fontSize: '12px', color: SAVE.cleared[s.galaxy] ? '#86efac' : '#94a3b8'
      }).setOrigin(0.5));
      this.keep(this.add.text(x, y + 24, 'Vida ' + s.hp + '   Vel ' + s.speed + '\nDano x' + s.dmgMult + '   Recarga x' + s.cdMult + '\nArma: ' + WEAPONS[s.start].name, {
        fontFamily: 'Arial', fontSize: '12px', color: '#cbd5e1', align: 'center'
      }).setOrigin(0.5));
      this.keep(this.add.text(x, y + 64, s.desc, { fontFamily: 'Arial', fontSize: '11px', color: '#94a3b8' }).setOrigin(0.5));
      let btn;
      if (owned) {
        btn = makeButton(this, x, y + 96, 170, 34, 'JOGAR', () => this.scene.start('Game', { ship: i }), { color: 0x166534, stroke: 0x4ade80, size: 16 });
      } else if (!prevCleared) {
        btn = makeButton(this, x, y + 96, 190, 34, 'Vença o chefe de\n' + GALAXIES[s.galaxy - 1].name, () => {}, { disabled: true, size: 11 });
      } else {
        const can = SAVE.credits >= s.cost;
        btn = makeButton(this, x, y + 96, 170, 34, 'COMPRAR  ' + fmt(s.cost), () => {
          SAVE.credits -= s.cost; SAVE.owned[s.id] = true; writeSave(SAVE); this.build();
        }, { disabled: !can, color: 0x854d0e, stroke: 0xfacc15, size: 15 });
      }
      this.keep(btn);
    });

    this.keep(this.add.text(W / 2, 382, 'MELHORIAS PERMANENTES', { fontFamily: 'Arial', fontSize: '15px', color: '#fde047', fontStyle: 'bold' }).setOrigin(0.5));
    META_UPGRADES.forEach((u, i) => {
      const lvl = SAVE.meta[u.id] || 0, cost = metaCost(u, lvl), can = SAVE.credits >= cost;
      this.keep(makeButton(this, 112 + i * 184, 432, 172, 62, u.name + '  Nv ' + lvl + '\n' + u.desc + '\n' + fmt(cost) + ' créditos', () => {
        SAVE.credits -= cost; SAVE.meta[u.id] = lvl + 1; writeSave(SAVE); this.build();
      }, { disabled: !can, size: 12 }));
    });
    const perHour = idleRatePerMin() * 60;
    this.keep(this.add.text(W / 2, 498, perHour > 0
      ? 'Enquanto você está fora, suas naves farmam ~' + fmt(perHour) + ' créditos/hora (até ' + OFFLINE_CAP_HOURS + 'h).'
      : 'Jogue uma partida: seu ritmo de abates define quanto as naves farmam enquanto você está fora.',
    { fontFamily: 'Arial', fontSize: '13px', color: '#94a3b8' }).setOrigin(0.5));
    this.keep(this.add.text(W / 2, 520, 'Mover: WASD/setas ou arrastar  •  Automático: ESPAÇO  •  Escolhas: 1/2/3', {
      fontFamily: 'Arial', fontSize: '11px', color: '#64748b'
    }).setOrigin(0.5));
  }
  showOffline(off) {
    const parts = [];
    parts.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(100).setInteractive());
    parts.push(this.add.rectangle(W / 2, H / 2, 420, 200, 0x0f172a).setStrokeStyle(3, 0x22d3ee).setDepth(101));
    const h = Math.floor(off.mins / 60), m = Math.floor(off.mins % 60);
    parts.push(this.add.text(W / 2, H / 2 - 30, 'BEM-VINDO DE VOLTA!\n\nSuas naves farmaram por ' + h + 'h ' + m + 'min\n+' + fmt(off.credits) + ' créditos', {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5).setDepth(102));
    const ok = makeButton(this, W / 2, H / 2 + 60, 140, 36, 'COLETAR', () => { parts.forEach((p) => p.destroy()); ok.destroy(); },
      { color: 0x166534, stroke: 0x4ade80, depth: 103 });
  }
}

// =====================================================
// CENA 3: PARTIDA
// =====================================================
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }
  init(data) { this.shipIndex = (data && data.ship) || 0; }

  create() {
    const ship = SHIPS[this.shipIndex];
    this.ship = ship; this.gi = ship.galaxy; this.gal = GALAXIES[this.gi];

    // estado da partida
    this.level = 1; this.xp = 0; this.xpNext = 6;
    this.pendingLevels = 0; this.pendingChests = 0; this.modal = null;
    this.elapsed = 0; this.runCredits = 0; this.banked = 0; this.bonus = 0; this.kills = 0;
    this.auto = false; this.paused = false; this.ended = false;
    this.bossSpawned = false; this.boss = null;
    this.invuln = 0; this.spawnTimer = 0; this.bankTimer = 0;
    this.ringCount = 0; this.swarmCount = 0; this.eliteCount = 0;
    this.sparkCount = 0; this.xpMult = 1; this.creditMult = 1;
    this.weapons = []; this.passives = {};
    this.orbs = []; this.orbAngle = 0; this.missiles = []; this.discs = [];
    this.minimapTimer = 0;

    // mundo
    this.physics.world.setBounds(0, 0, WORLD, WORLD);
    this.cameras.main.setBounds(0, 0, WORLD, WORLD);
    this.cameras.main.setBackgroundColor(this.gal.bg);
    this.far = this.add.tileSprite(0, 0, W, H, 'stars_far').setOrigin(0).setScrollFactor(0).setTint(this.gal.starTint).setAlpha(0.7).setDepth(-30);
    this.near = this.add.tileSprite(0, 0, W, H, 'stars_near').setOrigin(0).setScrollFactor(0).setDepth(-29);
    this.buildWorld();

    // jogador
    this.player = this.physics.add.sprite(WORLD / 2, WORLD / 2, 'ship_' + ship.id).setDepth(10);
    this.player.body.setCircle(16, this.player.width / 2 - 16, this.player.height / 2 - 16);
    this.player.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // grupos
    this.enemies = this.physics.add.group({ maxSize: MAX_ENEMIES + 30 });
    this.rocks = this.physics.add.group();
    this.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 400 });
    this.ebullets = this.physics.add.group({ defaultKey: 'ebullet', maxSize: 200 });
    this.gems = this.add.group({ defaultKey: 'gem', maxSize: 400 });
    this.pickups = this.add.group();
    this.spawnRocks();

    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHit, null, this);
    this.physics.add.overlap(this.bullets, this.rocks, this.onBulletHit, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouch, null, this);
    this.physics.add.overlap(this.player, this.ebullets, this.onPlayerShot, null, this);

    this.recalc();
    this.hp = this.mods.maxHp;
    this.addWeapon(ship.start);

    this.setupInput();
    this.createHUD();
    this.banner(this.gal.name, '#' + this.gal.starTint.toString(16).padStart(6, '0'));
  }

  // ---------- MUNDO: nebulosas, locais únicos, meteoros ----------
  buildWorld() {
    const rnd = mulberry32(99 + this.gi * 31);
    for (let i = 0; i < 34; i++) {
      this.add.image(rnd() * WORLD, rnd() * WORLD, 'nebula')
        .setScale(2 + rnd() * 4).setTint(i % 3 === 0 ? hexToInt(this.gal.alien.b) : this.gal.starTint)
        .setAlpha(0.1 + rnd() * 0.12).setDepth(-20);
    }
    const border = this.add.graphics().setDepth(-5);
    border.lineStyle(8, 0xef4444, 0.5).strokeRect(0, 0, WORLD, WORLD);

    this.pois = genPOIs(this.gi).map((p) => {
      const o = Object.assign({}, p, { discovered: false, done: false, scan: 0, cooldown: 0 });
      const keys = { planet: 'planet_' + this.gi, station: 'station', nest: 'nest_' + this.gi, blackhole: 'blackhole', relic: 'relic' };
      o.img = this.add.image(o.x, o.y, keys[o.type]).setDepth(o.type === 'blackhole' ? -4 : 1);
      if (o.type === 'relic') this.tweens.add({ targets: o.img, scale: 1.25, yoyo: true, repeat: -1, duration: 700 });
      o.label = this.add.text(o.x, o.y - (o.type === 'planet' ? 110 : o.type === 'blackhole' ? 130 : 70), o.name, {
        fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(2);
      return o;
    });
    this.scanBar = this.add.graphics().setDepth(3);
  }

  spawnRocks() {
    const c = WORLD / 2;
    for (let i = 0; i < ROCK_COUNT; i++) {
      let x, y;
      do { x = 150 + Math.random() * (WORLD - 300); y = 150 + Math.random() * (WORLD - 300); }
      while (Math.hypot(x - c, y - c) < 250);
      const crystal = Math.random() < 0.07;
      const r = this.rocks.create(x, y, crystal ? 'crystal' : 'rock');
      r.setDepth(3).setAngle(Math.random() * 360);
      r.body.setCircle(20, r.width / 2 - 20, r.height / 2 - 20);
      r.body.setImmovable(true);
      r.isRock = true; r.crystal = crystal; r.hitR = 22;
      r.hp = r.maxHp = 30 * this.gal.hpMult * (crystal ? 2 : 1);
      r.flash = 0; r.orbHit = 0;
    }
  }

  // ---------- ATRIBUTOS (armas + itens + melhorias permanentes) ----------
  recalc() {
    const m = SAVE.meta, p = this.passives, s = this.ship;
    const lv = (k) => p[k] || 0;
    const oldMax = this.mods ? this.mods.maxHp : 0;
    this.mods = {
      dmg: (1 + 0.1 * lv('core')) * (1 + 0.1 * m.dmg) * s.dmgMult,
      cd: Math.max(0.3, 1 - 0.08 * lv('cooler')) / (1 + 0.06 * m.rate) * s.cdMult,
      area: 1 + 0.1 * lv('amp'),
      amount: lv('multi'),
      maxHp: s.hp * (1 + 0.1 * m.hp) * (1 + 0.2 * lv('armor')),
      speed: s.speed * (1 + 0.1 * lv('engine')),
      magnet: 90 * (1 + 0.15 * m.magnet) * (1 + 0.3 * lv('magnet')),
      regen: 0.5 * lv('regen')
    };
    if (oldMax && this.mods.maxHp > oldMax) this.hp += this.mods.maxHp - oldMax;
  }

  wstats(w) {
    const def = WEAPONS[w.id];
    const s = def.stats(w.level);
    if (w.evolved) def.evolve(s);
    s.dmg *= this.mods.dmg;
    s.cd *= this.mods.cd;
    if (s.amount !== undefined) s.amount += this.mods.amount;
    if (s.radius !== undefined) s.radius *= this.mods.area;
    if (s.size !== undefined) s.size *= this.mods.area;
    return s;
  }

  // ---------- INVENTÁRIO ----------
  hasWeapon(id) { return this.weapons.find((w) => w.id === id); }
  addWeapon(id) {
    const w = this.hasWeapon(id);
    if (w) { if (w.level < MAX_WEAPON_LEVEL) w.level++; this.refreshInventory(); return 'up'; }
    if (this.weapons.length >= MAX_WEAPONS) return 'full';
    this.weapons.push({ id, level: 1, evolved: false, timer: 0.3 });
    this.refreshInventory();
    return 'new';
  }
  addPassive(id) {
    if (!this.passives[id] && Object.keys(this.passives).length >= MAX_PASSIVES) return false;
    this.passives[id] = Math.min(PASSIVES[id].max, (this.passives[id] || 0) + 1);
    this.recalc();
    this.refreshInventory();
    return true;
  }
  evolvable() {
    return this.weapons.filter((w) => !w.evolved && w.level >= MAX_WEAPON_LEVEL && this.passives[WEAPONS[w.id].evo]);
  }

  // Opções ao subir de nível (estilo Vampire Survivors)
  upgradeOptions() {
    const opts = [];
    this.weapons.forEach((w) => { if (!w.evolved && w.level < MAX_WEAPON_LEVEL) opts.push({ kind: 'weapon', id: w.id, level: w.level + 1, weight: 1.4 }); });
    if (this.weapons.length < MAX_WEAPONS) {
      Object.keys(WEAPONS).forEach((id) => { if (!WEAPONS[id].hidden && !this.hasWeapon(id)) opts.push({ kind: 'weapon', id, level: 1, weight: 1 }); });
    }
    Object.keys(PASSIVES).forEach((id) => {
      const lv = this.passives[id] || 0;
      if (lv >= PASSIVES[id].max) return;
      if (!lv && Object.keys(this.passives).length >= MAX_PASSIVES) return;
      opts.push({ kind: 'passive', id, level: lv + 1, weight: lv ? 1.2 : 0.9 });
    });
    return opts;
  }
  pickWeighted(list, n) {
    const pool = list.slice(), out = [];
    while (out.length < n && pool.length) {
      const total = pool.reduce((a, o) => a + o.weight, 0);
      let r = Math.random() * total, idx = 0;
      for (; idx < pool.length; idx++) { r -= pool[idx].weight; if (r <= 0) break; }
      out.push(pool.splice(Math.min(idx, pool.length - 1), 1)[0]);
    }
    return out;
  }
  applyOption(o) {
    if (o.kind === 'weapon') this.addWeapon(o.id);
    else if (o.kind === 'passive') this.addPassive(o.id);
    else if (o.kind === 'heal') this.hp = Math.min(this.mods.maxHp, this.hp + this.mods.maxHp * 0.3);
    else if (o.kind === 'gold') this.runCredits += 25 * this.gal.rewardMult;
  }
  optionText(o, i) {
    if (o.kind === 'heal') return '[' + (i + 1) + '] KIT DE REPARO\n\nRecupera 30% da vida';
    if (o.kind === 'gold') return '[' + (i + 1) + '] SACO DE CRÉDITOS\n\n+' + fmt(25 * this.gal.rewardMult) + ' créditos';
    if (o.kind === 'weapon') {
      const d = WEAPONS[o.id];
      return '[' + (i + 1) + '] ' + (o.level === 1 ? 'ARMA NOVA' : 'ARMA  Nv ' + o.level) + '\n' + d.name + '\n\n' + d.desc[o.level - 1] +
        '\n\nCombo: + ' + PASSIVES[d.evo].name;
    }
    const d = PASSIVES[o.id];
    const cw = comboWeaponFor(o.id);
    const owned = cw && this.hasWeapon(cw);
    return '[' + (i + 1) + '] ' + (o.level === 1 ? 'ITEM NOVO' : 'ITEM  Nv ' + o.level) + '\n' + d.name + '\n\n' + d.desc +
      (cw ? '\n\n' + (owned ? '★ COMBO com ' : 'Combo: ') + WEAPONS[cw].name : '');
  }

  // ---------- CONTROLES ----------
  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.input.keyboard.addCapture('SPACE');
    this.input.keyboard.on('keydown-SPACE', () => this.toggleAuto());
    this.input.keyboard.on('keydown-ONE', () => this.modalPick(0));
    this.input.keyboard.on('keydown-TWO', () => this.modalPick(1));
    this.input.keyboard.on('keydown-THREE', () => this.modalPick(2));
    this.input.keyboard.on('keydown-ENTER', () => this.modalPick(0));

    this.joy = { active: false, dx: 0, dy: 0, sx: 0, sy: 0 };
    this.joyBase = this.add.circle(0, 0, 50, 0xffffff, 0.08).setStrokeStyle(2, 0xffffff, 0.3).setScrollFactor(0).setDepth(140).setVisible(false);
    this.joyKnob = this.add.circle(0, 0, 22, 0xffffff, 0.25).setScrollFactor(0).setDepth(141).setVisible(false);
    this.input.on('pointerdown', (p, over) => {
      if ((over && over.length) || this.paused || this.ended) return;
      this.joy.active = true; this.joy.sx = p.x; this.joy.sy = p.y;
      this.joyBase.setPosition(p.x, p.y).setVisible(true);
      this.joyKnob.setPosition(p.x, p.y).setVisible(true);
    });
    this.input.on('pointermove', (p) => {
      if (!this.joy.active) return;
      let dx = p.x - this.joy.sx, dy = p.y - this.joy.sy;
      const d = Math.hypot(dx, dy), max = 50;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      this.joy.dx = dx / max; this.joy.dy = dy / max;
      this.joyKnob.setPosition(this.joy.sx + dx, this.joy.sy + dy);
    });
    this.input.on('pointerup', () => {
      this.joy.active = false; this.joy.dx = 0; this.joy.dy = 0;
      this.joyBase.setVisible(false); this.joyKnob.setVisible(false);
    });
  }

  toggleAuto() {
    if (this.ended) return;
    this.auto = !this.auto;
    this.autoBtn.setLabel(this.auto ? 'AUTO: LIGADO' : 'AUTO: DESLIGADO');
    this.autoBtn.bg.setFillStyle(this.auto ? 0x166534 : 0x1e3a8a);
    if (this.modal && this.auto) this.scheduleAutoPick();
  }

  // ---------- HUD ----------
  createHUD() {
    const D = 150;
    this.add.rectangle(16, 16, 220, 16, 0x000000, 0.6).setOrigin(0).setScrollFactor(0).setDepth(D);
    this.hpFill = this.add.rectangle(18, 18, 216, 12, 0xef4444).setOrigin(0).setScrollFactor(0).setDepth(D + 1);
    this.hpText = this.add.text(126, 24, '', { fontFamily: 'Arial', fontSize: '11px', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    this.infoText = this.add.text(16, 36, '', { fontFamily: 'Arial', fontSize: '13px', color: '#e2e8f0' }).setScrollFactor(0).setDepth(D);
    this.timeText = this.add.text(W / 2, 12, '0:00', { fontFamily: 'Arial', fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D);
    this.add.rectangle(0, H - 10, W, 10, 0x000000, 0.6).setOrigin(0).setScrollFactor(0).setDepth(D);
    this.xpFill = this.add.rectangle(0, H - 10, W, 10, 0x22d3ee).setOrigin(0).setScrollFactor(0).setDepth(D + 1);

    this.autoBtn = makeButton(this, W - 90, 26, 160, 30, 'AUTO: DESLIGADO', () => this.toggleAuto(), { fixed: true, depth: D, size: 13 });
    makeButton(this, W - 90, 62, 160, 26, 'RECOLHER NAVE', () => this.endRun('retreat'), { fixed: true, depth: D, size: 12, color: 0x3f3f46, stroke: 0xa1a1aa });

    this.bossBarBg = this.add.rectangle(W / 2, 54, 400, 14, 0x000000, 0.7).setScrollFactor(0).setDepth(D).setVisible(false);
    this.bossBar = this.add.rectangle(W / 2 - 198, 54, 396, 10, 0xa855f7).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1).setVisible(false);
    this.hintText = this.add.text(W / 2, H - 32, '', { fontFamily: 'Arial', fontSize: '14px', color: '#fde047', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(D);

    // minimapa
    this.mmSize = 150; this.mmX = W - 90 - 75; this.mmY = 86;
    this.add.rectangle(this.mmX, this.mmY, this.mmSize, this.mmSize, 0x020617, 0.92).setOrigin(0).setStrokeStyle(2, 0x64748b).setScrollFactor(0).setDepth(D);
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(D + 1);
    this.add.text(this.mmX + this.mmSize / 2, this.mmY + this.mmSize + 4, 'MAPA', { fontFamily: 'Arial', fontSize: '10px', color: '#94a3b8' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D);

    this.invItems = [];
  }

  refreshInventory() {
    if (!this.invItems) return;
    this.invItems.forEach((o) => o.destroy());
    this.invItems = [];
    const D = 150, y = 78;
    const slot = (x, color, abbr, lvl, evolved) => {
      this.invItems.push(this.add.rectangle(x, y, 26, 26, color, evolved ? 1 : 0.85).setStrokeStyle(2, evolved ? 0xffffff : 0x000000).setScrollFactor(0).setDepth(D));
      this.invItems.push(this.add.text(x, y - 2, abbr, { fontFamily: 'Arial', fontSize: '10px', color: '#000000', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1));
      this.invItems.push(this.add.text(x + 9, y + 9, evolved ? '★' : String(lvl), { fontFamily: 'Arial', fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2));
    };
    for (let i = 0; i < MAX_WEAPONS; i++) {
      const w = this.weapons[i], x = 30 + i * 30;
      if (w) slot(x, WEAPONS[w.id].color, WEAPONS[w.id].abbr, w.level, w.evolved);
      else this.invItems.push(this.add.rectangle(x, y, 26, 26, 0x000000, 0.4).setStrokeStyle(1, 0x475569).setScrollFactor(0).setDepth(D));
    }
    const pk = Object.keys(this.passives);
    for (let i = 0; i < MAX_PASSIVES; i++) {
      const id = pk[i], x = 30 + i * 30;
      if (id) {
        const x2 = x, y2 = y + 30;
        this.invItems.push(this.add.rectangle(x2, y2, 26, 26, PASSIVES[id].color, 0.85).setStrokeStyle(2, 0x000000).setScrollFactor(0).setDepth(D));
        this.invItems.push(this.add.text(x2, y2 - 2, PASSIVES[id].abbr, { fontFamily: 'Arial', fontSize: '10px', color: '#000000', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1));
        this.invItems.push(this.add.text(x2 + 9, y2 + 9, String(this.passives[id]), { fontFamily: 'Arial', fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2));
      } else {
        this.invItems.push(this.add.rectangle(x, y + 30, 26, 26, 0x000000, 0.4).setStrokeStyle(1, 0x475569).setScrollFactor(0).setDepth(D));
      }
    }
  }

  updateHUD() {
    this.hpFill.setScale(clamp(this.hp / this.mods.maxHp, 0, 1), 1);
    this.hpText.setText(Math.ceil(Math.max(0, this.hp)) + ' / ' + Math.ceil(this.mods.maxHp));
    this.infoText.setText('Nível ' + this.level + '   Abates ' + this.kills + '   Créditos +' + fmt(this.runCredits) + (this.auto ? ' (auto 60%)' : ''));
    this.timeText.setText(fmtTime(this.elapsed));
    this.xpFill.setScale(Math.min(1, this.xp / this.xpNext), 1);
    if (this.boss && this.boss.active) {
      this.bossBarBg.setVisible(true); this.bossBar.setVisible(true);
      this.bossBar.setScale(Math.max(0, this.boss.hp / this.boss.maxHp), 1);
    } else { this.bossBarBg.setVisible(false); this.bossBar.setVisible(false); }
    if (!this.bossSpawned && this.elapsed >= BOSS_TIME && this.auto) this.hintText.setText('Chefe detectado! Desligue o AUTO para enfrentá-lo.');
    else if (!this.bossSpawned) this.hintText.setText('Chefe em ' + fmtTime(Math.max(0, BOSS_TIME - this.elapsed)));
    else this.hintText.setText('');
  }

  drawMinimap() {
    const g = this.minimap, S = this.mmSize, X = this.mmX, Y = this.mmY, k = S / WORLD;
    g.clear();
    const colors = { planet: 0x22d3ee, station: 0x22c55e, nest: 0xef4444, blackhole: 0xa855f7, relic: 0xfacc15 };
    this.pois.forEach((p) => {
      if (!p.discovered) return;
      g.fillStyle(p.done ? 0x475569 : colors[p.type], 1);
      g.fillRect(X + p.x * k - 3, Y + p.y * k - 3, 6, 6);
    });
    this.pickups.children.iterate((pk) => {
      if (pk && pk.active && (pk.ptype === 'chest' || pk.ptype === 'weapon')) { g.fillStyle(0xfacc15, 1); g.fillCircle(X + pk.x * k, Y + pk.y * k, 2.5); }
    });
    this.enemies.children.iterate((e) => {
      if (e && e.active && (e.isElite || e.isBoss)) { g.fillStyle(0xff3b3b, 1); g.fillCircle(X + e.x * k, Y + e.y * k, e.isBoss ? 4 : 3); }
    });
    const cam = this.cameras.main;
    g.lineStyle(1, 0xffffff, 0.35).strokeRect(X + cam.scrollX * k, Y + cam.scrollY * k, W * k, H * k);
    g.fillStyle(0xffffff, 1).fillCircle(X + this.player.x * k, Y + this.player.y * k, 2.5);
  }

  banner(text, color, y) {
    // empilha avisos simultâneos para não ficarem um em cima do outro
    this.bannerStack = this.bannerStack || 0;
    const lines = text.split('\n').length;
    const t = this.add.text(W / 2, (y || 104) + Math.min(this.bannerStack, 3) * 32, text, {
      fontFamily: 'Arial Black, Arial', fontSize: '22px', color: color || '#ffffff', stroke: '#000000', strokeThickness: 5, align: 'center'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(160);
    this.bannerStack += lines;
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 1500, duration: 800, onComplete: () => { t.destroy(); this.bannerStack = Math.max(0, this.bannerStack - lines); } });
  }

  // ---------- LOOP PRINCIPAL ----------
  update(time, delta) {
    const cam = this.cameras.main;
    this.far.tilePositionX = cam.scrollX * 0.2; this.far.tilePositionY = cam.scrollY * 0.2;
    this.near.tilePositionX = cam.scrollX * 0.5; this.near.tilePositionY = cam.scrollY * 0.5;
    if (this.ended || this.paused) return;
    const dt = Math.min(delta, 50) / 1000;
    this.elapsed += dt;

    if (this.mods.regen > 0) this.hp = Math.min(this.mods.maxHp, this.hp + this.mods.regen * dt);
    this.invuln -= dt;
    this.movePlayer();
    this.updateSpawns(dt);
    this.updateEnemies(dt);
    this.updateRocks(dt);
    this.updateWeapons(dt);
    this.updateGems(dt);
    this.updatePickups();
    this.updatePOIs(dt);

    this.bullets.children.iterate((b) => { if (b && b.active) { b.life -= dt; if (b.life <= 0) b.disableBody(true, true); } });
    this.ebullets.children.iterate((b) => { if (b && b.active) { b.life -= dt; if (b.life <= 0) b.disableBody(true, true); } });

    this.bankTimer += dt;
    if (this.bankTimer > 10) { this.bankTimer = 0; this.bankCredits(); }
    this.minimapTimer -= dt;
    if (this.minimapTimer <= 0) { this.minimapTimer = 0.12; this.drawMinimap(); }
    this.updateHUD();
  }

  bankCredits() {
    const add = Math.floor(this.runCredits) - this.banked;
    if (add > 0) { SAVE.credits += add; this.banked += add; }
    writeSave(SAVE);
  }

  movePlayer() {
    let vx = 0, vy = 0;
    if (this.auto) { const v = this.autoPilot(); vx = v.x; vy = v.y; }
    else if (this.joy.active) { vx = this.joy.dx; vy = this.joy.dy; }
    else {
      const c = this.cursors, k = this.keys;
      if (c.left.isDown || k.A.isDown) vx -= 1;
      if (c.right.isDown || k.D.isDown) vx += 1;
      if (c.up.isDown || k.W.isDown) vy -= 1;
      if (c.down.isDown || k.S.isDown) vy += 1;
    }
    const len = Math.hypot(vx, vy);
    if (len > 1) { vx /= len; vy /= len; }
    this.moveDir = len > 0.1 ? { x: vx / Math.max(len, 1), y: vy / Math.max(len, 1) } : null;
    this.player.setVelocity(vx * this.mods.speed, vy * this.mods.speed);
  }

  // Piloto automático: foge do perigo, coleta gemas e itens, quebra meteoros
  autoPilot() {
    let fx = 0, fy = 0;
    const px = this.player.x, py = this.player.y;
    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      const R = e.isBoss ? 320 : e.isElite ? 260 : 200;
      const dx = px - e.x, dy = py - e.y, d2 = dx * dx + dy * dy;
      if (d2 < R * R && d2 > 1) { const d = Math.sqrt(d2), w = (R - d) / R * (e.isBoss || e.isElite ? 3 : 1); fx += dx / d * w; fy += dy / d * w; }
    });
    this.ebullets.children.iterate((b) => {
      if (!b || !b.active) return;
      const dx = px - b.x, dy = py - b.y, d2 = dx * dx + dy * dy;
      if (d2 < 150 * 150 && d2 > 1) { const d = Math.sqrt(d2), w = (150 - d) / 150 * 2; fx += dx / d * w; fy += dy / d * w; }
    });
    const bh = this.pois.find((p) => p.type === 'blackhole');
    if (bh) { const dx = px - bh.x, dy = py - bh.y, d = Math.hypot(dx, dy); if (d < 450) { fx += dx / d * 3; fy += dy / d * 3; } }
    const seek = (x, y, w) => { const dx = x - px, dy = y - py, d = Math.hypot(dx, dy) || 1; fx += dx / d * w; fy += dy / d * w; };
    let best = null, bd = 600 * 600;
    this.pickups.children.iterate((p) => { if (!p || !p.active) return; const d2 = (p.x - px) ** 2 + (p.y - py) ** 2; if (d2 < bd) { bd = d2; best = p; } });
    if (best) seek(best.x, best.y, 0.9);
    else {
      let g = null, gd = 350 * 350;
      this.gems.children.iterate((o) => { if (!o || !o.active) return; const d2 = (o.x - px) ** 2 + (o.y - py) ** 2; if (d2 < gd) { gd = d2; g = o; } });
      if (g) seek(g.x, g.y, 0.6);
      else {
        let r = null, rd = 500 * 500;
        this.rocks.children.iterate((o) => { if (!o || !o.active) return; const d2 = (o.x - px) ** 2 + (o.y - py) ** 2; if (d2 < rd) { rd = d2; r = o; } });
        if (r && rd > 160 * 160) seek(r.x, r.y, 0.4);
      }
    }
    // explora locais não visitados aos poucos
    const target = this.pois.find((p) => !p.done && p.type !== 'blackhole' && p.type !== 'nest');
    if (target) seek(target.x, target.y, 0.15);
    // evita as bordas do mapa
    if (px < 200) fx += 1; if (px > WORLD - 200) fx -= 1;
    if (py < 200) fy += 1; if (py > WORLD - 200) fy -= 1;
    return { x: fx, y: fy };
  }

  // ---------- NASCIMENTO DE INIMIGOS ----------
  updateSpawns(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = Math.max(0.1, 0.5 - this.elapsed / 320);
      this.spawnEnemy(this.pickType());
      if (this.elapsed > 90) this.spawnEnemy(this.pickType());
      if (this.elapsed > 180) this.spawnEnemy(this.pickType());
    }
    if (Math.floor(this.elapsed / RING_EVERY) > this.ringCount) { this.ringCount++; this.spawnRing(); }
    if (Math.floor(this.elapsed / SWARM_EVERY) > this.swarmCount) { this.swarmCount++; this.spawnSwarm(); }
    if (Math.floor(this.elapsed / ELITE_EVERY) > this.eliteCount && this.elapsed < BOSS_TIME) {
      this.eliteCount++;
      const p = this.spawnPoint();
      this.spawnElite(p.x, p.y);
    }
    if (!this.bossSpawned && this.elapsed >= BOSS_TIME && !this.auto) this.spawnBoss();
  }

  pickType() {
    const r = Math.random();
    if (this.elapsed > 60 && r < 0.15) return 'saucer';
    if (this.elapsed > 20 && r < 0.45) return 'diamond';
    return 'bug';
  }

  // ponto fora da tela; inimigos chegam de todos os lados (e mais pela frente)
  spawnPoint() {
    const px = this.player.x, py = this.player.y, d = 600 + Math.random() * 120;
    for (let tries = 0; tries < 8; tries++) {
      let ang = Math.random() * Math.PI * 2;
      if (this.moveDir && Math.random() < 0.35) ang = Math.atan2(this.moveDir.y, this.moveDir.x) + (Math.random() - 0.5) * 2;
      const x = px + Math.cos(ang) * d, y = py + Math.sin(ang) * d;
      if (x > 40 && y > 40 && x < WORLD - 40 && y < WORLD - 40) return { x, y };
    }
    return { x: clamp(px + (Math.random() - 0.5) * 1400, 40, WORLD - 40), y: clamp(py + (Math.random() - 0.5) * 1400, 40, WORLD - 40) };
  }

  spawnEnemy(typeKey, x, y) {
    if (this.enemies.countActive(true) >= MAX_ENEMIES) return null;
    const t = ENEMY_TYPES[typeKey];
    if (x === undefined) { const p = this.spawnPoint(); x = p.x; y = p.y; }
    const key = typeKey + '_' + this.gi;
    const e = this.enemies.get(x, y, key);
    if (!e) return null;
    e.setTexture(key).setScale(1).setRotation(0);
    e.enableBody(true, x, y, true, true);
    e.setDepth(5).clearTint();
    e.body.setCircle(t.radius, e.width / 2 - t.radius, e.height / 2 - t.radius);
    const timeMult = 1 + this.elapsed / 90;
    e.hp = e.maxHp = t.hp * this.gal.hpMult * timeMult;
    e.speedV = t.speed * this.gal.speedMult * (0.9 + Math.random() * 0.2);
    e.damage = t.damage * Math.sqrt(this.gal.hpMult);
    e.reward = t.reward; e.xpVal = t.xp; e.hitR = t.radius;
    e.isBoss = false; e.isElite = false; e.straight = null;
    e.flash = 0; e.orbHit = 0; e.kbT = 0; e.kbx = 0; e.kby = 0;
    e.flank = (Math.random() - 0.5) * 1.8;   // cada um chega por um ângulo diferente
    return e;
  }

  spawnRing() {
    const n = 18, cx = this.player.x, cy = this.player.y;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      this.spawnEnemy('bug', clamp(cx + Math.cos(a) * 480, 40, WORLD - 40), clamp(cy + Math.sin(a) * 480, 40, WORLD - 40));
    }
    this.banner('CERCO!', '#fca5a5');
  }

  // enxame que atravessa a tela em linha reta (como os morcegos do VS)
  spawnSwarm() {
    const ang = Math.random() * Math.PI * 2;
    const dirx = Math.cos(ang), diry = Math.sin(ang);
    const sx = this.player.x - dirx * 650, sy = this.player.y - diry * 650;
    for (let i = 0; i < 20; i++) {
      const off = (i - 10) * 28;
      const e = this.spawnEnemy('diamond', clamp(sx - diry * off + (Math.random() - 0.5) * 60, 20, WORLD - 20), clamp(sy + dirx * off + (Math.random() - 0.5) * 60, 20, WORLD - 20));
      if (e) { e.straight = { x: dirx * 240, y: diry * 240 }; e.life = 7; }
    }
    this.banner('ENXAME!', '#fde047');
  }

  spawnElite(x, y) {
    const types = ['bug', 'saucer', 'diamond'];
    const tk = types[this.eliteCount % 3];
    const e = this.spawnEnemy(tk, x, y) || this.forceSpawn(tk, x, y);
    if (!e) return;
    e.isElite = true;
    e.setScale(2.2);
    e.setTint(0xffd27f);
    e.hp = e.maxHp = e.maxHp * 28;
    e.speedV *= 0.85;
    e.damage *= 2;
    e.reward = 40; e.xpVal = 10; e.hitR = ENEMY_TYPES[tk].radius * 2.2;
    this.banner('SUBCHEFE À VISTA!', '#fb923c');
  }
  forceSpawn(tk, x, y) {
    let victim = null;
    this.enemies.children.iterate((e) => { if (!victim && e && e.active && !e.isElite && !e.isBoss) victim = e; });
    if (victim) victim.disableBody(true, true);
    return this.spawnEnemy(tk, x, y);
  }

  spawnBoss() {
    this.bossSpawned = true;
    const p = this.spawnPoint();
    const key = 'boss_' + this.gi;
    let e = this.enemies.get(p.x, p.y, key);
    if (!e) { this.forceSpawn('bug', p.x, p.y); e = this.enemies.get(p.x, p.y, key); }
    if (!e) return;
    e.setTexture(key).setScale(1);
    e.enableBody(true, p.x, p.y, true, true);
    e.setDepth(6).clearTint();
    e.body.setCircle(50, e.width / 2 - 50, e.height / 2 - 50);
    e.hp = e.maxHp = 1600 * this.gal.hpMult;
    e.speedV = 60 * this.gal.speedMult;
    e.damage = 30 * Math.sqrt(this.gal.hpMult);
    e.reward = 0; e.xpVal = 20; e.hitR = 50;
    e.isBoss = true; e.isElite = false; e.straight = null;
    e.flash = 0; e.orbHit = 0; e.kbT = 0; e.flank = 0; e.shootT = 2; e.burst = 0;
    this.boss = e;
    this.bossBar.setFillStyle(hexToInt(this.gal.alien.b));
    this.banner('ALERTA: CHEFE DA GALÁXIA!', '#f87171');
  }

  // ---------- MOVIMENTO DOS INIMIGOS (com separação: nada de fila indiana) ----------
  updateEnemies(dt) {
    const px = this.player.x, py = this.player.y;
    const CELL = 48, grid = new Map();
    const list = [];
    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      list.push(e);
      const key = Math.floor(e.x / CELL) * 1000 + Math.floor(e.y / CELL);
      let arr = grid.get(key);
      if (!arr) { arr = []; grid.set(key, arr); }
      arr.push(e);
    });
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.flash > 0) { e.flash -= dt; if (e.flash <= 0) { e.clearTint(); if (e.isElite) e.setTint(0xffd27f); } }
      if (e.straight) {
        e.life -= dt;
        if (e.life <= 0) { e.disableBody(true, true); continue; }
        e.setVelocity(e.straight.x, e.straight.y);
        continue;
      }
      if (e.kbT > 0) { e.kbT -= dt; e.setVelocity(e.kbx, e.kby); continue; }
      const dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy) || 1;
      if (!e.isBoss && !e.isElite && d > 1400) {
        const p = this.spawnPoint(); e.setPosition(p.x, p.y); continue;   // reposiciona em vez de sumir
      }
      // direção com "flanco": de longe chegam em arco, de perto vão direto
      const f = e.flank * clamp((d - 140) / 420, 0, 1);
      const base = Math.atan2(dy, dx) + f;
      let vx = Math.cos(base) * e.speedV, vy = Math.sin(base) * e.speedV;
      // separação entre vizinhos
      if (!e.isBoss) {
        let sx = 0, sy = 0;
        const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const arr = grid.get((cx + ox) * 1000 + (cy + oy));
            if (!arr) continue;
            for (let j = 0; j < arr.length; j++) {
              const o = arr[j];
              if (o === e) continue;
              const ddx = e.x - o.x, ddy = e.y - o.y, dd = Math.hypot(ddx, ddy) || 0.01;
              const minD = (e.hitR + o.hitR) * 0.85;
              if (dd < minD) { const push = (minD - dd) / minD; sx += ddx / dd * push; sy += ddy / dd * push; }
            }
          }
        }
        vx += sx * e.speedV * 1.6; vy += sy * e.speedV * 1.6;
      }
      e.setVelocity(vx, vy);
      if (e.isBoss) this.updateBoss(e, dt);
    }
  }

  updateBoss(e, dt) {
    e.rotation += dt * 0.6;
    e.shootT -= dt;
    if (e.shootT <= 0) {
      e.shootT = 2.0;
      e.burst++;
      const n = 18, off = (e.burst % 2) * (Math.PI / n);
      for (let i = 0; i < n; i++) this.enemyShot(e.x, e.y, i / n * Math.PI * 2 + off, 190);
      if (e.burst % 3 === 0) {
        const base = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y);
        [-0.2, 0, 0.2].forEach((o) => this.enemyShot(e.x, e.y, base + o, 280));
      }
      if (e.burst % 4 === 0) for (let i = 0; i < 6; i++) this.spawnEnemy('diamond', e.x + (Math.random() - 0.5) * 80, e.y + (Math.random() - 0.5) * 80);
    }
  }

  enemyShot(x, y, a, spd) {
    const b = this.ebullets.get(x, y, 'ebullet');
    if (!b) return;
    b.enableBody(true, x, y, true, true);
    b.setDepth(7);
    b.body.setCircle(5, 1, 1);
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd);
    b.life = 4; b.dmg = 12 * Math.sqrt(this.gal.hpMult);
  }

  updateRocks(dt) {
    this.rocks.children.iterate((r) => {
      if (r && r.active && r.flash > 0) { r.flash -= dt; if (r.flash <= 0) r.clearTint(); }
    });
  }

  // ---------- ALVOS ----------
  nearestEnemy(range, x, y) {
    x = x === undefined ? this.player.x : x; y = y === undefined ? this.player.y : y;
    let best = null, bd = range * range;
    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      const d2 = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
      if (d2 < bd) { bd = d2; best = e; }
    });
    return best;
  }
  nearestTarget(range) {
    const e = this.nearestEnemy(range);
    if (e) return e;
    let best = null, bd = 340 * 340;
    const px = this.player.x, py = this.player.y;
    this.rocks.children.iterate((r) => {
      if (!r || !r.active) return;
      const d2 = (r.x - px) * (r.x - px) + (r.y - py) * (r.y - py);
      if (d2 < bd) { bd = d2; best = r; }
    });
    return best;
  }
  forEachTarget(cb) {
    this.enemies.children.iterate((e) => { if (e && e.active) cb(e); });
    this.rocks.children.iterate((r) => { if (r && r.active) cb(r); });
  }

  damageTarget(t, dmg) {
    if (!t.active) return;
    t.hp -= dmg;
    if (t.setTintFill) t.setTintFill(0xffffff); else t.setTint(0xffffff);
    t.flash = 0.06;
    if (t.hp <= 0) { if (t.isRock) this.breakRock(t); else this.killEnemy(t); }
  }

  knock(t, fromX, fromY, force) {
    if (t.isRock || t.isBoss) return;
    const dx = t.x - fromX, dy = t.y - fromY, d = Math.hypot(dx, dy) || 1;
    const k = t.isElite ? force * 0.3 : force;
    t.kbx = dx / d * k; t.kby = dy / d * k; t.kbT = 0.15;
  }

  killEnemy(e) {
    if (!e.active) return;
    const mult = this.gal.rewardMult * (this.auto ? AUTO_REWARD_MULT : 1) * this.creditMult;
    this.runCredits += e.reward * mult;
    this.kills++;
    this.dropGem(e.x, e.y, e.xpVal);
    this.boom(e.x, e.y, e.isBoss ? 40 : e.isElite ? 24 : 6, e.isBoss || e.isElite ? 0xfde047 : hexToInt(this.gal.alien.b));
    const wasBoss = e.isBoss, wasElite = e.isElite;
    e.isElite = false;
    e.disableBody(true, true);
    if (wasElite) this.dropPickup(e.x, e.y, 'chest');
    if (wasBoss) this.onBossDefeated();
  }

  breakRock(r) {
    this.boom(r.x, r.y, 10, r.crystal ? 0x22d3ee : 0xa8a29e);
    r.disableBody(true, true);
    if (r.crystal) {
      const hidden = Object.keys(WEAPONS).filter((k) => WEAPONS[k].hidden && !this.hasWeapon(k));
      if (hidden.length) this.dropPickup(r.x, r.y, 'weapon', Phaser.Utils.Array.GetRandom(hidden));
      else this.dropPickup(r.x, r.y, 'chest');
      return;
    }
    const roll = Math.random();
    if (roll < 0.3) this.dropPickup(r.x, r.y, 'heal');
    else if (roll < 0.52) this.dropPickup(r.x, r.y, 'coin');
    else if (roll < 0.6) this.dropPickup(r.x, r.y, 'magnet');
    else if (roll < 0.65) this.dropPickup(r.x, r.y, 'bomb');
    else if (roll < 0.85) this.dropGem(r.x, r.y, 5);
  }

  boom(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      if (this.sparkCount > 160) return;
      this.sparkCount++;
      const s = this.add.image(x, y, 'spark').setTint(color).setDepth(9);
      const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * (n > 10 ? 120 : 30);
      this.tweens.add({
        targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.3,
        duration: 300 + Math.random() * 300, onComplete: () => { s.destroy(); this.sparkCount--; }
      });
    }
  }

  // ---------- ARMAS ----------
  updateWeapons(dt) {
    let orbitalStats = null;
    this.weapons.forEach((w) => {
      const s = this.wstats(w);
      if (w.id === 'orbital') { orbitalStats = s; return; }
      w.timer -= dt;
      if (w.timer > 0) return;
      let fired = false;
      if (w.id === 'pulsar') fired = this.firePulsar(s);
      else if (w.id === 'missiles') fired = this.fireMissiles(s);
      else if (w.id === 'shock') fired = this.fireShock(s);
      else if (w.id === 'chain') fired = this.fireChain(s);
      else if (w.id === 'disc') fired = this.fireDiscs(s);
      w.timer = fired ? s.cd : 0.1;
    });
    this.updateOrbitals(dt, orbitalStats);
    this.updateMissiles(dt);
    this.updateDiscs(dt);
  }

  shoot(x, y, a, dmg, pierce) {
    const b = this.bullets.get(x, y, 'bullet');
    if (!b) return;
    b.enableBody(true, x, y, true, true);
    b.setDepth(8);
    b.body.setCircle(5);
    b.setVelocity(Math.cos(a) * 620, Math.sin(a) * 620);
    b.life = 1.1; b.pierceLeft = pierce; b.hitSet = new Set(); b.dmg = dmg;
  }

  firePulsar(s) {
    const t = this.nearestTarget(520);
    if (!t) return false;
    const px = this.player.x, py = this.player.y;
    const base = Phaser.Math.Angle.Between(px, py, t.x, t.y);
    for (let i = 0; i < s.amount; i++) this.shoot(px, py, base + (i - (s.amount - 1) / 2) * 0.14, s.dmg, s.pierce);
    if (s.ring) { this.ringCounter = (this.ringCounter || 0) + 1; if (this.ringCounter % 2 === 0) for (let i = 0; i < 10; i++) this.shoot(px, py, i / 10 * Math.PI * 2, s.dmg * 0.7, s.pierce); }
    this.player.rotation = base + Math.PI / 2;
    return true;
  }

  fireMissiles(s) {
    if (!this.nearestEnemy(700)) return false;
    for (let i = 0; i < s.amount; i++) {
      const a = Math.random() * Math.PI * 2;
      const m = this.add.image(this.player.x, this.player.y, 'missile').setDepth(8).setScale(s.radius > 80 ? 1.5 : 1.2);
      m.ang = a; m.speed = 260; m.life = 3; m.dmg = s.dmg; m.radius = s.radius; m.target = null;
      this.missiles.push(m);
    }
    return true;
  }
  updateMissiles(dt) {
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life -= dt;
      if (!m.target || !m.target.active) m.target = this.nearestEnemy(800, m.x, m.y);
      if (m.target) {
        const want = Math.atan2(m.target.y - m.y, m.target.x - m.x);
        let diff = Phaser.Math.Angle.Wrap(want - m.ang);
        m.ang += clamp(diff, -6 * dt, 6 * dt);
      }
      m.speed = Math.min(480, m.speed + 500 * dt);
      m.x += Math.cos(m.ang) * m.speed * dt; m.y += Math.sin(m.ang) * m.speed * dt;
      m.rotation = m.ang + Math.PI / 2;
      const hit = m.target && Math.hypot(m.target.x - m.x, m.target.y - m.y) < (m.target.hitR || 14) + 6;
      if (hit || m.life <= 0) {
        this.explode(m.x, m.y, m.radius, m.dmg);
        m.destroy();
        this.missiles.splice(i, 1);
      }
    }
  }
  explode(x, y, radius, dmg) {
    const c = this.add.circle(x, y, radius, 0xf97316, 0.35).setDepth(9).setStrokeStyle(2, 0xfde047, 0.8);
    this.tweens.add({ targets: c, alpha: 0, scale: 1.2, duration: 250, onComplete: () => c.destroy() });
    const r2 = radius * radius;
    this.forEachTarget((t) => {
      const d2 = (t.x - x) * (t.x - x) + (t.y - y) * (t.y - y);
      if (d2 < r2 + (t.hitR || 14) * (t.hitR || 14)) this.damageTarget(t, dmg);
    });
  }

  fireShock(s) {
    const px = this.player.x, py = this.player.y;
    const near = this.nearestEnemy(s.radius * 1.2);
    if (!near) return false;
    const ring = this.add.circle(px, py, 10, 0xa78bfa, 0.18).setStrokeStyle(3, 0xc4b5fd, 0.9).setDepth(9);
    this.tweens.add({ targets: ring, radius: s.radius, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
    let healed = 0;
    const r = s.radius;
    this.forEachTarget((t) => {
      const d = Math.hypot(t.x - px, t.y - py);
      if (d < r + (t.hitR || 14)) {
        this.damageTarget(t, s.dmg);
        this.knock(t, px, py, 380);
        if (s.heal && !t.isRock && healed < 10) { healed++; this.hp = Math.min(this.mods.maxHp, this.hp + 0.8); }
      }
    });
    return true;
  }

  fireChain(s) {
    const px = this.player.x, py = this.player.y;
    const pool = [];
    this.enemies.children.iterate((e) => { if (e && e.active && Math.hypot(e.x - px, e.y - py) < 560) pool.push(e); });
    if (!pool.length) return false;
    const g = this.add.graphics().setDepth(12);
    g.lineStyle(3, 0x67e8f9, 1);
    const hit = new Set();
    for (let k = 0; k < s.amount; k++) {
      let cur = Phaser.Utils.Array.GetRandom(pool.filter((e) => !hit.has(e))) || pool[0];
      let fromX = px, fromY = py;
      for (let j = 0; j <= s.jumps && cur; j++) {
        this.zigzag(g, fromX, fromY, cur.x, cur.y);
        hit.add(cur);
        fromX = cur.x; fromY = cur.y;
        const target = cur;
        let next = null, nd = 190 * 190;
        pool.forEach((o) => { if (!hit.has(o) && o.active) { const d2 = (o.x - fromX) ** 2 + (o.y - fromY) ** 2; if (d2 < nd) { nd = d2; next = o; } } });
        this.damageTarget(target, s.dmg);
        cur = next;
      }
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
    return true;
  }
  zigzag(g, x1, y1, x2, y2) {
    const steps = 5;
    g.beginPath(); g.moveTo(x1, y1);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      g.lineTo(x1 + (x2 - x1) * t + (Math.random() - 0.5) * 18, y1 + (y2 - y1) * t + (Math.random() - 0.5) * 18);
    }
    g.lineTo(x2, y2); g.strokePath();
  }

  fireDiscs(s) {
    const t = this.nearestTarget(600);
    const base = t ? Math.atan2(t.y - this.player.y, t.x - this.player.x) : Math.random() * Math.PI * 2;
    for (let i = 0; i < s.amount; i++) {
      const a = base + (i - (s.amount - 1) / 2) * (Math.PI * 2 / Math.max(3, s.amount + 1));
      const d = this.add.image(this.player.x, this.player.y, 'disc').setDepth(8).setScale(s.size);
      d.dirx = Math.cos(a); d.diry = Math.sin(a); d.out = 0; d.back = false;
      d.dmg = s.dmg; d.range = s.range; d.r = 12 * s.size; d.hits = new Map(); d.pull = s.pull;
      this.discs.push(d);
    }
    return true;
  }
  updateDiscs(dt) {
    for (let i = this.discs.length - 1; i >= 0; i--) {
      const d = this.discs[i];
      d.rotation += dt * 14;
      if (!d.back) {
        const step = 460 * dt;
        d.x += d.dirx * step; d.y += d.diry * step; d.out += step;
        if (d.out >= d.range) d.back = true;
      } else {
        const dx = this.player.x - d.x, dy = this.player.y - d.y, dist = Math.hypot(dx, dy) || 1;
        if (dist < 24) { d.destroy(); this.discs.splice(i, 1); continue; }
        const step = Math.min(dist, 560 * dt);
        d.x += dx / dist * step; d.y += dy / dist * step;
      }
      if (d.pull) {
        this.gems.children.iterate((g) => { if (g && g.active && Math.hypot(g.x - d.x, g.y - d.y) < 90) g.magnetized = true; });
      }
      this.forEachTarget((t) => {
        const rr = d.r + (t.hitR || 14);
        if ((t.x - d.x) ** 2 + (t.y - d.y) ** 2 > rr * rr) return;
        const last = d.hits.get(t) || -1;
        if (this.elapsed - last < 0.3) return;
        d.hits.set(t, this.elapsed);
        this.damageTarget(t, d.dmg);
      });
    }
  }

  updateOrbitals(dt, s) {
    const want = s ? s.amount : 0;
    while (this.orbs.length < want) this.orbs.push(this.add.image(0, 0, 'orb').setDepth(11));
    while (this.orbs.length > want) this.orbs.pop().destroy();
    if (!want) return;
    this.orbAngle += dt * s.spin;
    const R = s.radius, n = this.orbs.length;
    this.orbs.forEach((o, i) => {
      const a = this.orbAngle + i / n * Math.PI * 2;
      o.setPosition(this.player.x + Math.cos(a) * R, this.player.y + Math.sin(a) * R).setScale(s.size);
    });
    const hitR = 10 * s.size;
    this.forEachTarget((t) => {
      if (this.elapsed - (t.orbHit || 0) < 0.35) return;
      const r = hitR + (t.hitR || 14);
      if (Math.abs(Math.hypot(t.x - this.player.x, t.y - this.player.y) - R) > r) return;
      for (let i = 0; i < n; i++) {
        const o = this.orbs[i];
        if ((o.x - t.x) ** 2 + (o.y - t.y) ** 2 < r * r) {
          t.orbHit = this.elapsed;
          this.damageTarget(t, s.dmg);
          if (s.knock) this.knock(t, this.player.x, this.player.y, 300);
          break;
        }
      }
    });
  }

  onBulletHit(b, e) {
    if (!b.active || !e.active || b.hitSet.has(e)) return;
    b.hitSet.add(e);
    this.damageTarget(e, b.dmg);
    if (b.pierceLeft > 0) b.pierceLeft--;
    else b.disableBody(true, true);
  }

  // ---------- GEMAS E ITENS NO CHÃO ----------
  dropGem(x, y, val) {
    const g = this.gems.get(x, y, 'gem');
    if (!g) return;
    g.setActive(true).setVisible(true).setPosition(x, y).setDepth(4);
    g.val = val; g.magnetized = false;
    g.setScale(val >= 5 ? 2 : val > 1 ? 1.6 : 1);
  }
  updateGems(dt) {
    const px = this.player.x, py = this.player.y, mag = this.mods.magnet;
    this.gems.children.iterate((g) => {
      if (!g || !g.active) return;
      const dx = px - g.x, dy = py - g.y, d = Math.hypot(dx, dy);
      if (d < 22) { g.setActive(false).setVisible(false); this.gainXp(g.val); return; }
      if (d > 1600 && !g.magnetized) { g.setActive(false).setVisible(false); return; }
      if (d < mag || g.magnetized) {
        g.magnetized = true;
        const step = Math.min(d, 520 * dt);
        g.x += dx / d * step; g.y += dy / d * step;
      }
    });
  }

  dropPickup(x, y, ptype, extra) {
    const keys = { heal: 'heal', coin: 'coin', magnet: 'magnetItem', bomb: 'bomb', chest: 'chest', weapon: 'wbox' };
    const p = this.add.image(x, y, keys[ptype]).setDepth(6);
    p.ptype = ptype; p.extra = extra;
    this.pickups.add(p);
    this.tweens.add({ targets: p, y: y - 6, yoyo: true, repeat: -1, duration: 500 });
    if (ptype === 'weapon') {
      p.label = this.add.text(x, y - 34, WEAPONS[extra].name + '!', { fontFamily: 'Arial', fontSize: '13px', color: '#f5d0fe', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(7);
    }
    return p;
  }
  updatePickups() {
    const px = this.player.x, py = this.player.y;
    const got = [];
    this.pickups.children.iterate((p) => { if (p && p.active && Math.hypot(p.x - px, p.y - py) < 30) got.push(p); });
    got.forEach((p) => {
      const t = p.ptype, extra = p.extra;
      if (p.label) p.label.destroy();
      this.tweens.killTweensOf(p);
      p.destroy();
      if (t === 'heal') { this.hp = Math.min(this.mods.maxHp, this.hp + this.mods.maxHp * 0.3); this.floatText(px, py, '+VIDA', '#f87171'); }
      else if (t === 'coin') { const v = 15 * this.gal.rewardMult * this.creditMult; this.runCredits += v; this.floatText(px, py, '+' + fmt(v) + ' créditos', '#facc15'); }
      else if (t === 'magnet') { this.gems.children.iterate((g) => { if (g && g.active) g.magnetized = true; }); this.floatText(px, py, 'ÍMÃ TOTAL!', '#22d3ee'); }
      else if (t === 'bomb') this.detonate();
      else if (t === 'chest') { this.pendingChests++; this.openNextModal(); }
      else if (t === 'weapon') this.gainHiddenWeapon(extra);
    });
  }
  floatText(x, y, text, color) {
    const t = this.add.text(x, y - 30, text, { fontFamily: 'Arial', fontSize: '15px', color, stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }
  detonate() {
    this.cameras.main.flash(250, 255, 200, 120);
    const px = this.player.x, py = this.player.y;
    const list = [];
    this.enemies.children.iterate((e) => { if (e && e.active && Math.hypot(e.x - px, e.y - py) < 650) list.push(e); });
    list.forEach((e) => this.damageTarget(e, e.isBoss || e.isElite ? e.maxHp * 0.25 : e.hp + 1));
    this.floatText(px, py, 'BOMBA!', '#fb923c');
  }

  gainHiddenWeapon(id) {
    const res = this.addWeapon(id);
    if (res === 'new') this.banner('ARMA ESCONDIDA ENCONTRADA!\n' + WEAPONS[id].name, '#f0abfc');
    else if (res === 'up') this.banner(WEAPONS[id].name + ' melhorou!', '#f0abfc');
    else { this.banner('Sem espaço para armas: virou um baú!', '#fde047'); this.pendingChests++; this.openNextModal(); }
  }

  // ---------- LOCAIS ÚNICOS ----------
  updatePOIs(dt) {
    const px = this.player.x, py = this.player.y;
    this.scanBar.clear();
    this.pois.forEach((p) => {
      const d = Math.hypot(p.x - px, p.y - py);
      if (!p.discovered && d < 520) {
        p.discovered = true;
        this.banner('DESCOBERTO: ' + p.name, '#a5f3fc');
        if (p.type === 'nest') this.triggerNest(p);
      }
      if (p.type === 'planet' && !p.done) {
        if (d < 130) {
          p.scan += dt;
          this.scanBar.fillStyle(0x000000, 0.7).fillRect(p.x - 50, p.y + 85, 100, 10);
          this.scanBar.fillStyle(0x22d3ee, 1).fillRect(p.x - 48, p.y + 87, 96 * Math.min(1, p.scan / 1.5), 6);
          if (p.scan >= 1.5) {
            p.done = true; p.label.setText(p.name + ' (explorado)').setColor('#94a3b8');
            this.gainHiddenWeapon(p.weapon);
          }
        } else if (p.scan > 0) p.scan = Math.max(0, p.scan - dt);
      }
      if (p.type === 'station') {
        p.cooldown -= dt;
        p.label.setText(p.cooldown > 0 ? p.name + ' (' + Math.ceil(p.cooldown) + 's)' : p.name + ' — PRONTA');
        if (d < 110 && p.cooldown <= 0 && this.hp < this.mods.maxHp) {
          this.hp = this.mods.maxHp; p.cooldown = 90;
          this.floatText(px, py, 'REPARO COMPLETO!', '#4ade80');
        }
      }
      if (p.type === 'relic' && !p.done && d < 45) {
        p.done = true; p.img.setVisible(false);
        p.label.setText(p.name + ' (coletada)').setColor('#94a3b8');
        this.xpMult *= 1.3; this.creditMult *= 1.3;
        this.banner('RELÍQUIA: ' + p.name + '\n+30% XP e créditos nesta partida', '#facc15');
      }
      if (p.type === 'blackhole') this.updateBlackHole(p, dt, d);
    });
  }
  triggerNest(p) {
    p.done = true;
    this.spawnElite(p.x + 60, p.y);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; this.spawnEnemy('bug', p.x + Math.cos(a) * 120, p.y + Math.sin(a) * 120); }
    this.banner('O NINHO DESPERTOU!', '#f87171');
  }
  updateBlackHole(p, dt, dPlayer) {
    p.img.rotation += dt * 0.8;
    const R = 460;
    if (dPlayer < R) {
      const f = (1 - dPlayer / R) * 170;
      this.player.body.velocity.x += (p.x - this.player.x) / dPlayer * f;
      this.player.body.velocity.y += (p.y - this.player.y) / dPlayer * f;
      if (dPlayer < 55) { this.hp -= 30 * dt; if (this.hp <= 0) this.hurt(0); }
    }
    this.enemies.children.iterate((e) => {
      if (!e || !e.active || e.isBoss) return;
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (d > R) return;
      if (d < 45 && !e.isElite) { this.killEnemy(e); return; }
      e.body.velocity.x += dx / d * 140; e.body.velocity.y += dy / d * 140;
    });
  }

  gainXp(v) {
    this.xp += v * this.xpMult;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Math.floor(this.xpNext * 1.22 + 3);
      this.pendingLevels++;
    }
    if (this.pendingLevels > 0) this.openNextModal();
  }

  // ---------- JANELAS (subir de nível / baú) ----------
  openNextModal() {
    if (this.modal || this.ended) return;
    if (this.pendingChests > 0) { this.pendingChests--; this.openChest(); return; }
    if (this.pendingLevels > 0) { this.pendingLevels--; this.openLevelUp(); return; }
    this.paused = false;
    this.physics.resume();
  }
  pauseForModal() {
    this.paused = true;
    this.physics.pause();
    this.joy.active = false; this.joyBase.setVisible(false); this.joyKnob.setVisible(false);
  }
  closeModal() {
    if (!this.modal) return;
    this.modal.parts.forEach((p) => p.destroy());
    this.modal = null;
    if (this.autoPickEvt) { this.autoPickEvt.remove(false); this.autoPickEvt = null; }
    this.openNextModal();
  }
  modalPick(i) {
    if (!this.modal) return;
    if (this.modal.kind === 'level') {
      const o = this.modal.options[i];
      if (!o) return;
      this.applyOption(o);
      this.closeModal();
    } else if (this.modal.kind === 'chest' && i === 0) this.closeModal();
  }
  scheduleAutoPick() {
    if (this.autoPickEvt) this.autoPickEvt.remove(false);
    this.autoPickEvt = this.time.delayedCall(this.modal && this.modal.kind === 'chest' ? 1400 : 900, () => {
      if (!this.modal || !this.auto) return;
      if (this.modal.kind === 'chest') { this.modalPick(0); return; }
      // o piloto prefere completar combos
      const opts = this.modal.options;
      let idx = opts.findIndex((o) => o.kind === 'passive' && comboWeaponFor(o.id) && this.hasWeapon(comboWeaponFor(o.id)));
      if (idx < 0) idx = opts.findIndex((o) => o.kind === 'weapon');
      this.modalPick(idx < 0 ? 0 : idx);
    });
  }

  openLevelUp() {
    this.pauseForModal();
    let options = this.pickWeighted(this.upgradeOptions(), 3);
    if (!options.length) options = [{ kind: 'heal' }, { kind: 'gold' }];
    const parts = [];
    parts.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setScrollFactor(0).setDepth(200).setInteractive());
    parts.push(this.add.text(W / 2, 80, 'NÍVEL ' + (this.level - this.pendingLevels) + '!  Escolha uma melhoria', {
      fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#fde047', stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201));
    const n = options.length;
    options.forEach((o, i) => {
      const isCombo = o.kind === 'passive' && comboWeaponFor(o.id) && this.hasWeapon(comboWeaponFor(o.id));
      const color = o.kind === 'weapon' ? 0x312e81 : o.kind === 'passive' ? 0x134e4a : 0x3f3f46;
      parts.push(makeButton(this, W / 2 + (i - (n - 1) / 2) * 260, H / 2 + 10, 240, 220, this.optionText(o, i),
        () => this.modalPick(i), { fixed: true, depth: 202, size: 15, color, stroke: isCombo ? 0xfacc15 : 0xa5b4fc, wrap: true }));
    });
    parts.push(this.add.text(W / 2, H - 60, 'Combo = arma no nível ' + MAX_WEAPON_LEVEL + ' + o item certo. Abra um baú de subchefe para evoluir!', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cbd5e1'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201));
    if (this.auto) parts.push(this.add.text(W / 2, H - 36, 'Piloto automático vai escolher sozinho...', { fontFamily: 'Arial', fontSize: '13px', color: '#94a3b8' }).setOrigin(0.5).setScrollFactor(0).setDepth(201));
    this.modal = { kind: 'level', options, parts };
    if (this.auto) this.scheduleAutoPick();
  }

  // Baú: evolui uma arma (COMBO) se possível; senão dá melhorias aleatórias
  openChest() {
    this.pauseForModal();
    const lines = [];
    let title = 'BAÚ ABERTO!';
    let color = '#fde047';
    const evo = this.evolvable();
    if (evo.length) {
      const w = evo[0];
      w.evolved = true;
      title = 'COMBO!';
      color = '#f0abfc';
      lines.push(WEAPONS[w.id].name + ' + ' + PASSIVES[WEAPONS[w.id].evo].name);
      lines.push('evoluiu para');
      lines.push('★ ' + WEAPONS[w.id].evoName + ' ★');
      this.cameras.main.flash(300, 240, 171, 252);
    } else {
      const count = Math.random() < 0.2 ? 3 : 1;
      for (let k = 0; k < count; k++) {
        const opts = this.upgradeOptions().filter((o) => o.level > 1);
        const pool = opts.length ? opts : this.upgradeOptions();
        const o = pool.length ? Phaser.Utils.Array.GetRandom(pool) : { kind: 'gold' };
        this.applyOption(o);
        lines.push(o.kind === 'weapon' ? WEAPONS[o.id].name + ' → Nv ' + o.level
          : o.kind === 'passive' ? PASSIVES[o.id].name + ' → Nv ' + o.level : '+' + fmt(25 * this.gal.rewardMult) + ' créditos');
      }
      const bonus = 30 * this.gal.rewardMult * this.creditMult;
      this.runCredits += bonus;
      lines.push('+' + fmt(bonus) + ' créditos');
    }
    this.refreshInventory();
    const parts = [];
    parts.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setScrollFactor(0).setDepth(200).setInteractive());
    parts.push(this.add.rectangle(W / 2, H / 2, 460, 260, 0x1c1917).setStrokeStyle(3, 0xfacc15).setScrollFactor(0).setDepth(201));
    parts.push(this.add.image(W / 2, H / 2 - 95, 'chest').setScale(1.5).setScrollFactor(0).setDepth(202));
    parts.push(this.add.text(W / 2, H / 2 - 50, title, { fontFamily: 'Arial Black, Arial', fontSize: '26px', color, stroke: '#000000', strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(202));
    parts.push(this.add.text(W / 2, H / 2 + 15, lines.join('\n'), { fontFamily: 'Arial', fontSize: '17px', color: '#ffffff', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(202));
    parts.push(makeButton(this, W / 2, H / 2 + 95, 160, 34, 'CONTINUAR', () => this.modalPick(0), { fixed: true, depth: 203, color: 0x166534, stroke: 0x4ade80 }));
    this.modal = { kind: 'chest', parts };
    if (this.auto) this.scheduleAutoPick();
  }

  // ---------- DANO NO JOGADOR ----------
  onPlayerTouch(p, e) { if (this.invuln > 0 || !e.active) return; this.hurt(e.damage); }
  onPlayerShot(p, b) {
    if (!b.active) return;
    b.disableBody(true, true);
    if (this.invuln > 0) return;
    this.hurt(b.dmg);
  }
  hurt(d) {
    if (this.ended) return;
    this.invuln = 0.5;
    this.hp -= d;
    this.cameras.main.shake(80, 0.006);
    this.player.setTint(0xff6666);
    this.time.delayedCall(120, () => { if (this.player.active) this.player.clearTint(); });
    if (this.hp <= 0) {
      this.boom(this.player.x, this.player.y, 30, 0xf97316);
      this.player.setVisible(false);
      this.endRun('dead');
    }
  }

  // ---------- FIM DA PARTIDA ----------
  onBossDefeated() {
    this.boss = null;
    const first = !SAVE.cleared[this.gi];
    SAVE.cleared[this.gi] = true;
    this.bonus = 500 * this.gal.rewardMult;
    this.runCredits += this.bonus;
    this.cameras.main.flash(400, 255, 255, 255);
    this.time.delayedCall(900, () => this.endRun('victory', first));
  }

  endRun(reason, firstClear) {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    if (this.modal) { this.modal.parts.forEach((p) => p.destroy()); this.modal = null; }
    const mins = Math.max(1, this.elapsed / 60);
    const rate = (this.runCredits - this.bonus) / mins;
    if (rate > (SAVE.bestRate[this.gi] || 0)) SAVE.bestRate[this.gi] = rate;
    this.bankCredits();

    const titles = { victory: 'GALÁXIA CONQUISTADA!', dead: 'NAVE DESTRUÍDA', retreat: 'MISSÃO ENCERRADA' };
    const colors = { victory: '#86efac', dead: '#f87171', retreat: '#a5f3fc' };
    const D = 300;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setScrollFactor(0).setDepth(D).setInteractive();
    this.add.rectangle(W / 2, H / 2, 480, 320, 0x0f172a).setStrokeStyle(3, 0x60a5fa).setScrollFactor(0).setDepth(D + 1);
    this.add.text(W / 2, H / 2 - 120, titles[reason], {
      fontFamily: 'Arial Black, Arial', fontSize: '28px', color: colors[reason], stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    const found = this.pois.filter((p) => p.discovered).length;
    const evolved = this.weapons.filter((w) => w.evolved).map((w) => WEAPONS[w.id].evoName);
    let body = 'Tempo: ' + fmtTime(this.elapsed) + '   Abates: ' + this.kills + '   Nível: ' + this.level +
      '\nLocais descobertos: ' + found + '/' + this.pois.length +
      (evolved.length ? '\nCombos: ' + evolved.join(', ') : '') +
      '\n\nCréditos ganhos: ' + fmt(this.runCredits);
    if (reason === 'victory' && firstClear && SHIPS[this.gi + 1]) body += '\n\nNova nave disponível no hangar: ' + SHIPS[this.gi + 1].name + '!';
    this.add.text(W / 2, H / 2 - 5, body, { fontFamily: 'Arial', fontSize: '16px', color: '#e2e8f0', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    makeButton(this, W / 2, H / 2 + 120, 220, 40, 'VOLTAR AO HANGAR', () => this.scene.start('Hangar'),
      { fixed: true, depth: D + 3, color: 0x166534, stroke: 0x4ade80 });
  }
}

// ============ INICIALIZAÇÃO ============
const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#000000',
  pixelArt: true,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, HangarScene, GameScene]
};

const game = new Phaser.Game(config);
