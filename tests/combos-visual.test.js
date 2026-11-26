// Pedidos do dono em 26/11/2026: visual próprio para cada combo (RN-80)
// e monstros continuando durante a aula das joias do prólogo (RN-79)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { WEAPONS, VISUAL_COMBOS } = require('../src/dados/armas');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

test('RN-80: toda arma com combo tem um visual próprio (cores e descrição) e cores diferentes entre si', () => {
  const comCombo = Object.keys(WEAPONS).filter((k) => WEAPONS[k].evo);
  assert.ok(comCombo.length >= 11);
  comCombo.forEach((k) => {
    const v = VISUAL_COMBOS[k];
    assert.ok(v, 'visual de ' + k);
    assert.equal(typeof v.cor, 'number'); assert.equal(typeof v.cor2, 'number');
    assert.ok(v.efeito && v.efeito.length > 5);
  });
  // nenhuma descrição repetida: cada combo é único
  assert.equal(new Set(comCombo.map((k) => VISUAL_COMBOS[k].efeito)).size, comCombo.length);
  // a descrição aparece no baú e precisa existir nos 6 idiomas
  ['en', 'es', 'fr', 'it', 'de', 'tr'].forEach((l) => {
    const txt = fs.readFileSync(path.join(__dirname, '..', 'src', 'idiomas', l + '.js'), 'utf8');
    comCombo.forEach((k) => assert.ok(txt.includes(JSON.stringify(VISUAL_COMBOS[k].efeito)), l + ': ' + VISUAL_COMBOS[k].efeito));
  });
});

// liga as armas já com combo e deixa a nave lutar uns segundos
async function lutarComCombos(armas) {
  const j = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    await G(j.pagina, () => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(j.pagina, 'Game');
    await G(j.pagina, (ids) => {
      const g = game.scene.getScene('Game');
      g.weapons.length = 0;
      ids.forEach((id) => g.weapons.push({ id, level: 5, evolved: true, timer: 0.1 }));
      g.hp = 1e9; g.mods.maxHp = 1e9;
      for (let i = 0; i < 40; i++) g.spawnEnemy(INIMIGOS_POR_GALAXIA[0][0]);
      window.__visto = { combo: 0, rastro: 0, missil: 0, disco: 0, halo: 0 };
      window.__olho = setInterval(() => {
        const v = window.__visto;
        g.bullets.children.iterate((b) => { if (b && b.active && b.texture.key === 'bullet_combo') { v.combo++; if (b.rastro) v.rastro++; } });
        g.missiles.forEach((m) => { if (m.visual) v.missil++; });
        g.discs.forEach((d) => { if (d.visual) v.disco++; });
        g.orbs.forEach((o) => { if (o.halo) v.halo++; });
        if (g.contarComuns() < 20) for (let i = 0; i < 10; i++) g.spawnEnemy(INIMIGOS_POR_GALAXIA[0][0]);
      }, 200);
    }, armas);
    await esperar(5000);
    const v = await G(j.pagina, () => window.__visto);
    assert.deepEqual(j.erros, []);
    return v;
  } finally { await j.fechar(); }
}

test('RN-80: tiros, mísseis, serras e esferas de combo aparecem com o visual novo, sem erros', async () => {
  const a = await lutarComCombos(['rajada', 'pulsar', 'missiles', 'orbital', 'disc', 'supermissil']);
  assert.ok(a.combo > 0 && a.rastro > 0, 'tiros de combo com rastro');
  assert.ok(a.missil > 0, 'mísseis de combo');
  assert.ok(a.disco > 0, 'serras de combo');
  assert.ok(a.halo > 0, 'esferas com halo');
  const b = await lutarComCombos(['agulhas', 'nova', 'martelo', 'shock', 'chain']);
  assert.ok(b.combo > 0, 'agulhas/supernova com visual de combo');
});

test('RN-79: na aula das joias do prólogo os monstros continuam vindo', async () => {
  const j = await abrirJogo({ prologo: true });
  try {
    await esperarCena(j.pagina, 'Game');
    await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.enemies.children.iterate((e) => { if (e && e.active) e.disableBody(true, true); });
      g.pr.i = ROTEIRO_PROLOGO.findIndex((p) => p.id === 'joias') - 1;
      g.proximoPassoPrologo();
      g.xp = 0;   // não sobe de nível na hora: dá tempo de ver a etapa
    });
    await esperar(2500);
    const r = await G(j.pagina, () => { const g = game.scene.getScene('Game'); return { etapa: g.passoAtual().id, vivos: g.contarComuns() }; });
    assert.equal(r.etapa, 'joias');
    assert.ok(r.vivos >= 5, 'monstros durante a aula das joias: ' + r.vivos);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-81: lança-chamas solta chamas macias que mudam de cor (amarelo → laranja → vermelho) e somem depois', async () => {
  const j = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    await G(j.pagina, () => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(j.pagina, 'Game');
    await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.hp = 1e9; g.mods.maxHp = 1e9; g.chamasAte = g.elapsed + 3; });
    await esperar(1500);
    const durante = await G(j.pagina, () => {
      const g = game.scene.getScene('Game'), cores = new Set();
      let n = 0;
      g.chamasFx.children.iterate((f) => { if (f && f.active) { n++; cores.add(f.tintTopLeft); } });
      return { n, cores: cores.size, textura: g.chamasFx.getFirstAlive() && g.chamasFx.getFirstAlive().texture.key };
    });
    assert.ok(durante.n >= 8, 'chamas na tela: ' + durante.n);
    assert.ok(durante.cores >= 3, 'chama muda de cor');
    assert.equal(durante.textura, 'fogo');
    // espera o poder acabar no relógio do jogo (o navegador de teste roda mais devagar)
    await j.pagina.waitForFunction(() => { const g = game.scene.getScene('Game'); return g.elapsed > g.chamasAte + 1; }, { timeout: 20000, polling: 200 });
    const depois = await G(j.pagina, () => { const g = game.scene.getScene('Game'); let n = 0; g.chamasFx.children.iterate((f) => { if (f && f.active) n++; }); return { n, vivas: g.chamasVivas }; });
    assert.deepEqual(depois, { n: 0, vivas: 0 }, 'acabou o poder, acabou o fogo');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
