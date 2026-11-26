// Prólogo roteirizado (RN-73), ajudas para iniciantes (RN-72) e modos travados (RN-74) — pedidos do dono em 26/11/2026
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROTEIRO_PROLOGO } = require('../src/dados/prologo.js');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const textos = (cena) => game.scene.getScene(cena).children.list.filter((o) => o.type === 'Text' && o.visible).map((o) => o.text);

test('RN-73: roteiro tem os passos combinados e dura pelo menos 4 minutos', () => {
  const ids = ROTEIRO_PROLOGO.map((p) => p.id);
  ['telaCheia', 'mover', 'atirar', 'joias', 'cartas', 'bau', 'meteoro', 'chamas', 'pausa', 'subchefe', 'chefe', 'naveMae', 'fim'].forEach((id) => assert.ok(ids.includes(id), id));
  assert.ok(ids.indexOf('chefe') < ids.indexOf('naveMae'), 'o chefe vem antes da nave-mãe');
  const minimo = ROTEIRO_PROLOGO.filter((p) => p.id !== 'fim').reduce((s, p) => s + p.min, 0) + 18;   // + cena final
  assert.ok(minimo >= 240, 'duração mínima ' + minimo + ' s');
  ROTEIRO_PROLOGO.forEach((p) => assert.ok(p.max >= p.min, p.id));
});

test('RN-73: jogador novo abre direto no prólogo, com a Eclipse forte, botão tela cheia e sem "recolher nave"', async () => {
  const j = await abrirJogo({ prologo: true });
  try {
    await esperarCena(j.pagina, 'Game');
    const r = await G(j.pagina, (src) => {
      const g = game.scene.getScene('Game');
      return { modo: g.modo, nave: g.ship.id, galaxia: g.gi, nivel: g.level, armas: g.weapons.length, textos: eval(src)('Game'), passo: g.passoAtual().id };
    }, '(' + textos.toString() + ')');
    assert.equal(r.modo, 'prologo');
    assert.equal(r.nave, 'eclipse');
    assert.equal(r.galaxia, 2, 'terceira galáxia (Abismo Violeta)');
    assert.ok(r.nivel >= 10 && r.armas >= 3, 'já começa forte');
    assert.equal(r.passo, 'abertura');
    assert.ok(r.textos.includes('TELA CHEIA'));
    assert.ok(!r.textos.includes('RECOLHER NAVE'));
    assert.ok(r.textos.includes('ANO 3025'));
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-73: o prólogo inteiro roda até o menu, não mexe em créditos/estatísticas e não se repete', async () => {
  const j = await abrirJogo({ prologo: true });
  try {
    await esperarCena(j.pagina, 'Game');
    const passos = [];
    await G(j.pagina, () => {
      ROTEIRO_PROLOGO.forEach((p) => { if (p.id !== 'fim') { p.min = Math.max(1, p.min * 0.25); p.max = Math.max(2, p.max * 0.25); } });
      window.__passos = [];
      setInterval(() => {
        const g = game.scene.getScene('Game');
        if (!g || !g.pr) return;
        const id = g.passoAtual() && g.passoAtual().id;
        if (window.__passos[window.__passos.length - 1] !== id) window.__passos.push(id);
        if (g.modal) { g.modalPick(0); if (g.modal) g.modalPick(0); }
        if (!g.ended) g.player.body.reset(g.player.x + 30, g.player.y);
      }, 250);
    });
    await j.pagina.waitForFunction(() => game.scene.isActive('Hangar'), { timeout: 280000, polling: 500 });
    const r = await G(j.pagina, (src) => ({ passos: window.__passos, visto: PREFS.prologoVisto, salvo: JSON.parse(localStorage.getItem('star_hunter_survivors_config_v1')).prologoVisto,
      creditos: SAVE.credits, abates: SAVE.stats.abates, tempo: SAVE.stats.tempoTotal, conquistas: Object.keys(SAVE.conquistas).length, combos: SAVE.combos.length, menu: eval(src)('Hangar') }), '(' + textos.toString() + ')');
    passos.push(...r.passos);
    assert.deepEqual(passos, ROTEIRO_PROLOGO.map((p) => p.id), 'todos os passos, na ordem');
    assert.equal(r.visto, true); assert.equal(r.salvo, true);
    assert.deepEqual({ c: r.creditos, a: r.abates, t: r.tempo, q: r.conquistas, k: r.combos }, { c: 0, a: 0, t: 0, q: 0, k: 0 }, 'o prólogo não conta');
    assert.ok(r.menu.includes('NOVO JOGO') || r.menu.includes('JOGAR'), 'termina no menu do jogo');
    await j.pagina.reload();
    await esperarCena(j.pagina, 'Hangar');   // na próxima vez abre no hangar/menu
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-73: antes da nave-mãe a Eclipse não cai; na nave-mãe ela é destruída e vem a entidade', async () => {
  const j = await abrirJogo({ prologo: true });
  try {
    await esperarCena(j.pagina, 'Game');
    const r = await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.invuln = 0; g.hurt(999999); return { hp: g.hp, max: g.mods.maxHp, ended: g.ended }; });
    assert.ok(r.hp >= r.max * 0.2 - 1 && !r.ended, 'não cai antes da hora');
    await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.pr.i = ROTEIRO_PROLOGO.findIndex((p) => p.id === 'naveMae') - 1; g.proximoPassoPrologo(); g.invuln = 0; g.hurt(999999); });
    await j.pagina.waitForFunction(() => game.scene.getScene('Game').children.list.some((o) => o.texture && o.texture.key === 'entidade' && o.alpha > 0.5), { timeout: 60000 });
    await j.pagina.waitForFunction(() => game.scene.getScene('Game').children.list.some((o) => o.type === 'Text' && o.text.includes('Volte para seu tempo')), { timeout: 30000 });
    await j.pagina.waitForFunction(() => game.scene.isActive('Hangar'), { timeout: 60000 });
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-72: no celular aparece o botão MOVER; no computador, as teclas na tela', async () => {
  const cel = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(cel.pagina, 'Hangar');
    // finge um celular: o "ponteiro" principal é o dedo (coarse)
    await G(cel.pagina, () => { window.matchMedia = (q) => ({ matches: q.includes('coarse') }); game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }); });
    await esperarCena(cel.pagina, 'Game');
    const r = await G(cel.pagina, (src) => ({ toque: game.scene.getScene('Game').toque, base: game.scene.getScene('Game').joyBase.visible, textos: eval(src)('Game') }), '(' + textos.toString() + ')');
    assert.equal(r.toque, true);
    assert.equal(r.base, true, 'o botão MOVER fica sempre à vista');
    assert.ok(r.textos.includes('MOVER'));
    assert.deepEqual(cel.erros, []);
  } finally { await cel.fechar(); }
  const pc = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(pc.pagina, 'Hangar');
    await G(pc.pagina, () => { window.matchMedia = (q) => ({ matches: q.includes('fine') }); game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }); });
    await esperarCena(pc.pagina, 'Game');
    const r = await G(pc.pagina, (src) => ({ toque: game.scene.getScene('Game').toque, textos: eval(src)('Game') }), '(' + textos.toString() + ')');
    assert.equal(r.toque, false);
    ['W', 'A', 'S', 'D', 'ESC', 'MOVER A NAVE', 'PAUSA'].forEach((t) => assert.ok(r.textos.includes(t), t));
    assert.deepEqual(pc.erros, []);
  } finally { await pc.fechar(); }
});

test('RN-72: a carta recomendada prefere completar combo e fortalecer a arma; tem selo; dá para desligar', async () => {
  const j = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    await G(j.pagina, () => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(j.pagina, 'Game');
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.ritmoParado = true;
      g.addWeapon('pulsar'); g.weapons.find((w) => w.id === 'pulsar').level = 4; g.passives.multi = 1;
      const combo = g.indiceRecomendado([{ kind: 'passive', id: 'armor', level: 1 }, { kind: 'weapon', id: 'pulsar', level: 5 }, { kind: 'weapon', id: 'orbital', level: 1 }]);
      const forte = g.indiceRecomendado([{ kind: 'passive', id: 'magnet', level: 1 }, { kind: 'weapon', id: 'rajada', level: 2 }]);
      g.openLevelUp();
      const selo = g.modal.parts.some((p) => p.type === 'Text' && p.text.includes('RECOMENDADO'));
      g.modalPick(0);
      PREFS.ajudas = false;
      g.openLevelUp();
      const semSelo = !g.modal.parts.some((p) => p.type === 'Text' && p.text.includes('RECOMENDADO'));
      g.modalPick(0);
      return { combo, forte, selo, semSelo };
    });
    assert.equal(r.combo, 1, 'arma que vira combo');
    assert.equal(r.forte, 1, 'fortalecer a arma que já tem');
    assert.ok(r.selo);
    assert.ok(r.semSelo, 'com as ajudas desligadas, sem selo');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-74: infinito e arena ficam travados até terminar 1 campanha', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const abrir = () => {
      const h = game.scene.getScene('Hangar');
      h.children.list.filter((o) => o.depth >= 1000).forEach((o) => o.destroy());
      abrirEscolhaDeModo(h, 0);
      const t = h.children.list.filter((o) => o.type === 'Text' && o.text === 'ARENA').pop();
      h.children.list.filter((o) => o.type === 'Rectangle' && o.input && o.depth === 1001 && Math.abs(o.y - t.y - 30) < 40).pop().emit('pointerdown');
      return h.children.list.filter((o) => o.type === 'Text').map((o) => o.text);
    };
    const t1 = await G(j.pagina, abrir);
    await esperar(500);
    assert.ok(t1.includes('Termine 1 campanha para liberar'));
    assert.equal(await G(j.pagina, () => game.scene.isActive('Hangar')), true, 'arena travada não abre');
    await G(j.pagina, () => { game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }); });
    await esperarCena(j.pagina, 'Game');
    await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.elapsed = 30; g.endRun('retreat'); g.scene.start('Hangar'); });
    await esperarCena(j.pagina, 'Hangar');
    await G(j.pagina, abrir);
    await esperarCena(j.pagina, 'Game');
    assert.equal(await G(j.pagina, () => game.scene.getScene('Game').modo), 'arena', 'depois de 1 campanha, a arena abre');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-72/73: textos do prólogo e das ajudas têm tradução nos 6 idiomas; prólogo em francês sem erro', async () => {
  const chaves = new Set();
  ['src/prologo.js', 'src/ajudas.js'].forEach((f) => {
    const s = fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), re = /tx\('((?:[^'\\]|\\.)*)'/g; let m;
    while ((m = re.exec(s))) chaves.add(m[1].replace(/\\n/g, '\n'));
  });
  assert.ok(chaves.size >= 25);
  ['en', 'es', 'fr', 'it', 'de', 'tr'].forEach((id) => {
    const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/idiomas/' + id + '.js'), 'utf8'), ctx);
    assert.deepEqual([...chaves].filter((c) => ctx.TRADUCOES_CARREGADAS[id][c] === undefined), [], id);
  });
  const j = await abrirJogo({ prologo: true, idioma: 'fr-FR' });
  try {
    await esperarCena(j.pagina, 'Game');
    await esperar(1500);
    const t = await G(j.pagina, (src) => eval(src)('Game'), '(' + textos.toString() + ')');
    assert.ok(t.includes('AN 3025'), t.join(' | '));
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
