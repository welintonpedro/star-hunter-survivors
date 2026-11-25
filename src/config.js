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

