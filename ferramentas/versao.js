// Carimba a versão nos <script src="src/..."> do index.html (ex.: src/prologo.js?v=202611261410).
// Por quê: o GitHub Pages e o navegador guardam os arquivos .js em cache; sem o carimbo,
// quem já jogou pode continuar com a versão antiga (ou uma mistura de velho e novo) depois de publicar.
// Rode antes de cada publicação: npm run versao
const fs = require('fs');
const path = require('path');
const arquivo = path.join(__dirname, '..', 'index.html');
const d = new Date();
const p2 = (n) => String(n).padStart(2, '0');
const carimbo = process.argv[2] || `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}`;
let html = fs.readFileSync(arquivo, 'utf8');
let n = 0;
html = html.replace(/(<script src="src\/[^"?]+\.js)(\?v=[^"]*)?"/g, (_, inicio) => { n++; return `${inicio}?v=${carimbo}"`; });
fs.writeFileSync(arquivo, html);
console.log(`versão ${carimbo} em ${n} arquivos`);
