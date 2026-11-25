// ============ GERADORES DE TEXTURA ============
function pixelTexture(scene, key, rows, palette, scale) {
  const h = rows.length, w = rows[0].length;
  const tex = scene.textures.createCanvas(key, w * scale, h * scale);
  const ctx = tex.getContext();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.' || !palette[ch]) continue;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  tex.refresh();
}
function gfxTexture(scene, key, w, h, draw) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}
function bossTexture(scene, key, gal) {
  const a = hexToInt(gal.alien.a), b = hexToInt(gal.alien.b), c = hexToInt(gal.alien.c), d = hexToInt(gal.alien.d);
  gfxTexture(scene, key, 112, 112, (g) => {
    g.fillStyle(a); g.fillCircle(56, 56, 54);
    g.fillStyle(b); g.fillCircle(56, 56, 48);
    g.fillStyle(d);
    for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; g.fillCircle(56 + Math.cos(an) * 38, 56 + Math.sin(an) * 38, 7); }
    g.fillStyle(0xffffff); g.fillCircle(56, 56, 20);
    g.fillStyle(c); g.fillCircle(56, 56, 13);
    g.fillStyle(0x000000); g.fillCircle(56, 56, 6);
  });
}
function planetTexture(scene, key, cols) {
  const a = hexToInt(cols[0]), b = hexToInt(cols[1]);
  gfxTexture(scene, key, 200, 200, (g) => {
    g.lineStyle(6, b, 0.5); g.strokeEllipse(100, 100, 196, 60);
    g.fillStyle(a); g.fillCircle(100, 100, 70);
    g.fillStyle(b, 0.5); g.fillCircle(80, 80, 45);
    g.fillStyle(b, 0.35); g.fillEllipse(100, 115, 120, 18);
    g.fillStyle(0xffffff, 0.25); g.fillCircle(72, 70, 14);
  });
}
function starTexture(scene, key, size, count, maxR) {
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + Math.random() * 0.7).toFixed(2) + ')';
    const r = 1 + Math.floor(Math.random() * maxR);
    ctx.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * size), r, r);
  }
  tex.refresh();
}
function nebulaTexture(scene, key) {
  const tex = scene.textures.createCanvas(key, 256, 256);
  const ctx = tex.getContext();
  const grd = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256);
  tex.refresh();
}


// Ícone de arma/item (48×48) e a versão evoluída: mesmo desenho com moldura dourada e brilho
function iconeTexturas(scene) {
  Object.entries(ICONES).forEach(([id, ic]) => {
    pixelTexture(scene, 'icone_' + id, ic.arte, ic.cores, 4);
    const tex = scene.textures.createCanvas('icone_evo_' + id, 56, 56);
    const ctx = tex.getContext();
    ctx.fillStyle = '#422006'; ctx.fillRect(0, 0, 56, 56);
    ctx.fillStyle = '#facc15'; ctx.fillRect(0, 0, 56, 3); ctx.fillRect(0, 53, 56, 3); ctx.fillRect(0, 0, 3, 56); ctx.fillRect(53, 0, 3, 56);
    ctx.fillStyle = '#fef08a'; [[3, 3], [49, 3], [3, 49], [49, 49]].forEach((p) => ctx.fillRect(p[0], p[1], 4, 4));
    ic.arte.forEach((linha, y) => {
      for (let x = 0; x < linha.length; x++) {
        const ch = linha[x];
        if (ch === '.' || !ic.cores[ch]) continue;
        ctx.fillStyle = ch === 'a' ? '#78350f' : ic.cores[ch];
        ctx.fillRect(4 + x * 4, 4 + y * 4, 4, 4);
      }
    });
    tex.refresh();
  });
  pixelTexture(scene, 'icone_oculto', ICONE_OCULTO, { a: '#1e293b', b: '#64748b' }, 4);
}
// Chave da textura do ícone de uma arma (evoluída ou não) ou item
function iconeDe(id, evoluida) {
  return (evoluida ? 'icone_evo_' : 'icone_') + id;
}

// ============ PLANETAS COM VOLUME (luz, sombra, atmosfera e anéis) ============
function _rgb(hex) { const v = parseInt(hex.replace('#', ''), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
function _cor(rgb, f, a) {
  const c = rgb.map((x) => Math.max(0, Math.min(255, Math.round(f >= 0 ? x + (255 - x) * f : x * (1 + f)))));
  return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a === undefined ? 1 : a) + ')';
}
// tipo: 'gas' (faixas), 'rocha' (crateras), 'oceano' (continentes), 'gelo' (calotas)
function planetaTextura(scene, key, corBase, corDetalhe, tipo, aneis, semente) {
  const S = 600, C = S / 2, R = 140;   // folha larga o bastante para os anéis não serem cortados
  const rnd = mulberry32(semente);
  const base = _rgb(corBase), det = _rgb(corDetalhe);
  const tex = scene.textures.createCanvas(key, S, S);
  const ctx = tex.getContext();
  const anel = (frente) => {
    if (!aneis) return;
    ctx.save();
    ctx.translate(C, C); ctx.rotate(-0.35); ctx.scale(1, 0.28);
    ctx.beginPath();
    if (frente) ctx.rect(-S, 0, S * 2, S); else ctx.rect(-S, -S, S * 2, S);
    ctx.clip();
    [[R * 1.75, 10, 0.55], [R * 1.55, 16, 0.4], [R * 1.38, 7, 0.65]].forEach(([r, w, a]) => {
      ctx.lineWidth = w; ctx.strokeStyle = _cor(det, 0.35, a);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.restore();
  };
  // atmosfera (brilho em volta)
  const atm = ctx.createRadialGradient(C, C, R * 0.9, C, C, R * 1.3);
  atm.addColorStop(0, _cor(det, 0.4, 0.45)); atm.addColorStop(1, _cor(det, 0.4, 0));
  ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(C, C, R * 1.3, 0, Math.PI * 2); ctx.fill();
  anel(false);
  // esfera
  ctx.save();
  ctx.beginPath(); ctx.arc(C, C, R, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = _cor(base, 0); ctx.fillRect(C - R, C - R, R * 2, R * 2);
  if (tipo === 'gas') {
    for (let y = -R; y < R; y += 6) {
      const f = Math.sin(y * 0.07 + rnd() * 0.6) * 0.5 + (rnd() - 0.5) * 0.3;
      ctx.fillStyle = f > 0 ? _cor(det, f * 0.5, 0.55) : _cor(base, f * 0.6, 0.5);
      ctx.beginPath();
      for (let x = -R; x <= R; x += 10) ctx.lineTo(C + x, C + y + Math.sin(x * 0.03 + y) * 3);
      for (let x = R; x >= -R; x -= 10) ctx.lineTo(C + x, C + y + 7 + Math.sin(x * 0.03 + y) * 3);
      ctx.fill();
    }
    ctx.fillStyle = _cor(det, -0.3, 0.6); ctx.beginPath(); ctx.ellipse(C + 40, C + 30, 26, 13, 0, 0, Math.PI * 2); ctx.fill();
  } else if (tipo === 'rocha') {
    for (let i = 0; i < 26; i++) {
      const x = C + (rnd() - 0.5) * R * 1.9, y = C + (rnd() - 0.5) * R * 1.9, r = 5 + rnd() * 20;
      ctx.fillStyle = _cor(base, -0.35, 0.7); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = _cor(base, 0.2, 0.5); ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.7, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    // continentes (oceano) ou calotas e rachaduras (gelo)
    const n = tipo === 'oceano' ? 9 : 6;
    for (let i = 0; i < n; i++) {
      const x = C + (rnd() - 0.5) * R * 1.6, y = C + (rnd() - 0.5) * R * 1.6;
      ctx.fillStyle = tipo === 'oceano' ? _cor(det, -0.1, 0.9) : _cor(det, 0.6, 0.8);
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = k / 10 * Math.PI * 2, r = 18 + rnd() * 30;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8);
      }
      ctx.fill();
    }
    if (tipo === 'gelo') {
      // calotas polares curvas (acompanham a esfera)
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.ellipse(C, C - R * 0.95, R * 0.85, R * 0.38, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(C, C + R * 0.98, R * 0.7, R * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // luz (cima-esquerda) e sombra (baixo-direita): dá o volume
  const luz = ctx.createRadialGradient(C - R * 0.45, C - R * 0.45, R * 0.1, C - R * 0.2, C - R * 0.2, R * 1.25);
  luz.addColorStop(0, 'rgba(255,255,255,0.35)'); luz.addColorStop(0.4, 'rgba(255,255,255,0)');
  luz.addColorStop(0.75, 'rgba(0,0,0,0.35)'); luz.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = luz; ctx.fillRect(C - R, C - R, R * 2, R * 2);
  ctx.restore();
  // borda fina iluminada
  ctx.lineWidth = 2; ctx.strokeStyle = _cor(det, 0.6, 0.35); ctx.beginPath(); ctx.arc(C, C, R, Math.PI * 0.9, Math.PI * 1.6); ctx.stroke();
  anel(true);
  tex.refresh();
}
// 4 planetas por galáxia, com tipos e cores diferentes
const PLANETAS_POR_GALAXIA = 4;
function planetasDaGalaxia(scene, gi, g) {
  const tipos = [['gas', true], ['rocha', false], ['oceano', false], ['gelo', true]];
  const cores = [[g.planet[0], g.planet[1]], [g.alien.d, g.alien.b], [g.planet[0], g.alien.c], [g.planet[1], '#e0f2fe']];
  tipos.forEach(([tipo, aneis], v) => planetaTextura(scene, 'planeta_' + gi + '_' + v, cores[v][0], cores[v][1], tipo, aneis, 500 + gi * 31 + v * 7));
}

// ============ FUNDO DO ESPAÇO ============
// Nebulosa em forma de nuvem (várias manchas sobrepostas)
function nebulosaTextura(scene, key, semente) {
  const S = 512, rnd = mulberry32(semente);
  const tex = scene.textures.createCanvas(key, S, S);
  const ctx = tex.getContext();
  for (let i = 0; i < 14; i++) {
    const x = S / 2 + (rnd() - 0.5) * S * 0.55, y = S / 2 + (rnd() - 0.5) * S * 0.45, r = 60 + rnd() * 140;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(255,255,255,' + (0.18 + rnd() * 0.22).toFixed(2) + ')');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, S, S);
  }
  tex.refresh();
}
// Estrelas brilhantes em cruz (camada do meio)
// Desenha por cima de uma textura de estrelas que já existe (assim fica uma camada só)
function estrelasBrilhantes(scene, key, size, count) {
  const tex = scene.textures.exists(key) ? scene.textures.get(key) : scene.textures.createCanvas(key, size, size);
  size = tex.getSourceImage().width;
  const ctx = tex.getContext();
  const cores = ['#ffffff', '#bfdbfe', '#fde68a', '#fbcfe8', '#a5f3fc'];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * size), y = Math.floor(Math.random() * size), c = cores[i % cores.length];
    ctx.fillStyle = c; ctx.globalAlpha = 0.9; ctx.fillRect(x, y, 2, 2);
    ctx.globalAlpha = 0.45; ctx.fillRect(x - 3, y, 8, 2); ctx.fillRect(x, y - 3, 2, 8);
  }
  ctx.globalAlpha = 1;
  tex.refresh();
}
// Galáxia distante (espiral apagada)
function galaxiaDistante(scene, key) {
  const S = 160, tex = scene.textures.createCanvas(key, S, S), ctx = tex.getContext();
  const nucleo = ctx.createRadialGradient(80, 80, 0, 80, 80, 26);
  nucleo.addColorStop(0, 'rgba(255,255,255,0.9)'); nucleo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = nucleo; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const braco = i % 2, t = (i / 260) * 3.2, a = t * 2.2 + braco * Math.PI, r = 6 + t * 22;
    ctx.fillStyle = 'rgba(255,255,255,' + (0.5 - t * 0.12).toFixed(2) + ')';
    ctx.fillRect(80 + Math.cos(a) * r + (Math.random() - 0.5) * 6, 80 + Math.sin(a) * r * 0.55 + (Math.random() - 0.5) * 4, 2, 2);
  }
  tex.refresh();
}
