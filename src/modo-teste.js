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
function contadoresNoTempo(t, ritmos) {
  return {
    ringCount: Math.floor(t / ritmos.ring),
    swarmCount: Math.floor(t / ritmos.swarm),
    eliteCount: Math.floor(t / ritmos.elite)
  };
}

const MODO_TESTE = typeof location !== 'undefined' && modoTesteAtivo(location.search);

// Monta o painel de teste na cena da partida (só chamado quando MODO_TESTE é verdadeiro)
function criarPainelTeste(scene) {
  scene.testeIrPara = (segundos) => {
    const t = tempoAlvo(scene.elapsed, segundos);
    Object.assign(scene, contadoresNoTempo(t, { ring: RING_EVERY, swarm: SWARM_EVERY, elite: ELITE_EVERY }));
    scene.elapsed = t;
  };
  const D = 900, x = 70, y0 = H / 2 - 60;
  scene.add.text(x, y0, 'MODO TESTE', {
    fontFamily: 'Arial', fontSize: '12px', color: '#f87171', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
  }).setOrigin(0.5).setScrollFactor(0).setDepth(D);
  const opts = { fixed: true, depth: D, color: 0x450a0a, stroke: 0xf87171, size: 12 };
  makeButton(scene, x, y0 + 26, 110, 24, '+1 min', () => scene.testeIrPara(scene.elapsed + 60), opts);
  makeButton(scene, x, y0 + 56, 110, 24, '+5 min', () => scene.testeIrPara(scene.elapsed + 300), opts);
  makeButton(scene, x, y0 + 86, 110, 24, 'ir p/ 9:55', () => scene.testeIrPara(9 * 60 + 55), opts);
}

if (typeof module !== 'undefined') {
  module.exports = { modoTesteAtivo, tempoAlvo, contadoresNoTempo };
}
