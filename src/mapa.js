// Locais únicos de cada galáxia: sempre nas mesmas posições (semente fixa)
function genPOIs(gi) {
  const rnd = mulberry32(1234 + gi * 977);
  const gal = GALAXIES[gi];
  const hidden = Object.keys(WEAPONS).filter((k) => WEAPONS[k].hidden);
  if (rnd() < 0.5) hidden.reverse();
  const list = [
    { type: 'planet', name: 'Planeta ' + gal.planetNames[0], weapon: hidden[0] },
    { type: 'planet', name: 'Planeta ' + gal.planetNames[1], weapon: hidden[1] },
    { type: 'station', name: 'Estação de Reparo' },
    { type: 'nest', name: 'Ninho Alienígena' },
    { type: 'nest', name: 'Ninho Alienígena' },
    { type: 'blackhole', name: 'Buraco Negro' },
    { type: 'relic', name: gal.relic }
  ];
  const c = WORLD / 2;
  list.forEach((p) => {
    for (let tries = 0; tries < 200; tries++) {
      const x = 500 + rnd() * (WORLD - 1000), y = 500 + rnd() * (WORLD - 1000);
      if (Math.hypot(x - c, y - c) < 900) continue;
      if (list.some((o) => o !== p && o.x !== undefined && Math.hypot(o.x - x, o.y - y) < 1000)) continue;
      p.x = x; p.y = y; break;
    }
    if (p.x === undefined) { p.x = 600 + rnd() * (WORLD - 1200); p.y = 600 + rnd() * (WORLD - 1200); }
  });
  return list;
}

