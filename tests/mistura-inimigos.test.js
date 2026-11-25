// Mistura de inimigos (pedido do dono em 25/11/2026, RN-67)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { INIMIGOS, INIMIGOS_POR_GALAXIA } = require('../src/dados/inimigos.js');
const { pesosNoTempo } = require('../src/ritmo.js');
const { MISTURA_INIMIGOS, COMPORTAMENTOS_QUE_ATIRAM } = require('../src/dados/ondas.js');

const fracao = (pesos, id) => pesos[id] / Object.values(pesos).reduce((a, b) => a + b, 0);

test('RN-67: quando entram inimigos novos, os antigos aparecem menos (mas não somem)', () => {
  const lista = INIMIGOS_POR_GALAXIA[0], primeiro = lista[0];
  const cedo = pesosNoTempo(lista, INIMIGOS, INIMIGOS[lista[1]].entra + 200, MISTURA_INIMIGOS, COMPORTAMENTOS_QUE_ATIRAM);
  const tarde = pesosNoTempo(lista, INIMIGOS, 1790, MISTURA_INIMIGOS, COMPORTAMENTOS_QUE_ATIRAM);
  const semMistura = pesosNoTempo(lista, INIMIGOS, 1790);
  assert.ok(fracao(tarde, primeiro) < fracao(cedo, primeiro), 'o primeiro inimigo deveria ficar mais raro com o tempo');
  assert.ok(fracao(tarde, primeiro) < fracao(semMistura, primeiro));
  assert.ok(tarde[primeiro] >= INIMIGOS[primeiro].peso * MISTURA_INIMIGOS.pesoMinimo - 1e-9, 'não some de vez');
});

test('RN-67: inimigos que atiram de longe aparecem bem menos', () => {
  const atiradores = INIMIGOS_POR_GALAXIA.flat().filter((id) => COMPORTAMENTOS_QUE_ATIRAM.includes(INIMIGOS[id].comp));
  assert.ok(atiradores.length >= 3);
  INIMIGOS_POR_GALAXIA.forEach((lista) => {
    const com = pesosNoTempo(lista, INIMIGOS, 1790, MISTURA_INIMIGOS, COMPORTAMENTOS_QUE_ATIRAM);
    const sem = pesosNoTempo(lista, INIMIGOS, 1790, MISTURA_INIMIGOS, []);
    lista.filter((id) => atiradores.includes(id) && id in com).forEach((id) => assert.ok(Math.abs(com[id] - sem[id] * MISTURA_INIMIGOS.pesoAtiradores) < 1e-9, id));
  });
  assert.ok(MISTURA_INIMIGOS.danoTiroAtiradores < 1, 'tiro de inimigo comum dói menos');
});
