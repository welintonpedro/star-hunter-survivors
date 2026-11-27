// Gera a imagem de capa (thumbnail) do jogo com a própria arte do jogo: npm run capa
// Saída: divulgacao/capa-1024.png (quadrada, sem texto, regras do Poki: mínimo 628×628).
// Como funciona: abre o jogo num navegador escondido (o mesmo dos testes), pega os desenhos
// prontos (nave, entidade, inimigos) e monta a cena num quadro 1024×1024.
// Composição: a entidade encapuzada gigante ao fundo, com olhos brilhando, num espaço colorido;
// a nave Altair embaixo avançando para cima dela, atirando; alguns inimigos e joias em volta.
const fs = require('fs');
const path = require('path');
const { abrirJogo, esperarCena } = require('../tests/ajuda/navegador');

const SAIDA = path.join(__dirname, '..', 'divulgacao', 'capa-1024.png');

async function gerar(saida = SAIDA) {
  const j = await abrirJogo();
  try {
    await esperarCena(j.pagina, 'Hangar');
    const png = await j.pagina.evaluate(() => {
      const L = 1024;
      const c = document.createElement('canvas'); c.width = L; c.height = L;
      const g = c.getContext('2d');
      const img = (k) => game.textures.get(k).getSourceImage();
      // número "aleatório" fixo: a capa sai sempre igual
      let semente = 7;
      const rnd = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };
      const brilho = (x, y, r, cor, a) => {
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, cor.replace('A', a)); gr.addColorStop(1, cor.replace('A', 0));
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      };
      const pixel = (k, x, y, escala, rot) => {
        const s = img(k);
        g.save(); g.translate(x, y); if (rot) g.rotate(rot);
        g.imageSmoothingEnabled = false;
        g.drawImage(s, -s.width * escala / 2, -s.height * escala / 2, s.width * escala, s.height * escala);
        g.restore();
      };

      // 1) fundo: espaço azul-marinho → roxo profundo
      const fundo = g.createLinearGradient(0, 0, 0, L);
      fundo.addColorStop(0, '#12052b'); fundo.addColorStop(0.55, '#0b1033'); fundo.addColorStop(1, '#050816');
      g.fillStyle = fundo; g.fillRect(0, 0, L, L);
      // 2) nebulosas coloridas (rosa, azul, roxo)
      g.globalCompositeOperation = 'lighter';
      brilho(200, 260, 420, 'rgba(219,39,119,A)', 0.35);
      brilho(860, 320, 440, 'rgba(59,130,246,A)', 0.32);
      brilho(520, 160, 380, 'rgba(147,51,234,A)', 0.45);
      brilho(150, 820, 360, 'rgba(14,165,233,A)', 0.22);
      brilho(900, 860, 340, 'rgba(236,72,153,A)', 0.2);
      // 3) estrelas
      for (let i = 0; i < 260; i++) {
        const x = rnd() * L, y = rnd() * L, r = rnd() < 0.08 ? 2.4 : rnd() < 0.3 ? 1.5 : 1;
        g.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.6})`; g.fillRect(x, y, r, r);
      }
      for (let i = 0; i < 14; i++) brilho(rnd() * L, rnd() * L * 0.8, 10 + rnd() * 10, 'rgba(255,255,255,A)', 0.5);
      // 4) planeta no canto
      g.globalCompositeOperation = 'source-over';
      const pl = g.createRadialGradient(130, 120, 10, 150, 140, 120);
      pl.addColorStop(0, '#fb923c'); pl.addColorStop(0.6, '#c2410c'); pl.addColorStop(1, '#431407');
      g.fillStyle = pl; g.beginPath(); g.arc(150, 140, 95, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(253,224,71,0.55)'; g.lineWidth = 6; g.beginPath(); g.ellipse(150, 140, 160, 34, -0.35, 0, Math.PI * 2); g.stroke();

      // 5) a entidade encapuzada gigante ao fundo, com aura roxa
      g.globalCompositeOperation = 'lighter';
      const EX = 560, EY = 300, esc = 21;
      brilho(EX, EY, 400, 'rgba(168,85,247,A)', 0.55);
      g.globalCompositeOperation = 'source-over';
      // desenhada à parte para a parte de baixo do manto sumir no espaço (fica "ao fundo")
      const ent = img('entidade'), ec = document.createElement('canvas');
      ec.width = ent.width * esc; ec.height = ent.height * esc;
      const eg = ec.getContext('2d'); eg.imageSmoothingEnabled = false;
      eg.drawImage(ent, 0, 0, ec.width, ec.height);
      eg.globalCompositeOperation = 'destination-out';
      const some = eg.createLinearGradient(0, ec.height * 0.45, 0, ec.height);
      some.addColorStop(0, 'rgba(0,0,0,0)'); some.addColorStop(1, 'rgba(0,0,0,1)');
      eg.fillStyle = some; eg.fillRect(0, 0, ec.width, ec.height);
      g.globalAlpha = 0.92; g.drawImage(ec, EX - ec.width / 2, EY - ec.height / 2); g.globalAlpha = 1;
      // olhos brilhando (mesma posição do jogo: OLHOS_ENTIDADE)
      g.globalCompositeOperation = 'lighter';
      OLHOS_ENTIDADE.forEach((o) => {
        const x = EX + o.x * esc, y = EY + o.y * esc;
        brilho(x, y, 120, 'rgba(192,38,211,A)', 0.75);
        brilho(x, y, 55, 'rgba(240,171,252,A)', 0.95);
        g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, y, 22, 11, 0, 0, Math.PI * 2); g.fill();
      });
      g.globalCompositeOperation = 'source-over';

      // 6) inimigos e joias em volta (menores, para não roubar a atenção)
      [['ini_g1_bolha', 150, 560, 1.6, 0.3], ['ini_g2_piscante', 890, 640, 1.6, -0.4], ['ini_g3_relogio', 860, 860, 1.4, 0.2], ['ini_g1_bolha', 140, 860, 1.3, 0]]
        .forEach(([k, x, y, s, r]) => { if (game.textures.exists(k)) pixel(k, x, y, s, r); });
      // um inimigo explodindo em faíscas
      g.globalCompositeOperation = 'lighter';
      brilho(800, 520, 70, 'rgba(251,146,60,A)', 0.9);
      for (let i = 0; i < 18; i++) { const a = rnd() * 6.28, d = 20 + rnd() * 60; g.fillStyle = rnd() < 0.5 ? '#fde047' : '#fb923c'; g.fillRect(800 + Math.cos(a) * d, 520 + Math.sin(a) * d, 6, 6); }
      [[300, 700], [740, 760], [420, 930], [660, 900], [200, 720]].forEach(([x, y]) => brilho(x, y, 26, 'rgba(56,189,248,A)', 0.8));
      g.globalCompositeOperation = 'source-over';
      [[300, 700], [740, 760], [420, 930], [660, 900], [200, 720]].forEach(([x, y]) => pixel('gem', x, y, 3.5));

      // 7) a nave Altair embaixo, inclinada, avançando para cima da entidade
      const nx = 500, ny = 790, rot = 0.18;
      g.globalCompositeOperation = 'lighter';
      // fogo do motor
      for (let i = 0; i < 7; i++) brilho(nx - Math.sin(rot) * (62 + i * 20), ny + Math.cos(rot) * (62 + i * 20), 44 - i * 5, i < 2 ? 'rgba(254,240,138,A)' : 'rgba(249,115,22,A)', 0.9 - i * 0.11);
      brilho(nx, ny, 170, 'rgba(96,165,250,A)', 0.4);
      // tiros azuis subindo em direção à entidade
      [[-38, 300], [38, 300], [0, 190], [-20, 90], [24, 420]].forEach(([dx, dist]) => {
        const x = nx + dx + Math.sin(rot) * dist, y = ny - Math.cos(rot) * dist;
        brilho(x, y, 30, 'rgba(56,189,248,A)', 0.9);
        g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#e0f2fe'; g.fillRect(-5, -26, 10, 52); g.restore();
      });
      g.globalCompositeOperation = 'source-over';
      pixel('ship_falcao', nx, ny, 6.5, rot);
      return c.toDataURL('image/png');
    });
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    fs.writeFileSync(saida, Buffer.from(png.split(',')[1], 'base64'));
    if (j.erros.length) throw new Error('erros no jogo: ' + j.erros.join('; '));
    return saida;
  } finally { await j.fechar(); }
}

if (require.main === module) gerar().then((s) => console.log('Capa pronta em: ' + s)).catch((e) => { console.error(e); process.exit(1); });
module.exports = { gerar };
