// ============ SONS GERADOS POR CÓDIGO (zero arquivos, zero MB) ============
// Cada som é montado na hora pelo navegador (Web Audio): um "oscilador" faz o tom,
// um "ruído" faz explosões, e o volume sobe e desce rápido (envelope).
// O volume geral segue as Configurações (passa pelo volume do Phaser).
// Para mudar um som, ajuste os números da tabela SONS abaixo.

const SONS = {
  //          onda        de Hz → até Hz   duração  volume  ruído  intervalo mínimo entre dois (s)
  tiro:      { onda: 'square',   de: 880, ate: 440,  dur: 0.06, vol: 0.05, ruido: 0,   min: 0.07 },
  explosao:  { onda: 'triangle', de: 160, ate: 50,   dur: 0.22, vol: 0.10, ruido: 0.6, min: 0.05 },
  meteoro:   { onda: 'triangle', de: 220, ate: 80,   dur: 0.15, vol: 0.08, ruido: 0.5, min: 0.05 },
  gema:      { onda: 'sine',     de: 1200, ate: 1600, dur: 0.07, vol: 0.06, ruido: 0,   min: 0.04 },
  moeda:     { onda: 'square',   de: 990, ate: 1320, dur: 0.10, vol: 0.05, ruido: 0,   min: 0.05 },
  dano:      { onda: 'sawtooth', de: 200, ate: 60,   dur: 0.20, vol: 0.12, ruido: 0.4, min: 0.25 },
  chefe:     { onda: 'sawtooth', de: 110, ate: 70,   dur: 0.90, vol: 0.12, ruido: 0,   min: 2 }
};
// Sons de várias notas (melodias curtas): [nota em Hz, começa em s]
const MELODIAS = {
  nivel:     { onda: 'square',   notas: [[523, 0], [659, 0.07], [784, 0.14], [1047, 0.21]], dur: 0.12, vol: 0.07 },
  bau:       { onda: 'triangle', notas: [[784, 0], [988, 0.08], [1175, 0.16], [1568, 0.24]], dur: 0.16, vol: 0.09 },
  conquista: { onda: 'square',   notas: [[659, 0], [880, 0.12], [1319, 0.24]],                dur: 0.22, vol: 0.07 }
};

const _ultimoSom = {};
let _ruidoBuffer = null;

function _audio(scene) {
  const sm = scene && scene.sound;
  if (!sm || !sm.context || sm.locked) return null;   // sem Web Audio ou antes do 1º clique
  return { ctx: sm.context, saida: sm.masterVolumeNode || sm.context.destination };
}
function _ruido(ctx) {
  if (_ruidoBuffer) return _ruidoBuffer;
  const n = Math.floor(ctx.sampleRate * 0.5);
  _ruidoBuffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = _ruidoBuffer.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return _ruidoBuffer;
}
function _envelope(ctx, saida, t0, dur, vol) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(saida);
  return g;
}

// Toca um som pelo nome. Nunca dá erro: se o navegador não deixar, fica em silêncio.
function tocarSom(scene, nome) {
  try {
    const a = _audio(scene);
    if (!a) return;
    const { ctx, saida } = a, agora = ctx.currentTime;
    const s = SONS[nome];
    if (s) {
      if (agora - (_ultimoSom[nome] === undefined ? -Infinity : _ultimoSom[nome]) < s.min) return;   // evita 50 tiros soando juntos
      _ultimoSom[nome] = agora;
      const g = _envelope(ctx, saida, agora, s.dur, s.vol);
      const o = ctx.createOscillator();
      o.type = s.onda;
      o.frequency.setValueAtTime(s.de, agora);
      o.frequency.exponentialRampToValueAtTime(s.ate, agora + s.dur);
      o.connect(g); o.start(agora); o.stop(agora + s.dur + 0.02);
      if (s.ruido) {
        const r = ctx.createBufferSource(), gr = _envelope(ctx, saida, agora, s.dur, s.vol * s.ruido);
        const filtro = ctx.createBiquadFilter();
        filtro.type = 'lowpass'; filtro.frequency.value = 900;
        r.buffer = _ruido(ctx); r.connect(filtro); filtro.connect(gr);
        r.start(agora); r.stop(agora + s.dur + 0.02);
      }
      return;
    }
    const m = MELODIAS[nome];
    if (!m) return;
    if (agora - (_ultimoSom[nome] === undefined ? -Infinity : _ultimoSom[nome]) < 0.3) return;
    _ultimoSom[nome] = agora;
    m.notas.forEach(([hz, quando]) => {
      const t = agora + quando, g = _envelope(ctx, saida, t, m.dur, m.vol), o = ctx.createOscillator();
      o.type = m.onda; o.frequency.setValueAtTime(hz, t);
      o.connect(g); o.start(t); o.stop(t + m.dur + 0.02);
    });
  } catch (e) { /* som é enfeite: nunca pode travar o jogo */ }
}
