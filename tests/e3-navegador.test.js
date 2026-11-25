// E3 — mapa que dá a volta visto no navegador (CT-16, CT-17 a CT-26 do arquivo de testes)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperarRelogio = (pagina, t) => pagina.waitForFunction(
  (alvo) => game.scene.getScene('Game').elapsed >= alvo, { timeout: 30000 }, t);

async function partida(gi = 0) {
  const j = await abrirJogo({ busca: 'teste=1' });
  await esperarCena(j.pagina, 'Hangar');
  await G(j.pagina, (n) => game.scene.getScene('Hangar').scene.start('Game', { ship: n }), gi);
  await esperarCena(j.pagina, 'Game');
  await esperar(300);
  // sem inimigos nascendo durante estes testes
  await G(j.pagina, () => {
    const g = game.scene.getScene('Game'); g.ritmoParado = true;
    g.enemies.children.iterate((e) => { if (e && e.active) e.disableBody(true, true); });
  });
  return j;
}
// espera um pouco de tempo DE JOGO (o Chrome sem tela roda mais devagar)
async function esperarJogo(pagina, s) {
  const t0 = await G(pagina, () => game.scene.getScene('Game').elapsed);
  await esperarRelogio(pagina, t0 + s);
}

test('CT-16/26: mapa ~8x maior que o antigo e 30 locais únicos por galáxia, com tipos novos', async () => {
  const { pagina, erros, fechar } = await partida();
  try {
    const r = await G(pagina, () => {
      const out = [];
      for (let gi = 0; gi < 3; gi++) {
        const lista = genPOIs(gi);
        let menor = Infinity;
        lista.forEach((a, i) => lista.forEach((b, k) => {
          if (k <= i) return;
          const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
          menor = Math.min(menor, Math.hypot(Math.min(dx, WORLD - dx), Math.min(dy, WORLD - dy)));
        }));
        out.push({ n: lista.length, tipos: [...new Set(lista.map((p) => p.type))].sort(), menor,
          dentro: lista.every((p) => p.x >= 0 && p.x < WORLD && p.y >= 0 && p.y < WORLD) });
      }
      return { world: WORLD, out };
    });
    assert.ok(r.world >= 16500 && r.world <= 17500, 'tamanho ' + r.world);
    r.out.forEach((g) => {
      assert.equal(g.n, 30);
      assert.ok(g.dentro);
      assert.ok(g.menor >= 700, 'locais muito colados (mesmo contando a emenda): ' + g.menor);
      ['blackhole', 'nest', 'planet', 'relic', 'station'].forEach((t) => assert.ok(g.tipos.includes(t), t));
      const novos = g.tipos.filter((t) => !['blackhole', 'nest', 'planet', 'relic', 'station'].includes(t));
      assert.ok(novos.length >= 2 && novos.length <= 3, 'tipos novos: ' + novos);
    });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-20: não há borda; voando para a direita a nave passa da emenda e segue', async () => {
  const { pagina, erros, fechar } = await partida();
  try {
    await G(pagina, () => { const g = game.scene.getScene('Game'); g.player.x = WORLD - 60; });
    await esperarJogo(pagina, 0.3);
    await G(pagina, () => { window.__voar = setInterval(() => game.scene.getScene('Game').player.setVelocityX(400), 16); });
    await esperarJogo(pagina, 1.5);
    const r = await G(pagina, () => { clearInterval(window.__voar); const g = game.scene.getScene('Game');
      return { x: g.player.x, bordas: g.player.body.collideWorldBounds }; });
    assert.equal(r.bordas, false, 'a nave não pode bater em borda');
    assert.ok(r.x > 17000, 'a nave deveria ter passado da emenda, x = ' + r.x);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-21/22: inimigo do outro lado da emenda vem pelo caminho curto e leva tiro', async () => {
  const { pagina, erros, fechar } = await partida();
  try {
    await G(pagina, () => {
      const g = game.scene.getScene('Game');
      g.player.x = WORLD - 60;
      const e = g.spawnEnemy('bug', 200, g.player.y); // 260 px pela emenda, 16.540 px "por dentro"
      e.hp = e.maxHp = 1e9; window.__e = e;
    });
    await esperarJogo(pagina, 2);
    const r = await G(pagina, () => { const g = game.scene.getScene('Game'), e = window.__e;
      return { d: Math.hypot(e.x - g.player.x, e.y - g.player.y), dano: e.maxHp - e.hp }; });
    assert.ok(r.d < 400, 'o inimigo deveria estar perto, está a ' + Math.round(r.d));
    assert.ok(r.dano > 0, 'o inimigo do outro lado deveria levar tiro');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-23: gema do outro lado da emenda é coletada', async () => {
  const { pagina, erros, fechar } = await partida();
  try {
    const xp0 = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      g.player.x = WORLD - 30;
      g.dropGem(40, g.player.y, 5);
      return g.xp + g.level * 1000;
    });
    await esperarJogo(pagina, 2);
    const xp1 = await G(pagina, () => { const g = game.scene.getScene('Game'); return g.xp + g.level * 1000; });
    assert.ok(xp1 > xp0, 'a gema do outro lado deveria ter sido coletada');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-24/25: locais e minimapa continuam certos depois de cruzar a emenda', async () => {
  const { pagina, erros, fechar } = await partida();
  try {
    await G(pagina, () => { const g = game.scene.getScene('Game'); g.player.x += 3 * WORLD + 123; });
    await esperarJogo(pagina, 1);
    const r = await G(pagina, () => {
      const g = game.scene.getScene('Game'), px = g.player.x, py = g.player.y;
      const longe = g.pois.filter((p) => Math.abs(p.x - px) > WORLD / 2 + 1 || Math.abs(p.y - py) > WORLD / 2 + 1).length;
      const juntos = g.pois.every((p) => p.img.x === p.x && p.img.y === p.y && p.label.x === p.x);
      return { longe, juntos };
    });
    assert.equal(r.longe, 0, 'todo local deve estar do lado mais perto da nave');
    assert.equal(r.juntos, true, 'imagem e nome do local andam junto com ele');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});
