// Abre o jogo num Chrome sem tela, para os testes conferirem o que acontece de verdade.
// O Phaser vem da pasta node_modules em vez da internet, para o teste não depender de rede.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const RAIZ = path.join(__dirname, '..', '..');
const PHASER = path.join(RAIZ, 'node_modules', 'phaser', 'dist', 'phaser.min.js');
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

function iniciarServidor() {
  const servidor = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const arquivo = path.join(RAIZ, url === '/' ? 'index.html' : url);
    if (!arquivo.startsWith(RAIZ) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
      res.writeHead(404); res.end(); return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
    fs.createReadStream(arquivo).pipe(res);
  });
  return new Promise((ok) => servidor.listen(0, '127.0.0.1', () => ok(servidor)));
}

// opcoes.semStorage: simula navegador que não deixa salvar
// opcoes.saveInicial: texto já guardado no localStorage antes de o jogo abrir
// opcoes.busca: parte do link depois do "?" (ex.: "teste=1")
// opcoes.prologo: true = jogador novo (abre no prólogo)
async function abrirJogo(opcoes = {}) {
  const servidor = await iniciarServidor();
  const porta = servidor.address().port;
  const navegador = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio']
  });
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 960, height: 540 });
  // o navegador de teste "fala" português, como o dono (ok do dono em 25/11/2026);
  // opcoes.idioma troca isso para testar a detecção automática de outros idiomas
  const idioma = opcoes.idioma || 'pt-BR';
  // o navegador de teste finge que já viu o prólogo, para abrir no hangar como antes (ok do dono em 26/11/2026);
  // opcoes.prologo = true abre como um jogador novo, que começa pelo prólogo
  if (!opcoes.prologo) {
    await pagina.evaluateOnNewDocument(() => {
      try {
        const k = 'star_hunter_survivors_config_v1', c = JSON.parse(localStorage.getItem(k) || '{}');
        if (c.prologoVisto === undefined) { c.prologoVisto = true; localStorage.setItem(k, JSON.stringify(c)); }
      } catch (e) { /* navegador sem localStorage (teste de save): segue */ }
    });
  }
  await pagina.evaluateOnNewDocument((l) => {
    Object.defineProperty(navigator, 'language', { get: () => l });
    Object.defineProperty(navigator, 'languages', { get: () => [l] });
  }, idioma);
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(String(e)));
  // "Failed to load resource" é registrado pelo evento 'response' abaixo, que diz qual arquivo faltou
  pagina.on('console', (m) => {
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) erros.push(m.text());
  });
  pagina.on('response', (r) => {
    if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) erros.push(r.status() + ' ' + r.url());
  });

  await pagina.setRequestInterception(true);
  pagina.on('request', (req) => {
    if (req.url().includes('cdn.jsdelivr.net/npm/phaser')) {
      req.respond({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(PHASER, 'utf8') });
    } else if (req.url().startsWith('http://127.0.0.1')) {
      req.continue();
    } else {
      req.abort();
    }
  });

  if (opcoes.semStorage) {
    await pagina.evaluateOnNewDocument(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new Error('bloqueado'); } });
    });
  }
  // opcoes.poki: abre como a versão do Poki, com um PokiSDK de mentira que anota cada chamada
  // em window.__poki (o anúncio de mentira dura opcoes.poki.anuncioMs, padrão 400 ms)
  if (opcoes.poki) {
    await pagina.evaluateOnNewDocument((anuncioMs) => {
      window.POKI_BUILD = true;
      window.__poki = [];
      const anota = (n) => () => { window.__poki.push(n); };
      window.PokiSDK = {
        init: () => { window.__poki.push('init'); return Promise.resolve(); },
        gameLoadingFinished: anota('gameLoadingFinished'),
        gameplayStart: anota('gameplayStart'),
        gameplayStop: anota('gameplayStop'),
        getLanguage: () => 'pt',
        commercialBreak: (antes) => {
          window.__poki.push('commercialBreak');
          if (antes) antes();
          window.__pokiDuranteAnuncio = { mudo: POKI.somMudo, teclado: game.input.keyboard.enabled };
          return new Promise((ok) => setTimeout(ok, anuncioMs));
        }
      };
    }, opcoes.poki.anuncioMs || 400);
  }
  if (opcoes.saveInicial !== undefined) {
    await pagina.evaluateOnNewDocument((valor) => {
      if (!sessionStorage.getItem('__save_colocado')) {
        localStorage.setItem('star_hunter_survivors_save_v1', valor);
        sessionStorage.setItem('__save_colocado', '1');
      }
    }, opcoes.saveInicial);
  }

  const busca = opcoes.busca ? '?' + opcoes.busca : '';
  await pagina.goto(`http://127.0.0.1:${porta}/${busca}`, { waitUntil: 'load' });

  async function fechar() { await navegador.close(); servidor.close(); }
  return { pagina, erros, fechar, porta };
}

// Espera até uma cena estar rodando (ex.: 'Hangar', 'Game')
async function esperarCena(pagina, chave, ms = 15000) {
  await pagina.waitForFunction((k) => {
    try { return game.scene.isActive(k); } catch (e) { return false; }
  }, { timeout: ms }, chave);
}

module.exports = { abrirJogo, esperarCena };
