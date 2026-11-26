// =====================================================
// CENA 3: PARTIDA
// =====================================================
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }
  // modo: 'campanha' (30 min), 'infinito' (até morrer) ou 'arena' (battle royale) — RN-68, RN-69
  init(data) { this.shipIndex = (data && data.ship) || 0; this.modo = (data && data.modo) || 'campanha'; }

  create() {
    const ship = this.modo === 'prologo' ? NAVE_PROLOGO : SHIPS[this.shipIndex];   // prólogo: nave exclusiva Eclipse
    this.ship = ship; this.gi = ship.galaxy; this.gal = GALAXIES[this.gi];

    // estado da partida
    this.level = 1; this.xp = 0; this.xpNext = xpParaProximoNivel(1);
    this.pendingLevels = 0; this.pendingChests = 0; this.modal = null;
    this.elapsed = 0; this.runCredits = 0; this.banked = 0; this.bonus = 0; this.kills = 0;
    this.paused = false; this.ended = false;
    this.boss = null;
    this.invuln = 0; this.bankTimer = 0;
    this.ringCount = 0; this.swarmCount = 0; this.eliteCount = 0;
    // ritmo da partida de 30 min (src/ritmo.js, src/dados/ondas.js, src/dados/eventos.js)
    this.estadoOndas = novoEstadoOndas(0); this.ritmoParado = false;
    this.chefesFeitos = EVENTOS.chefes.map(() => false);
    this.naveMae = null; this.vitoriaRegistrada = false; this.primeiraVitoria = false;
    this.menuPausa = null;
    // bônus permanentes das conquistas (src/dados/conquistas.js)
    this.bonusCq = bonusDasConquistas(SAVE);
    this.xpMult = 1 + this.bonusCq.xp; this.creditMult = 1 + this.bonusCq.creditos;
    this.ultimoDanoTempo = 0; this.progressoTimer = 1; this.bausSubchefe = 0; this.chanceArmaTravada = CHANCE_ARMA_TRAVADA;
    this.filaAvisos = []; this.avisoAtivo = false;
    this.faiscas = this.add.group({ defaultKey: 'spark', maxSize: 260 });   // estoque de faíscas
    this.gradeInimigos = new Map(); this.estoqueListas = [];                 // reaproveitados a cada quadro
    this.cullTimer = 0;
    this.weapons = []; this.passives = {}; this.sobrecargas = {};
    this.armasDaPartida = this.sortearArmasDaPartida();
    this.congeladoAte = 0; this.lentoAte = 0; this.chamasAte = 0; this.chamasT = 0; this.tintPoder = false;
    this.subchefesMortos = 0; this.chefesMortos = 0; this.rivaisAbatidos = 0;
    this.infProxChefe = 1800 + INFINITO.chefeACada; this.infProxSub = 1800 + INFINITO.subchefeACada; this.infChefeIdx = 0;
    this.orbs = []; this.orbAngle = 0; this.missiles = []; this.discs = [];
    this.minimapTimer = 0;

    // mundo
    // sem bordas: o mapa dá a volta (src/mundo.js). A câmera segue a nave para sempre.
    this.cameras.main.removeBounds();
    this.aproximarTimer = 0;
    this.cameras.main.setBackgroundColor(this.gal.bg);
    // Fundo: só 2 camadas de estrelas que cobrem a tela (cada camada de tela inteira custa caro
    // em computador e celular fracos) e 2 galáxias distantes pequenas, paradas.
    this.add.image(W * 0.18, H * 0.78, 'galaxia_distante').setScrollFactor(0).setDepth(-31).setAlpha(0.22).setTint(this.gal.starTint);
    this.add.image(W * 0.8, H * 0.16, 'galaxia_distante').setScrollFactor(0).setDepth(-31).setAlpha(0.15).setScale(0.7).setRotation(1.2);
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
    this.criarAjudasDeControle();   // botão MOVER no celular, teclas no computador (src/ajudas.js)
    if (MODO_TESTE) criarPainelTeste(this);
    this.banner(this.gal.name, '#' + this.gal.starTint.toString(16).padStart(6, '0'));
    if (this.modo === 'arena') this.iniciarArena();                       // src/arena.js
    if (this.modo === 'prologo') this.iniciarPrologo();                   // src/prologo.js
    tocarMusica(this, 'g' + this.gi);   // cada galáxia tem as suas músicas (src/musica.js)
    if (this.modo === 'infinito') this.banner(tx('MODO INFINITO: até a nave cair'), '#a5f3fc');
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

    this.pois = genPOIs(this.gi).map((p, indice) => {
      const o = Object.assign({}, p, { indice, discovered: false, done: false, scan: 0, cooldown: 0 });
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

  // Só desenha o que está perto da tela, e meteoro longe sai da física (RN-12).
  // Phaser desenha tudo que é visível, mesmo fora da câmera: as nebulosas grandes e
  // transparentes, sozinhas, custavam ~25% dos quadros por segundo.
  esconderLonge() {
    const px = this.player.x, py = this.player.y, mx = W / 2 + 200, my = H / 2 + 200;
    const perto = (o, extra) => Math.abs(o.x - px) < mx + extra && Math.abs(o.y - py) < my + extra;
    this.nebulas.forEach((n) => n.setVisible(perto(n, n.displayWidth / 2)));
    this.pois.forEach((p) => {
      const v = perto(p, p.img.displayWidth / 2 + 120);
      p.img.setVisible(v && !(p.type === 'relic' && p.done)); p.label.setVisible(v);
    });
    this.rocks.children.iterate((r) => {
      if (!r || !r.active) return;
      r.setVisible(perto(r, 60));
      r.body.enable = Math.abs(r.x - px) < 1500 && Math.abs(r.y - py) < 1500;
    });
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
    // bônus permanentes das conquistas
    const b = this.bonusCq;
    this.mods.dmg *= 1 + b.dano; this.mods.maxHp *= 1 + b.vida; this.mods.regen += b.regen;
    this.mods.area *= 1 + b.area; this.mods.speed *= 1 + b.velocidade;
    this.mods.cd *= 1 - b.recarga; this.mods.magnet *= 1 + b.coleta;
    // sobrecargas: melhorias sem fim depois que tudo está no máximo
    const sc = (k) => (this.sobrecargas[k] || 0) * SOBRECARGAS[k].valor;
    this.mods.dmg *= 1 + sc('dano'); this.mods.maxHp *= 1 + sc('vida'); this.mods.area *= 1 + sc('area');
    this.mods.speed *= 1 + sc('velocidade'); this.mods.cd *= 1 - sc('recarga'); this.mods.regen += sc('regen');
    if (oldMax && this.mods.maxHp > oldMax) this.hp += this.mods.maxHp - oldMax;
  }

  wstats(w) {
    const def = WEAPONS[w.id];
    const s = def.stats(w.level);
    if (w.evolved) { def.evolve(s); s.visual = VISUAL_COMBOS[w.id]; }
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
      Object.keys(WEAPONS).forEach((id) => { if (this.armaDisponivel(id) && !this.hasWeapon(id)) opts.push({ kind: 'weapon', id, level: 1, weight: WEAPONS[id].suprema ? CHANCE_SUPREMA : 1 }); });
    }
    Object.keys(PASSIVES).forEach((id) => {
      const lv = this.passives[id] || 0;
      if (lv >= PASSIVES[id].max) return;
      if (!lv && Object.keys(this.passives).length >= MAX_PASSIVES) return;
      opts.push({ kind: 'passive', id, level: lv + 1, weight: lv ? 1.2 : 0.9 });
    });
    return opts;
  }
  // Sobrecargas: só aparecem quando faltam cartas normais (tudo no máximo)
  opcoesSobrecarga() {
    const opts = [];
    Object.keys(SOBRECARGAS).forEach((id) => {
      const lv = this.sobrecargas[id] || 0, d = SOBRECARGAS[id];
      if (d.max && lv >= d.max) return;
      opts.push({ kind: 'sobrecarga', id, level: lv + 1, weight: 1 });
    });
    return opts;
  }
  // Arma comum que pode aparecer nas cartas: não é poder de nave e não está travada
  armaDisponivel(id) {
    const d = WEAPONS[id];
    if (!d.suprema && this.armasDaPartida && !this.armasDaPartida.includes(id)) return false;   // fora do sorteio desta partida (supremas podem sair em qualquer uma)
    return !d.poder && (!d.hidden || armaLiberada(SAVE, id));
  }
  // Sorteia quais armas comuns podem sair nas cartas desta partida (RN-64)
  sortearArmasDaPartida() {
    const candidatas = Object.keys(WEAPONS).filter((id) => !WEAPONS[id].poder && !WEAPONS[id].suprema && (!WEAPONS[id].hidden || armaLiberada(SAVE, id)));
    Phaser.Utils.Array.Shuffle(candidatas);
    return candidatas.slice(0, ARMAS_POR_PARTIDA);
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
    else if (o.kind === 'sobrecarga') { this.sobrecargas[o.id] = (this.sobrecargas[o.id] || 0) + 1; this.recalc(); }
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
      etiqueta = d.poder ? tx('PODER DA NAVE') : d.suprema ? tx('ARMA SUPREMA') : o.level === 1 ? tx('ARMA NOVA') : tx('ARMA');
      cor = d.poder ? 0x422006 : 0x1e1b4b; borda = d.poder ? 0xfacc15 : 0x818cf8;
      if (d.suprema) { cor = 0x713f12; borda = 0xfde047; }   // carta rara dourada (RN-66)
    } else if (o.kind === 'passive') {
      const d = PASSIVES[o.id];
      icone = iconeDe(o.id); nome = d.name; efeito = d.desc; nivel = o.level; max = d.max;
      etiqueta = o.level === 1 ? tx('ITEM NOVO') : tx('ITEM'); cor = 0x042f2e; borda = 0x2dd4bf;
    } else if (o.kind === 'sobrecarga') {
      const d = SOBRECARGAS[o.id];
      icone = iconeDe(d.icone); nome = d.nome; efeito = d.desc + '\n' + tx('(nível {n})', { n: o.level });
      etiqueta = tx('SOBRECARGA'); cor = 0x3b0764; borda = 0xe879f9;
    } else if (o.kind === 'heal') {
      icone = 'heal'; escala = 2.6; nome = tx('Kit de Reparo'); efeito = tx('+30% de vida'); etiqueta = tx('CURA');
    } else {
      icone = 'coin'; escala = 2.6; nome = tx('Créditos'); efeito = '+' + fmt(25 * this.gal.rewardMult); etiqueta = tx('BÔNUS');
    }
    const btn = makeButton(this, x, y, 220, 270, '', () => this.modalPick(i), { fixed: true, depth: D, color: cor, stroke: borda });
    const parts = [btn];
    parts.push(fixo(this.add.text(x - 98, y - 125, String(i + 1), { fontFamily: 'Arial', fontSize: '13px', color: '#94a3b8', fontStyle: 'bold' })));
    parts.push(fixo(this.add.text(x, y - 112, etiqueta, { fontFamily: 'Arial', fontSize: '12px', color: '#fde68a', fontStyle: 'bold' }).setOrigin(0.5)));
    parts.push(fixo(this.add.image(x, y - 45, icone).setScale(escala)));
    // nome longo (ex.: em francês ou alemão) quebra em 2 linhas: a descrição desce junto
    const txtNome = fixo(this.add.text(x, y + 12, nome, { fontFamily: 'Arial', fontSize: '17px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: 200 } }).setOrigin(0.5, 0));
    parts.push(txtNome);
    const txtEfeito = fixo(this.add.text(x, y + 12 + txtNome.height + 10, efeito, { fontFamily: 'Arial', fontSize: '14px', color: '#cbd5e1', align: 'center', wordWrap: { width: 196 } }).setOrigin(0.5, 0));
    if (txtEfeito.y + txtEfeito.height > y + 98) txtEfeito.setFontSize(12);
    parts.push(txtEfeito);
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
    this.input.keyboard.on('keydown-ONE', () => this.modalPick(0));
    this.input.keyboard.on('keydown-TWO', () => this.modalPick(1));
    this.input.keyboard.on('keydown-THREE', () => this.modalPick(2));
    this.input.keyboard.on('keydown-FOUR', () => this.modalPick(3));
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
      // tocar no botão MOVER (ou perto dele) usa o centro dele; tocar em outro lugar cria o controle ali
      const casa = this.joyCasa, perto = casa && Math.hypot(p.x - casa.x, p.y - casa.y) < 120;
      const cx = perto ? casa.x : p.x, cy = perto ? casa.y : p.y;
      this.joy.active = true; this.joy.sx = cx; this.joy.sy = cy;
      this.joyBase.setPosition(cx, cy).setVisible(true);
      this.joyKnob.setPosition(p.x, p.y).setVisible(true);
      if (perto) { const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(d, 50); this.joy.dx = dx / d * k / 50; this.joy.dy = dy / d * k / 50; }
    });
    this.input.on('pointermove', (p) => {
      if (!this.joy.active) return;
      let dx = p.x - this.joy.sx, dy = p.y - this.joy.sy;
      const d = Math.hypot(dx, dy), max = 50;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      this.joy.dx = dx / max; this.joy.dy = dy / max;
      this.joyKnob.setPosition(this.joy.sx + dx, this.joy.sy + dy);
    });
    this.input.on('pointerup', () => this.soltarControle());
  }
  // solta o controle de toque: com o botão MOVER, ele volta para o canto; sem, some
  soltarControle() {
    this.joy.active = false; this.joy.dx = 0; this.joy.dy = 0;
    if (this.joyCasa) {
      this.joyBase.setPosition(this.joyCasa.x, this.joyCasa.y).setVisible(true);
      this.joyKnob.setPosition(this.joyCasa.x, this.joyCasa.y).setVisible(true);
    } else { this.joyBase.setVisible(false); this.joyKnob.setVisible(false); }
  }

  // ---------- PAUSA (botão II, ESC, P ou trocar de aba) ----------
  alternarPausa() {
    if (this.codexAberto) return;   // com o códex aberto, ESC/P não mexem na pausa
    if (this.menuPausa) this.fecharPausa(); else this.abrirPausa();
  }
  abrirPausa() {
    if (this.ended || this.menuPausa) return;
    this.physics.pause();
    this.time.paused = true;
    this.tweens.pauseAll();
    this.soltarControle();
    this.player.setVelocity(0, 0);
    const D = 400;
    const parts = [
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setScrollFactor(0).setDepth(D).setInteractive(),
      this.add.rectangle(W / 2, H / 2, 380, 330, 0x0f172a).setStrokeStyle(3, 0x60a5fa).setScrollFactor(0).setDepth(D + 1),
      this.add.text(W / 2, H / 2 - 135, tx('PAUSADO'), {
        fontFamily: 'Arial Black, Arial', fontSize: '30px', color: '#a5f3fc', stroke: '#000000', strokeThickness: 5
      }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2),
      this.add.text(W / 2, H / 2 - 105, tx('O relógio da partida está parado. ESC ou P para continuar.'), {
        fontFamily: 'Arial', fontSize: '12px', color: '#cbd5e1', align: 'center'
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D + 2)
    ];
    const botao = (y, rotulo, acao, cor, borda) => {
      const b = makeButton(this, W / 2, y, 240, 38, rotulo, acao, { fixed: true, depth: D + 3, color: cor, stroke: borda, size: 15 });
      parts.push(b.bg, b.txt);
      return b;
    };
    botao(H / 2 - 50, tx('CONTINUAR'), () => this.fecharPausa(), 0x166534, 0x4ade80);
    botao(H / 2 - 2, tx('CÓDEX'), () => {
      this.codexAberto = true;
      abrirCodex(this, () => { this.codexAberto = false; });
    });
    // recolher nave também na pausa (RN-32)
    if (this.modo !== 'prologo') botao(H / 2 + 46, tx('RECOLHER NAVE'), () => this.endRun('retreat'), 0x3f3f46, 0xa1a1aa);
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

    makeButton(this, W - 30, 26, 40, 30, 'II', () => this.alternarPausa(), { fixed: true, depth: D, size: 15 });
    if (this.modo !== 'prologo') makeButton(this, W - 140, 26, 160, 30, tx('RECOLHER NAVE'), () => this.endRun('retreat'), { fixed: true, depth: D, size: 12, color: 0x3f3f46, stroke: 0xa1a1aa });

    this.bossBarBg = this.add.rectangle(W / 2, 54, 400, 14, 0x000000, 0.7).setScrollFactor(0).setDepth(D).setVisible(false);
    this.bossBar = this.add.rectangle(W / 2 - 198, 54, 396, 10, 0xa855f7).setOrigin(0, 0.5).setScrollFactor(0).setDepth(D + 1).setVisible(false);
    this.hintText = this.add.text(W / 2, H - 32, '', { fontFamily: 'Arial', fontSize: '14px', color: '#fde047', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(D);

    // minimapa
    this.mmSize = 150; this.mmX = W - 90 - 75; this.mmY = 86;
    this.add.rectangle(this.mmX, this.mmY, this.mmSize, this.mmSize, 0x020617, 0.92).setOrigin(0).setStrokeStyle(2, 0x64748b).setScrollFactor(0).setDepth(D);
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(D + 1);
    this.add.text(this.mmX + this.mmSize / 2, this.mmY + this.mmSize + 4, tx('MAPA'), { fontFamily: 'Arial', fontSize: '10px', color: '#94a3b8' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D);

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
    let info = this.modo === 'prologo' ? tx('Nível {n}   Abates {a}', { n: this.level, a: this.kills }) : tx('Nível {n}   Abates {a}   Créditos +{c}', { n: this.level, a: this.kills, c: fmt(this.runCredits) });
    if (this.modo === 'infinito') info += '   ' + tx('Pontos {p}', { p: fmt(this.pontosAtuais()) });
    if (this.modo === 'arena') info += '   ' + tx('Naves vivas {n}', { n: this.colocacaoArena() });
    this.infoText.setText(info);
    this.timeText.setText(this.modo === 'prologo' ? tx('ANO 3025') : this.modo === 'infinito' ? fmtTime(this.elapsed) + '  ∞' : this.modo === 'arena' ? fmtTime(this.elapsed) + ' / ' + fmtTime(ARENA.duracao) : fmtTime(this.elapsed) + ' / ' + fmtTime(EVENTOS.duracao));
    this.xpFill.setScale(Math.min(1, this.xp / this.xpNext), 1);
    if (this.boss && !this.boss.active) this.boss = this.chefeVivo();
    if (this.boss && this.boss.active) {
      this.bossBarBg.setVisible(true); this.bossBar.setVisible(true);
      this.bossBar.setScale(Math.max(0, this.boss.hp / this.boss.maxHp), 1);
    } else { this.bossBarBg.setVisible(false); this.bossBar.setVisible(false); }
    this.hintText.setText(this.textoDica());
  }

  // Linha de aviso no rodapé: o que vem a seguir
  textoDica() {
    if (this.modo === 'prologo') return '';
    if (this.modo === 'arena') {
      if (Math.hypot(this.player.x - this.zona.x, this.player.y - this.zona.y) > this.zona.r) return tx('VOLTE PARA A ZONA SEGURA!');
      return this.elapsed < ARENA.duracao ? tx('A zona fecha de vez em {tempo}', { tempo: fmtTime(ARENA.duracao - this.elapsed) }) : tx('A ZONA ESTÁ FECHANDO!');
    }
    if (this.modo === 'infinito' && this.elapsed >= 1800) return tx('{evento} em {tempo}', { evento: tx('Chefe'), tempo: fmtTime(Math.max(0, this.infProxChefe - this.elapsed)) });
    if (this.vitoriaRegistrada) return tx('GALÁXIA CONQUISTADA! Resista à nave-mãe o quanto puder.');
    const p = proximoEvento(this.elapsed);
    return p ? tx('{evento} em {tempo}', { evento: tx(p.nome), tempo: fmtTime(Math.max(0, p.t - this.elapsed)) }) : '';
  }

  pontosAtuais() {
    return calcularPontos({ abates: this.kills, segundos: this.elapsed, subchefes: this.subchefesMortos, chefes: this.chefesMortos });
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
    if (this.modo === 'arena') {
      // arena: rivais (na cor de cada um) e a zona segura
      this.rivais.forEach((r) => { if (r.active && r.isRival) { g.fillStyle(r.corRival, 1); g.fillCircle(mx(r.x), my(r.y), 2.5); } });
      g.lineStyle(1, 0xef4444, 0.9).strokeCircle(mx(this.zona.x), my(this.zona.y), Math.max(1, this.zona.r * k));
    }
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
    if (this.ended || this.paused || this.menuPausa) return;
    const dt = Math.min(delta, 50) / 1000;
    this.elapsed += dt;
    if (this.modo === 'prologo') this.updatePrologo(dt);

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
    if (this.modo === 'arena') this.updateArena(dt);
    this.updateFaiscas(dt);

    this.bullets.children.iterate((b) => {
      if (!b || !b.active) return;
      b.life -= dt;
      if (b.life <= 0) { b.disableBody(true, true); return; }
      if (b.rastro) { b.rastroT -= dt; if (b.rastroT <= 0) { b.rastroT = 0.05; this.rastro(b.x, b.y, b.rastro); } }   // combo (RN-80)
    });
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
    this.progressoTimer -= dt;
    if (this.progressoTimer <= 0) { this.progressoTimer = 1; this.atualizarProgresso(); }
    this.cullTimer -= dt;
    if (this.cullTimer <= 0) { this.cullTimer = 0.2; this.esconderLonge(); }
    // se o jogo ficar lento, reduz os efeitos visuais antes de mexer na jogabilidade (RN-12)
    this.fpsTimer = (this.fpsTimer || 0) - dt;
    if (this.fpsTimer <= 0) {
      this.fpsTimer = 2;
      this.efeitosReduzidos = PREFS.efeitosReduzidos || this.game.loop.actualFps < 40;   // escolha do jogador ou jogo lento
      this.far.setVisible(!this.efeitosReduzidos);   // jogo lento: some a camada de estrelas distantes
    }
    this.minimapTimer -= dt;
    if (this.minimapTimer <= 0) { this.minimapTimer = 0.12; this.drawMinimap(); }
    this.updateHUD();
  }

  bankCredits() {
    if (this.modo === 'prologo') return;
    const add = Math.floor(this.runCredits) - this.banked;
    if (add > 0) { SAVE.credits += add; this.banked += add; }
    writeSave(SAVE);
  }

  movePlayer() {
    let vx = 0, vy = 0;
    let moveuTeclado = false;
    if (this.joy.active) { vx = this.joy.dx; vy = this.joy.dy; }
    else {
      const c = this.cursors, k = this.keys;
      if (c.left.isDown || k.A.isDown) vx -= 1;
      if (c.right.isDown || k.D.isDown) vx += 1;
      if (c.up.isDown || k.W.isDown) vy -= 1;
      if (c.down.isDown || k.S.isDown) vy += 1;
      moveuTeclado = vx !== 0 || vy !== 0;
    }
    this.updateAjudas(moveuTeclado, this.joy.active && (Math.abs(this.joy.dx) + Math.abs(this.joy.dy) > 0.2));   // src/ajudas.js
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

  // ---------- NASCIMENTO DE INIMIGOS ----------
  updateSpawns(dt) {
    if (this.ritmoParado) return;
    const t = this.tempoInimigos();
    // inimigos comuns: ondas no começo, fluxo depois (tabela em src/dados/ondas.js)
    const n = passoNascimento(this.estadoOndas, t, dt, this.contarComuns(), ONDAS);
    if (n > 0) {
      // quem nasce: os inimigos da galáxia que já entraram (src/dados/inimigos.js)
      const pesos = pesosNoTempo(INIMIGOS_POR_GALAXIA[this.gi], INIMIGOS, t, MISTURA_INIMIGOS, COMPORTAMENTOS_QUE_ATIRAM);
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
    if (this.modo === 'arena') return;   // na arena, os eventos são a zona, os rivais e os chefes (src/arena.js)
    if (quantosAte(t, EVENTOS.cercos) > this.ringCount) { this.ringCount++; this.spawnRing(); }
    if (quantosAte(t, EVENTOS.enxames) > this.swarmCount) { this.swarmCount++; this.spawnSwarm(); }
    // subchefes no horário
    if (quantosAte(t, EVENTOS.subchefes) > this.eliteCount) {
      this.eliteCount++;
      const p = this.spawnPoint();
      this.spawnElite(p.x, p.y);
    }
    EVENTOS.chefes.forEach((c, i) => {
      if (!this.chefesFeitos[i] && t >= c.t) { this.chefesFeitos[i] = true; this.spawnBoss(i); }
    });
    if (this.modo === 'campanha' && !this.naveMae && t >= EVENTOS.naveMae) this.chegarNaveMae();
    // infinito: depois dos 30:00, chefes a cada 5 min e subchefes a cada 2 min (RN-68)
    if (this.modo === 'infinito') {
      if (t >= this.infProxChefe) { this.infProxChefe += INFINITO.chefeACada; this.spawnBoss(this.infChefeIdx++ % EVENTOS.chefes.length); }
      if (t >= this.infProxSub) { this.infProxSub += INFINITO.subchefeACada; const p = this.spawnPoint(); this.spawnElite(p.x, p.y); }
    }
  }

  // Modo infinito: depois de 29:00 a vida e o dano dos inimigos crescem 10% por minuto (RN-68)
  fatorExtra() {
    if (this.modo !== 'infinito' || this.elapsed <= INFINITO.inicioExtra) return 1;
    return Math.pow(INFINITO.crescimentoPorMinuto, (this.elapsed - INFINITO.inicioExtra) / 60);
  }
  // Na arena os monstros "andam no tempo" mais rápido (8 min de arena = 16 min de campanha)
  tempoInimigos() { return this.modo === 'arena' ? this.elapsed * ARENA.ritmoInimigos : this.modo === 'prologo' ? 0 : this.elapsed; }

  // inimigos comuns vivos (sem contar subchefes e chefes)
  contarComuns() {
    let n = 0;
    this.enemies.children.iterate((e) => { if (e && e.active && !e.isBoss && !e.isElite && !e.isRival) n++; });
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
    const linhaMin = linhaDoMinuto(ONDAS, this.tempoInimigos()), extra = this.fatorExtra(), vidaMinuto = linhaMin.vida * extra;
    e.hp = e.maxHp = t.hp * this.gal.hpMult * vidaMinuto * (this.modo === 'prologo' ? PROLOGO_INICIO.vidaInimigos : 1);
    e.speedV = t.speed * this.gal.speedMult * (0.9 + Math.random() * 0.2);
    e.damage = t.damage * Math.sqrt(this.gal.hpMult) * linhaMin.dano * extra;   // fica mais forte com o tempo
    e.reward = t.reward; e.xpVal = t.xp; e.hitR = t.radius;
    e.isBoss = false; e.isElite = false; e.isRival = false; e.straight = null;
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
    this.banner(tx('CERCO!'), '#fca5a5');
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
    this.banner(tx('ENXAME!'), '#fde047');
  }

  spawnElite(x, y) {
    // subchefe: versão gigante de um dos inimigos que já apareceram (menos o enxame)
    const opcoes = Object.keys(pesosNoTempo(INIMIGOS_POR_GALAXIA[this.gi], INIMIGOS, this.elapsed, MISTURA_INIMIGOS, COMPORTAMENTOS_QUE_ATIRAM))
      .filter((id) => INIMIGOS[id].comp !== 'enxame' && INIMIGOS[id].comp !== 'sentinela');
    const tk = opcoes.length ? opcoes[this.eliteCount % opcoes.length] : this.resolverTipo('bug');
    const e = this.spawnEnemy(tk, x, y) || this.forceSpawn(tk, x, y);
    if (!e) return;
    e.isElite = true;
    e.setScale(2.2);
    e.setTint(0xffd27f);
    e.hp = e.maxHp = e.maxHp * 28;
    e.isRival = false;
    e.speedV *= 0.85;
    e.damage *= 2;
    e.reward = 40; e.xpVal = 10; e.hitR = INIMIGOS[tk].radius * 2.2;
    this.banner(tx('SUBCHEFE À VISTA!'), '#fb923c');
  }
  forceSpawn(tk, x, y) {
    let victim = null;
    this.enemies.children.iterate((e) => { if (!victim && e && e.active && !e.isElite && !e.isBoss) victim = e; });
    if (victim) victim.disableBody(true, true);
    return this.spawnEnemy(tk, x, y);
  }

  // Chefe da galáxia número i (força em src/dados/eventos.js)
  spawnBoss(i) {
    tocarSom(this, 'chefe');
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
    e.hp = e.maxHp = 1600 * this.gal.hpMult * c.vida * this.fatorExtra() * (this.modo === 'arena' ? 0.6 : 1);
    e.isRival = false;
    e.speedV = 60 * this.gal.speedMult;
    e.damage = 30 * Math.sqrt(this.gal.hpMult) * c.dano;
    e.danoTiro = c.dano;
    e.reward = 0; e.xpVal = 20; e.hitR = 50 * c.tamanho;
    e.isBoss = true; e.isElite = false; e.straight = null; e.chefe = i || 0;
    e.flash = 0; e.orbHit = 0; e.kbT = 0; e.flank = 0; e.shootT = 2; e.burst = 0;
    this.boss = e;
    this.bossBar.setFillStyle(hexToInt(this.gal.alien.b));
    this.banner(tx('ALERTA: CHEFE DA GALÁXIA {n}/{total}!', { n: (i || 0) + 1, total: EVENTOS.chefes.length }), '#f87171');
  }

  // Nave-mãe aos 30:00: registra a vitória e vem destruir o jogador (RN-01, RN-02)
  chegarNaveMae() {
    tocarSom(this, 'chefe');
    this.vitoriaRegistrada = true;
    this.primeiraVitoria = !SAVE.cleared[this.gi];
    SAVE.cleared[this.gi] = true;
    SAVE.stats.vitorias[this.gi + ':' + this.ship.id] = true;
    const bonus = 500 * this.gal.rewardMult;
    this.bonus += bonus; this.runCredits += bonus;
    writeSave(SAVE);
    const p = this.spawnPoint();
    const m = this.physics.add.sprite(p.x, p.y, 'boss_' + this.gi).setScale(3.2).setDepth(9).setTint(0x7f1d1d);
    m.body.setCircle(50, m.width / 2 - 50, m.height / 2 - 50);
    m.tiroT = 1.2;
    this.naveMae = m;
    this.physics.add.overlap(this.player, m, () => { this.invuln = 0; this.hurt(99999); });
    clarao(this, 500, 0xffffff);
    this.cameras.main.shake(600, 0.01);
    this.banner(tx('A NAVE-MÃE CHEGOU! GALÁXIA CONQUISTADA!'), '#86efac');
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
    const CELL = 48, grid = this.gradeInimigos;
    // devolve as listas do quadro anterior ao estoque e limpa a grade (sem criar Map novo)
    grid.forEach((arr) => { arr.length = 0; this.estoqueListas.push(arr); });
    grid.clear();
    const list = this.listaInimigos || (this.listaInimigos = []);
    list.length = 0;
    const ppx = this.player.x, ppy = this.player.y, LONGE2 = INIMIGO_LONGE * INIMIGO_LONGE;
    const congelado = this.elapsed < this.congeladoAte, lento = !congelado && this.elapsed < this.lentoAte;
    // quando o poder acaba, tira a cor azul/roxa de todos uma única vez
    const tingir = congelado || lento;
    if (this.tintPoder && !tingir) this.enemies.children.iterate((e) => { if (e && e.active) { e.clearTint(); if (e.isElite) e.setTint(0xffd27f); if (e.isRival) e.setTint(e.corRival); } });
    this.tintPoder = tingir;
    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      this.aproximarObj(e);
      // inimigo comum que ficou muito para trás volta para perto, na borda da tela (RN-59)
      if (!e.isBoss && !e.isElite && !e.isRival && (e.x - ppx) * (e.x - ppx) + (e.y - ppy) * (e.y - ppy) > LONGE2) {
        const p = this.spawnPoint();
        e.body.reset(p.x, p.y);
      }
      list.push(e);
      const key = Math.floor(e.x / CELL) * 100003 + Math.floor(e.y / CELL);
      let arr = grid.get(key);
      if (!arr) { arr = this.estoqueListas.pop() || []; grid.set(key, arr); }
      arr.push(e);
    });
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.flash > 0) { e.flash -= dt; if (e.flash <= 0 && !e.intangivel) e.setAlpha(1); }
      if (e.straight) {
        e.life -= dt;
        if (e.life <= 0) { e.disableBody(true, true); continue; }
        e.setVelocity(e.straight.x, e.straight.y);
        continue;
      }
      if (e.kbT > 0) { e.kbT -= dt; e.setVelocity(e.kbx, e.kby); continue; }
      if (e.atordoado > 0) { e.atordoado -= dt; e.setVelocity(0, 0); continue; }   // Martelo Gravitacional
      if (congelado) { e.setVelocity(0, 0); e.setTint(0x93c5fd); continue; }        // poder "tempo parado"
      if (lento) e.setTint(0xc4b5fd);
      const dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy) || 1;
      if (!e.isBoss && !e.isElite && !e.isRival && d > 1400) {
        const p = this.spawnPoint(); e.setPosition(p.x, p.y); continue;   // reposiciona em vez de sumir
      }
      // comportamento próprio do inimigo (src/comportamentos.js); null = perseguir
      const comportamento = !e.isBoss && !e.isRival && COMPORTAMENTOS[e.comp];
      const quer = e.isRival ? this.movimentoRival(e, dt) : comportamento ? comportamento(this, e, dt, { dx, dy, d }) : null;
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
      if (lento) { vx *= PODER_LENTO_MULT; vy *= PODER_LENTO_MULT; }
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
    if (b) b.dmg *= (mult || 1) * (e.isElite ? 1.6 : e.isBoss ? 1 : MISTURA_INIMIGOS.danoTiroAtiradores);   // tiro de inimigo comum dói menos (RN-67)
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
    if (t.isRock) t.setTint(0xe7e5e4); else if (!t.intangivel) t.setAlpha(0.55);   // atingido: fica meio transparente por um instante (sem piscar branco, RN-76)
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
    if (e.isRival) { this.eliminarRival(e, true); return; }   // nave rival abatida pelo jogador (src/arena.js)
    if (e.semRecompensaRival) { e.semRecompensaRival = false; this.boom(e.x, e.y, 6, hexToInt(this.gal.alien.b)); e.disableBody(true, true); return; }
    tocarSom(this, 'explosao');
    const mult = this.gal.rewardMult * this.creditMult;
    if (!e.semRecompensa) {
      // explodiu sozinho (kamikaze, bomba-relógio) não dá recompensa nem efeito de morte
      if (e.isElite || e.isBoss) this.runCredits += e.reward * mult;   // inimigo comum não dá créditos (RN-56)
      this.kills++;
      const contar = this.modo !== 'prologo';   // o prólogo não entra nas estatísticas
      if (contar) SAVE.stats.abates++;
      if (e.isElite) { if (contar) SAVE.stats.subchefes++; this.subchefesMortos++; }
      if (e.isBoss) { if (contar) SAVE.stats.chefes++; this.chefesMortos++; }
      this.dropGem(e.x, e.y, e.xpVal);
      if (AO_MORRER[e.comp]) AO_MORRER[e.comp](this, e);
    }
    e.intangivel = false;
    this.boom(e.x, e.y, e.isBoss ? 40 : e.isElite ? 24 : 6, e.isBoss || e.isElite ? 0xfde047 : hexToInt(this.gal.alien.b));
    const wasBoss = e.isBoss, wasElite = e.isElite;
    e.isElite = false;
    e.disableBody(true, true);
    if (wasElite) this.dropPickup(e.x, e.y, 'chest', 'subchefe');   // baú de subchefe pode ter arma travada
    if (wasBoss) this.onBossDefeated(e);
  }

  breakRock(r) {
    tocarSom(this, 'meteoro');
    this.boom(r.x, r.y, 10, r.crystal ? 0x22d3ee : 0xa8a29e);
    r.disableBody(true, true);
    // meteoros só dão créditos; cristal dá mais (RN-55, valores em src/config.js)
    const item = this.sortearItemMeteoro(false);
    if (r.crystal) {
      this.dropPickup(r.x - 12, r.y, 'coin', CREDITOS_CRISTAL);
      this.dropPickup(r.x + 12, r.y, this.sortearItemMeteoro(true));
    } else this.dropPickup(r.x, r.y, item, item === 'coin' ? CREDITOS_METEORO : undefined);
  }
  // Sorteio pelo peso da tabela METEORO_ITENS (src/config.js); semMoeda = cristal (moeda já vem garantida)
  sortearItemMeteoro(semMoeda) {
    if (this.forcarItemMeteoro) { const k = this.forcarItemMeteoro; this.forcarItemMeteoro = null; return k; }   // roteiro do prólogo
    let total = 0;
    for (const k in METEORO_ITENS) if (!(semMoeda && k === 'coin')) total += METEORO_ITENS[k];
    let r = Math.random() * total;
    for (const k in METEORO_ITENS) {
      if (semMoeda && k === 'coin') continue;
      r -= METEORO_ITENS[k];
      if (r < 0) return k;
    }
    return 'heal';
  }

  // Faíscas de explosão: vêm de um estoque reaproveitado (pooling), sem criar e destruir
  // imagens e animações a cada explosão
  boom(x, y, n, color) {
    if (this.efeitosReduzidos) n = Math.ceil(n / 3);   // jogo lento: menos faíscas, jogabilidade igual
    for (let i = 0; i < n; i++) {
      const s = this.faiscas.get(x, y);
      if (!s) return;                                    // estoque cheio: não cria mais
      const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * (n > 10 ? 120 : 30);
      const dur = 0.3 + Math.random() * 0.3;
      s.setActive(true).setVisible(true).setPosition(x, y).setTint(color).setAlpha(1).setScale(1).setDepth(9);
      s.vx = Math.cos(a) * d / dur; s.vy = Math.sin(a) * d / dur; s.vida = dur; s.vidaMax = dur;
    }
  }
  // ---------- VISUAL DOS COMBOS (RN-80): tudo do estoque de faíscas, nada criado por quadro ----------
  // tiro com cara de combo: bola brilhante colorida que deixa rastro
  visualCombo(b, v, cor, escala) {
    if (!b || !v) return;
    b.setTexture('bullet_combo').setTint(cor || v.cor).setScale(escala || 1.1);
    if (!this.efeitosReduzidos) { b.rastro = v.cor2; b.rastroT = 0; }
  }
  // um pontinho parado que some aos poucos (rastro)
  rastro(x, y, cor) {
    const s = this.faiscas.get(x, y);
    if (!s) return;
    s.setActive(true).setVisible(true).setPosition(x, y).setTint(cor).setAlpha(0.9).setScale(1.1).setDepth(7);
    s.vx = (Math.random() - 0.5) * 30; s.vy = (Math.random() - 0.5) * 30; s.vida = 0.25; s.vidaMax = 0.25;
  }
  // faíscas que voam de (x,y) até a nave (vida sugada pela Aura Vampírica)
  faiscaAteNave(x, y, cor) {
    const s = this.faiscas.get(x, y);
    if (!s) return;
    const dur = 0.35;
    s.setActive(true).setVisible(true).setPosition(x, y).setTint(cor).setAlpha(1).setScale(1.5).setDepth(10);
    s.vx = (this.player.x - x) / dur; s.vy = (this.player.y - y) / dur; s.vida = dur; s.vidaMax = dur;
  }
  // anel que cresce e some (explosões dos combos)
  anelCombo(x, y, raio, cor, borda, ms, de) {
    const c = this.add.circle(x, y, de || 10, cor, 0.25).setStrokeStyle(4, borda, 0.9).setDepth(9);
    this.tweens.add({ targets: c, radius: raio, alpha: 0, duration: ms || 300, onComplete: () => c.destroy() });
  }
  updateFaiscas(dt) {
    this.faiscas.children.iterate((s) => {
      if (!s || !s.active) return;
      s.vida -= dt;
      if (s.vida <= 0) { s.setActive(false).setVisible(false); return; }
      const f = s.vida / s.vidaMax;
      s.x += s.vx * dt; s.y += s.vy * dt; s.setAlpha(f).setScale(0.3 + 0.7 * f);
    });
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
      else if (w.id === 'supermissil') fired = this.fireSuperMissil(s);
      else if (w.id === 'nova') fired = this.fireNova(s);
      else if (w.id === 'laser') fired = this.fireLaser(s);
      else if (w.id === 'chuva') fired = this.fireChuva(s);
      else if (w.id === 'trovao') fired = this.fireTrovao(s);
      if (fired) tocarSom(this, 'tiro');
      w.timer = fired ? s.cd : 0.1;
    });
    this.updateOrbitals(dt, orbitalStats);
    if (this.elapsed < this.chamasAte) this.updateChamas(dt);
    this.updateMissiles(dt);
    this.updateDiscs(dt);
  }

  shoot(x, y, a, dmg, pierce) {
    const b = this.bullets.get(x, y, 'bullet');
    if (!b) return;
    b.enableBody(true, x, y, true, true);
    b.setTexture('bullet').setDepth(8).clearTint().setScale(1);
    b.rastro = 0; b.rastroT = 0;
    b.body.setCircle(5);
    b.setVelocity(Math.cos(a) * 620, Math.sin(a) * 620);
    b.life = 1.1; b.pierceLeft = pierce; b.hitSet = new Set(); b.dmg = dmg; b.ricochete = 0;
    return b;
  }

  // ---------- PODERES EXCLUSIVOS ----------
  // Altair (antiga Falcão): leque de tiros; cada tiro pula para outro inimigo ao acertar (ricochete)
  fireRajada(s) {
    const t = this.nearestTarget(560);
    if (!t) return false;
    const px = this.player.x, py = this.player.y;
    const base = Phaser.Math.Angle.Between(px, py, t.x, t.y);
    for (let i = 0; i < s.amount; i++) {
      const b = this.shoot(px, py, base + (i - (s.amount - 1) / 2) * 0.2, s.dmg, 0);
      if (b) { b.ricochete = s.ricochete; b.setTint(0x93c5fd); this.visualCombo(b, s.visual, 0, 1.2); }
    }
    this.player.rotation = base + Math.PI / 2;
    this.ultimaMira = this.elapsed;
    return true;
  }
  // Antares (antiga Titã): onda que esmaga e atordoa; evoluída, puxa os inimigos antes
  fireMartelo(s) {
    const px = this.player.x, py = this.player.y, r = s.radius;
    const near = this.nearestTarget(r * 1.1);
    if (!near || Math.hypot(near.x - px, near.y - py) > r * 1.1 + (near.hitR || 14)) return false;
    const v = s.visual;
    if (v) {
      // Colapso Gravitacional: um anel roxo se fecha (buraco negro) e depois explode
      const suga = this.add.circle(px, py, r * 1.5, 0x1e1b4b, 0.25).setStrokeStyle(5, v.cor, 0.9).setDepth(9);
      this.tweens.add({ targets: suga, radius: 14, alpha: 0.9, duration: 160, onComplete: () => { suga.destroy(); this.anelCombo(px, py, r, v.cor, v.cor2, 300, 14); this.boom(px, py, 16, v.cor); } });
    } else {
      const anel = this.add.circle(px, py, 12, 0xf59e0b, 0.25).setStrokeStyle(6, 0xfbbf24, 0.9).setDepth(9);
      this.tweens.add({ targets: anel, radius: r, alpha: 0, duration: 260, onComplete: () => anel.destroy() });
    }
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
  // Rigel (antiga Agulha): um dardo muito rápido para cada inimigo perto
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
      if (b) { b.setVelocity(Math.cos(a) * 950, Math.sin(a) * 950); b.setTint(0xf0abfc).setScale(0.8); b.life = 0.8; this.visualCombo(b, s.visual, 0, 0.9); }
    }
    return true;
  }

  firePulsar(s) {
    const t = this.nearestTarget(520);
    if (!t) return false;
    const px = this.player.x, py = this.player.y;
    const base = Phaser.Math.Angle.Between(px, py, t.x, t.y);
    const v = s.visual;
    for (let i = 0; i < s.amount; i++) this.visualCombo(this.shoot(px, py, base + (i - (s.amount - 1) / 2) * 0.14, s.dmg, s.pierce), v, 0, 1.2);
    if (s.ring) { this.ringCounter = (this.ringCounter || 0) + 1; if (this.ringCounter % 2 === 0) for (let i = 0; i < 10; i++) this.visualCombo(this.shoot(px, py, i / 10 * Math.PI * 2, s.dmg * 0.7, s.pierce), v, v && v.cor2, 1); }
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
      if (s.visual) { m.setTint(s.visual.cor); m.visual = s.visual; m.rastroT = 0; }
      this.missiles.push(m);
    }
    return true;
  }
  // Lança-chamas temporário (poder de meteoro, RN-62): cone de fogo na direção do inimigo mais perto
  updateChamas(dt) {
    this.chamasT -= dt;
    if (this.chamasT > 0) return;
    const PASSO = 0.1;
    this.chamasT = PASSO;
    const alvo = this.nearestTarget(PODER_CHAMAS_ALCANCE);
    const px = this.player.x, py = this.player.y;
    const a = alvo ? Math.atan2(alvo.y - py, alvo.x - px) : this.player.rotation - Math.PI / 2;
    const dano = PODER_CHAMAS_DANO * PASSO * linhaDoMinuto(ONDAS, this.elapsed).vida * this.gal.hpMult * this.mods.dmg;
    const R = PODER_CHAMAS_ALCANCE, R2 = R * R, ABERTURA = 0.5;
    this.forEachTarget((t) => {
      const dx = t.x - px, dy = t.y - py, d2 = dx * dx + dy * dy;
      if (d2 > R2) return;
      if (Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - a)) < ABERTURA) this.damageTarget(t, dano);
    });
    // fogo: faíscas do estoque saindo em cone
    for (let i = 0; i < (this.efeitosReduzidos ? 2 : 5); i++) {
      const f = this.faiscas.get(px, py);
      if (!f) break;
      const aa = a + (Math.random() - 0.5) * ABERTURA * 2, vel = R * (2.2 + Math.random());
      f.setActive(true).setVisible(true).setPosition(px, py).setTint(Math.random() < 0.5 ? 0xf97316 : 0xfde047).setAlpha(1).setScale(1.6).setDepth(9);
      f.vx = Math.cos(aa) * vel; f.vy = Math.sin(aa) * vel; f.vida = 0.35; f.vidaMax = 0.35;
    }
  }
  // ---------- ARMAS SUPREMAS (RN-66) ----------
  // Laser Aniquilador: um feixe reto que acerta tudo na linha
  fireLaser(s) {
    const t = this.nearestTarget(s.range);
    if (!t) return false;
    const px = this.player.x, py = this.player.y, base = Math.atan2(t.y - py, t.x - px);
    const larg = 16 * s.size, L = s.range;
    for (let k = 0; k < s.amount; k++) {
      const a = base + (k - (s.amount - 1) / 2) * 0.35, cx = Math.cos(a), cy = Math.sin(a);
      const feixe = this.add.rectangle(px + cx * L / 2, py + cy * L / 2, L, larg, 0xf43f5e, 0.85).setRotation(a).setDepth(11);
      const nucleo = this.add.rectangle(px + cx * L / 2, py + cy * L / 2, L, larg * 0.35, 0xffe4e6, 1).setRotation(a).setDepth(12);
      this.tweens.add({ targets: [feixe, nucleo], alpha: 0, scaleY: 0.2, duration: 300, onComplete: () => { feixe.destroy(); nucleo.destroy(); } });
      this.forEachTarget((e) => {
        const dx = e.x - px, dy = e.y - py, ao = dx * cx + dy * cy;          // distância ao longo do feixe
        if (ao < 0 || ao > L) return;
        if (Math.abs(dx * cy - dy * cx) < larg / 2 + (e.hitR || 14)) this.damageTarget(e, s.dmg);   // distância até a linha
      });
    }
    this.cameras.main.shake(60, 0.003);
    return true;
  }
  // Chuva de Meteoros: marca o chão e, logo depois, o meteoro cai e explode
  fireChuva(s) {
    const px = this.player.x, py = this.player.y, alvos = [];
    this.enemies.children.iterate((e) => { if (e && e.active && !e.intangivel && Math.abs(e.x - px) < 480 && Math.abs(e.y - py) < 280) alvos.push(e); });
    if (!alvos.length) return false;
    for (let k = 0; k < s.amount; k++) {
      const e = alvos[Math.floor(Math.random() * alvos.length)];
      const x = e.x + (Math.random() - 0.5) * 30, y = e.y + (Math.random() - 0.5) * 30;
      const marca = this.add.circle(x, y, s.radius, 0xfb923c, 0.12).setStrokeStyle(2, 0xfb923c, 0.7).setDepth(5);
      const pedra = this.add.circle(x - 120, y - 260, 12, 0x78716c).setStrokeStyle(3, 0xfde047).setDepth(11);
      this.tweens.add({ targets: pedra, x, y, duration: 380 + k * 60, ease: 'Quad.easeIn', onComplete: () => {
        pedra.destroy(); marca.destroy();
        if (this.ended) return;
        this.explode(x, y, s.radius, s.dmg);
        this.boom(x, y, 10, 0xfb923c);
      } });
    }
    tocarSom(this, 'explosao');
    return true;
  }
  // Tempestade Trovejante: trovões caem do céu em vários inimigos e atordoam
  fireTrovao(s) {
    const px = this.player.x, py = this.player.y, alvos = [];
    this.enemies.children.iterate((e) => { if (e && e.active && !e.intangivel && Math.abs(e.x - px) < 520 && Math.abs(e.y - py) < 300) alvos.push(e); });
    if (!alvos.length) return false;
    Phaser.Utils.Array.Shuffle(alvos);
    const g = this.add.graphics().setDepth(12);
    for (let k = 0; k < Math.min(s.amount, alvos.length); k++) {
      const e = alvos[k];
      g.lineStyle(5, 0xfacc15, 0.5); this.zigzag(g, e.x + 30, e.y - 320, e.x, e.y);
      g.lineStyle(2, 0xfef9c3, 1); this.zigzag(g, e.x + 30, e.y - 320, e.x, e.y);
      this.damageTarget(e, s.dmg);
      if (e.active && !e.isBoss) { e.atordoado = s.atordoa; e.atordoamentos = (e.atordoamentos || 0) + 1; }
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 240, onComplete: () => g.destroy() });
    return true;   // sem clarão na tela: a arma dispara toda hora (RN-76)
  }
  // Super Míssil: lento, grande e com explosão enorme (RN-63)
  fireSuperMissil(s) {
    if (!this.nearestTarget(750)) return false;
    for (let i = 0; i < s.amount; i++) {
      const a = Math.random() * Math.PI * 2;
      const m = this.add.image(this.player.x, this.player.y, 'missile').setDepth(8).setScale(2.4).setTint(0xfca5a5);
      m.ang = a; m.speed = 150; m.velMax = 330; m.life = 4; m.dmg = s.dmg; m.radius = s.radius; m.target = null; m.grande = true;
      if (s.visual) { m.setTint(s.visual.cor).setScale(2.8); m.visual = s.visual; m.rastroT = 0; }
      this.missiles.push(m);
    }
    return true;
  }
  // Nova Radial: um anel de tiros para todos os lados; evoluída, dispara dois anéis (RN-63)
  fireNova(s) {
    if (!this.nearestTarget(520)) return false;
    const px = this.player.x, py = this.player.y, n = s.amount, giro = (this.novaGiro = (this.novaGiro || 0) + 0.35);
    const anel = (atraso) => {
      for (let i = 0; i < n; i++) {
        const b = this.shoot(px, py, giro + atraso + i / n * Math.PI * 2, s.dmg, s.pierce);
        if (b) { b.setTint(0x67e8f9); b.life = 0.8; if (s.visual) this.visualCombo(b, s.visual, s.visual.cores[i % s.visual.cores.length], 1); }
      }
    };
    anel(0);
    if (s.duplo) this.time.delayedCall(180, () => { if (!this.ended) anel(Math.PI / n); });
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
      m.speed = Math.min(m.velMax || 480, m.speed + (m.grande ? 220 : 500) * dt);
      m.x += Math.cos(m.ang) * m.speed * dt; m.y += Math.sin(m.ang) * m.speed * dt;
      m.rotation = m.ang + Math.PI / 2;
      if (m.visual && !this.efeitosReduzidos) { m.rastroT -= dt; if (m.rastroT <= 0) { m.rastroT = 0.04; this.rastro(m.x, m.y, m.visual.cor2); } }
      const hit = m.target && Math.hypot(m.target.x - m.x, m.target.y - m.y) < (m.target.hitR || 14) + 6;
      if (hit || m.life <= 0) {
        this.explode(m.x, m.y, m.radius, m.dmg, m.visual);
        if (m.grande) { this.cameras.main.shake(120, 0.006); this.boom(m.x, m.y, 18, m.visual ? m.visual.cor : 0xf97316); }
        m.destroy();
        this.missiles.splice(i, 1);
      }
    }
  }
  explode(x, y, radius, dmg, v) {
    if (v) {
      // combo: explosão dupla nas cores do combo (Enxame Nuclear verde, Ogiva Solar dourada)
      this.anelCombo(x, y, radius * 1.15, v.cor, v.cor2, 320, radius * 0.3);
      const nucleo = this.add.circle(x, y, radius * 0.55, v.cor2, 0.55).setDepth(9);
      this.tweens.add({ targets: nucleo, alpha: 0, scale: 1.4, duration: 220, onComplete: () => nucleo.destroy() });
    } else {
      const c = this.add.circle(x, y, radius, 0xf97316, 0.35).setDepth(9).setStrokeStyle(2, 0xfde047, 0.8);
      this.tweens.add({ targets: c, alpha: 0, scale: 1.2, duration: 250, onComplete: () => c.destroy() });
    }
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
    const v = s.visual;
    if (v) this.anelCombo(px, py, s.radius, v.cor, v.cor2, 320);   // Aura Vampírica: onda vermelho-sangue
    else {
      const ring = this.add.circle(px, py, 10, 0xa78bfa, 0.18).setStrokeStyle(3, 0xc4b5fd, 0.9).setDepth(9);
      this.tweens.add({ targets: ring, radius: s.radius, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
    }
    let healed = 0;
    const r = s.radius;
    this.forEachTarget((t) => {
      const d = Math.hypot(t.x - px, t.y - py);
      if (d < r + (t.hitR || 14)) {
        this.damageTarget(t, s.dmg);
        this.knock(t, px, py, 380);
        if (s.heal && !t.isRock && healed < 10) {
          healed++; this.hp = Math.min(this.mods.maxHp, this.hp + 0.8);
          if (v && healed <= 6 && !this.efeitosReduzidos) this.faiscaAteNave(t.x, t.y, v.cor2);   // a vida voa até a nave
        }
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
    const v = s.visual;
    g.lineStyle(v ? 6 : 3, v ? v.cor : 0x67e8f9, v ? 0.85 : 1);   // Tempestade Elétrica: raio dourado grosso
    const hit = new Set();
    for (let k = 0; k < s.amount; k++) {
      let cur = Phaser.Utils.Array.GetRandom(pool.filter((e) => !hit.has(e))) || pool[0];
      let fromX = px, fromY = py;
      for (let j = 0; j <= s.jumps && cur; j++) {
        this.zigzag(g, fromX, fromY, cur.x, cur.y, v);
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
  zigzag(g, x1, y1, x2, y2, v) {
    const steps = 5, pts = this._zz || (this._zz = []);   // pontos reaproveitados
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      pts[i * 2] = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 18; pts[i * 2 + 1] = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 18;
    }
    const linha = () => { g.beginPath(); g.moveTo(x1, y1); for (let i = 1; i < steps; i++) g.lineTo(pts[i * 2], pts[i * 2 + 1]); g.lineTo(x2, y2); g.strokePath(); };
    linha();
    if (v) { g.lineStyle(2, v.cor2, 1); linha(); g.lineStyle(6, v.cor, 0.85); }   // núcleo branco por dentro
  }

  fireDiscs(s) {
    const t = this.nearestTarget(600);
    const base = t ? Math.atan2(t.y - this.player.y, t.x - this.player.x) : Math.random() * Math.PI * 2;
    for (let i = 0; i < s.amount; i++) {
      const a = base + (i - (s.amount - 1) / 2) * (Math.PI * 2 / Math.max(3, s.amount + 1));
      const d = this.add.image(this.player.x, this.player.y, 'disc').setDepth(8).setScale(s.size);
      d.dirx = Math.cos(a); d.diry = Math.sin(a); d.out = 0; d.back = false;
      d.dmg = s.dmg; d.range = s.range; d.r = 12 * s.size; d.hits = new Map(); d.pull = s.pull;
      if (s.visual) { d.setTint(s.visual.cor); d.visual = s.visual; d.rastroT = 0; }   // Vórtice Serrilhado: serra em chamas
      this.discs.push(d);
    }
    return true;
  }
  updateDiscs(dt) {
    for (let i = this.discs.length - 1; i >= 0; i--) {
      const d = this.discs[i];
      d.rotation += dt * (d.visual ? 20 : 14);
      if (d.visual && !this.efeitosReduzidos) {
        d.rastroT -= dt;
        if (d.rastroT <= 0) { d.rastroT = 0.06; const a = d.rotation; this.rastro(d.x + Math.cos(a) * d.r, d.y + Math.sin(a) * d.r, Math.random() < 0.5 ? d.visual.cor : d.visual.cor2); }
      }
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
    while (this.orbs.length > want) { const o = this.orbs.pop(); if (o.halo) o.halo.destroy(); o.destroy(); }
    if (!want) return;
    // Halo Eterno: esferas douradas com um halo que pulsa (criado uma vez, reaproveitado)
    const v = s.visual;
    if (v && !this.efeitosReduzidos) {
      const pulso = 1 + Math.sin(this.elapsed * 6) * 0.15;
      this.orbs.forEach((o) => {
        if (!o.halo) { o.setTexture('orb_combo').setTint(v.cor); o.halo = this.add.image(0, 0, 'halo').setDepth(10).setTint(v.cor).setBlendMode(Phaser.BlendModes.ADD); }
        o.halo.setScale(s.size * 1.3 * pulso);
      });
    } else if (v) this.orbs.forEach((o) => o.setTexture('orb_combo').setTint(v.cor));
    this.orbAngle += dt * s.spin;
    const R = s.radius, n = this.orbs.length;
    this.orbs.forEach((o, i) => {
      const a = this.orbAngle + i / n * Math.PI * 2;
      o.setPosition(this.player.x + Math.cos(a) * R, this.player.y + Math.sin(a) * R).setScale(s.size);
      if (o.halo) o.halo.setPosition(o.x, o.y);
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
    // azul = pouca XP, roxa = média, vermelha = muita (como no Vampire Survivors)
    g.setTexture(val >= 10 ? 'gem3' : val >= 3 ? 'gem2' : 'gem');
    g.setActive(true).setVisible(true).setPosition(x, y).setDepth(4);
    g.val = val; g.magnetized = false; g.fase = Math.random() * 6;
    g.escalaBase = val >= 10 ? 1.8 : val >= 3 ? 1.5 : 1.3;
    g.setScale(g.escalaBase);
  }
  updateGems(dt) {
    const px = this.player.x, py = this.player.y, mag = this.mods.magnet;
    this.gems.children.iterate((g) => {
      if (!g || !g.active) return;
      this.aproximarObj(g);
      g.setScale(g.escalaBase * (1 + 0.15 * Math.sin(this.elapsed * 6 + g.fase)));   // pulsa de leve
      const dx = px - g.x, dy = py - g.y, d = Math.hypot(dx, dy);
      if (d < 22) { g.setActive(false).setVisible(false); tocarSom(this, 'gema'); this.gainXp(g.val); return; }
      if (d > 1600 && !g.magnetized) { g.setActive(false).setVisible(false); return; }
      if (d < mag || g.magnetized) {
        g.magnetized = true;
        const step = Math.min(d, 520 * dt);
        g.x += dx / d * step; g.y += dy / d * step;
      }
    });
  }

  dropPickup(x, y, ptype, extra) {
    const keys = { heal: 'heal', coin: 'coin', magnet: 'magnetItem', bomb: 'bomb', chest: 'chest', weapon: 'wbox', congelar: 'congelar', lento: 'lento', chamas: 'chamas' };
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
      if (t === 'heal') { this.hp = Math.min(this.mods.maxHp, this.hp + this.mods.maxHp * 0.3); this.floatText(px, py, tx('+VIDA'), '#f87171'); }
      else if (t === 'coin') { tocarSom(this, 'moeda'); const v = (extra || 15) * this.gal.rewardMult * this.creditMult; this.runCredits += v; this.floatText(px, py, tx('+{v} créditos', { v: fmt(v) }), '#facc15'); }
      else if (t === 'magnet') { this.gems.children.iterate((g) => { if (g && g.active) g.magnetized = true; }); this.floatText(px, py, tx('ÍMÃ TOTAL!'), '#22d3ee'); }
      else if (t === 'bomb') this.detonate();
      else if (t === 'congelar') { this.congeladoAte = this.elapsed + PODER_CONGELAR_S; clarao(this, 200, 0x93c5fd); this.banner(tx('TEMPO PARADO!'), '#93c5fd'); tocarSom(this, 'conquista'); }
      else if (t === 'lento') { this.lentoAte = this.elapsed + PODER_LENTO_S; this.banner(tx('INIMIGOS LENTOS!'), '#c4b5fd'); tocarSom(this, 'conquista'); }
      else if (t === 'chamas') { this.chamasAte = this.elapsed + PODER_CHAMAS_S; this.banner(tx('LANÇA-CHAMAS!'), '#fb923c'); tocarSom(this, 'conquista'); }
      else if (t === 'chest') { if (extra === 'subchefe') this.bausSubchefe++; this.pendingChests++; this.openNextModal(); }
      else if (t === 'weapon') this.contarArmaAchada(extra);
    });
  }
  floatText(x, y, text, color) {
    const t = this.add.text(x, y - 30, text, { fontFamily: 'Arial', fontSize: '15px', color, stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }
  detonate() {
    clarao(this, 250, 0xffc878);
    const px = this.player.x, py = this.player.y;
    const list = [];
    this.enemies.children.iterate((e) => { if (e && e.active && Math.hypot(e.x - px, e.y - py) < 650) list.push(e); });
    list.forEach((e) => this.damageTarget(e, e.isBoss || e.isElite ? e.maxHp * 0.25 : e.hp + 1));
    this.floatText(px, py, tx('BOMBA!'), '#fb923c');
  }

  // Arma travada achada: soma no save; na 3ª vez passa a aparecer nas cartas (RN-35)
  contarArmaAchada(id) {
    if (this.modo === 'prologo' || !WEAPONS[id].hidden || armaLiberada(SAVE, id)) return;   // prólogo não mexe no progresso
    const n = registrarArmaAchada(SAVE, id);
    if (armaLiberada(SAVE, id)) {
      if (this.armasDaPartida && !this.armasDaPartida.includes(id)) this.armasDaPartida.push(id);   // liberada agora: já vale nesta partida
      this.banner(tx('{arma} agora aparece nas cartas!', { arma: WEAPONS[id].name }), '#86efac');
    } else this.floatText(this.player.x, this.player.y - 20, tx('{arma} achada {n}/{total}', { arma: WEAPONS[id].name, n, total: ACHADOS_PARA_LIBERAR }), '#f0abfc');
    writeSave(SAVE);
  }

  // ---------- CONQUISTAS E ESTATÍSTICAS (RN-34 a RN-39) ----------
  atualizarProgresso() {
    if (this.modo === 'prologo') return;   // o prólogo não conta para conquistas nem estatísticas
    const st = SAVE.stats, chave = this.gi + ':' + this.ship.id;
    st.maiorSemDano = Math.max(st.maiorSemDano, this.elapsed - this.ultimoDanoTempo);
    st.nivelMax = Math.max(st.nivelMax, this.level);
    st.melhorTempo[chave] = Math.max(st.melhorTempo[chave] || 0, this.elapsed);
    const novas = verificarConquistas(SAVE, Date.now());
    if (novas.length) {
      writeSave(SAVE);
      this.bonusCq = bonusDasConquistas(SAVE);       // bônus valem na hora
      this.xpMult = Math.max(this.xpMult, 1 + this.bonusCq.xp);
      this.recalc();
      novas.forEach((c) => this.filaAvisos.push(c));
      this.proximoAviso();
    }
  }
  // Aviso pequeno no canto, sem pausar; vários avisos esperam na fila (CT-55)
  proximoAviso() {
    if (this.avisoAtivo || !this.filaAvisos.length || this.ended) return;
    const c = this.filaAvisos.shift();
    this.avisoAtivo = true;
    tocarSom(this, 'conquista');
    const x = W - 150, y = 280, D = 160, partes = [];
    const fixo = (o) => { partes.push(o.setScrollFactor(0).setDepth(D)); return o; };
    fixo(this.add.rectangle(x, y, 270, 62, 0x14532d, 0.92).setStrokeStyle(2, 0x4ade80));
    fixo(this.add.text(x, y - 18, tx('CONQUISTA!'), { fontFamily: 'Arial Black, Arial', fontSize: '13px', color: '#fde047' }).setOrigin(0.5));
    fixo(this.add.text(x, y, c.nome, { fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
    const nomeArma = c.premio.arma ? WEAPONS[c.premio.arma].name : '';
    fixo(this.add.text(x, y + 18, textoDoPremio(c.premio, nomeArma), { fontFamily: 'Arial', fontSize: '11px', color: '#bbf7d0' }).setOrigin(0.5));
    this.avisoConquista = partes;
    // entra deslizando da direita com um "pulo", e sai deslizando de volta
    partes.forEach((p) => { p.x += 320; });
    this.tweens.add({ targets: partes, x: '-=320', duration: 350, ease: 'Back.easeOut' });
    this.tweens.add({ targets: partes[0], scaleX: 1.06, scaleY: 1.06, duration: 160, yoyo: true, repeat: 2, delay: 350 });
    this.time.delayedCall(3100, () => this.tweens.add({ targets: partes, x: '+=320', duration: 300, ease: 'Quad.easeIn' }));
    this.time.delayedCall(3500, () => {
      partes.forEach((p) => p.destroy());
      this.avisoAtivo = false;
      this.proximoAviso();
    });
  }

  // ---------- LOCAIS ÚNICOS ----------
  updatePOIs(dt) {
    const px = this.player.x, py = this.player.y;
    this.scanBar.clear();
    this.pois.forEach((p) => {
      const d = Math.hypot(p.x - px, p.y - py);
      if (!p.discovered && d < 520) {
        p.discovered = true;
        const ja = this.modo === 'prologo' ? [] : SAVE.stats.locais[this.gi] || (SAVE.stats.locais[this.gi] = []);
        if (!ja.includes(p.indice)) ja.push(p.indice);   // conta para a conquista de explorar
        this.banner(tx('DESCOBERTO: {nome}', { nome: p.name }), '#a5f3fc');
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
            p.done = true; p.label.setText(tx('{nome} (explorado)', { nome: p.name })).setColor('#94a3b8');
            if (p.weapon && !armaLiberada(SAVE, p.weapon)) this.contarArmaAchada(p.weapon);   // só a pista: a arma vem nas cartas (RN-55)
            else this.recompensaDeLocal(p, p.type === 'planet' ? 14 : 8, p.type === 'planet' ? 120 : 70);
          }
        } else if (p.scan > 0) p.scan = Math.max(0, p.scan - dt);
      }
      if (p.type === 'cache' && !p.done && d < 60) {
        p.done = true; p.img.setAlpha(0.35);
        p.label.setText(tx('{nome} (vazio)', { nome: p.name })).setColor('#94a3b8');
        ['heal', 'magnet', 'bomb'].forEach((t, i) => {
          const a = -Math.PI / 2 + (i - 1) * 0.9;
          this.dropPickup(p.x + Math.cos(a) * 70, p.y + Math.sin(a) * 70, t);
        });
        this.banner(tx('SUPRIMENTOS!'), '#86efac');
      }
      if (p.type === 'station') {
        p.cooldown -= dt;
        p.label.setText(p.cooldown > 0 ? p.name + ' (' + Math.ceil(p.cooldown) + 's)' : tx('{nome} — PRONTA', { nome: p.name }));
        if (d < 110 && p.cooldown <= 0 && this.hp < this.mods.maxHp) {
          this.hp = this.mods.maxHp; p.cooldown = 90;
          this.floatText(px, py, tx('REPARO COMPLETO!'), '#4ade80');
        }
      }
      if (p.type === 'relic' && !p.done && d < 45) {
        p.done = true; p.img.setVisible(false);
        p.label.setText(tx('{nome} (coletada)', { nome: p.name })).setColor('#94a3b8');
        this.xpMult *= 1.3; this.creditMult *= 1.3;
        this.banner(tx('RELÍQUIA: {nome}', { nome: p.name }) + '\n' + tx('+30% XP e créditos nesta partida'), '#facc15');
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
    if (perto.length) this.banner(tx('FAROL: {n} locais marcados no mapa', { n: perto.length }), '#38bdf8');
  }
  // Planeta sem arma ou destroços: solta gemas em volta e dá créditos
  recompensaDeLocal(p, gemas, creditos) {
    for (let i = 0; i < gemas; i++) {
      const a = i / gemas * Math.PI * 2;
      this.dropGem(p.x + Math.cos(a) * 60, p.y + Math.sin(a) * 60, 3);
    }
    const v = creditos * this.gal.rewardMult * this.creditMult;
    this.runCredits += v;
    this.floatText(this.player.x, this.player.y, tx('+{v} créditos', { v: fmt(v) }), '#facc15');
  }
  triggerNest(p) {
    p.done = true;
    this.spawnElite(p.x + 60, p.y);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; this.spawnEnemy('bug', p.x + Math.cos(a) * 120, p.y + Math.sin(a) * 120); }
    this.banner(tx('O NINHO DESPERTOU!'), '#f87171');
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
      this.xpNext = this.modo === 'prologo' ? PROLOGO_INICIO.xpPorNivel : xpParaProximoNivel(this.level);   // curva em src/dados/progressao.js
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
    this.soltarControle();
  }
  closeModal() {
    if (!this.modal) return;
    this.modal.parts.forEach((p) => p.destroy());
    this.modal = null;
    if (this.modo === 'prologo') this.eventoPrologo('fechou');
    this.openNextModal();
  }
  modalPick(i) {
    if (!this.modal || this.menuPausa) return;
    const m = this.modal;
    if (m.kind === 'level') {
      const o = m.options[i];
      if (!o) return;
      this.applyOption(o);
      this.closeModal();
    } else if (m.kind === 'chest') {
      if (m.fase === 'escolher' && i >= 0 && i < 3) this.abrirBauEscolhido(i);
      else if (m.fase === 'revelado' && i === 0) this.closeModal();
    }
  }
  openLevelUp() {
    tocarSom(this, 'nivel');
    if (this.modo === 'prologo' && this.nivelAutomaticoPrologo()) return;   // prólogo: sem parar a ação (src/prologo.js)
    this.pauseForModal();
    let options = this.pickWeighted(this.upgradeOptions(), 3);
    if (options.length < 3) options = options.concat(this.pickWeighted(this.opcoesSobrecarga(), 3 - options.length));
    // roteiro do prólogo: esta carta mostra uma arma suprema
    if (this.forcarSuprema && !this.hasWeapon(this.forcarSuprema) && this.weapons.length < MAX_WEAPONS) {
      options[options.length - 1] = { kind: 'weapon', id: this.forcarSuprema, level: 1, weight: 1 };
      this.forcarSuprema = null;
    }
    if (!options.length) options = [{ kind: 'heal' }, { kind: 'gold' }];
    const parts = [];
    parts.push(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setScrollFactor(0).setDepth(200).setInteractive());
    parts.push(this.add.text(W / 2, 80, tx('NÍVEL {n}!  Escolha uma melhoria', { n: this.level - this.pendingLevels }), {
      fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#fde047', stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201));
    const n = options.length;
    options.forEach((o, i) => parts.push(...this.criarCarta(o, i, W / 2 + (i - (n - 1) / 2) * 250, H / 2 + 20)));
    // a melhor escolha ganha o selo RECOMENDADO (src/ajudas.js); ajuda quem não lê as cartas
    if (ajudasLigadas() && n > 1) {
      const r = this.indiceRecomendado(options);
      parts.push(...this.marcarRecomendada(W / 2 + (r - (n - 1) / 2) * 250, H / 2 + 20, 220, 270));
      this.cartaRecomendada = r;
    }
    this.modal = { kind: 'level', options, parts };
    if (this.modo === 'prologo') this.eventoPrologo('carta');
  }

  // ---------- BAÚ: 3 BAÚS FECHADOS, O JOGADOR ESCOLHE UM ----------
  // Cada baú já tem um conteúdo sorteado (comum, raro ou épico). Se houver combo pronto
  // (arma no nível 5 + item certo), o baú escolhido sempre evolui a arma (RN-22).
  sortearConteudoBau() {
    const r = Math.random();
    const raridade = r < BAU_CHANCES.epico ? 'epico' : r < BAU_CHANCES.epico + BAU_CHANCES.raro ? 'raro' : 'comum';
    return { raridade, melhorias: { comum: 1, raro: 2, epico: 3 }[raridade], creditos: { comum: 30, raro: 60, epico: 100 }[raridade] };
  }
  openChest() {
    tocarSom(this, 'bau');
    if (this.modo === 'prologo') this.eventoPrologo('bau');
    this.pauseForModal();
    const doSubchefe = this.bausSubchefe > 0;
    if (doSubchefe) this.bausSubchefe--;
    const conteudos = [0, 1, 2].map(() => this.sortearConteudoBau());
    // baú de subchefe: chance de um dos três ter uma arma travada que você ainda não tem
    const travadas = Object.keys(WEAPONS).filter((k) => WEAPONS[k].hidden && !armaLiberada(SAVE, k) && !this.hasWeapon(k));
    if (doSubchefe && travadas.length && Math.random() < this.chanceArmaTravada) {
      const c = conteudos[Math.floor(Math.random() * 3)];
      c.raridade = 'epico'; c.arma = travadas[Math.floor(Math.random() * travadas.length)];
    }
    const evo = this.evolvable();
    const D = 200, parts = [], fixo = (o, d) => { parts.push(o.setScrollFactor(0).setDepth(D + (d || 0))); return o; };
    fixo(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive());
    const titulo = fixo(this.add.text(W / 2, 92, tx('ESCOLHA UM BAÚ'), { fontFamily: 'Arial Black, Arial', fontSize: '28px', color: '#fde047', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5), 2);
    const subtitulo = fixo(this.add.text(W / 2, 128, tx('O que tem dentro é surpresa'), { fontFamily: 'Arial', fontSize: '14px', color: '#cbd5e1' }).setOrigin(0.5), 2);
    const baus = [0, 1, 2].map((i) => {
      const x = W / 2 + (i - 1) * 230, y = H / 2 + 20;
      const brilho = fixo(this.add.circle(x, y, 70, 0xfacc15, 0.12), 1);
      const bau = fixo(this.add.image(x, y, 'chest').setScale(5), 2).setInteractive({ useHandCursor: true });
      bau.on('pointerdown', () => this.modalPick(i));
      bau.on('pointerover', () => brilho.setFillStyle(0xfacc15, 0.28));
      bau.on('pointerout', () => brilho.setFillStyle(0xfacc15, 0.12));
      fixo(this.add.text(x, y + 80, String(i + 1), { fontFamily: 'Arial Black, Arial', fontSize: '20px', color: '#94a3b8' }).setOrigin(0.5), 2);
      // balança, cada um num ritmo
      const balanco = this.tweens.add({ targets: bau, angle: { from: -7, to: 7 }, yoyo: true, repeat: -1, duration: 260 + i * 40, delay: i * 90, ease: 'Sine.easeInOut' });
      return { x, y, bau, brilho, balanco };
    });
    this.modal = { kind: 'chest', fase: 'escolher', conteudos, combo: evo.length ? evo[0] : null, baus, parts, fixo, titulo, subtitulo };
  }

  // Abre o baú escolhido: pulo, clarão, raios de luz e a recompensa; os outros mostram o que tinham
  abrirBauEscolhido(i) {
    const m = this.modal;
    m.fase = 'abrindo';
    m.baus.forEach((b) => { b.balanco.stop(); b.bau.setAngle(0).disableInteractive(); });
    const esc = m.baus[i];
    m.baus.forEach((b, k) => { if (k !== i) this.tweens.add({ targets: [b.bau, b.brilho], alpha: 0.35, duration: 250 }); });
    this.tweens.add({ targets: esc.bau, y: esc.y - 30, scale: 6.2, duration: 220, yoyo: true, ease: 'Quad.easeOut' });
    this.time.delayedCall(460, () => {
      if (this.modal !== m || m.fase !== 'abrindo') return;   // já revelado (ou fechado)
      clarao(this, 220, 0xfff0b4);
      esc.bau.setTexture('chest_aberto');
      const raios = m.fixo(this.add.image(esc.x, esc.y - 10, 'raios').setScale(1.6).setAlpha(0.85), 1);
      this.tweens.add({ targets: raios, angle: 360, duration: 6000, repeat: -1 });
      this.revelarBaus(i);
    });
  }
  revelarBaus(i) {
    const m = this.modal;
    if (!m || m.kind !== 'chest' || m.fase === 'revelado') return;
    const c = m.conteudos[i], fixo = m.fixo;
    const CORES = { comum: '#cbd5e1', raro: '#60a5fa', epico: '#e879f9', combo: '#fde047' };
    const NOMES = { comum: tx('COMUM'), raro: tx('RARO'), epico: tx('ÉPICO'), combo: tx('COMBO!') };
    const ganhos = [];   // { icone, texto }
    let raridade = c.raridade;
    if (m.combo) {
      const w = m.combo;
      w.evolved = true;
      raridade = 'combo';
      const novo = this.modo !== 'prologo' && registrarCombo(SAVE, w.id);   // salvo para sempre (o prólogo não conta)
      if (novo) writeSave(SAVE);
      m.comboId = w.id; m.comboNovo = novo;
      clarao(this, 300, 0xf0abfc);
    } else {
      for (let k = 0; k < c.melhorias; k++) {
        const semArmaNova = this.upgradeOptions().filter((o) => !(o.kind === 'weapon' && o.level === 1));   // arma nova só nas cartas de nível
        const opts = semArmaNova.filter((o) => o.level > 1);
        let pool = opts.length ? opts : semArmaNova;
        if (!pool.length) pool = this.opcoesSobrecarga();
        const o = pool.length ? Phaser.Utils.Array.GetRandom(pool) : { kind: 'gold' };
        this.applyOption(o);
        if (o.kind === 'weapon') ganhos.push({ icone: iconeDe(o.id), texto: tx('{nome} Nv {n}', { nome: WEAPONS[o.id].name, n: o.level }) });
        else if (o.kind === 'passive') ganhos.push({ icone: iconeDe(o.id), texto: tx('{nome} Nv {n}', { nome: PASSIVES[o.id].name, n: o.level }) });
        else if (o.kind === 'sobrecarga') ganhos.push({ icone: iconeDe(SOBRECARGAS[o.id].icone), texto: SOBRECARGAS[o.id].nome + ' ' + o.level });
        else ganhos.push({ icone: 'coin', texto: tx('+{v} créditos', { v: fmt(25 * this.gal.rewardMult) }) });
      }
      if (c.arma) {
        this.contarArmaAchada(c.arma);   // só a pista; a arma passa a sair nas cartas depois de 3 achados
        ganhos.push({ icone: iconeDe(c.arma), texto: tx('Pista: {arma} {n}/{total}', { arma: WEAPONS[c.arma].name, n: Math.min(ACHADOS_PARA_LIBERAR, (SAVE.stats.armasAchadas[c.arma] || 0)), total: ACHADOS_PARA_LIBERAR }) });
      }
      if (c.raridade === 'epico') { this.hp = this.mods.maxHp; ganhos.push({ icone: 'heal', texto: tx('Vida cheia') }); }
      const cred = c.creditos * this.gal.rewardMult * this.creditMult;
      this.runCredits += cred;
      ganhos.push({ icone: 'coin', texto: tx('+{v} créditos', { v: fmt(cred) }) });
    }
    this.refreshInventory();
    m.titulo.setText(raridade === 'combo' ? tx('COMBO!') : tx('BAÚ ABERTO!'));
    m.subtitulo.setText('');
    // raridade de cada baú (o escolhido em destaque; os outros mostram o que você deixou)
    m.baus.forEach((b, k) => {
      const r = k === i ? raridade : m.conteudos[k].raridade;
      fixo(this.add.text(b.x, b.y - 75, (k === i ? '' : tx('tinha: ')) + NOMES[r], {
        fontFamily: 'Arial Black, Arial', fontSize: k === i ? '22px' : '13px', color: CORES[r], stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5), 3);
    });
    // painel da recompensa
    const y0 = H - 135;
    fixo(this.add.rectangle(W / 2, y0 + 20, 620, 110, 0x0f172a, 0.95).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(CORES[raridade]).color), 3);
    if (m.comboId) {
      const d = WEAPONS[m.comboId];
      [[W / 2 - 100, iconeDe(m.comboId)], [W / 2, iconeDe(d.evo)], [W / 2 + 100, iconeDe(m.comboId, true)]].forEach(([x, k]) =>
        fixo(this.add.image(x, y0 + 8, k).setDisplaySize(48, 48), 4));
      ['+', '='].forEach((t, k) => fixo(this.add.text(W / 2 - 50 + k * 100, y0 + 8, t, { fontFamily: 'Arial Black, Arial', fontSize: '26px', color: '#fde047' }).setOrigin(0.5), 4));
      fixo(this.add.text(W / 2, y0 + 50, '★ ' + d.evoName + ' ★' + (m.comboNovo ? '   ' + tx('(COMBO DESCOBERTO! guardado no códex)') : ''), { fontFamily: 'Arial', fontSize: '15px', color: '#f5d0fe' }).setOrigin(0.5), 4);
      const vc = VISUAL_COMBOS[m.comboId];   // o que muda no visual (RN-80)
      if (vc) fixo(this.add.text(W / 2, y0 + 68, tx(vc.efeito), { fontFamily: 'Arial', fontSize: '12px', color: '#fde68a' }).setOrigin(0.5), 4);
    } else {
      ganhos.forEach((g, k) => {
        const x = W / 2 + (k - (ganhos.length - 1) / 2) * 130;
        fixo(this.add.image(x, y0 + 2, g.icone).setDisplaySize(38, 38), 4);
        fixo(this.add.text(x, y0 + 30, g.texto, { fontFamily: 'Arial', fontSize: '12px', color: '#ffffff', align: 'center', wordWrap: { width: 124 } }).setOrigin(0.5, 0), 4);
      });
    }
    const btn = makeButton(this, W / 2, H - 28, 180, 34, tx('CONTINUAR'), () => this.modalPick(0), { fixed: true, depth: 205, color: 0x166534, stroke: 0x4ade80 });
    m.parts.push(btn);
    m.fase = 'revelado';
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
    if (this.modo === 'prologo' && this.danoPrologo(d)) return;   // src/prologo.js decide (a nave só cai na nave-mãe)
    this.ultimoDanoTempo = this.elapsed;
    this.invuln = 0.5;
    this.hp -= d;
    tocarSom(this, 'dano');
    this.cameras.main.shake(80, 0.006);
    this.player.setTint(0xff6666);
    this.time.delayedCall(120, () => { if (this.player.active) this.player.clearTint(); });
    if (this.hp <= 0 && this.modo === 'prologo') { this.hp = 1; this.destruirEclipse(); return; }   // prólogo: a cena final
    if (this.hp <= 0) {
      this.boom(this.player.x, this.player.y, 30, 0xf97316);
      this.player.setVisible(false);
      this.endRun(this.modo === 'arena' ? 'arena' : this.vitoriaRegistrada ? 'victory' : 'dead', this.primeiraVitoria);
    }
  }

  // ---------- FIM DA PARTIDA ----------
  // Chefe derrotado: solta um baú e créditos; não libera nave nem galáxia (RN-04)
  onBossDefeated(e) {
    const c = EVENTOS.chefes[e.chefe || 0];
    this.dropPickup(e.x, e.y, 'chest');
    const bonus = c.creditos * this.gal.rewardMult;
    this.bonus += bonus; this.runCredits += bonus;
    clarao(this, 300, 0xffffff);
    this.banner(tx('CHEFE DERROTADO! +{v} créditos', { v: fmt(bonus) }), '#86efac');
    this.boss = this.chefeVivo();
  }

  endRun(reason, firstClear) {
    if (this.ended) return;
    if (this.menuPausa) this.fecharPausa();
    this.ended = true;
    this.physics.pause();
    if (this.modal) { this.modal.parts.forEach((p) => p.destroy()); this.modal = null; }
    // resultado de cada modo (recordes no aparelho: SAVE.recordes)
    let extraModo = '', titulo = null, corTitulo = null;
    if (this.modo === 'arena') {
      const lugar = this.colocacaoArena(), premio = (ARENA.premio[lugar - 1] || 0) * this.gal.rewardMult;
      this.runCredits += premio;
      const r = SAVE.recordes.arena;
      r.partidas++;
      if (lugar === 1) r.vitorias++;
      const melhorou = !r.melhor || lugar < r.melhor;
      if (melhorou) r.melhor = lugar;
      titulo = lugar === 1 ? tx('VITÓRIA! 1º LUGAR') : tx('{n}º LUGAR', { n: lugar });
      corTitulo = lugar === 1 ? '#fde047' : lugar <= 3 ? '#86efac' : '#e2e8f0';
      extraModo = tx('Prêmio da colocação: {v} créditos', { v: fmt(premio) }) + '   ' + tx('Naves abatidas: {n}', { n: this.rivaisAbatidos }) +
        (melhorou && lugar > 1 ? '\n' + tx('Sua melhor colocação até agora!') : '');
    } else if (this.modo === 'infinito') {
      const pontos = this.pontosAtuais(), id = this.ship.id, ant = SAVE.recordes.infinito[id];
      const novo = !ant || pontos > ant.pontos;
      if (novo) SAVE.recordes.infinito[id] = { pontos, tempo: this.elapsed, abates: this.kills };
      extraModo = tx('Pontos: {p}', { p: fmt(pontos) }) + '   ' + (novo ? tx('NOVO RECORDE!') : tx('Recorde: {p}', { p: fmt(ant.pontos) }));
    }
    this.bankCredits();
    SAVE.stats.tempoTotal += this.elapsed;
    this.atualizarProgresso();
    writeSave(SAVE);

    const titles = { victory: tx('GALÁXIA CONQUISTADA!'), dead: tx('NAVE DESTRUÍDA'), retreat: tx('MISSÃO ENCERRADA'), arena: titulo };
    const colors = { victory: '#86efac', dead: '#f87171', retreat: '#a5f3fc', arena: corTitulo };
    if (this.modo === 'arena' && reason === 'retreat') { titles.retreat = titulo; colors.retreat = corTitulo; }
    const D = 300;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setScrollFactor(0).setDepth(D).setInteractive();
    this.add.rectangle(W / 2, H / 2, 480, 320, 0x0f172a).setStrokeStyle(3, 0x60a5fa).setScrollFactor(0).setDepth(D + 1);
    this.add.text(W / 2, H / 2 - 120, titles[reason], {
      fontFamily: 'Arial Black, Arial', fontSize: '28px', color: colors[reason], stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    const found = this.pois.filter((p) => p.discovered).length;
    const evolved = this.weapons.filter((w) => w.evolved).map((w) => WEAPONS[w.id].evoName);
    let body = tx('Tempo: {tempo}   Abates: {a}   Nível: {n}', { tempo: fmtTime(this.elapsed), a: this.kills, n: this.level }) +
      '\n' + tx('Locais descobertos: {n}/{total}', { n: found, total: this.pois.length }) +
      (evolved.length ? '\n' + tx('Combos: {lista}', { lista: evolved.join(', ') }) : '') +
      (extraModo ? '\n' + extraModo : '') +
      '\n\n' + tx('Créditos ganhos: {v}', { v: fmt(this.runCredits) });
    if (reason === 'victory' && firstClear && SHIPS[this.gi + 1]) body += '\n\n' + tx('Nova nave disponível no hangar: {nave}!', { nave: SHIPS[this.gi + 1].name });
    this.add.text(W / 2, H / 2 - 5, body, { fontFamily: 'Arial', fontSize: '16px', color: '#e2e8f0', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 2);
    makeButton(this, W / 2, H / 2 + 120, 220, 40, tx('VOLTAR AO HANGAR'), () => this.scene.start('Hangar'),
      { fixed: true, depth: D + 3, color: 0x166534, stroke: 0x4ade80 });
  }
}

