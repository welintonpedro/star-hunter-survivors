// ============ PRÓLOGO ROTEIRIZADO (RN-73) ============
// Partida de ~4 a 5 minutos para quem abre o jogo pela primeira vez. Ensina fazendo:
// tela cheia → mover → a nave atira sozinha → joias → cartas (RECOMENDADO) → horda → baú →
// meteoro com lança-chamas → pausa → cerco + arma suprema → subchefe → chefe → nave-mãe →
// a Eclipse é destruída → entidade encapuzada: "Volte para seu tempo!" → menu do jogo.
// Tempos de cada passo em src/dados/prologo.js (ROTEIRO_PROLOGO).

const _VOZ_IDIOMA = { pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', tr: 'tr-TR' };

// Lê o texto em voz alta (crianças que ainda não leem entendem). Nunca dá erro sem voz.
function falarTexto(texto, voz) {
  try {
    if (typeof speechSynthesis === 'undefined' || PREFS.volume <= 0) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto.replace(/\n/g, ' '));
    u.lang = _VOZ_IDIOMA[IDIOMA] || 'en-US';
    u.rate = (voz && voz.rate) || 1; u.pitch = (voz && voz.pitch) || 1.1; u.volume = PREFS.volume;
    speechSynthesis.speak(u);
  } catch (e) { /* sem voz: segue só com o texto */ }
}

Object.assign(GameScene.prototype, {
  iniciarPrologo() {
    this.ritmoParado = true;               // quem manda nos monstros é o roteiro
    const I = PROLOGO_INICIO;
    // a Eclipse já começa forte
    this.weapons = []; this.passives = {};
    I.armas.forEach(([id, n]) => { this.addWeapon(id); const w = this.weapons.find((x) => x.id === id); if (w) w.level = n; });
    I.itens.forEach(([id, n]) => { this.passives[id] = n; });
    this.level = I.nivel; this.xp = 0; this.xpNext = I.xpPorNivel;
    this.recalc(); this.hp = this.mods.maxHp;
    this.refreshInventory();
    const D = 300;
    this.pr = {
      i: -1, t: 0, eventos: {}, andou: 0, ux: this.player.x, uy: this.player.y, killsIni: 0, ondaT: 0,
      fala: this.add.text(W / 2, 118, '', { fontFamily: 'Arial Black, Arial', fontSize: '26px', color: '#fde047', stroke: '#000000', strokeThickness: 7, align: 'center', wordWrap: { width: 820 } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D),
      mao: this.add.image(0, 0, 'mao').setScale(6).setScrollFactor(0).setDepth(D).setVisible(false),
      seta: this.add.triangle(0, 0, 0, -14, 30, 0, 0, 14, 0xfde047).setStrokeStyle(3, 0x000000).setDepth(15).setVisible(false),
      setaHud: this.add.triangle(0, 0, -16, 0, 16, 0, 0, -26, 0xfde047).setStrokeStyle(3, 0x000000).setScrollFactor(0).setDepth(D).setVisible(false),
      alvo: null
    };
    // botão TELA CHEIA no alto, no lugar do "recolher nave" (sem cobrir o mapa); no iPhone não existe
    if (this.scale.fullscreen.available && !NA_POKI) {   // no Poki, a tela cheia é do próprio site
      this.btnTelaCheia = makeButton(this, W - 140, 26, 160, 30, tx('TELA CHEIA'), () => {
        if (this.scale.isFullscreen) this.scale.stopFullscreen(); else this.scale.startFullscreen();
      }, { fixed: true, depth: 151, size: 13, color: 0x166534, stroke: 0x4ade80 });
    }
    // pular a história: no canto, desde o início (regra do Poki: toda introdução pode ser pulada)
    this.pr.pular = makeButton(this, W - 76, H - 24, 132, 30, tx('PULAR HISTÓRIA'), () => this.terminarPrologo(), { fixed: true, depth: 151, size: 12, color: 0x334155, stroke: 0xe2e8f0 });
    this.proximoPassoPrologo();
  },

  falaPrologo(texto, cor) {
    const f = this.pr.fala;
    f.setText(texto).setColor(cor || '#fde047').setScale(1);
    this.tweens.add({ targets: f, scale: { from: 0.6, to: 1 }, duration: 280, ease: 'Back.easeOut' });
    falarTexto(texto);
  },

  passoAtual() { return this.pr && ROTEIRO_PROLOGO[this.pr.i]; },

  proximoPassoPrologo() {
    const pr = this.pr;
    pr.i++; pr.t = 0; pr.eventos = {};
    pr.mao.setVisible(false); this.tweens.killTweensOf(pr.mao); pr.mao.setScale(6);
    pr.setaHud.setVisible(false); this.tweens.killTweensOf(pr.setaHud);
    pr.alvo = null;
    if (this.painelTeclas && this.painelTeclasAte === Infinity) this.esconderTeclas();
    const passo = ROTEIRO_PROLOGO[pr.i];
    if (!passo) return;
    const id = passo.id, toque = this.toque;
    if (id === 'abertura') {
      this.falaPrologo(tx('Ano 3025. Abismo Violeta.'), '#e9d5ff');
      this.time.delayedCall(4200, () => { if (this.passoAtual() && this.passoAtual().id === 'abertura') this.falaPrologo(tx('Você pilota a Eclipse, a nave mais forte do universo!')); });
      this.ondaPrologo(30);   // já começa com ação
    } else if (id === 'telaCheia') {
      if (!this.btnTelaCheia || this.scale.isFullscreen) { pr.t = 999; return; }   // sem tela cheia (iPhone) ou já está: pula
      this.falaPrologo(tx('Toque em TELA CHEIA para jogar maior!'));
      this.apontarHud(W - 140, 62);
    } else if (id === 'mover') {
      if (toque) {
        this.falaPrologo(tx('Arraste o botão MOVER para voar!'));
        const c = this.joyCasa || { x: 120, y: H - 120 };
        pr.mao.setVisible(true).setPosition(c.x, c.y + 30);
        this.tweens.add({ targets: pr.mao, x: c.x + 45, y: c.y - 15, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else {
        this.falaPrologo(tx('Use as setas ou W A S D para voar!'));
        this.mostrarTeclas(0, true);
      }
      pr.andou = 0; pr.ux = this.player.x; pr.uy = this.player.y;
    } else if (id === 'atirar') {
      this.falaPrologo(tx('Sua nave atira sozinha!\nFique perto dos monstros!'));
      pr.killsIni = this.kills;
      this.ondaPrologo(20);
    } else if (id === 'joias') {
      this.falaPrologo(tx('Pegue as joias brilhantes para subir de nível!'));
      pr.ondaT = 0;   // a próxima leva de monstros já vem (a tela não esvazia durante a aula)
      this.xp = Math.max(this.xp, this.xpNext - 2);
      pr.forcarCarta = true;   // a próxima subida de nível mostra as 3 cartas (aula), mesmo que já tenha visto uma antes
    } else if (id === 'cartas') {
      this.falaPrologo(tx('Escolha uma carta!\nNa dúvida, pegue a RECOMENDADA.'));
      pr.cartaExplicada = true;
      if (!this.modal) { pr.forcarCarta = true; this.gainXp(this.xpNext); }   // não pegou joia a tempo: sobe de nível assim mesmo
      this.maoNaRecomendada();
    } else if (id === 'horda') {
      this.falaPrologo(tx('Cada nível te deixa mais forte.\nDestrua todos!'));
    } else if (id === 'bau') {
      this.falaPrologo(tx('Um baú! Passe por cima para abrir!'));
      const a = Math.random() * Math.PI * 2;
      this.dropPickup(this.player.x + Math.cos(a) * 220, this.player.y + Math.sin(a) * 220, 'chest');
    } else if (id === 'meteoro') {
      this.falaPrologo(tx('Quebre o meteoro!\nÀs vezes ele guarda um poder.'));
      const a = Math.random() * Math.PI * 2;
      pr.meteoro = this.criarMeteoro(this.player.x + Math.cos(a) * 200, this.player.y + Math.sin(a) * 200, false);
      this.forcarItemMeteoro = 'chamas';
    } else if (id === 'chamas') {
      if (this.chamasAte <= this.elapsed) this.chamasAte = this.elapsed + PODER_CHAMAS_S;
      this.falaPrologo(tx('LANÇA-CHAMAS! Queime todos eles!'), '#fb923c');
      this.ondaPrologo(40);
    } else if (id === 'pausa') {
      this.falaPrologo(toque ? tx('Precisa parar? Toque no botão II.') : tx('Precisa parar? Aperte ESC ou P.'), '#a5f3fc');
      this.apontarHud(W - 30, 62);
    } else if (id === 'cerco') {
      this.falaPrologo(tx('Cuidado, eles te cercaram!'), '#fca5a5');
      this.spawnRing();
      this.forcarSuprema = 'laser';             // a próxima carta mostra uma arma suprema
      this.xp = Math.max(this.xp, this.xpNext - 2);
    } else if (id === 'subchefe') {
      this.falaPrologo(tx('Um SUBCHEFE! Derrote ele!'), '#fca5a5');
      pr.subIni = this.subchefesMortos;
      this.subchefePrologo();
    } else if (id === 'chefe') {
      this.falaPrologo(tx('O CHEFE DA GALÁXIA!\nVocê consegue!'), '#fca5a5');
      pr.chefeIni = this.chefesMortos;
      this.spawnBoss(2);
      this.enemies.children.iterate((e) => { if (e && e.active && e.isBoss) { e.hp *= PROLOGO_INICIO.vidaChefe; e.maxHp *= PROLOGO_INICIO.vidaChefe; } });
    } else if (id === 'vitoria') {
      this.falaPrologo(tx('VITÓRIA! A galáxia é sua!'), '#86efac');
      this.ondaPrologo(30);   // mais monstros chegando: não deixa a tela vazia
      tocarSom(this, 'conquista');
      for (let k = 0; k < 10; k++) this.time.delayedCall(k * 180, () => this.boom(this.player.x + (Math.random() - 0.5) * 360, this.player.y + (Math.random() - 0.5) * 220, 12, [0xfde047, 0x4ade80, 0x60a5fa, 0xf0abfc][k % 4]));
    } else if (id === 'naveMae') {
      this.chegarNaveMaePrologo();
    } else if (id === 'fim') {
      this.destruirEclipse();
    }
  },

  // Chamado a cada quadro pela partida
  updatePrologo(dt) {
    const pr = this.pr;
    if (!pr || pr.acabando) return;
    const passo = ROTEIRO_PROLOGO[pr.i];
    if (!passo) return;
    pr.t += dt;
    const id = passo.id;
    let pronto = false;
    if (id === 'abertura' || id === 'telaCheia') this.manterOnda(dt, 1.5, 10, 50);   // ação desde o primeiro segundo
    if (id === 'telaCheia') pronto = this.scale.isFullscreen;
    else if (id === 'mover') {
      this.manterOnda(dt, 1.5, 10, 55);
      pr.andou += Math.hypot(this.player.x - pr.ux, this.player.y - pr.uy);
      pr.ux = this.player.x; pr.uy = this.player.y;
      pronto = pr.andou > 380;
    } else if (id === 'atirar') {
      pronto = this.kills - pr.killsIni >= 30;
      this.manterOnda(dt, 2.5, 12, 60);
      this.surpresaPrologo(pr, 12, 'sub1', () => this.subchefePrologo());   // ~40 s: primeiro subchefe
    } else if (id === 'joias') {
      pronto = !!pr.eventos.carta;
      this.manterOnda(dt, 2, 10, 55);   // os monstros não somem enquanto ele busca a joia (RN-79)
      const gema = this.gemaMaisPerto();
      this.apontarSeta(gema);
      // joia longe ou nenhuma: põe uma pertinho, para a aula não demorar
      if (!gema || Math.hypot(gema.x - this.player.x, gema.y - this.player.y) > 320) {
        if (!pr.joiaPerto) { pr.joiaPerto = true; this.dropGem(this.player.x + 140, this.player.y, 3); }
      }
    } else if (id === 'cartas') {
      pronto = !!pr.eventos.fechou;
      // garantia: se por algum motivo as cartas não abriram, abre de novo (o prólogo nunca pode travar)
      if (!pronto && !this.modal && pr.t > 1.5 && !pr.cartaDeNovo) { pr.cartaDeNovo = true; pr.forcarCarta = true; this.gainXp(this.xpNext); }
      if (!pronto && !this.modal && pr.t > 3) pronto = true;
    }
    else if (id === 'horda') {
      this.manterOnda(dt, 2, 12, 90);   // horda: cheia, mas sem sufocar
      this.surpresaPrologo(pr, 6, 'enxame1', () => { this.spawnSwarm(); this.banner(tx('ENXAME!'), '#fde047'); });
      this.surpresaPrologo(pr, 16, 'sub2', () => this.subchefePrologo());
      this.surpresaPrologo(pr, 28, 'sub3', () => { this.subchefePrologo(); this.subchefePrologo(); });
    }
    else if (id === 'bau') {
      pronto = !!pr.eventos.bau;
      let bau = null; this.pickups.children.iterate((p) => { if (p && p.active && p.ptype === 'chest') bau = p; });
      this.apontarSeta(bau);
      this.manterOnda(dt, 2, 12, 70);
    } else if (id === 'meteoro') {
      pronto = this.chamasAte > this.elapsed;
      let item = null; this.pickups.children.iterate((p) => { if (p && p.active && p.ptype === 'chamas') item = p; });
      this.apontarSeta(item || (pr.meteoro && pr.meteoro.active ? pr.meteoro : null));
      this.manterOnda(dt, 2, 12, 70);
    } else if (id === 'chamas') this.manterOnda(dt, 1.2, 14, 140);
    else if (id === 'pausa') this.manterOnda(dt, 2, 8, 80);
    else if (id === 'cerco') { this.manterOnda(dt, 1.6, 14, 140); if (pr.t > 12 && pr.t < 13) this.spawnRing(); }
    else if (id === 'subchefe') { pronto = this.subchefesMortos > pr.subIni; this.manterOnda(dt, 3, 8, 60); }
    else if (id === 'chefe') { pronto = this.chefesMortos > pr.chefeIni; this.manterOnda(dt, 3, 8, 60); }
    else if (id === 'vitoria') this.manterOnda(dt, 1, 16, 90);          // a ação não para depois do chefe
    else if (id === 'naveMae') this.manterOnda(dt, 0.8, 18, 140);      // a nave-mãe chega com um exército
    if (pr.t >= passo.min && (pronto || pr.t >= passo.max || passo.min === passo.max)) {
      if (id === 'chefe' && !pronto) {   // demorou demais: o chefe cai (o prólogo não pode travar)
        this.enemies.children.iterate((e) => { if (e && e.active && e.isBoss) this.damageTarget(e, e.hp + 1); });
      }
      this.proximoPassoPrologo();
    }
    if (pr.alvo) this.apontarSeta(pr.alvo);
    // a nave-mãe acompanha a Eclipse por cima (depois de descer)
    const m = this.naveMaePrologo;
    if (m && m.active && pr.t > 2.6) { m.x += (this.player.x - m.x) * Math.min(1, dt * 1.5); m.y += (this.player.y - 210 - m.y) * Math.min(1, dt * 1.5); }
  },

  // Avisos vindos da partida: carta aberta, carta escolhida, baú aberto
  eventoPrologo(nome) {
    const pr = this.pr;
    if (!pr || pr.acabando) return;
    pr.eventos[nome] = true;
    if (nome === 'fechou') pr.forcarCarta = false;   // a aula das cartas acabou: volta a escolher sozinho
    const id = this.passoAtual() && this.passoAtual().id;
    // a primeira carta da história: explica as cartas (no passo das joias, ou antes, se subiu de nível cedo)
    if (nome === 'carta' && id === 'joias') { pr.cartaExplicada = true; this.proximoPassoPrologo(); }
    else if (nome === 'carta' && !pr.cartaExplicada) {
      pr.cartaExplicada = true; pr.textoAntesCarta = pr.fala.text;
      this.falaPrologo(tx('Escolha uma carta!\nNa dúvida, pegue a RECOMENDADA.'));
      this.maoNaRecomendada();
    } else if (nome === 'carta' && !pr.cartaSuprema && this.cartaTemSuprema()) {
      pr.textoAntesCarta = pr.fala.text;
      pr.cartaSuprema = true;
      this.falaPrologo(tx('Uma ARMA SUPREMA! São raras e muito fortes.'), '#fde047');
      this.maoNaRecomendada();
    } else if (nome === 'carta') this.maoNaRecomendada();
    if (nome === 'fechou') {
      pr.mao.setVisible(false); this.tweens.killTweensOf(pr.mao);
      pr.fala.setFontSize(26).setY(118);
      if (pr.textoAntesCarta !== undefined) { pr.fala.setText(pr.textoAntesCarta); pr.textoAntesCarta = undefined; }   // volta o recado do passo
    }
    if (nome === 'bau' && id === 'bau') this.falaPrologo(tx('Escolha um dos 3 baús. É surpresa!'));
  },
  // Depois da lição das cartas, subir de nível no prólogo escolhe sozinho a RECOMENDADA, com um
  // aviso rápido, sem parar a ação (o menu de cartas só volta para mostrar a arma suprema).
  nivelAutomaticoPrologo() {
    const pr = this.pr;
    if (!pr || !pr.cartaExplicada || this.forcarSuprema || pr.forcarCarta) return false;
    let options = this.pickWeighted(this.upgradeOptions(), 3);
    if (options.length < 3) options = options.concat(this.pickWeighted(this.opcoesSobrecarga(), 3 - options.length));
    if (!options.length) return true;
    const o = options[this.indiceRecomendado(options)];
    this.applyOption(o);
    const nome = o.kind === 'weapon' ? WEAPONS[o.id].name : o.kind === 'passive' ? PASSIVES[o.id].name : o.kind === 'sobrecarga' ? SOBRECARGAS[o.id].nome : '';
    this.floatText(this.player.x, this.player.y - 40, tx('NÍVEL {n}!', { n: this.level }) + (nome ? '  +' + nome : ''), '#fde047');
    this.boom(this.player.x, this.player.y, 10, 0xfde047);
    this.openNextModal();   // se subiu vários níveis de uma vez, segue para o próximo
    return true;
  },
  cartaTemSuprema() { return this.modal && this.modal.options && this.modal.options.some((o) => o.kind === 'weapon' && WEAPONS[o.id].suprema); },
  // mãozinha pulando em cima da carta recomendada
  maoNaRecomendada() {
    const pr = this.pr;
    if (!this.modal || !this.modal.options) return;
    const n = this.modal.options.length, r = this.cartaRecomendada || 0;
    const x = W / 2 + (r - (n - 1) / 2) * 250;
    pr.mao.setVisible(true).setPosition(x + 40, H / 2 + 150);
    this.tweens.killTweensOf(pr.mao);
    this.tweens.add({ targets: pr.mao, y: H / 2 + 125, duration: 420, yoyo: true, repeat: -1 });
    // esconde o título "NÍVEL X! Escolha uma melhoria" e põe o recado numa linha só, acima das cartas
    this.modal.parts.forEach((p) => { if (p.type === 'Text' && p.y < 100) p.setVisible(false); });
    pr.fala.setText(pr.fala.text.replace(/\n/g, ' ')).setFontSize(21).setY(52);
  },

  // seta amarela no HUD (aponta para cima, para um botão)
  apontarHud(x, y) {
    const s = this.pr.setaHud;
    s.setVisible(true).setPosition(x, y);
    this.tweens.add({ targets: s, y: y + 12, duration: 400, yoyo: true, repeat: -1 });
  },
  // seta amarela perto da nave, apontando para algo no mundo
  apontarSeta(alvo) {
    const s = this.pr.seta;
    if (!alvo || !alvo.active) { s.setVisible(false); return; }
    const a = Math.atan2(alvo.y - this.player.y, alvo.x - this.player.x);
    s.setVisible(true).setPosition(this.player.x + Math.cos(a) * 64, this.player.y + Math.sin(a) * 64).setRotation(a);
  },
  gemaMaisPerto() {
    let gema = null, md = Infinity;
    this.gems.children.iterate((g) => { if (g && g.active) { const d = (g.x - this.player.x) ** 2 + (g.y - this.player.y) ** 2; if (d < md) { md = d; gema = g; } } });
    return gema;
  },

  // acontece uma vez só, quando o passo chega em "segundos"
  surpresaPrologo(pr, segundos, chave, fn) {
    if (pr.t >= segundos && !pr.eventos[chave]) { pr.eventos[chave] = true; fn(); }
  },
  // vida dos monstros do prólogo: cresce junto com o nível da Eclipse, senão morrem fora da tela
  vidaPrologo() {
    return PROLOGO_INICIO.vidaInimigos * (1 + PROLOGO_INICIO.vidaPorNivel * Math.max(0, this.level - PROLOGO_INICIO.nivel));
  },
  subchefePrologo() {
    const p = this.spawnPoint();
    this.spawnElite(p.x, p.y);
    // a vida do monstro comum já acompanha a força da Eclipse (vidaPrologo); o subchefe ganha um extra para durar na tela
    this.enemies.children.iterate((e) => { if (e && e.active && e.isElite && !e.__prologo) { e.__prologo = true; e.hp *= PROLOGO_INICIO.vidaSubchefe; e.maxHp *= PROLOGO_INICIO.vidaSubchefe; } });
  },

  // monstros do roteiro: n de uma vez, em volta da tela
  ondaPrologo(n) {
    const lista = INIMIGOS_POR_GALAXIA[this.gi];
    const ate = Math.min(lista.length, 3 + (this.pr ? this.pr.i : 0));   // mais tipos de monstro a cada passo
    for (let k = 0; k < n; k++) this.spawnEnemy(lista[Math.floor(Math.random() * ate)]);
  },
  // de "cada" em "cada" segundos, nascem "n" monstros, sem passar de "max" vivos
  manterOnda(dt, cada, n, max) {
    this.pr.ondaT -= dt;
    if (this.pr.ondaT > 0) return;
    this.pr.ondaT = cada;
    const vivos = this.contarComuns();
    if (vivos < max) this.ondaPrologo(Math.min(n, max - vivos));
  },

  // Antes da nave-mãe, a nave nunca cai (recebe pouco dano e para em 20% da vida)
  danoPrologo(d) {
    const id = this.passoAtual() && this.passoAtual().id;
    if (id === 'naveMae' || id === 'fim') return false;   // agora o dano é de verdade
    this.invuln = 0.5;
    this.hp = Math.max(this.mods.maxHp * 0.2, this.hp - d * PROLOGO_INICIO.danoRecebido);
    this.cameras.main.shake(60, 0.004);
    return true;
  },

  chegarNaveMaePrologo() {
    tocarSom(this, 'chefe');
    this.falaPrologo(tx('O que é aquilo?!'), '#fca5a5');
    clarao(this, 500, 0xffffff);
    this.cameras.main.shake(900, 0.012);
    this.banner(tx('A NAVE-MÃE CHEGOU!'), '#f87171');
    // a nave-mãe: enorme, escura, desce do alto
    const m = this.physics.add.sprite(this.player.x, this.player.y - 420, 'navemae_' + this.gi).setScale(5.5).setDepth(9).setTint(0x450a0a);
    this.naveMaePrologo = m;
    this.tweens.add({ targets: m, y: this.player.y - 210, duration: 2600, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: m, angle: 360, duration: 9000, repeat: -1 });
    // ela atira anéis de tiros cada vez mais rápidos
    this.pr.tirosMae = this.time.addEvent({ delay: 900, loop: true, callback: () => {
      if (this.ended || !m.active) return;
      for (let i = 0; i < 28; i++) { const b = this.enemyShot(m.x, m.y, i / 28 * Math.PI * 2 + Math.random() * 0.3, 260); if (b) b.dmg = this.mods.maxHp * 0.08; }
    } });
  },

  // A Eclipse é destruída por um raio gigante da nave-mãe
  destruirEclipse() {
    const pr = this.pr;
    if (pr.acabando) return;
    pr.acabando = true;
    if (pr.tirosMae) pr.tirosMae.remove(false);
    pr.fala.setText('');
    this.ended = true;                      // o jogo para; daqui em diante é só a cena
    pokiParado();                           // cena final não é jogo (regra do Poki)
    this.physics.pause();
    this.esconderTeclas();
    const m = this.naveMaePrologo, px = this.player.x, py = this.player.y;
    const mx = m ? m.x : px, my = m ? m.y : py - 300;
    const ang = Math.atan2(py - my, px - mx), dist = Math.hypot(px - mx, py - my);
    const raio = this.add.rectangle((mx + px) / 2, (my + py) / 2, dist, 10, 0xfca5a5, 1).setRotation(ang).setDepth(12);
    const nucleo = this.add.rectangle((mx + px) / 2, (my + py) / 2, dist, 4, 0xffffff, 1).setRotation(ang).setDepth(13);
    this.tweens.add({ targets: [raio, nucleo], scaleY: 6, duration: 700, yoyo: true, hold: 600 });
    this.cameras.main.shake(1500, 0.02);
    tocarSom(this, 'chefe');
    for (let k = 0; k < 9; k++) {
      this.time.delayedCall(250 + k * 160, () => { this.boom(px + (Math.random() - 0.5) * 70, py + (Math.random() - 0.5) * 70, 14, [0xf97316, 0xfde047, 0xf0abfc][k % 3]); tocarSom(this, 'explosao'); });
    }
    this.time.delayedCall(1800, () => {
      this.boom(px, py, 40, 0xffffff);
      this.player.setVisible(false);
      raio.destroy(); nucleo.destroy();
      clarao(this, 400, 0xffffff);
    });
    this.time.delayedCall(3600, () => {
      this.cameras.main.fadeOut(1200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.cenaDaEntidade());
    });
  },

  // A entidade encapuzada de olhos brilhando
  cenaDaEntidade() {
    const D = 3000, partes = [], fixo = (o) => { partes.push(o.setScrollFactor(0).setDepth(D)); return o; };
    fixo(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1));
    const S = 7, ent = fixo(this.add.image(W / 2, H / 2 - 30, 'entidade').setScale(S).setAlpha(0));
    const olhos = OLHOS_ENTIDADE.map((o) => {
      const x = W / 2 + o.x * S + S / 2, y = H / 2 - 30 + o.y * S;
      // brilho somado à luz (ADD): quanto mais camadas, mais "aceso" o olho parece
      const halo = fixo(this.add.ellipse(x, y, S * 5.5, S * 2.8, 0xc026d3, 0.35).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD));
      const brilho = fixo(this.add.ellipse(x, y, S * 4.2, S * 2.2, 0xf0abfc, 0.9).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD));
      const olho = fixo(this.add.ellipse(x, y, S * 2.2, S * 1.1, 0xffffff, 1).setAlpha(0));
      return [halo, brilho, olho];
    }).flat();
    const fala = fixo(this.add.text(W / 2, H - 92, '', { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#f5d0fe', align: 'center', stroke: '#000000', strokeThickness: 5, wordWrap: { width: 820 } }).setOrigin(0.5));
    this.cameras.main.fadeIn(1500, 0, 0, 0);
    this.tweens.add({ targets: ent, alpha: 1, duration: 1800 });
    this.time.delayedCall(1900, () => this.tweens.add({ targets: [ent, ...olhos], y: '-=8', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));   // flutua
    this.time.delayedCall(1600, () => {
      this.tweens.add({ targets: olhos, alpha: 1, duration: 500 });
      this.tweens.add({ targets: olhos.filter((_, i) => i % 3 !== 2), scaleX: 1.35, scaleY: 1.35, alpha: 0.75, duration: 700, yoyo: true, repeat: -1 });
      this.cameras.main.shake(300, 0.004);
    });
    // a fala aparece letra por letra
    const frase = tx('Você nunca vai conseguir me vencer.\nVolte para seu tempo!');
    this.time.delayedCall(2600, () => {
      falarTexto(frase, { pitch: 0.3, rate: 0.8 });
      let n = 0;
      this.time.addEvent({ delay: 55, repeat: frase.length - 1, callback: () => { n++; fala.setText('"' + frase.slice(0, n) + (n === frase.length ? '"' : '')); } });
    });
    // portal do tempo: tudo gira, clarão e "muitos anos antes..."
    this.time.delayedCall(9500, () => {
      this.tweens.add({ targets: [ent, ...olhos], angle: 720, scale: 0.1, alpha: 0, duration: 1600, ease: 'Quad.easeIn' });
      for (let k = 0; k < 40; k++) {
        const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 380;
        const e = fixo(this.add.rectangle(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r, 3, 3, 0xffffff, 1));
        this.tweens.add({ targets: e, x: W / 2, y: H / 2, alpha: 0, duration: 900 + Math.random() * 700 });
      }
      this.time.delayedCall(1500, () => { clarao(this, 900, 0xffffff); fala.setText(tx('Muitos anos antes...')).setColor('#ffffff'); falarTexto(tx('Muitos anos antes...')); });
    });
    this.time.delayedCall(14500, () => this.terminarPrologo());
  },

  terminarPrologo() {
    if (this.pr && this.pr.terminou) return;
    const viuAteOFim = !!(this.pr && this.pr.acabando);   // pulou a história? então não ganha a conquista
    if (this.pr) this.pr.terminou = true;
    PREFS.prologoVisto = true;
    salvarPrefs();
    if (viuAteOFim && !SAVE.stats.prologo) {
      // conquista "Viajante do Tempo" (RN-77): aparece no menu com o aviso de conquista
      SAVE.stats.prologo = true;
      const novas = verificarConquistas(SAVE, Date.now());
      writeSave(SAVE);
      novas.forEach((c) => CONQUISTA_NOVA.push(c));   // o menu mostra o aviso (src/telas.js)
    }
    try { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); } catch (e) { /* ok */ }
    if (typeof MENU_INICIAL !== 'undefined') MENU_INICIAL.mostrado = false;   // cai no menu do jogo
    this.scene.start('Hangar');
  }
});
