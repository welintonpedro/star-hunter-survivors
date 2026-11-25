// Baú com 3 escolhas ocultas (pedido do dono em 25/11/2026). Desde a RN-55 a arma achada vira só pista (ok do dono em 25/11).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
async function partida() {
  const j = await abrirJogo({ busca: 'teste=1' });
  await esperarCena(j.pagina, 'Hangar');
  await G(j.pagina, () => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
  await esperarCena(j.pagina, 'Game');
  await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.ritmoParado = true; g.mods.maxHp = 1e9; g.hp = 1e9; });
  return j;
}

test('baú mostra 3 baús fechados; o escolhido abre com animação e dá a recompensa sorteada dele', async () => {
  const j = await partida();
  try {
    await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.openChest(); window.__antes = JSON.stringify([g.weapons, g.passives]); g.modalPick(1); });
    const durante = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      return { fase: g.modal.fase, baus: g.modal.baus.length, raridades: g.modal.conteudos.map((c) => c.raridade) };
    });
    assert.equal(durante.baus, 3);
    assert.equal(durante.fase, 'abrindo');
    durante.raridades.forEach((r) => assert.ok(['comum', 'raro', 'epico'].includes(r)));
    await j.pagina.waitForFunction(() => game.scene.getScene('Game').modal.fase === 'revelado', { timeout: 10000 });
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      const textos = g.modal.parts.filter((p) => p.type === 'Text').map((p) => p.text);
      const mudou = JSON.stringify([g.weapons, g.passives]) !== window.__antes;
      const aberto = g.modal.baus[1].bau.texture.key;
      g.modalPick(0);
      return { textos, mudou, aberto, fechou: !g.modal };
    });
    assert.equal(r.aberto, 'chest_aberto');
    assert.ok(r.mudou, 'a recompensa deveria melhorar algo');
    assert.ok(r.textos.filter((t) => t.startsWith('tinha:')).length === 2, 'os outros dois mostram o que tinham');
    assert.equal(r.fechou, true);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('com combo pronto, qualquer baú escolhido evolui a arma', async () => {
  const j = await partida();
  try {
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      while (g.weapons[0].level < 5) g.addWeapon('rajada');
      g.addPassive('engine');
      g.openChest(); g.modalPick(2); g.revelarBaus(2); g.modalPick(0);
      return g.weapons[0].evolved;
    });
    assert.equal(r, true);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-55: arma travada achada só conta pista (1/3); a arma não entra no inventário', async () => {
  const j = await partida();
  try {
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      SAVE.stats.armasAchadas = {};
      const antes = g.weapons.map((w) => w.id).join(',');
      g.contarArmaAchada('disc');
      return { antes, depois: g.weapons.map((w) => w.id).join(','), pistas: SAVE.stats.armasAchadas.disc, modal: !!g.modal };
    });
    assert.equal(r.depois, r.antes, 'achar não pode dar a arma');
    assert.equal(r.pistas, 1);
    assert.equal(r.modal, false, 'sem tela de troca');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
