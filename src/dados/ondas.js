// ============ TABELA DE INIMIGOS POR MINUTO ============
// Ajuste os números aqui para mudar a dificuldade, sem mexer na lógica (RN-06, RN-07).
// Uma linha por minuto da partida (0 a 29):
//   min        = mínimo de inimigos comuns vivos: abaixo disso, nascem rápido até chegar lá
//   max        = máximo de inimigos comuns vivos: chegando nele, param de nascer
//   porSegundo = entre o mínimo e o máximo, quantos nascem por segundo
//   vida       = multiplica a vida dos inimigos comuns (1 = vida base); cresce mais rápido
//                que a força da nave, para o fim da partida continuar difícil
//   dano       = multiplica o dano dos inimigos comuns (1 = dano base)
// Os números são suavizados entre um minuto e o seguinte (não dão "degrau").
// Quais inimigos aparecem e quando: src/dados/inimigos.js (campos "entra" e "peso").

const ONDAS = [
  /*  0 */ { min:  14, max:  20, porSegundo:  2.0, vida:  1.00, dano: 1.00 },
  /*  1 */ { min:  31, max:  46, porSegundo:  2.3, vida:  1.18, dano: 1.06 },
  /*  2 */ { min:  43, max:  64, porSegundo:  2.7, vida:  1.38, dano: 1.12 },
  /*  3 */ { min:  52, max:  78, porSegundo:  3.0, vida:  1.62, dano: 1.18 },
  /*  4 */ { min:  61, max:  92, porSegundo:  3.4, vida:  1.89, dano: 1.24 },
  /*  5 */ { min:  70, max: 105, porSegundo:  3.7, vida:  2.20, dano: 1.30 },
  /*  6 */ { min:  78, max: 117, porSegundo:  4.1, vida:  2.57, dano: 1.36 },
  /*  7 */ { min:  86, max: 129, porSegundo:  4.4, vida:  2.98, dano: 1.42 },
  /*  8 */ { min:  93, max: 140, porSegundo:  4.8, vida:  3.47, dano: 1.48 },
  /*  9 */ { min: 100, max: 150, porSegundo:  5.1, vida:  4.02, dano: 1.54 },
  /* 10 */ { min: 107, max: 160, porSegundo:  5.4, vida:  4.66, dano: 1.60 },
  /* 11 */ { min: 114, max: 171, porSegundo:  5.8, vida:  5.39, dano: 1.66 },
  /* 12 */ { min: 121, max: 182, porSegundo:  6.1, vida:  6.23, dano: 1.72 },
  /* 13 */ { min: 127, max: 190, porSegundo:  6.5, vida:  7.20, dano: 1.78 },
  /* 14 */ { min: 134, max: 201, porSegundo:  6.8, vida:  8.31, dano: 1.84 },
  /* 15 */ { min: 140, max: 210, porSegundo:  7.2, vida:  9.58, dano: 1.90 },
  /* 16 */ { min: 146, max: 219, porSegundo:  7.5, vida: 11.03, dano: 1.96 },
  /* 17 */ { min: 152, max: 228, porSegundo:  7.9, vida: 12.70, dano: 2.02 },
  /* 18 */ { min: 158, max: 237, porSegundo:  8.2, vida: 14.61, dano: 2.08 },
  /* 19 */ { min: 164, max: 240, porSegundo:  8.6, vida: 16.79, dano: 2.14 },
  /* 20 */ { min: 170, max: 240, porSegundo:  8.9, vida: 19.29, dano: 2.20 },
  /* 21 */ { min: 176, max: 240, porSegundo:  9.2, vida: 22.15, dano: 2.26 },
  /* 22 */ { min: 182, max: 240, porSegundo:  9.6, vida: 25.41, dano: 2.32 },
  /* 23 */ { min: 187, max: 240, porSegundo:  9.9, vida: 29.14, dano: 2.38 },
  /* 24 */ { min: 193, max: 240, porSegundo: 10.3, vida: 33.39, dano: 2.44 },
  /* 25 */ { min: 198, max: 240, porSegundo: 10.6, vida: 38.25, dano: 2.50 },
  /* 26 */ { min: 204, max: 240, porSegundo: 11.0, vida: 43.79, dano: 2.56 },
  /* 27 */ { min: 209, max: 240, porSegundo: 11.3, vida: 50.11, dano: 2.62 },
  /* 28 */ { min: 215, max: 240, porSegundo: 11.7, vida: 57.32, dano: 2.68 },
  /* 29 */ { min: 220, max: 240, porSegundo: 12.0, vida: 65.54, dano: 2.74 }
];

if (typeof module !== 'undefined') module.exports = { ONDAS };
