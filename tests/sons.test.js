// Sons gerados por código (pedido do dono em 25/11/2026, RN-60)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');

test('RN-60: cada som monta notas no navegador, respeita o intervalo mínimo e nunca dá erro', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const r = await j.pagina.evaluate(() => {
      const ctx = new AudioContext();
      let osciladores = 0;
      const criar = ctx.createOscillator.bind(ctx);
      ctx.createOscillator = () => { osciladores++; return criar(); };
      const cena = { sound: { context: ctx, masterVolumeNode: ctx.destination, locked: false } };
      const nomes = Object.keys(SONS).concat(Object.keys(MELODIAS));
      const porSom = {};
      nomes.forEach((n) => { const a = osciladores; tocarSom(cena, n); porSom[n] = osciladores - a; });
      const antes = osciladores; tocarSom(cena, 'tiro'); tocarSom(cena, 'tiro');
      const repetido = osciladores - antes;
      tocarSom(null, 'tiro'); tocarSom(cena, 'nao_existe');
      tocarSom({ sound: { locked: true } }, 'tiro');
      return { nomes, porSom, repetido };
    });
    ['tiro', 'explosao', 'gema', 'dano', 'chefe', 'nivel', 'bau', 'conquista', 'moeda', 'meteoro'].forEach((n) => assert.ok(r.nomes.includes(n), n));
    Object.entries(r.porSom).forEach(([n, q]) => assert.ok(q >= 1, n + ' não tocou'));
    assert.equal(r.repetido, 0, 'tiro repetido na mesma hora deve ser ignorado');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-60: jogar com os sons ligados não gera erro', async () => {
  const j = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    await j.pagina.evaluate(() => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(j.pagina, 'Game');
    await j.pagina.evaluate(() => { const g = game.scene.getScene('Game'); g.openLevelUp(); g.modalPick(0); g.hurt(1); });
    await new Promise((r) => setTimeout(r, 1500));
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
