// ============ TABELA DE INIMIGOS POR MINUTO ============
// Ajuste os números aqui para mudar a dificuldade, sem mexer na lógica (RN-06, RN-07).
// Uma linha por minuto da partida (0 a 29):
//   min        = mínimo de inimigos comuns vivos: abaixo disso, nascem rápido até chegar lá
//   max        = máximo de inimigos comuns vivos: chegando nele, param de nascer
//   porSegundo = entre o mínimo e o máximo, quantos nascem por segundo
//   vida       = multiplica a vida dos inimigos comuns (1 = vida base)
// Os números são suavizados entre um minuto e o seguinte (não dão "degrau").
// Quais inimigos aparecem e quando: src/dados/inimigos.js (campos "entra" e "peso").

const ONDAS = [
  /*  0 */ { min:   6, max:  14, porSegundo: 0.8, vida: 1.0 },
  /*  1 */ { min:   8, max:  19, porSegundo: 1.0, vida: 1.1 },
  /*  2 */ { min:  11, max:  24, porSegundo: 1.2, vida: 1.2 },
  /*  3 */ { min:  14, max:  31, porSegundo: 1.4, vida: 1.35 },
  /*  4 */ { min:  18, max:  37, porSegundo: 1.7, vida: 1.5 },
  /*  5 */ { min:  22, max:  44, porSegundo: 1.9, vida: 1.7 },
  /*  6 */ { min:  26, max:  51, porSegundo: 2.1, vida: 1.9 },
  /*  7 */ { min:  30, max:  58, porSegundo: 2.3, vida: 2.1 },
  /*  8 */ { min:  35, max:  65, porSegundo: 2.5, vida: 2.35 },
  /*  9 */ { min:  40, max:  73, porSegundo: 2.7, vida: 2.6 },
  /* 10 */ { min:  45, max:  80, porSegundo: 2.9, vida: 2.9 },
  /* 11 */ { min:  50, max:  88, porSegundo: 3.2, vida: 3.2 },
  /* 12 */ { min:  55, max:  96, porSegundo: 3.4, vida: 3.5 },
  /* 13 */ { min:  60, max: 104, porSegundo: 3.6, vida: 3.8 },
  /* 14 */ { min:  66, max: 112, porSegundo: 3.8, vida: 4.1 },
  /* 15 */ { min:  71, max: 120, porSegundo: 4.0, vida: 4.4 },
  /* 16 */ { min:  77, max: 128, porSegundo: 4.2, vida: 4.7 },
  /* 17 */ { min:  83, max: 136, porSegundo: 4.4, vida: 5.0 },
  /* 18 */ { min:  89, max: 145, porSegundo: 4.6, vida: 5.3 },
  /* 19 */ { min:  95, max: 153, porSegundo: 4.9, vida: 5.6 },
  /* 20 */ { min: 101, max: 161, porSegundo: 5.1, vida: 5.9 },
  /* 21 */ { min: 107, max: 170, porSegundo: 5.3, vida: 6.2 },
  /* 22 */ { min: 114, max: 178, porSegundo: 5.5, vida: 6.5 },
  /* 23 */ { min: 120, max: 187, porSegundo: 5.7, vida: 6.8 },
  /* 24 */ { min: 126, max: 196, porSegundo: 5.9, vida: 7.1 },
  /* 25 */ { min: 133, max: 205, porSegundo: 6.1, vida: 7.4 },
  /* 26 */ { min: 140, max: 213, porSegundo: 6.4, vida: 7.7 },
  /* 27 */ { min: 146, max: 222, porSegundo: 6.6, vida: 8.0 },
  /* 28 */ { min: 153, max: 231, porSegundo: 6.8, vida: 8.3 },
  /* 29 */ { min: 160, max: 240, porSegundo: 7.0, vida: 8.6 }
];

if (typeof module !== 'undefined') module.exports = { ONDAS };
