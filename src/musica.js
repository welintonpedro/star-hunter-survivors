// ============ MÚSICA DE FUNDO GERADA POR CÓDIGO (RN-75) ============
// Nenhum arquivo de áudio: o navegador toca as notas na hora (Web Audio), então não pesa nada.
// Cada faixa = acordes longos de fundo + baixo + um arpejo suave (e, em algumas, uma batida leve).
// Bem baixinha (volume próprio em Configurações → "Volume da música").
// Cada galáxia tem 2 faixas; a partida começa numa delas e troca a cada ~3 minutos.

// notas: 60 = Dó central. escala = degraus em semitons. acordes = graus da escala (0 = primeiro grau).
const MUSICAS = {
  menu: [
    { nome: 'Hangar', bpm: 76, raiz: 57, escala: [0, 2, 3, 5, 7, 8, 10], acordes: [0, 5, 2, 6], pad: 'triangle', arp: [0, 2, 4, 2], arpCada: 4, batida: false, brilho: 1400 }
  ],
  // Nebulosa Esmeralda: calma, aventura (modo dórico, maior pentatônica)
  g0: [
    { nome: 'Esmeralda I', bpm: 92, raiz: 62, escala: [0, 2, 3, 5, 7, 9, 10], acordes: [0, 3, 6, 4], pad: 'triangle', arp: [0, 2, 4, 6, 4, 2], arpCada: 2, batida: true, brilho: 1800 },
    { nome: 'Esmeralda II', bpm: 100, raiz: 60, escala: [0, 2, 4, 7, 9], acordes: [0, 3, 1, 4], pad: 'sine', arp: [0, 1, 2, 3, 2, 1], arpCada: 2, batida: true, brilho: 2200 }
  ],
  // Cinturão Rubro: tensa e mais rápida (frígio, menor harmônica)
  g1: [
    { nome: 'Rubro I', bpm: 118, raiz: 57, escala: [0, 1, 3, 5, 7, 8, 10], acordes: [0, 1, 0, 6], pad: 'sawtooth', arp: [0, 2, 4, 2, 0, 4], arpCada: 2, batida: true, brilho: 1100 },
    { nome: 'Rubro II', bpm: 126, raiz: 55, escala: [0, 2, 3, 5, 7, 8, 11], acordes: [0, 5, 3, 4], pad: 'square', arp: [0, 4, 2, 4], arpCada: 2, batida: true, brilho: 1000 }
  ],
  // Abismo Violeta: misteriosa e espacial (lídio, tons inteiros)
  g2: [
    { nome: 'Violeta I', bpm: 84, raiz: 59, escala: [0, 2, 4, 6, 7, 9, 11], acordes: [0, 1, 4, 5], pad: 'sine', arp: [0, 4, 2, 6, 4], arpCada: 3, batida: false, brilho: 2600 },
    { nome: 'Violeta II', bpm: 90, raiz: 56, escala: [0, 2, 4, 6, 8, 10], acordes: [0, 2, 1, 3], pad: 'triangle', arp: [0, 3, 1, 4, 2, 5], arpCada: 2, batida: true, brilho: 2000 }
  ]
};
const MUSICA_VOLUME_MAX = 0.22;   // teto do volume da música (mesmo no 100%, fica baixinha)
const MUSICA_TROCA_S = 180;      // troca de faixa dentro da partida a cada 3 minutos

const _MUS = { ctx: null, saida: null, ganho: null, chave: null, faixa: null, idx: 0, passo: 0, proximo: 0, timer: null, inicio: 0, ruido: null };

function _hz(nota) { return 440 * Math.pow(2, (nota - 69) / 12); }
function _notaDoGrau(f, grau, oitava) {
  const n = f.escala.length, g = ((grau % n) + n) % n, o = Math.floor(grau / n);
  return f.raiz + f.escala[g] + 12 * (o + (oitava || 0));
}
function volumeMusica() { return (PREFS.musica === undefined ? 0.5 : PREFS.musica) * MUSICA_VOLUME_MAX; }

function _nota(ctx, destino, t, hz, dur, vol, tipo, filtroHz) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo; o.frequency.setValueAtTime(hz, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.25, dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (filtroHz) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtroHz;
    o.connect(f); f.connect(g);
  } else o.connect(g);
  g.connect(destino);
  o.start(t); o.stop(t + dur + 0.05);
}
function _chimbal(ctx, destino, t) {
  if (!_MUS.ruido) {
    const n = Math.floor(ctx.sampleRate * 0.05), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    _MUS.ruido = b;
  }
  const r = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = 6000;
  g.gain.value = 0.05;
  r.buffer = _MUS.ruido; r.connect(f); f.connect(g); g.connect(destino); r.start(t);
}

// Agenda as notas um pouco à frente do relógio do áudio (assim nada atrasa)
function _agendar() {
  const ctx = _MUS.ctx, f = _MUS.faixa;
  if (!ctx || !f) return;
  const passoS = 60 / f.bpm / 4;   // semicolcheia
  while (_MUS.proximo < ctx.currentTime + 0.35) {
    const t = _MUS.proximo, p = _MUS.passo % 16, compasso = Math.floor(_MUS.passo / 16);
    const grau = f.acordes[compasso % f.acordes.length], dest = _MUS.ganho;
    if (p === 0) {   // acorde de fundo (3 notas) durando o compasso
      [0, 2, 4].forEach((k) => _nota(ctx, dest, t, _hz(_notaDoGrau(f, grau + k, 0)), passoS * 16, 0.05, f.pad, f.brilho));
    }
    if (p === 0 || p === 8) _nota(ctx, dest, t, _hz(_notaDoGrau(f, grau, -1)), passoS * 6, 0.09, 'triangle', 600);   // baixo
    if (p % f.arpCada === 0 && (p !== 0 || compasso % 2 === 1)) {   // arpejo
      const k = f.arp[(_MUS.passo / f.arpCada | 0) % f.arp.length];
      _nota(ctx, dest, t, _hz(_notaDoGrau(f, grau + k, 1)), passoS * 2.5, 0.035, 'sine', 3500);
    }
    if (f.batida && (p === 4 || p === 12)) _chimbal(ctx, dest, t);
    _MUS.proximo += passoS;
    _MUS.passo++;
  }
}

// Toca a música da "chave" ('menu', 'g0', 'g1', 'g2'). Chamar de novo com a mesma chave não reinicia.
function tocarMusica(scene, chave) {
  try {
    const sm = scene && scene.sound;
    if (!sm || !sm.context) return;
    if (sm.locked) { sm.once('unlocked', () => tocarMusica(scene, chave)); return; }   // espera o 1º toque/clique
    if (_MUS.chave === chave && _MUS.timer) return;
    pararMusica();
    const lista = MUSICAS[chave];
    if (!lista || !lista.length) return;
    const ctx = sm.context;
    _MUS.ctx = ctx; _MUS.saida = sm.masterVolumeNode || ctx.destination;
    _MUS.ganho = ctx.createGain();
    _MUS.ganho.gain.setValueAtTime(0.0001, ctx.currentTime);
    _MUS.ganho.gain.exponentialRampToValueAtTime(Math.max(0.0001, volumeMusica()), ctx.currentTime + 2);   // entra devagar
    _MUS.ganho.connect(_MUS.saida);
    _MUS.chave = chave; _MUS.idx = Math.floor(Math.random() * lista.length); _MUS.faixa = lista[_MUS.idx];
    _MUS.passo = 0; _MUS.proximo = ctx.currentTime + 0.1; _MUS.inicio = ctx.currentTime;
    _MUS.timer = setInterval(() => {
      // troca de faixa de tempos em tempos (no começo de um compasso)
      if (lista.length > 1 && ctx.currentTime - _MUS.inicio > MUSICA_TROCA_S && _MUS.passo % 16 === 0) {
        _MUS.idx = (_MUS.idx + 1) % lista.length; _MUS.faixa = lista[_MUS.idx]; _MUS.inicio = ctx.currentTime;
      }
      _agendar();
    }, 100);
    _agendar();
  } catch (e) { /* música é enfeite: nunca pode travar o jogo */ }
}

function pararMusica() {
  if (_MUS.timer) { clearInterval(_MUS.timer); _MUS.timer = null; }
  if (_MUS.ganho && _MUS.ctx) {
    const g = _MUS.ganho, t = _MUS.ctx.currentTime;
    try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8); } catch (e) { /* ok */ }
    setTimeout(() => { try { g.disconnect(); } catch (e) { /* ok */ } }, 1000);
  }
  _MUS.ganho = null; _MUS.chave = null; _MUS.faixa = null;
}

// Mudou o volume em Configurações: aplica na hora
function aplicarVolumeMusica() {
  if (_MUS.ganho && _MUS.ctx) _MUS.ganho.gain.setTargetAtTime(Math.max(0.0001, volumeMusica()), _MUS.ctx.currentTime, 0.2);
}
