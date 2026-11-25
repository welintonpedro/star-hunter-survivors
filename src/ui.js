// ============ BOTÃO SIMPLES ============
function makeButton(scene, x, y, w, h, label, onClick, opts) {
  opts = opts || {};
  const bg = scene.add.rectangle(x, y, w, h, opts.color !== undefined ? opts.color : 0x1e3a8a)
    .setStrokeStyle(2, opts.stroke !== undefined ? opts.stroke : 0x60a5fa);
  const txt = scene.add.text(x, y, label, {
    fontFamily: 'Arial', fontSize: (opts.size || 16) + 'px', color: opts.textColor || '#ffffff', align: 'center',
    wordWrap: opts.wrap ? { width: w - 16 } : undefined
  }).setOrigin(0.5);
  if (opts.disabled) {
    bg.setFillStyle(0x27272a).setStrokeStyle(2, 0x52525b);
    txt.setColor('#71717a');
  } else {
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setAlpha(0.8));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', () => onClick());
  }
  if (opts.fixed) { bg.setScrollFactor(0); txt.setScrollFactor(0); }
  if (opts.depth !== undefined) { bg.setDepth(opts.depth); txt.setDepth(opts.depth + 1); }
  return { bg, txt, setLabel(t) { txt.setText(t); }, destroy() { bg.destroy(); txt.destroy(); } };
}

