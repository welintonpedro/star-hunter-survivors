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
  /*  0 */ { min:  12, max:  20, porSegundo: 1.0, vida: 1.0 },
  /*  1 */ { min:  15, max:  27, porSegundo: 1.2, vida: 1.1 },
  /*  2 */ { min:  18, max:  34, porSegundo: 1.4, vida: 1.2 },
  /*  3 */ { min:  22, max:  40, porSegundo: 1.6, vida: 1.35 },
  /*  4 */ { min:  26, max:  47, porSegundo: 1.8, vida: 1.5 },
  /*  5 */ { min:  30, max:  54, porSegundo: 2.0, vida: 1.7 },
  /*  6 */ { min:  34, max:  61, porSegundo: 2.2, vida: 1.9 },
  /*  7 */ { min:  39, max:  68, porSegundo: 2.4, vida: 2.1 },
  /*  8 */ { min:  44, max:  75, porSegundo: 2.7, vida: 2.35 },
  /*  9 */ { min:  48, max:  82, porSegundo: 2.9, vida: 2.6 },
  /* 10 */ { min:  53, max:  90, porSegundo: 3.1, vida: 2.9 },
  /* 11 */ { min:  58, max:  97, porSegundo: 3.3, vida: 3.2 },
  /* 12 */ { min:  63, max: 105, porSegundo: 3.5, vida: 3.5 },
  /* 13 */ { min:  69, max: 112, porSegundo: 3.7, vida: 3.8 },
  /* 14 */ { min:  74, max: 120, porSegundo: 3.9, vida: 4.1 },
  /* 15 */ { min:  79, max: 128, porSegundo: 4.1, vida: 4.4 },
  /* 16 */ { min:  84, max: 135, porSegundo: 4.3, vida: 4.7 },
  /* 17 */ { min:  90, max: 143, porSegundo: 4.5, vida: 5.0 },
  /* 18 */ { min:  96, max: 151, porSegundo: 4.7, vida: 5.3 },
  /* 19 */ { min: 101, max: 159, porSegundo: 4.9, vida: 5.6 },
  /* 20 */ { min: 107, max: 167, porSegundo: 5.1, vida: 5.9 },
  /* 21 */ { min: 112, max: 175, porSegundo: 5.3, vida: 6.2 },
  /* 22 */ { min: 118, max: 183, porSegundo: 5.6, vida: 6.5 },
  /* 23 */ { min: 124, max: 191, porSegundo: 5.8, vida: 6.8 },
  /* 24 */ { min: 130, max: 199, porSegundo: 6.0, vida: 7.1 },
  /* 25 */ { min: 136, max: 207, porSegundo: 6.2, vida: 7.4 },
  /* 26 */ { min: 142, max: 215, porSegundo: 6.4, vida: 7.7 },
  /* 27 */ { min: 148, max: 224, porSegundo: 6.6, vida: 8.0 },
  /* 28 */ { min: 154, max: 232, porSegundo: 6.8, vida: 8.3 },
  /* 29 */ { min: 160, max: 240, porSegundo: 7.0, vida: 8.6 }
];

if (typeof module !== 'undefined') module.exports = { ONDAS };
