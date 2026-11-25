// Evolução que dura a partida toda (pedido do dono em 25/11/2026):
// a XP fica mais cara a cada nível e, com tudo no máximo, aparecem cartas de Sobrecarga sem fim.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { xpParaProximoNivel, SOBRECARGAS } = require('../src/dados/progressao.js');
const { ONDAS } = require('../src/dados/ondas.js');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);

const xpAte = (nivel) => { let s = 0; for (let n = 1; n < nivel; n++) s += xpParaProximoNivel(n); return s; };

test('cada nível custa mais XP que o anterior', () => {
  for (let n = 1; n < 60; n++) assert.ok(xpParaProximoNivel(n + 1) > xpParaProximoNivel(n));
});

test('chegar ao nível 19 custa mais que na curva antiga (que deixava tudo no máximo aos 9 min)', () => {
  let antiga = 0, prox = 6;
  for (let n = 1; n < 19; n++) { antiga += prox; prox = Math.floor(prox * 1.22 + 3); }
  assert.ok(xpAte(19) >= antiga * 1.25, 'nova ' + xpAte(19) + ' x antiga ' + antiga);
});

test('as sobrecargas têm nome, texto, ícone e valor', () => {
  Object.values(SOBRECARGAS).forEach((d) => {
    assert.ok(d.nome && d.desc && d.icone);
    assert.ok(d.valor > 0);
  });
});

test('o começo tem mais inimigos que antes e o fim tem muitos', () => {
  assert.ok(ONDAS[0].min >= 10);
  assert.ok(ONDAS[5].min >= 25);
  assert.ok(ONDAS[29].max >= 200);
});

test('com tudo no máximo, as cartas viram Sobrecarga e a escolhida melhora a nave', async () => {
  const j = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    await G(j.pagina, () => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(j.pagina, 'Game');
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.ritmoParado = true;
      // força o "tudo no máximo": nenhuma carta normal sobra
      g.upgradeOptions = () => [];
      const antes = g.mods.dmg;
      g.openLevelUp();
      const tipos = g.modal.options.map((o) => o.kind);
      const textos = g.modal.parts.filter((p) => p.type === 'Text').map((p) => p.text);
      g.modal.options[0] = { kind: 'sobrecarga', id: 'dano', level: 1, weight: 1 };
      g.modalPick(0);
      return { tipos, textos, antes, depois: g.mods.dmg, nivelDano: g.sobrecargas.dano };
    });
    assert.equal(r.tipos.length, 3);
    r.tipos.forEach((t) => assert.equal(t, 'sobrecarga'));
    assert.ok(r.textos.includes('SOBRECARGA'));
    assert.equal(r.nivelDano, 1);
    assert.ok(Math.abs(r.depois / r.antes - 1.06) < 0.001, 'dano deveria subir 6%');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
