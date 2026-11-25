// ============ ÍCONES (RN-24, RN-26) ============
// Desenho 12×12 de cada arma, poder e item. O mesmo ícone aparece na carta, no painel,
// na pausa e no códex. A versão evoluída (combo) usa o mesmo desenho com moldura dourada.
const ICONES = {
  rajada: { cores: { a: '#1e3a8a', b: '#60a5fa', c: '#e0f2fe' },
    arte: ['............', '.a.......a..', '.ba.....ab..', '..ba...ab...', '...ba.ab....', '....bab.....', '...abcba....', '..abcccba...', '..abcccba...', '...abcba....', '....aaa.....', '............'] },
  martelo: { cores: { a: '#451a03', b: '#f59e0b', c: '#fef3c7', d: '#78350f', e: '#fbbf24' },
    arte: ['..aaaaaaaa..', '.abbbbbbbba.', '.abcbbbbbba.', '.abbbbbbdba.', '..aaaddaaa..', '.....dd.....', '.....dd.....', '.....dd.....', '..e..dd..e..', '.e...dd...e.', 'e....aa....e', '............'] },
  agulhas: { cores: { a: '#701a75', b: '#f0abfc', c: '#ffffff' },
    arte: ['a...........', '.ab.........', '..abb.......', '...abbc.....', '....abb.....', 'a....a......', '.ab.........', '..abb.......', '...abbc.....', '....abb.....', '.....a......', '............'] },
  pulsar: { cores: { a: '#713f12', b: '#fde047', c: '#fef9c3' },
    arte: ['............', '.....aa.....', '....acca....', '...acbbca...', '..acbbbbca..', '.acbbccbbca.', '.acbbccbbca.', '..acbbbbca..', '...acbbca...', '....acca....', '.....aa.....', '............'] },
  missiles: { cores: { a: '#7c2d12', b: '#e5e7eb', c: '#ef4444', d: '#f97316', e: '#fde047' },
    arte: ['.....aa.....', '....acca....', '....abba....', '....abba....', '....abba....', '....abba....', '...aabbaa...', '..ab.bb.ba..', '..a..dd..a..', '.....ee.....', '....e..e....', '............'] },
  orbital: { cores: { a: '#0c4a6e', b: '#38bdf8', c: '#bae6fd', d: '#7dd3fc' },
    arte: ['....aaaa....', '..aa....aa..', '.a..cc....a.', '.a.cbbc...a.', 'a..cbbc....a', 'a...cc..d..a', 'a......ddd.a', 'a.......d..a', '.a........a.', '.a..d.....a.', '..aa....aa..', '....aaaa....'] },
  shock: { cores: { a: '#4c1d95', b: '#a78bfa', c: '#ede9fe' },
    arte: ['....aaaa....', '..aa....aa..', '.a..bbbb..a.', '.a.b....b.a.', 'a.b..cc..b.a', 'a.b.cccc.b.a', 'a.b.cccc.b.a', 'a.b..cc..b.a', '.a.b....b.a.', '.a..bbbb..a.', '..aa....aa..', '....aaaa....'] },
  chain: { cores: { a: '#155e75', b: '#67e8f9', c: '#ecfeff' },
    arte: ['.......aa...', '......abba..', '.....abba...', '....abba....', '...abbbbaa..', '..aabbbbba..', '....abba....', '...abba.....', '..abba......', '..aba.......', '..aa........', '............'] },
  disc: { cores: { a: '#374151', b: '#9ca3af', c: '#e5e7eb', d: '#1f2937' },
    arte: ['....aaaa....', '..aabbbbaa..', '.abbccccbba.', '.abcbbbbcba.', 'abcbbddbbcba', 'abcbddddbcba', 'abcbddddbcba', 'abcbbddbbcba', '.abcbbbbcba.', '.abbccccbba.', '..aabbbbaa..', '....aaaa....'] },
  core: { cores: { a: '#7f1d1d', b: '#ef4444', c: '#fecaca', d: '#fde047' },
    arte: ['....aaaa....', '...abbbba...', '..abccbbba..', '.abcbbbbbba.', '.abbbbbbbba.', '.abbbddbbba.', '.abbbddbbba.', '.abbbbbbbba.', '..abbbbbba..', '...abbbba...', '....aaaa....', '............'] },
  cooler: { cores: { a: '#60a5fa', b: '#ffffff' },
    arte: ['.....a......', '..a..a..a...', '...a.a.a....', '....aaa.....', 'aaaaabaaaaa.', '....aaa.....', '...a.a.a....', '..a..a..a...', '.....a......', '............', '............', '............'] },
  amp: { cores: { a: '#581c87', b: '#c084fc' },
    arte: ['............', '..a......a..', '.ab......ba.', 'ab..a..a..ba', 'ab.ab..ba.ba', 'ab.ab..ba.ba', 'ab.ab..ba.ba', 'ab..a..a..ba', '.ab......ba.', '..a......a..', '............', '............'] },
  multi: { cores: { a: '#713f12', b: '#facc15' },
    arte: ['............', '.aa..aa..aa.', 'abba.abba.ab', 'abba.abba.ab', '.aa..aa..aa.', '............', '.aa..aa..aa.', 'abba.abba.ab', 'abba.abba.ab', '.aa..aa..aa.', '............', '............'] },
  armor: { cores: { a: '#1e293b', b: '#94a3b8', c: '#e2e8f0', d: '#475569' },
    arte: ['aaaaaaaaaaaa', 'abbbbbbbbbba', 'abccbbbbbbba', 'abcbbbbbbbba', 'abbbbbbbbbba', '.abbbbbbbba.', '.abbbddbbba.', '..abbddbba..', '..abbbbbba..', '...abbbba...', '....abba....', '.....aa.....'] },
  magnet: { cores: { a: '#7f1d1d', b: '#ef4444', c: '#e5e7eb' },
    arte: ['.aaaa..aaaa.', 'abbba..abbba', 'abbba..abbba', 'abbba..abbba', 'abbba..abbba', 'abbbaaaabbba', 'abbbbbbbbbba', '.abbbbbbbba.', '..abbbbbba..', '...aaaaaa...', 'ccc......ccc', '............'] },
  engine: { cores: { a: '#14532d', b: '#4ade80', c: '#dcfce7', d: '#f97316', e: '#fde047' },
    arte: ['....aaaa....', '...abbbba...', '..abbccbba..', '..abbccbba..', '..abbbbbba..', '..abbbbbba..', '..aaaaaaaa..', '...dddddd...', '...ddeedd...', '....deed....', '.....ee.....', '............'] },
  regen: { cores: { a: '#831843', b: '#f472b6', c: '#ffffff' },
    arte: ['....aaaa....', '....abba....', '....abba....', 'aaaaabbaaaaa', 'abbbbccbbbba', 'abbbbccbbbba', 'aaaaabbaaaaa', '....abba....', '....abba....', '....aaaa....', '............', '............'] }
};
// Interrogação usada no códex para o que ainda não foi descoberto
const ICONE_OCULTO = ['....aaaa....','...abbbba...','..abba.bba..','..aa...bba..','.......bba..','......bba...','.....bba....','.....bba....','.....aaa....','............','.....bba....','.....aaa....'];

if (typeof module !== 'undefined') module.exports = { ICONES, ICONE_OCULTO };
