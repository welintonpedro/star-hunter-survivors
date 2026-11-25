// ============ TABELA DE ONDAS (uma linha por minuto da partida) ============
// Ajuste os números aqui para mudar a dificuldade, sem mexer na lógica (RN-07).
//
// Minutos 0 a 9  → modo 'ondas': grupos fechados de inimigos, com respiro entre eles.
//   tamanho   = quantos inimigos a onda traz
//   respiro   = segundos de calma depois que a onda acaba
//   tempoMax  = se o jogador não matar a maioria, a próxima onda vem depois deste tempo (s)
// Minutos 10 a 29 → modo 'fluxo': inimigos chegando sem parar.
//   porSegundo = quantos nascem por segundo
//   maxNaTela  = teto de inimigos comuns vivos ao mesmo tempo
// Em todas as linhas:
//   vida  = multiplica a vida dos inimigos comuns (1 = vida base)
// Quais inimigos aparecem e quando: src/dados/inimigos.js (campo "entra" e "peso").

const ONDAS = [
  /* 0 */ { modo: 'ondas', tamanho: 5,  respiro: 4,   tempoMax: 25, vida: 1.0 },
  /* 1 */ { modo: 'ondas', tamanho: 7,  respiro: 4,   tempoMax: 25, vida: 1.1 },
  /* 2 */ { modo: 'ondas', tamanho: 9,  respiro: 3.5, tempoMax: 24, vida: 1.2 },
  /* 3 */ { modo: 'ondas', tamanho: 11, respiro: 3.5, tempoMax: 22, vida: 1.35 },
  /* 4 */ { modo: 'ondas', tamanho: 13, respiro: 3,   tempoMax: 22, vida: 1.5 },
  /* 5 */ { modo: 'ondas', tamanho: 15, respiro: 3,   tempoMax: 20, vida: 1.7 },
  /* 6 */ { modo: 'ondas', tamanho: 18, respiro: 2.5, tempoMax: 20, vida: 1.9 },
  /* 7 */ { modo: 'ondas', tamanho: 21, respiro: 2.5, tempoMax: 18, vida: 2.1 },
  /* 8 */ { modo: 'ondas', tamanho: 24, respiro: 2,   tempoMax: 18, vida: 2.35 },
  /* 9 */ { modo: 'ondas', tamanho: 28, respiro: 2,   tempoMax: 16, vida: 2.6 },
  /* 10 */ { modo: 'fluxo', porSegundo: 1.6, maxNaTela: 45,  vida: 2.9 },
  /* 11 */ { modo: 'fluxo', porSegundo: 1.9, maxNaTela: 55,  vida: 3.2 },
  /* 12 */ { modo: 'fluxo', porSegundo: 2.2, maxNaTela: 65,  vida: 3.5 },
  /* 13 */ { modo: 'fluxo', porSegundo: 2.5, maxNaTela: 75,  vida: 3.8 },
  /* 14 */ { modo: 'fluxo', porSegundo: 2.8, maxNaTela: 85,  vida: 4.1 },
  /* 15 */ { modo: 'fluxo', porSegundo: 3.1, maxNaTela: 95,  vida: 4.4 },
  /* 16 */ { modo: 'fluxo', porSegundo: 3.4, maxNaTela: 105, vida: 4.7 },
  /* 17 */ { modo: 'fluxo', porSegundo: 3.7, maxNaTela: 115, vida: 5.0 },
  /* 18 */ { modo: 'fluxo', porSegundo: 4.0, maxNaTela: 125, vida: 5.3 },
  /* 19 */ { modo: 'fluxo', porSegundo: 4.3, maxNaTela: 135, vida: 5.6 },
  /* 20 */ { modo: 'fluxo', porSegundo: 4.6, maxNaTela: 145, vida: 5.9 },
  /* 21 */ { modo: 'fluxo', porSegundo: 4.9, maxNaTela: 155, vida: 6.2 },
  /* 22 */ { modo: 'fluxo', porSegundo: 5.2, maxNaTela: 165, vida: 6.5 },
  /* 23 */ { modo: 'fluxo', porSegundo: 5.5, maxNaTela: 175, vida: 6.8 },
  /* 24 */ { modo: 'fluxo', porSegundo: 5.8, maxNaTela: 180, vida: 7.1 },
  /* 25 */ { modo: 'fluxo', porSegundo: 6.1, maxNaTela: 185, vida: 7.4 },
  /* 26 */ { modo: 'fluxo', porSegundo: 6.4, maxNaTela: 190, vida: 7.7 },
  /* 27 */ { modo: 'fluxo', porSegundo: 6.7, maxNaTela: 195, vida: 8.0 },
  /* 28 */ { modo: 'fluxo', porSegundo: 7.0, maxNaTela: 200, vida: 8.3 },
  /* 29 */ { modo: 'fluxo', porSegundo: 7.3, maxNaTela: 200, vida: 8.6 }
];

if (typeof module !== 'undefined') module.exports = { ONDAS };
