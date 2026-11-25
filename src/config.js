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
// Horários de chefes, subchefes, cercos e enxames: src/dados/eventos.js
// Quantidade de inimigos por minuto: src/dados/ondas.js
const METEORO_PERTO = 150;       // meteoro a essa distância da nave é atacado como inimigo (RN-46)
const OFFLINE_CAP_HOURS = 8;
const OFFLINE_EFFICIENCY = 0.3;
const AUTO_REWARD_MULT = 0.6;
const MAX_ENEMIES = 200;
const MAX_WEAPONS = 4, MAX_PASSIVES = 4, MAX_WEAPON_LEVEL = 5;
const ROCK_COUNT = 140;

