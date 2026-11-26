// Naves com nomes de estrelas da sua galáxia (pedido do dono em 26/11/2026, RN-70)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ARENA } = require('../src/dados/modos.js');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');

const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/dados/naves.js'), 'utf8') + ';this.S=SHIPS;', ctx);

test('RN-70: as naves do jogador se chamam Altair, Antares e Rigel (ids do save iguais)', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.S.map((s) => [s.id, s.name]))), [['falcao', 'Altair'], ['tita', 'Antares'], ['agulha', 'Rigel']]);
});

test('RN-70: cada galáxia tem sua lista de estrelas para os rivais, sem repetir nomes nem usar os das suas naves', () => {
  const minhas = ctx.S.map((s) => s.name), todos = ARENA.nomesPorGalaxia.flat();
  assert.equal(ARENA.nomesPorGalaxia.length, 3);
  ARENA.nomesPorGalaxia.forEach((l) => assert.ok(l.length >= ARENA.rivais, 'nomes suficientes para todos os rivais'));
  assert.equal(new Set(todos).size, todos.length, 'nenhum nome repetido');
  minhas.forEach((n) => assert.ok(!todos.includes(n), n));
});

test('RN-70: na arena da Cinturão Rubro (Antares), os rivais têm nomes daquela galáxia', async () => {
  const j = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    await j.pagina.evaluate(() => game.scene.getScene('Hangar').scene.start('Game', { ship: 1, modo: 'arena' }));
    await esperarCena(j.pagina, 'Game');
    const nomes = await j.pagina.evaluate(() => game.scene.getScene('Game').rivais.map((r) => r.nomeRival));
    assert.equal(nomes.length, 9);
    nomes.forEach((n) => assert.ok(ARENA.nomesPorGalaxia[1].includes(n), n));
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
