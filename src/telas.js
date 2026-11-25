// ============ TELAS SOBREPOSTAS: CÓDEX E CONQUISTAS (RN-30, RN-37) ============
// Funcionam em qualquer cena (pausa da partida ou hangar). Devolvem uma função que fecha a tela.

function _telaBase(scene, titulo, aoFechar) {
  const D = 1000, partes = [];   // acima de tudo, inclusive do painel do modo de teste
  const fixo = (o, d) => { partes.push(o.setScrollFactor(0).setDepth(D + (d || 0))); return o; };
  fixo(scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setInteractive());
  fixo(scene.add.rectangle(W / 2, H / 2, 920, 510, 0x0b1220).setStrokeStyle(3, 0x60a5fa), 1);
  fixo(scene.add.text(W / 2, 32, titulo, { fontFamily: 'Arial Black, Arial', fontSize: '24px', color: '#a5f3fc', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5), 2);
  const fechar = () => { partes.forEach((p) => p.destroy()); if (aoFechar) aoFechar(); };
  const btn = makeButton(scene, W / 2, H - 30, 160, 30, 'FECHAR', fechar, { fixed: true, depth: D + 3, size: 14 });
  partes.push(btn);
  return { partes, fixo, fechar, D };
}

// Códex: todas as armas, poderes e itens que podem aparecer, e os combos
// (descobertos com ícones; os outros como [?] + [?] = [?])
function abrirCodex(scene, aoFechar) {
  const t = _telaBase(scene, 'CÓDEX', aoFechar);
  const { fixo } = t;
  const txt = (x, y, s, tam, cor, d) => fixo(scene.add.text(x, y, s, { fontFamily: 'Arial', fontSize: tam + 'px', color: cor || '#cbd5e1', align: 'center', wordWrap: { width: 92 } }).setOrigin(0.5, 0), d || 2);
  const titulo = (y, s) => fixo(scene.add.text(W / 2, y, s, { fontFamily: 'Arial', fontSize: '12px', color: '#fde68a', fontStyle: 'bold' }).setOrigin(0.5, 0), 2);
  const icone = (x, y, chave, tam, apagado) => {
    fixo(scene.add.rectangle(x, y, tam + 6, tam + 6, 0x000000, 0.5).setStrokeStyle(1, 0x334155), 1);
    const im = fixo(scene.add.image(x, y, chave).setDisplaySize(tam, tam), 2);
    if (apagado) im.setTint(0x334155);
    return im;
  };

  // armas e poderes
  titulo(54, 'ARMAS E PODERES');
  const armas = Object.keys(WEAPONS);
  armas.forEach((id, i) => {
    const d = WEAPONS[id], x = W / 2 + (i - (armas.length - 1) / 2) * 96, y = 98;
    const travada = d.hidden && !armaLiberada(SAVE, id);
    icone(x, y, iconeDe(id), 36, travada);
    let sub = d.name;
    if (d.poder) sub += '\n(' + SHIPS.find((s) => s.id === d.poder).name + ')';
    if (travada) sub += '\nachada ' + Math.min(ACHADOS_PARA_LIBERAR, SAVE.stats.armasAchadas[id] || 0) + '/' + ACHADOS_PARA_LIBERAR;
    txt(x, y + 24, sub, 10, travada ? '#64748b' : '#cbd5e1');
  });

  // itens
  titulo(168, 'ITENS');
  const itens = Object.keys(PASSIVES);
  itens.forEach((id, i) => {
    const x = W / 2 + (i - (itens.length - 1) / 2) * 100, y = 208;
    icone(x, y, iconeDe(id), 32);
    txt(x, y + 22, PASSIVES[id].name, 10);
  });

  // combos
  const descobertos = armas.filter((id) => SAVE.combos.includes(id)).length;
  titulo(262, 'COMBOS  (' + descobertos + '/' + armas.length + ' descobertos)');
  armas.forEach((id, i) => {
    const col = i % 3, lin = Math.floor(i / 3);
    const cx = W / 2 + (col - 1) * 290, cy = 312 + lin * 64;
    const sabe = SAVE.combos.includes(id), d = WEAPONS[id];
    fixo(scene.add.rectangle(cx, cy + 6, 270, 58, sabe ? 0x422006 : 0x111827, 0.85).setStrokeStyle(1, sabe ? 0xfacc15 : 0x334155), 1);
    const chaves = sabe ? [iconeDe(id), iconeDe(d.evo), iconeDe(id, true)] : ['icone_oculto', 'icone_oculto', 'icone_oculto'];
    chaves.forEach((k, j) => icone(cx - 80 + j * 80, cy - 2, k, 30));
    ['+', '='].forEach((s, j) => fixo(scene.add.text(cx - 40 + j * 80, cy - 2, s, { fontFamily: 'Arial Black, Arial', fontSize: '18px', color: '#fde047' }).setOrigin(0.5), 2));
    fixo(scene.add.text(cx, cy + 24, sabe ? d.evoName : '???', { fontFamily: 'Arial', fontSize: '11px', color: sabe ? '#f5d0fe' : '#64748b' }).setOrigin(0.5), 2);
  });
  return t.fechar;
}

// Conquistas: as ~20 conquistas, quais faltam e o que cada uma libera
function abrirConquistas(scene, aoFechar) {
  const t = _telaBase(scene, 'CONQUISTAS', aoFechar);
  const { fixo } = t;
  const feitas = CONQUISTAS.filter((c) => SAVE.conquistas[c.id]).length;
  fixo(scene.add.text(W / 2, 54, feitas + ' de ' + CONQUISTAS.length + ' desbloqueadas', { fontFamily: 'Arial', fontSize: '13px', color: '#cbd5e1' }).setOrigin(0.5, 0), 2);
  const porColuna = Math.ceil(CONQUISTAS.length / 2);
  CONQUISTAS.forEach((c, i) => {
    const col = Math.floor(i / porColuna), lin = i % porColuna;
    const x = W / 2 - 440 + col * 450, y = 84 + lin * 40;
    const ok = !!SAVE.conquistas[c.id];
    fixo(scene.add.rectangle(x + 215, y + 16, 436, 36, ok ? 0x14532d : 0x111827, 0.85).setStrokeStyle(1, ok ? 0x4ade80 : 0x334155), 1);
    fixo(scene.add.text(x + 14, y + 16, ok ? '✓' : '•', { fontFamily: 'Arial', fontSize: '18px', color: ok ? '#4ade80' : '#475569', fontStyle: 'bold' }).setOrigin(0.5), 2);
    fixo(scene.add.text(x + 30, y + 3, c.nome + '  —  ' + c.desc, { fontFamily: 'Arial', fontSize: '12px', color: ok ? '#fde047' : '#e2e8f0', fontStyle: ok ? 'bold' : 'normal' }), 2);
    const nomeArma = c.premio.arma ? WEAPONS[c.premio.arma].name : '';
    fixo(scene.add.text(x + 30, y + 18, 'Prêmio: ' + textoDoPremio(c.premio, nomeArma), { fontFamily: 'Arial', fontSize: '11px', color: ok ? '#86efac' : '#94a3b8' }), 2);
  });
  return t.fechar;
}
