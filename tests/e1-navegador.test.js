// E1 — avisos e modo de teste vistos no navegador de verdade (CT-03, CT-04, CT-05, CT-06)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');

// Textos visíveis na cena (para conferir o que o jogador vê)
function textosDaCena(pagina, chave) {
  return pagina.evaluate((k) => game.scene.getScene(k).children.list
    .filter((o) => o.type === 'Text' && o.visible).map((o) => o.text), chave);
}
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

test('CT-04: sem localStorage, o hangar avisa uma única vez que o progresso não será salvo', async () => {
  const { pagina, erros, fechar } = await abrirJogo({ semStorage: true });
  try {
    await esperarCena(pagina, 'Hangar');
    const primeira = (await textosDaCena(pagina, 'Hangar')).filter((t) => t.includes('não será salvo'));
    assert.equal(primeira.length, 1, 'o aviso deveria aparecer na primeira vez');

    await pagina.evaluate(() => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(pagina, 'Game');
    await esperar(500);
    await pagina.evaluate(() => game.scene.getScene('Game').scene.start('Hangar'));
    await esperarCena(pagina, 'Hangar');
    const segunda = (await textosDaCena(pagina, 'Hangar')).filter((t) => t.includes('não será salvo'));
    assert.equal(segunda.length, 0, 'o aviso não deveria repetir');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-03: save corrompido abre o jogo, avisa e guarda uma cópia do save quebrado', async () => {
  const { pagina, erros, fechar } = await abrirJogo({ saveInicial: '{quebrado' });
  try {
    await esperarCena(pagina, 'Hangar');
    const avisos = (await textosDaCena(pagina, 'Hangar')).filter((t) => t.includes('não pôde ser lido'));
    assert.equal(avisos.length, 1);
    const copia = await pagina.evaluate(() => localStorage.getItem('star_hunter_survivors_save_v1_corrompido'));
    assert.equal(copia, '{quebrado');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-05: sem ?teste=1 não existe painel para pular o tempo', async () => {
  const { pagina, erros, fechar } = await abrirJogo();
  try {
    await esperarCena(pagina, 'Hangar');
    await pagina.evaluate(() => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(pagina, 'Game');
    const textos = await textosDaCena(pagina, 'Game');
    assert.equal(textos.some((t) => t.includes('MODO TESTE')), false);
    assert.equal(await pagina.evaluate(() => typeof game.scene.getScene('Game').testeIrPara), 'undefined');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-06: com ?teste=1 dá para pular o relógio para 9:55 e a partida segue de lá', async () => {
  const { pagina, erros, fechar } = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(pagina, 'Hangar');
    await pagina.evaluate(() => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(pagina, 'Game');
    const textos = await textosDaCena(pagina, 'Game');
    assert.ok(textos.some((t) => t.includes('MODO TESTE')), 'o painel de teste deveria aparecer');

    await pagina.evaluate(() => game.scene.getScene('Game').testeIrPara(9 * 60 + 55));
    await esperar(1000);
    const estado = await pagina.evaluate(() => {
      const g = game.scene.getScene('Game');
      return { tempo: g.elapsed, ring: g.ringCount, elite: g.eliteCount };
    });
    assert.ok(estado.tempo >= 595 && estado.tempo < 600, 'tempo foi ' + estado.tempo);
    assert.ok(estado.ring <= 15 && estado.elite <= 10, 'eventos atrasados não podem disparar em massa');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});
