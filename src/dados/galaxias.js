// ============ GALÁXIAS ============
const GALAXIES = [
  { name: 'Nebulosa Esmeralda', bg: '#04140d', starTint: 0x86efac, hpMult: 1, speedMult: 1, rewardMult: 1,
    alien: { a: '#052e16', b: '#22c55e', c: '#fde047', d: '#15803d' }, planet: ['#0e7490', '#22d3ee'],
    planetNames: ['Kepler-7', 'Vesta Prime'], relic: 'Coroa Estelar',
    chefe: { nome: 'Rainha Colmeia', ataque: 'esporos' } },          // inseto gigante: espirais de ácido (RN-85)
  { name: 'Cinturão Rubro', bg: '#170507', starTint: 0xfca5a5, hpMult: 2.4, speedMult: 1.12, rewardMult: 3,
    alien: { a: '#450a0a', b: '#ef4444', c: '#fef08a', d: '#991b1b' }, planet: ['#9a3412', '#fb923c'],
    planetNames: ['Ignis', 'Magmara'], relic: 'Olho de Rubi',
    chefe: { nome: 'Encouraçado Carmesim', ataque: 'plasma' } },     // nave de guerra: canhões de plasma e mísseis
  { name: 'Abismo Violeta', bg: '#0d0518', starTint: 0xd8b4fe, hpMult: 5.5, speedMult: 1.25, rewardMult: 8,
    alien: { a: '#2e1065', b: '#a855f7', c: '#67e8f9', d: '#6b21a8' }, planet: ['#4c1d95', '#e879f9'],
    planetNames: ['Nyx', 'Umbra-9'], relic: 'Prisma do Vazio',
    chefe: { nome: 'Olho do Abismo', ataque: 'cristais' } }          // criatura cósmica: anéis de cristal
];

if (typeof module !== 'undefined') module.exports = { GALAXIES };
