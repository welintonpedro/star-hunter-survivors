// ============ PRÓLOGO (RN-73): dados, desenhos e roteiro ============
// A primeira vez que alguém abre o jogo, começa aqui: uma partida roteirizada de ~4 a 5 minutos
// no Abismo Violeta, com uma nave do futuro já muito forte. Ela ensina a jogar, vence o chefe
// e então a nave-mãe a destrói. Uma entidade encapuzada manda o jogador "voltar para o seu tempo"
// e a campanha começa do zero. Os números ficam aqui para o dono ajustar (RN-07).

// Nave exclusiva do prólogo: não aparece no hangar (pelo menos por enquanto)
const NAVE_PROLOGO = {
  id: 'eclipse', name: 'Eclipse', art: 'shipEclipse', galaxy: 2, cost: 0,
  hp: 320, speed: 245, dmgMult: 1.8, cdMult: 0.75, start: 'rajada',
  palette: { a: '#1e1b4b', b: '#7c3aed', c: '#c4b5fd', d: '#f0abfc', e: '#fde047', f: '#22d3ee' },
  desc: ''
};

const ART_PROLOGO = {
  // Eclipse: nave fina e estilosa, asas rosadas, núcleo dourado, motores azuis
  shipEclipse: ['.......a.......', '......aba......', '......aba......', '.....abcba.....', '.....abcba.....', '....abbcbba....',
    'd...abbcbba...d', 'da.abbbcbbba.ad', 'dbaabbcccbbaabd', 'dbbbbbcecbbbbbd', 'dbbbbcceccbbbbd', '.dbbbcccccbbbd.',
    '..ddbaaaaabdd..', '....af...fa....', '....f.....f....'],
  // entidade encapuzada (os olhos brilhantes são desenhados por cima, para piscar)
  entidade: ['...........aa...........', '........aaaaaaaa........', '.......aabbbbbbaa.......', '......abbbbbbbbbba......',
    '.....abbbbbbbbbbbba.....', '....abbbbbbbbbbbbbba....', '....abbbbbbbbbbbbbba....', '...abbbbbccccccbbbbba...',
    '...abbbbccccccccbbbba...', '...abbbccccccccccbbba...', '...abbbccccccccccbbba...', '...bbbbccccccccccbbbb...',
    '..abbbbccccccccccbbbba..', '...bbbbccccccccccbbbb...', '...abbbccccccccccbbba...', '.....abbccccccccbba.....',
    '.....abbccccccccbba.....', '....abbbccccccccbbba....', '....abbbbbbddbbbbbba....', '...aabbbbbbddbbbbbbaa...',
    '...abbbbbbbddbbbbbbba...', '..aabbbbbbbddbbbbbbbaa..', '..abbbbbbbbddbbbbbbbba..', '..abbbbbbbbddbbbbbbbba..',
    '.abbbbbbbbbddbbbbbbbbba.', '.abbbbbbbbbddbbbbbbbbba.', 'aabbbbbbbbbddbbbbbbbbbaa', 'abbbbbbbbbbddbbbbbbbbbba',
    'abbbbbbbbbbddbbbbbbbbbba', 'bbbbbbbbbbbddbbbbbbbbbbb']
};
const CORES_ENTIDADE = { a: '#1a0533', b: '#3b0764', c: '#05010d', d: '#a855f7' };
// posição dos olhos no desenho (em pixels do desenho, a partir do centro)
const OLHOS_ENTIDADE = [{ x: -3, y: -3.5 }, { x: 3, y: -3.5 }];

// Armas e itens com que a Eclipse começa (já forte)
const PROLOGO_INICIO = {
  nivel: 12,
  armas: [['rajada', 4], ['pulsar', 4], ['missiles', 3]],   // a 4ª vaga fica para a arma suprema do roteiro
  itens: [['core', 2], ['multi', 1], ['armor', 2]],
  xpPorNivel: 45,        // XP fixa por nível no prólogo (sobe de nível rápido, para ver muitas cartas)
  vidaInimigos: 0.45,    // inimigos do prólogo têm menos da metade da vida (parece fácil)
  danoRecebido: 0.25,    // a nave recebe só 25% do dano (até a nave-mãe chegar)
  vidaChefe: 0.35        // chefe do prólogo cai rápido
};

// Roteiro: cada passo tem um tempo mínimo e máximo (segundos). Ele avança quando a condição
// do passo é cumprida (e o mínimo já passou) ou quando o máximo acaba (para ninguém ficar preso).
// Somando os mínimos, o prólogo dura por volta de 4 minutos e meio.
const ROTEIRO_PROLOGO = [
  { id: 'abertura', min: 9, max: 9 },
  { id: 'telaCheia', min: 6, max: 14 },
  { id: 'mover', min: 10, max: 22 },
  { id: 'atirar', min: 22, max: 40 },
  { id: 'joias', min: 8, max: 25 },
  { id: 'cartas', min: 4, max: 60 },
  { id: 'horda', min: 40, max: 50 },
  { id: 'bau', min: 6, max: 30 },
  { id: 'meteoro', min: 8, max: 25 },
  { id: 'chamas', min: 14, max: 18 },
  { id: 'pausa', min: 7, max: 7 },
  { id: 'cerco', min: 35, max: 45 },
  { id: 'subchefe', min: 12, max: 40 },
  { id: 'chefe', min: 35, max: 80 },
  { id: 'vitoria', min: 6, max: 6 },
  { id: 'naveMae', min: 14, max: 14 },
  { id: 'fim', min: 999, max: 999 }
];

if (typeof module !== 'undefined') module.exports = { NAVE_PROLOGO, ART_PROLOGO, PROLOGO_INICIO, ROTEIRO_PROLOGO };
