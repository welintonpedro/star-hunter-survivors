// Modo infinito (RN-68) e arena battle royale contra naves do computador (RN-69) — pedidos do dono em 25/11/2026
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { calcularPontos, ARENA, raioDaZona } = require('../src/dados/modos.js');
const { lerSave } = require('../src/save-dados.js');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');
const G = (pagina, fn, arg) => pagina.evaluate(fn, arg);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const NAVES = ['falcao', 'tita', 'agulha'];
const storage = (obj) => { const m = new Map([['star_hunter_survivors_save_v1', JSON.stringify(obj)]]); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) }; };

async function partida(modo, opcoes) {
  const j = await abrirJogo(Object.assign({ busca: 'teste=1' }, opcoes || {}));
  await esperarCena(j.pagina, 'Hangar');
  await G(j.pagina, (m) => game.scene.getScene('Hangar').scene.start('Game', { ship: 0, modo: m }), modo);
  await esperarCena(j.pagina, 'Game');
  return j;
}

test('pontuação e zona: mais abates/tempo/chefes = mais pontos; a zona encolhe até o raio final', () => {
  assert.equal(calcularPontos({ abates: 0, segundos: 0, subchefes: 0, chefes: 0 }), 0);
  assert.ok(calcularPontos({ abates: 10, segundos: 60, subchefes: 1, chefes: 1 }) > calcularPontos({ abates: 10, segundos: 60, subchefes: 0, chefes: 0 }));
  let ant = Infinity;
  for (let t = 0; t <= ARENA.duracao; t += 30) { const r = raioDaZona(t); assert.ok(r <= ant); ant = r; }
  assert.equal(Math.round(raioDaZona(0)), ARENA.zonaInicial);
  assert.equal(Math.round(raioDaZona(ARENA.duracao)), ARENA.zonaFinal);
});

test('save v5: recordes começam vazios, save antigo ganha recordes, valores inválidos são corrigidos', () => {
  const antigo = lerSave(storage({ versao: 4, credits: 70 }), NAVES, 1000).save;
  assert.equal(antigo.credits, 70);
  assert.deepEqual(antigo.recordes, { infinito: {}, arena: { partidas: 0, vitorias: 0, melhor: 0 } });
  const ruim = lerSave(storage({ versao: 5, recordes: { infinito: { falcao: { pontos: 900, tempo: 600, abates: 300 }, naveFalsa: { pontos: 5 }, tita: { pontos: -3 } },
    arena: { partidas: 4, vitorias: 9, melhor: 42 } } }), NAVES, 1000).save;
  assert.deepEqual(ruim.recordes.infinito, { falcao: { pontos: 900, tempo: 600, abates: 300 } });
  assert.deepEqual(ruim.recordes.arena, { partidas: 4, vitorias: 4, melhor: 0 });
});

test('hangar: JOGAR abre a escolha de modo (campanha, infinito, arena) e INFINITO começa o modo certo', async () => {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const textos = await G(j.pagina, () => {
      const h = game.scene.getScene('Hangar');
      h.children.list.filter((o) => o.depth >= 1000).forEach((o) => o.destroy());   // fecha o menu inicial
      abrirEscolhaDeModo(h, 0);
      return h.children.list.filter((o) => o.type === 'Text').map((o) => o.text);
    });
    ['ESCOLHA O MODO', 'CAMPANHA', 'INFINITO', 'ARENA'].forEach((t) => assert.ok(textos.includes(t), t));
    await G(j.pagina, () => {
      const h = game.scene.getScene('Hangar');
      const t = h.children.list.filter((o) => o.type === 'Text' && o.text === 'INFINITO').pop();
      const bg = h.children.list.filter((o) => o.type === 'Rectangle' && o.input && o.depth === 1001 && Math.abs(o.y - t.y - 30) < 40).pop();
      bg.emit('pointerdown');
    });
    await esperarCena(j.pagina, 'Game');
    assert.equal(await G(j.pagina, () => game.scene.getScene('Game').modo), 'infinito');
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-68: no infinito não tem nave-mãe nem vitória aos 30:00; depois disso os inimigos ficam mais fortes e chefes voltam', async () => {
  const j = await partida('infinito');
  try {
    await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.mods.maxHp = 1e9; g.hp = 1e9; g.testeIrPara(1795); });
    await j.pagina.waitForFunction(() => game.scene.getScene('Game').elapsed > 1803, { timeout: 60000, polling: 200 });
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      const f30 = g.fatorExtra();
      g.elapsed = 1740 + 600; const f39 = g.fatorExtra(); g.elapsed = 1805;
      return { naveMae: !!g.naveMae, vitoria: g.vitoriaRegistrada, ended: g.ended, f30, f39, proxChefe: g.infProxChefe, tempo: g.timeText.text };
    });
    assert.equal(r.naveMae, false);
    assert.equal(r.vitoria, false);
    assert.equal(r.ended, false);
    assert.ok(r.f30 > 1 && r.f39 > 2.5, 'força extra cresce com o tempo: ' + r.f30 + ' / ' + r.f39);
    assert.equal(r.proxChefe, 2100);
    assert.ok(r.tempo.includes('∞'));
    // chefe dos 35:00
    await G(j.pagina, () => game.scene.getScene('Game').testeIrPara(2098));
    await j.pagina.waitForFunction(() => game.scene.getScene('Game').chefeVivo(), { timeout: 60000, polling: 200 });
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-68: ao cair, o infinito mostra os pontos e guarda o recorde; uma partida pior não apaga o recorde', async () => {
  const j = await partida('infinito');
  try {
    const r1 = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.kills = 500; g.elapsed = 900; g.chefesMortos = 1;
      g.hp = 1; g.invuln = 0; g.hurt(10);
      return { rec: SAVE.recordes.infinito.falcao, textos: g.children.list.filter((o) => o.type === 'Text').map((o) => o.text).join(' | ') };
    });
    assert.equal(r1.rec.pontos, 500 + 1800 + 500);
    assert.ok(r1.textos.includes('NOVO RECORDE!'), r1.textos);
    await G(j.pagina, () => game.scene.getScene('Game').scene.start('Game', { ship: 0, modo: 'infinito' }));
    await esperar(800);
    const r2 = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.kills = 3; g.elapsed = 30; g.hp = 1; g.invuln = 0; g.hurt(10);
      return { rec: SAVE.recordes.infinito.falcao.pontos, salvo: JSON.parse(localStorage.getItem('star_hunter_survivors_save_v1')).recordes.infinito.falcao.pontos };
    });
    assert.equal(r2.rec, 2800);
    assert.equal(r2.salvo, 2800);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-69: arena começa com 9 rivais e zona; armas do jogador miram neles; abater um solta baú e conta', async () => {
  const j = await partida('arena');
  try {
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.ritmoParado = true;
      g.enemies.children.iterate((e) => { if (e && e.active && !e.isRival) e.disableBody(true, true); });
      const rival = g.rivais[0];
      rival.body.reset(g.player.x + 150, g.player.y);
      const mira = g.nearestTarget(400) === rival;
      g.pickups.clear(true, true);
      const kills = g.kills;
      g.damageTarget(rival, rival.hp + 1);
      const bau = []; g.pickups.children.iterate((p) => { if (p && p.active) bau.push(p.ptype); });
      return { vivosAntes: 9, vivos: g.rivaisVivos(), zona: g.zona.r, mira, bau, kills: g.kills - kills, abatidos: g.rivaisAbatidos, info: g.infoText.text };
    });
    assert.equal(r.vivos, 8);
    assert.equal(Math.round(r.zona), ARENA.zonaInicial);
    assert.equal(r.mira, true, 'o rival perto deve ser o alvo das armas');
    assert.ok(r.bau.includes('chest'));
    assert.equal(r.kills, 1);
    assert.equal(r.abatidos, 1);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-69: fora da zona a nave perde vida; a zona encolhe com o tempo', async () => {
  const j = await partida('arena');
  try {
    await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.ritmoParado = true;
      g.enemies.children.iterate((e) => { if (e && e.active && !e.isRival) e.disableBody(true, true); });
      g.rivais.forEach((e) => { if (e.isRival) e.body.reset(g.zona.x + 5000, g.zona.y + 5000); });
      g.player.body.reset(g.zona.x + g.zona.r + 300, g.zona.y);
      window.__vida = g.hp;
    });
    await esperar(1500);
    const r = await G(j.pagina, () => { const g = game.scene.getScene('Game'); return { perdeu: __vida - g.hp, dica: g.hintText.text, r0: g.zona.r }; });
    assert.ok(r.perdeu > 0, 'fora da zona deveria perder vida');
    assert.equal(r.dica, 'VOLTE PARA A ZONA SEGURA!');
    await G(j.pagina, () => game.scene.getScene('Game').testeIrPara(240));
    await j.pagina.waitForFunction(() => game.scene.getScene('Game').elapsed > 240, { timeout: 30000 });
    const r1 = await G(j.pagina, () => game.scene.getScene('Game').zona.r);
    assert.ok(r1 < r.r0 * 0.7, 'a zona deveria ter encolhido');
  } finally { await j.fechar(); }
});

test('RN-69: eliminar todos os rivais = 1º lugar com prêmio e recorde; cair antes = colocação pelos que restam', async () => {
  const j = await partida('arena');
  try {
    const r = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.rivais.forEach((e) => { if (e.isRival) g.eliminarRival(e, false); });
      g.update(0, 16);
      return { ended: g.ended, rec: SAVE.recordes.arena, textos: g.children.list.filter((o) => o.type === 'Text').map((o) => o.text).join(' | '), cred: g.runCredits };
    });
    assert.equal(r.ended, true);
    assert.deepEqual(r.rec, { partidas: 1, vitorias: 1, melhor: 1 });
    assert.ok(r.textos.includes('VITÓRIA! 1º LUGAR'), r.textos);
    assert.ok(r.cred >= ARENA.premio[0]);
    await G(j.pagina, () => game.scene.getScene('Game').scene.start('Game', { ship: 0, modo: 'arena' }));
    await esperar(800);
    const r2 = await G(j.pagina, () => {
      const g = game.scene.getScene('Game');
      g.eliminarRival(g.rivais[0], false); g.eliminarRival(g.rivais[1], false);
      g.hp = 1; g.invuln = 0; g.hurt(10);
      return { rec: SAVE.recordes.arena, textos: g.children.list.filter((o) => o.type === 'Text').map((o) => o.text).join(' | ') };
    });
    assert.deepEqual(r2.rec, { partidas: 2, vitorias: 1, melhor: 1 });
    assert.ok(r2.textos.includes('8º LUGAR'), r2.textos);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});

test('RN-69: arena em espanhol roda alguns segundos sem erro e os textos dela têm tradução nos 6 idiomas', async () => {
  const src = fs.readFileSync(path.join(__dirname, '../src/arena.js'), 'utf8');
  const re = /tx\('((?:[^'\\]|\\.)*)'/g; const chaves = new Set(); let m;
  while ((m = re.exec(src))) chaves.add(m[1]);
  assert.ok(chaves.size >= 3);
  ['en', 'es', 'fr', 'it', 'de', 'tr'].forEach((id) => {
    const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/idiomas/' + id + '.js'), 'utf8'), ctx);
    assert.deepEqual([...chaves].filter((c) => ctx.TRADUCOES_CARREGADAS[id][c] === undefined), [], id);
  });
  const j = await partida('arena', { idioma: 'es-ES' });
  try {
    await G(j.pagina, () => { const g = game.scene.getScene('Game'); g.mods.maxHp = 1e9; g.hp = 1e9; setInterval(() => { if (g.modal) g.modalPick(0); }, 200); });
    await esperar(5000);
    assert.deepEqual(j.erros, []);
  } finally { await j.fechar(); }
});
