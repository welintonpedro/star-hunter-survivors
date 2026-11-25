// ============ IDIOMAS (RN-61) ============
// O texto original do jogo é o português. Cada idioma tem um dicionário em src/idiomas/
// com "texto em português" → "tradução". Texto sem tradução aparece em português.
// Partes que mudam (números, nomes) ficam entre chaves: 'Nível {n}' → tx('Nível {n}', { n: 5 }).

const IDIOMAS = [
  { id: 'pt', nome: 'Português' },
  { id: 'en', nome: 'English' },
  { id: 'es', nome: 'Español' },
  { id: 'fr', nome: 'Français' },
  { id: 'it', nome: 'Italiano' },
  { id: 'de', nome: 'Deutsch' },
  { id: 'tr', nome: 'Türkçe' }
];
// Cada arquivo de src/idiomas/ preenche TRADUCOES.<id>
const TRADUCOES = (typeof TRADUCOES_CARREGADAS !== 'undefined') ? TRADUCOES_CARREGADAS : {};

// Escolhe o idioma pela lista do navegador; se nenhum servir, inglês (o mais entendido no mundo)
function detectarIdioma(lista) {
  for (const l of lista || []) {
    const base = String(l).toLowerCase().split('-')[0];
    if (IDIOMAS.some((i) => i.id === base)) return base;
  }
  return 'en';
}
function _idiomaInicial() {
  if (PREFS.idioma && IDIOMAS.some((i) => i.id === PREFS.idioma)) return PREFS.idioma;
  // no Poki, o idioma vem do próprio Poki (PokiSDK.getLanguage, recomendação do guia deles)
  try {
    if (typeof PokiSDK !== 'undefined' && PokiSDK.getLanguage) {
      const p = PokiSDK.getLanguage();
      if (p) return detectarIdioma([p]);
    }
  } catch (e) { /* sem Poki: segue para o navegador */ }
  const nav = typeof navigator !== 'undefined' ? (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]) : [];
  return detectarIdioma(nav);
}
let IDIOMA = _idiomaInicial();

function tx(texto, vars) {
  let s = texto;
  if (IDIOMA !== 'pt' && TRADUCOES[IDIOMA] && TRADUCOES[IDIOMA][texto] !== undefined) s = TRADUCOES[IDIOMA][texto];
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
  return s;
}

// Textos que vêm das tabelas (armas, itens, naves, conquistas...): guarda o português
// original uma vez e troca pelo idioma atual. Chamado ao abrir o jogo e ao mudar o idioma.
const _CAMPOS_TRADUZIVEIS = ['name', 'nome', 'desc', 'evoName'];
function _traduzirLista(lista) {
  lista.forEach((o) => {
    if (!o || typeof o !== 'object') return;
    if (!o.__pt) {
      o.__pt = {};
      _CAMPOS_TRADUZIVEIS.forEach((c) => { if (o[c] !== undefined) o.__pt[c] = Array.isArray(o[c]) ? o[c].slice() : o[c]; });
    }
    Object.keys(o.__pt).forEach((c) => {
      const v = o.__pt[c];
      o[c] = Array.isArray(v) ? v.map((x) => tx(x)) : (typeof v === 'string' && v ? tx(v) : v);
    });
  });
}
function traduzirDados() {
  const listas = [];
  if (typeof WEAPONS !== 'undefined') listas.push(Object.values(WEAPONS));
  if (typeof PASSIVES !== 'undefined') listas.push(Object.values(PASSIVES));
  if (typeof SOBRECARGAS !== 'undefined') listas.push(Object.values(SOBRECARGAS));
  if (typeof SHIPS !== 'undefined') listas.push(SHIPS);
  if (typeof GALAXIES !== 'undefined') listas.push(GALAXIES);
  if (typeof META_UPGRADES !== 'undefined') listas.push(META_UPGRADES);
  if (typeof CONQUISTAS !== 'undefined') listas.push(CONQUISTAS);
  if (typeof TIPOS_DE_LOCAL !== 'undefined') listas.push(TIPOS_DE_LOCAL);
  listas.forEach(_traduzirLista);
  // relíquia de cada galáxia (nome próprio, mas pode ter palavra comum)
  if (typeof GALAXIES !== 'undefined') GALAXIES.forEach((g) => { if (g.__relic === undefined) g.__relic = g.relic; if (g.__relic) g.relic = tx(g.__relic); });
}

function mudarIdioma(id) {
  if (!IDIOMAS.some((i) => i.id === id)) return;
  IDIOMA = id;
  PREFS.idioma = id;
  salvarPrefs();
  traduzirDados();
}
traduzirDados();
