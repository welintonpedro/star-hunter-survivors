const META_UPGRADES = [
  { id: 'dmg',    name: 'Canhões',          desc: '+10% dano',           base: 60 },
  { id: 'hp',     name: 'Blindagem',        desc: '+10% vida',           base: 60 },
  { id: 'rate',   name: 'Refrigeração',     desc: '+6% cadência',        base: 80 },
  { id: 'magnet', name: 'Ímã',              desc: '+15% alcance coleta', base: 50 },
  { id: 'idle',   name: 'Drones de Coleta', desc: '+25% ganho offline',  base: 120 }
];
function metaCost(u, lvl) { return Math.floor(u.base * Math.pow(1.6, lvl)); }

