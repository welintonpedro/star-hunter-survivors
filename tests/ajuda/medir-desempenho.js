// Mede quadros por segundo com N inimigos imortais e 4 armas atirando.
// Uso: npm run desempenho -- 120   (o Chrome sem tela é mais lento que um computador real:
// use para COMPARAR antes e depois de uma mudança, não como número absoluto)
const { abrirJogo, esperarCena } = require('./navegador');
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const N = Number(process.argv[2] || 120);
(async () => {
  const j = await abrirJogo({ busca: 'teste=1' });
  await esperarCena(j.pagina, 'Hangar');
  await j.pagina.evaluate(() => game.scene.getScene('Hangar').scene.start('Game', { ship: 0 }));
  await esperarCena(j.pagina, 'Game');
  await j.pagina.evaluate((n) => { const g = game.scene.getScene('Game'); g.ritmoParado = true; g.mods.maxHp = 1e9; g.hp = 1e9;
    ['pulsar', 'missiles', 'shock'].forEach((w) => g.addWeapon(w));
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, r = 250 + Math.random() * 500; const e = g.spawnEnemy('bug', g.player.x + Math.cos(a) * r, g.player.y + Math.sin(a) * r); if (e) e.hp = e.maxHp = 1e6; } }, N);
  await esperar(1500);
  const f0 = await j.pagina.evaluate(() => game.loop.frame); await esperar(4000); const f1 = await j.pagina.evaluate(() => game.loop.frame);
  console.log(N, 'inimigos:', ((f1 - f0) / 4).toFixed(1), 'quadros/s', 'erros', JSON.stringify(j.erros));
  await j.fechar();
})();
