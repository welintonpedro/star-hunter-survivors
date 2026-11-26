// =====================================================
// CENA 2: HANGAR
// =====================================================
const MENU_INICIAL = { mostrado: false };
class HangarScene extends Phaser.Scene {
  constructor() { super('Hangar'); }
  create() {
    this.cameras.main.setBackgroundColor('#070b1a');
    this.stars = this.add.tileSprite(0, 0, W, H, 'stars_far').setOrigin(0).setAlpha(0.6);
    this.items = [];
    this.build();
    this.time.addEvent({ delay: 10000, loop: true, callback: () => writeSave(SAVE) });
    this.showSaveWarning();
    aplicarPrefs(this.game);
    // menu principal só quando o jogo abre (voltar de uma partida cai direto no hangar)
    if (!MENU_INICIAL.mostrado) { MENU_INICIAL.mostrado = true; abrirMenuPrincipal(this); }
  }
  // Aviso sobre o save (sem localStorage ou save corrompido), só na primeira vez
  showSaveWarning() {
    if (!AVISO_SAVE.texto || AVISO_SAVE.mostrado) return;
    AVISO_SAVE.mostrado = true;
    const bg = this.add.rectangle(W / 2, H - 15, W - 40, 24, 0x7f1d1d, 0.92).setStrokeStyle(2, 0xfca5a5).setDepth(50);
    const txt = this.add.text(W / 2, H - 15, tx(AVISO_SAVE.texto), {
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
    this.keep(this.add.text(W / 2, 74, tx('Créditos: {v}', { v: fmt(SAVE.credits) }), { fontFamily: 'Arial', fontSize: '20px', color: '#a5f3fc' }).setOrigin(0.5));
    // códex (armas, itens e combos descobertos) e conquistas
    const nCq = CONQUISTAS.filter((c) => SAVE.conquistas[c.id]).length;
    this.keep(makeButton(this, 92, 30, 150, 30, tx('CÓDEX'), () => abrirCodex(this), { size: 14, color: 0x312e81, stroke: 0x818cf8 }));
    this.keep(makeButton(this, W - 92, 30, 150, 30, tx('MENU'), () => abrirMenuPrincipal(this), { size: 14 }));
    this.keep(makeButton(this, W - 92, 68, 150, 30, tx('CONFIGURAÇÕES'), () => abrirConfiguracoes(this), { size: 13 }));
    this.keep(makeButton(this, 92, 68, 150, 30, tx('CONQUISTAS') + ' ' + nCq + '/' + CONQUISTAS.length, () => abrirConquistas(this), { size: 13, color: 0x14532d, stroke: 0x4ade80 }));

    SHIPS.forEach((s, i) => {
      const x = 230 + i * 250, y = 225;
      const owned = !!SAVE.owned[s.id];
      const gal = GALAXIES[s.galaxy];
      const prevCleared = s.galaxy === 0 || SAVE.cleared[s.galaxy - 1];
      this.keep(this.add.rectangle(x, y, 225, 245, 0x0f172a, 0.92).setStrokeStyle(2, owned ? 0x60a5fa : 0x334155));
      const spr = this.keep(this.add.image(x, y - 78, 'ship_' + s.id).setScale(1.2));
      if (!owned) spr.setTint(0x475569);
      // ícone do poder exclusivo, no canto do card (o mesmo das cartas e do painel)
      this.keep(this.add.rectangle(x + 82, y - 92, 40, 40, 0x422006).setStrokeStyle(2, 0xfacc15));
      this.keep(this.add.image(x + 82, y - 92, iconeDe(s.start)).setDisplaySize(34, 34));
      this.keep(this.add.text(x, y - 28, s.name, { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
      this.keep(this.add.text(x, y - 6, gal.name + (SAVE.cleared[s.galaxy] ? '  ' + tx('(conquistada)') : ''), {
        fontFamily: 'Arial', fontSize: '12px', color: SAVE.cleared[s.galaxy] ? '#86efac' : '#94a3b8'
      }).setOrigin(0.5));
      this.keep(this.add.text(x, y + 24, tx('Vida {hp}   Vel {vel}', { hp: s.hp, vel: s.speed }) + '\n' + tx('Dano x{d}   Recarga x{r}', { d: s.dmgMult, r: s.cdMult }) + '\n' + tx('Poder: {nome}', { nome: WEAPONS[s.start].name }), {
        fontFamily: 'Arial', fontSize: '12px', color: '#cbd5e1', align: 'center'
      }).setOrigin(0.5));
      this.keep(this.add.text(x, y + 64, s.desc, { fontFamily: 'Arial', fontSize: '11px', color: '#94a3b8' }).setOrigin(0.5));
      let btn;
      if (owned) {
        btn = makeButton(this, x, y + 96, 170, 34, tx('JOGAR'), () => abrirEscolhaDeModo(this, i), { color: 0x166534, stroke: 0x4ade80, size: 16 });
      } else if (!prevCleared) {
        btn = makeButton(this, x, y + 96, 190, 34, tx('Sobreviva 30 min em') + '\n' + GALAXIES[s.galaxy - 1].name, () => {}, { disabled: true, size: 11 });
      } else {
        const can = SAVE.credits >= s.cost;
        btn = makeButton(this, x, y + 96, 170, 34, tx('COMPRAR') + '  ' + fmt(s.cost), () => {
          SAVE.credits -= s.cost; SAVE.owned[s.id] = true; writeSave(SAVE); this.build();
        }, { disabled: !can, color: 0x854d0e, stroke: 0xfacc15, size: 15 });
      }
      this.keep(btn);
    });

    this.keep(this.add.text(W / 2, 382, tx('MELHORIAS PERMANENTES'), { fontFamily: 'Arial', fontSize: '15px', color: '#fde047', fontStyle: 'bold' }).setOrigin(0.5));
    META_UPGRADES.forEach((u, i) => {
      const lvl = SAVE.meta[u.id] || 0, cost = metaCost(u, lvl), can = SAVE.credits >= cost;
      this.keep(makeButton(this, W / 2 + (i - (META_UPGRADES.length - 1) / 2) * 184, 432, 172, 62, tx('{nome} Nv {n}', { nome: u.name, n: lvl }) + '\n' + u.desc + '\n' + tx('{v} créditos', { v: fmt(cost) }), () => {
        SAVE.credits -= cost; SAVE.meta[u.id] = lvl + 1; writeSave(SAVE); this.build();
      }, { disabled: !can, size: 12 }));
    });
    this.keep(this.add.text(W / 2, 520, tx('Mover: WASD/setas ou arrastar  •  Escolhas: 1/2/3'), {
      fontFamily: 'Arial', fontSize: '11px', color: '#64748b'
    }).setOrigin(0.5));
  }
}

