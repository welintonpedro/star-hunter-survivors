// =====================================================
// CENA 2: HANGAR
// =====================================================
class HangarScene extends Phaser.Scene {
  constructor() { super('Hangar'); }
  create() {
    this.cameras.main.setBackgroundColor('#070b1a');
    this.stars = this.add.tileSprite(0, 0, W, H, 'stars_far').setOrigin(0).setAlpha(0.6);
    this.items = [];
    this.build();
    const off = this.registry.get('offline');
    if (off && off.credits > 0) { this.registry.set('offline', null); this.showOffline(off); }
    this.time.addEvent({ delay: 10000, loop: true, callback: () => writeSave(SAVE) });
    this.showSaveWarning();
  }
  // Aviso sobre o save (sem localStorage ou save corrompido), só na primeira vez
  showSaveWarning() {
    if (!AVISO_SAVE.texto || AVISO_SAVE.mostrado) return;
    AVISO_SAVE.mostrado = true;
    const bg = this.add.rectangle(W / 2, H - 15, W - 40, 24, 0x7f1d1d, 0.92).setStrokeStyle(2, 0xfca5a5).setDepth(50);
    const txt = this.add.text(W / 2, H - 15, AVISO_SAVE.texto, {
      fontFamily: 'Arial', fontSize: '14px', color: '#fee2e2'
    }).setOrigin(0.5).setDepth(51);
    this.time.delayedCall(9000, () => { bg.destroy(); txt.destroy(); });
  }
  update(t, dt) { this.stars.tilePositionY -= dt * 0.01; }
  keep(o) { this.items.push(o); return o; }
  build() {
    this.items.forEach((i) => i.destroy());
    this.items = [];
    this.keep(this.add.text(W / 2, 34, 'STAR HUNTER SURVIVORS', {
      fontFamily: 'Arial Black, Arial', fontSize: '34px', color: '#fde047', stroke: '#7c2d12', strokeThickness: 6
    }).setOrigin(0.5));
    this.keep(this.add.text(W / 2, 74, 'Créditos: ' + fmt(SAVE.credits), { fontFamily: 'Arial', fontSize: '20px', color: '#a5f3fc' }).setOrigin(0.5));

    SHIPS.forEach((s, i) => {
      const x = 230 + i * 250, y = 225;
      const owned = !!SAVE.owned[s.id];
      const gal = GALAXIES[s.galaxy];
      const prevCleared = s.galaxy === 0 || SAVE.cleared[s.galaxy - 1];
      this.keep(this.add.rectangle(x, y, 225, 245, 0x0f172a, 0.92).setStrokeStyle(2, owned ? 0x60a5fa : 0x334155));
      const spr = this.keep(this.add.image(x, y - 78, 'ship_' + s.id).setScale(1.2));
      if (!owned) spr.setTint(0x475569);
      this.keep(this.add.text(x, y - 28, s.name, { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
      this.keep(this.add.text(x, y - 6, gal.name + (SAVE.cleared[s.galaxy] ? '  (conquistada)' : ''), {
        fontFamily: 'Arial', fontSize: '12px', color: SAVE.cleared[s.galaxy] ? '#86efac' : '#94a3b8'
      }).setOrigin(0.5));
      this.keep(this.add.text(x, y + 24, 'Vida ' + s.hp + '   Vel ' + s.speed + '\nDano x' + s.dmgMult + '   Recarga x' + s.cdMult + '\nArma: ' + WEAPONS[s.start].name, {
        fontFamily: 'Arial', fontSize: '12px', color: '#cbd5e1', align: 'center'
      }).setOrigin(0.5));
      this.keep(this.add.text(x, y + 64, s.desc, { fontFamily: 'Arial', fontSize: '11px', color: '#94a3b8' }).setOrigin(0.5));
      let btn;
      if (owned) {
        btn = makeButton(this, x, y + 96, 170, 34, 'JOGAR', () => this.scene.start('Game', { ship: i }), { color: 0x166534, stroke: 0x4ade80, size: 16 });
      } else if (!prevCleared) {
        btn = makeButton(this, x, y + 96, 190, 34, 'Sobreviva 30 min em\n' + GALAXIES[s.galaxy - 1].name, () => {}, { disabled: true, size: 11 });
      } else {
        const can = SAVE.credits >= s.cost;
        btn = makeButton(this, x, y + 96, 170, 34, 'COMPRAR  ' + fmt(s.cost), () => {
          SAVE.credits -= s.cost; SAVE.owned[s.id] = true; writeSave(SAVE); this.build();
        }, { disabled: !can, color: 0x854d0e, stroke: 0xfacc15, size: 15 });
      }
      this.keep(btn);
    });

    this.keep(this.add.text(W / 2, 382, 'MELHORIAS PERMANENTES', { fontFamily: 'Arial', fontSize: '15px', color: '#fde047', fontStyle: 'bold' }).setOrigin(0.5));
    META_UPGRADES.forEach((u, i) => {
      const lvl = SAVE.meta[u.id] || 0, cost = metaCost(u, lvl), can = SAVE.credits >= cost;
      this.keep(makeButton(this, 112 + i * 184, 432, 172, 62, u.name + '  Nv ' + lvl + '\n' + u.desc + '\n' + fmt(cost) + ' créditos', () => {
        SAVE.credits -= cost; SAVE.meta[u.id] = lvl + 1; writeSave(SAVE); this.build();
      }, { disabled: !can, size: 12 }));
    });
    this.keep(this.add.text(W / 2, 520, 'Mover: WASD/setas ou arrastar  •  Automático: ESPAÇO  •  Escolhas: 1/2/3', {
      fontFamily: 'Arial', fontSize: '11px', color: '#64748b'
    }).setOrigin(0.5));
  }
  showOffline(off) {
    const parts = [];
    parts.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(100).setInteractive());
    parts.push(this.add.rectangle(W / 2, H / 2, 420, 200, 0x0f172a).setStrokeStyle(3, 0x22d3ee).setDepth(101));
    const h = Math.floor(off.mins / 60), m = Math.floor(off.mins % 60);
    parts.push(this.add.text(W / 2, H / 2 - 30, 'BEM-VINDO DE VOLTA!\n\nSuas naves farmaram por ' + h + 'h ' + m + 'min\n+' + fmt(off.credits) + ' créditos', {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', align: 'center'
    }).setOrigin(0.5).setDepth(102));
    const ok = makeButton(this, W / 2, H / 2 + 60, 140, 36, 'COLETAR', () => { parts.forEach((p) => p.destroy()); ok.destroy(); },
      { color: 0x166534, stroke: 0x4ade80, depth: 103 });
  }
}

