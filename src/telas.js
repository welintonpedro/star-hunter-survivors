// ============ TELAS SOBREPOSTAS: CÓDEX E CONQUISTAS (RN-30, RN-37) ============
// Funcionam em qualquer cena (pausa da partida ou hangar). Devolvem uma função que fecha a tela.

function _telaBase(scene, titulo, aoFechar) {
  const D = 1000, partes = [];   // acima de tudo, inclusive do painel do modo de teste
  const fixo = (o, d) => { partes.push(o.setScrollFactor(0).setDepth(D + (d || 0))); return o; };
  fixo(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setInteractive());
  fixo(scene.add.rectangle(W / 2, H / 2, 920, 510, 0x0b1220).setStrokeStyle(3, 0x60a5fa), 1);
  fixo(scene.add.text(W / 2, 32, tx(titulo), { fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#a5f3fc', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5), 2);
  const fechar = () => { partes.forEach((p) => p.destroy()); if (aoFechar) aoFechar(); };
  const btn = makeButton(scene, W / 2, H - 30, 160, 30, tx('FECHAR'), fechar, { fixed: true, depth: D + 3, size: 14 });
  partes.push(btn);
  return { partes, fixo, fechar, D };
}

// Códex: todas as armas, poderes e itens que podem aparecer, e os combos
// (descobertos com ícones; os outros como [?] + [?] = [?])
function abrirCodex(scene, aoFechar) {
  const t = _telaBase(scene, 'CÓDEX', aoFechar);
  const { fixo } = t;
  const txt = (x, y, s, tam, cor, d, larg) => fixo(scene.add.text(x, y, s, { fontFamily: 'Arial', fontSize: tam + 'px', color: cor || '#cbd5e1', align: 'center', wordWrap: { width: larg || 92 } }).setOrigin(0.5, 0), d || 2);
  const titulo = (y, s) => fixo(scene.add.text(W / 2, y, s, { fontFamily: 'Arial', fontSize: '12px', color: '#fde68a', fontStyle: 'bold' }).setOrigin(0.5, 0), 2);
  const icone = (x, y, chave, tam, apagado) => {
    fixo(scene.add.rectangle(x, y, tam + 6, tam + 6, 0x000000, 0.5).setStrokeStyle(1, 0x334155), 1);
    const im = fixo(scene.add.image(x, y, chave).setDisplaySize(tam, tam), 2);
    if (apagado) im.setTint(0x334155);
    return im;
  };

  // armas e poderes
  titulo(54, tx('ARMAS E PODERES'));
  const armas = Object.keys(WEAPONS);
  armas.forEach((id, i) => {
    const passo = Math.min(96, (W - 30) / armas.length);   // 11 armas cabem na largura
    const d = WEAPONS[id], x = W / 2 + (i - (armas.length - 1) / 2) * passo, y = 98;
    const travada = d.hidden && !armaLiberada(SAVE, id);
    icone(x, y, iconeDe(id), 36, travada);
    let sub = d.name;
    if (d.poder) sub += '\n(' + SHIPS.find((s) => s.id === d.poder).name + ')';
    if (travada) sub += '\n' + tx('achada {n}/{total}', { n: Math.min(ACHADOS_PARA_LIBERAR, SAVE.stats.armasAchadas[id] || 0), total: ACHADOS_PARA_LIBERAR });
    txt(x, y + 24, sub, 10, travada ? '#64748b' : '#cbd5e1', 2, Math.min(96, (W - 30) / armas.length) - 4);
  });

  // itens
  titulo(168, tx('ITENS'));
  const itens = Object.keys(PASSIVES);
  itens.forEach((id, i) => {
    const x = W / 2 + (i - (itens.length - 1) / 2) * 100, y = 208;
    icone(x, y, iconeDe(id), 32);
    txt(x, y + 22, PASSIVES[id].name, 10);
  });

  // combos
  const descobertos = armas.filter((id) => SAVE.combos.includes(id)).length;
  titulo(262, tx('COMBOS  ({n}/{total} descobertos)', { n: descobertos, total: armas.length }));
  armas.forEach((id, i) => {
    const col = i % 4, lin = Math.floor(i / 4);   // 4 colunas: os 11 combos cabem em 3 linhas
    const cx = W / 2 + (col - 1.5) * 228, cy = 312 + lin * 64;
    const sabe = SAVE.combos.includes(id), d = WEAPONS[id];
    fixo(scene.add.rectangle(cx, cy + 6, 216, 58, sabe ? 0x422006 : 0x111827, 0.85).setStrokeStyle(1, sabe ? 0xfacc15 : 0x334155), 1);
    const chaves = sabe ? [iconeDe(id), iconeDe(d.evo), iconeDe(id, true)] : ['icone_oculto', 'icone_oculto', 'icone_oculto'];
    chaves.forEach((k, j) => icone(cx - 64 + j * 64, cy - 2, k, 28));
    ['+', '='].forEach((s, j) => fixo(scene.add.text(cx - 32 + j * 64, cy - 2, s, { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#fde047' }).setOrigin(0.5), 2));
    fixo(scene.add.text(cx, cy + 24, sabe ? d.evoName : '???', { fontFamily: 'Arial', fontSize: '11px', color: sabe ? '#f5d0fe' : '#64748b' }).setOrigin(0.5), 2);
  });
  return t.fechar;
}

// Conquistas: as ~20 conquistas, quais faltam e o que cada uma libera
function abrirConquistas(scene, aoFechar) {
  const t = _telaBase(scene, 'CONQUISTAS', aoFechar);
  const { fixo } = t;
  const feitas = CONQUISTAS.filter((c) => SAVE.conquistas[c.id]).length;
  fixo(scene.add.text(W / 2, 54, tx('{n} de {total} desbloqueadas', { n: feitas, total: CONQUISTAS.length }), { fontFamily: 'Arial', fontSize: '13px', color: '#cbd5e1' }).setOrigin(0.5, 0), 2);
  const porColuna = Math.ceil(CONQUISTAS.length / 2);
  CONQUISTAS.forEach((c, i) => {
    const col = Math.floor(i / porColuna), lin = i % porColuna;
    const x = W / 2 - 440 + col * 450, y = 84 + lin * 40;
    const ok = !!SAVE.conquistas[c.id];
    fixo(scene.add.rectangle(x + 215, y + 16, 436, 36, ok ? 0x14532d : 0x111827, 0.85).setStrokeStyle(1, ok ? 0x4ade80 : 0x334155), 1);
    fixo(scene.add.text(x + 14, y + 16, ok ? '✓' : '•', { fontFamily: 'Arial', fontSize: '18px', color: ok ? '#4ade80' : '#475569', fontStyle: 'bold' }).setOrigin(0.5), 2);
    fixo(scene.add.text(x + 30, y + 3, c.nome + '  —  ' + c.desc, { fontFamily: 'Arial', fontSize: '12px', color: ok ? '#fde047' : '#e2e8f0', fontStyle: ok ? 'bold' : 'normal' }), 2);
    const nomeArma = c.premio.arma ? WEAPONS[c.premio.arma].name : '';
    fixo(scene.add.text(x + 30, y + 18, tx('Prêmio: {premio}', { premio: textoDoPremio(c.premio, nomeArma) }), { fontFamily: 'Arial', fontSize: '11px', color: ok ? '#86efac' : '#94a3b8' }), 2);
  });
  return t.fechar;
}

// ============ MENU PRINCIPAL (aparece ao abrir o jogo, por cima do hangar) ============
// Continuar = hangar com o progresso; Novo jogo = apaga tudo (com confirmação);
// Conquistas; Configurações (RN-57).
function _temProgresso() {
  return SAVE.credits > 0 || Object.keys(SAVE.owned).length > 1 || SAVE.stats.tempoTotal > 0 ||
    Object.keys(SAVE.conquistas).length > 0 || Object.values(SAVE.meta).some((v) => v > 0);
}
function abrirMenuPrincipal(scene, aoContinuar) {
  const D = 1000, partes = [];
  const fixo = (o, d) => { partes.push(o.setScrollFactor(0).setDepth(D + (d || 0))); return o; };
  const fechar = () => partes.forEach((p) => p.destroy());
  fixo(scene.add.rectangle(W / 2, H / 2, W, H, 0x050814, 1).setInteractive());
  fixo(scene.add.tileSprite(0, 0, W, H, 'stars_far').setOrigin(0).setAlpha(0.6));
  fixo(scene.add.image(W / 2, 160, 'ship_falcao').setScale(2.2), 1);
  fixo(scene.add.text(W / 2, 70, 'STAR HUNTER SURVIVORS', {
    fontFamily: 'Arial Black, Arial', fontSize: '40px', color: '#fde047', stroke: '#7c2d12', strokeThickness: 7
  }).setOrigin(0.5), 1);
  const botao = (y, rotulo, acao, cor, borda) => {
    const b = makeButton(scene, W / 2, y, 280, 46, rotulo, acao, { fixed: true, depth: D + 2, color: cor, stroke: borda, size: 18 });
    partes.push(b);
    return b;
  };
  const progresso = _temProgresso();
  botao(250, progresso ? tx('CONTINUAR') : tx('JOGAR'), () => { fechar(); if (aoContinuar) aoContinuar(); }, 0x166534, 0x4ade80);
  botao(308, tx('NOVO JOGO'), () => {
    if (!progresso) { fechar(); if (aoContinuar) aoContinuar(); return; }
    _confirmarNovoJogo(scene, () => { fechar(); scene.scene.restart(); });
  }, 0x7f1d1d, 0xfca5a5);
  const nCq = CONQUISTAS.filter((c) => SAVE.conquistas[c.id]).length;
  botao(366, tx('CONQUISTAS') + '  ' + nCq + '/' + CONQUISTAS.length, () => abrirConquistas(scene), 0x14532d, 0x4ade80);
  botao(424, tx('CONFIGURAÇÕES'), () => abrirConfiguracoes(scene, null, true));
  // idioma: mostra o atual; clicar abre a lista (RN-61)
  partes.push(makeButton(scene, W - 110, H - 30, 190, 32, tx('IDIOMA') + ': ' + nomeDoIdioma(IDIOMA), () => abrirIdiomas(scene, true), { fixed: true, depth: D + 2, size: 13 }));
  fixo(scene.add.text(W / 2, H - 24, tx('Mover: WASD/setas ou arrastar  •  Escolhas: 1/2/3  •  Pausa: ESC ou P'), {
    fontFamily: 'Arial', fontSize: '12px', color: '#64748b'
  }).setOrigin(0.5), 1);
  return { partes, fechar };
}

function _confirmarNovoJogo(scene, aoApagar) {
  const D = 1100, partes = [];
  const fixo = (o, d) => { partes.push(o.setScrollFactor(0).setDepth(D + (d || 0))); return o; };
  const fechar = () => partes.forEach((p) => p.destroy());
  fixo(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive());
  fixo(scene.add.rectangle(W / 2, H / 2, 520, 230, 0x1c0a0a).setStrokeStyle(3, 0xfca5a5), 1);
  fixo(scene.add.text(W / 2, H / 2 - 72, tx('APAGAR TODO O PROGRESSO?'), { fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#fca5a5' }).setOrigin(0.5), 2);
  fixo(scene.add.text(W / 2, H / 2 - 22, tx('Créditos, naves, melhorias, combos e conquistas\nvoltam ao zero. Isso não pode ser desfeito.'), {
    fontFamily: 'Arial', fontSize: '14px', color: '#fee2e2', align: 'center'
  }).setOrigin(0.5), 2);
  partes.push(makeButton(scene, W / 2 - 115, H / 2 + 60, 200, 40, tx('SIM, APAGAR'), () => {
    SAVE = saveInicial(Date.now());
    writeSave(SAVE);
    fechar();
    aoApagar();
  }, { fixed: true, depth: D + 3, color: 0x991b1b, stroke: 0xfca5a5, size: 15 }));
  partes.push(makeButton(scene, W / 2 + 115, H / 2 + 60, 200, 40, tx('CANCELAR'), fechar, { fixed: true, depth: D + 3, size: 15 }));
}

// Configurações: volume, efeitos reduzidos e tela cheia
function abrirConfiguracoes(scene, aoFechar, doMenu) {
  const D = 1100, partes = [];
  const fixo = (o, d) => { partes.push(o.setScrollFactor(0).setDepth(D + (d || 0))); return o; };
  const fechar = () => { partes.forEach((p) => p.destroy()); if (aoFechar) aoFechar(); };
  fixo(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setInteractive());
  fixo(scene.add.rectangle(W / 2, H / 2, 480, 380, 0x0b1220).setStrokeStyle(3, 0x60a5fa), 1);
  fixo(scene.add.text(W / 2, H / 2 - 135, tx('CONFIGURAÇÕES'), { fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#a5f3fc' }).setOrigin(0.5), 2);
  const opc = { fixed: true, depth: D + 3, size: 15 };
  // volume: - e + em passos de 10%
  fixo(scene.add.text(W / 2 - 190, H / 2 - 75, tx('Volume dos sons'), { fontFamily: 'Arial', fontSize: '16px', color: '#e2e8f0' }).setOrigin(0, 0.5), 2);
  const txtVol = fixo(scene.add.text(W / 2 + 120, H / 2 - 75, '', { fontFamily: 'Arial', fontSize: '16px', color: '#fde047', fontStyle: 'bold' }).setOrigin(0.5), 2);
  const mostrarVol = () => txtVol.setText(Math.round(PREFS.volume * 100) + '%');
  const mudarVol = (d) => { PREFS.volume = Math.round(Math.min(1, Math.max(0, PREFS.volume + d)) * 10) / 10; salvarPrefs(); aplicarPrefs(scene.game); mostrarVol(); };
  partes.push(makeButton(scene, W / 2 + 60, H / 2 - 75, 40, 34, '−', () => mudarVol(-0.1), opc));
  partes.push(makeButton(scene, W / 2 + 180, H / 2 - 75, 40, 34, '+', () => mudarVol(0.1), opc));
  mostrarVol();
  // efeitos reduzidos
  fixo(scene.add.text(W / 2 - 190, H / 2 - 15, tx('Efeitos reduzidos\n(menos faíscas, ajuda celular fraco)'), { fontFamily: 'Arial', fontSize: '14px', color: '#e2e8f0' }).setOrigin(0, 0.5), 2);
  const bEfeitos = makeButton(scene, W / 2 + 120, H / 2 - 15, 140, 34, '', () => {
    PREFS.efeitosReduzidos = !PREFS.efeitosReduzidos; salvarPrefs(); rotuloEfeitos();
  }, opc);
  const rotuloEfeitos = () => bEfeitos.setLabel(PREFS.efeitosReduzidos ? tx('LIGADO') : tx('DESLIGADO'));
  rotuloEfeitos();
  partes.push(bEfeitos);
  // tela cheia (o navegador só deixa ligar com um clique do jogador)
  fixo(scene.add.text(W / 2 - 190, H / 2 + 45, tx('Tela cheia'), { fontFamily: 'Arial', fontSize: '16px', color: '#e2e8f0' }).setOrigin(0, 0.5), 2);
  const bTela = makeButton(scene, W / 2 + 120, H / 2 + 45, 140, 34, scene.scale.isFullscreen ? tx('LIGADA') : tx('DESLIGADA'), () => {
    if (scene.scale.isFullscreen) scene.scale.stopFullscreen(); else scene.scale.startFullscreen();
    scene.time.delayedCall(150, () => bTela.setLabel(scene.scale.isFullscreen ? tx('LIGADA') : tx('DESLIGADA')));
  }, opc);
  partes.push(bTela);
  // idioma
  fixo(scene.add.text(W / 2 - 190, H / 2 + 95, tx('Idioma'), { fontFamily: 'Arial', fontSize: '16px', color: '#e2e8f0' }).setOrigin(0, 0.5), 2);
  partes.push(makeButton(scene, W / 2 + 120, H / 2 + 95, 140, 34, nomeDoIdioma(IDIOMA), () => abrirIdiomas(scene, doMenu), opc));
  partes.push(makeButton(scene, W / 2, H / 2 + 150, 160, 34, tx('FECHAR'), fechar, opc));
  return { partes, fechar };
}

// ============ ESCOLHA DE IDIOMA (RN-61) ============
function nomeDoIdioma(id) { const i = IDIOMAS.find((x) => x.id === id); return i ? i.nome : id; }
// voltarAoMenu: depois de trocar, o menu principal abre de novo (já no idioma novo)
function abrirIdiomas(scene, voltarAoMenu) {
  const D = 1200, partes = [];
  const fixo = (o, d) => { partes.push(o.setScrollFactor(0).setDepth(D + (d || 0))); return o; };
  const fechar = () => partes.forEach((p) => p.destroy());
  fixo(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setInteractive());
  const alto = 90 + IDIOMAS.length * 44;
  fixo(scene.add.rectangle(W / 2, H / 2, 320, alto, 0x0b1220).setStrokeStyle(3, 0x60a5fa), 1);
  const topo = H / 2 - alto / 2;
  fixo(scene.add.text(W / 2, topo + 28, tx('IDIOMA'), { fontFamily: 'Arial Black, Arial', fontSize: '22px', color: '#a5f3fc' }).setOrigin(0.5), 2);
  IDIOMAS.forEach((i, k) => {
    const atual = i.id === IDIOMA;
    partes.push(makeButton(scene, W / 2, topo + 74 + k * 44, 240, 36, (atual ? '✓ ' : '') + i.nome, () => {
      fechar();
      if (atual) return;
      mudarIdioma(i.id);
      if (voltarAoMenu && typeof MENU_INICIAL !== 'undefined') MENU_INICIAL.mostrado = false;
      scene.scene.restart();
    }, { fixed: true, depth: D + 3, size: 15, color: atual ? 0x166534 : 0x1e3a8a, stroke: atual ? 0x4ade80 : 0x60a5fa }));
  });
  return { partes, fechar };
}
