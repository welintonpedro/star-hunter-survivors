// ============ RITMO DA PARTIDA: ONDAS, FLUXO E HORÁRIOS ============
// Lógica sem dependência do navegador (testada em tests/e2-ritmo.test.js).
// Os números ficam em src/dados/ondas.js e src/dados/eventos.js.

const _EVENTOS = typeof EVENTOS !== 'undefined' ? EVENTOS : require('./dados/eventos.js').EVENTOS;

const SOLTURA_ONDA = 2;      // segundos para todos os inimigos de uma onda entrarem
const CALMA_INICIAL = 2;     // segundos de calma no começo da partida
const FIM_DA_ONDA = 0.25;    // a onda acaba quando sobram no máximo 25% dos inimigos dela

// Linha da tabela para o minuto atual (depois do último minuto, repete a última linha)
function linhaDoMinuto(tabela, t) {
  const m = Math.max(0, Math.min(tabela.length - 1, Math.floor(t / 60)));
  return tabela[m];
}

function novoEstadoOndas(t) {
  return { fase: 'respiro', fimRespiro: (t || 0) + CALMA_INICIAL, onda: 0,
    inicio: 0, tamanho: 0, nascidos: 0, tempoMax: 0, respiro: 0, acumulado: 0 };
}

// Quantos inimigos comuns devem nascer neste passo. "vivos" = inimigos comuns vivos agora.
function passoNascimento(estado, t, dt, vivos, tabela) {
  const l = linhaDoMinuto(tabela, t);

  if (l.modo === 'fluxo') {
    estado.fase = 'fluxo';
    estado.acumulado += l.porSegundo * dt;
    let n = Math.floor(estado.acumulado);
    estado.acumulado -= n;
    return Math.max(0, Math.min(n, l.maxNaTela - vivos));
  }

  if (estado.fase === 'fluxo') { estado.fase = 'respiro'; estado.fimRespiro = t; }
  if (estado.fase === 'respiro') {
    if (t < estado.fimRespiro) return 0;
    estado.fase = 'onda'; estado.onda++; estado.inicio = t;
    estado.tamanho = l.tamanho; estado.nascidos = 0; estado.tempoMax = l.tempoMax; estado.respiro = l.respiro;
  }

  // Solta a onda aos poucos, em SOLTURA_ONDA segundos
  const fracao = Math.min(1, (t - estado.inicio + dt) / SOLTURA_ONDA);
  const alvo = Math.min(estado.tamanho, Math.ceil(estado.tamanho * fracao));
  const n = Math.max(0, alvo - estado.nascidos);
  estado.nascidos += n;

  if (estado.nascidos >= estado.tamanho) {
    const poucos = vivos + n <= Math.floor(estado.tamanho * FIM_DA_ONDA);
    if (poucos || t - estado.inicio >= estado.tempoMax) {
      estado.fase = 'respiro';
      estado.fimRespiro = t + estado.respiro;
    }
  }
  return n;
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
