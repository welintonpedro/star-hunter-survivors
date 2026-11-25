// =====================================================
// STAR HUNTER SURVIVORS — Protótipo v0.2
// Navinha estilo "Vampire Survivors"
// Novidades v0.2: mapa grande com locais únicos, minimapa, meteoros
// que quebram e soltam itens, subchefes, 6 armas (2 escondidas),
// 8 itens passivos e COMBOS (evoluções) ao abrir baús.
// Toda a arte é gerada por código: não precisa de assets externos.
// Controles: WASD/setas ou arrastar | 1/2/3 = escolher
// =====================================================

const W = 960, H = 540;
const WORLD = 17000;             // tamanho do mapa de cada galáxia (~8x o da v0.2); dá a volta: src/mundo.js
// Horários de chefes, subchefes, cercos e enxames: src/dados/eventos.js
// Quantidade de inimigos por minuto: src/dados/ondas.js
// chance de cada raridade num baú (o resto é comum): raro = 2 melhorias, épico = 3 + vida cheia
const BAU_CHANCES = { raro: 0.3, epico: 0.1 };
const CHANCE_ARMA_TRAVADA = 0.35; // chance de um baú de subchefe trazer uma arma travada (RN-35)
const METEORO_PERTO = 150;       // meteoro a essa distância da nave é atacado como inimigo (RN-46)
const CREDITOS_METEORO = 12;     // créditos de cada meteoro quebrado (RN-55)
const CREDITOS_CRISTAL = 60;     // créditos de cada meteoro de cristal (RN-55)
const INIMIGO_LONGE = 1300;       // inimigo comum mais longe que isso da nave reaparece na borda da tela (RN-59)
const MAX_ENEMIES = 250;          // limite de inimigos na tela (RN-12)
const MAX_WEAPONS = 4, MAX_PASSIVES = 4, MAX_WEAPON_LEVEL = 5;
const ROCK_COUNT = 1100;         // meteoros espalhados pelo mapa (mesma densidade da v0.2)

