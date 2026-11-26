// Pedidos do dono em 26/11/2026: ação até a nave-mãe (RN-79), conquista do prólogo (RN-77)
// e menu sem "NOVO JOGO" para quem nunca jogou (RN-78)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { corrigirSave, saveInicial } = require('../src/save-dados');
const { CONQUISTAS } = require('../src/dados/conquistas');
const { ROTEIRO_PROLOGO } = require('../src/dados/prologo');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const textos = () => game.scene.getScene('Hangar').children.list.filter((o) => o.type === 'Text').map((o) => o.text);

test('RN-77: existe a conquista "Viajante do Tempo" e o save guarda se o prólogo foi terminado', () => {
  const c = CONQUISTAS.find((x) => x.id === 'prologo');
  assert.ok(c, 'conquista do prólogo');
  assert.equal(c.nome, 'Viajante do Tempo');
  const s = saveInicial(['falcao']);
  assert.equal(s.stats.prologo, false);
  assert.equal(c.cond(s), false);
  s.stats.prologo = true;
  assert.equal(c.cond(s), true);
  // save antigo sem o campo continua valendo e começa com false
  const antigo = JSON.parse(JSON.stringify(saveInicial(['falcao']))); delete antigo.stats.prologo;
  assert.equal(corrigirSave(antigo, ['falcao'], 0).stats.prologo, false);
  const terminado = JSON.parse(JSON.stringify(saveInicial(['falcao']))); terminado.stats.prologo = true;
  assert.equal(corrigirSave(terminado, ['falcao'], 0).stats.prologo, true);
});

test('RN-79: depois do chefe a vitória e a nave-mãe chegam rápido', () => {
  const v = ROTEIRO_PROLOGO.find((p) => p.id === 'vitoria'), m = ROTEIRO_PROLOGO.find((p) => p.id === 'naveMae');
  assert.ok(v.max <= 5, 'comemoração curta');
  assert.ok(m.max <= 12, 'nave-mãe sem espera longa');
});

test('RN-78: jogador novo vê só JOGAR; quem já jogou vê CONTINUAR e NOVO JOGO', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const novo = await G(j.pagina, textos);
    assert.ok(novo.includes('JOGAR'));
    assert.ok(!novo.includes('NOVO JOGO'), 'nada para apagar ainda');
    assert.ok(novo.includes('CONFIGURAÇÕES'));
    // só a conquista do prólogo ainda é jogador novo
    await G(j.pagina, () => { SAVE.stats.prologo = true; SAVE.conquistas.prologo = 1; abrirMenuPrincipal(game.scene.getScene('Hangar')); });
    const soPrologo = await G(j.pagina, textos);
    assert.ok(!soPrologo.includes('NOVO JOGO'));
    await G(j.pagina, () => { SAVE.credits = 50; abrirMenuPrincipal(game.scene.getScene('Hangar')); });
    const veterano = await G(j.pagina, textos);
    assert.ok(veterano.includes('CONTINUAR'));
    assert.ok(veterano.includes('NOVO JOGO'));
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-77 e RN-79: depois do chefe continuam vindo monstros; ao fim do prólogo ganha a conquista e o menu avisa', async () => {
  const j = await abrirJogo({ prologo: true });
  try {
    await esperarCena(j.pagina, 'Game');
    // pula direto para a vitória (logo depois do chefe), com a tela vazia
    await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.enemies.children.iterate((e) => { if (e && e.active) e.disableBody(true, true); });
      g.pr.i = ROTEIRO_PROLOGO.findIndex((p) => p.id === 'vitoria') - 1;
      g.proximoPassoPrologo();
    });
    await esperar(1500);
    const vivos = await G(j.pagina, () => game.scene.getScene('Game').contarComuns());
    assert.ok(vivos >= 10, 'monstros na tela depois do chefe: ' + vivos);
    // fim da história (destruída pela nave-mãe) → conquista, sem créditos
    await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.pr.acabando = true; g.terminarPrologo(); });
    await esperarCena(j.pagina, 'Hangar');
    await j.pagina.waitForFunction(() => game.scene.getScene('Hangar').children.list.some((o) => o.type === 'Text' && o.text === 'Viajante do Tempo'), { timeout: 5000, polling: 100 });
    const r = await G(j.pagina, (src) => ({ prologo: SAVE.stats.prologo, cq: !!SAVE.conquistas.prologo, creditos: SAVE.credits,
      gravado: JSON.parse(localStorage.getItem('star_hunter_survivors_save_v1')).stats.prologo, t: eval(src)() }), '(' + textos.toString() + ')');
    assert.deepEqual({ p: r.prologo, c: r.cq, g: r.gravado, cr: r.creditos }, { p: true, c: true, g: true, cr: 0 });
    assert.ok(r.t.includes('CONQUISTA!') && r.t.includes('Viajante do Tempo'), 'aviso de conquista no menu');
    assert.ok(!r.t.includes('NOVO JOGO'), 'ainda é jogador novo');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-77: quem pula a história não ganha a conquista', async () => {
  const j = await abrirJogo({ prologo: true });
  try {
    await esperarCena(j.pagina, 'Game');
    await G(j.pagina, () => game.scene.getScene('Game').terminarPrologo());
    await esperarCena(j.pagina, 'Hangar');
    assert.equal(await G(j.pagina, () => !!SAVE.conquistas.prologo), false);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('modo teste: botão PRÓLOGO no hangar e botões para pular etapas dentro do prólogo', async () => {
  const j = await abrirJogo({ busca: 'teste=1' });
  try {
    await esperarCena(j.pagina, 'Hangar');
    await G(j.pagina, () => {
      const h = game.scene.getScene('Hangar');
      if (h.children.list.some((o) => o.type === 'Text' && o.text === 'JOGAR')) {   // fecha o menu inicial
        const t = h.children.list.filter((o) => o.type === 'Text' && o.text === 'JOGAR').pop();
        h.children.list.filter((o) => o.type === 'Rectangle' && o.input && o.x === t.x && o.y === t.y).pop().emit('pointerdown');
      }
      const t = h.children.list.filter((o) => o.type === 'Text' && o.text === 'PRÓLOGO (teste)').pop();
      h.children.list.filter((o) => o.type === 'Rectangle' && o.input && o.x === t.x && o.y === t.y).pop().emit('pointerdown');
    });
    await esperarCena(j.pagina, 'Game');
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      const clicar = (rot) => { const t = g.children.list.filter((o) => o.type === 'Text' && o.text === rot).pop(); g.children.list.filter((o) => o.type === 'Rectangle' && o.input && o.x === t.x && o.y === t.y).pop().emit('pointerdown'); };
      const antes = g.passoAtual().id;
      clicar('próx. etapa');
      const depois = g.passoAtual().id;
      clicar('ir p/ chefe');
      const chefe = g.passoAtual().id;
      clicar('ir p/ nave-mãe');
      return { modo: g.modo, antes, depois, chefe, mae: g.passoAtual().id };
    });
    assert.equal(r.modo, 'prologo');
    assert.notEqual(r.antes, r.depois);
    assert.equal(r.chefe, 'chefe');
    assert.equal(r.mae, 'naveMae');
    await esperar(2500);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
