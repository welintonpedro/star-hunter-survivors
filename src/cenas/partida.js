// =====================================================
// CENA 3: PARTIDA
// =====================================================
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }
  init(data) { this.shipIndex = (data && data.ship) || 0; }

  create() {
    const ship = SHIPS[this.shipIndex];
    this.ship = ship; this.gi = ship.galaxy; this.gal = GALAXIES[this.gi];

    // estado da partida
    this.level = 1; this.xp = 0; this.xpNext = 6;
    this.pendingLevels = 0; this.pendingChests = 0; this.modal = null;
    this.elapsed = 0; this.runCredits = 0; this.banked = 0; this.bonus = 0; this.kills = 0;
    this.auto = false; this.paused = false; this.ended = false;
    this.boss = null;
    this.invuln = 0; this.bankTimer = 0;
    this.ringCount = 0; this.swarmCount = 0; this.eliteCount = 0;
    // ritmo da partida de 30 min (src/ritmo.js, src/dados/ondas.js, src/dados/eventos.js)
    this.estadoOndas = novoEstadoOndas(0); this.ritmoParado = false;
    this.chefesFeitos = EVENTOS.chefes.map(() => false);
    this.naveMae = null; this.vitoriaRegistrada = false; this.primeiraVitoria = false;
    this.menuPausa = null;
    this.sparkCount = 0; this.xpMult = 1; this.creditMult = 1;
    this.weapons = []; this.passives = {};
    this.orbs = []; this.orbAngle = 0; this.missiles = []; this.discs = [];
    this.minimapTimer = 0;

    // mundo
    // sem bordas: o mapa dá a volta (src/mundo.js). A câmera segue a nave para sempre.
    this.cameras.main.removeBounds();
    this.aproximarTimer = 0;
    this.cameras.main.setBackgroundColor(this.gal.bg);
    this.add.image(0, 0, 'fundo_' + this.gi).setOrigin(0).setScrollFactor(0).setDepth(-32);
    this.mid = this.add.tileSprite(0, 0, W, H, 'stars_mid').setOrigin(0).setScrollFactor(0).setDepth(-29).setAlpha(0.85);
    this.far = this.add.tileSprite(0, 0, W, H, 'stars_far').setOrigin(0).setScrollFactor(0).setTint(this.gal.starTint).setAlpha(0.7).setDepth(-30);
    this.near = this.add.tileSprite(0, 0, W, H, 'stars_near').setOrigin(0).setScrollFactor(0).setDepth(-29);
    this.buildWorld();

    // jogador
    this.player = this.physics.add.sprite(WORLD / 2, WORLD / 2, 'ship_' + ship.id).setDepth(10);
    this.player.body.setCircle(16, this.player.width / 2 - 16, this.player.height / 2 - 16);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // grupos
    this.enemies = this.physics.add.group({ maxSize: MAX_ENEMIES + 30 });
    this.rocks = this.physics.add.group();
    this.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 400 });
    this.ebullets = this.physics.add.group({ defaultKey: 'ebullet', maxSize: 200 });
    this.gems = this.add.group({ defaultKey: 'gem', maxSize: 400 });
    this.pickups = this.add.group();
    this.spawnRocks();

    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHit, null, this);
    this.physics.add.overlap(this.bullets, this.rocks, this.onBulletHit, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouch, null, this);
    this.physics.add.overlap(this.player, this.ebullets, this.onPlayerShot, null, this);

    this.recalc();
    this.hp = this.mods.maxHp;
    this.addWeapon(ship.start);

    this.setupInput();
    this.createHUD();
    if (MODO_TESTE) criarPainelTeste(this);
    this.banner(this.gal.name, '#' + this.gal.starTint.toString(16).padStart(6, '0'));
  }

  // ---------- MUNDO: nebulosas, locais únicos, meteoros ----------
  buildWorld() {
    const rnd = mulberry32(99 + this.gi * 31);
    this.nebulas = [];
    const tons = [hexToInt(this.gal.alien.b), this.gal.starTint, hexToInt(this.gal.planet[1]), hexToInt(this.gal.alien.d)];
    for (let i = 0; i < 90; i++) {
      this.nebulas.push(this.add.image(rnd() * WORLD, rnd() * WORLD, 'nebulosa_' + (i % 3))
        .setScale(1.5 + rnd() * 3).setRotation(rnd() * Math.PI * 2).setTint(tons[i % tons.length])
        .setAlpha(0.14 + rnd() * 0.16).setDepth(-20));
    }

    this.pois = genPOIs(this.gi).map((p) => {
      const o = Object.assign({}, p, { discovered: false, done: false, scan: 0, cooldown: 0 });
      const keys = { planet: 'planeta_' + this.gi + '_' + ((o.variante || 0) % PLANETAS_POR_GALAXIA), station: 'station', nest: 'nest_' + this.gi, blackhole: 'blackhole', relic: 'relic',
        derelict: 'derelict', beacon: 'beacon', cache: 'cache' };
      o.img = this.add.image(o.x, o.y, keys[o.type]).setDepth(o.type === 'blackhole' ? -4 : 1).setScale(o.escala || 1);
      if (o.type === 'relic') this.tweens.add({ targets: o.img, scale: 1.25, yoyo: true, repeat: -1, duration: 700 });
      if (o.type === 'beacon') this.tweens.add({ targets: o.img, alpha: 0.6, yoyo: true, repeat: -1, duration: 600 });
      const alto = { planet: 185, blackhole: 130, derelict: 55, beacon: 62 }[o.type] || 70;
      o.labelDy = -alto * (o.type === 'relic' ? 1 : (o.escala || 1));
      o.label = this.add.text(o.x, o.y + o.labelDy, o.name, {
        fontFamily: 'Arial', fontSize: '15px', color: '#ffffff', stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(2);
      return o;
    });
    this.scanBar = this.add.graphics().setDepth(3);
    this.gfxInimigos = this.add.graphics().setDepth(4);
    this.lentidao = 1;
  }

  // ---------- MAPA QUE DÁ A VOLTA (src/mundo.js) ----------
  // Traz o objeto para a cópia do mapa mais perto da nave. Devolve o quanto ele andou.
  aproximarObj(o) {
    const nx = aproximar(o.x, this.player.x, WORLD), ny = aproximar(o.y, this.player.y, WORLD);
    const dx = nx - o.x, dy = ny - o.y;
    if (dx || dy) {
      if (o.body && o.body.reset) {
        // corpo de física: reposiciona sem perder a velocidade
        const vx = o.body.velocity.x, vy = o.body.velocity.y;
        o.body.reset(nx, ny);
        o.body.velocity.set(vx, vy);
      } else { o.x = nx; o.y = ny; }
    }
    return { dx, dy };
  }
  // Coisas paradas ou lentas: basta conferir algumas vezes por segundo (a troca acontece a
  // ~8.500 px da nave, muito longe da tela)
  aproximarTudo() {
    this.rocks.children.iterate((r) => { if (r && r.active) this.aproximarObj(r); });
    this.pickups.children.iterate((p) => {
      if (!p || !p.active) return;
      const d = this.aproximarObj(p);
      p.baseY += d.dy;
      if (p.label) { p.label.x += d.dx; p.label.y += d.dy; }
    });
    this.pois.forEach((p) => {
      const d = this.aproximarObj(p);
      if (d.dx || d.dy) { p.img.setPosition(p.x, p.y); p.label.setPosition(p.x, p.y + p.labelDy); }
    });
    this.nebulas.forEach((n) => this.aproximarObj(n));
    if (this.naveMae && this.naveMae.active) this.aproximarObj(this.naveMae);
  }

  spawnRocks() {
    const c = WORLD / 2;
    for (let i = 0; i < ROCK_COUNT; i++) {
      let x, y;
      do { x = Math.random() * WORLD; y = Math.random() * WORLD; }
      while (Math.hypot(x - c, y - c) < 250);
      this.criarMeteoro(x, y, Math.random() < 0.07);
    }
  }
  criarMeteoro(x, y, crystal) {
    const r = this.rocks.create(x, y, crystal ? 'crystal' : 'rock');
    r.setDepth(3).setAngle(Math.random() * 360);
    r.body.setCircle(20, r.width / 2 - 20, r.height / 2 - 20);
    r.body.setImmovable(true);
    r.isRock = true; r.crystal = crystal; r.hitR = 22;
    r.hp = r.maxHp = 30 * this.gal.hpMult * (crystal ? 2 : 1);
    r.flash = 0; r.orbHit = 0;
    return r;
  }

  // ---------- ATRIBUTOS (armas + itens + melhorias permanentes) ----------
  recalc() {
    const m = SAVE.meta, p = this.passives, s = this.ship;
    const lv = (k) => p[k] || 0;
    const oldMax = this.mods ? this.mods.maxHp : 0;
    this.mods = {
      dmg: (1 + 0.1 * lv('core')) * (1 + 0.1 * m.dmg) * s.dmgMult,
      cd: Math.max(0.3, 1 - 0.08 * lv('cooler')) / (1 + 0.06 * m.rate) * s.cdMult,
      area: 1 + 0.1 * lv('amp'),
      amount: lv('multi'),
      maxHp: s.hp * (1 + 0.1 * m.hp) * (1 + 0.2 * lv('armor')),
      speed: s.speed * (1 + 0.1 * lv('engine')),
      magnet: 90 * (1 + 0.15 * m.magnet) * (1 + 0.3 * lv('magnet')),
      regen: 0.5 * lv('regen')
    };
    if (oldMax && this.mods.maxHp > oldMax) this.hp += this.mods.maxHp - oldMax;
  }

  wstats(w) {
    const def = WEAPONS[w.id];
    const s = def.stats(w.level);
    if (w.evolved) def.evolve(s);
    s.dmg *= this.mods.dmg;
    s.cd *= this.mods.cd;
    if (s.amount !== undefined) s.amount += this.mods.amount;
    if (s.radius !== undefined) s.radius *= this.mods.area;
    if (s.size !== undefined) s.size *= this.mods.area;
    return s;
  }

  // ---------- INVENTÁRIO ----------
  hasWeapon(id) { return this.weapons.find((w) => w.id === id); }
  addWeapon(id) {
    const w = this.hasWeapon(id);
    if (w) { if (w.level < MAX_WEAPON_LEVEL) w.level++; this.refreshInventory(); return 'up'; }
    if (this.weapons.length >= MAX_WEAPONS) return 'full';
    this.weapons.push({ id, level: 1, evolved: false, timer: 0.3 });
    this.refreshInventory();
    return 'new';
  }
  addPassive(id) {
    if (!this.passives[id] && Object.keys(this.passives).length >= MAX_PASSIVES) return false;
    this.passives[id] = Math.min(PASSIVES[id].max, (this.passives[id] || 0) + 1);
    this.recalc();
    this.refreshInventory();
    return true;
  }
  evolvable() {
    return this.weapons.filter((w) => !w.evolved && w.level >= MAX_WEAPON_LEVEL && this.passives[WEAPONS[w.id].evo]);
  }

  // Opções ao subir de nível (estilo Vampire Survivors)
  upgradeOptions() {
    const opts = [];
    this.weapons.forEach((w) => { if (!w.evolved && w.level < MAX_WEAPON_LEVEL) opts.push({ kind: 'weapon', id: w.id, level: w.level + 1, weight: 1.4 }); });
    if (this.weapons.length < MAX_WEAPONS) {
      // armas novas: só as comuns (poder de nave nunca aparece como arma nova)
      Object.keys(WEAPONS).forEach((id) => { if (this.armaDisponivel(id) && !this.hasWeapon(id)) opts.push({ kind: 'weapon', id, level: 1, weight: 1 }); });
    }
    Object.keys(PASSIVES).forEach((id) => {
      const lv = this.passives[id] || 0;
      if (lv >= PASSIVES[id].max) return;
      if (!lv && Object.keys(this.passives).length >= MAX_PASSIVES) return;
      opts.push({ kind: 'passive', id, level: lv + 1, weight: lv ? 1.2 : 0.9 });
    });
    return opts;
  }
  // Arma comum que pode aparecer nas cartas: não é poder de nave e não está travada
  armaDisponivel(id) {
    const d = WEAPONS[id];
    return !d.poder && !d.hidden;
  }
  pickWeighted(list, n) {
    const pool = list.slice(), out = [];
    while (out.length < n && pool.length) {
      const total = pool.reduce((a, o) => a + o.weight, 0);
      let r = Math.random() * total, idx = 0;
      for (; idx < pool.length; idx++) { r -= pool[idx].weight; if (r <= 0) break; }
      out.push(pool.splice(Math.min(idx, pool.length - 1), 1)[0]);
    }
    return out;
  }
  applyOption(o) {
    if (o.kind === 'weapon') this.addWeapon(o.id);
    else if (o.kind === 'passive') this.addPassive(o.id);
    else if (o.kind === 'heal') this.hp = Math.min(this.mods.maxHp, this.hp + this.mods.maxHp * 0.3);
    else if (o.kind === 'gold') this.runCredits += 25 * this.gal.rewardMult;
  }
  // Carta de subir de nível: desenho grande, nome, efeito curto e nível. Sem dica de combo (RN-24, RN-25).
  criarCarta(o, i, x, y) {
    const D = 202, fixo = (obj) => obj.setScrollFactor(0).setDepth(D + 1);
    let icone, escala = 1.6, nome, efeito, etiqueta, nivel = 0, max = 0, cor = 0x3f3f46, borda = 0xa5b4fc;
    if (o.kind === 'weapon') {
      const d = WEAPONS[o.id];
      icone = iconeDe(o.id); nome = d.name; efeito = d.desc[o.level - 1]; nivel = o.level; max = MAX_WEAPON_LEVEL;
      etiqueta = d.poder ? 'PODER DA NAVE' : o.level === 1 ? 'ARMA NOVA' : 'ARMA';
      cor = d.poder ? 0x422006 : 0x1e1b4b; borda = d.poder ? 0xfacc15 : 0x818cf8;
    } else if (o.kind === 'passive') {
      const d = PASSIVES[o.id];
      icone = iconeDe(o.id); nome = d.name; efeito = d.desc; nivel = o.level; max = d.max;
      etiqueta = o.level === 1 ? 'ITEM NOVO' : 'ITEM'; cor = 0x042f2e; borda = 0x2dd4bf;
    } else if (o.kind === 'heal') {
      icone = 'heal'; escala = 2.6; nome = 'Kit de Reparo'; efeito = '+30% de vida'; etiqueta = 'CURA';
    } else {
      icone = 'coin'; escala = 2.6; nome = 'Créditos'; efeito = '+' + fmt(25 * this.gal.rewardMult); etiqueta = 'BÔNUS';
    }
    const btn = makeButton(this, x, y, 220, 270, '', () => this.modalPick(i), { fixed: true, depth: D, color: cor, stroke: borda });
    const parts = [btn];
    parts.push(fixo(this.add.text(x - 98, y - 125, String(i + 1), { fontFamily: 'Arial', fontSize: '13px', color: '#94a3b8', fontStyle: 'bold' })));
    parts.push(fixo(this.add.text(x, y - 112, etiqueta, { fontFamily: 'Arial', fontSize: '12px', color: '#fde68a', fontStyle: 'bold' }).setOrigin(0.5)));
    parts.push(fixo(this.add.image(x, y - 45, icone).setScale(escala)));
    parts.push(fixo(this.add.text(x, y + 22, nome, { fontFamily: 'Arial', fontSize: '17px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: 200 } }).setOrigin(0.5)));
    parts.push(fixo(this.add.text(x, y + 58, efeito, { fontFamily: 'Arial', fontSize: '14px', color: '#cbd5e1', align: 'center', wordWrap: { width: 196 } }).setOrigin(0.5)));
    // quadradinhos de nível: cheios até o nível que a carta dá
    for (let k = 0; k < max; k++) {
      const px = x + (k - (max - 1) / 2) * 18;
      parts.push(fixo(this.add.rectangle(px, y + 108, 12, 12, k < nivel ? 0xfacc15 : 0x334155).setStrokeStyle(1, 0x000000)));
    }
    return parts;
  }

  // ---------- CONTROLES ----------
  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.input.keyboard.addCapture('SPACE');
    this.input.keyboard.on('keydown-SPACE', () => this.toggleAuto());
    this.input.keyboard.on('keydown-ONE', () => this.modalPick(0));
    this.input.keyboard.on('keydown-TWO', () => this.modalPick(1));
    this.input.keyboard.on('keydown-THREE', () => this.modalPick(2));
    this.input.keyboard.on('keydown-ENTER', () => this.modalPick(0));
    this.input.keyboard.on('keydown-ESC', () => this.alternarPausa());
    this.input.keyboard.on('keydown-P', () => this.alternarPausa());
    // trocar de aba ou minimizar abre a pausa (RN-31, RN-33)
    const aoEsconder = () => this.abrirPausa();
    this.game.events.on('hidden', aoEsconder);
    this.events.once('shutdown', () => this.game.events.off('hidden', aoEsconder));

    this.joy = { active: false, dx: 0, dy: 0, sx: 0, sy: 0 };
    this.joyBase = this.add.circle(0, 0, 50, 0xffffff, 0.08).setStrokeStyle(2, 0xffffff, 0.3).setScrollFactor(0).setDepth(140).setVisible(false);
    this.joyKnob = this.add.circle(0, 0, 22, 0xffffff, 0.25).setScrollFactor(0).setDepth(141).setVisible(false);
    this.input.on('pointerdown', (p, over) => {
      if ((over && over.length) || this.paused || this.ended || this.menuPausa) return;
      this.joy.active = true; this.joy.sx = p.x; this.joy.sy = p.y;
      this.joyBase.setPosition(p.x, p.y).setVisible(true);
      this.joyKnob.setPosition(p.x, p.y).setVisible(true);
    });
    this.input.on('pointermove', (p) => {
      if (!this.joy.active) return;
      let dx = p.x - this.joy.sx, dy = p.y - this.joy.sy;
      const d = Math.hypot(dx, dy), max = 50;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      this.joy.dx = dx / max; this.joy.dy = dy / max;
      this.joyKnob.setPosition(this.joy.sx + dx, this.joy.sy + dy);
    });
    this.input.on('pointerup', () => {
      this.joy.active = false; this.joy.dx = 0; this.joy.dy = 0;
      this.joyBase.setVisible(false); this.joyKnob.setVisible(false);
    });
  }

  // ---------- PAUSA (botão II, ESC, P ou trocar de aba) ----------
  alternarPausa() {
    if (this.menuPausa) this.fecharPausa(); else this.abrirPausa();
  }
  abrirPausa() {
    if (this.ended || this.menuPausa) return;
    this.physics.pause();
    this.time.paused = true;
    this.tweens.pauseAll();
    this.joy.active = false; this.joyBase.setVisible(false); this.joyKnob.setVisible(false);
    this.player.setVelocity(0, 0);
    const D = 400;
    const parts = [
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setScrollFactor(0).setDepth(D).setInteractive(),
      this.add.rectangle(W / 2, H / 2, 360, 200, 0x0f172a).setStrokeStyle(3, 0x60a5fa).setScrollFactor(0).setDepth(D + 1),
      this.add.text(W / 2, H / 2 - 55, 'PAUSADO', {
        fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#a5f3fc', stroke: '#000000', strokeThickness: 5
      }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2),
      this.add.text(W / 2, H / 2 - 15, 'O relógio da partida está parado.\nESC ou P para continuar.', {
        fontFamily: 'Arial', fontSize: '14px', color: '#cbd5e1', align: 'center'
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D + 2)
    ];
    const btn = makeButton(this, W / 2, H / 2 + 60, 180, 38, 'CONTINUAR', () => this.fecharPausa(),
      { fixed: true, depth: D + 3, color: 0x166534, stroke: 0x4ade80 });
    parts.push(btn.bg, btn.txt);
    this.menuPausa = { parts };
  }
  fecharPausa() {
    if (!this.menuPausa) return;
    this.menuPausa.parts.forEach((p) => p.destroy());
    this.menuPausa = null;
    this.time.paused = false;
    this.tweens.resumeAll();
    if (!this.modal && !this.ended) this.physics.resume();
  }

  toggleAuto() {
    if (this.ended || this.menuPausa) return;
    this.auto = !this.auto;
    this.autoBtn.setLabel(this.auto ? 'AUTO: LIGADO' : 'AUTO: DESLIGADO');
    this.autoBtn.bg.setFillStyle(this.auto ? 0x166534 : 0x1e3a8a);
    if (this.modal && this.auto) this.scheduleAutoPick();
  }

  // ---------- HUD ----------
  createHUD() {
    const D = 150;
    this.add.rectangle(16, 16, 220, 16, 0x000000, 0.6).setOrigin(0).setScrollFactor(0).setDepth(D);
    this.hpFill = this.add.rectangle(18, 18, 216, 12, 0xef4444).setOrigin(0).setScrollFactor(0).setDepth(D + 1);
    this.hpText = this.add.text(126, 24, '', { fontFamily: 'Arial', fontSize: '11px', color: '#ffffff' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    this.infoText = this.add.text(16, 36, '', { fontFamily: 'Arial', fontSize: '13px', color: '#e2e8f0' }).setScrollFactor(0).setDepth(D);
    this.timeText = this.add.text(W / 2, 12, '0:00', { fontFamily: 'Arial', fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D);
    this.add.rectangle(0, H - 10, W, 10, 0x000000, 0.6).setOrigin(0).setScrollFactor(0).setDepth(D);
    this.xpFill = this.add.rectangle(0, H - 10, W, 10, 0x22d3ee).setOrigin(0).setScrollFactor(0).setDepth(D + 1);

    this.autoBtn = makeButton(this, W - 90, 26, 160, 30, 'AUTO: DESLIGADO', () => this.toggleAuto(), { fixed: true, depth: D, size: 13 });
    makeButton(this, W - 196, 26, 40, 30, 'II', () => this.alternarPausa(), { fixed: true, depth: D, size: 15 });
    makeButton(this, W - 90, 62, 160, 26, 'RECOLHER NAVE', () => this.endRun('retreat'), { fixed: true, depth: D, size: 12, color: 0x3f3f46, stroke: 0xa1a1aa });

    this.bossBarBg = this.add.rectangle(W / 2, 54, 400, 14, 0x000000, 0.7).setScrollFactor(0).setDepth(D).setVisible(false);
    this.bossBar = this.add.rectangle(W / 2 - 198, 54, 396, 10, 0xa855f7).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1).setVisible(false);
    this.hintText = this.add.text(W / 2, H - 32, '', { fontFamily: 'Arial', fontSize: '14px', color: '#fde047', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(D);

    // minimapa
    this.mmSize = 150; this.mmX = W - 90 - 75; this.mmY = 86;
    this.add.rectangle(this.mmX, this.mmY, this.mmSize, this.mmSize, 0x020617, 0.92).setOrigin(0).setStrokeStyle(2, 0x64748b).setScrollFactor(0).setDepth(D);
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(D + 1);
    this.add.text(this.mmX + this.mmSize / 2, this.mmY + this.mmSize + 4, 'MAPA', { fontFamily: 'Arial', fontSize: '10px', color: '#94a3b8' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D);

    this.invItems = [];
  }

  // Painel no canto: ícones das armas (1ª linha) e itens (2ª linha) com o nível,
  // e embaixo as linhas de combo feitas nesta partida: [arma] + [item] = [evolução] (RN-29)
  refreshInventory() {
    if (!this.invItems) return;
    this.invItems.forEach((o) => o.destroy());
    this.invItems = [];
    const D = 150, y = 80, PASSO = 32, fixo = (o, d) => { this.invItems.push(o.setScrollFactor(0).setDepth(D + (d || 0))); return o; };
    const icone = (x, yy, chave, txt) => {
      fixo(this.add.rectangle(x, yy, 28, 28, 0x000000, 0.55).setStrokeStyle(1, 0x475569));
      fixo(this.add.image(x, yy, chave).setDisplaySize(26, 26), 1);
      if (txt) fixo(this.add.text(x + 10, yy + 9, txt, { fontFamily: 'Arial', fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5), 2);
    };
    for (let i = 0; i < MAX_WEAPONS; i++) {
      const w = this.weapons[i], x = 30 + i * PASSO;
      if (w) icone(x, y, iconeDe(w.id, w.evolved), w.evolved ? '★' : String(w.level));
      else fixo(this.add.rectangle(x, y, 28, 28, 0x000000, 0.35).setStrokeStyle(1, 0x334155));
    }
    const pk = Object.keys(this.passives);
    for (let i = 0; i < MAX_PASSIVES; i++) {
      const id = pk[i], x = 30 + i * PASSO;
      if (id) icone(x, y + PASSO, iconeDe(id), String(this.passives[id]));
      else fixo(this.add.rectangle(x, y + PASSO, 28, 28, 0x000000, 0.35).setStrokeStyle(1, 0x334155));
    }
    // combos desta partida
    this.weapons.filter((w) => w.evolved).forEach((w, k) => {
      const yy = y + PASSO * 2 + 8 + k * 30, d = WEAPONS[w.id];
      fixo(this.add.rectangle(78, yy, 132, 28, 0x422006, 0.75).setStrokeStyle(1, 0xfacc15));
      fixo(this.add.image(30, yy, iconeDe(w.id)).setDisplaySize(22, 22), 1);
      fixo(this.add.text(48, yy, '+', { fontFamily: 'Arial', fontSize: '15px', color: '#fde047', fontStyle: 'bold' }).setOrigin(0.5), 1);
      fixo(this.add.image(66, yy, iconeDe(d.evo)).setDisplaySize(22, 22), 1);
      fixo(this.add.text(85, yy, '=', { fontFamily: 'Arial', fontSize: '15px', color: '#fde047', fontStyle: 'bold' }).setOrigin(0.5), 1);
      fixo(this.add.image(106, yy, iconeDe(w.id, true)).setDisplaySize(24, 24), 1);
    });
  }


  updateHUD() {
    this.hpFill.setScale(clamp(this.hp / this.mods.maxHp, 0, 1), 1);
    this.hpText.setText(Math.ceil(Math.max(0, this.hp)) + ' / ' + Math.ceil(this.mods.maxHp));
    this.infoText.setText('Nível ' + this.level + '   Abates ' + this.kills + '   Créditos +' + fmt(this.runCredits) + (this.auto ? ' (auto 60%)' : ''));
    this.timeText.setText(fmtTime(this.elapsed) + ' / ' + fmtTime(EVENTOS.duracao));
    this.xpFill.setScale(Math.min(1, this.xp / this.xpNext), 1);
    if (this.boss && !this.boss.active) this.boss = this.chefeVivo();
    if (this.boss && this.boss.active) {
      this.bossBarBg.setVisible(true); this.bossBar.setVisible(true);
      this.bossBar.setScale(Math.max(0, this.boss.hp / this.boss.maxHp), 1);
    } else { this.bossBarBg.setVisible(false); this.bossBar.setVisible(false); }
    this.hintText.setText(this.textoDica());
  }

  // Linha de aviso no rodapé: o que vem a seguir, ou o que está esperando o AUTO desligar
  textoDica() {
    const chefeEsperando = EVENTOS.chefes.some((c, i) => !this.chefesFeitos[i] && this.elapsed >= c.t);
    const maeEsperando = !this.naveMae && this.elapsed >= EVENTOS.naveMae;
    if (this.auto && maeEsperando) return 'Nave-mãe detectada! Desligue o AUTO para enfrentá-la e vencer.';
    if (this.auto && chefeEsperando) return 'Chefe detectado! Desligue o AUTO para enfrentá-lo.';
    if (this.vitoriaRegistrada) return 'GALÁXIA CONQUISTADA! Resista à nave-mãe o quanto puder.';
    const p = proximoEvento(this.elapsed);
    return p ? p.nome + ' em ' + fmtTime(Math.max(0, p.t - this.elapsed)) : '';
  }

  drawMinimap() {
    const g = this.minimap, S = this.mmSize, X = this.mmX, Y = this.mmY, k = S / WORLD;
    const mx = (x) => X + envolver(x, WORLD) * k, my = (y) => Y + envolver(y, WORLD) * k;
    g.clear();
    const colors = { planet: 0x22d3ee, station: 0x22c55e, nest: 0xef4444, blackhole: 0xa855f7, relic: 0xfacc15,
      derelict: 0xf97316, beacon: 0x38bdf8, cache: 0x86efac };
    this.pois.forEach((p) => {
      if (!p.discovered && !p.revelado) return;
      g.fillStyle(p.done ? 0x475569 : colors[p.type], p.discovered ? 1 : 0.55);
      g.fillRect(mx(p.x) - 3, my(p.y) - 3, 6, 6);
    });
    this.pickups.children.iterate((pk) => {
      if (pk && pk.active && (pk.ptype === 'chest' || pk.ptype === 'weapon')) { g.fillStyle(0xfacc15, 1); g.fillCircle(mx(pk.x), my(pk.y), 2.5); }
    });
    this.enemies.children.iterate((e) => {
      if (e && e.active && (e.isElite || e.isBoss)) { g.fillStyle(0xff3b3b, 1); g.fillCircle(mx(e.x), my(e.y), e.isBoss ? 4 : 3); }
    });
    // moldura da tela, cortada na emenda para não sair do quadro
    const cam = this.cameras.main;
    g.lineStyle(1, 0xffffff, 0.35);
    retangulosNoMinimapa(cam.scrollX * k, cam.scrollY * k, W * k, H * k, S).forEach((r) => g.strokeRect(X + r.x, Y + r.y, r.w, r.h));
    g.fillStyle(0xffffff, 1).fillCircle(mx(this.player.x), my(this.player.y), 2.5);
  }

  banner(text, color, y) {
    // empilha avisos simultâneos para não ficarem um em cima do outro
    this.bannerStack = this.bannerStack || 0;
    const lines = text.split('\n').length;
    const t = this.add.text(W / 2, (y || 104) + Math.min(this.bannerStack, 3) * 32, text, {
      fontFamily: 'Arial Black, Arial', fontSize: '22px', color: color || '#ffffff', stroke: '#000000', strokeThickness: 5, align: 'center'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(160);
    this.bannerStack += lines;
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 1500, duration: 800, onComplete: () => { t.destroy(); this.bannerStack = Math.max(0, this.bannerStack - lines); } });
  }

  // ---------- LOOP PRINCIPAL ----------
  update(time, delta) {
    const cam = this.cameras.main;
    this.far.tilePositionX = cam.scrollX * 0.2; this.far.tilePositionY = cam.scrollY * 0.2;
    this.near.tilePositionX = cam.scrollX * 0.5; this.near.tilePositionY = cam.scrollY * 0.5;
    this.mid.tilePositionX = cam.scrollX * 0.32; this.mid.tilePositionY = cam.scrollY * 0.32;
    if (this.ended || this.paused || this.menuPausa) return;
    const dt = Math.min(delta, 50) / 1000;
    this.elapsed += dt;

    if (this.mods.regen > 0) this.hp = Math.min(this.mods.maxHp, this.hp + this.mods.regen * dt);
    this.invuln -= dt;
    this.movePlayer();
    this.updateSpawns(dt);
    this.updateEnemies(dt);
    this.updateRocks(dt);
    this.updateWeapons(dt);
    this.updateGems(dt);
    this.updatePickups();
    this.updatePOIs(dt);
    this.updateNaveMae(dt);

    this.bullets.children.iterate((b) => { if (b && b.active) { b.life -= dt; if (b.life <= 0) b.disableBody(true, true); } });
    this.ebullets.children.iterate((b) => {
      if (!b || !b.active) return;
      b.life -= dt;
      if (b.life <= 0) { b.disableBody(true, true); return; }
      if (b.teleguiado) {
        // míssil da Sentinela: vira devagar na direção da nave
        const v = b.body.velocity, spd = Math.hypot(v.x, v.y) || 1;
        const atual = Math.atan2(v.y, v.x), alvo = Math.atan2(this.player.y - b.y, this.player.x - b.x);
        const ang = atual + clamp(Phaser.Math.Angle.Wrap(alvo - atual), -1.6 * dt, 1.6 * dt);
        b.setVelocity(Math.cos(ang) * spd, Math.sin(ang) * spd); b.rotation = ang;
      }
    });

    this.bankTimer += dt;
    if (this.bankTimer > 10) { this.bankTimer = 0; this.bankCredits(); }
    this.aproximarTimer -= dt;
    if (this.aproximarTimer <= 0) { this.aproximarTimer = 0.4; this.aproximarTudo(); }
    // se o jogo ficar lento, reduz os efeitos visuais antes de mexer na jogabilidade (RN-12)
    this.fpsTimer = (this.fpsTimer || 0) - dt;
    if (this.fpsTimer <= 0) { this.fpsTimer = 2; this.efeitosReduzidos = this.game.loop.actualFps < 40; }
    this.minimapTimer -= dt;
    if (this.minimapTimer <= 0) { this.minimapTimer = 0.12; this.drawMinimap(); }
    this.updateHUD();
  }

  bankCredits() {
    const add = Math.floor(this.runCredits) - this.banked;
    if (add > 0) { SAVE.credits += add; this.banked += add; }
    writeSave(SAVE);
  }

  movePlayer() {
    let vx = 0, vy = 0;
    if (this.auto) { const v = this.autoPilot(); vx = v.x; vy = v.y; }
    else if (this.joy.active) { vx = this.joy.dx; vy = this.joy.dy; }
    else {
      const c = this.cursors, k = this.keys;
      if (c.left.isDown || k.A.isDown) vx -= 1;
      if (c.right.isDown || k.D.isDown) vx += 1;
      if (c.up.isDown || k.W.isDown) vy -= 1;
      if (c.down.isDown || k.S.isDown) vy += 1;
    }
    const len = Math.hypot(vx, vy);
    if (len > 1) { vx /= len; vy /= len; }
    this.moveDir = len > 0.1 ? { x: vx / Math.max(len, 1), y: vy / Math.max(len, 1) } : null;
    const vel = this.mods.speed * (this.lentidao || 1);   // a Névoa deixa a nave lenta
    this.player.setVelocity(vx * vel, vy * vel);
    // sem mirar em ninguém há pouco tempo: a frente da nave vira para onde ela está indo
    if (this.moveDir && this.elapsed - (this.ultimaMira || -9) > 0.35) {
      const alvo = Math.atan2(this.moveDir.y, this.moveDir.x) + Math.PI / 2;
      this.player.rotation = Phaser.Math.Angle.RotateTo(this.player.rotation, alvo, 0.18);
    }
  }

  // Piloto automático: foge do perigo, coleta gemas e itens, quebra meteoros
  autoPilot() {
    let fx = 0, fy = 0;
    const px = this.player.x, py = this.player.y;
    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      const R = e.isBoss ? 320 : e.isElite ? 260 : 200;
      const dx = px - e.x, dy = py - e.y, d2 = dx * dx + dy * dy;
      if (d2 < R * R && d2 > 1) { const d = Math.sqrt(d2), w = (R - d) / R * (e.isBoss || e.isElite ? 3 : 1); fx += dx / d * w; fy += dy / d * w; }
    });
    this.ebullets.children.iterate((b) => {
      if (!b || !b.active) return;
      const dx = px - b.x, dy = py - b.y, d2 = dx * dx + dy * dy;
      if (d2 < 150 * 150 && d2 > 1) { const d = Math.sqrt(d2), w = (150 - d) / 150 * 2; fx += dx / d * w; fy += dy / d * w; }
    });
    const bh = this.pois.find((p) => p.type === 'blackhole');
    if (bh) { const dx = px - bh.x, dy = py - bh.y, d = Math.hypot(dx, dy); if (d < 450) { fx += dx / d * 3; fy += dy / d * 3; } }
    const seek = (x, y, w) => { const dx = x - px, dy = y - py, d = Math.hypot(dx, dy) || 1; fx += dx / d * w; fy += dy / d * w; };
    let best = null, bd = 600 * 600;
    this.pickups.children.iterate((p) => { if (!p || !p.active) return; const d2 = (p.x - px) ** 2 + (p.y - py) ** 2; if (d2 < bd) { bd = d2; best = p; } });
    if (best) seek(best.x, best.y, 0.9);
    else {
      let g = null, gd = 350 * 350;
      this.gems.children.iterate((o) => { if (!o || !o.active) return; const d2 = (o.x - px) ** 2 + (o.y - py) ** 2; if (d2 < gd) { gd = d2; g = o; } });
      if (g) seek(g.x, g.y, 0.6);
      else {
        let r = null, rd = 500 * 500;
        this.rocks.children.iterate((o) => { if (!o || !o.active) return; const d2 = (o.x - px) ** 2 + (o.y - py) ** 2; if (d2 < rd) { rd = d2; r = o; } });
        if (r && rd > 160 * 160) seek(r.x, r.y, 0.4);
      }
    }
    // explora locais não visitados aos poucos
    const target = this.pois.find((p) => !p.done && p.type !== 'blackhole' && p.type !== 'nest');
    if (target) seek(target.x, target.y, 0.15);
    return { x: fx, y: fy };
  }

  // ---------- NASCIMENTO DE INIMIGOS ----------
  updateSpawns(dt) {
    if (this.ritmoParado) return;
    const t = this.elapsed;
    // inimigos comuns: ondas no começo, fluxo depois (tabela em src/dados/ondas.js)
    const n = passoNascimento(this.estadoOndas, t, dt, this.contarComuns(), ONDAS);
    if (n > 0) {
      // quem nasce: os inimigos da galáxia que já entraram (src/dados/inimigos.js)
      const pesos = pesosNoTempo(INIMIGOS_POR_GALAXIA[this.gi], INIMIGOS, t);
      for (let i = 0; i < n; i++) {
        const id = escolherTipo(pesos, Math.random());
        const grupo = INIMIGOS[id].grupo || 1;
        if (grupo > 1) {
          const p = this.spawnPoint();
          for (let k = 0; k < grupo; k++) this.spawnEnemy(id, p.x + (Math.random() - 0.5) * 70, p.y + (Math.random() - 0.5) * 70);
          i += grupo - 1;
        } else this.spawnEnemy(id);
      }
    }
    if (quantosAte(t, EVENTOS.cercos) > this.ringCount) { this.ringCount++; this.spawnRing(); }
    if (quantosAte(t, EVENTOS.enxames) > this.swarmCount) { this.swarmCount++; this.spawnSwarm(); }
    // subchefes vêm no horário, mesmo com o AUTO ligado
    if (quantosAte(t, EVENTOS.subchefes) > this.eliteCount) {
      this.eliteCount++;
      const p = this.spawnPoint();
      this.spawnElite(p.x, p.y);
    }
    // chefes e nave-mãe esperam o AUTO desligar (RN-47)
    if (this.auto) return;
    EVENTOS.chefes.forEach((c, i) => {
      if (!this.chefesFeitos[i] && t >= c.t) { this.chefesFeitos[i] = true; this.spawnBoss(i); }
    });
    if (!this.naveMae && t >= EVENTOS.naveMae) this.chegarNaveMae();
  }

  // inimigos comuns vivos (sem contar subchefes e chefes)
  contarComuns() {
    let n = 0;
    this.enemies.children.iterate((e) => { if (e && e.active && !e.isBoss && !e.isElite) n++; });
    return n;
  }
  chefeVivo() {
    let c = null;
    this.enemies.children.iterate((e) => { if (!c && e && e.active && e.isBoss) c = e; });
    return c;
  }

  // ponto fora da tela; inimigos chegam de todos os lados (e mais pela frente)
  spawnPoint() {
    const px = this.player.x, py = this.player.y, d = 600 + Math.random() * 120;
    for (let tries = 0; tries < 8; tries++) {
      let ang = Math.random() * Math.PI * 2;
      if (this.moveDir && Math.random() < 0.35) ang = Math.atan2(this.moveDir.y, this.moveDir.x) + (Math.random() - 0.5) * 2;
      const x = px + Math.cos(ang) * d, y = py + Math.sin(ang) * d;
      return { x, y };
    }
    return { x: px + 600, y: py };
  }

  // Nomes antigos ('bug', 'diamond', 'saucer') viram os 3 primeiros inimigos da galáxia
  resolverTipo(tipo) {
    if (INIMIGOS[tipo]) return tipo;
    const lista = INIMIGOS_POR_GALAXIA[this.gi];
    return lista[{ bug: 0, diamond: 1, saucer: 2 }[tipo] || 0];
  }
  spawnEnemy(typeKey, x, y) {
    if (this.enemies.countActive(true) >= MAX_ENEMIES) return null;
    const id = this.resolverTipo(typeKey);
    const t = INIMIGOS[id];
    if (x === undefined) { const p = this.spawnPoint(); x = p.x; y = p.y; }
    const key = 'ini_' + id;
    const e = this.enemies.get(x, y, key);
    if (!e) return null;
    e.setTexture(key).setScale(1).setRotation(0).setAlpha(1);
    e.enableBody(true, x, y, true, true);
    e.setDepth(5).clearTint();
    e.body.setCircle(t.radius, e.width / 2 - t.radius, e.height / 2 - t.radius);
    const vidaMinuto = linhaDoMinuto(ONDAS, this.elapsed).vida;
    e.hp = e.maxHp = t.hp * this.gal.hpMult * vidaMinuto;
    e.speedV = t.speed * this.gal.speedMult * (0.9 + Math.random() * 0.2);
    e.damage = t.damage * Math.sqrt(this.gal.hpMult);
    e.reward = t.reward; e.xpVal = t.xp; e.hitR = t.radius;
    e.isBoss = false; e.isElite = false; e.straight = null;
    e.flash = 0; e.orbHit = 0; e.kbT = 0; e.kbx = 0; e.kby = 0;
    e.flank = (Math.random() - 0.5) * 1.8;   // cada um chega por um ângulo diferente
    // comportamento próprio (src/comportamentos.js)
    e.idInimigo = id; e.comp = t.comp; e.velBase = e.speedV;
    e.est = { lado: Math.random() < 0.5 ? -1 : 1, semente: Math.random() * 10 };
    e.intangivel = false; e.parado = false; e.roubadas = 0; e.semRecompensa = false; e.ultimoDano = 0; e.atordoado = 0; e.atordoamentos = 0;
    return e;
  }

  spawnRing() {
    const n = 18, cx = this.player.x, cy = this.player.y;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      this.spawnEnemy('bug', cx + Math.cos(a) * 480, cy + Math.sin(a) * 480);
    }
    this.banner('CERCO!', '#fca5a5');
  }

  // enxame que atravessa a tela em linha reta (como os morcegos do VS)
  spawnSwarm() {
    const ang = Math.random() * Math.PI * 2;
    const dirx = Math.cos(ang), diry = Math.sin(ang);
    const sx = this.player.x - dirx * 650, sy = this.player.y - diry * 650;
    for (let i = 0; i < 20; i++) {
      const off = (i - 10) * 28;
      const e = this.spawnEnemy('diamond', sx - diry * off + (Math.random() - 0.5) * 60, sy + dirx * off + (Math.random() - 0.5) * 60);
      if (e) { e.straight = { x: dirx * 240, y: diry * 240 }; e.life = 7; }
    }
    this.banner('ENXAME!', '#fde047');
  }

  spawnElite(x, y) {
    // subchefe: versão gigante de um dos inimigos que já apareceram (menos o enxame)
    const opcoes = Object.keys(pesosNoTempo(INIMIGOS_POR_GALAXIA[this.gi], INIMIGOS, this.elapsed))
      .filter((id) => INIMIGOS[id].comp !== 'enxame' && INIMIGOS[id].comp !== 'sentinela');
    const tk = opcoes.length ? opcoes[this.eliteCount % opcoes.length] : this.resolverTipo('bug');
    const e = this.spawnEnemy(tk, x, y) || this.forceSpawn(tk, x, y);
    if (!e) return;
    e.isElite = true;
    e.setScale(2.2);
    e.setTint(0xffd27f);
    e.hp = e.maxHp = e.maxHp * 28;
    e.speedV *= 0.85;
    e.damage *= 2;
    e.reward = 40; e.xpVal = 10; e.hitR = INIMIGOS[tk].radius * 2.2;
    this.banner('SUBCHEFE À VISTA!', '#fb923c');
  }
  forceSpawn(tk, x, y) {
    let victim = null;
    this.enemies.children.iterate((e) => { if (!victim && e && e.active && !e.isElite && !e.isBoss) victim = e; });
    if (victim) victim.disableBody(true, true);
    return this.spawnEnemy(tk, x, y);
  }

  // Chefe da galáxia número i (força em src/dados/eventos.js)
  spawnBoss(i) {
    const c = EVENTOS.chefes[i || 0];
    const p = this.spawnPoint();
    const key = 'boss_' + this.gi;
    let e = this.enemies.get(p.x, p.y, key);
    if (!e) { this.forceSpawn('bug', p.x, p.y); e = this.enemies.get(p.x, p.y, key); }
    if (!e) return;
    e.setTexture(key).setScale(c.tamanho);
    e.enableBody(true, p.x, p.y, true, true);
    e.setDepth(6).clearTint();
    e.body.setCircle(50, e.width / 2 - 50, e.height / 2 - 50);
    e.hp = e.maxHp = 1600 * this.gal.hpMult * c.vida;
    e.speedV = 60 * this.gal.speedMult;
    e.damage = 30 * Math.sqrt(this.gal.hpMult) * c.dano;
    e.danoTiro = c.dano;
    e.reward = 0; e.xpVal = 20; e.hitR = 50 * c.tamanho;
    e.isBoss = true; e.isElite = false; e.straight = null; e.chefe = i || 0;
    e.flash = 0; e.orbHit = 0; e.kbT = 0; e.flank = 0; e.shootT = 2; e.burst = 0;
    this.boss = e;
    this.bossBar.setFillStyle(hexToInt(this.gal.alien.b));
    this.banner('ALERTA: CHEFE DA GALÁXIA ' + ((i || 0) + 1) + '/' + EVENTOS.chefes.length + '!', '#f87171');
  }

  // Nave-mãe aos 30:00: registra a vitória e vem destruir o jogador (RN-01, RN-02)
  chegarNaveMae() {
    this.vitoriaRegistrada = true;
    this.primeiraVitoria = !SAVE.cleared[this.gi];
    SAVE.cleared[this.gi] = true;
    const bonus = 500 * this.gal.rewardMult;
    this.bonus += bonus; this.runCredits += bonus;
    writeSave(SAVE);
    const p = this.spawnPoint();
    const m = this.physics.add.sprite(p.x, p.y, 'boss_' + this.gi).setScale(3.2).setDepth(9).setTint(0x7f1d1d);
    m.body.setCircle(50, m.width / 2 - 50, m.height / 2 - 50);
    m.tiroT = 1.2;
    this.naveMae = m;
    this.physics.add.overlap(this.player, m, () => { this.invuln = 0; this.hurt(99999); });
    this.cameras.main.flash(500, 255, 255, 255);
    this.cameras.main.shake(600, 0.01);
    this.banner('A NAVE-MÃE CHEGOU! GALÁXIA CONQUISTADA!', '#86efac');
    this.time.delayedCall(EVENTOS.naveMaeDuracao * 1000, () => this.endRun('victory', this.primeiraVitoria));
  }
  updateNaveMae(dt) {
    const m = this.naveMae;
    if (!m || !m.active) return;
    const a = Phaser.Math.Angle.Between(m.x, m.y, this.player.x, this.player.y);
    const v = Math.max(300, this.mods.speed * 1.3);
    m.setVelocity(Math.cos(a) * v, Math.sin(a) * v);
    m.rotation += dt * 0.4;
    m.tiroT -= dt;
    if (m.tiroT <= 0) {
      m.tiroT = 0.8;
      for (let i = 0; i < 24; i++) {
        const b = this.enemyShot(m.x, m.y, i / 24 * Math.PI * 2 + Math.random() * 0.2, 320);
        if (b) b.dmg *= 6;
      }
    }
  }

  // ---------- MOVIMENTO DOS INIMIGOS (com separação: nada de fila indiana) ----------
  updateEnemies(dt) {
    const px = this.player.x, py = this.player.y;
    this.gfxInimigos.clear();   // linhas de mira, auras, escudos: redesenhados a cada quadro
    this.lentidao = 1;          // a Névoa diminui isso
    const CELL = 48, grid = new Map();
    const list = [];
    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      this.aproximarObj(e);
      list.push(e);
      const key = Math.floor(e.x / CELL) * 100003 + Math.floor(e.y / CELL);
      let arr = grid.get(key);
      if (!arr) { arr = []; grid.set(key, arr); }
      arr.push(e);
    });
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.flash > 0) { e.flash -= dt; if (e.flash <= 0) { e.clearTint(); if (e.isElite) e.setTint(0xffd27f); } }
      if (e.straight) {
        e.life -= dt;
        if (e.life <= 0) { e.disableBody(true, true); continue; }
        e.setVelocity(e.straight.x, e.straight.y);
        continue;
      }
      if (e.kbT > 0) { e.kbT -= dt; e.setVelocity(e.kbx, e.kby); continue; }
      if (e.atordoado > 0) { e.atordoado -= dt; e.setVelocity(0, 0); continue; }   // Martelo Gravitacional
      const dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy) || 1;
      if (!e.isBoss && !e.isElite && d > 1400) {
        const p = this.spawnPoint(); e.setPosition(p.x, p.y); continue;   // reposiciona em vez de sumir
      }
      // comportamento próprio do inimigo (src/comportamentos.js); null = perseguir
      const comportamento = !e.isBoss && COMPORTAMENTOS[e.comp];
      const quer = comportamento ? comportamento(this, e, dt, { dx, dy, d }) : null;
      if (!e.active) continue;              // pode ter explodido
      if (e.parado) { e.setVelocity(0, 0); continue; }
      let vx, vy;
      if (quer) { vx = quer.vx; vy = quer.vy; }
      else {
        // direção com "flanco": de longe chegam em arco, de perto vão direto
        const f = e.flank * clamp((d - 140) / 420, 0, 1);
        const base = Math.atan2(dy, dx) + f;
        vx = Math.cos(base) * e.speedV; vy = Math.sin(base) * e.speedV;
      }
      // separação entre vizinhos
      if (!e.isBoss) {
        let sx = 0, sy = 0;
        const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const arr = grid.get((cx + ox) * 100003 + (cy + oy));
            if (!arr) continue;
            for (let j = 0; j < arr.length; j++) {
              const o = arr[j];
              if (o === e) continue;
              const ddx = e.x - o.x, ddy = e.y - o.y, dd = Math.hypot(ddx, ddy) || 0.01;
              const minD = (e.hitR + o.hitR) * 0.85;
              if (dd < minD) { const push = (minD - dd) / minD; sx += ddx / dd * push; sy += ddy / dd * push; }
            }
          }
        }
        vx += sx * e.speedV * 1.6; vy += sy * e.speedV * 1.6;
      }
      e.setVelocity(vx, vy);
      if (e.isBoss) this.updateBoss(e, dt);
    }
  }

  updateBoss(e, dt) {
    e.rotation += dt * 0.6;
    e.shootT -= dt;
    if (e.shootT <= 0) {
      e.shootT = 2.0;
      e.burst++;
      const n = 18, off = (e.burst % 2) * (Math.PI / n);
      const forte = (b) => { if (b) b.dmg *= e.danoTiro || 1; };
      for (let i = 0; i < n; i++) forte(this.enemyShot(e.x, e.y, i / n * Math.PI * 2 + off, 190));
      if (e.burst % 3 === 0) {
        const base = Phaser.Math.Angle.Between(e.x, e.y, this.player.x, this.player.y);
        [-0.2, 0, 0.2].forEach((o) => forte(this.enemyShot(e.x, e.y, base + o, 280)));
      }
      if (e.burst % 4 === 0) for (let i = 0; i < 6; i++) this.spawnEnemy('diamond', e.x + (Math.random() - 0.5) * 80, e.y + (Math.random() - 0.5) * 80);
    }
  }

  enemyShot(x, y, a, spd) {
    const b = this.ebullets.get(x, y, 'ebullet');
    if (!b) return;
    b.enableBody(true, x, y, true, true);
    b.setTexture('ebullet').clearTint().setDepth(7);
    b.teleguiado = false;
    b.body.setCircle(5, 1, 1);
    b.setVelocity(Math.cos(a) * spd, Math.sin(a) * spd);
    b.life = 4; b.dmg = 12 * Math.sqrt(this.gal.hpMult);
    return b;
  }

  // Tiro de inimigo comum (mult = força do tiro; subchefe bate mais forte)
  tiroInimigo(e, ang, vel, mult) {
    const b = this.enemyShot(e.x, e.y, ang, vel);
    if (b) b.dmg *= (mult || 1) * (e.isElite ? 1.6 : 1);
    return b;
  }
  // Mina parada que dura 8 s e explode ao encostar na nave
  criarMina(x, y, mult) {
    const b = this.ebullets.get(x, y, 'mina');
    if (!b) return null;
    b.enableBody(true, x, y, true, true);
    b.setTexture('mina').clearTint().setDepth(3);
    b.teleguiado = false;
    b.body.setCircle(9, 2, 2);
    b.setVelocity(0, 0);
    b.life = 8; b.dmg = 12 * Math.sqrt(this.gal.hpMult) * (mult || 1);
    return b;
  }
  // Explosão de inimigo (kamikaze, bomba-relógio): fere a nave se estiver no raio
  explosaoInimiga(x, y, raio, dano) {
    this.boom(x, y, 18, 0xf97316);
    this.gfxInimigos.fillStyle(0xf97316, 0.35).fillCircle(x, y, raio);
    if (Math.hypot(this.player.x - x, this.player.y - y) < raio + 14 && this.invuln <= 0) this.hurt(dano);
  }
  // Distância da nave até um raio reto que sai de (x, y) no ângulo dado
  distanciaAoRaio(x, y, ang, comp) {
    const ux = Math.cos(ang), uy = Math.sin(ang);
    const px = this.player.x - x, py = this.player.y - y;
    const t = clamp(px * ux + py * uy, 0, comp);
    return Math.hypot(px - ux * t, py - uy * t);
  }

  updateRocks(dt) {
    this.rocks.children.iterate((r) => {
      if (r && r.active && r.flash > 0) { r.flash -= dt; if (r.flash <= 0) r.clearTint(); }
    });
  }

  // ---------- ALVOS ----------
  nearestEnemy(range, x, y) {
    x = x === undefined ? this.player.x : x; y = y === undefined ? this.player.y : y;
    let best = null, bd = range * range;
    this.enemies.children.iterate((e) => {
      if (!e || !e.active || e.intangivel) return;
      const d2 = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
      if (d2 < bd) { bd = d2; best = e; }
    });
    return best;
  }
  // Meteoro mais perto de (x, y) dentro do alcance
  nearestRock(range, x, y) {
    let best = null, bd = range * range;
    this.rocks.children.iterate((r) => {
      if (!r || !r.active) return;
      const d2 = (r.x - x) * (r.x - x) + (r.y - y) * (r.y - y);
      if (d2 < bd) { bd = d2; best = r; }
    });
    return best;
  }
  // Alvo para as armas: o inimigo mais perto, mas um meteoro colado na nave (até METEORO_PERTO)
  // conta como inimigo. Meteoros mais longe só quando não há inimigo no alcance (RN-46).
  nearestTarget(range, x, y) {
    x = x === undefined ? this.player.x : x; y = y === undefined ? this.player.y : y;
    const e = this.nearestEnemy(range, x, y);
    const colado = this.nearestRock(METEORO_PERTO, this.player.x, this.player.y);
    if (colado) {
      if (!e) return colado;
      const dr = Math.hypot(colado.x - x, colado.y - y), de = Math.hypot(e.x - x, e.y - y);
      return dr <= de ? colado : e;
    }
    if (e) return e;
    return this.nearestRock(Math.min(range, 340), this.player.x, this.player.y);
  }
  forEachTarget(cb) {
    this.enemies.children.iterate((e) => { if (e && e.active && !e.intangivel) cb(e); });
    this.rocks.children.iterate((r) => { if (r && r.active) cb(r); });
  }

  damageTarget(t, dmg) {
    if (!t.active || t.intangivel) return;
    t.ultimoDano = this.elapsed;
    t.hp -= dmg;
    if (t.setTintFill) t.setTintFill(0xffffff); else t.setTint(0xffffff);
    t.flash = 0.06;
    if (t.hp <= 0) { if (t.isRock) this.breakRock(t); else this.killEnemy(t); }
  }

  knock(t, fromX, fromY, force) {
    if (t.isRock || t.isBoss) return;
    const dx = t.x - fromX, dy = t.y - fromY, d = Math.hypot(dx, dy) || 1;
    const k = t.isElite ? force * 0.3 : force;
    t.kbx = dx / d * k; t.kby = dy / d * k; t.kbT = 0.15;
  }

  killEnemy(e) {
    if (!e.active) return;
    const mult = this.gal.rewardMult * (this.auto ? AUTO_REWARD_MULT : 1) * this.creditMult;
    if (!e.semRecompensa) {
      // explodiu sozinho (kamikaze, bomba-relógio) não dá recompensa nem efeito de morte
      this.runCredits += e.reward * mult;
      this.kills++;
      this.dropGem(e.x, e.y, e.xpVal);
      if (AO_MORRER[e.comp]) AO_MORRER[e.comp](this, e);
    }
    e.intangivel = false;
    this.boom(e.x, e.y, e.isBoss ? 40 : e.isElite ? 24 : 6, e.isBoss || e.isElite ? 0xfde047 : hexToInt(this.gal.alien.b));
    const wasBoss = e.isBoss, wasElite = e.isElite;
    e.isElite = false;
    e.disableBody(true, true);
    if (wasElite) this.dropPickup(e.x, e.y, 'chest');
    if (wasBoss) this.onBossDefeated(e);
  }

  breakRock(r) {
    this.boom(r.x, r.y, 10, r.crystal ? 0x22d3ee : 0xa8a29e);
    r.disableBody(true, true);
    if (r.crystal) {
      const hidden = Object.keys(WEAPONS).filter((k) => WEAPONS[k].hidden && !this.hasWeapon(k));
      if (hidden.length) this.dropPickup(r.x, r.y, 'weapon', Phaser.Utils.Array.GetRandom(hidden));
      else this.dropPickup(r.x, r.y, 'chest');
      return;
    }
    const roll = Math.random();
    if (roll < 0.3) this.dropPickup(r.x, r.y, 'heal');
    else if (roll < 0.52) this.dropPickup(r.x, r.y, 'coin');
    else if (roll < 0.6) this.dropPickup(r.x, r.y, 'magnet');
    else if (roll < 0.65) this.dropPickup(r.x, r.y, 'bomb');
    else if (roll < 0.85) this.dropGem(r.x, r.y, 5);
  }

  boom(x, y, n, color) {
    if (this.efeitosReduzidos) n = Math.ceil(n / 3);   // jogo lento: menos faíscas, jogabilidade igual
    for (let i = 0; i < n; i++) {
      if (this.sparkCount > 160) return;
      this.sparkCount++;
      const s = this.add.image(x, y, 'spark').setTint(color).setDepth(9);
      const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * (n > 10 ? 120 : 30);
      this.tweens.add({
        targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.3,
        duration: 300 + Math.random() * 300, onComplete: () => { s.destroy(); this.sparkCount--; }
      });
    }
  }

  // ---------- ARMAS ----------
  updateWeapons(dt) {
    let orbitalStats = null;
    this.weapons.forEach((w) => {
      const s = this.wstats(w);
      if (w.id === 'orbital') { orbitalStats = s; return; }
      w.timer -= dt;
      if (w.timer > 0) return;
      let fired = false;
      if (w.id === 'rajada') fired = this.fireRajada(s);
      else if (w.id === 'martelo') fired = this.fireMartelo(s);
      else if (w.id === 'agulhas') fired = this.fireAgulhas(s);
      else if (w.id === 'pulsar') fired = this.firePulsar(s);
      else if (w.id === 'missiles') fired = this.fireMissiles(s);
      else if (w.id === 'shock') fired = this.fireShock(s);
      else if (w.id === 'chain') fired = this.fireChain(s);
      else if (w.id === 'disc') fired = this.fireDiscs(s);
      w.timer = fired ? s.cd : 0.1;
    });
    this.updateOrbitals(dt, orbitalStats);
    this.updateMissiles(dt);
    this.updateDiscs(dt);
  }

  shoot(x, y, a, dmg, pierce) {
    const b = this.bullets.get(x, y, 'bullet');
    if (!b) return;
    b.enableBody(true, x, y, true, true);
    b.setDepth(8).clearTint().setScale(1);
    b.body.setCircle(5);
    b.setVelocity(Math.cos(a) * 620, Math.sin(a) * 620);
    b.life = 1.1; b.pierceLeft = pierce; b.hitSet = new Set(); b.dmg = dmg; b.ricochete = 0;
    return b;
  }

  // ---------- PODERES EXCLUSIVOS ----------
  // Falcão: leque de tiros; cada tiro pula para outro inimigo ao acertar (ricochete)
  fireRajada(s) {
    const t = this.nearestTarget(560);
    if (!t) return false;
    const px = this.player.x, py = this.player.y;
    const base = Phaser.Math.Angle.Between(px, py, t.x, t.y);
    for (let i = 0; i < s.amount; i++) {
      const b = this.shoot(px, py, base + (i - (s.amount - 1) / 2) * 0.2, s.dmg, 0);
      if (b) { b.ricochete = s.ricochete; b.setTint(0x93c5fd); }
    }
    this.player.rotation = base + Math.PI / 2;
    this.ultimaMira = this.elapsed;
    return true;
  }
  // Titã: onda que esmaga e atordoa; evoluída, puxa os inimigos antes
  fireMartelo(s) {
    const px = this.player.x, py = this.player.y, r = s.radius;
    const near = this.nearestTarget(r * 1.1);
    if (!near || Math.hypot(near.x - px, near.y - py) > r * 1.1 + (near.hitR || 14)) return false;
    const anel = this.add.circle(px, py, 12, 0xf59e0b, 0.25).setStrokeStyle(6, 0xfbbf24, 0.9).setDepth(9);
    this.tweens.add({ targets: anel, radius: r, alpha: 0, duration: 260, onComplete: () => anel.destroy() });
    this.cameras.main.shake(90, 0.004);
    this.forEachTarget((t) => {
      const d = Math.hypot(t.x - px, t.y - py);
      if (s.puxa && !t.isRock && d < r * 1.6) this.knock(t, px, py, -320);
      if (d < r + (t.hitR || 14)) {
        this.damageTarget(t, s.dmg);
        if (!t.isRock && !t.isBoss) { t.atordoado = s.atordoa; t.atordoamentos = (t.atordoamentos || 0) + 1; }
      }
    });
    return true;
  }
  // Agulha: um dardo muito rápido para cada inimigo perto
  fireAgulhas(s) {
    const px = this.player.x, py = this.player.y;
    const alvos = [];
    const perto = this.nearestTarget(600);
    if (!perto) return false;
    alvos.push(perto);
    this.enemies.children.iterate((e) => {
      if (e && e.active && !e.intangivel && e !== perto && Math.hypot(e.x - px, e.y - py) < 600) alvos.push(e);
    });
    alvos.sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py));
    for (let i = 0; i < s.amount; i++) {
      const t = alvos[i % alvos.length];
      const a = Math.atan2(t.y - py, t.x - px) + (i >= alvos.length ? (Math.random() - 0.5) * 0.3 : 0);
      const b = this.shoot(px, py, a, s.dmg, s.pierce);
      if (b) { b.setVelocity(Math.cos(a) * 950, Math.sin(a) * 950); b.setTint(0xf0abfc).setScale(0.8); b.life = 0.8; }
    }
    return true;
  }

  firePulsar(s) {
    const t = this.nearestTarget(520);
    if (!t) return false;
    const px = this.player.x, py = this.player.y;
    const base = Phaser.Math.Angle.Between(px, py, t.x, t.y);
    for (let i = 0; i < s.amount; i++) this.shoot(px, py, base + (i - (s.amount - 1) / 2) * 0.14, s.dmg, s.pierce);
    if (s.ring) { this.ringCounter = (this.ringCounter || 0) + 1; if (this.ringCounter % 2 === 0) for (let i = 0; i < 10; i++) this.shoot(px, py, i / 10 * Math.PI * 2, s.dmg * 0.7, s.pierce); }
    this.player.rotation = base + Math.PI / 2;
    this.ultimaMira = this.elapsed;
    return true;
  }

  fireMissiles(s) {
    if (!this.nearestTarget(700)) return false;
    for (let i = 0; i < s.amount; i++) {
      const a = Math.random() * Math.PI * 2;
      const m = this.add.image(this.player.x, this.player.y, 'missile').setDepth(8).setScale(s.radius > 80 ? 1.5 : 1.2);
      m.ang = a; m.speed = 260; m.life = 3; m.dmg = s.dmg; m.radius = s.radius; m.target = null;
      this.missiles.push(m);
    }
    return true;
  }
  updateMissiles(dt) {
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life -= dt;
      if (!m.target || !m.target.active) m.target = this.nearestTarget(800, m.x, m.y);
      if (m.target) {
        const want = Math.atan2(m.target.y - m.y, m.target.x - m.x);
        let diff = Phaser.Math.Angle.Wrap(want - m.ang);
        // perto do alvo a curva fica mais fechada; senão o míssil fica girando em volta e erra
        const perto = clamp(1 - Math.hypot(m.target.x - m.x, m.target.y - m.y) / 250, 0, 1);
        const giro = 6 + 18 * perto;
        m.ang += clamp(diff, -giro * dt, giro * dt);
      }
      m.speed = Math.min(480, m.speed + 500 * dt);
      m.x += Math.cos(m.ang) * m.speed * dt; m.y += Math.sin(m.ang) * m.speed * dt;
      m.rotation = m.ang + Math.PI / 2;
      const hit = m.target && Math.hypot(m.target.x - m.x, m.target.y - m.y) < (m.target.hitR || 14) + 6;
      if (hit || m.life <= 0) {
        this.explode(m.x, m.y, m.radius, m.dmg);
        m.destroy();
        this.missiles.splice(i, 1);
      }
    }
  }
  explode(x, y, radius, dmg) {
    const c = this.add.circle(x, y, radius, 0xf97316, 0.35).setDepth(9).setStrokeStyle(2, 0xfde047, 0.8);
    this.tweens.add({ targets: c, alpha: 0, scale: 1.2, duration: 250, onComplete: () => c.destroy() });
    const r2 = radius * radius;
    this.forEachTarget((t) => {
      const d2 = (t.x - x) * (t.x - x) + (t.y - y) * (t.y - y);
      if (d2 < r2 + (t.hitR || 14) * (t.hitR || 14)) this.damageTarget(t, dmg);
    });
  }

  fireShock(s) {
    const px = this.player.x, py = this.player.y;
    const near = this.nearestTarget(s.radius * 1.2);
    if (!near || Math.hypot(near.x - px, near.y - py) > s.radius * 1.2 + (near.hitR || 14)) return false;
    const ring = this.add.circle(px, py, 10, 0xa78bfa, 0.18).setStrokeStyle(3, 0xc4b5fd, 0.9).setDepth(9);
    this.tweens.add({ targets: ring, radius: s.radius, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
    let healed = 0;
    const r = s.radius;
    this.forEachTarget((t) => {
      const d = Math.hypot(t.x - px, t.y - py);
      if (d < r + (t.hitR || 14)) {
        this.damageTarget(t, s.dmg);
        this.knock(t, px, py, 380);
        if (s.heal && !t.isRock && healed < 10) { healed++; this.hp = Math.min(this.mods.maxHp, this.hp + 0.8); }
      }
    });
    return true;
  }

  fireChain(s) {
    const px = this.player.x, py = this.player.y;
    const pool = [];
    this.enemies.children.iterate((e) => { if (e && e.active && !e.intangivel && Math.hypot(e.x - px, e.y - py) < 560) pool.push(e); });
    this.rocks.children.iterate((r) => { if (r && r.active && Math.hypot(r.x - px, r.y - py) < METEORO_PERTO) pool.push(r); });
    if (!pool.length) return false;
    const g = this.add.graphics().setDepth(12);
    g.lineStyle(3, 0x67e8f9, 1);
    const hit = new Set();
    for (let k = 0; k < s.amount; k++) {
      let cur = Phaser.Utils.Array.GetRandom(pool.filter((e) => !hit.has(e))) || pool[0];
      let fromX = px, fromY = py;
      for (let j = 0; j <= s.jumps && cur; j++) {
        this.zigzag(g, fromX, fromY, cur.x, cur.y);
        hit.add(cur);
        fromX = cur.x; fromY = cur.y;
        const target = cur;
        let next = null, nd = 190 * 190;
        pool.forEach((o) => { if (!hit.has(o) && o.active) { const d2 = (o.x - fromX) ** 2 + (o.y - fromY) ** 2; if (d2 < nd) { nd = d2; next = o; } } });
        this.damageTarget(target, s.dmg);
        cur = next;
      }
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
    return true;
  }
  zigzag(g, x1, y1, x2, y2) {
    const steps = 5;
    g.beginPath(); g.moveTo(x1, y1);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      g.lineTo(x1 + (x2 - x1) * t + (Math.random() - 0.5) * 18, y1 + (y2 - y1) * t + (Math.random() - 0.5) * 18);
    }
    g.lineTo(x2, y2); g.strokePath();
  }

  fireDiscs(s) {
    const t = this.nearestTarget(600);
    const base = t ? Math.atan2(t.y - this.player.y, t.x - this.player.x) : Math.random() * Math.PI * 2;
    for (let i = 0; i < s.amount; i++) {
      const a = base + (i - (s.amount - 1) / 2) * (Math.PI * 2 / Math.max(3, s.amount + 1));
      const d = this.add.image(this.player.x, this.player.y, 'disc').setDepth(8).setScale(s.size);
      d.dirx = Math.cos(a); d.diry = Math.sin(a); d.out = 0; d.back = false;
      d.dmg = s.dmg; d.range = s.range; d.r = 12 * s.size; d.hits = new Map(); d.pull = s.pull;
      this.discs.push(d);
    }
    return true;
  }
  updateDiscs(dt) {
    for (let i = this.discs.length - 1; i >= 0; i--) {
      const d = this.discs[i];
      d.rotation += dt * 14;
      if (!d.back) {
        const step = 460 * dt;
        d.x += d.dirx * step; d.y += d.diry * step; d.out += step;
        if (d.out >= d.range) d.back = true;
      } else {
        const dx = this.player.x - d.x, dy = this.player.y - d.y, dist = Math.hypot(dx, dy) || 1;
        if (dist < 24) { d.destroy(); this.discs.splice(i, 1); continue; }
        const step = Math.min(dist, 560 * dt);
        d.x += dx / dist * step; d.y += dy / dist * step;
      }
      if (d.pull) {
        this.gems.children.iterate((g) => { if (g && g.active && Math.hypot(g.x - d.x, g.y - d.y) < 90) g.magnetized = true; });
      }
      this.forEachTarget((t) => {
        const rr = d.r + (t.hitR || 14);
        if ((t.x - d.x) ** 2 + (t.y - d.y) ** 2 > rr * rr) return;
        const last = d.hits.get(t) || -1;
        if (this.elapsed - last < 0.3) return;
        d.hits.set(t, this.elapsed);
        this.damageTarget(t, d.dmg);
      });
    }
  }

  updateOrbitals(dt, s) {
    const want = s ? s.amount : 0;
    while (this.orbs.length < want) this.orbs.push(this.add.image(0, 0, 'orb').setDepth(11));
    while (this.orbs.length > want) this.orbs.pop().destroy();
    if (!want) return;
    this.orbAngle += dt * s.spin;
    const R = s.radius, n = this.orbs.length;
    this.orbs.forEach((o, i) => {
      const a = this.orbAngle + i / n * Math.PI * 2;
      o.setPosition(this.player.x + Math.cos(a) * R, this.player.y + Math.sin(a) * R).setScale(s.size);
    });
    const hitR = 10 * s.size;
    this.forEachTarget((t) => {
      if (this.elapsed - (t.orbHit || 0) < 0.35) return;
      const r = hitR + (t.hitR || 14);
      if (Math.abs(Math.hypot(t.x - this.player.x, t.y - this.player.y) - R) > r) return;
      for (let i = 0; i < n; i++) {
        const o = this.orbs[i];
        if ((o.x - t.x) ** 2 + (o.y - t.y) ** 2 < r * r) {
          t.orbHit = this.elapsed;
          this.damageTarget(t, s.dmg);
          if (s.knock) this.knock(t, this.player.x, this.player.y, 300);
          break;
        }
      }
    });
  }

  onBulletHit(b, e) {
    if (!b.active || !e.active || b.hitSet.has(e) || e.intangivel) return;
    b.hitSet.add(e);
    let dmg = b.dmg;
    // escudo frontal: tiro que chega pela frente quase não fere
    if (e.comp === 'escudo' && e.est && e.est.escudoAng !== undefined) {
      const ang = Math.atan2(b.y - e.y, b.x - e.x);
      if (Math.abs(Phaser.Math.Angle.Wrap(ang - e.est.escudoAng)) < 0.9) { dmg *= 0.15; this.boom(b.x, b.y, 2, 0xcbd5e1); }
    }
    this.damageTarget(e, dmg);
    // Rajada Falcão: o tiro pula para o inimigo mais perto que ainda não acertou
    if (b.ricochete > 0) {
      let prox = null, bd = 320 * 320;
      this.enemies.children.iterate((o) => {
        if (!o || !o.active || o.intangivel || b.hitSet.has(o)) return;
        const d2 = (o.x - b.x) ** 2 + (o.y - b.y) ** 2;
        if (d2 < bd) { bd = d2; prox = o; }
      });
      if (prox) {
        b.ricochete--;
        const a = Math.atan2(prox.y - b.y, prox.x - b.x);
        b.setVelocity(Math.cos(a) * 620, Math.sin(a) * 620);
        b.life = Math.max(b.life, 0.6);
        return;
      }
    }
    if (b.pierceLeft > 0) b.pierceLeft--;
    else b.disableBody(true, true);
  }

  // ---------- GEMAS E ITENS NO CHÃO ----------
  dropGem(x, y, val) {
    const g = this.gems.get(x, y, 'gem');
    if (!g) return;
    g.setActive(true).setVisible(true).setPosition(x, y).setDepth(4);
    g.val = val; g.magnetized = false;
    g.setScale(val >= 5 ? 2 : val > 1 ? 1.6 : 1);
  }
  updateGems(dt) {
    const px = this.player.x, py = this.player.y, mag = this.mods.magnet;
    this.gems.children.iterate((g) => {
      if (!g || !g.active) return;
      this.aproximarObj(g);
      const dx = px - g.x, dy = py - g.y, d = Math.hypot(dx, dy);
      if (d < 22) { g.setActive(false).setVisible(false); this.gainXp(g.val); return; }
      if (d > 1600 && !g.magnetized) { g.setActive(false).setVisible(false); return; }
      if (d < mag || g.magnetized) {
        g.magnetized = true;
        const step = Math.min(d, 520 * dt);
        g.x += dx / d * step; g.y += dy / d * step;
      }
    });
  }

  dropPickup(x, y, ptype, extra) {
    const keys = { heal: 'heal', coin: 'coin', magnet: 'magnetItem', bomb: 'bomb', chest: 'chest', weapon: 'wbox' };
    const p = this.add.image(x, y, keys[ptype]).setDepth(6);
    p.ptype = ptype; p.extra = extra;
    this.pickups.add(p);
    p.baseY = y; p.bob = Math.random() * 6;
    if (ptype === 'weapon') {
      p.label = this.add.text(x, y - 34, WEAPONS[extra].name + '!', { fontFamily: 'Arial', fontSize: '13px', color: '#f5d0fe', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(7);
    }
    return p;
  }
  updatePickups() {
    const px = this.player.x, py = this.player.y;
    const got = [];
    this.pickups.children.iterate((p) => {
      if (!p || !p.active) return;
      p.y = p.baseY - 3 - 3 * Math.sin(this.elapsed * 6.3 + p.bob); // balança de leve
      if (Math.hypot(p.x - px, p.y - py) < 30) got.push(p);
    });
    got.forEach((p) => {
      const t = p.ptype, extra = p.extra;
      if (p.label) p.label.destroy();
      this.tweens.killTweensOf(p);
      p.destroy();
      if (t === 'heal') { this.hp = Math.min(this.mods.maxHp, this.hp + this.mods.maxHp * 0.3); this.floatText(px, py, '+VIDA', '#f87171'); }
      else if (t === 'coin') { const v = 15 * this.gal.rewardMult * this.creditMult; this.runCredits += v; this.floatText(px, py, '+' + fmt(v) + ' créditos', '#facc15'); }
      else if (t === 'magnet') { this.gems.children.iterate((g) => { if (g && g.active) g.magnetized = true; }); this.floatText(px, py, 'ÍMÃ TOTAL!', '#22d3ee'); }
      else if (t === 'bomb') this.detonate();
      else if (t === 'chest') { this.pendingChests++; this.openNextModal(); }
      else if (t === 'weapon') this.gainHiddenWeapon(extra);
    });
  }
  floatText(x, y, text, color) {
    const t = this.add.text(x, y - 30, text, { fontFamily: 'Arial', fontSize: '15px', color, stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }
  detonate() {
    this.cameras.main.flash(250, 255, 200, 120);
    const px = this.player.x, py = this.player.y;
    const list = [];
    this.enemies.children.iterate((e) => { if (e && e.active && Math.hypot(e.x - px, e.y - py) < 650) list.push(e); });
    list.forEach((e) => this.damageTarget(e, e.isBoss || e.isElite ? e.maxHp * 0.25 : e.hp + 1));
    this.floatText(px, py, 'BOMBA!', '#fb923c');
  }

  gainHiddenWeapon(id) {
    const res = this.addWeapon(id);
    if (res === 'new') this.banner('ARMA ESCONDIDA ENCONTRADA!\n' + WEAPONS[id].name, '#f0abfc');
    else if (res === 'up') this.banner(WEAPONS[id].name + ' melhorou!', '#f0abfc');
    else { this.banner('Sem espaço para armas: virou um baú!', '#fde047'); this.pendingChests++; this.openNextModal(); }
  }

  // ---------- LOCAIS ÚNICOS ----------
  updatePOIs(dt) {
    const px = this.player.x, py = this.player.y;
    this.scanBar.clear();
    this.pois.forEach((p) => {
      const d = Math.hypot(p.x - px, p.y - py);
      if (!p.discovered && d < 520) {
        p.discovered = true;
        this.banner('DESCOBERTO: ' + p.name, '#a5f3fc');
        if (p.type === 'nest') this.triggerNest(p);
        if (p.type === 'beacon') this.acenderFarol(p);
      }
      // planetas e destroços: fique perto por 1,5 s para escanear
      if ((p.type === 'planet' || p.type === 'derelict') && !p.done) {
        const raio = p.type === 'planet' ? 175 * (p.escala || 1) : 100, barY = p.y + (p.type === 'planet' ? 160 : 50) * (p.escala || 1);
        if (d < raio) {
          p.scan += dt;
          this.scanBar.fillStyle(0x000000, 0.7).fillRect(p.x - 50, barY, 100, 10);
          this.scanBar.fillStyle(0x22d3ee, 1).fillRect(p.x - 48, barY + 2, 96 * Math.min(1, p.scan / 1.5), 6);
          if (p.scan >= 1.5) {
            p.done = true; p.label.setText(p.name + ' (explorado)').setColor('#94a3b8');
            if (p.weapon) this.gainHiddenWeapon(p.weapon);
            else this.recompensaDeLocal(p, p.type === 'planet' ? 14 : 8, p.type === 'planet' ? 120 : 70);
          }
        } else if (p.scan > 0) p.scan = Math.max(0, p.scan - dt);
      }
      if (p.type === 'cache' && !p.done && d < 60) {
        p.done = true; p.img.setAlpha(0.35);
        p.label.setText(p.name + ' (vazio)').setColor('#94a3b8');
        ['heal', 'magnet', 'bomb'].forEach((t, i) => {
          const a = -Math.PI / 2 + (i - 1) * 0.9;
          this.dropPickup(p.x + Math.cos(a) * 70, p.y + Math.sin(a) * 70, t);
        });
        this.banner('SUPRIMENTOS!', '#86efac');
      }
      if (p.type === 'station') {
        p.cooldown -= dt;
        p.label.setText(p.cooldown > 0 ? p.name + ' (' + Math.ceil(p.cooldown) + 's)' : p.name + ' — PRONTA');
        if (d < 110 && p.cooldown <= 0 && this.hp < this.mods.maxHp) {
          this.hp = this.mods.maxHp; p.cooldown = 90;
          this.floatText(px, py, 'REPARO COMPLETO!', '#4ade80');
        }
      }
      if (p.type === 'relic' && !p.done && d < 45) {
        p.done = true; p.img.setVisible(false);
        p.label.setText(p.name + ' (coletada)').setColor('#94a3b8');
        this.xpMult *= 1.3; this.creditMult *= 1.3;
        this.banner('RELÍQUIA: ' + p.name + '\n+30% XP e créditos nesta partida', '#facc15');
      }
      if (p.type === 'blackhole') this.updateBlackHole(p, dt, d);
    });
  }
  // Farol: marca no minimapa os 3 locais ainda não descobertos mais próximos
  acenderFarol(p) {
    p.done = true;
    const perto = this.pois.filter((o) => !o.discovered && !o.revelado)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)).slice(0, 3);
    perto.forEach((o) => { o.revelado = true; });
    if (perto.length) this.banner('FAROL: ' + perto.length + ' locais marcados no mapa', '#38bdf8');
  }
  // Planeta sem arma ou destroços: solta gemas em volta e dá créditos
  recompensaDeLocal(p, gemas, creditos) {
    for (let i = 0; i < gemas; i++) {
      const a = i / gemas * Math.PI * 2;
      this.dropGem(p.x + Math.cos(a) * 60, p.y + Math.sin(a) * 60, 3);
    }
    const v = creditos * this.gal.rewardMult * this.creditMult;
    this.runCredits += v;
    this.floatText(this.player.x, this.player.y, '+' + fmt(v) + ' créditos', '#facc15');
  }
  triggerNest(p) {
    p.done = true;
    this.spawnElite(p.x + 60, p.y);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; this.spawnEnemy('bug', p.x + Math.cos(a) * 120, p.y + Math.sin(a) * 120); }
    this.banner('O NINHO DESPERTOU!', '#f87171');
  }
  // Buraco negro: puxa tudo; o centro machuca. Cada inimigo engolido faz ele crescer
  // (puxa de mais longe e o centro fica maior) e não dá XP nem créditos.
  updateBlackHole(p, dt, dPlayer) {
    p.massa = p.massa || 0;
    const fator = Math.min(3, 1 + p.massa * 0.015);
    p.img.rotation += dt * 0.8;
    p.img.setScale((p.escala || 1) * fator);
    const R = 460 * fator, nucleo = 55 * fator;
    if (dPlayer < R) {
      const f = (1 - dPlayer / R) * 170 * (0.8 + fator * 0.2);
      this.player.body.velocity.x += (p.x - this.player.x) / dPlayer * f;
      this.player.body.velocity.y += (p.y - this.player.y) / dPlayer * f;
      if (dPlayer < nucleo) { this.hp -= 30 * fator * dt; if (this.hp <= 0) this.hurt(0); }
    }
    this.enemies.children.iterate((e) => {
      if (!e || !e.active || e.isBoss) return;
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (d > R) return;
      if (d < nucleo * 0.8 && !e.isElite) {
        e.semRecompensa = true;   // engolido: sem XP, sem créditos
        this.killEnemy(e);
        p.massa++;
        return;
      }
      e.body.velocity.x += dx / d * 140; e.body.velocity.y += dy / d * 140;
    });
  }

  gainXp(v) {
    this.xp += v * this.xpMult;
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = Math.floor(this.xpNext * 1.22 + 3);
      this.pendingLevels++;
    }
    if (this.pendingLevels > 0) this.openNextModal();
  }

  // ---------- JANELAS (subir de nível / baú) ----------
  openNextModal() {
    if (this.modal || this.ended) return;
    if (this.pendingChests > 0) { this.pendingChests--; this.openChest(); return; }
    if (this.pendingLevels > 0) { this.pendingLevels--; this.openLevelUp(); return; }
    this.paused = false;
    this.physics.resume();
  }
  pauseForModal() {
    this.paused = true;
    this.physics.pause();
    this.joy.active = false; this.joyBase.setVisible(false); this.joyKnob.setVisible(false);
  }
  closeModal() {
    if (!this.modal) return;
    this.modal.parts.forEach((p) => p.destroy());
    this.modal = null;
    if (this.autoPickEvt) { this.autoPickEvt.remove(false); this.autoPickEvt = null; }
    this.openNextModal();
  }
  modalPick(i) {
    if (!this.modal || this.menuPausa) return;
    if (this.modal.kind === 'level') {
      const o = this.modal.options[i];
      if (!o) return;
      this.applyOption(o);
      this.closeModal();
    } else if (this.modal.kind === 'chest' && i === 0) this.closeModal();
  }
  scheduleAutoPick() {
    if (this.autoPickEvt) this.autoPickEvt.remove(false);
    this.autoPickEvt = this.time.delayedCall(this.modal && this.modal.kind === 'chest' ? 1400 : 900, () => {
      if (!this.modal || !this.auto) return;
      if (this.modal.kind === 'chest') { this.modalPick(0); return; }
      // o piloto prefere completar combos
      const opts = this.modal.options;
      let idx = opts.findIndex((o) => o.kind === 'passive' && comboWeaponFor(o.id) && this.hasWeapon(comboWeaponFor(o.id)));
      if (idx < 0) idx = opts.findIndex((o) => o.kind === 'weapon');
      this.modalPick(idx < 0 ? 0 : idx);
    });
  }

  openLevelUp() {
    this.pauseForModal();
    let options = this.pickWeighted(this.upgradeOptions(), 3);
    if (!options.length) options = [{ kind: 'heal' }, { kind: 'gold' }];
    const parts = [];
    parts.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setScrollFactor(0).setDepth(200).setInteractive());
    parts.push(this.add.text(W / 2, 80, 'NÍVEL ' + (this.level - this.pendingLevels) + '!  Escolha uma melhoria', {
      fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#fde047', stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201));
    const n = options.length;
    options.forEach((o, i) => parts.push(...this.criarCarta(o, i, W / 2 + (i - (n - 1) / 2) * 250, H / 2 + 20)));
    if (this.auto) parts.push(this.add.text(W / 2, H - 36, 'Piloto automático vai escolher sozinho...', { fontFamily: 'Arial', fontSize: '13px', color: '#94a3b8' }).setOrigin(0.5).setScrollFactor(0).setDepth(201));
    this.modal = { kind: 'level', options, parts };
    if (this.auto) this.scheduleAutoPick();
  }

  // Baú: evolui uma arma (COMBO) se possível; senão dá melhorias aleatórias
  openChest() {
    this.pauseForModal();
    const lines = [];
    let title = 'BAÚ ABERTO!';
    let color = '#fde047';
    const evo = this.evolvable();
    let combo = null;
    if (evo.length) {
      const w = evo[0];
      w.evolved = true;
      combo = w.id;
      title = 'COMBO!';
      color = '#f0abfc';
      lines.push('★ ' + WEAPONS[w.id].evoName + ' ★');
      this.cameras.main.flash(300, 240, 171, 252);
    } else {
      const count = Math.random() < 0.2 ? 3 : 1;
      for (let k = 0; k < count; k++) {
        const opts = this.upgradeOptions().filter((o) => o.level > 1);
        const pool = opts.length ? opts : this.upgradeOptions();
        const o = pool.length ? Phaser.Utils.Array.GetRandom(pool) : { kind: 'gold' };
        this.applyOption(o);
        lines.push(o.kind === 'weapon' ? WEAPONS[o.id].name + ' → Nv ' + o.level
          : o.kind === 'passive' ? PASSIVES[o.id].name + ' → Nv ' + o.level : '+' + fmt(25 * this.gal.rewardMult) + ' créditos');
      }
      const bonus = 30 * this.gal.rewardMult * this.creditMult;
      this.runCredits += bonus;
      lines.push('+' + fmt(bonus) + ' créditos');
    }
    this.refreshInventory();
    const parts = [];
    parts.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setScrollFactor(0).setDepth(200).setInteractive());
    parts.push(this.add.rectangle(W / 2, H / 2, 460, 260, 0x1c1917).setStrokeStyle(3, 0xfacc15).setScrollFactor(0).setDepth(201));
    parts.push(this.add.image(W / 2, H / 2 - 95, 'chest').setScale(1.5).setScrollFactor(0).setDepth(202));
    parts.push(this.add.text(W / 2, H / 2 - 50, title, { fontFamily: 'Arial Black, Arial', fontSize: '26px', color, stroke: '#000000', strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0).setDepth(202));
    if (combo) {
      // [arma] + [item] = [evolução], com os mesmos ícones das cartas e do painel
      const d = WEAPONS[combo], fixo = (o) => o.setScrollFactor(0).setDepth(202);
      [[W / 2 - 110, iconeDe(combo)], [W / 2, iconeDe(d.evo)], [W / 2 + 110, iconeDe(combo, true)]].forEach(([x, k]) =>
        parts.push(fixo(this.add.image(x, H / 2 + 5, k).setDisplaySize(56, 56))));
      ['+', '='].forEach((t, k) => parts.push(fixo(this.add.text(W / 2 - 55 + k * 110, H / 2 + 5, t, { fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#fde047' }).setOrigin(0.5))));
      parts.push(fixo(this.add.text(W / 2, H / 2 + 52, lines.join('\n'), { fontFamily: 'Arial', fontSize: '17px', color: '#f5d0fe', align: 'center' }).setOrigin(0.5)));
    } else {
      parts.push(this.add.text(W / 2, H / 2 + 15, lines.join('\n'), { fontFamily: 'Arial', fontSize: '17px', color: '#ffffff', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(202));
    }
    parts.push(makeButton(this, W / 2, H / 2 + 95, 160, 34, 'CONTINUAR', () => this.modalPick(0), { fixed: true, depth: 203, color: 0x166534, stroke: 0x4ade80 }));
    this.modal = { kind: 'chest', parts };
    if (this.auto) this.scheduleAutoPick();
  }

  // ---------- DANO NO JOGADOR ----------
  onPlayerTouch(p, e) {
    if (this.invuln > 0 || !e.active || e.intangivel) return;
    this.hurt(e.damage);
    if (AO_ENCOSTAR[e.comp]) AO_ENCOSTAR[e.comp](this, e);
  }
  onPlayerShot(p, b) {
    if (!b.active) return;
    b.disableBody(true, true);
    if (this.invuln > 0) return;
    this.hurt(b.dmg);
  }
  hurt(d) {
    if (this.ended) return;
    this.invuln = 0.5;
    this.hp -= d;
    this.cameras.main.shake(80, 0.006);
    this.player.setTint(0xff6666);
    this.time.delayedCall(120, () => { if (this.player.active) this.player.clearTint(); });
    if (this.hp <= 0) {
      this.boom(this.player.x, this.player.y, 30, 0xf97316);
      this.player.setVisible(false);
      this.endRun(this.vitoriaRegistrada ? 'victory' : 'dead', this.primeiraVitoria);
    }
  }

  // ---------- FIM DA PARTIDA ----------
  // Chefe derrotado: solta um baú e créditos; não libera nave nem galáxia (RN-04)
  onBossDefeated(e) {
    const c = EVENTOS.chefes[e.chefe || 0];
    this.dropPickup(e.x, e.y, 'chest');
    const bonus = c.creditos * this.gal.rewardMult;
    this.bonus += bonus; this.runCredits += bonus;
    this.cameras.main.flash(300, 255, 255, 255);
    this.banner('CHEFE DERROTADO! +' + fmt(bonus) + ' créditos', '#86efac');
    this.boss = this.chefeVivo();
  }

  endRun(reason, firstClear) {
    if (this.ended) return;
    if (this.menuPausa) this.fecharPausa();
    this.ended = true;
    this.physics.pause();
    if (this.modal) { this.modal.parts.forEach((p) => p.destroy()); this.modal = null; }
    this.bankCredits();

    const titles = { victory: 'GALÁXIA CONQUISTADA!', dead: 'NAVE DESTRUÍDA', retreat: 'MISSÃO ENCERRADA' };
    const colors = { victory: '#86efac', dead: '#f87171', retreat: '#a5f3fc' };
    const D = 300;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setScrollFactor(0).setDepth(D).setInteractive();
    this.add.rectangle(W / 2, H / 2, 480, 320, 0x0f172a).setStrokeStyle(3, 0x60a5fa).setScrollFactor(0).setDepth(D + 1);
    this.add.text(W / 2, H / 2 - 120, titles[reason], {
      fontFamily: 'Arial Black, Arial', fontSize: '28px', color: colors[reason], stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    const found = this.pois.filter((p) => p.discovered).length;
    const evolved = this.weapons.filter((w) => w.evolved).map((w) => WEAPONS[w.id].evoName);
    let body = 'Tempo: ' + fmtTime(this.elapsed) + '   Abates: ' + this.kills + '   Nível: ' + this.level +
      '\nLocais descobertos: ' + found + '/' + this.pois.length +
      (evolved.length ? '\nCombos: ' + evolved.join(', ') : '') +
      '\n\nCréditos ganhos: ' + fmt(this.runCredits);
    if (reason === 'victory' && firstClear && SHIPS[this.gi + 1]) body += '\n\nNova nave disponível no hangar: ' + SHIPS[this.gi + 1].name + '!';
    this.add.text(W / 2, H / 2 - 5, body, { fontFamily: 'Arial', fontSize: '16px', color: '#e2e8f0', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    makeButton(this, W / 2, H / 2 + 120, 220, 40, 'VOLTAR AO HANGAR', () => this.scene.start('Hangar'),
      { fixed: true, depth: D + 3, color: 0x166534, stroke: 0x4ade80 });
  }
}

