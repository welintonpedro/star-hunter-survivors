// ============ SAVE (no navegador) ============
// A lógica de ler, corrigir e gravar fica em save-dados.js.

// O localStorage pode não existir ou dar erro (navegador que bloqueia dados de sites)
function obterStorage() {
  try {
    const s = window.localStorage;
    const k = '__sh_teste__';
    s.setItem(k, '1'); s.removeItem(k);
    return s;
  } catch (e) {
    return null;
  }
}
const STORAGE = obterStorage();
const LEITURA_SAVE = lerSave(STORAGE, SHIPS.map((s) => s.id), Date.now());
let SAVE = LEITURA_SAVE.save;

// Aviso mostrado uma única vez por sessão no hangar (RN-43, CT-03, CT-04)
const AVISO_SAVE = {
  texto: LEITURA_SAVE.status === 'indisponivel'
    ? 'Este navegador não deixa o jogo guardar dados: seu progresso não será salvo.'
    : LEITURA_SAVE.status === 'corrompido'
      ? 'O save anterior não pôde ser lido. Uma cópia foi guardada e o jogo começou do zero.'
      : null,
  mostrado: false
};

function writeSave(s) { gravarSave(STORAGE, s, Date.now()); }
window.addEventListener('beforeunload', () => writeSave(SAVE));

function idleRatePerMin() {
  let rate = 0;
  SHIPS.forEach((sh) => { if (SAVE.owned[sh.id]) rate += SAVE.bestRate[sh.galaxy] || 0; });
  return rate * OFFLINE_EFFICIENCY * (1 + SAVE.meta.idle * 0.25);
}
function computeOffline() {
  const now = Date.now();
  const mins = Math.min(OFFLINE_CAP_HOURS * 60, Math.max(0, (now - (SAVE.lastSeen || now)) / 60000));
  if (mins < 1) return { mins: 0, credits: 0 };
  return { mins, credits: Math.floor(idleRatePerMin() * mins) };
}
