// Ajustes pedidos pelo dono em 25/11/2026 depois de testar o Bloco 1:
// buraco negro que cresce e não dá recompensa, nave virando para onde anda.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
async function esperarJogo(pagina, s) {
  const t0 = await G(pagina, () => game.scene.getScene('Game').elapsed);
  await pagina.waitForFunction((a) => game.scene.getScene('Game').elapsed >= a, { timeout: 40000 }, t0 + s);
}
async function partida() {
  const j = await abrirJogo({ busca: 'teste=1' });
  await esperarCena(j.pagina, 'Hangar');
  await G(j.pagina, () => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
  await esperarCena(j.pagina, 'Game');
  await G(j.pagina, () => {
    const g = game.scene.getScene('Game'); g.ritmoParado = true; g.mods.maxHp = 1e9; g.hp = 1e9;
    g.enemies.children.iterate((e) => { if (e && e.active) e.disableBody(true, true); });
    g.weapons.forEach((w) => { w.timer = 1e9; });
  });
  return j;
}

test('buraco negro engole inimigos sem dar XP nem créditos e cresce a cada um', async () => {
  const { pagina, erros, fechar } = await partida();
  try {
    const antes = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      const bh = g.pois.find((p) => p.type === 'blackhole');
      g.player.setPosition(bh.x + 1200, bh.y); g.aproximarTudo();
      for (let i = 0; i < 12; i++) g.spawnEnemy('bug', bh.x + Math.cos(i) * 60, bh.y + Math.sin(i) * 60);
      window.__bh = bh;
      return { escala: bh.img.scaleX, abates: g.kills, creditos: g.runCredits };
    });
    await esperarJogo(pagina, 2);
    const depois = await G(pagina, () => {
      const g = game.scene.getScene('Game'), bh = window.__bh;
      let gemas = 0; g.gems.children.iterate((o) => { if (o && o.active && Math.hypot(o.x - bh.x, o.y - bh.y) < 300) gemas++; });
      return { massa: bh.massa, escala: bh.img.scaleX, abates: g.kills, creditos: g.runCredits, gemas };
    });
    assert.ok(depois.massa >= 8, 'deveria ter engolido os inimigos: ' + depois.massa);
    assert.ok(depois.escala > antes.escala, 'deveria ter crescido');
    assert.equal(depois.abates, antes.abates, 'engolido não conta como abate');
    assert.equal(depois.creditos, antes.creditos, 'engolido não dá créditos');
    assert.equal(depois.gemas, 0, 'engolido não solta gema');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('sem inimigos, a frente da nave vira para o lado em que ela anda', async () => {
  const { pagina, erros, fechar } = await partida();
  try {
    await pagina.keyboard.down('KeyD');
    await esperarJogo(pagina, 1);
    const direita = await G(pagina, () => game.scene.getScene('Game').player.rotation);
    await pagina.keyboard.up('KeyD');
    await pagina.keyboard.down('KeyS');
    await esperarJogo(pagina, 1);
    const baixo = await G(pagina, () => game.scene.getScene('Game').player.rotation);
    await pagina.keyboard.up('KeyS');
    const perto = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < 0.15;
    assert.ok(perto(direita, Math.PI / 2), 'indo para a direita: ' + direita);
    assert.ok(perto(baixo, Math.PI), 'indo para baixo: ' + baixo);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});
