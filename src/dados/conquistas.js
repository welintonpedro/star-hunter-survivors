// ============ CONQUISTAS (RN-34 a RN-38) ============
// Cada conquista tem uma condição (olhando o save) e um prêmio que muda o jogo:
//   bonus  = bônus permanente pequeno (dano, vida, regen, area, velocidade, recarga, coleta, xp, creditos)
//   arma   = arma travada que passa a aparecer nas cartas
// Naves e galáxias continuam sendo liberadas pela vitória (sobreviver aos 30:00).
// "s" é o save; s.stats guarda os números acumulados entre partidas.

const TOTAL_COMBOS = 9;          // 6 armas comuns + 3 poderes, cada um com sua evolução
const ACHADOS_PARA_LIBERAR = 3;  // achar uma arma travada 3 vezes libera ela nas cartas
const LOCAIS_POR_GALAXIA = 30;

const venceu = (s, nave) => Object.keys(s.stats.vitorias).some((k) => !nave || k.endsWith(':' + nave));
const locais = (s, gi) => (s.stats.locais[gi] || []).length;

const CONQUISTAS = [
  { id: 'sobreviver10', nome: 'Sobrevivente', desc: 'Sobreviva 10 minutos numa partida',
    cond: (s) => maxTempo(s) >= 600, premio: { tipo: 'bonus', bonus: { dano: 0.05 } } },
  { id: 'sobreviver20', nome: 'Veterano', desc: 'Sobreviva 20 minutos numa partida',
    cond: (s) => maxTempo(s) >= 1200, premio: { tipo: 'bonus', bonus: { vida: 0.05 } } },
  { id: 'sobreviver30', nome: 'Conquistador', desc: 'Sobreviva até a nave-mãe (30:00)',
    cond: (s) => venceu(s), premio: { tipo: 'bonus', bonus: { regen: 1 } } },
  { id: 'primeiroCombo', nome: 'Alquimista', desc: 'Descubra seu primeiro combo',
    cond: (s) => s.combos.length >= 1, premio: { tipo: 'bonus', bonus: { area: 0.05 } } },
  { id: 'todosCombos', nome: 'Mestre dos Combos', desc: 'Descubra todos os ' + TOTAL_COMBOS + ' combos',
    cond: (s) => s.combos.length >= TOTAL_COMBOS, premio: { tipo: 'bonus', bonus: { dano: 0.1 } } },
  { id: 'abates1000', nome: 'Caçador', desc: 'Abata 1.000 inimigos (somando partidas)',
    cond: (s) => s.stats.abates >= 1000, premio: { tipo: 'bonus', bonus: { velocidade: 0.05 } } },
  { id: 'abates10000', nome: 'Exterminador', desc: 'Abata 10.000 inimigos (somando partidas)',
    cond: (s) => s.stats.abates >= 10000, premio: { tipo: 'bonus', bonus: { xp: 0.1 } } },
  { id: 'explorar0', nome: 'Cartógrafo Esmeralda', desc: 'Descubra os 30 locais da Nebulosa Esmeralda',
    cond: (s) => locais(s, 0) >= LOCAIS_POR_GALAXIA, premio: { tipo: 'bonus', bonus: { coleta: 0.1 } } },
  { id: 'explorar1', nome: 'Cartógrafo Rubro', desc: 'Descubra os 30 locais do Cinturão Rubro',
    cond: (s) => locais(s, 1) >= LOCAIS_POR_GALAXIA, premio: { tipo: 'bonus', bonus: { creditos: 0.1 } } },
  { id: 'explorar2', nome: 'Cartógrafo do Abismo', desc: 'Descubra os 30 locais do Abismo Violeta',
    cond: (s) => locais(s, 2) >= LOCAIS_POR_GALAXIA, premio: { tipo: 'bonus', bonus: { xp: 0.1 } } },
  { id: 'intocavel', nome: 'Intocável', desc: 'Fique 5 minutos seguidos sem levar dano',
    cond: (s) => s.stats.maiorSemDano >= 300, premio: { tipo: 'bonus', bonus: { recarga: 0.05 } } },
  { id: 'achouDisco', nome: 'Serralheiro', desc: 'Ache o Disco Serra ' + ACHADOS_PARA_LIBERAR + ' vezes',
    cond: (s) => (s.stats.armasAchadas.disc || 0) >= ACHADOS_PARA_LIBERAR, premio: { tipo: 'arma', arma: 'disc' } },
  { id: 'achouRaio', nome: 'Eletricista', desc: 'Ache o Raio em Cadeia ' + ACHADOS_PARA_LIBERAR + ' vezes',
    cond: (s) => (s.stats.armasAchadas.chain || 0) >= ACHADOS_PARA_LIBERAR, premio: { tipo: 'arma', arma: 'chain' } },
  { id: 'subchefes10', nome: 'Quebra-Escudos', desc: 'Derrote 10 subchefes (somando partidas)',
    cond: (s) => s.stats.subchefes >= 10, premio: { tipo: 'bonus', bonus: { vida: 0.05 } } },
  { id: 'chefe1', nome: 'Matador de Gigantes', desc: 'Derrote um chefe da galáxia',
    cond: (s) => s.stats.chefes >= 1, premio: { tipo: 'bonus', bonus: { dano: 0.05 } } },
  { id: 'nivel30', nome: 'Evoluído', desc: 'Chegue ao nível 30 numa partida',
    cond: (s) => s.stats.nivelMax >= 30, premio: { tipo: 'bonus', bonus: { regen: 1 } } },
  { id: 'venceuFalcao', nome: 'Asa do Falcão', desc: 'Conquiste uma galáxia com o Falcão',
    cond: (s) => venceu(s, 'falcao'), premio: { tipo: 'bonus', bonus: { recarga: 0.05 } } },
  { id: 'venceuTita', nome: 'Punho do Titã', desc: 'Conquiste uma galáxia com o Titã',
    cond: (s) => venceu(s, 'tita'), premio: { tipo: 'bonus', bonus: { vida: 0.1 } } },
  { id: 'venceuAgulha', nome: 'Ponta da Agulha', desc: 'Conquiste uma galáxia com a Agulha',
    cond: (s) => venceu(s, 'agulha'), premio: { tipo: 'bonus', bonus: { velocidade: 0.05 } } },
  { id: 'mestre', nome: 'Senhor das Galáxias', desc: 'Conquiste as 3 galáxias com as 3 naves',
    cond: (s) => Object.keys(s.stats.vitorias).length >= 9, premio: { tipo: 'bonus', bonus: { dano: 0.1, creditos: 0.15 } } }
];

function maxTempo(s) {
  return Object.values(s.stats.melhorTempo).reduce((a, b) => Math.max(a, b), 0);
}

// Texto curto do prêmio, para o aviso e para a tela de conquistas
const NOMES_BONUS = { dano: 'dano', vida: 'vida máxima', regen: 'de vida por segundo', area: 'área',
  velocidade: 'velocidade', recarga: 'recarga mais rápida', coleta: 'alcance de coleta', xp: 'XP', creditos: 'créditos' };
function textoDoPremio(p, nomeArma) {
  const _t = (typeof tx === 'function') ? tx : (s, v) => (v ? s.replace(/\{(\w+)\}/g, (m, k) => v[k]) : s);
  if (p.tipo === 'arma') return _t('{arma} aparece nas cartas', { arma: nomeArma || p.arma });
  return Object.entries(p.bonus).map(([k, v]) => (k === 'regen' ? '+' + v + ' ' : '+' + Math.round(v * 100) + '% ') + _t(NOMES_BONUS[k])).join(', ');
}

if (typeof module !== 'undefined') {
  module.exports = { CONQUISTAS, TOTAL_COMBOS, ACHADOS_PARA_LIBERAR, LOCAIS_POR_GALAXIA, textoDoPremio };
}
