// Gera a versão do jogo para enviar ao Poki: npm run poki
// Cria a pasta dist-poki/ só com o que o jogo precisa (index.html, lib/ e src/),
// liga o modo Poki (POKI_BUILD) e coloca o PokiSDK no index.html.
// Fica de fora: testes, documentos, ferramentas, node_modules e o CLAUDE.md.
// Depois é só arrastar a pasta dist-poki para o Poki Inspector (inspector.poki.dev)
// ou compactar em .zip e enviar em Poki for Developers.
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SAIDA = path.resolve(process.argv[2] || path.join(RAIZ, 'dist-poki'));
const SDK = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';

function gerar(saida) {
  fs.rmSync(saida, { recursive: true, force: true });
  fs.mkdirSync(saida, { recursive: true });
  ['lib', 'src'].forEach((pasta) => fs.cpSync(path.join(RAIZ, pasta), path.join(saida, pasta), { recursive: true }));

  let html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  // o PokiSDK entra logo depois do </style>, antes do Phaser e dos arquivos do jogo
  if (!html.includes('</style>\n')) throw new Error('não achei o fim do <style> no index.html');
  html = html.replace('</style>\n',
    '</style>\n' +
    '  <!-- versão do Poki (gerada por npm run poki) -->\n' +
    '  <script>window.POKI_BUILD = true;</script>\n' +
    `  <script src="${SDK}"></script>\n`);
  fs.writeFileSync(path.join(saida, 'index.html'), html);

  // tamanho total, para comparar com a meta do Poki (até ~5 MB no carregamento inicial)
  let bytes = 0;
  (function somar(p) {
    const st = fs.statSync(p);
    if (st.isDirectory()) fs.readdirSync(p).forEach((f) => somar(path.join(p, f)));
    else bytes += st.size;
  })(saida);
  return bytes;
}

if (require.main === module) {
  const bytes = gerar(SAIDA);
  console.log(`Versão do Poki pronta em: ${SAIDA}`);
  console.log(`Tamanho total: ${(bytes / 1024 / 1024).toFixed(2)} MB (meta do Poki: até ~5 MB)`);
  console.log('Próximo passo: arraste essa pasta para https://inspector.poki.dev');
}

module.exports = { gerar };
