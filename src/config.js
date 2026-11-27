// =====================================================
// STAR HUNTER SURVIVORS — Protótipo v0.2
// Navinha estilo "Vampire Survivors"
// Novidades v0.2: mapa grande com locais únicos, minimapa, meteoros
// que quebram e soltam itens, subchefes, 6 armas (2 escondidas),
// 8 itens passivos e COMBOS (evoluções) ao abrir baús.
// Toda a arte é gerada por código: não precisa de assets externos.
// Controles: WASD/setas ou arrastar | 1/2/3 = escolher
// =====================================================

// Tamanho da tela do jogo (RN-88). A base é 960×540 (16:9), mas o jogo se adapta ao formato
// do aparelho para ocupar a tela toda, sem faixas pretas:
// - celular mais comprido (ex.: 20:9): a altura fica 540 e a largura cresce (vê mais do mapa dos lados);
// - tablet mais quadrado (ex.: 4:3): a largura fica 960 e a altura cresce.
// Usa sempre o formato "deitado" (o jogo é na horizontal). Calculado uma vez, ao abrir o jogo.
const TELA_MIN = 4 / 3, TELA_MAX = 2.4;   // limites: do iPad (4:3) ao celular bem comprido (21:9)
const _formatoTela = (() => {
  if (typeof window === 'undefined' || !window.innerWidth || !window.innerHeight) return 16 / 9;
  const a = Math.max(window.innerWidth, window.innerHeight) / Math.min(window.innerWidth, window.innerHeight);
  return Math.min(TELA_MAX, Math.max(TELA_MIN, a));
})();
const W = _formatoTela >= 16 / 9 ? Math.round(540 * _formatoTela / 2) * 2 : 960;
const H = _formatoTela >= 16 / 9 ? 540 : Math.round(960 / _formatoTela / 2) * 2;
const WORLD = 17000;             // tamanho do mapa de cada galáxia (~8x o da v0.2); dá a volta: src/mundo.js
// Horários de chefes, subchefes, cercos e enxames: src/dados/eventos.js
// Quantidade de inimigos por minuto: src/dados/ondas.js
// chance de cada raridade num baú (o resto é comum): raro = 2 melhorias, épico = 3 + vida cheia
const BAU_CHANCES = { raro: 0.3, epico: 0.1 };
const CHANCE_ARMA_TRAVADA = 0.35; // chance de um baú de subchefe trazer uma arma travada (RN-35)
const METEORO_PERTO = 150;       // meteoro a essa distância da nave é atacado como inimigo (RN-46)
const CREDITOS_METEORO = 12;     // créditos de cada meteoro quebrado (RN-55)
const CREDITOS_CRISTAL = 60;     // créditos de cada meteoro de cristal (RN-55)
// O que sai de um meteoro quebrado: sorteio pelo peso (RN-62). Cristal dá créditos e mais um sorteio sem moeda.
const METEORO_ITENS = { coin: 70, heal: 8, magnet: 5, congelar: 3, lento: 5, chamas: 4 };
const PODER_CONGELAR_S = 5;      // segundos com todos os inimigos parados
const PODER_LENTO_S = 8;         // segundos com inimigos lentos
const PODER_LENTO_MULT = 0.45;   // velocidade dos inimigos durante a lentidão
const PODER_CHAMAS_S = 10;       // segundos de lança-chamas
const PODER_CHAMAS_DANO = 45;    // dano por segundo (multiplicado pela vida dos inimigos do minuto)
const PODER_CHAMAS_ALCANCE = 240;
// Armas comuns sorteadas para cada partida: nem todas aparecem (RN-64)
const ARMAS_POR_PARTIDA = 5;
// Peso de uma arma suprema nas cartas (arma comum = 1): quanto menor, mais rara (RN-66)
const CHANCE_SUPREMA = 0.15;
const INIMIGO_LONGE = 1300;       // inimigo comum mais longe que isso da nave reaparece na borda da tela (RN-59)
const MAX_ENEMIES = 250;          // limite de inimigos na tela (RN-12)
const MAX_WEAPONS = 4, MAX_PASSIVES = 4, MAX_WEAPON_LEVEL = 5;
const ROCK_COUNT = 1100;         // meteoros espalhados pelo mapa (mesma densidade da v0.2)

