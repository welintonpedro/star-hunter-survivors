// E2 — curva de dificuldade (ondas e fluxo) e horários dos eventos
// Regras: RN-01, RN-03, RN-05, RN-06, RN-07 · Casos: CT-09, CT-15, CT-16, CT-62 a CT-65
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ONDAS } = require('../src/dados/ondas.js');
const { EVENTOS } = require('../src/dados/eventos.js');
const {
  linhaDoMinuto, novoEstadoOndas, passoNascimento, escolherTipo,
  quantosAte, proximoEvento
} = require('../src/ritmo.js');

// Simula o nascimento de inimigos. "matar" decide quantos dos vivos morrem a cada passo.
function simular({ de = 0, ate, dt = 0.1, tabela = ONDAS, matar = () => 0 }) {
  const estado = novoEstadoOndas(de);
  let vivos = 0, total = 0;
  const historico = [];
  for (let t = de; t < ate; t += dt) {
    vivos -= Math.min(vivos, matar(vivos, t));
    const n = passoNascimento(estado, t, dt, vivos, tabela);
    vivos += n; total += n;
    historico.push({ t, n, vivos, fase: estado.fase, onda: estado.onda });
  }
  return { historico, total, vivos, estado };
}

test('CT-15: a tabela tem 30 minutos; os 10 primeiros em ondas e o resto em fluxo, sempre crescendo', () => {
  assert.equal(ONDAS.length, 30);
  ONDAS.forEach((l, m) => assert.equal(l.modo, m < 10 ? 'ondas' : 'fluxo', 'minuto ' + m));
  for (let m = 1; m < 30; m++) {
    assert.ok(ONDAS[m].vida >= ONDAS[m - 1].vida, 'vida não pode cair no minuto ' + m);
    if (m < 10) assert.ok(ONDAS[m].tamanho >= ONDAS[m - 1].tamanho, 'onda menor no minuto ' + m);
    if (m > 10) assert.ok(ONDAS[m].porSegundo >= ONDAS[m - 1].porSegundo, 'fluxo menor no minuto ' + m);
  }
  assert.ok(ONDAS[0].tamanho <= 6, 'a primeira onda deve ser pequena');
});

test('CT-62: sem matar ninguém, a primeira onda solta só o tamanho dela até o tempo máximo', () => {
  const l0 = ONDAS[0];
  const { historico } = simular({ ate: l0.tempoMax });
  const nascidos = historico.reduce((s, h) => s + h.n, 0);
  assert.equal(nascidos, l0.tamanho);
});

test('CT-64: sem matar ninguém, a próxima onda vem depois do tempo máximo + respiro', () => {
  const l0 = ONDAS[0];
  const { historico } = simular({ ate: 60 });
  const inicioOnda2 = historico.find((h) => h.onda === 2);
  assert.ok(inicioOnda2, 'a segunda onda deveria começar');
  assert.ok(inicioOnda2.t >= l0.tempoMax, 'onda 2 começou cedo demais: ' + inicioOnda2.t);
  assert.ok(inicioOnda2.t <= l0.tempoMax + l0.respiro + 3, 'onda 2 demorou: ' + inicioOnda2.t);
});

test('CT-63: matando a maioria, a próxima onda vem logo depois do respiro', () => {
  const l0 = ONDAS[0];
  const { historico } = simular({ ate: 40, matar: (v) => v }); // mata todo mundo assim que nasce
  const inicioOnda2 = historico.find((h) => h.onda === 2);
  assert.ok(inicioOnda2.t < l0.tempoMax, 'deveria vir antes do tempo máximo, veio em ' + inicioOnda2.t);
  const fimOnda1 = historico.filter((h) => h.onda === 1 && h.fase === 'respiro')[0];
  assert.ok(inicioOnda2.t - fimOnda1.t >= l0.respiro - 0.2, 'o respiro deve ser respeitado');
});

test('CT-62: nos 10 primeiros minutos cada onda solta exatamente o seu tamanho (nada infinito)', () => {
  const { historico } = simular({ ate: 600, matar: (v) => Math.ceil(v * 0.05) });
  const porOnda = new Map();
  historico.forEach((h) => {
    if (!h.n) return;
    const o = porOnda.get(h.onda) || { n: 0, t: h.t };
    o.n += h.n; porOnda.set(h.onda, o);
  });
  assert.ok(porOnda.size >= 10, 'deveria haver várias ondas em 10 min, houve ' + porOnda.size);
  porOnda.forEach((o, onda) => {
    assert.equal(o.n, linhaDoMinuto(ONDAS, o.t).tamanho, 'onda ' + onda + ' em ' + o.t.toFixed(1));
  });
});

test('CT-65: do minuto 10 em diante os inimigos chegam em fluxo, no ritmo da tabela e sem passar do teto', () => {
  const l = linhaDoMinuto(ONDAS, 700); // minuto 11
  const { total } = simular({ de: 700, ate: 710, matar: (v) => v });
  assert.ok(Math.abs(total - l.porSegundo * 10) <= 1.5, 'nasceram ' + total);
  const cheio = simular({ de: 660, ate: 719 }); // fica dentro do minuto 11
  assert.ok(cheio.vivos <= l.maxNaTela, 'passou do teto: ' + cheio.vivos);
});

test('CT-16: mudar a tabela muda quantos inimigos nascem, sem mexer na lógica', () => {
  const dobrada = ONDAS.map((l) => (l.modo === 'ondas' ? { ...l, tamanho: l.tamanho * 2 } : l));
  const normal = simular({ ate: 20 }).total;
  const dobro = simular({ ate: 20, tabela: dobrada }).total;
  assert.equal(dobro, normal * 2);
});

test('escolherTipo sorteia pelos pesos da tabela', () => {
  const pesos = { bug: 1, diamond: 0, saucer: 1 };
  assert.equal(escolherTipo(pesos, 0), 'bug');
  assert.equal(escolherTipo(pesos, 0.49), 'bug');
  assert.equal(escolherTipo(pesos, 0.51), 'saucer');
  assert.equal(escolherTipo(pesos, 0.9999), 'saucer');
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

test('cercos e enxames só começam depois da fase inicial (a partir de ~5 min)', () => {
  assert.equal(quantosAte(299, EVENTOS.cercos), 0);
  assert.equal(quantosAte(239, EVENTOS.enxames), 0);
});

test('o próximo evento grande (subchefe, chefe, nave-mãe) é calculado pelo relógio', () => {
  assert.deepEqual(proximoEvento(0), { nome: 'Subchefe', t: 180 });
  assert.deepEqual(proximoEvento(590), { nome: 'Chefe', t: 600 });
  assert.deepEqual(proximoEvento(1790), { nome: 'Nave-mãe', t: 1800 });
  assert.equal(proximoEvento(1800), null);
});
