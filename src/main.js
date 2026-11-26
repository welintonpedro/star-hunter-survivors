// ============ INICIALIZAÇÃO ============
const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#000000',
  // Sem "pixelArt" global: o navegador estica a tela de 960×540 de forma suave, então os
  // textos ficam legíveis no celular (antes ficavam embaralhados). Os desenhos continuam
  // nítidos porque cada textura gerada usa filtro "nearest" (veja o fim do BootScene).
  antialias: true,
  antialiasGL: false,   // suavizar bordas no WebGL custa muito (36 → 20 quadros/s) e não ajuda a pixel art
  roundPixels: true,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, HangarScene, GameScene]
};

const game = new Phaser.Game(config);

