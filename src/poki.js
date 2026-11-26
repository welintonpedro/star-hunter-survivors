// ============ POKI (portal de jogos para navegador) ============
// O Poki precisa saber quando o jogo terminou de carregar e quando o jogador está
// jogando ou parado (pausa, fim de partida). É assim que ele mede o jogo e escolhe
// a hora certa de mostrar um anúncio.
//
// Funciona nos dois lugares:
// - No GitHub Pages não existe o PokiSDK: tudo aqui vira "não faz nada" e o jogo segue igual.
// - Na versão do Poki (npm run poki), o index.html liga POKI_BUILD e carrega o PokiSDK.
//
// Regras do Poki (developers.poki.com/guide/requirements-quality):
// - gameplayStart só no primeiro toque/tecla do jogador, nunca ao carregar;
// - nunca o mesmo evento duas vezes seguidas (start, start ou stop, stop);
// - som mudo e teclado desligado enquanto o anúncio passa;
// - o jogo tem que funcionar mesmo se o anúncio for bloqueado.

const NA_POKI = typeof window !== 'undefined' && window.POKI_BUILD === true;

const POKI = {
  jogando: false,       // último evento enviado foi gameplayStart
  carregou: false,      // gameLoadingFinished já foi enviado
  emIntervalo: false,   // um anúncio pode estar passando agora
  pronto: null,         // promessa do PokiSDK.init()
  rolagemTravada: false,
  somMudo: false        // som desligado por causa de um anúncio
};

function _pokiSdk() {
  return (typeof PokiSDK !== 'undefined' && PokiSDK) ? PokiSDK : null;
}

// Liga o SDK uma vez. Se der erro (bloqueador de anúncio), o jogo segue normalmente.
// Todos os avisos esperam essa promessa, então saem na mesma ordem em que foram pedidos.
function _pokiPronto() {
  if (!POKI.pronto) {
    const sdk = _pokiSdk();
    POKI.pronto = sdk
      ? Promise.resolve().then(() => sdk.init()).catch(() => { /* bloqueado: segue sem Poki */ })
      : Promise.resolve();
  }
  return POKI.pronto;
}
function _pokiChamar(nome) {
  const sdk = _pokiSdk();
  if (!sdk) return;
  _pokiPronto().then(() => { try { sdk[nome](); } catch (e) { /* sem Poki: ignora */ } });
}

// Fim do carregamento (fim da cena Boot)
function pokiCarregou() {
  _travarRolagem();
  if (POKI.carregou) return;
  POKI.carregou = true;
  _pokiChamar('gameLoadingFinished');
}

// O jogador está jogando (primeiro toque/tecla ou saiu da pausa)
function pokiJogando() {
  if (POKI.jogando || POKI.emIntervalo) return;
  POKI.jogando = true;
  _pokiChamar('gameplayStart');
}

// O jogador parou de jogar (pausa, fim de partida, saiu para o menu)
function pokiParado() {
  if (!POKI.jogando) return;
  POKI.jogando = false;
  _pokiChamar('gameplayStop');
}

// Liga/desliga o som do jogo todo (efeitos e música passam pelo volume geral do Phaser).
// O jogo não tem outro botão de mudo, então ao fim do anúncio o som sempre volta.
function _pokiSom(jogo, mudo) {
  POKI.somMudo = mudo;
  if (jogo && jogo.sound) jogo.sound.mute = mudo;
}

// Um intervalo onde o Poki PODE mostrar um anúncio (ele decide se mostra).
// "depois" roda quando o intervalo acabar. Sem Poki, roda na hora (jogo igual ao de antes).
function pokiIntervalo(depois) {
  const sdk = _pokiSdk();
  if (!sdk) { depois(); return; }
  if (POKI.emIntervalo) return;   // dois cliques seguidos: o primeiro já está cuidando
  pokiParado();
  POKI.emIntervalo = true;
  const jogo = typeof game !== 'undefined' ? game : null;
  const teclado = jogo && jogo.input && jogo.input.keyboard;
  let terminou = false;
  const fim = () => {
    if (terminou) return;
    terminou = true;
    _pokiSom(jogo, false);
    if (teclado) teclado.enabled = true;
    POKI.emIntervalo = false;
    depois();
  };
  _pokiPronto().then(() => {
    let anuncio;
    try {
      anuncio = sdk.commercialBreak(() => {
        // o anúncio vai começar: som mudo e teclado desligado
        _pokiSom(jogo, true);
        if (teclado) teclado.enabled = false;
      });
    } catch (e) { fim(); return; }
    Promise.resolve(anuncio).then(fim, fim);
  });
}

// Espaço, setas e a roda do mouse não podem rolar a página do Poki (o jogo fica dentro dela).
// Cuidado: o Phaser ignora tecla já "bloqueada" (defaultPrevented). Por isso isto só é ligado
// depois que o Phaser já está ouvindo o teclado (fim da cena Boot): ele recebe a tecla primeiro.
function _travarRolagem() {
  if (POKI.rolagemTravada || typeof window === 'undefined' || !window.addEventListener) return;
  POKI.rolagemTravada = true;
  window.addEventListener('keydown', (ev) => {
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', ' '].includes(ev.key)) ev.preventDefault();
  });
  window.addEventListener('wheel', (ev) => ev.preventDefault(), { passive: false });
}

if (typeof module !== 'undefined') module.exports = { pokiCarregou, pokiJogando, pokiParado, pokiIntervalo, POKI };
