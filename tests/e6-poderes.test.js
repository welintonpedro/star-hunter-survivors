// E6 — poder exclusivo de cada nave (RN-19 a RN-23 · CT-33 a CT-38)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');

const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
async function esperarJogo(pagina, s) {
  const t0 = await G(pagina, () => game.scene.getScene('Game').elapsed);
  await pagina.waitForFunction((a) => game.scene.getScene('Game').elapsed >= a, { timeout: 40000 }, t0 + s);
}
async function partida(nave) {
  const j = await abrirJogo({ busca: 'teste=1' });
  await esperarCena(j.pagina, 'Hangar');
  await G(j.pagina, (n) => game.scene.getScene('Hangar').scene.start('Game', { ship: n }), nave);
  await esperarCena(j.pagina, 'Game');
  await G(j.pagina, () => {
    const g = game.scene.getScene('Game'); g.ritmoParado = true; g.mods.maxHp = 1e9; g.hp = 1e9;
    g.enemies.children.iterate((e) => { if (e && e.active) e.disableBody(true, true); });
  });
  return j;
}
const PODERES = ['rajada', 'martelo', 'agulhas'];

for (let n = 0; n < 3; n++) {
  test('CT-33/34: a nave ' + (n + 1) + ' começa com o poder dela e nunca vê o poder das outras nas cartas', async () => {
    const { pagina, erros, fechar } = await partida(n);
    try {
      const r = await G(pagina, (podr) => {
        const g = game.scene.getScene('Game');
        const vistos = new Set();
        // simula 200 sorteios de cartas, subindo armas e itens no caminho
        for (let k = 0; k < 200; k++) {
          const ops = g.upgradeOptions();
          ops.forEach((o) => { if (o.kind === 'weapon') vistos.add(o.id); });
          if (k % 7 === 0 && ops.length) g.applyOption(ops[k % ops.length]);
        }
        return { primeiro: g.weapons[0].id, outros: podr.filter((p) => p !== g.weapons[0].id && vistos.has(p)) };
      }, PODERES);
      assert.equal(r.primeiro, PODERES[n]);
      assert.deepEqual(r.outros, []);
      assert.deepEqual(erros, []);
    } finally { await fechar(); }
  });
}

test('CT-35: "melhorar o poder" aparece nas cartas até o nível 5 e some depois', async () => {
  const { pagina, erros, fechar } = await partida(0);
  try {
    const r = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      const tem = () => g.upgradeOptions().some((o) => o.kind === 'weapon' && o.id === 'rajada');
      const antes = tem();
      while (g.weapons[0].level < 5) g.addWeapon('rajada');
      return { antes, depois: tem(), nivel: g.weapons[0].level };
    });
    assert.deepEqual(r, { antes: true, depois: false, nivel: 5 });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-36/37: poder no nível 5 evolui no baú só com o item certo', async () => {
  const { pagina, erros, fechar } = await partida(1);
  try {
    const r = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      while (g.weapons[0].level < 5) g.addWeapon('martelo');
      const semItem = g.evolvable().map((w) => w.id);
      g.addPassive('armor');
      const comItem = g.evolvable().map((w) => w.id);
      g.openChest(); g.modalPick(0); g.revelarBaus(0); g.modalPick(0);
      return { semItem, comItem, evoluiu: g.weapons[0].evolved };
    });
    assert.deepEqual(r.semItem, []);
    assert.deepEqual(r.comItem, ['martelo']);
    assert.equal(r.evoluiu, true);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-38: o card de cada nave no hangar mostra o poder', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const textos = await G(j.pagina, () => game.scene.getScene('Hangar').children.list.filter((o) => o.type === 'Text').map((o) => o.text).join(' | '));
    ['Rajada Falcão', 'Martelo Gravitacional', 'Enxame de Agulhas'].forEach((p) => assert.ok(textos.includes(p), p));
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('os 3 poderes ferem; a Rajada ricocheteia e o Martelo atordoa', async () => {
  for (let n = 0; n < 3; n++) {
    const { pagina, erros, fechar } = await partida(n);
    try {
      await G(pagina, () => {
        const g = game.scene.getScene('Game');
        window.__alvos = [0, 1, 2].map((i) => {
          const e = g.spawnEnemy('bug', g.player.x + 110 + i * 45, g.player.y + (i - 1) * 30);
          e.hp = e.maxHp = 1e9; e.speedV = 0; return e;
        });
      });
      await esperarJogo(pagina, 3);
      const r = await G(pagina, () => ({
        feridos: window.__alvos.filter((e) => e.hp < e.maxHp).length,
        atordoou: window.__alvos.some((e) => e.atordoamentos > 0)
      }));
      assert.ok(r.feridos >= (n === 0 ? 2 : 1), 'nave ' + n + ' feriu ' + r.feridos);
      if (n === 1) assert.ok(r.atordoou, 'o Martelo deveria atordoar');
      assert.deepEqual(erros, []);
    } finally { await fechar(); }
  }
});
