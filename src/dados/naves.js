// ============ NAVES ============
// start = poder exclusivo da nave (src/dados/armas.js)
const SHIPS = [
  { id: 'falcao', name: 'Falcão', art: 'ship1', galaxy: 0, cost: 0, hp: 100, speed: 210, dmgMult: 1, cdMult: 1, start: 'rajada',
    palette: { a: '#0b1a33', b: '#3b82f6', c: '#a5f3fc', d: '#1d4ed8', e: '#f97316' }, desc: 'Equilibrada. Boa para começar.' },
  { id: 'tita', name: 'Titã', art: 'ship2', galaxy: 1, cost: 400, hp: 170, speed: 175, dmgMult: 1.25, cdMult: 1.1, start: 'martelo',
    palette: { a: '#2a0f0f', b: '#f59e0b', c: '#fef3c7', d: '#b45309', e: '#ef4444' }, desc: 'Lenta e resistente. Dano alto.' },
  { id: 'agulha', name: 'Agulha', art: 'ship3', galaxy: 2, cost: 1500, hp: 75, speed: 250, dmgMult: 0.85, cdMult: 0.7, start: 'agulhas',
    palette: { a: '#1a0b2e', b: '#e5e7eb', c: '#f0abfc', d: '#a855f7', e: '#22d3ee' }, desc: 'Frágil e veloz. Recarga rápida.' }
];

