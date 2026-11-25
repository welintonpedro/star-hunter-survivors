// ============ PROGRESSÃO DO PERSONAGEM NA PARTIDA ============
// Ajuste aqui o ritmo de subir de nível e as cartas de Sobrecarga, sem mexer na lógica.

// XP para passar do nível n para o n+1. Cresce aos poucos: o personagem completo
// (todas as armas e itens no máximo) chega perto dos 20-28 min, não aos 9.
function xpParaProximoNivel(n) {
  // começo rápido (como antes) e, a partir do nível 8, cada nível fica bem mais caro
  return Math.round(6 + 4 * n + 0.3 * n * n + 4 * Math.max(0, n - 7) ** 2);
}

// Sobrecarga: cartas sem limite que aparecem quando faltam cartas normais (tudo no máximo).
// Assim o personagem continua ficando mais forte até os 30 min.
const SOBRECARGAS = {
  dano:       { nome: 'Sobrecarga de Dano',     desc: '+6% de dano',            icone: 'core',   valor: 0.06 },
  vida:       { nome: 'Sobrecarga de Casco',    desc: '+8% de vida máxima',     icone: 'armor',  valor: 0.08 },
  recarga:    { nome: 'Sobrecarga de Recarga',  desc: '-4% de recarga',         icone: 'cooler', valor: 0.04, max: 10 },
  area:       { nome: 'Sobrecarga de Área',     desc: '+6% de área',            icone: 'amp',    valor: 0.06 },
  velocidade: { nome: 'Sobrecarga de Motor',    desc: '+4% de velocidade',      icone: 'engine', valor: 0.04, max: 10 },
  regen:      { nome: 'Sobrecarga de Reparo',   desc: '+0,5 de vida por segundo', icone: 'regen', valor: 0.5 }
};

if (typeof module !== 'undefined') module.exports = { xpParaProximoNivel, SOBRECARGAS };
