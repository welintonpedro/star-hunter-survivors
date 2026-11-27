// Estatísticas para o Poki (RN-87): PokiSDK.measure(categoria, item, ação)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// liga um measure de mentira no PokiSDK de mentira e devolve o que foi anotado
const ligarMedidas = (pagina) => pagina.evaluate(() => { window.__medidas = []; window.PokiSDK.measure = (...a) => window.__medidas.push(a.join('/')); });
const medidas = async (pagina) => { await esperar(150); return pagina.evaluate(() => window.__medidas); };

test('RN-87: avisa ao Poki começo e fim da partida, chefe derrotado e combo descoberto', async () => {
  const j = await abrirJogo({ poki: {} });
  try {
    await esperarCena(j.pagina, 'Hangar');
    await ligarMedidas(j.pagina);
    await j.pagina.evaluate(() => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(j.pagina, 'Game');
    assert.deepEqual(await medidas(j.pagina), ['partida/campanha_g1/start']);

    await j.pagina.evaluate(() => {
      const g = game.scene.getScene('Game');
      g.hp = 1e9; g.mods.maxHp = 1e9;
      g.spawnBoss(0); g.onBossDefeated(g.boss);
      // combo: arma no máximo + item certo, abre o baú
      const w = { id: 'rajada', level: MAX_WEAPON_LEVEL, evolved: false, timer: 1 };
      g.weapons.length = 0; g.weapons.push(w);
      g.passives = { [WEAPONS.rajada.evo]: 1 };
      g.pendingChests = 1; g.openNextModal();
      g.modalPick(0);   // escolhe um baú: com arma no máximo + item certo, vem o combo
    });
    await esperar(2500);   // o baú abre com animação
    await j.pagina.evaluate(() => game.scene.getScene('Game').endRun('dead'));
    const m = await medidas(j.pagina);
    assert.ok(m.includes('chefe/g1_chefe1/complete'), JSON.stringify(m));
    assert.ok(m.includes('combo/rajada/discovered'), JSON.stringify(m));
    assert.equal(m[m.length - 1], 'partida/campanha_g1/fail');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-87: prólogo avisa começo e se foi visto até o fim ou pulado', async () => {
  const j = await abrirJogo({ poki: {}, prologo: true });
  try {
    await esperarCena(j.pagina, 'Game');
    await ligarMedidas(j.pagina);
    await j.pagina.evaluate(() => game.scene.getScene('Game').terminarPrologo());   // apertou PULAR HISTÓRIA
    assert.deepEqual(await medidas(j.pagina), ['prologo/historia/skip']);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-87: sem o Poki (GitHub Pages) as estatísticas não fazem nada e não dão erro', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    await j.pagina.evaluate(() => { pokiMedir('partida', 'x', 'start'); game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }); });
    await esperarCena(j.pagina, 'Game');
    await esperar(300);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
