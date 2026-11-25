// Ganho offline removido a pedido do dono (RN-48 · CT-07, CT-71)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { abrirJogo, esperarCena } = require('./ajuda/navegador');

test('CT-07/CT-71: voltar depois de horas não dá créditos; Drones de Coleta some e é reembolsado', async () => {
  const save = { versao: 2, credits: 1000, owned: { falcao: true, tita: true }, cleared: [true, false, false],
    meta: { dmg: 0, hp: 0, rate: 0, magnet: 0, idle: 2 }, bestRate: [500, 300, 0], lastSeen: Date.now() - 3 * 3600 * 1000 };
  const { pagina, erros, fechar } = await abrirJogo({ saveInicial: JSON.stringify(save) });
  try {
    await esperarCena(pagina, 'Hangar');
    await new Promise((r) => setTimeout(r, 500));
    const r = await pagina.evaluate(() => ({
      creditos: SAVE.credits,
      textos: game.scene.getScene('Hangar').children.list.filter((o) => o.type === 'Text').map((o) => o.text).join(' | ')
    }));
    assert.equal(r.creditos, 1000 + 120 + 192, 'só o reembolso, nenhum crédito offline');
    assert.ok(!r.textos.includes('BEM-VINDO'), 'não pode haver janela de ganho offline');
    assert.ok(!r.textos.includes('Drones de Coleta'), 'a melhoria offline não pode aparecer');
    assert.ok(!r.textos.includes('farmam'), 'não pode haver texto de ganho offline');
    assert.deepEqual(erros, []);
  } finally { await fechar(); }
});
