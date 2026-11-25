// E1 — o jogo abre no navegador e funciona igual à v0.2 (CT-01, CA-01, CA-05)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');

test('CT-01: o jogo abre, chega ao hangar e inicia uma partida sem erros', async () => {
  const { pagina, erros, fechar } = await abrirJogo();
  try {
    await esperarCena(pagina, 'Hangar');
    await pagina.evaluate(() => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(pagina, 'Game');
    await new Promise((r) => setTimeout(r, 2500));
    const estado = await pagina.evaluate(() => {
      const g = game.scene.getScene('Game');
      return { tempo: g.elapsed, armas: g.weapons.length, vida: g.hp, nave: g.ship.id };
    });
    assert.equal(estado.nave, 'falcao');
    assert.ok(estado.tempo > 0.5, 'o relógio da partida deveria andar');
    assert.ok(estado.armas >= 1, 'a nave deveria começar com uma arma');
    assert.ok(estado.vida > 0);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CA-05: as 3 naves e as 3 galáxias continuam existindo, com Falcão liberada no começo', async () => {
  const { pagina, erros, fechar } = await abrirJogo();
  try {
    await esperarCena(pagina, 'Hangar');
    const dados = await pagina.evaluate(() => ({
      naves: SHIPS.map((s) => s.id), galaxias: GALAXIES.length, falcao: !!SAVE.owned.falcao, semAuto: typeof AUTO_REWARD_MULT === 'undefined'
    }));
    assert.deepEqual(dados.naves, ['falcao', 'tita', 'agulha']);
    assert.equal(dados.galaxias, 3);
    assert.equal(dados.falcao, true);
    assert.equal(dados.semAuto, true, 'modo AUTO removido a pedido do dono (25/11)');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});
