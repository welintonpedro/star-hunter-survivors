// Tela cheia em qualquer aparelho (RN-88): o jogo se adapta ao formato da tela, sem faixas pretas
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');

const CODIGO = fs.readFileSync(path.join(__dirname, '..', 'src', 'config.js'), 'utf8');
function tamanho(largura, altura) {
  const ctx = { window: { innerWidth: largura, innerHeight: altura } };
  vm.runInNewContext(CODIGO + '\n;this.__r = [W, H];', ctx);
  return Array.from(ctx.__r);   // cópia feita aqui (lista de outro contexto não compara igual)
}

test('RN-88: o tamanho interno acompanha o formato do aparelho (base 960×540)', () => {
  assert.deepEqual(tamanho(960, 540), [960, 540], 'computador 16:9 continua igual');
  assert.deepEqual(tamanho(1366, 768), [960, 540]);
  const [wCel, hCel] = tamanho(844, 390);          // iPhone deitado (~19,5:9)
  assert.equal(hCel, 540); assert.ok(Math.abs(wCel / hCel - 844 / 390) < 0.01);
  assert.deepEqual(tamanho(390, 844), tamanho(844, 390), 'em pé usa o formato deitado (o jogo é horizontal)');
  const [wTab, hTab] = tamanho(1024, 768);         // iPad 4:3
  assert.equal(wTab, 960); assert.equal(hTab, 720);
  const [wMax] = tamanho(3000, 400);               // formato absurdo: tem limite
  assert.ok(wMax <= Math.round(540 * 2.4) + 2);
});

test('RN-88: no celular deitado o jogo ocupa a tela toda; em pé aparece o aviso para girar', async () => {
  for (const [w, h, cheio] of [[844, 390, true], [1024, 768, true], [390, 844, false]]) {
    const j = await abrirJogo();
    try {
      await j.pagina.setViewport({ width: w, height: h, hasTouch: true, isMobile: true });
      await j.pagina.reload();
      await esperarCena(j.pagina, 'Hangar');
      const r = await j.pagina.evaluate(() => {
        const c = game.canvas.getBoundingClientRect();
        return { area: (c.width * c.height) / (innerWidth * innerHeight), gire: getComputedStyle(document.getElementById('gire')).display };
      });
      if (cheio) { assert.ok(r.area > 0.98, w + 'x' + h + ' usa ' + r.area); assert.equal(r.gire, 'none'); }
      else assert.equal(r.gire, 'flex', 'em pé: aviso para deitar o celular');
      assert.deepEqual(j.erros, []);
    } finally { await j.fechar(); }
  }
});
