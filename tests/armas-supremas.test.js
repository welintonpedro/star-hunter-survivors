// Armas supremas (pedido do dono em 25/11/2026, RN-66): carta rara dourada, muito fortes, sem combo
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const SUPREMAS = ['laser', 'chuva', 'trovao'];

async function partida() {
  const j = await abrirJogo({ busca: 'teste=1' });
  await esperarCena(j.pagina, 'Hangar');
  await G(j.pagina, () => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
  await esperarCena(j.pagina, 'Game');
  await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.ritmoParado = true; g.mods.maxHp = 1e9; g.hp = 1e9; });
  return j;
}

test('RN-66: as 3 supremas existem, não têm combo e não contam no total de combos', () => {
  const vm = require('vm'), fs = require('fs'), path = require('path'), ctx = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/dados/armas.js'), 'utf8') + ';this.W=WEAPONS;', ctx);
  const { TOTAL_COMBOS } = require('../src/dados/conquistas.js');
  SUPREMAS.forEach((id) => {
    const d = ctx.W[id];
    assert.ok(d && d.suprema, id);
    assert.equal(d.evo, undefined, id + ' sem combo');
    assert.equal(d.desc.length, 5);
  });
  assert.equal(Object.values(ctx.W).filter((d) => d.evo).length, TOTAL_COMBOS);
});

test('RN-66: suprema é rara nas cartas, pode sair em qualquer partida (fora do sorteio de 5) e a carta é dourada', async () => {
  const j = await partida();
  try {
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      const opcoes = g.upgradeOptions().filter((o) => o.kind === 'weapon' && o.level === 1);
      const sup = opcoes.filter((o) => WEAPONS[o.id].suprema), comum = opcoes.find((o) => !WEAPONS[o.id].suprema);
      const noSorteio = g.armasDaPartida.some((id) => WEAPONS[id].suprema);
      // carta de uma suprema
      g.openLevelUp();
      g.modal.parts.forEach((p) => p.destroy && p.destroy());
      g.modal = null;
      const partes = g.criarCarta({ kind: 'weapon', id: 'laser', level: 1 }, 0, W / 2, H / 2);
      const textos = partes.filter((p) => p.type === 'Text').map((p) => p.text);
      const bordas = g.children.list.filter((p) => p.type === 'Rectangle' && p.x === W / 2 && p.y === H / 2).map((p) => p.strokeColor);
      return { sup: sup.map((o) => [o.id, o.weight]), pesoComum: comum && comum.weight, noSorteio, textos, bordas };
    });
    assert.deepEqual(r.sup.map((x) => x[0]).sort(), ['chuva', 'laser', 'trovao']);
    r.sup.forEach(([id, w]) => assert.ok(w < r.pesoComum / 4, id + ' deveria ser rara'));
    assert.equal(r.noSorteio, false);
    assert.ok(r.textos.includes('ARMA SUPREMA'));
    assert.ok(r.bordas.includes(0xfde047), 'moldura dourada');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-66: Laser, Chuva de Meteoros e Tempestade Trovejante causam dano sem erro', async () => {
  const j = await partida();
  try {
    const danos = {};
    for (const id of SUPREMAS) {
      await G(j.pagina, (id) => {
        const g = game.scene.getScene('Game');
        g.enemies.children.iterate((e) => { if (e && e.active) e.disableBody(true, true); });
        window.__alvos = [];
        for (let k = 0; k < 3; k++) {
          g.spawnEnemy('g1_rastejador');
          let e = null; g.enemies.children.iterate((o) => { if (o && o.active && !window.__alvos.includes(o)) e = o; });
          e.body.reset(g.player.x + 150 + k * 25, g.player.y + (k - 1) * 4); e.hp = e.maxHp = 1e6; e.speedV = 0;
          window.__alvos.push(e);
        }
        const fn = { laser: 'fireLaser', chuva: 'fireChuva', trovao: 'fireTrovao' }[id];
        window.__disparou = g[fn](g.wstats({ id, level: 1 }));
      }, id);
      await esperar(1200);
      danos[id] = await G(j.pagina, () => ({ disparou: __disparou, atingidos: __alvos.filter((e) => e.hp < e.maxHp).length }));
    }
    SUPREMAS.forEach((id) => {
      assert.equal(danos[id].disparou, true, id);
      assert.ok(danos[id].atingidos >= 1, id + ' não acertou ninguém');
    });
    assert.ok(danos.laser.atingidos >= 3, 'o laser atravessa todos em linha');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
