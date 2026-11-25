// E1 — modo de teste para avançar o relógio da partida (RN-45 · CT-05, CT-06)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { modoTesteAtivo, tempoAlvo, contadoresNoTempo } = require('../src/modo-teste.js');

test('CT-05: o modo de teste só liga com ?teste=1 no link', () => {
  assert.equal(modoTesteAtivo(''), false);
  assert.equal(modoTesteAtivo('?teste=0'), false);
  assert.equal(modoTesteAtivo('?outra=1'), false);
  assert.equal(modoTesteAtivo('?teste=1'), true);
  assert.equal(modoTesteAtivo('?x=2&teste=1'), true);
});

test('CT-06: o relógio avança, mas nunca volta para trás', () => {
  assert.equal(tempoAlvo(10, 595), 595);
  assert.equal(tempoAlvo(700, 595), 700);
  assert.equal(tempoAlvo(10, -5), 10);
});

test('CT-06: ao pular o tempo, os eventos que ficaram para trás não disparam todos de uma vez', () => {
  const ritmos = { ring: 40, swarm: 50, elite: 60 };
  assert.deepEqual(contadoresNoTempo(595, ritmos), { ringCount: 14, swarmCount: 11, eliteCount: 9 });
  assert.deepEqual(contadoresNoTempo(0, ritmos), { ringCount: 0, swarmCount: 0, eliteCount: 0 });
});
