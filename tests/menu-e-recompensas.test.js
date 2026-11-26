// Menu principal, configurações e novas regras de recompensa (pedidos do dono em 25/11/2026: RN-55 a RN-57)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
// clica no retângulo do botão que tem esse texto
const clicar = (rotulo) => {
  const h = game.scene.getScene('Hangar');
  const t = h.children.list.filter((o) => o.type === 'Text' && o.text.startsWith(rotulo)).pop();
  const bg = h.children.list.filter((o) => o.type === 'Rectangle' && o.input && o.x === t.x && o.y === t.y).pop();
  bg.emit('pointerdown');
};
const textos = () => game.scene.getScene('Hangar').children.list.filter((o) => o.type === 'Text').map((o) => o.text);

test('RN-57/RN-78: ao abrir o jogo aparece o menu com Jogar, Conquistas e Configurações (Novo jogo só para quem já jogou)', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const t = await G(j.pagina, textos);
    assert.ok(t.includes('JOGAR'));
    assert.ok(!t.includes('NOVO JOGO'), 'jogador novo não tem o que apagar (RN-78)');
    assert.ok(t.includes('CONFIGURAÇÕES'));
    assert.ok(t.some((x) => x.startsWith('CONQUISTAS')));
    // continuar fecha o menu e mostra o hangar
    await G(j.pagina, (src) => { eval(src)('JOGAR'); }, '(' + clicar.toString() + ')');
    const depois = await G(j.pagina, textos);
    assert.ok(!depois.includes('NOVO JOGO'), 'o menu deveria fechar');
    assert.ok(depois.includes('MENU'), 'o hangar tem botão para voltar ao menu');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-57: Novo jogo pede confirmação; Cancelar mantém e Sim apaga o progresso', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const r = await G(j.pagina, (src) => {
      const clicar = eval(src), h = game.scene.getScene('Hangar');
      SAVE.credits = 999; SAVE.owned.tita = true; writeSave(SAVE);
      h.scene.restart();
      return true;
    }, '(' + clicar.toString() + ')');
    assert.ok(r);
    await esperar(300);
    // o menu já foi mostrado nesta sessão: reabre pelo botão MENU
    await G(j.pagina, (src) => { const c = eval(src); c('MENU'); c('NOVO JOGO'); }, '(' + clicar.toString() + ')');
    let t = await G(j.pagina, textos);
    assert.ok(t.includes('APAGAR TODO O PROGRESSO?'));
    await G(j.pagina, (src) => eval(src)('CANCELAR'), '(' + clicar.toString() + ')');
    assert.equal(await G(j.pagina, () => SAVE.credits), 999, 'cancelar não apaga');
    await G(j.pagina, (src) => { const c = eval(src); c('NOVO JOGO'); c('SIM, APAGAR'); }, '(' + clicar.toString() + ')');
    await esperar(300);
    const s = await G(j.pagina, () => ({ c: SAVE.credits, tita: !!SAVE.owned.tita, gravado: JSON.parse(localStorage.getItem('star_hunter_survivors_save_v1')).credits }));
    assert.deepEqual(s, { c: 0, tita: false, gravado: 0 });
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-57: configurações guardam volume e efeitos reduzidos depois de recarregar', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    await G(j.pagina, (src) => { const c = eval(src); c('CONFIGURAÇÕES'); c('−'); c('−'); c('DESLIGADO'); }, '(' + clicar.toString() + ')');
    const antes = await G(j.pagina, () => ({ v: PREFS.volume, e: PREFS.efeitosReduzidos }));
    assert.deepEqual(antes, { v: 0.5, e: true });
    await j.pagina.reload();
    await esperarCena(j.pagina, 'Hangar');
    const depois = await G(j.pagina, () => ({ v: PREFS.volume, e: PREFS.efeitosReduzidos }));
    assert.deepEqual(depois, { v: 0.5, e: true });
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-55/56: inimigo comum não dá créditos; subchefe dá; meteoro dá créditos; baú não dá arma nova', async () => {
  const j = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    await G(j.pagina, () => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
    await esperarCena(j.pagina, 'Game');
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.ritmoParado = true; g.mods.maxHp = 1e9; g.hp = 1e9;
      g.spawnEnemy('g1_rastejador');
      let comum = null; g.enemies.children.iterate((e) => { if (e && e.active && !e.isElite && !e.isBoss) comum = e; });
      const c0 = g.runCredits; g.killEnemy(comum); const depoisComum = g.runCredits - c0;
      const p = g.spawnPoint(); g.spawnElite(p.x, p.y);
      let elite = null; g.enemies.children.iterate((e) => { if (e && e.active && e.isElite) elite = e; });
      const c1 = g.runCredits; g.killEnemy(elite); const depoisElite = g.runCredits - c1;
      while (g.modal) g.modalPick(0);
      // baú: nunca entra arma nova, mesmo com espaço livre
      const armas = g.weapons.length;
      for (let k = 0; k < 6; k++) { g.openChest(); g.abrirBauEscolhido(0); }
      return { depoisComum, depoisElite, armasAntes: armas, armasDepois: g.weapons.length };
    });
    assert.equal(r.depoisComum, 0);
    assert.ok(r.depoisElite > 0);
    assert.equal(r.armasDepois, r.armasAntes, 'baú não pode dar arma nova');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
