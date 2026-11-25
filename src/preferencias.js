// ============ CONFIGURAÇÕES DO JOGADOR (volume, efeitos) ============
// Ficam numa chave separada do save, para não mudar o formato do save (RN-42).
const PREFS_KEY = 'star_hunter_survivors_config_v1';

function lerPrefs() {
  const padrao = { volume: 0.7, efeitosReduzidos: false };
  try {
    const bruto = STORAGE && JSON.parse(STORAGE.getItem(PREFS_KEY) || 'null');
    if (!bruto || typeof bruto !== 'object') return padrao;
    const v = Number(bruto.volume);
    return {
      volume: Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : padrao.volume,
      efeitosReduzidos: bruto.efeitosReduzidos === true
    };
  } catch (e) { return padrao; }
}
const PREFS = lerPrefs();

function salvarPrefs() {
  try { if (STORAGE) STORAGE.setItem(PREFS_KEY, JSON.stringify(PREFS)); } catch (e) { /* sem espaço: ignora */ }
}
// Aplica o volume em todos os sons do jogo (quando os sons existirem)
function aplicarPrefs(jogo) {
  if (jogo && jogo.sound) jogo.sound.volume = PREFS.volume;
}
