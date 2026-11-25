// E2 — curva de dificuldade e horários dos eventos
// Regras: RN-01, RN-03, RN-05, RN-06, RN-07 · Casos: CT-09, CT-15, CT-16, CT-62 a CT-65
// Desde 25/11/2026 (pedido do dono): em vez de ondas fechadas, cada minuto tem um
// mínimo e um máximo de inimigos vivos, crescendo até muitos inimigos no fim.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ONDAS } = require('../src/dados/ondas.js');
const { EVENTOS } = require('../src/dados/eventos.js');
const {
  linhaDoMinuto, novoEstadoOndas, passoNascimento, escolherTipo,
  quantosAte, proximoEvento
} = require('../src/ritmo.js');

// Simula o nascimento. "matar" decide quantos dos vivos morrem a cada passo.
function simular({ de = 0, ate, dt = 0.1, tabela = ONDAS, matar = () => 0, vivosIniciais = 0 }) {
  const estado = novoEstadoOndas(0);
  let vivos = vivosIniciais, total = 0;
  const historico = [];
  for (let t = de; t < ate; t += dt) {
    vivos -= Math.min(vivos, matar(vivos, t));
    const n = passoNascimento(estado, t, dt, vivos, tabela);
    vivos += n; total += n;
    historico.push({ t, n, vivos });
  }
  return { historico, total, vivos };
}

test('CT-15: 30 minutos na tabela; mínimo e máximo sempre crescendo até muitos inimigos no fim', () => {
  assert.equal(ONDAS.length, 30);
  ONDAS.forEach((l, m) => assert.ok(l.min <= l.max, 'minuto ' + m));
  for (let m = 1; m < 30; m++) {
    ['min', 'max', 'porSegundo', 'vida'].forEach((k) => assert.ok(ONDAS[m][k] >= ONDAS[m - 1][k], k + ' caiu no minuto ' + m));
  }
  assert.ok(ONDAS[0].min >= 4 && ONDAS[0].max <= 20, 'começo com poucos, mas não vazio');
  assert.ok(ONDAS[29].max >= 200, 'fim com muitos inimigos');
});

test('CT-62: abaixo do mínimo, os inimigos são repostos rápido (sem aparecer todos de uma vez)', () => {
  const { historico } = simular({ ate: 8, matar: (v, t) => (t > 5 && t < 5.2 ? v : 0) });
  const l = linhaDoMinuto(ONDAS, 4);
  const em4s = historico.find((h) => h.t >= 4);
  assert.ok(em4s.vivos >= l.min, 'em 2 s depois da calma inicial já deveria ter o mínimo: ' + em4s.vivos);
  historico.forEach((h) => assert.ok(h.n <= 2, 'nasceram ' + h.n + ' de uma vez'));
  const depois = historico.find((h) => h.t >= 7);
  assert.ok(depois.vivos >= l.min, 'depois de matar todos, repõe até o mínimo');
});

test('CT-64: sem matar ninguém, nunca passa do máximo do minuto', () => {
  const { historico } = simular({ ate: 300 });
  historico.forEach((h) => assert.ok(h.vivos <= linhaDoMinuto(ONDAS, h.t).max, 'passou do máximo em ' + h.t.toFixed(1)));
  assert.ok(historico[historico.length - 1].vivos >= linhaDoMinuto(ONDAS, 299).max - 1, 'deveria encher até o máximo');
});

test('CT-65: entre o mínimo e o máximo, nascem no ritmo da tabela', () => {
  const l = linhaDoMinuto(ONDAS, 700);
  const meio = Math.round((l.min + l.max) / 2);
  // mantém sempre "meio" vivos: mata exatamente o que nascer
  const est = novoEstadoOndas(0); let total = 0;
  for (let t = 700; t < 710; t += 0.1) total += passoNascimento(est, t, 0.1, meio, ONDAS);
  const esperado = linhaDoMinuto(ONDAS, 705).porSegundo * 10;
  assert.ok(Math.abs(total - esperado) <= 2, 'nasceram ' + total + ', esperado ~' + esperado.toFixed(1));
});

test('CT-16: mudar a tabela muda quantos inimigos nascem, sem mexer na lógica', () => {
  const dobrada = ONDAS.map((l) => ({ ...l, min: l.min * 2, max: l.max * 2 }));
  // depois de 1 minuto sem matar ninguém, cada tabela encheu até o próprio máximo
  const normal = simular({ ate: 59 }).vivos;
  const dobro = simular({ ate: 59, tabela: dobrada }).vivos;
  assert.ok(dobro >= normal * 1.8, normal + ' x ' + dobro);
});

test('a tabela é suavizada: não há degrau na virada do minuto', () => {
  const a = linhaDoMinuto(ONDAS, 599.9), b = linhaDoMinuto(ONDAS, 600.1);
  assert.ok(Math.abs(a.max - b.max) <= 1 && Math.abs(a.min - b.min) <= 1);
});

test('escolherTipo sorteia pelos pesos', () => {
  const pesos = { a: 1, b: 0, c: 1 };
  assert.equal(escolherTipo(pesos, 0), 'a');
  assert.equal(escolherTipo(pesos, 0.49), 'a');
  assert.equal(escolherTipo(pesos, 0.51), 'c');
  assert.equal(escolherTipo(pesos, 0.9999), 'c');
});

test('CT-09: subchefes aos 3, 6 … 27 min e nenhum aos 30', () => {
  const s = EVENTOS.subchefes;
  assert.equal(quantosAte(179, s), 0);
  assert.equal(quantosAte(180, s), 1);
  assert.equal(quantosAte(1620, s), 9);
  assert.equal(quantosAte(1800, s), 9);
});

test('CT-10: chefes aos 10, 20 e 25 min, cada um mais forte; nave-mãe aos 30', () => {
  assert.deepEqual(EVENTOS.chefes.map((c) => c.t), [600, 1200, 1500]);
  assert.ok(EVENTOS.chefes[1].vida > EVENTOS.chefes[0].vida && EVENTOS.chefes[2].vida > EVENTOS.chefes[1].vida);
  assert.ok(EVENTOS.chefes[1].dano > EVENTOS.chefes[0].dano && EVENTOS.chefes[2].dano > EVENTOS.chefes[1].dano);
  assert.equal(EVENTOS.naveMae, 1800);
});

test('cercos e enxames só começam depois de alguns minutos', () => {
  assert.equal(quantosAte(299, EVENTOS.cercos), 0);
  assert.equal(quantosAte(239, EVENTOS.enxames), 0);
});

test('o próximo evento grande (subchefe, chefe, nave-mãe) é calculado pelo relógio', () => {
  assert.deepEqual(proximoEvento(0), { nome: 'Subchefe', t: 180 });
  assert.deepEqual(proximoEvento(590), { nome: 'Chefe', t: 600 });
  assert.deepEqual(proximoEvento(1790), { nome: 'Nave-mãe', t: 1800 });
  assert.equal(proximoEvento(1800), null);
});
