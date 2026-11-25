// ============ INICIALIZAÇÃO ============
const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#000000',
  pixelArt: true,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, HangarScene, GameScene]
};

const game = new Phaser.Game(config);

