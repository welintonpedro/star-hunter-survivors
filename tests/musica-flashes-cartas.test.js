// Música de fundo (RN-75), clarões seguros (RN-76) e menos menus de carta no prólogo — pedidos do dono em 26/11/2026
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

test('RN-75: menu e cada galáxia têm música; cada galáxia tem pelo menos 2 faixas diferentes', () => {
  const ctx = { PREFS: { musica: 0.5 } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/musica.js'), 'utf8') + ';this.M=MUSICAS;this.MAX=MUSICA_VOLUME_MAX;', ctx);
  assert.ok(ctx.M.menu.length >= 1);
  ['g0', 'g1', 'g2'].forEach((g) => {
    assert.ok(ctx.M[g].length >= 2, g);
    const assinaturas = ctx.M[g].map((f) => f.bpm + '|' + f.escala.join(',') + '|' + f.acordes.join(','));
    assert.equal(new Set(assinaturas).size, ctx.M[g].length, g + ': faixas diferentes');
  });
  const todas = ['g0', 'g1', 'g2'].map((g) => ctx.M[g][0].escala.join(','));
  assert.equal(new Set(todas).size, 3, 'cada galáxia com seu clima (escala própria)');
  assert.ok(ctx.MAX <= 0.3, 'bem baixinha');
});

test('RN-75: a música toca notas no navegador, troca ao mudar de tela e respeita o volume', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const r = await G(j.pagina, async () => {
      const ctx = new AudioContext();
      let osc = 0; const criar = ctx.createOscillator.bind(ctx); ctx.createOscillator = () => { osc++; return criar(); };
      pararMusica();
      const cena = { sound: { context: ctx, masterVolumeNode: ctx.destination, locked: false, once() {} } };
      tocarMusica(cena, 'g1');
      const chave1 = _MUS.chave, faixa1 = _MUS.faixa.nome;
      await new Promise((res) => setTimeout(res, 600));
      const notas = osc;
      tocarMusica(cena, 'g1');                      // mesma chave: não reinicia
      const mesma = _MUS.faixa.nome === faixa1;
      tocarMusica(cena, 'g2');
      const chave2 = _MUS.chave;
      PREFS.musica = 0; aplicarVolumeMusica();
      const vol0 = volumeMusica();
      pararMusica();
      return { chave1, notas, mesma, chave2, vol0, parou: _MUS.timer === null };
    });
    assert.equal(r.chave1, 'g1');
    assert.ok(r.notas > 0, 'tocou notas');
    assert.ok(r.mesma);
    assert.equal(r.chave2, 'g2');
    assert.equal(r.vol0, 0);
    assert.ok(r.parou);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-76: nenhum clarão de tela inteira do Phaser; clarões fracos e no máximo 1 por segundo; trovões não piscam a tela', async () => {
  const src = ['src/cenas/partida.js', 'src/prologo.js', 'src/arena.js', 'src/telas.js', 'src/cenas/hangar.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8')).join('\n');
  assert.ok(!/cameras\.main\.flash\(/.test(src), 'sem cameras.main.flash');
  assert.ok(!/setTintFill\(0xffffff\)/.test(src), 'sem inimigo piscando branco total');
  const j = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    await G(j.pagina, () => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(j.pagina, 'Game');
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.ritmoParado = true;
      const conta = () => g.children.list.filter((o) => o.type === 'Rectangle' && o.depth === 2500).length;
      for (let k = 0; k < 10; k++) clarao(g, 300, 0xffffff, 1);
      const rects = g.children.list.filter((o) => o.type === 'Rectangle' && o.depth === 2500);
      const seguidos = rects.length, alfa = Math.max(...rects.map((o) => o.alpha));
      rects.forEach((o) => o.destroy()); g.__ultimoClarao = -99999;
      // trovões: vários disparos seguidos não criam clarão
      for (let k = 0; k < 3; k++) { g.spawnEnemy('g1_rastejador'); }
      g.enemies.children.iterate((e) => { if (e && e.active) e.body.reset(g.player.x + 120, g.player.y); });
      g.fireTrovao(g.wstats({ id: 'trovao', level: 1 }));
      return { seguidos, alfa, trovao: conta() };
    });
    assert.equal(r.seguidos, 1, 'só 1 clarão por segundo');
    assert.ok(r.alfa <= 0.2 + 1e-9, 'clarão fraco: ' + r.alfa);
    assert.equal(r.trovao, 0, 'trovões não piscam a tela');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('prólogo: depois da lição, subir de nível escolhe sozinho (sem menu); a arma suprema ainda abre o menu', async () => {
  const j = await abrirJogo({ prologo: true });
  try {
    await esperarCena(j.pagina, 'Game');
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.pr.cartaExplicada = true;
      const nivel = g.level, armas = g.weapons.map((w) => w.id + w.level).join() + JSON.stringify(g.passives);
      g.gainXp(g.xpNext + 1);
      const semMenu = !g.modal, subiu = g.level > nivel, mudou = (g.weapons.map((w) => w.id + w.level).join() + JSON.stringify(g.passives)) !== armas;
      g.forcarSuprema = 'laser';
      g.gainXp(g.xpNext + 1);
      const menuSuprema = !!g.modal && g.modal.options.some((o) => o.id === 'laser');
      return { semMenu, subiu, mudou, menuSuprema };
    });
    assert.deepEqual(r, { semMenu: true, subiu: true, mudou: true, menuSuprema: true });
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
