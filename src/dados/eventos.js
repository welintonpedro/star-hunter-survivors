// ============ EVENTOS DA PARTIDA (horários em segundos) ============
// Ajuste aqui os horários e a força de chefes, subchefes e da nave-mãe (RN-01, RN-03, RN-05).

const EVENTOS = {
  duracao: 1800,                 // 30:00 — a partida dura 30 minutos
  naveMae: 1800,                 // a nave-mãe chega aos 30:00 (vitória)
  naveMaeDuracao: 15,            // depois de 15 s com a nave-mãe, a partida termina em vitória

  // Subchefe aos 3:00, 6:00 ... 27:00. Cada um solta um baú.
  subchefes: { primeiro: 180, intervalo: 180, ultimo: 1620 },

  // Chefes da galáxia. vida/dano/tamanho multiplicam o chefe base. Cada um solta um baú.
  chefes: [
    { t: 600,  vida: 2.5, dano: 1.0, tamanho: 1.0, creditos: 300 },
    { t: 1200, vida: 6,   dano: 1.4, tamanho: 1.2, creditos: 700 },
    { t: 1500, vida: 10,  dano: 1.8, tamanho: 1.4, creditos: 1200 }
  ],

  // Eventos repetidos que só começam depois da fase inicial de ondas
  cercos:  { primeiro: 300, intervalo: 60, ultimo: 1790 },   // anel de inimigos em volta da nave
  enxames: { primeiro: 240, intervalo: 70, ultimo: 1790 }    // fila de inimigos atravessando a tela
};

if (typeof module !== 'undefined') module.exports = { EVENTOS };
