// ============ SAVE ============
function defaultSave() {
  return { credits: 0, owned: { falcao: true }, cleared: [false, false, false],
    meta: { dmg: 0, hp: 0, rate: 0, magnet: 0, idle: 0 }, bestRate: [0, 0, 0], lastSeen: Date.now() };
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw), d = defaultSave();
      return Object.assign(d, s, { meta: Object.assign(d.meta, s.meta || {}) });
    }
  } catch (e) { /* sem localStorage */ }
  return defaultSave();
}
function writeSave(s) {
  s.lastSeen = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* ignora */ }
}
let SAVE = loadSave();
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

