// Idiomas (pedido do dono em 25/11/2026, RN-61): EN, ES, FR, IT, DE, TR além do português
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const IDS = ['en', 'es', 'fr', 'it', 'de', 'tr'];

function dicionario(id) {
  const ctx = {}; const vm = require('vm');
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/idiomas/' + id + '.js'), 'utf8'), ctx);
  return ctx.TRADUCOES_CARREGADAS[id];
}

test('RN-61: todo texto marcado com tx() no código tem tradução nos 6 idiomas', () => {
  const arquivos = ['src/cenas/partida.js', 'src/cenas/hangar.js', 'src/telas.js', 'src/mapa.js'];
  const re = /tx\('((?:[^'\\]|\\.)*)'/g; const chaves = new Set();
  arquivos.forEach((f) => { const s = fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); let m; while ((m = re.exec(s))) chaves.add(m[1].replace(/\\n/g, '\n').replace(/\\'/g, "'")); });
  assert.ok(chaves.size > 100);
  IDS.forEach((id) => {
    const d = dicionario(id);
    const faltam = [...chaves].filter((c) => d[c] === undefined);
    assert.deepEqual(faltam, [], id + ' sem tradução');
    // partes {n}, {nome}... iguais na tradução
    Object.entries(d).forEach(([k, v]) => {
      const a = (k.match(/\{\w+\}/g) || []).sort().join(), b = (v.match(/\{\w+\}/g) || []).sort().join();
      assert.equal(b, a, id + ': ' + k);
    });
  });
});

test('RN-61: navegador em inglês abre o jogo em inglês; em alemão, em alemão; idioma sem tradução cai no inglês', async () => {
  for (const [nav, esperado, botao] of [['en-US', 'en', 'PLAY'], ['de-DE', 'de', 'SPIELEN'], ['ja-JP', 'en', 'PLAY']]) {
    const j = await abrirJogo({ idioma: nav });
    try {
      await esperarCena(j.pagina, 'Hangar');
      const r = await G(j.pagina, () => ({ id: IDIOMA, textos: game.scene.getScene('Hangar').children.list.filter((o) => o.type === 'Text').map((o) => o.text), arma: WEAPONS.pulsar.name }));
      assert.equal(r.id, esperado, nav);
      assert.ok(r.textos.includes(botao), nav + ': ' + r.textos.join(' | '));
      assert.deepEqual(j.erros, []);
    } finally { await j.fechar(); }
  }
});

test('RN-61: trocar o idioma no menu muda os textos e fica guardado depois de recarregar', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const antes = await G(j.pagina, () => ({ id: IDIOMA, arma: WEAPONS.pulsar.name }));
    assert.deepEqual(antes, { id: 'pt', arma: 'Canhão Pulsar' });
    await G(j.pagina, () => {
      const h = game.scene.getScene('Hangar');
      abrirIdiomas(h, true);
      const t = h.children.list.filter((o) => o.type === 'Text' && o.text === 'Français').pop();
      h.children.list.filter((o) => o.type === 'Rectangle' && o.input && o.x === t.x && o.y === t.y).pop().emit('pointerdown');
    });
    await new Promise((r) => setTimeout(r, 500));
    const depois = await G(j.pagina, () => ({ id: IDIOMA, arma: WEAPONS.pulsar.name, textos: game.scene.getScene('Hangar').children.list.filter((o) => o.type === 'Text').map((o) => o.text) }));
    assert.equal(depois.id, 'fr');
    assert.equal(depois.arma, 'Canon Pulsar');
    assert.ok(depois.textos.includes('NOUVELLE PARTIE'), 'o menu deveria voltar em francês');
    await j.pagina.reload();
    await esperarCena(j.pagina, 'Hangar');
    assert.equal(await G(j.pagina, () => IDIOMA), 'fr', 'a escolha deve valer mais que o idioma do navegador');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-61: partida em turco abre cartas, baú e tela final sem erro', async () => {
  const j = await abrirJogo({ idioma: 'tr-TR', busca: 'teste=1' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    await G(j.pagina, () => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(j.pagina, 'Game');
    const textos = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.ritmoParado = true;
      g.openLevelUp(); const cartas = g.modal.parts.filter((p) => p.type === 'Text').map((p) => p.text); g.modalPick(0);
      g.openChest(); g.abrirBauEscolhido(0);
      return cartas;
    });
    assert.ok(textos.some((t) => t.startsWith('SEVİYE')), textos.join(' | '));
    await j.pagina.waitForFunction(() => game.scene.getScene('Game').modal && game.scene.getScene('Game').modal.fase === 'revelado', { timeout: 10000 });
    await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.modalPick(0); g.endRun('retreat'); });
    const fim = await G(j.pagina, () => game.scene.getScene('Game').children.list.filter((o) => o.type === 'Text').map((o) => o.text));
    assert.ok(fim.includes('GÖREV BİTTİ'));
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-61: no Poki, o idioma vem de PokiSDK.getLanguage() (a escolha do jogador ainda vale mais)', async () => {
  const j = await abrirJogo({ idioma: 'pt-BR' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    const r = await G(j.pagina, () => {
      window.PokiSDK = { getLanguage: () => 'it' };
      PREFS.idioma = null; const semEscolha = _idiomaInicial();
      PREFS.idioma = 'de'; const comEscolha = _idiomaInicial();
      window.PokiSDK = { getLanguage: () => 'ja' }; PREFS.idioma = null; const semTraducao = _idiomaInicial();
      delete window.PokiSDK;
      return { semEscolha, comEscolha, semTraducao };
    });
    assert.deepEqual(r, { semEscolha: 'it', comEscolha: 'de', semTraducao: 'en' });
  } finally { await j.fechar(); }
});
