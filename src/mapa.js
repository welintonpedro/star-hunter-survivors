// ============ LOCAIS ÚNICOS DE CADA GALÁXIA (RN-16) ============
// Sempre nas mesmas posições (semente fixa por galáxia). 30 locais por galáxia.
// Ajuste as quantidades em TIPOS_DE_LOCAL. A distância mínima entre locais conta a emenda.

const TIPOS_DE_LOCAL = [
  // tipo, quantidade, nome
  { type: 'planet',    qtd: 6, nome: 'Planeta' },              // 2 escondem armas; os outros dão XP e créditos
  { type: 'station',   qtd: 4, nome: 'Estação de Reparo' },    // cura a vida toda (recarrega em 90 s)
  { type: 'nest',      qtd: 6, nome: 'Ninho Alienígena' },     // ao descobrir, solta um subchefe e inimigos
  { type: 'blackhole', qtd: 3, nome: 'Buraco Negro' },         // puxa tudo; o centro machuca
  { type: 'relic',     qtd: 1, nome: '' },                     // +30% XP e créditos na partida
  { type: 'derelict',  qtd: 4, nome: 'Destroços de Nave' },    // NOVO: escanear solta gemas e créditos
  { type: 'beacon',    qtd: 3, nome: 'Farol de Navegação' },   // NOVO: revela no mapa os 3 locais mais próximos
  { type: 'cache',     qtd: 3, nome: 'Depósito de Suprimentos' } // NOVO: encostar solta cura, ímã e bomba
];
const DISTANCIA_ENTRE_LOCAIS = 900;
const ROMANOS = ['II', 'III', 'IV', 'V', 'VI', 'VII'];

function genPOIs(gi) {
  const rnd = mulberry32(1234 + gi * 977);
  const gal = GALAXIES[gi];
  const hidden = Object.keys(WEAPONS).filter((k) => WEAPONS[k].hidden);
  if (rnd() < 0.5) hidden.reverse();

  const list = [];
  TIPOS_DE_LOCAL.forEach((t) => {
    for (let i = 0; i < t.qtd; i++) {
      const p = { type: t.type, name: t.nome, escala: 0.85 + rnd() * 0.4, variante: i };
      if (t.type === 'planet') {
        const base = gal.planetNames[i % 2];
        p.name = (typeof tx === 'function' ? tx('Planeta') : 'Planeta') + ' ' + (i < 2 ? base : base + ' ' + ROMANOS[Math.floor(i / 2) - 1]);
        if (i < 2) p.weapon = hidden[i];
      }
      if (t.type === 'relic') { p.name = gal.relic; p.escala = 1; }
      list.push(p);
    }
  });

  const c = WORLD / 2;
  list.forEach((p) => {
    for (let tries = 0; tries < 400; tries++) {
      const x = rnd() * WORLD, y = rnd() * WORLD;
      if (Math.hypot(x - c, y - c) < 900) continue; // longe de onde a nave começa
      if (list.some((o) => o !== p && o.x !== undefined &&
        distanciaEnvolvida(o.x, o.y, x, y, WORLD) < DISTANCIA_ENTRE_LOCAIS)) continue;
      p.x = x; p.y = y; break;
    }
    if (p.x === undefined) { p.x = rnd() * WORLD; p.y = rnd() * WORLD; }
  });
  return list;
}
