// =====================================================
// CENA 1: BOOT
// =====================================================
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    SHIPS.forEach((s) => pixelTexture(this, 'ship_' + s.id, ART[s.art], s.palette, 3));
    galaxiaDistante(this, 'galaxia_distante');   // usada no fundo de cada galáxia
    GALAXIES.forEach((g, i) => {
      bossTexture(this, 'boss_' + i, g);
      planetTexture(this, 'planet_' + i, g.planet);
      planetasDaGalaxia(this, i, g);                       // planetas com volume
      fundoTextura(this, 'fundo_' + i, g.bg, g.alien.b);   // fundo com degradê
      gfxTexture(this, 'nest_' + i, 120, 120, (gr) => {
        const a = hexToInt(g.alien.a), b = hexToInt(g.alien.b), d = hexToInt(g.alien.d);
        gr.fillStyle(a); gr.fillCircle(60, 60, 56);
        gr.fillStyle(d); gr.fillCircle(45, 50, 30); gr.fillCircle(75, 70, 28); gr.fillCircle(62, 38, 22);
        gr.fillStyle(b);
        [[40, 45], [70, 65], [60, 35], [50, 80], [80, 45]].forEach((p) => gr.fillEllipse(p[0], p[1], 14, 18));
      });
    });
    iconeTexturas(this);   // ícones de armas, poderes e itens (src/dados/icones.js)
    // os 30 inimigos e os filhotes (src/dados/inimigos.js)
    Object.entries(INIMIGOS).forEach(([id, d]) => pixelTexture(this, 'ini_' + id, ARTE_INIMIGOS[d.arte || id], d.cores, d.scale));
    gfxTexture(this, 'mina', 22, 22, (g) => {
      g.fillStyle(0x7f1d1d); g.fillCircle(11, 11, 9);
      g.fillStyle(0xef4444); g.fillCircle(11, 11, 5);
      g.fillStyle(0xfde047); g.fillCircle(11, 11, 2);
      g.lineStyle(2, 0x450a0a); [[11, 0, 11, 4], [11, 18, 11, 22], [0, 11, 4, 11], [18, 11, 22, 11]].forEach((l) => g.lineBetween(l[0], l[1], l[2], l[3]));
    });
    pixelTexture(this, 'rock', ART.rock, { a: '#3f3f46', b: '#78716c', c: '#57534e' }, 4);
    pixelTexture(this, 'crystal', ART.rock, { a: '#164e63', b: '#22d3ee', c: '#a5f3fc' }, 4);
    pixelTexture(this, 'chest', ART.chest, { a: '#78350f', b: '#f59e0b', c: '#fef08a' }, 3);
    pixelTexture(this, 'heal', ART.heal, { a: '#7f1d1d', b: '#ef4444' }, 3);
    pixelTexture(this, 'coin', ART.coin, { a: '#713f12', b: '#facc15', c: '#fef9c3' }, 3);
    pixelTexture(this, 'magnetItem', ART.magnet, { a: '#1e3a8a', b: '#3b82f6', c: '#e5e7eb' }, 3);
    pixelTexture(this, 'bomb', ART.bomb, { a: '#111827', b: '#374151', c: '#f97316' }, 3);
    pixelTexture(this, 'wbox', ART.wbox, { a: '#581c87', b: '#c084fc', c: '#f5d0fe' }, 4);
    gfxTexture(this, 'bullet', 10, 10, (g) => { g.fillStyle(0xfde047); g.fillCircle(5, 5, 4); g.fillStyle(0xffffff); g.fillCircle(5, 5, 2); });
    gfxTexture(this, 'ebullet', 12, 12, (g) => { g.fillStyle(0xf43f5e); g.fillCircle(6, 6, 5); g.fillStyle(0xffe4e6); g.fillCircle(6, 6, 2); });
    gfxTexture(this, 'gem', 10, 10, (g) => { g.fillStyle(0x22d3ee); g.fillTriangle(5, 0, 10, 5, 5, 10); g.fillTriangle(5, 0, 0, 5, 5, 10); });
    gfxTexture(this, 'orb', 16, 16, (g) => { g.fillStyle(0x38bdf8, 0.5); g.fillCircle(8, 8, 8); g.fillStyle(0xe0f2fe); g.fillCircle(8, 8, 4); });
    gfxTexture(this, 'spark', 4, 4, (g) => { g.fillStyle(0xffffff); g.fillRect(0, 0, 4, 4); });
    gfxTexture(this, 'missile', 8, 16, (g) => {
      g.fillStyle(0xe5e7eb); g.fillRect(2, 4, 4, 9);
      g.fillStyle(0xef4444); g.fillTriangle(2, 4, 6, 4, 4, 0);
      g.fillStyle(0xf97316); g.fillRect(3, 13, 2, 3);
    });
    gfxTexture(this, 'disc', 26, 26, (g) => {
      g.fillStyle(0x9ca3af); g.fillCircle(13, 13, 12);
      g.fillStyle(0xe5e7eb); g.fillCircle(13, 13, 9);
      g.fillStyle(0x374151); g.fillCircle(13, 13, 4);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.fillCircle(13 + Math.cos(a) * 12, 13 + Math.sin(a) * 12, 2); }
    });
    gfxTexture(this, 'station', 96, 96, (g) => {
      g.fillStyle(0x475569); g.fillRect(8, 42, 80, 12); g.fillRect(42, 8, 12, 80);
      g.fillStyle(0x94a3b8); g.fillCircle(48, 48, 20);
      g.fillStyle(0x22c55e); g.fillRect(44, 36, 8, 24); g.fillRect(36, 44, 24, 8);
      g.fillStyle(0x38bdf8); [[10, 48], [86, 48], [48, 10], [48, 86]].forEach((p) => g.fillCircle(p[0], p[1], 5));
    });
    gfxTexture(this, 'blackhole', 240, 240, (g) => {
      g.fillStyle(0x7c3aed, 0.12); g.fillCircle(120, 120, 118);
      g.fillStyle(0x7c3aed, 0.2); g.fillCircle(120, 120, 90);
      g.lineStyle(4, 0xc4b5fd, 0.6);
      for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(120, 120, 50 + i * 15, i, i + 2.2); g.strokePath(); }
      g.fillStyle(0x000000); g.fillCircle(120, 120, 40);
      g.lineStyle(3, 0xf5d0fe, 0.9); g.strokeCircle(120, 120, 42);
    });
    gfxTexture(this, 'relic', 48, 48, (g) => {
      const pts = [];
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 22, a = -Math.PI / 2 + i * Math.PI / 5; pts.push({ x: 24 + Math.cos(a) * r, y: 24 + Math.sin(a) * r }); }
      g.fillStyle(0xfacc15); g.fillPoints(pts, true);
      g.fillStyle(0xfef9c3); g.fillCircle(24, 24, 6);
    });
    // locais novos da E3
    gfxTexture(this, 'derelict', 110, 80, (g) => {
      g.fillStyle(0x334155); g.fillTriangle(10, 40, 60, 14, 60, 66);
      g.fillStyle(0x475569); g.fillRect(56, 26, 34, 28);
      g.fillStyle(0x1e293b); g.fillRect(88, 18, 14, 12); g.fillRect(84, 52, 18, 10);
      g.fillStyle(0xf97316, 0.85); g.fillCircle(72, 40, 6); g.fillCircle(40, 34, 3);
      g.lineStyle(2, 0x94a3b8, 0.8); g.lineBetween(62, 30, 76, 48); g.lineBetween(30, 44, 44, 52);
    });
    gfxTexture(this, 'beacon', 64, 96, (g) => {
      g.fillStyle(0x64748b); g.fillRect(28, 30, 8, 60); g.fillRect(16, 86, 32, 8);
      g.fillStyle(0x0ea5e9, 0.25); g.fillCircle(32, 22, 22);
      g.fillStyle(0x38bdf8); g.fillCircle(32, 22, 11);
      g.fillStyle(0xe0f2fe); g.fillCircle(32, 22, 5);
    });
    gfxTexture(this, 'cache', 72, 72, (g) => {
      g.fillStyle(0x14532d); g.fillRect(8, 14, 56, 46);
      g.fillStyle(0x22c55e); g.fillRect(8, 14, 56, 10);
      g.lineStyle(3, 0x86efac, 1); g.strokeRect(8, 14, 56, 46);
      g.fillStyle(0xfacc15); g.fillRect(31, 30, 10, 18); g.fillRect(27, 35, 18, 8);
    });
    starTexture(this, 'stars_far', 256, 70, 1);
    starTexture(this, 'stars_near', 256, 22, 2);
    nebulaTexture(this, 'nebula');
    [0, 1, 2].forEach((k) => nebulosaTextura(this, 'nebulosa_' + k, 77 + k * 13));
    estrelasBrilhantes(this, 'stars_mid', 384, 16);

    writeSave(SAVE);
    this.scene.start('Hangar');
  }
}

