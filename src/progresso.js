// ============ PROGRESSO ENTRE PARTIDAS: COMBOS, ARMAS ACHADAS, CONQUISTAS ============
// Funções sem dependência do navegador (testadas em tests/e8-e9-progresso.test.js).
// Tudo aqui lê ou muda o save (SAVE); quem chama decide quando gravar.

const _CQ = typeof CONQUISTAS !== 'undefined'
  ? { CONQUISTAS, ACHADOS_PARA_LIBERAR }
  : require('./dados/conquistas.js');

// Combo descoberto fica salvo para sempre, para todas as naves (RN-27, RN-28). true = era novo.
function registrarCombo(save, armaId) {
  if (save.combos.includes(armaId)) return false;
  save.combos.push(armaId);
  return true;
}

// Arma travada achada (planeta ou baú de subchefe). Devolve quantas vezes já foi achada.
function registrarArmaAchada(save, armaId) {
  const a = save.stats.armasAchadas;
  a[armaId] = (a[armaId] || 0) + 1;
  return a[armaId];
}

// A arma travada já aparece nas cartas? (achada 3 vezes)
function armaLiberada(save, armaId) {
  return (save.stats.armasAchadas[armaId] || 0) >= _CQ.ACHADOS_PARA_LIBERAR;
}

// Marca as conquistas que acabaram de ser cumpridas. Devolve a lista das novas.
function verificarConquistas(save, agora) {
  const novas = [];
  _CQ.CONQUISTAS.forEach((c) => {
    if (save.conquistas[c.id]) return;
    if (c.cond(save)) { save.conquistas[c.id] = agora || 1; novas.push(c); }
  });
  return novas;
}

// Soma dos bônus permanentes das conquistas já desbloqueadas
function bonusDasConquistas(save) {
  const b = { dano: 0, vida: 0, regen: 0, area: 0, velocidade: 0, recarga: 0, coleta: 0, xp: 0, creditos: 0 };
  _CQ.CONQUISTAS.forEach((c) => {
    if (!save.conquistas[c.id] || c.premio.tipo !== 'bonus') return;
    Object.entries(c.premio.bonus).forEach(([k, v]) => { b[k] += v; });
  });
  return b;
}

if (typeof module !== 'undefined') {
  module.exports = { registrarCombo, registrarArmaAchada, armaLiberada, verificarConquistas, bonusDasConquistas };
}
