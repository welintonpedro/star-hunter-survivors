// E4/E5 — tabela dos 30 inimigos (RN-09, RN-10, RN-11 · CT-27, CT-28)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { INIMIGOS, INIMIGOS_POR_GALAXIA, ARTE_INIMIGOS } = require('../src/dados/inimigos.js');
const { pesosNoTempo } = require('../src/ritmo.js');

test('CT-28: 10 inimigos por galáxia, 30 no total, sem repetir comportamento', () => {
  assert.equal(INIMIGOS_POR_GALAXIA.length, 3);
  INIMIGOS_POR_GALAXIA.forEach((lista, gi) => assert.equal(lista.length, 10, 'galáxia ' + gi));
  const todos = INIMIGOS_POR_GALAXIA.flat();
  assert.equal(new Set(todos).size, 30, 'ids repetidos');
  const comps = todos.map((id) => INIMIGOS[id].comp);
  assert.equal(new Set(comps).size, 30, 'comportamentos repetidos: ' + comps.sort().join(','));
  ['perseguidor', 'rapido', 'tanque', 'atirador', 'kamikaze', 'divisor', 'escudo', 'teleporte', 'orbitador',
    'invocador', 'minador', 'laser', 'enxame', 'ladrao', 'curador'].forEach((c) => assert.ok(comps.includes(c), 'falta ' + c));
});

test('cada inimigo tem nome, números válidos e um desenho próprio bem formado', () => {
  const desenhos = new Set();
  Object.entries(INIMIGOS).forEach(([id, d]) => {
    assert.ok(d.nome, id);
    ['hp', 'speed', 'damage', 'reward', 'xp', 'radius', 'scale'].forEach((k) =>
      assert.ok(typeof d[k] === 'number' && d[k] >= 0, id + '.' + k));
    const arte = ARTE_INIMIGOS[d.arte || id];
    assert.ok(Array.isArray(arte) && arte.length >= 8, 'desenho de ' + id);
    const largura = arte[0].length;
    arte.forEach((linha, i) => assert.equal(linha.length, largura, id + ' linha ' + i));
    const letras = new Set(arte.join('').replace(/\./g, ''));
    letras.forEach((l) => assert.ok(d.cores[l], id + ' sem cor para a letra ' + l));
    if (!d.arte) desenhos.add(arte.join('|'));
  });
  assert.equal(desenhos.size, 30 + 2, 'cada inimigo (e os 2 filhotes) com desenho diferente');
});

test('CT-27: um inimigo novo entra mais ou menos a cada 3 min, na ordem da lista', () => {
  INIMIGOS_POR_GALAXIA.forEach((lista) => {
    const entradas = lista.map((id) => INIMIGOS[id].entra);
    assert.equal(entradas[0], 0);
    for (let i = 1; i < 10; i++) {
      assert.ok(entradas[i] > entradas[i - 1], 'fora de ordem');
      assert.ok(entradas[i] - entradas[i - 1] <= 200, 'intervalo grande demais');
    }
    assert.ok(entradas[9] <= 27 * 60);
  });
});

test('pesosNoTempo: só sorteia quem já entrou; o recém-chegado aparece mais', () => {
  const lista = INIMIGOS_POR_GALAXIA[0];
  const p0 = pesosNoTempo(lista, INIMIGOS, 10);
  assert.deepEqual(Object.keys(p0), [lista[0]]);
  const e3 = INIMIGOS[lista[3]].entra;
  const pNovo = pesosNoTempo(lista, INIMIGOS, e3 + 5);
  assert.ok(lista[3] in pNovo);
  assert.ok(!(lista[4] in pNovo));
  const pDepois = pesosNoTempo(lista, INIMIGOS, e3 + 400);
  assert.ok(pNovo[lista[3]] > pDepois[lista[3]], 'destaque do recém-chegado deve passar');
});
