// E8/E9 — combos salvos, armas travadas, conquistas e bônus (lógica, sem navegador)
// Regras: RN-27, RN-28, RN-34 a RN-38 · Casos: CT-44, CT-45, CT-50 a CT-57
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { SAVE_KEY, SAVE_VERSION, saveInicial, lerSave } = require('../src/save-dados.js');
const { CONQUISTAS, TOTAL_COMBOS, textoDoPremio } = require('../src/dados/conquistas.js');
const { registrarCombo, registrarArmaAchada, armaLiberada, verificarConquistas, bonusDasConquistas } = require('../src/progresso.js');

const NAVES = ['falcao', 'tita', 'agulha'];
const novo = () => saveInicial(1);
const storage = (obj) => ({ getItem: (k) => (k === SAVE_KEY ? JSON.stringify(obj) : null), setItem() {}, removeItem() {} });

test('save (versão 5 desde os recordes da RN-68/69) traz combos, conquistas e estatísticas vazios; save antigo ganha esses campos', () => {
  const s = novo();
  assert.equal(SAVE_VERSION, 5);   // v5: recordes do infinito e da arena (ok do dono em 25/11)
  assert.deepEqual(s.combos, []);
  assert.deepEqual(s.conquistas, {});
  assert.equal(s.stats.abates, 0);
  const { save } = lerSave(storage({ versao: 3, credits: 50 }), NAVES, 1000);
  assert.equal(save.credits, 50);
  assert.deepEqual(save.combos, []);
  assert.equal(save.stats.armasAchadas.disc, undefined);
});

test('save com combos e estatísticas inválidas é corrigido', () => {
  const { save } = lerSave(storage({ versao: 4, combos: ['pulsar', 'pulsar', 3, null],
    conquistas: { sobreviver10: 123, falsa: 'x' },
    stats: { abates: -5, nivelMax: 12.5, locais: { 0: [1, 1, -2, 'a', 3] }, armasAchadas: { disc: 2.9, chain: -1 }, vitorias: { '0:falcao': true, '1:tita': 'sim' } } }), NAVES, 1000);
  assert.deepEqual(save.combos, ['pulsar']);
  assert.deepEqual(save.conquistas, { sobreviver10: 123 });
  assert.equal(save.stats.abates, 0);
  assert.equal(save.stats.nivelMax, 12.5);
  assert.deepEqual(save.stats.locais['0'], [1, 3]);
  assert.deepEqual(save.stats.armasAchadas, { disc: 2 });
  assert.deepEqual(save.stats.vitorias, { '0:falcao': true });
});

test('CT-44/45: combo descoberto fica salvo uma vez só (vale para todas as naves)', () => {
  const s = novo();
  assert.equal(registrarCombo(s, 'rajada'), true);
  assert.equal(registrarCombo(s, 'rajada'), false);
  assert.deepEqual(s.combos, ['rajada']);
});

test('CT-53: arma travada achada 3 vezes passa a aparecer nas cartas', () => {
  const s = novo();
  assert.equal(armaLiberada(s, 'disc'), false);
  registrarArmaAchada(s, 'disc'); registrarArmaAchada(s, 'disc');
  assert.equal(armaLiberada(s, 'disc'), false);
  assert.equal(registrarArmaAchada(s, 'disc'), 3);
  assert.equal(armaLiberada(s, 'disc'), true);
});

test('CT-50: são ~20 conquistas, cada uma com nome, descrição e prêmio que muda o jogo', () => {
  assert.ok(CONQUISTAS.length >= 18 && CONQUISTAS.length <= 22, 'quantidade: ' + CONQUISTAS.length);
  assert.equal(new Set(CONQUISTAS.map((c) => c.id)).size, CONQUISTAS.length);
  CONQUISTAS.forEach((c) => {
    assert.ok(c.nome && c.desc, c.id);
    assert.ok(['bonus', 'arma'].includes(c.premio.tipo), c.id);
    assert.ok(textoDoPremio(c.premio, 'Arma').length > 3, c.id);
  });
  assert.equal(TOTAL_COMBOS, 11);   // 8 armas comuns + 3 poderes desde a RN-63 (ok do dono em 25/11)
});

test('CT-51/57: conquistas desbloqueiam quando a condição é cumprida, uma vez só', () => {
  const s = novo();
  assert.deepEqual(verificarConquistas(s, 5), []);
  s.stats.abates = 999;
  assert.deepEqual(verificarConquistas(s, 5), []);
  s.stats.abates = 1000;
  assert.deepEqual(verificarConquistas(s, 6).map((c) => c.id), ['abates1000']);
  assert.deepEqual(verificarConquistas(s, 7), []);
  s.stats.vitorias['0:falcao'] = true;
  s.stats.melhorTempo['0:falcao'] = 1800;
  const ids = verificarConquistas(s, 8).map((c) => c.id);
  ['sobreviver10', 'sobreviver20', 'sobreviver30', 'venceuFalcao'].forEach((id) => assert.ok(ids.includes(id), id));
  assert.ok(!ids.includes('venceuTita'));
});

test('conquistas de explorar contam os locais descobertos somando partidas', () => {
  const s = novo();
  s.stats.locais['1'] = Array.from({ length: 29 }, (_, i) => i);
  assert.ok(!verificarConquistas(s, 1).some((c) => c.id === 'explorar1'));
  s.stats.locais['1'].push(29);
  assert.ok(verificarConquistas(s, 2).some((c) => c.id === 'explorar1'));
});

test('CT-54: os bônus das conquistas somam e só contam as desbloqueadas', () => {
  const s = novo();
  assert.equal(bonusDasConquistas(s).dano, 0);
  s.conquistas.sobreviver10 = 1; s.conquistas.chefe1 = 1; s.conquistas.nivel30 = 1;
  const b = bonusDasConquistas(s);
  assert.ok(Math.abs(b.dano - 0.1) < 1e-9);
  assert.equal(b.regen, 1);
  assert.equal(b.vida, 0);
});
