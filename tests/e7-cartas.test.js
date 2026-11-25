// E7 — cartas com ícone grande e painel de ícones (RN-24 a RN-26, RN-29 · CT-39 a CT-42)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);

async function partida(nave = 0) {
  const j = await abrirJogo({ busca: 'teste=1' });
  await esperarCena(j.pagina, 'Hangar');
  await G(j.pagina, (n) => game.scene.getScene('Hangar').scene.start('Game', { ship: n }), nave);
  await esperarCena(j.pagina, 'Game');
  await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.ritmoParado = true; });
  return j;
}

test('CT-39: cada carta tem um ícone grande, nome e efeito curto, sem nenhuma dica de combo', async () => {
  const { pagina, erros, fechar } = await partida();
  try {
    const r = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      const vistas = [];
      for (let k = 0; k < 15; k++) {
        g.openLevelUp();
        const partes = g.modal.parts.flatMap((p) => (p.bg ? [p.bg, p.txt] : [p]));
        vistas.push({
          icones: partes.filter((p) => p.type === 'Image' && p.displayWidth >= 70).map((p) => p.texture.key),
          textos: partes.filter((p) => p.type === 'Text').map((p) => p.text).join(' | ')
        });
        g.modalPick(0);
      }
      return vistas;
    });
    r.forEach((v) => {
      assert.ok(v.icones.length >= 2, 'cada carta precisa de um ícone grande');
      assert.ok(!/combo/i.test(v.textos), 'carta não pode falar de combo: ' + v.textos);
    });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-40: o mesmo ícone aparece na carta e no painel do canto', async () => {
  const { pagina, erros, fechar } = await partida();
  try {
    const r = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      const o = { kind: 'weapon', id: 'pulsar', level: 1, weight: 1 };
      const carta = g.criarCarta(o, 0, 300, 300);
      const naCarta = carta.filter((p) => p.type === 'Image').map((p) => p.texture.key);
      carta.forEach((p) => p.destroy());
      g.addWeapon('pulsar');
      const noPainel = g.invItems.filter((p) => p.type === 'Image').map((p) => p.texture.key);
      return { naCarta, noPainel };
    });
    assert.ok(r.naCarta.includes('icone_pulsar'));
    assert.ok(r.noPainel.includes('icone_pulsar'));
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-29/RN-29: depois de um combo, o painel mostra [arma] + [item] = [evolução]', async () => {
  const { pagina, erros, fechar } = await partida();
  try {
    const r = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      while (g.weapons[0].level < 5) g.addWeapon('rajada');
      g.addPassive('engine');
      g.openChest(); g.modalPick(0); g.revelarBaus(0);
      const noBau = g.modal.parts.filter((p) => p.type === 'Image').map((p) => p.texture.key);
      g.modalPick(0);
      const noPainel = g.invItems.filter((p) => p.type === 'Image').map((p) => p.texture.key);
      return { noBau, noPainel };
    });
    ['icone_rajada', 'icone_engine', 'icone_evo_rajada'].forEach((k) => {
      assert.ok(r.noBau.includes(k), 'baú sem ' + k);
      assert.ok(r.noPainel.includes(k), 'painel sem ' + k);
    });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-42: tocar duas vezes rápido na carta escolhe uma vez só', async () => {
  const { pagina, erros, fechar } = await partida();
  try {
    const r = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      g.openLevelUp();
      const antes = JSON.stringify([g.weapons.map((w) => w.id + w.level), g.passives]);
      g.modalPick(0); const depois1 = JSON.stringify([g.weapons.map((w) => w.id + w.level), g.passives]);
      g.modalPick(0); const depois2 = JSON.stringify([g.weapons.map((w) => w.id + w.level), g.passives]);
      return { mudou: antes !== depois1, igual: depois1 === depois2 };
    });
    assert.deepEqual(r, { mudou: true, igual: true });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});
