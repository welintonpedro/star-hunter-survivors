// Pedidos do dono em 25/11/2026 (RN-62 a RN-65): itens de meteoro com poderes temporários,
// Super Míssil e Nova Radial, armas sorteadas por partida e textos legíveis no celular.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function partida(opcoes) {
  const j = await abrirJogo(Object.assign({ busca: 'teste=1' }, opcoes || {}));
  await esperarCena(j.pagina, 'Hangar');
  await G(j.pagina, () => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
  await esperarCena(j.pagina, 'Game');
  await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.ritmoParado = true; g.mods.maxHp = 1e9; g.hp = 1e9; });
  return j;
}
// inimigo comum parado num ponto relativo à nave
const criar = (dx, dy) => {
  const g = game.scene.getScene('Game');
  g.spawnEnemy('g1_rastejador');
  let e = null; g.enemies.children.iterate((o) => { if (o && o.active && !o.isBoss && !o.isElite && !o.__usado) e = o; });
  e.__usado = true; e.body.reset(g.player.x + dx, g.player.y + dy);
  return e;
};

test('RN-62: meteoro sorteia créditos, vida, ímã e os 3 poderes; cristal dá créditos e um item extra', async () => {
  const j = await partida();
  try {
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game'), conta = {}, contaCristal = {};
      for (let i = 0; i < 3000; i++) { const k = g.sortearItemMeteoro(false); conta[k] = (conta[k] || 0) + 1; }
      for (let i = 0; i < 500; i++) { const k = g.sortearItemMeteoro(true); contaCristal[k] = (contaCristal[k] || 0) + 1; }
      g.pickups.clear(true, true);
      g.breakRock(g.criarMeteoro(g.player.x + 300, g.player.y, true));
      const cristal = []; g.pickups.children.iterate((p) => { if (p && p.active) cristal.push(p.ptype); });
      return { conta, contaCristal, cristal };
    });
    ['coin', 'heal', 'magnet', 'congelar', 'lento', 'chamas'].forEach((k) => assert.ok(r.conta[k] > 0, k + ' nunca saiu'));
    assert.ok(r.conta.coin > 1500, 'créditos continuam sendo o mais comum');
    assert.equal(r.contaCristal.coin, undefined, 'o sorteio extra do cristal não repete moeda');
    assert.equal(r.cristal.length, 2);
    assert.ok(r.cristal.includes('coin'));
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-62: "tempo parado" congela os inimigos e "lentidão" deixa mais lentos; depois voltam ao normal', async () => {
  const j = await partida();
  try {
    await G(j.pagina, (src) => { const c = eval(src); window.__e = c(260, 0); }, '(' + criar.toString() + ')');
    await esperar(300);
    const normal = await G(j.pagina, () => Math.hypot(__e.body.velocity.x, __e.body.velocity.y));
    await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.dropPickup(g.player.x, g.player.y, 'congelar'); });
    await esperar(300);
    const congelado = await G(j.pagina, () => ({ v: Math.hypot(__e.body.velocity.x, __e.body.velocity.y), tint: __e.tintTopLeft }));
    await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.congeladoAte = 0; g.dropPickup(g.player.x, g.player.y, 'lento'); });
    await esperar(300);
    const lento = await G(j.pagina, () => Math.hypot(__e.body.velocity.x, __e.body.velocity.y));
    await G(j.pagina, () => { game.scene.getScene('Game').lentoAte = 0; });
    await esperar(300);
    const depois = await G(j.pagina, () => ({ v: Math.hypot(__e.body.velocity.x, __e.body.velocity.y), tint: __e.tintTopLeft }));
    assert.ok(normal > 10, 'o inimigo deveria estar andando');
    assert.equal(congelado.v, 0);
    assert.ok(lento < normal * 0.7 && lento > 0, 'lento ' + lento + ' normal ' + normal);
    assert.ok(depois.v > normal * 0.8);
    assert.equal(depois.tint, 0xffffff, 'a cor volta ao normal');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-62: lança-chamas queima quem está na frente, não quem está atrás', async () => {
  const j = await partida();
  try {
    const r = await G(j.pagina, (src) => {
      const c = eval(src), g = game.scene.getScene('Game');
      g.weapons.forEach((w) => { w.timer = 1e9; });   // só o fogo causa dano
      const frente = c(120, 0), atras = c(-200, 0);
      frente.hp = frente.maxHp = 1e6; atras.hp = atras.maxHp = 1e6;
      frente.speedV = 0; atras.speedV = 0;
      window.__f = frente; window.__a = atras;
      g.dropPickup(g.player.x, g.player.y, 'chamas');
      return true;
    }, '(' + criar.toString() + ')');
    assert.ok(r);
    await esperar(1500);
    const dano = await G(j.pagina, () => ({ frente: __f.maxHp - __f.hp, atras: __a.maxHp - __a.hp, ativo: game.scene.getScene('Game').chamasAte > game.scene.getScene('Game').elapsed }));
    assert.ok(dano.ativo);
    assert.ok(dano.frente > 0, 'quem está na frente queima');
    assert.equal(dano.atras, 0, 'quem está atrás não queima');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-63: Super Míssil tem explosão bem maior e recarga mais lenta que o míssil comum; Nova Radial atira em volta toda', async () => {
  const j = await partida();
  try {
    const r = await G(j.pagina, (src) => {
      const c = eval(src), g = game.scene.getScene('Game');
      const sm = WEAPONS.supermissil.stats(1), mc = WEAPONS.missiles.stats(1);
      c(200, 0); c(-200, 0);
      g.bullets.children.iterate((b) => { if (b && b.active) b.disableBody(true, true); });
      const s = g.wstats({ id: 'nova', level: 1 });
      g.fireNova(s);
      const angulos = []; g.bullets.children.iterate((b) => { if (b && b.active) angulos.push(Math.atan2(b.body.velocity.y, b.body.velocity.x)); });
      const quadrantes = new Set(angulos.map((a) => Math.floor(((a + Math.PI) / (Math.PI / 2))) % 4));
      const antes = g.missiles.length;
      g.fireSuperMissil(g.wstats({ id: 'supermissil', level: 1 }));
      const grande = g.missiles.slice(antes).every((m) => m.grande && m.radius >= 100);
      return { raioSM: sm.radius, raioMC: mc.radius, cdSM: sm.cd, cdMC: mc.cd, tiros: angulos.length, quadrantes: quadrantes.size, quantos: s.amount, grande };
    }, '(' + criar.toString() + ')');
    assert.ok(r.raioSM >= r.raioMC * 2);
    assert.ok(r.cdSM > r.cdMC * 1.8);
    assert.equal(r.tiros, r.quantos);
    assert.equal(r.quadrantes, 4, 'tiros para todos os lados');
    assert.ok(r.grande);
    await esperar(2500);   // míssil chega e explode sem erro
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-64: cada partida sorteia 5 armas comuns; as cartas nunca oferecem arma fora do sorteio', async () => {
  const j = await partida();
  try {
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game'), sorteios = new Set(), fora = [];
      for (let k = 0; k < 40; k++) {
        g.armasDaPartida = g.sortearArmasDaPartida();
        sorteios.add(g.armasDaPartida.slice().sort().join(','));
        g.upgradeOptions().forEach((o) => { if (o.kind === 'weapon' && o.level === 1 && !g.armasDaPartida.includes(o.id)) fora.push(o.id); });
      }
      return { tamanho: g.armasDaPartida.length, poder: g.armasDaPartida.some((id) => WEAPONS[id].poder), variados: sorteios.size, fora };
    });
    assert.equal(r.tamanho, 5);
    assert.equal(r.poder, false, 'poder de nave não entra no sorteio');
    assert.ok(r.variados > 1, 'partidas diferentes têm armas diferentes');
    assert.deepEqual(r.fora, []);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-65: tela esticada de forma suave (texto legível no celular) e desenhos com filtro nítido', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const r = await G(j.pagina, () => ({
      pixelArt: game.config.pixelArt, antialias: game.config.antialias,
      css: getComputedStyle(game.canvas).imageRendering,
      filtro: game.textures.get('ship_falcao').source[0].scaleMode
    }));
    assert.equal(r.pixelArt, false);
    assert.equal(r.antialias, true);
    assert.ok(!/pixelated|crisp/.test(r.css), 'o navegador não pode esticar a tela em blocos: ' + r.css);
    assert.equal(r.filtro, 1, 'textura do desenho com filtro nearest (1)');
  } finally { await j.fechar(); }
});

test('RN-61/63: nomes e textos das tabelas (armas novas incluídas) têm tradução nos 6 idiomas', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const faltam = await G(j.pagina, () => {
      const textos = new Set();
      const add = (v) => { if (Array.isArray(v)) v.forEach(add); else if (typeof v === 'string' && v.trim()) textos.add(v); };
      [Object.values(WEAPONS), Object.values(PASSIVES), Object.values(SOBRECARGAS), SHIPS, GALAXIES, META_UPGRADES, CONQUISTAS, TIPOS_DE_LOCAL]
        .forEach((l) => l.forEach((o) => o.__pt && Object.values(o.__pt).forEach(add)));
      const out = {};
      Object.keys(TRADUCOES).forEach((id) => { out[id] = [...textos].filter((t) => TRADUCOES[id][t] === undefined); });
      return out;
    });
    assert.deepEqual(Object.keys(faltam).sort(), ['de', 'en', 'es', 'fr', 'it', 'tr']);
    Object.entries(faltam).forEach(([id, lista]) => assert.deepEqual(lista, [], id));
  } finally { await j.fechar(); }
});
