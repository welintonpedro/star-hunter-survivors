// E4/E5 — os 30 inimigos funcionando no navegador
// Casos: CT-27 a CT-32 e comportamentos especiais (escudo, fantasma, kamikaze, minas, névoa, sentinela)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');

const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperarRelogio = (pagina, t) => pagina.waitForFunction(
  (alvo) => game.scene.getScene('Game').elapsed >= alvo, { timeout: 40000 }, t);
async function esperarJogo(pagina, s) {
  const t0 = await G(pagina, () => game.scene.getScene('Game').elapsed);
  await esperarRelogio(pagina, t0 + s);
}

// Partida na galáxia gi (a nave gi começa na galáxia gi), sem nascer ninguém e com a nave "imortal"
async function partida(gi = 0, imortal = true) {
  const j = await abrirJogo({ busca: 'teste=1' });
  await esperarCena(j.pagina, 'Hangar');
  await G(j.pagina, (n) => game.scene.getScene('Hangar').scene.start('Game', { ship: n }), gi);
  await esperarCena(j.pagina, 'Game');
  await G(j.pagina, (im) => {
    const g = game.scene.getScene('Game');
    g.ritmoParado = true;
    g.enemies.children.iterate((e) => { if (e && e.active) e.disableBody(true, true); });
    if (im) { g.mods.maxHp = 1e9; g.hp = 1e9; }
    // sem armas: só observamos os inimigos
    g.weapons.forEach((w) => { w.timer = 1e9; });
    g.weapons = g.weapons.filter((w) => w.id !== 'orbital');
    (g.orbs || []).forEach((o) => o.destroy()); g.orbs = [];
  }, imortal);
  return j;
}

for (let gi = 0; gi < 3; gi++) {
  test('galáxia ' + (gi + 1) + ': os 10 inimigos nascem, agem por alguns segundos e não dão erro', async () => {
    const { pagina, erros, fechar } = await partida(gi);
    try {
      await G(pagina, (n) => {
        const g = game.scene.getScene('Game');
        window.__ini = INIMIGOS_POR_GALAXIA[n].map((id, i) => {
          const a = i / 10 * Math.PI * 2;
          const e = g.spawnEnemy(id, g.player.x + Math.cos(a) * 380, g.player.y + Math.sin(a) * 380);
          return { id, e, est: e.est, x: e.x, y: e.y };
        });
      }, gi);
      await esperarJogo(pagina, 6);
      // um inimigo que morreu (ex.: bomba que explodiu) pode ter o lugar reaproveitado por outro
      const r = await G(pagina, () => window.__ini.map((o) => ({
        id: o.id, morreu: !o.e.active || o.e.est !== o.est,
        textura: o.e.texture.key, andou: Math.hypot(o.e.x - o.x, o.e.y - o.y), comp: o.e.comp
      })));
      r.forEach((o) => {
        if (o.morreu) return;
        assert.equal(o.textura, 'ini_' + o.id, 'desenho próprio');
        if (o.comp !== 'sentinela') assert.ok(o.andou > 5, o.id + ' não se mexeu');
      });
      assert.deepEqual(erros, []);
    } finally { await fechar(); }
  });
}

test('CT-29: o Esporo (divisor) vira 2 Esporinhos ao morrer', async () => {
  const { pagina, erros, fechar } = await partida(0);
  try {
    const n = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      const e = g.spawnEnemy('g1_esporo', g.player.x + 300, g.player.y);
      g.damageTarget(e, e.hp + 1);
      let f = 0; g.enemies.children.iterate((o) => { if (o && o.active && o.idInimigo === 'g1_esporinho') f++; });
      return f;
    });
    assert.equal(n, 2);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-30: o Gatuno rouba gemas e devolve ao morrer', async () => {
  const { pagina, erros, fechar } = await partida(1);
  try {
    await G(pagina, () => {
      const g = game.scene.getScene('Game');
      const x = g.player.x + 650, y = g.player.y;
      window.__gatuno = g.spawnEnemy('g2_gatuno', x, y);
      for (let i = 0; i < 4; i++) g.dropGem(x + 40 + i * 12, y + 30, 3);
    });
    await esperarJogo(pagina, 3);
    const r = await G(pagina, () => {
      const g = game.scene.getScene('Game'), e = window.__gatuno;
      const roubou = e.roubadas;
      g.damageTarget(e, e.hp + 1);
      let devolvida = 0; g.gems.children.iterate((o) => { if (o && o.active && Math.hypot(o.x - e.x, o.y - e.y) < 5) devolvida += o.val; });
      return { roubou, devolvida };
    });
    assert.ok(r.roubou >= 3, 'deveria ter roubado gemas: ' + r.roubou);
    assert.ok(r.devolvida >= r.roubou, 'deveria devolver as gemas ao morrer');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('Escudeiro: tiro de frente quase não fere; tiro por trás fere normal', async () => {
  const { pagina, erros, fechar } = await partida(0);
  try {
    const r = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      const e = g.spawnEnemy('g1_escudeiro', g.player.x + 300, g.player.y);
      e.hp = e.maxHp = 1000; e.est.escudoAng = Math.PI; // escudo virado para a nave (à esquerda)
      const tiro = (x) => ({ active: true, hitSet: new Set(), dmg: 100, x, y: e.y, pierceLeft: 1, disableBody() {} });
      g.onBulletHit(tiro(e.x - 20), e); const frente = 1000 - e.hp;
      g.onBulletHit(tiro(e.x + 20), e); const tras = 1000 - frente - e.hp;
      return { frente, tras };
    });
    assert.ok(r.frente <= 20, 'de frente: ' + r.frente);
    assert.equal(r.tras, 100);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('Espectro: quando intangível não leva dano, não é mirado e não fere a nave', async () => {
  const { pagina, erros, fechar } = await partida(2);
  try {
    await G(pagina, () => {
      const g = game.scene.getScene('Game');
      window.__f = g.spawnEnemy('g3_espectro', g.player.x + 200, g.player.y);
      window.__f.est.ciclo = 3; window.__f.speedV = 0;
    });
    await esperarJogo(pagina, 0.3);
    const r = await G(pagina, () => {
      const g = game.scene.getScene('Game'), e = window.__f;
      const hp = e.hp; g.damageTarget(e, 999);
      return { intangivel: e.intangivel, alpha: e.alpha, semDano: e.hp === hp, mirado: g.nearestEnemy(600) === e };
    });
    assert.deepEqual(r, { intangivel: true, alpha: 0.22, semDano: true, mirado: false });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('Bolha Explosiva: explode perto da nave, fere e não dá recompensa', async () => {
  const { pagina, erros, fechar } = await partida(0, false);
  try {
    const antes = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      g.mods.maxHp = 1000; g.hp = 1000;
      window.__b = g.spawnEnemy('g1_bolha', g.player.x + 120, g.player.y);
      return { hp: g.hp, abates: g.kills };
    });
    await esperarJogo(pagina, 2);
    const depois = await G(pagina, () => { const g = game.scene.getScene('Game'); return { hp: g.hp, abates: g.kills, viva: window.__b.active }; });
    assert.equal(depois.viva, false);
    assert.ok(depois.hp < antes.hp, 'a explosão deveria ferir');
    assert.equal(depois.abates, antes.abates, 'explodir sozinha não conta como abate');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('Minador solta minas; Sentinela lança míssil teleguiado; Névoa deixa a nave lenta', async () => {
  const { pagina, erros, fechar } = await partida(1);
  try {
    await G(pagina, () => { const g = game.scene.getScene('Game'); g.spawnEnemy('g2_minador', g.player.x + 350, g.player.y); });
    await esperarJogo(pagina, 4);
    const minas = await G(pagina, () => { let n = 0; game.scene.getScene('Game').ebullets.children.iterate((b) => { if (b && b.active && b.texture.key === 'mina') n++; }); return n; });
    assert.ok(minas >= 1, 'deveria haver mina no chão');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }

  const j2 = await partida(2);
  try {
    await G(j2.pagina, () => {
      const g = game.scene.getScene('Game');
      g.spawnEnemy('g3_sentinela', g.player.x + 400, g.player.y);
      const n = g.spawnEnemy('g3_nevoa', g.player.x + 60, g.player.y); n.speedV = 0; n.hp = n.maxHp = 1e9;
    });
    await esperarJogo(j2.pagina, 4);
    const r = await G(j2.pagina, () => {
      const g = game.scene.getScene('Game');
      let teleguiado = 0; g.ebullets.children.iterate((b) => { if (b && b.active && b.teleguiado) teleguiado++; });
      return { teleguiado, lentidao: g.lentidao };
    });
    assert.ok(r.teleguiado >= 1, 'a sentinela deveria ter lançado um míssil');
    assert.ok(r.lentidao < 1, 'a névoa deveria deixar a nave lenta');
    assert.deepEqual(j2.erros, []);
  } finally { await j2.fechar(); }
});

test('CT-31: nunca mais de 250 inimigos na tela', async () => {
  const { pagina, erros, fechar } = await partida(0);
  try {
    const n = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      for (let i = 0; i < 400; i++) g.spawnEnemy('g1_rastejador');
      return g.enemies.countActive(true);
    });
    assert.ok(n <= 250, 'vivos: ' + n);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});
