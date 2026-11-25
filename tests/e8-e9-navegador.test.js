// E8/E9 — combos, códex, pausa e conquistas no navegador
// Casos: CT-43 a CT-48, CT-50 a CT-57
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
// Clica num botão da pausa pelo texto (quem recebe o clique é o retângulo atrás dele)
const CLICAR = `(partes, rotulo) => {
  const t = partes.find((p) => p.type === 'Text' && p.text === rotulo);
  const r = partes.find((p) => p.type === 'Rectangle' && p.input && Math.abs(p.x - t.x) < 1 && Math.abs(p.y - t.y) < 1);
  r.emit('pointerdown');
}`;
const imagens = (cena) => cena.children.list.filter((o) => o.type === 'Image' && o.visible && o.depth >= 1000).map((o) => o.texture.key);
async function esperarJogo(pagina, s) {
  const t0 = await G(pagina, () => game.scene.getScene('Game').elapsed);
  await pagina.waitForFunction((a) => game.scene.getScene('Game').elapsed >= a, { timeout: 40000 }, t0 + s);
}
async function partida(j, nave) {
  await G(j.pagina, (n) => game.scene.getScene('Hangar').scene.start('Game', { ship: n }), nave);
  await esperarCena(j.pagina, 'Game');
  await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.ritmoParado = true; g.mods.maxHp = 1e9; g.hp = 1e9; });
}
async function abrir(opcoes) {
  const j = await abrirJogo(Object.assign({ busca: 'teste=1' }, opcoes || {}));
  await esperarCena(j.pagina, 'Hangar');
  return j;
}

test('CT-43/44/46: combo feito fica salvo e aparece no códex de outra nave; os outros ficam [?]', async () => {
  const j = await abrir();
  try {
    await partida(j, 0);
    await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      while (g.weapons[0].level < 5) g.addWeapon('rajada');
      g.addPassive('engine'); g.openChest(); g.modalPick(0); g.revelarBaus(0); g.modalPick(0);
      g.scene.start('Hangar');
    });
    await esperarCena(j.pagina, 'Hangar');
    await partida(j, 1);
    await j.pagina.keyboard.press('Escape');
    await esperar(200);
    const r = await G(j.pagina, (clicarSrc) => {
      const g = game.scene.getScene('Game'), clicar = eval(clicarSrc);
      clicar(g.menuPausa.parts, 'CÓDEX');
      const imgs = g.children.list.filter((o) => o.type === 'Image' && o.depth >= 1000).map((o) => o.texture.key);
      return { combos: SAVE.combos, evo: imgs.includes('icone_evo_rajada'), ocultos: imgs.filter((k) => k === 'icone_oculto').length };
    }, CLICAR);
    assert.deepEqual(r.combos, ['rajada']);
    assert.equal(r.evo, true, 'o combo descoberto deveria aparecer no códex');
    assert.equal(r.ocultos, 3 * 10, 'os 10 combos que faltam aparecem como [?] + [?] = [?] (11 combos desde a RN-63; ok do dono em 25/11)');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('CT-48: a pausa tem CÓDEX e recolhe a nave (sem AUTO desde 25/11)', async () => {
  const j = await abrir();
  try {
    await partida(j, 0);
    await j.pagina.keyboard.press('KeyP');
    await esperar(200);
    const r = await G(j.pagina, (clicarSrc) => {
      const g = game.scene.getScene('Game'), clicar = eval(clicarSrc);
      const textos = g.menuPausa.parts.filter((p) => p.type === 'Text').map((p) => p.text);
      clicar(g.menuPausa.parts, 'RECOLHER NAVE');
      return { textos, acabou: g.ended };
    }, CLICAR);
    ['CONTINUAR', 'CÓDEX', 'RECOLHER NAVE'].forEach((t) => assert.ok(r.textos.includes(t), t));
    assert.ok(!r.textos.some((t) => t.startsWith('AUTO')), 'não pode ter AUTO');
    assert.equal(r.acabou, true);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('CT-50: o hangar tem a tela de conquistas com as ~20 conquistas e o prêmio de cada uma', async () => {
  const j = await abrir();
  try {
    const r = await G(j.pagina, () => {
      const h = game.scene.getScene('Hangar');
      const btn = h.children.list.find((o) => o.type === 'Text' && o.text.startsWith('CONQUISTAS'));
      const rect = h.children.list.find((o) => o.type === 'Rectangle' && o.input && Math.abs(o.x - btn.x) < 1 && Math.abs(o.y - btn.y) < 1);
      rect.emit('pointerdown');
      const textos = h.children.list.filter((o) => o.type === 'Text' && o.depth >= 1000).map((o) => o.text);
      return { premios: textos.filter((t) => t.startsWith('Prêmio:')).length, total: CONQUISTAS.length };
    });
    assert.equal(r.premios, r.total);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('CT-51/55: conquista mostra aviso no canto sem pausar; duas ao mesmo tempo entram em fila', async () => {
  const j = await abrir();
  try {
    await partida(j, 0);
    await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      SAVE.stats.abates = 999; SAVE.stats.subchefes = 9;
      const e = g.spawnEnemy('bug', g.player.x + 300, g.player.y); e.isElite = true;
      g.killEnemy(e);           // vira 1.000 abates e 10 subchefes de uma vez
      g.atualizarProgresso();
    });
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      const avisos = g.children.list.filter((o) => o.type === 'Text' && o.text === 'CONQUISTA!').length;
      return { avisos, fila: g.filaAvisos.length, pausado: g.paused || !!g.menuPausa, ids: Object.keys(SAVE.conquistas) };
    });
    assert.ok(r.ids.includes('abates1000') && r.ids.includes('subchefes10'));
    assert.equal(r.avisos, 1, 'um aviso por vez');
    assert.equal(r.fila, 1, 'o segundo espera na fila');
    assert.equal(r.pausado, false, 'o aviso não pausa o jogo');
    await esperarJogo(j.pagina, 4.5);
    const fila2 = await G(j.pagina, () => game.scene.getScene('Game').filaAvisos.length);
    assert.equal(fila2, 0, 'o segundo aviso aparece depois do primeiro');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('CT-52/53: arma travada não aparece nas cartas; achada 3 vezes, passa a aparecer', async () => {
  const j = await abrir();
  try {
    await partida(j, 0);
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      const vistas = () => { const v = new Set(); for (let k = 0; k < 120; k++) g.upgradeOptions().forEach((o) => v.add(o.id)); return v; };
      const antes = vistas().has('disc');
      // baú de subchefe com arma travada (chance de 100% só neste teste)
      g.chanceArmaTravada = 1;
      for (let k = 0; k < 3; k++) {
        g.bausSubchefe = 1; g.openChest();
        const i = g.modal.conteudos.findIndex((c) => c.arma);   // escolhe o baú que tem a arma
        g.modalPick(i); g.revelarBaus(i); g.modalPick(0);
        while (g.modal) g.modalPick(0);   // fecha trocas, se houver
        g.weapons = g.weapons.filter((w) => w.id !== 'disc' && w.id !== 'chain');
      }
      return { antes, achadas: SAVE.stats.armasAchadas, depois: vistas().has('disc') || vistas().has('chain') };
    });
    assert.equal(r.antes, false);
    const total = (r.achadas.disc || 0) + (r.achadas.chain || 0);
    assert.equal(total, 3, 'três achados: ' + JSON.stringify(r.achadas));
    if ((r.achadas.disc || 0) === 3 || (r.achadas.chain || 0) === 3) assert.equal(r.depois, true);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-55/62: meteoro solta um item sorteado; cristal solta 60 créditos e mais um item (ok do dono em 25/11)', async () => {
  const j = await abrir();
  try {
    await partida(j, 0);
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.pickups.clear(true, true);
      g.breakRock(g.criarMeteoro(g.player.x + 300, g.player.y, true));
      g.breakRock(g.criarMeteoro(g.player.x - 300, g.player.y, false));
      const itens = []; g.pickups.children.iterate((p) => { if (p && p.active) itens.push(p.ptype + ':' + p.extra); });
      return itens.sort();
    });
    const validos = ['coin:12', 'heal:undefined', 'magnet:undefined', 'congelar:undefined', 'lento:undefined', 'chamas:undefined'];
    assert.equal(r.length, 3, 'cristal: 2 itens; meteoro: 1 item');
    assert.ok(r.includes('coin:60'), 'cristal sempre dá 60 créditos');
    r.filter((x) => x !== 'coin:60').forEach((x) => assert.ok(validos.includes(x), x));
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('CT-54/56: bônus das conquistas vale na partida seguinte e tudo continua salvo depois de recarregar', async () => {
  const j = await abrir();
  try {
    await partida(j, 0);
    const semBonus = await G(j.pagina, () => game.scene.getScene('Game').mods.dmg);
    await G(j.pagina, () => {
      SAVE.conquistas.sobreviver10 = 1; SAVE.combos.push('pulsar'); SAVE.stats.abates = 42;
      writeSave(SAVE);
    });
    await j.pagina.reload({ waitUntil: 'load' });
    await esperarCena(j.pagina, 'Hangar');
    const salvo = await G(j.pagina, () => ({ c: SAVE.combos, a: SAVE.stats.abates, q: !!SAVE.conquistas.sobreviver10 }));
    assert.deepEqual(salvo, { c: ['pulsar'], a: 42, q: true });
    await partida(j, 0);
    const comBonus = await G(j.pagina, () => game.scene.getScene('Game').mods.dmg);
    assert.ok(Math.abs(comBonus / semBonus - 1.05) < 1e-6, 'dano deveria ser 5% maior: ' + comBonus / semBonus);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
