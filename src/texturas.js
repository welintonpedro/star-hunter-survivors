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

