// Pedidos do dono em 26/11/2026: chefes únicos por galáxia (RN-85), setas para subchefe/chefe (RN-84)
// e tela de conquistas por cima do menu, sem botões sobrepostos
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { GALAXIES } = require('../src/dados/galaxias');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

test('RN-85: cada galáxia tem um chefe com nome e ataque próprios', () => {
  const ataques = GALAXIES.map((g) => g.chefe && g.chefe.ataque);
  assert.deepEqual(ataques, ['esporos', 'plasma', 'cristais']);
  assert.equal(new Set(GALAXIES.map((g) => g.chefe.nome)).size, 3);
});

test('RN-85 e RN-84: chefe de cada galáxia é maior, atira com o seu tiro e a seta aponta quando está fora da tela', async () => {
  const j = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    const tiros = { 0: 'tiro_acido', 1: 'tiro_plasma', 2: 'tiro_cristal' };
    for (const gi of [0, 1, 2]) {
      await G(j.pagina, (gi) => { SAVE.owned.tita = true; SAVE.owned.agulha = true; game.scene.getScene('Hangar').scene.stop(); game.scene.start('Game', { ship: gi }); }, gi);
      await esperarCena(j.pagina, 'Game');
      await G(j.pagina, () => {
        const g = game.scene.getScene('Game');
        g.weapons.length = 0; g.hp = 1e9; g.mods.maxHp = 1e9;
        g.spawnBoss(0);
        g.boss.setPosition(g.player.x + 900, g.player.y);   // longe: fora da tela
        g.boss.body.reset(g.player.x + 900, g.player.y);
      });
      await esperar(5000);
      const r = await G(j.pagina, () => {
        const g = game.scene.getScene('Game'), b = g.boss, texs = new Set();
        g.ebullets.children.iterate((t) => { if (t && t.active) texs.add(t.texture.key); });
        return { gi: g.gi, larg: b.displayWidth, textura: b.texture.key, texs: [...texs], seta: g.setasChefe[0].visible, ataque: b.ataque };
      });
      assert.equal(r.gi, gi);
      assert.ok(r.larg >= 170, 'chefe grande: ' + r.larg);
      assert.ok(r.texs.includes(tiros[gi]), 'tiro do chefe ' + gi + ': ' + r.texs);
      assert.equal(r.seta, true, 'seta aponta para o chefe fora da tela');
      // chefe perto, na tela: sem seta
      const naTela = await G(j.pagina, () => {
        const g = game.scene.getScene('Game');
        g.boss.body.reset(g.player.x + 150, g.player.y); g.drawMinimap(); g.updateSetasChefe();
        return g.setasChefe[0].visible;
      });
      assert.equal(naTela, false);
    }
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('conquistas abertas pelo menu ficam por cima dos botões do menu e cabem acima do FECHAR', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const r = await G(j.pagina, () => {
      const h = game.scene.getScene('Hangar');
      abrirConquistas(h);
      const textos = h.children.list.filter((o) => o.type === 'Text');
      const jogar = textos.filter((o) => o.text === 'JOGAR').pop();
      const fechar = textos.filter((o) => o.text === 'FECHAR').pop();
      const titulo = textos.filter((o) => o.text === 'CONQUISTAS').pop();
      const ultimaLinha = Math.max(...h.children.list.filter((o) => o.type === 'Rectangle' && o.depth === titulo.depth - 1 && o.width === 436).map((o) => o.y + o.height / 2));
      return { menuPorBaixo: jogar.depth < titulo.depth, ultimaLinha, topoFechar: fechar.y - 15 };
    });
    assert.ok(r.menuPorBaixo, 'botões do menu ficam atrás da tela de conquistas');
    assert.ok(r.ultimaLinha < r.topoFechar, 'lista termina antes do FECHAR: ' + JSON.stringify(r));
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
