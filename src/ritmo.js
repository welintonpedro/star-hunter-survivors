// ============ RITMO DA PARTIDA: ONDAS, FLUXO E HORÁRIOS ============
// Lógica sem dependência do navegador (testada em tests/e2-ritmo.test.js).
// Os números ficam em src/dados/ondas.js e src/dados/eventos.js.

const _EVENTOS = typeof EVENTOS !== 'undefined' ? EVENTOS : require('./dados/eventos.js').EVENTOS;

const CALMA_INICIAL = 2;     // segundos de calma no começo da partida
const RITMO_REPOR = 15;      // abaixo do mínimo, nascem até 15 por segundo (sem aparecer tudo de uma vez)

// Linha da tabela para o tempo t, suavizada entre o minuto atual e o seguinte
function linhaDoMinuto(tabela, t) {
  const m = Math.max(0, Math.min(tabela.length - 1, Math.floor(t / 60)));
  const a = tabela[m], b = tabela[Math.min(tabela.length - 1, m + 1)];
  const f = Math.max(0, Math.min(1, t / 60 - m));
  const mix = (k) => a[k] + (b[k] - a[k]) * f;
  return { min: Math.round(mix('min')), max: Math.round(mix('max')), porSegundo: mix('porSegundo'), vida: mix('vida'), dano: a.dano === undefined ? 1 : mix('dano') };
}

function novoEstadoOndas(t) {
  return { inicio: t || 0, acumulado: 0 };
}

// Quantos inimigos comuns devem nascer neste passo. "vivos" = inimigos comuns vivos agora.
// Abaixo do mínimo: repõe rápido. Entre mínimo e máximo: no ritmo da tabela. No máximo: para.
function passoNascimento(estado, t, dt, vivos, tabela) {
  if (t < estado.inicio + CALMA_INICIAL) return 0;
  const l = linhaDoMinuto(tabela, t);
  if (vivos >= l.max) { estado.acumulado = 0; return 0; }
  estado.acumulado += (vivos < l.min ? Math.max(RITMO_REPOR, l.porSegundo) : l.porSegundo) * dt;
  const n = Math.floor(estado.acumulado);
  estado.acumulado -= n;
  return Math.max(0, Math.min(n, l.max - vivos));
}

// Sorteia um tipo de inimigo pelos pesos (r entre 0 e 1)
function escolherTipo(pesos, r) {
  const tipos = Object.keys(pesos).filter((k) => pesos[k] > 0);
  const total = tipos.reduce((s, k) => s + pesos[k], 0);
  let alvo = r * total;
  for (const k of tipos) { alvo -= pesos[k]; if (alvo < 0) return k; }
  return tipos[tipos.length - 1];
}

// Chance de cada inimigo da galáxia no tempo t: só quem já entrou; o recém-chegado
// (até DESTAQUE_NOVO segundos depois de entrar) aparece 3x mais, para o jogador notar a novidade.
const DESTAQUE_NOVO = 90;
function pesosNoTempo(lista, defs, t) {
  const pesos = {};
  lista.forEach((id) => {
    const d = defs[id];
    if (d.entra < 0 || d.entra > t) return;
    pesos[id] = d.peso * (t - d.entra < DESTAQUE_NOVO ? 3 : 1);
  });
  return pesos;
}

// Quantos eventos de uma série repetida ({primeiro, intervalo, ultimo}) já aconteceram até t
function quantosAte(t, regra) {
  if (t < regra.primeiro) return 0;
  return Math.floor((Math.min(t, regra.ultimo) - regra.primeiro) / regra.intervalo) + 1;
}

// Próximo evento grande depois de t: { nome, t } ou null
function proximoEvento(t, eventos) {
  const ev = eventos || _EVENTOS;
  const opcoes = [];
  const s = ev.subchefes;
  const ts = s.primeiro + quantosAte(t, s) * s.intervalo;
  if (ts > t && ts <= s.ultimo) opcoes.push({ nome: 'Subchefe', t: ts });
  const c = ev.chefes.find((ch) => ch.t > t);
  if (c) opcoes.push({ nome: 'Chefe', t: c.t });
  if (ev.naveMae > t) opcoes.push({ nome: 'Nave-mãe', t: ev.naveMae });
  if (!opcoes.length) return null;
  return opcoes.reduce((a, b) => (b.t < a.t ? b : a));
}

if (typeof module !== 'undefined') {
  module.exports = { linhaDoMinuto, novoEstadoOndas, passoNascimento, escolherTipo, pesosNoTempo, quantosAte, proximoEvento };
}
