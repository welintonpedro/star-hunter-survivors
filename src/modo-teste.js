// ============ MODO DE TESTE (RN-45) ============
// Abra o jogo com ?teste=1 no fim do link para ver, na partida, botões que avançam o relógio.
// Serve para testar eventos de 10, 20 e 30 min sem jogar meia hora. O jogador comum não vê.

function modoTesteAtivo(busca) {
  try { return new URLSearchParams(busca || '').get('teste') === '1'; } catch (e) { return false; }
}

// O relógio só anda para a frente
function tempoAlvo(atual, alvo) {
  return Math.max(atual, alvo);
}

// Quantos eventos repetidos (cerco, enxame, subchefe) já "passaram" num certo tempo.
// Ao pular o relógio, os contadores vão direto para esse valor, para os eventos
// que ficaram para trás não aparecerem todos de uma vez.
// Cada ritmo pode ser um número (a cada N segundos) ou uma série {primeiro, intervalo, ultimo}.
function contadoresNoTempo(t, ritmos) {
  const _quantos = typeof quantosAte !== 'undefined' ? quantosAte : require('./ritmo.js').quantosAte;
  const conta = (r) => (typeof r === 'number' ? Math.floor(t / r) : _quantos(t, r));
  return { ringCount: conta(ritmos.ring), swarmCount: conta(ritmos.swarm), eliteCount: conta(ritmos.elite) };
}

const MODO_TESTE = typeof location !== 'undefined' && modoTesteAtivo(location.search);

// Monta o painel de teste na cena da partida (só chamado quando MODO_TESTE é verdadeiro)
function criarPainelTeste(scene) {
  scene.testeIrPara = (segundos) => {
    const t = tempoAlvo(scene.elapsed, segundos);
    Object.assign(scene, contadoresNoTempo(t, { ring: EVENTOS.cercos, swarm: EVENTOS.enxames, elite: EVENTOS.subchefes }));
    // chefes que ficaram para trás no pulo não aparecem
    EVENTOS.chefes.forEach((c, i) => { if (c.t < t) scene.chefesFeitos[i] = true; });
    scene.estadoOndas = novoEstadoOndas(t);
    scene.elapsed = t;
  };
  const D = 900, x = 70, y0 = H / 2 - 60;
  scene.add.text(x, y0, 'MODO TESTE', {
    fontFamily: 'Arial', fontSize: '12px', color: '#f87171', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
  }).setOrigin(0.5).setScrollFactor(0).setDepth(D);
  const opts = { fixed: true, depth: D, color: 0x450a0a, stroke: 0xf87171, size: 12 };
  if (scene.modo === 'prologo') { criarPainelTestePrologo(scene, x, y0, opts); return; }
  makeButton(scene, x, y0 + 26, 110, 24, '+1 min', () => scene.testeIrPara(scene.elapsed + 60), opts);
  makeButton(scene, x, y0 + 56, 110, 24, '+5 min', () => scene.testeIrPara(scene.elapsed + 300), opts);
  makeButton(scene, x, y0 + 86, 110, 24, 'ir p/ 9:55', () => scene.testeIrPara(9 * 60 + 55), opts);
  // pula para 5 s antes do próximo subchefe, chefe ou nave-mãe
  makeButton(scene, x, y0 + 116, 110, 24, 'próx. evento', () => {
    const p = proximoEvento(scene.elapsed + 5);
    if (p) scene.testeIrPara(p.t - 5);
  }, opts);
}

// No prólogo: pular etapas do roteiro (a etapa atual aparece embaixo dos botões)
function criarPainelTestePrologo(scene, x, y0, opts) {
  const pular = () => { if (scene.pr && !scene.pr.acabando && !scene.ended) { if (scene.modal) scene.closeModal(); scene.proximoPassoPrologo(); } };
  const irPara = (id) => {
    const alvo = ROTEIRO_PROLOGO.findIndex((p) => p.id === id);
    let voltas = 0;
    while (scene.pr && scene.pr.i < alvo && voltas++ < 30) pular();
  };
  makeButton(scene, x, y0 + 26, 110, 24, 'próx. etapa', pular, opts);
  makeButton(scene, x, y0 + 56, 110, 24, 'ir p/ chefe', () => irPara('chefe'), opts);
  makeButton(scene, x, y0 + 86, 110, 24, 'ir p/ nave-mãe', () => irPara('naveMae'), opts);
  const etapa = scene.add.text(x, y0 + 112, '', { fontFamily: 'Arial', fontSize: '11px', color: '#fca5a5', stroke: '#000000', strokeThickness: 3 })
    .setOrigin(0.5).setScrollFactor(0).setDepth(opts.depth);
  scene.time.addEvent({ delay: 300, loop: true, callback: () => { const p = scene.passoAtual && scene.passoAtual(); etapa.setText(p ? 'etapa: ' + p.id : ''); } });
}

if (typeof module !== 'undefined') {
  module.exports = { modoTesteAtivo, tempoAlvo, contadoresNoTempo };
}
