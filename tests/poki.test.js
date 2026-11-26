// Preparação para o Poki (portal de jogos): regras de developers.poki.com/guide/requirements-quality
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');

const RAIZ = path.join(__dirname, '..');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const chamadas = (pagina) => pagina.evaluate(() => window.__poki.filter((c) => c !== 'init'));

test('Poki: o jogo não busca nada em outros sites (Phaser fica em lib/)', () => {
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const externos = (html.match(/(src|href)="(https?:)?\/\/[^"]+"/g) || []);
  assert.deepEqual(externos, [], 'index.html não pode carregar arquivos de outros sites');
  assert.ok(html.includes('<script src="lib/phaser.min.js"></script>'));
  assert.ok(fs.existsSync(path.join(RAIZ, 'lib', 'phaser.min.js')), 'lib/phaser.min.js precisa estar no projeto');
  const codigo = fs.readdirSync(path.join(RAIZ, 'src'), { recursive: true })
    .filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(RAIZ, 'src', f), 'utf8')).join('\n');
  assert.equal(/fetch\(|XMLHttpRequest|window\.open\(/.test(codigo), false, 'nada de pedir coisas a outros sites no código');
});

test('Poki: npm run poki gera uma pasta limpa, com o PokiSDK e o modo Poki ligado', () => {
  const { gerar } = require('../ferramentas/poki.js');
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'poki-'));
  try {
    const bytes = gerar(saida);
    assert.deepEqual(fs.readdirSync(saida).sort(), ['index.html', 'lib', 'src']);
    const html = fs.readFileSync(path.join(saida, 'index.html'), 'utf8');
    assert.ok(html.includes('window.POKI_BUILD = true'));
    assert.ok(html.includes('https://game-cdn.poki.com/scripts/v2/poki-sdk.js'));
    assert.ok(html.indexOf('poki-sdk.js') < html.indexOf('lib/phaser.min.js'), 'o SDK vem antes do jogo');
    assert.ok(bytes < 5 * 1024 * 1024, 'meta do Poki: até ~5 MB no carregamento inicial');
  } finally { fs.rmSync(saida, { recursive: true, force: true }); }
});

test('Poki: eventos na ordem certa (carregou → primeira tecla → pausa → intervalo → volta)', async () => {
  const { pagina, erros, fechar } = await abrirJogo({ poki: {} });
  try {
    await esperarCena(pagina, 'Hangar');
    await esperar(300);
    assert.deepEqual(await chamadas(pagina), ['gameLoadingFinished'], 'ao abrir, só avisa que carregou');

    await pagina.evaluate(() => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(pagina, 'Game');
    await esperar(500);
    assert.deepEqual(await chamadas(pagina), ['gameLoadingFinished'], 'abrir a partida não conta como jogar: falta o primeiro toque');

    await pagina.keyboard.press('ArrowRight');
    await esperar(200);
    assert.deepEqual(await chamadas(pagina), ['gameLoadingFinished', 'gameplayStart']);

    await pagina.keyboard.press('Escape');   // pausa
    await esperar(200);
    assert.equal(await pagina.evaluate(() => !!game.scene.getScene('Game').menuPausa), true);
    await pagina.keyboard.press('Escape');   // continuar: intervalo do Poki antes de voltar
    await esperar(100);
    const durante = await pagina.evaluate(() => ({
      chamadas: window.__poki.filter((c) => c !== 'init'),
      relogioParado: game.scene.getScene('Game').time.paused,
      ...window.__pokiDuranteAnuncio
    }));
    assert.deepEqual(durante.chamadas, ['gameLoadingFinished', 'gameplayStart', 'gameplayStop', 'commercialBreak']);
    assert.equal(durante.relogioParado, true, 'o jogo espera o anúncio acabar');
    assert.equal(durante.mudo, true, 'som mudo durante o anúncio');
    assert.equal(durante.teclado, false, 'teclado desligado durante o anúncio');

    await esperar(700);
    const depois = await pagina.evaluate(() => ({
      chamadas: window.__poki.filter((c) => c !== 'init'),
      relogioParado: game.scene.getScene('Game').time.paused,
      mudo: POKI.somMudo, teclado: game.input.keyboard.enabled
    }));
    assert.deepEqual(depois.chamadas, ['gameLoadingFinished', 'gameplayStart', 'gameplayStop', 'commercialBreak', 'gameplayStart']);
    assert.equal(depois.relogioParado, false, 'a partida volta sozinha depois do anúncio');
    assert.equal(depois.mudo, false);
    assert.equal(depois.teclado, true);

    await pagina.evaluate(() => game.scene.getScene('Game').endRun('retreat'));
    await esperar(200);
    const fim = await chamadas(pagina);
    assert.equal(fim[fim.length - 1], 'gameplayStop', 'fim de partida avisa que parou');
    for (let i = 1; i < fim.length; i++) {
      assert.ok(!(fim[i] === fim[i - 1] && fim[i].startsWith('gameplay')), 'nunca o mesmo evento duas vezes seguidas');
    }
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('Poki: recolher a nave pela pausa não chama intervalo (só ao voltar a jogar)', async () => {
  const { pagina, erros, fechar } = await abrirJogo({ poki: {} });
  try {
    await esperarCena(pagina, 'Hangar');
    await pagina.evaluate(() => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(pagina, 'Game');
    await pagina.keyboard.press('ArrowRight');
    await pagina.keyboard.press('Escape');
    await esperar(200);
    await pagina.evaluate(() => game.scene.getScene('Game').endRun('retreat'));
    await esperar(600);
    assert.deepEqual(await chamadas(pagina), ['gameLoadingFinished', 'gameplayStart', 'gameplayStop']);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('Poki: sem modo de teste e sem botão TELA CHEIA na versão do Poki', async () => {
  const { pagina, erros, fechar } = await abrirJogo({ poki: {}, busca: 'teste=1', prologo: true });
  try {
    await esperarCena(pagina, 'Game');
    await esperar(800);
    const r = await pagina.evaluate(() => ({
      modoTeste: MODO_TESTE,
      textos: game.scene.getScene('Game').children.list.filter((o) => o.type === 'Text' && o.visible).map((o) => o.text)
    }));
    assert.equal(r.modoTeste, false, '?teste=1 não liga nada no Poki');
    assert.equal(r.textos.some((t) => t.includes('TELA CHEIA')), false);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('Prólogo: botão PULAR HISTÓRIA aparece desde o início (regra do Poki)', async () => {
  const { pagina, erros, fechar } = await abrirJogo({ prologo: true });
  try {
    await esperarCena(pagina, 'Game');
    await esperar(800);
    const textos = await pagina.evaluate(() => game.scene.getScene('Game').children.list
      .filter((o) => o.type === 'Text' && o.visible).map((o) => o.text));
    assert.ok(textos.includes('PULAR HISTÓRIA'), 'o botão de pular aparece logo no começo');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('Página: setas, espaço e roda do mouse não rolam a página', async () => {
  const { pagina, erros, fechar } = await abrirJogo();
  try {
    await esperarCena(pagina, 'Hangar');
    const bloqueados = await pagina.evaluate(() => {
      const tecla = (key) => { const e = new KeyboardEvent('keydown', { key, cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; };
      const roda = new WheelEvent('wheel', { cancelable: true }); window.dispatchEvent(roda);
      return { espaco: tecla(' '), baixo: tecla('ArrowDown'), cima: tecla('ArrowUp'), roda: roda.defaultPrevented, letra: tecla('a') };
    });
    assert.deepEqual(bloqueados, { espaco: true, baixo: true, cima: true, roda: true, letra: false });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('Poki: as setas continuam movendo a nave (a trava de rolagem não atrapalha o jogo)', async () => {
  const { pagina, erros, fechar } = await abrirJogo({ poki: {} });
  try {
    await esperarCena(pagina, 'Hangar');
    await pagina.evaluate(() => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(pagina, 'Game');
    await esperar(500);
    const antes = await pagina.evaluate(() => game.scene.getScene('Game').player.x);
    await pagina.keyboard.down('ArrowRight');
    await esperar(600);
    await pagina.keyboard.up('ArrowRight');
    const depois = await pagina.evaluate(() => game.scene.getScene('Game').player.x);
    assert.ok(depois - antes > 30 || antes - depois > 1000, 'a nave andou para a direita (ou deu a volta no mapa)');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});
