// E3 — matemática do mapa que dá a volta (RN-13, RN-15, RN-17, RN-18 · CT-16, CT-20, CT-25)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { envolver, aproximar, retangulosNoMinimapa } = require('../src/mundo.js');

const T = 17000;

test('envolver: qualquer coordenada volta para dentro do mapa', () => {
  assert.equal(envolver(100, T), 100);
  assert.equal(envolver(17100, T), 100);
  assert.equal(envolver(-100, T), 16900);
  assert.equal(envolver(3 * T + 5, T), 5);
});

test('aproximar: um objeto do outro lado da emenda aparece do lado mais perto da nave', () => {
  assert.equal(aproximar(100, 16950, T), 17100);   // nave na borda direita, objeto logo depois da emenda
  assert.equal(aproximar(16900, 50, T), -100);     // nave na borda esquerda
  assert.equal(aproximar(500, 600, T), 500);       // perto: não mexe
  assert.equal(aproximar(100, 16950 + 2 * T, T), 100 + 3 * T); // nave já deu duas voltas
});

test('aproximar: o objeto nunca fica a mais de meio mapa da nave', () => {
  for (let i = 0; i < 200; i++) {
    const ref = (Math.random() - 0.5) * 10 * T, v = (Math.random() - 0.5) * 10 * T;
    assert.ok(Math.abs(aproximar(v, ref, T) - ref) <= T / 2 + 1e-6);
  }
});

test('CT-25: a moldura da tela no minimapa é cortada na emenda, sem sair do quadro', () => {
  const S = 150;
  assert.deepEqual(retangulosNoMinimapa(10, 10, 8, 5, S), [{ x: 10, y: 10, w: 8, h: 5 }]);
  const partes = retangulosNoMinimapa(146, 10, 8, 5, S);
  assert.deepEqual(partes, [{ x: 146, y: 10, w: 4, h: 5 }, { x: 0, y: 10, w: 4, h: 5 }]);
  const canto = retangulosNoMinimapa(147, 148, 8, 5, S);
  assert.equal(canto.length, 4);
  canto.forEach((r) => assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= S && r.y + r.h <= S));
  assert.equal(canto.reduce((s, r) => s + r.w * r.h, 0), 8 * 5);
});
