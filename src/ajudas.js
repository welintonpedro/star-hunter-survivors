// ============ AJUDAS PARA INICIANTES (RN-72) ============
// Valem no jogo todo (dá para desligar em Configurações → "Ajudas para iniciantes"):
//  - celular/tablet: botão MOVER sempre visível no canto (antes o controle só aparecia ao tocar)
//  - computador: teclas desenhadas na tela no começo da partida (muita gente não sabia do teclado)
//  - cartas de nível: a melhor escolha ganha o selo RECOMENDADO e brilho dourado

// Celular/tablet ou computador? O navegador diz se o "ponteiro" principal é um dedo (coarse)
// ou um mouse (fine). Não é 100% (notebook com tela de toque), mas acerta quase sempre.
function ehTelaDeToque() {
  try {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) return false;
    return (navigator.maxTouchPoints || 0) > 0;
  } catch (e) { return false; }
}
function ajudasLigadas() { return PREFS.ajudas !== false; }

Object.assign(GameScene.prototype, {
  // Chamado no fim de create(): monta o botão MOVER (toque) ou o painel de teclas (computador)
  criarAjudasDeControle() {
    this.toque = ehTelaDeToque();
    this.joyCasa = null;
    if (!ajudasLigadas()) return;
    if (this.toque) {
      // botão MOVER "estacionado" no canto inferior esquerdo, sempre à vista
      const x = 120, y = H - 120;
      this.joyCasa = { x, y };
      this.joyBase.setPosition(x, y).setVisible(true).setRadius(62).setFillStyle(0xffffff, 0.1).setStrokeStyle(3, 0xfde047, 0.7);
      this.joyKnob.setPosition(x, y).setVisible(true).setRadius(28).setFillStyle(0xfde047, 0.45);
      this.joyRotulo = this.add.text(x, y + 82, tx('MOVER'), { fontFamily: 'Arial Black, Arial', fontSize: '16px', color: '#fde047', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(141);
      // pisca até o jogador mexer a nave pela primeira vez
      this.joyPisca = this.tweens.add({ targets: [this.joyBase, this.joyRotulo], alpha: { from: 1, to: 0.35 }, duration: 600, yoyo: true, repeat: -1 });
    } else {
      this.mostrarTeclas(12);
    }
  },

  // Painel de teclas no canto (computador). Some depois de "segundos" ou quando o jogador usar o teclado.
  mostrarTeclas(segundos, grande) {
    if (this.painelTeclas) this.painelTeclas.forEach((p) => p.destroy());
    const D = 145, partes = [], esc = grande ? 1.25 : 1;
    const x0 = grande ? W / 2 - 230 : 24, y0 = grande ? H - 175 : H - 150;
    const fixo = (o) => { partes.push(o.setScrollFactor(0).setDepth(D)); return o; };
    const tecla = (x, y, letra, larg) => {
      const w = (larg || 30) * esc, h = 30 * esc;
      fixo(this.add.rectangle(x0 + x * esc + w / 2, y0 + y * esc + h / 2, w, h, 0x1e293b, 0.92).setStrokeStyle(2, 0xe2e8f0));
      fixo(this.add.text(x0 + x * esc + w / 2, y0 + y * esc + h / 2, letra, { fontFamily: 'Arial Black, Arial', fontSize: Math.round(13 * esc) + 'px', color: '#ffffff' }).setOrigin(0.5));
    };
    fixo(this.add.rectangle(x0 - 10 + 200 * esc, y0 - 10 + 62 * esc, 410 * esc, 135 * esc, 0x000000, 0.55).setStrokeStyle(1, 0x64748b));
    // W A S D
    tecla(36, 0, 'W'); tecla(2, 34, 'A'); tecla(36, 34, 'S'); tecla(70, 34, 'D');
    // setas
    tecla(150, 0, '↑'); tecla(116, 34, '←'); tecla(150, 34, '↓'); tecla(184, 34, '→');
    fixo(this.add.text(x0 + 110 * esc, y0 + 74 * esc, tx('MOVER A NAVE'), { fontFamily: 'Arial Black, Arial', fontSize: Math.round(13 * esc) + 'px', color: '#fde047' }).setOrigin(0.5, 0));
    tecla(236, 0, 'ESC', 46); tecla(290, 0, 'P');
    fixo(this.add.text(x0 + 290 * esc, y0 + 36 * esc, tx('PAUSA'), { fontFamily: 'Arial Black, Arial', fontSize: Math.round(12 * esc) + 'px', color: '#a5f3fc' }).setOrigin(0.5, 0));
    tecla(236, 66, '1'); tecla(270, 66, '2'); tecla(304, 66, '3');
    fixo(this.add.text(x0 + 290 * esc, y0 + 100 * esc, tx('ESCOLHER CARTA'), { fontFamily: 'Arial Black, Arial', fontSize: Math.round(12 * esc) + 'px', color: '#86efac' }).setOrigin(0.5, 0));
    this.painelTeclas = partes;
    this.painelTeclasAte = segundos ? this.time.now + segundos * 1000 : Infinity;
    this.teclaUsada = false;
  },
  esconderTeclas() {
    if (!this.painelTeclas) return;
    const p = this.painelTeclas;
    this.painelTeclas = null;
    this.tweens.add({ targets: p, alpha: 0, duration: 400, onComplete: () => p.forEach((o) => o.destroy()) });
  },

  // Chamado a cada quadro (update): apaga o painel de teclas e para o pisca do botão MOVER
  updateAjudas(moveuTeclado, moveuToque) {
    if (this.painelTeclas) {
      if (moveuTeclado && !this.teclaUsada) { this.teclaUsada = true; this.painelTeclasAte = Math.min(this.painelTeclasAte, this.time.now + 3000); }
      if (this.time.now > this.painelTeclasAte) this.esconderTeclas();
    }
    if (moveuToque && this.joyPisca) { this.joyPisca.stop(); this.joyPisca = null; this.joyBase.setAlpha(1); if (this.joyRotulo) this.joyRotulo.setAlpha(0.8); }
  },

  // Qual carta recomendar? Ordem: completar um combo > arma suprema > subir a arma mais forte >
  // arma nova (se tiver poucas) > item que é par de combo de arma que você tem > o resto.
  indiceRecomendado(options) {
    let melhor = 0, nota = -1;
    options.forEach((o, i) => {
      let n = 0;
      if (o.kind === 'weapon') {
        const d = WEAPONS[o.id];
        const temItem = d.evo && (this.passives[d.evo] || 0) > 0;
        if (o.level === 5 && temItem) n = 100;                       // vai poder virar combo
        else if (d.suprema) n = 90;
        else if (o.level > 1) n = 60 + o.level;                      // fortalecer o que já tem
        else n = this.weapons.length < 3 ? 70 : 30;                  // arma nova
      } else if (o.kind === 'passive') {
        const par = this.weapons.some((w) => WEAPONS[w.id].evo === o.id);
        n = par ? 65 + o.level : 40 + o.level;
      } else if (o.kind === 'sobrecarga') n = o.id === 'dano' ? 50 : 45;
      else if (o.kind === 'heal') n = this.hp < this.mods.maxHp * 0.5 ? 80 : 10;
      else n = 5;
      if (n > nota) { nota = n; melhor = i; }
    });
    return melhor;
  },

  // Selo RECOMENDADO e brilho dourado em volta da carta (chamado ao montar as cartas)
  marcarRecomendada(x, y, largura, altura) {
    const D = 202, partes = [];
    const brilho = this.add.rectangle(x, y, largura + 14, altura + 14, 0xfde047, 0.18).setStrokeStyle(4, 0xfde047, 1).setScrollFactor(0).setDepth(D);
    const fita = this.add.rectangle(x, y - altura / 2 - 6, 170, 28, 0xfacc15).setStrokeStyle(2, 0x713f12).setScrollFactor(0).setDepth(D + 3);
    const txt = this.add.text(x, y - altura / 2 - 6, '★ ' + tx('RECOMENDADO'), { fontFamily: 'Arial Black, Arial', fontSize: '13px', color: '#422006' }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 4);
    this.tweens.add({ targets: brilho, alpha: { from: 1, to: 0.4 }, duration: 500, yoyo: true, repeat: -1 });
    partes.push(brilho, fita, txt);
    return partes;
  }
});
