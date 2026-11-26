// ============ ARENA: BATTLE ROYALE CONTRA NAVES DO COMPUTADOR (RN-69) ============
// Você + 9 naves rivais. A zona segura encolhe; fora dela a nave perde vida.
// Chefes aparecem caçando o jogador. Vence a última nave viva.
// As naves rivais ficam no mesmo grupo dos inimigos (this.enemies): assim todas as armas
// do jogador já miram e acertam nelas sem código novo. A "cabeça" delas fica aqui.
// Números em src/dados/modos.js (ARENA).

const _NAVES_RIVAIS = ['ship_falcao', 'ship_tita', 'ship_agulha'];

Object.assign(GameScene.prototype, {
  iniciarArena() {
    this.zona = { x: this.player.x, y: this.player.y, r: ARENA.zonaInicial };
    this.rivais = [];
    this.tracos = [];          // linhas de tiro entre rivais e monstros (desenhadas por alguns quadros)
    this.arenaChefes = 0;
    this.zonaTimer = 0;
    this.gfxZona = this.add.graphics().setDepth(4);
    const nomes = Phaser.Utils.Array.Shuffle(ARENA.nomes.slice());
    for (let i = 0; i < ARENA.rivais; i++) {
      const a = (i / ARENA.rivais) * Math.PI * 2 + Math.random() * 0.4, d = 600 + Math.random() * 700;
      this.criarRival(this.zona.x + Math.cos(a) * d, this.zona.y + Math.sin(a) * d, nomes[i % nomes.length], ARENA.cores[i % ARENA.cores.length], i);
    }
    this.banner(tx('ARENA: seja a última nave viva!'), '#fde047');
  },

  criarRival(x, y, nome, cor, i) {
    const key = _NAVES_RIVAIS[i % _NAVES_RIVAIS.length];
    const e = this.enemies.get(x, y, key);
    if (!e) return null;
    e.setTexture(key).setScale(1.1).setRotation(0).setAlpha(1);
    e.enableBody(true, x, y, true, true);
    e.setDepth(7).setTint(cor);
    e.body.setCircle(14, e.width / 2 - 14, e.height / 2 - 14);
    e.isRival = true; e.isBoss = false; e.isElite = false; e.straight = null;
    e.nomeRival = nome; e.corRival = cor; e.nivelRival = 1;
    e.maxHp = e.hp = ARENA.rival.vida * this.gal.hpMult;
    e.damage = 6; e.reward = 0; e.xpVal = 12; e.hitR = 16;
    e.speedV = ARENA.rival.velocidade; e.velBase = e.speedV;
    e.flash = 0; e.orbHit = 0; e.kbT = 0; e.kbx = 0; e.kby = 0; e.flank = 0;
    e.comp = null; e.idInimigo = null; e.intangivel = false; e.parado = false; e.semRecompensa = false;
    e.atordoado = 0; e.atordoamentos = 0; e.roubadas = 0; e.ultimoDano = 0;
    e.est = { lado: Math.random() < 0.5 ? -1 : 1, semente: Math.random() * 10 };
    e.tiroT = 0.5 + Math.random(); e.pensarT = 0; e.alvo = null; e.vagar = null; e.vagarT = 0;
    e.rotulo = this.add.text(x, y - 30, '', { fontFamily: 'Arial', fontSize: '11px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(13);
    this.rivais.push(e);
    return e;
  },

  rivaisVivos() { let n = 0; for (let i = 0; i < this.rivais.length; i++) if (this.rivais[i].active && this.rivais[i].isRival) n++; return n; },

  // Raio da zona no tempo atual; depois dos 8 minutos ela fecha de vez em 1 minuto
  raioZonaAgora() {
    const t = this.elapsed;
    if (t <= ARENA.duracao) return raioDaZona(t);
    return Math.max(0, ARENA.zonaFinal * (1 - (t - ARENA.duracao) / 60));
  },

  // Chamado a cada quadro pelo update da partida, depois dos inimigos
  updateArena(dt) {
    const z = this.zona;
    z.r = this.raioZonaAgora();
    // zona: desenha o círculo (vermelho mais forte quando o jogador está fora)
    const px = this.player.x, py = this.player.y;
    const fora = Math.hypot(px - z.x, py - z.y) > z.r;
    this.gfxZona.clear();
    this.gfxZona.lineStyle(fora ? 8 : 5, 0xef4444, fora ? 0.95 : 0.7).strokeCircle(z.x, z.y, Math.max(1, z.r));
    // fora da zona: perde vida aos poucos (a cada meio segundo, com aviso na tela)
    this.zonaTimer -= dt;
    if (fora && this.zonaTimer <= 0) {
      this.zonaTimer = 0.5;
      this.hurt(this.mods.maxHp * ARENA.danoZonaPorSegundo * 0.5 * (this.elapsed > ARENA.duracao ? 2 : 1));
    }
    if (this.ended) return;
    // chefes que caçam o jogador
    if (this.arenaChefes < ARENA.chefes.length && this.elapsed >= ARENA.chefes[this.arenaChefes]) {
      this.spawnBoss(this.arenaChefes % EVENTOS.chefes.length);
      this.arenaChefes++;
    }
    // rivais
    const minuto = this.elapsed / 60;
    for (let i = 0; i < this.rivais.length; i++) {
      const e = this.rivais[i];
      if (!e.active || !e.isRival) continue;
      this.pensarRival(e, dt, minuto);
    }
    // linhas de tiro entre rivais e monstros (o gfxInimigos é limpo a cada quadro em updateEnemies)
    const g = this.gfxInimigos;
    for (let i = this.tracos.length - 1; i >= 0; i--) {
      const tr = this.tracos[i];
      tr.t -= dt;
      if (tr.t <= 0) { this.tracos.splice(i, 1); continue; }
      g.lineStyle(2, tr.cor, Math.min(1, tr.t * 10)).lineBetween(tr.x1, tr.y1, tr.x2, tr.y2);
    }
    if (this.rivaisVivos() === 0) this.endRun('arena', 1);
  },

  // Movimento é decidido em updateEnemies (velocidade); aqui: nível, alvo, tiros, dano da zona
  pensarRival(e, dt, minuto) {
    const z = this.zona, R = ARENA.rival;
    // sobe de nível com o tempo: mais vida e mais dano
    const nivel = 1 + Math.floor(this.elapsed / R.nivelACada);
    if (nivel > e.nivelRival) {
      const novoMax = R.vida * this.gal.hpMult * (1 + R.vidaPorMinuto * minuto);
      e.hp = e.hp / e.maxHp * novoMax; e.maxHp = novoMax; e.nivelRival = nivel;
    }
    // rótulo e barra de vida
    e.rotulo.setPosition(e.x, e.y - 32).setText(e.nomeRival + ' ' + tx('Nv {n}', { n: e.nivelRival }));
    const g = this.gfxInimigos, f = Math.max(0, e.hp / e.maxHp);
    g.fillStyle(0x000000, 0.7).fillRect(e.x - 18, e.y - 24, 36, 5);
    g.fillStyle(f > 0.5 ? 0x4ade80 : f > 0.25 ? 0xfacc15 : 0xef4444, 1).fillRect(e.x - 18, e.y - 24, 36 * f, 5);
    // fora da zona: perde vida
    if (Math.hypot(e.x - z.x, e.y - z.y) > z.r) e.hp -= e.maxHp * ARENA.danoZonaPorSegundo * dt * (this.elapsed > ARENA.duracao ? 2 : 1);
    // escolhe o alvo de tempos em tempos (não a cada quadro: economiza processamento)
    e.pensarT -= dt;
    if (e.pensarT <= 0) {
      e.pensarT = 0.6;
      e.alvo = this.escolherAlvoRival(e);
      // monstros encostados machucam a nave rival
      const perto = this.contarMonstrosPerto(e.x, e.y, 34);
      if (perto) e.hp -= perto * 3 * linhaDoMinuto(ONDAS, this.tempoInimigos()).dano;
    }
    // atira
    e.tiroT -= dt;
    if (e.tiroT <= 0 && e.alvo && e.alvo.active) {
      e.tiroT = R.recarga * (0.85 + Math.random() * 0.3);
      const dano = R.dano * (1 + R.danoPorMinuto * minuto) * Math.sqrt(this.gal.hpMult);
      const a = e.alvo;
      if (a === this.player) {
        const b = this.enemyShot(e.x, e.y, Math.atan2(a.y - e.y, a.x - e.x) + (Math.random() - 0.5) * 0.15, 300);
        if (b) { b.dmg = dano; b.setTint(e.corRival); }
      } else {
        this.tracos.push({ x1: e.x, y1: e.y, x2: a.x, y2: a.y, t: 0.12, cor: e.corRival });
        if (a.isRival) { a.hp -= dano * ARENA.rival.danoEntreRivais; if (a.hp <= 0) this.eliminarRival(a, false); }
        else {
          a.semRecompensaRival = true;               // monstro morto por rival não dá pontos ao jogador
          this.damageTarget(a, dano * 3);
          if (a.active) a.semRecompensaRival = false;
        }
      }
    }
    if (e.hp <= 0 && e.active) this.eliminarRival(e, false);
  },

  escolherAlvoRival(e) {
    const alc = ARENA.rival.alcance, alc2 = alc * alc;
    const dj = (this.player.x - e.x) ** 2 + (this.player.y - e.y) ** 2;
    if (!this.ended && dj < alc2 && Math.random() < 0.55) return this.player;
    let melhor = null, md = alc2;
    if (Math.random() > ARENA.rival.chanceDeBrigar) return this.monstroMaisPerto(e.x, e.y, 320) || (dj < alc2 ? this.player : null);
    for (let i = 0; i < this.rivais.length; i++) {
      const o = this.rivais[i];
      if (o === e || !o.active || !o.isRival) continue;
      const d = (o.x - e.x) ** 2 + (o.y - e.y) ** 2;
      if (d < md) { md = d; melhor = o; }
    }
    if (melhor) return melhor;
    if (dj < alc2) return this.player;
    return this.monstroMaisPerto(e.x, e.y, 320);
  },

  // procura na grade de inimigos (montada em updateEnemies), sem percorrer todos
  monstroMaisPerto(x, y, raio) {
    const CELL = 48, grid = this.gradeInimigos, r2 = raio * raio, n = Math.ceil(raio / CELL);
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    let melhor = null, md = r2;
    for (let ox = -n; ox <= n; ox++) for (let oy = -n; oy <= n; oy++) {
      const arr = grid.get((cx + ox) * 100003 + (cy + oy));
      if (!arr) continue;
      for (let j = 0; j < arr.length; j++) {
        const o = arr[j];
        if (!o.active || o.isRival || o.isBoss) continue;
        const d = (o.x - x) ** 2 + (o.y - y) ** 2;
        if (d < md) { md = d; melhor = o; }
      }
    }
    return melhor;
  },
  contarMonstrosPerto(x, y, raio) {
    const CELL = 48, grid = this.gradeInimigos, r2 = raio * raio;
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    let n = 0;
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      const arr = grid.get((cx + ox) * 100003 + (cy + oy));
      if (!arr) continue;
      for (let j = 0; j < arr.length; j++) { const o = arr[j]; if (o.active && !o.isRival && (o.x - x) ** 2 + (o.y - y) ** 2 < r2) n++; }
    }
    return n;
  },

  // Velocidade da nave rival (chamada por updateEnemies no lugar do comportamento de monstro)
  movimentoRival(e, dt) {
    const z = this.zona, v = e.speedV;
    const dzx = z.x - e.x, dzy = z.y - e.y, dz = Math.hypot(dzx, dzy) || 1;
    // 1) fora (ou quase fora) da zona: volta para dentro
    if (dz > z.r * 0.8) return { vx: dzx / dz * v, vy: dzy / dz * v };
    const a = e.alvo;
    if (a && a.active) {
      const dx = a.x - e.x, dy = a.y - e.y, d = Math.hypot(dx, dy) || 1;
      // 2) pouca vida e o jogador perto: foge
      if (a === this.player && e.hp < e.maxHp * 0.3) return { vx: -dx / d * v, vy: -dy / d * v };
      // 3) luta: fica a uma distância média e anda de lado
      if (d > 360) return { vx: dx / d * v, vy: dy / d * v };
      if (d < 220) return { vx: -dx / d * v, vy: -dy / d * v };
      return { vx: -dy / d * v * 0.8 * e.est.lado, vy: dx / d * v * 0.8 * e.est.lado };
    }
    // 4) sem alvo: passeia por dentro da zona
    e.vagarT -= dt;
    if (!e.vagar || e.vagarT <= 0) {
      const ang = Math.random() * Math.PI * 2, dd = Math.random() * z.r * 0.6;
      e.vagar = { x: z.x + Math.cos(ang) * dd, y: z.y + Math.sin(ang) * dd }; e.vagarT = 3 + Math.random() * 3;
    }
    const wx = e.vagar.x - e.x, wy = e.vagar.y - e.y, wd = Math.hypot(wx, wy) || 1;
    return { vx: wx / wd * v * 0.7, vy: wy / wd * v * 0.7 };
  },

  eliminarRival(e, peloJogador) {
    if (!e.active || !e.isRival) return;
    e.isRival = false;
    this.boom(e.x, e.y, 26, e.corRival);
    tocarSom(this, 'explosao');
    if (e.rotulo) { e.rotulo.destroy(); e.rotulo = null; }
    // deixa o que tinha: um baú e XP
    this.dropPickup(e.x, e.y, 'chest', 'rival');
    this.dropGem(e.x, e.y, e.xpVal);
    if (peloJogador) { this.kills++; this.rivaisAbatidos = (this.rivaisAbatidos || 0) + 1; }
    e.disableBody(true, true);
    const vivos = this.rivaisVivos();
    this.banner(tx('{nome} foi eliminado! Restam {n}', { nome: e.nomeRival, n: vivos + 1 }), peloJogador ? '#86efac' : '#e2e8f0');
  },

  // colocação do jogador: 1 + quantos rivais ainda estão vivos
  colocacaoArena() { return 1 + this.rivaisVivos(); }
});
