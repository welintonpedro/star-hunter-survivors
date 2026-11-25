// E2 — partida de 30 min vista no navegador (com ?teste=1 para pular o relógio)
// Casos: CT-07/08 (chefe com baú), CT-11, CT-12, CT-13, CT-17, CT-18, CT-19, CT-66 a CT-70
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Abre o jogo no modo de teste e entra numa partida com a nave escolhida
async function partida(nave = 0) {
  const j = await abrirJogo({ busca: 'teste=1' });
  await esperarCena(j.pagina, 'Hangar');
  await j.pagina.evaluate((n) => game.scene.getScene('Hangar').scene.start('Game', { ship: n }), nave);
  await esperarCena(j.pagina, 'Game');
  await esperar(300);
  return j;
}
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
// Espera o relógio DA PARTIDA chegar a t (o Chrome sem tela roda o jogo mais devagar que o tempo real)
const esperarRelogio = (pagina, t) => pagina.waitForFunction(
  (alvo) => game.scene.getScene('Game').elapsed >= alvo, { timeout: 30000 }, t);

// Deixa só um alvo de inimigo parado a "dist" px e um meteoro colado na nave
async function cenaDoMeteoro(pagina, dist) {
  return G(pagina, (d) => {
    const g = game.scene.getScene('Game');
    g.ritmoParado = true; // não nasce mais ninguém durante o teste
    g.enemies.children.iterate((e) => { if (e && e.active) e.disableBody(true, true); });
    g.rocks.children.iterate((r) => { if (r && r.active) r.disableBody(true, true); });
    const px = g.player.x, py = g.player.y;
    const e = g.spawnEnemy('saucer', px, py - d);
    e.hp = e.maxHp = 1e9; e.speedV = 0;
    const r = g.criarMeteoro(px + 80, py, false);
    r.hp = r.maxHp = 1e9; // não quebra: só queremos ver se é atingido
    window.__meteoro = r;
    return true;
  }, dist);
}

test('CT-66: meteoro colado na nave é atacado mesmo com inimigo por perto (Falcão)', async () => {
  const { pagina, erros, fechar } = await partida(0);
  try {
    await cenaDoMeteoro(pagina, 300);
    await esperarRelogio(pagina, (await G(pagina, () => game.scene.getScene('Game').elapsed)) + 3);
    const dano = await G(pagina, () => window.__meteoro.maxHp - window.__meteoro.hp);
    assert.ok(dano > 0, 'o meteoro deveria ter levado dano');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-67: os mísseis atacam meteoro colado quando não há inimigo perto', async () => {
  const { pagina, erros, fechar } = await partida(1);
  try {
    // desde a E6 o Titã começa com o Martelo; aqui ele fica só com os Mísseis Teleguiados
    await G(pagina, () => { const g = game.scene.getScene('Game'); g.weapons = []; g.addWeapon('missiles'); });
    await cenaDoMeteoro(pagina, 1100);
    await esperarRelogio(pagina, (await G(pagina, () => game.scene.getScene('Game').elapsed)) + 5);
    const dano = await G(pagina, () => window.__meteoro.maxHp - window.__meteoro.hp);
    assert.ok(dano > 0, 'o meteoro deveria ter levado dano dos mísseis');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-68/69: com o automático ligado o chefe espera; ao desligar, ele aparece. Subchefe vem mesmo no auto', async () => {
  const { pagina, erros, fechar } = await partida(0);
  try {
    await G(pagina, () => { const g = game.scene.getScene('Game'); g.toggleAuto(); g.testeIrPara(178); });
    await esperarRelogio(pagina, 181);
    const sub = await G(pagina, () => { let n = 0; game.scene.getScene('Game').enemies.children.iterate((e) => { if (e && e.active && e.isElite) n++; }); return n; });
    assert.ok(sub >= 1, 'o subchefe dos 3:00 deveria aparecer mesmo no auto');

    await G(pagina, () => game.scene.getScene('Game').testeIrPara(598));
    await esperarRelogio(pagina, 601);
    let estado = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      let chefes = 0; g.enemies.children.iterate((e) => { if (e && e.active && e.isBoss) chefes++; });
      return { chefes, dica: g.hintText.text, tempo: g.elapsed };
    });
    assert.ok(estado.tempo > 600);
    assert.equal(estado.chefes, 0, 'chefe não pode aparecer com o auto ligado');
    assert.match(estado.dica, /AUTO/);

    await G(pagina, () => game.scene.getScene('Game').toggleAuto());
    await esperar(600);
    estado = await G(pagina, () => { let c = 0; game.scene.getScene('Game').enemies.children.iterate((e) => { if (e && e.active && e.isBoss) c++; }); return c; });
    assert.equal(estado, 1, 'ao desligar o auto, o chefe deveria aparecer');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-10/11: chefe derrotado solta um baú e não libera nave nem galáxia', async () => {
  const { pagina, erros, fechar } = await partida(0);
  try {
    await G(pagina, () => game.scene.getScene('Game').testeIrPara(598));
    await esperarRelogio(pagina, 601);
    const r = await G(pagina, () => {
      const g = game.scene.getScene('Game');
      let chefe = null; g.enemies.children.iterate((e) => { if (e && e.active && e.isBoss) chefe = e; });
      if (!chefe) return { semChefe: true };
      const antes = SAVE.cleared.slice();
      g.damageTarget(chefe, chefe.hp + 1);
      let baus = 0; g.pickups.children.iterate((p) => { if (p && p.active && p.ptype === 'chest') baus++; });
      return { baus, antes, depois: SAVE.cleared.slice(), fim: g.ended };
    });
    assert.ok(!r.semChefe, 'o chefe dos 10:00 deveria existir');
    assert.ok(r.baus >= 1, 'o chefe deveria soltar um baú');
    assert.deepEqual(r.depois, r.antes, 'chefe não libera galáxia');
    assert.equal(r.fim, false, 'a partida continua depois do chefe');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-70: com o automático ligado aos 30:00 a nave-mãe espera e a vitória não conta', async () => {
  const { pagina, erros, fechar } = await partida(0);
  try {
    await G(pagina, () => { const g = game.scene.getScene('Game'); g.toggleAuto(); g.testeIrPara(1798); });
    await esperarRelogio(pagina, 1801);
    const r = await G(pagina, () => { const g = game.scene.getScene('Game'); return { mae: !!(g.naveMae && g.naveMae.active), vitoria: !!g.vitoriaRegistrada, galaxia: SAVE.cleared[0] }; });
    assert.deepEqual(r, { mae: false, vitoria: false, galaxia: false });
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-12/13: aos 30:00 chega a nave-mãe, a vitória é registrada e a tela final é de vitória', async () => {
  const { pagina, erros, fechar } = await partida(0);
  try {
    await G(pagina, () => game.scene.getScene('Game').testeIrPara(1798));
    await esperarRelogio(pagina, 1800.5);
    const r = await G(pagina, () => { const g = game.scene.getScene('Game'); return { mae: !!(g.naveMae && g.naveMae.active), vitoria: !!g.vitoriaRegistrada, galaxia: SAVE.cleared[0] }; });
    assert.deepEqual(r, { mae: true, vitoria: true, galaxia: true });
    await pagina.waitForFunction(() => game.scene.getScene('Game').ended, { timeout: 25000 });
    const textos = await G(pagina, () => game.scene.getScene('Game').children.list.filter((o) => o.type === 'Text').map((o) => o.text));
    assert.ok(textos.some((t) => t.includes('GALÁXIA CONQUISTADA')), 'deveria mostrar a vitória');
    assert.ok(!textos.some((t) => t.includes('NAVE DESTRUÍDA')), 'não pode mostrar derrota');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-17/19: ESC pausa e o relógio para; P duas vezes rápido não trava', async () => {
  const { pagina, erros, fechar } = await partida(0);
  try {
    await pagina.keyboard.press('Escape');
    await esperar(200);
    const t1 = await G(pagina, () => game.scene.getScene('Game').elapsed);
    await esperar(1200);
    const r = await G(pagina, () => { const g = game.scene.getScene('Game'); return { t: g.elapsed, pausado: !!g.menuPausa }; });
    assert.equal(r.pausado, true);
    assert.equal(r.t, t1, 'o relógio não pode andar na pausa');
    const textos = await G(pagina, () => game.scene.getScene('Game').children.list.filter((o) => o.type === 'Text' && o.visible).map((o) => o.text));
    assert.ok(textos.some((t) => t.includes('PAUSADO')));

    await pagina.keyboard.press('Escape');
    await esperar(600);
    const t2 = await G(pagina, () => game.scene.getScene('Game').elapsed);
    assert.ok(t2 > t1, 'depois de continuar, o relógio volta a andar');

    await pagina.keyboard.press('KeyP');
    await pagina.keyboard.press('KeyP');
    await esperar(600);
    const r2 = await G(pagina, () => { const g = game.scene.getScene('Game'); return { pausado: !!g.menuPausa, t: g.elapsed }; });
    assert.equal(r2.pausado, false);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});

test('CT-18: ao trocar de aba o jogo abre a pausa', async () => {
  const { pagina, erros, fechar } = await partida(0);
  try {
    await G(pagina, () => game.events.emit('hidden'));
    await esperar(300);
    const pausado = await G(pagina, () => !!game.scene.getScene('Game').menuPausa);
    assert.equal(pausado, true);
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});
