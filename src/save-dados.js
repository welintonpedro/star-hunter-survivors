// ============ SAVE: LER, CORRIGIR E GRAVAR ============
// Funções sem dependência do navegador, para poderem ser testadas (tests/e1-save.test.js).
// O "storage" é o localStorage do navegador (ou null, quando o navegador não deixa salvar).

const SAVE_KEY = 'star_hunter_survivors_save_v1';
// Versão do formato do save. A v0.2 não tinha número (conta como 1).
// Ao mudar o formato no futuro, suba este número e converta em converterSave().
//   2 → save ganhou número de versão (E1)
//   3 → ganho offline removido: sai a melhoria "Drones de Coleta" (meta.idle) e o bestRate
//   4 → combos descobertos, conquistas e estatísticas entre partidas (E8, E9)
const SAVE_VERSION = 4;

// Estatísticas somadas entre partidas (usadas pelas conquistas)
function statsIniciais() {
  return {
    abates: 0, tempoTotal: 0, subchefes: 0, chefes: 0, nivelMax: 0, maiorSemDano: 0,
    melhorTempo: {},   // 'galáxia:nave' → segundos
    vitorias: {},      // 'galáxia:nave' → true
    locais: {},        // galáxia → lista dos locais já descobertos (índices)
    armasAchadas: {}   // arma travada → quantas vezes foi achada
  };
}

function saveInicial(agora) {
  return {
    versao: SAVE_VERSION, credits: 0, owned: { falcao: true }, cleared: [false, false, false],
    meta: { dmg: 0, hp: 0, rate: 0, magnet: 0 }, lastSeen: agora,
    combos: [], conquistas: {}, stats: statsIniciais()
  };
}
const _obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const _num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

// Número inteiro, nunca negativo; qualquer outra coisa vira 0
function inteiroPositivo(v) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

// Corrige valores impossíveis (save editado à mão, por exemplo) — CT-58
function corrigirSave(bruto, navesValidas, agora) {
  const s = saveInicial(agora);
  s.credits = inteiroPositivo(bruto.credits);

  const owned = bruto.owned && typeof bruto.owned === 'object' ? bruto.owned : {};
  navesValidas.forEach((id) => { if (owned[id] === true) s.owned[id] = true; });
  s.owned.falcao = true; // a primeira nave é sempre liberada

  const cleared = Array.isArray(bruto.cleared) ? bruto.cleared : [];
  s.cleared = s.cleared.map((_, i) => cleared[i] === true);

  const meta = bruto.meta && typeof bruto.meta === 'object' ? bruto.meta : {};
  Object.keys(s.meta).forEach((k) => { s.meta[k] = inteiroPositivo(meta[k]); });

  // combos descobertos: lista de ids de arma, sem repetir
  s.combos = Array.isArray(bruto.combos) ? [...new Set(bruto.combos.filter((c) => typeof c === 'string'))] : [];
  // conquistas: id → momento em que foi desbloqueada
  Object.entries(_obj(bruto.conquistas)).forEach(([k, v]) => { if (_num(v)) s.conquistas[k] = v; });
  // estatísticas
  const st = _obj(bruto.stats);
  ['abates', 'tempoTotal', 'subchefes', 'chefes', 'nivelMax', 'maiorSemDano'].forEach((k) => { s.stats[k] = _num(st[k]); });
  Object.entries(_obj(st.melhorTempo)).forEach(([k, v]) => { if (_num(v)) s.stats.melhorTempo[k] = v; });
  Object.entries(_obj(st.vitorias)).forEach(([k, v]) => { if (v === true) s.stats.vitorias[k] = true; });
  Object.entries(_obj(st.locais)).forEach(([k, v]) => {
    if (Array.isArray(v)) s.stats.locais[k] = [...new Set(v.filter((i) => Number.isInteger(i) && i >= 0))];
  });
  Object.entries(_obj(st.armasAchadas)).forEach(([k, v]) => { const n = inteiroPositivo(v); if (n) s.stats.armasAchadas[k] = n; });

  const visto = bruto.lastSeen;
  s.lastSeen = typeof visto === 'number' && Number.isFinite(visto) && visto <= agora ? visto : agora;
  return s;
}

// Converte formatos antigos para o atual. corrigirSave() depois completa o que faltar
// e descarta campos que não existem mais (como bestRate).
function converterSave(bruto) {
  const versao = typeof bruto.versao === 'number' ? bruto.versao : 1;
  const s = Object.assign({}, bruto);
  if (versao < 3) {
    // Devolve os créditos gastos em "Drones de Coleta" (custo do nível n = 120 × 1,6^n)
    const niveis = inteiroPositivo(s.meta && s.meta.idle);
    let devolver = 0;
    for (let n = 0; n < niveis; n++) devolver += Math.floor(120 * Math.pow(1.6, n));
    s.credits = inteiroPositivo(s.credits) + devolver;
  }
  return s;
}

// Devolve { save, status }. status: 'novo' | 'ok' | 'corrompido' | 'indisponivel'
function lerSave(storage, navesValidas, agora) {
  let texto;
  try {
    if (!storage) throw new Error('sem storage');
    texto = storage.getItem(SAVE_KEY);
  } catch (e) {
    return { save: saveInicial(agora), status: 'indisponivel' };
  }
  if (texto === null || texto === undefined) return { save: saveInicial(agora), status: 'novo' };

  let bruto = null;
  try { bruto = JSON.parse(texto); } catch (e) { bruto = null; }
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) {
    // Guarda uma cópia do save quebrado antes de o jogo gravar um novo por cima (CT-03)
    try { storage.setItem(SAVE_KEY + '_corrompido', texto); } catch (e) { /* ignora */ }
    return { save: saveInicial(agora), status: 'corrompido' };
  }
  return { save: corrigirSave(converterSave(bruto), navesValidas, agora), status: 'ok' };
}

// Grava o save. Devolve true se conseguiu.
function gravarSave(storage, save, agora) {
  save.lastSeen = agora;
  save.versao = SAVE_VERSION;
  try {
    if (!storage) return false;
    storage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch (e) {
    return false;
  }
}

if (typeof module !== 'undefined') {
  module.exports = { SAVE_KEY, SAVE_VERSION, saveInicial, statsIniciais, corrigirSave, lerSave, gravarSave };
}
