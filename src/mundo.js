// ============ MAPA QUE DÁ A VOLTA (RN-13, RN-15, RN-18) ============
// A nave anda livre, sem limite de coordenada. Todo o resto (inimigos, meteoros, gemas,
// locais) é "aproximado": se ficar a mais de meio mapa da nave, pula um mapa inteiro para
// o lado mais perto dela. Isso sempre acontece muito longe da tela, então o jogador não vê.
// Funções sem dependência do navegador (testadas em tests/e3-mundo.test.js).

// Coordenada dentro do mapa, de 0 até tamanho (usada no minimapa e na geração)
function envolver(v, tamanho) {
  return ((v % tamanho) + tamanho) % tamanho;
}

// Versão de v (somando ou tirando mapas inteiros) mais perto de ref
function aproximar(v, ref, tamanho) {
  const d = v - ref;
  if (Math.abs(d) <= tamanho / 2) return v;
  return v - Math.round(d / tamanho) * tamanho;
}

// Distância contando a emenda (o caminho mais curto)
function distanciaEnvolvida(x1, y1, x2, y2, tamanho) {
  const dx = Math.abs(x1 - x2) % tamanho, dy = Math.abs(y1 - y2) % tamanho;
  return Math.hypot(Math.min(dx, tamanho - dx), Math.min(dy, tamanho - dy));
}

// Retângulo (x, y, w, h) num quadro S×S que dá a volta: devolve até 4 pedaços dentro do quadro
function retangulosNoMinimapa(x, y, w, h, S) {
  x = envolver(x, S); y = envolver(y, S);
  const cortarX = x + w > S ? [{ x, w: S - x }, { x: 0, w: x + w - S }] : [{ x, w }];
  const cortarY = y + h > S ? [{ y, h: S - y }, { y: 0, h: y + h - S }] : [{ y, h }];
  const partes = [];
  cortarY.forEach((cy) => cortarX.forEach((cx) => partes.push({ x: cx.x, y: cy.y, w: cx.w, h: cy.h })));
  return partes;
}

if (typeof module !== 'undefined') {
  module.exports = { envolver, aproximar, distanciaEnvolvida, retangulosNoMinimapa };
}
