// ============ PIXEL ART (cada letra = 1 pixel, "." = transparente) ============
const ART = {
  ship1: ['.......aa.......', '......abba......', '......abba......', '.....abccba.....', '.....abccba.....', '....aabbbbaa....', '...aabbbbbbaa...', '..aabbddddbbaa..', '.aabbbddddbbbaa.', 'aabbbbbbbbbbbbaa', 'abbaabbbbbbaabba', 'ab..aabbbbaa..ba', 'a....aeeeea....a', '......e..e......', '................', '................'],
  ship2: ['................', '.......aa.......', '......abba......', '.a....abba....a.', '.ba..abccba..ab.', '.bba.abccba.abb.', '.bbbabbbbbbabbb.', '.bbbbbddddbbbbb.', '.bbbbbddddbbbbb.', '.abbbbbbbbbbbba.', '..abbbbbbbbbba..', '...aabbbbbbaa...', '....a.eeee.a....', '......e..e......', '................', '................'],
  ship3: ['.......aa.......', '.......bb.......', '......abba......', '......abba......', '.....abccba.....', '.....abccba.....', '....abbddbba....', '...abbbddbbba...', '..abbbbbbbbbba..', '.abbaabbbbaabba.', 'abba..abba..abba', 'aba...abba...aba', 'aa....aeea....aa', '.......ee.......', '................', '................'],
  bug: ['..a......a..', '...a....a...', '..abbbbbba..', '.abbbbbbbba.', 'abbcbbbbcbba', 'abbcbbbbcbba', 'abbbbbbbbbba', '.abbbbbbbba.', '..ab.ab.ba..', '.ab..ab..ba.', '.a...a....a.', '............'],
  saucer: ['....aaaa....', '...acccca...', '..acccccca..', 'aaaaaaaaaaaa', 'abbdbbdbbdba', 'abbbbbbbbbba', '.aaaaaaaaaa.', '..a..a.a..a.'],
  diamond: ['.....a.....', '....aba....', '...abcba...', '..abcccba..', '.abcccccba.', 'abcccccccba', '.abcccccba.', '..abcccba..', '...abcba...', '....aba....', '.....a.....'],
  rock: ['....aaaa....', '..aabbbbaa..', '.abbbcbbbba.', '.abcbbbbcba.', 'abbbbbbbbbba', 'abbcbbbbbbba', 'abbbbbbcbbba', 'abbbbbbbbbba', '.abcbbbbbba.', '.abbbbbcbba.', '..aabbbbaa..', '....aaaa....'],
  chest: ['.aaaaaaaa.', 'abbbbbbbba', 'abbbccbbba', 'aaaaccaaaa', 'abbbbbbbba', 'abbbbbbbba', 'abbbbbbbba', 'aaaaaaaaaa'],
  heal: ['..aaaa..', '..abba..', 'aaabbaaa', 'abbbbbba', 'abbbbbba', 'aaabbaaa', '..abba..', '..aaaa..'],
  coin: ['...aa...', '..abba..', '.abbbba.', 'abbccbba', 'abbccbba', 'abbbbbba', '.abbbba.', '..aaaa..'],
  magnet: ['cc....cc', 'ab....ba', 'ab....ba', 'ab....ba', 'abb..bba', '.abbbba.', '..aaaa..', '........'],
  bomb: ['.....c..', '....c...', '..aaaa..', '.abbbba.', 'abbcbbba', 'abbbbbba', '.abbbba.', '..aaaa..'],
  congelar: ['..a..a..', 'a.abba.a', '.abbbba.', 'abbccbba', 'abbccbba', '.abbbba.', 'a.abba.a', '..a..a..'],
  lento: ['aaaaaaaa', '.abbbba.', '..abba..', '...cc...', '...cc...', '..abba..', '.abbbba.', 'aaaaaaaa'],
  chamas: ['...a....', '..aba...', '..abba..', '.abbcba.', '.abccba.', 'abcccba.', 'abcccbba', '.aaaaaa.'],
  wbox: ['..aaaa..', '.abccba.', 'abccccba', 'acccccca', 'acccccca', 'abccccba', '.abccba.', '..aaaa..']
};

