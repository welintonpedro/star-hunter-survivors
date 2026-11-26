// ============ MODOS DE JOGO (RN-68 infinito, RN-69 arena) ============
// Números de equilíbrio dos modos novos, separados da lógica para o dono ajustar (RN-07).

// ----- MODO INFINITO: não acaba aos 30:00; segue até a nave ser destruída -----
const INFINITO = {
  inicioExtra: 1740,        // a partir de 29:00, inimigos ficam mais fortes a cada minuto...
  crescimentoPorMinuto: 1.1, // ...multiplicando vida e dano por 1,1 a cada minuto (10%)
  chefeACada: 300,          // depois dos 30:00, um chefe a cada 5 minutos
  subchefeACada: 120        // e um subchefe a cada 2 minutos
};
// Pontuação (vale para o recorde do modo infinito)
const PONTOS = { porAbate: 1, porSegundo: 2, porSubchefe: 100, porChefe: 500 };
function calcularPontos(r) {
  return Math.floor(r.abates * PONTOS.porAbate + r.segundos * PONTOS.porSegundo + r.subchefes * PONTOS.porSubchefe + r.chefes * PONTOS.porChefe);
}

// ----- ARENA: battle royale contra naves do computador -----
const ARENA = {
  duracao: 480,             // 8 minutos; depois disso a zona fecha de vez
  rivais: 9,                // naves do computador (você + 9 = 10 na arena)
  zonaInicial: 1700,        // raio da zona segura no começo (pixels)
  zonaFinal: 140,           // raio no fim dos 8 minutos
  danoZonaPorSegundo: 0.06, // fora da zona: perde 6% da vida máxima por segundo
  ritmoInimigos: 2,         // os monstros avançam no tempo 2x mais rápido que na campanha
  chefes: [150, 300, 420],  // chefes que caçam o jogador aos 2:30, 5:00 e 7:00
  rival: {
    vida: 420,              // vida no começo
    vidaPorMinuto: 0.45,    // +45% de vida a cada minuto (os rivais sobem de nível)
    dano: 7,                // dano de cada tiro no começo
    danoPorMinuto: 0.25,    // +25% de dano a cada minuto
    recarga: 1.3,           // segundos entre tiros
    alcance: 460,           // de quão longe atiram
    velocidade: 175,
    nivelACada: 40,         // sobe 1 nível a cada 40 s
    chanceDeBrigar: 0.5,    // chance de um rival escolher outro rival como alvo (senão caça monstros)
    danoEntreRivais: 0.5    // tiro de rival em rival causa metade do dano (as brigas duram mais)
  },
  // créditos por colocação (1º, 2º, ...10º), multiplicados pelo bônus da galáxia
  premio: [600, 400, 300, 220, 160, 120, 90, 70, 50, 40],
  // nomes das naves rivais: estrelas de cada galáxia (RN-70); as naves do jogador são Altair, Antares e Rigel
  nomesPorGalaxia: [
    ['Vega', 'Deneb', 'Sirius', 'Procyon', 'Castor', 'Pollux', 'Capella', 'Spica', 'Alcor', 'Tarazed'],          // Nebulosa Esmeralda
    ['Betelgeuse', 'Aldebaran', 'Arcturus', 'Mirach', 'Hadar', 'Shaula', 'Enif', 'Kochab', 'Mira', 'Scheat'],   // Cinturão Rubro
    ['Bellatrix', 'Achernar', 'Canopus', 'Fomalhaut', 'Alnilam', 'Saiph', 'Polaris', 'Mizar', 'Alkaid', 'Algol'] // Abismo Violeta
  ],
  cores: [0xf87171, 0xfb923c, 0xfacc15, 0x4ade80, 0x2dd4bf, 0x60a5fa, 0xa78bfa, 0xf472b6, 0xe5e7eb, 0x94a3b8]
};
// raio da zona no tempo t (encolhe em degraus suaves até o fim)
function raioDaZona(t, a) {
  const arena = a || ARENA;
  const f = Math.min(1, Math.max(0, t / arena.duracao));
  return arena.zonaFinal + (arena.zonaInicial - arena.zonaFinal) * (1 - f) * (1 - f * 0.35);
}

if (typeof module !== 'undefined') module.exports = { INFINITO, PONTOS, calcularPontos, ARENA, raioDaZona };
