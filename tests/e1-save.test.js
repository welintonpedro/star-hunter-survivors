// E1 — save com número de versão, save corrompido e navegador sem localStorage
// Regras: RN-42, RN-43, RN-44 · Casos: CT-02, CT-03, CT-04, CT-58
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SAVE_KEY, SAVE_VERSION, lerSave, gravarSave } = require('../src/save-dados.js');

const NAVES = ['falcao', 'tita', 'agulha'];
const AGORA = 1_800_000_000_000;

// Imita o localStorage do navegador
function storageFalso(inicial = {}) {
  const dados = { ...inicial };
  return {
    dados,
    getItem: (k) => (k in dados ? dados[k] : null),
    setItem: (k, v) => { dados[k] = String(v); },
    removeItem: (k) => { delete dados[k]; }
  };
}

test('primeira vez: save novo, só a Falcão liberada, com número de versão', () => {
  const { save, status } = lerSave(storageFalso(), NAVES, AGORA);
  assert.equal(status, 'novo');
  assert.equal(save.credits, 0);
  assert.deepEqual(save.owned, { falcao: true });
  assert.equal(save.versao, SAVE_VERSION);
});

test('CT-02: save sem número de versão mantém créditos, naves e melhorias e ganha versão', () => {
  const antigo = {
    credits: 1500, owned: { falcao: true, tita: true }, cleared: [true, false, false],
    meta: { dmg: 1, hp: 1, rate: 1, magnet: 0 }, lastSeen: AGORA - 60000
  };
  const st = storageFalso({ [SAVE_KEY]: JSON.stringify(antigo) });
  const { save, status } = lerSave(st, NAVES, AGORA);
  assert.equal(status, 'ok');
  assert.equal(save.credits, 1500);
  assert.deepEqual(save.owned, { falcao: true, tita: true });
  assert.deepEqual(save.cleared, [true, false, false]);
  assert.deepEqual(save.meta, { dmg: 1, hp: 1, rate: 1, magnet: 0 });
  assert.equal(save.lastSeen, AGORA - 60000);
  assert.equal(save.versao, SAVE_VERSION);
});

test('CT-02: depois de gravar, o save guardado tem número de versão', () => {
  const st = storageFalso();
  const { save } = lerSave(st, NAVES, AGORA);
  save.credits = 77;
  assert.equal(gravarSave(st, save, AGORA + 5), true);
  const guardado = JSON.parse(st.dados[SAVE_KEY]);
  assert.equal(guardado.versao, SAVE_VERSION);
  assert.equal(guardado.credits, 77);
  assert.equal(guardado.lastSeen, AGORA + 5);
});

test('CT-03: save corrompido não trava, volta ao começo e guarda uma cópia do original', () => {
  const st = storageFalso({ [SAVE_KEY]: '{isto não é json' });
  const { save, status } = lerSave(st, NAVES, AGORA);
  assert.equal(status, 'corrompido');
  assert.equal(save.credits, 0);
  assert.equal(st.dados[SAVE_KEY + '_corrompido'], '{isto não é json');
});

test('CT-03: save que é JSON válido mas não é um save (null, número, lista) conta como corrompido', () => {
  for (const texto of ['null', '42', '[1,2]', '"oi"']) {
    const { status } = lerSave(storageFalso({ [SAVE_KEY]: texto }), NAVES, AGORA);
    assert.equal(status, 'corrompido', texto);
  }
});

test('CT-04: sem localStorage o jogo roda com save novo e não quebra ao gravar', () => {
  const quebrado = {
    getItem() { throw new Error('bloqueado'); },
    setItem() { throw new Error('bloqueado'); },
    removeItem() { throw new Error('bloqueado'); }
  };
  for (const st of [null, undefined, quebrado]) {
    const { save, status } = lerSave(st, NAVES, AGORA);
    assert.equal(status, 'indisponivel');
    assert.equal(save.credits, 0);
    assert.equal(gravarSave(st, save, AGORA), false);
  }
});

test('CT-58: save editado à mão é corrigido para valores válidos', () => {
  const editado = {
    credits: -50, owned: { falcao: false, xwing: true, tita: true }, cleared: [true, 'sim'],
    meta: { dmg: -3, hp: 2.7, rate: 'muito' }, lastSeen: 'ontem'
  };
  const { save, status } = lerSave(storageFalso({ [SAVE_KEY]: JSON.stringify(editado) }), NAVES, AGORA);
  assert.equal(status, 'ok');
  assert.equal(save.credits, 0);
  assert.deepEqual(save.owned, { falcao: true, tita: true });
  assert.deepEqual(save.cleared, [true, false, false]);
  assert.deepEqual(save.meta, { dmg: 0, hp: 2, rate: 0, magnet: 0 });
  assert.equal(save.lastSeen, AGORA);
});

test('CT-58: créditos que não são número viram 0; lastSeen no futuro vira agora', () => {
  const editado = { credits: 'mil', lastSeen: AGORA + 999999 };
  const { save } = lerSave(storageFalso({ [SAVE_KEY]: JSON.stringify(editado) }), NAVES, AGORA);
  assert.equal(save.credits, 0);
  assert.equal(save.lastSeen, AGORA);
});

// O ganho offline foi removido a pedido do dono (25/11/2026). A melhoria "Drones de Coleta"
// (meta.idle) deixou de existir: quem comprou recebe de volta os créditos gastos.
test('save versão 2 com Drones de Coleta devolve os créditos gastos e tira a melhoria', () => {
  const v2 = { versao: 2, credits: 100, meta: { dmg: 1, idle: 2 }, bestRate: [30, 0, 0] };
  const { save, status } = lerSave(storageFalso({ [SAVE_KEY]: JSON.stringify(v2) }), NAVES, AGORA);
  assert.equal(status, 'ok');
  assert.equal(save.credits, 100 + 120 + 192); // nível 1 custou 120, nível 2 custou 192
  assert.equal('idle' in save.meta, false);
  assert.equal('bestRate' in save, false);
  assert.equal(save.versao, SAVE_VERSION);
});

test('save já na versão atual não devolve créditos de novo', () => {
  const atual = { versao: SAVE_VERSION, credits: 100, meta: { dmg: 1, idle: 2 } };
  const { save } = lerSave(storageFalso({ [SAVE_KEY]: JSON.stringify(atual) }), NAVES, AGORA);
  assert.equal(save.credits, 100);
});
