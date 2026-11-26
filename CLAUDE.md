# Star Hunter Survivors
Jogo de navinha estilo Vampire Survivors, para navegador.
Um jogador só, sem login; tudo salvo no aparelho.

Rodar: npx serve . e abrir http://localhost:3000
Testes: npm install (uma vez) e npm test. Os de navegador usam o Chrome
  em /usr/bin/google-chrome (ou CHROME_PATH) e o Phaser de node_modules.
Arquivos em src/ são scripts comuns carregados em ordem pelo index.html;
  um arquivo novo precisa de uma linha lá, na posição certa.
Modo de teste: abra o jogo com ?teste=1 para pular o relógio.
Specs ficam em docs/spec/, numerados.
Os testes definem o que é "pronto": se um teste parecer
errado, pergunte antes de alterá-lo, porque mudar o
teste esconde o bug.

## Pegadinhas
- Phaser 3 vem por CDN, sem etapa de build: o GitHub
  Pages publica os arquivos como estão.
- A chave do save é star_hunter_survivors_save_v1. Quem
  joga pelo link do GitHub Pages tem progresso nela; mudar
  o formato exige converter pela versão do save (RN-42),
  senão perde créditos e naves. Save do Game Creator AI
  não chega aqui (outro site), então não há o que converter.
- Toda a arte é gerada por código (ART, pixel por letra).
  Não há pasta de imagens; ícones novos seguem esse padrão.
- Números de equilíbrio (ondas, inimigos, chefes,
  conquistas) ficam em tabelas separadas da lógica, para
  o dono ajustar sem mexer no código (RN-07).
- Texto que o jogador vê passa por tx('texto em português') e precisa de tradução
  nos 6 arquivos de src/idiomas/ (o teste idiomas.test.js aponta o que falta).
  Não use t() como nome: t já é variável local em vários lugares (tempo, tipo).
- Modos: this.modo é 'campanha', 'infinito' ou 'arena' (init da partida). A arena
  fica em src/arena.js; as naves rivais estão no grupo this.enemies com isRival.
- O dono é leigo: explique em português simples o que
  mudou e como testar no navegador.

## Desempenho (o jogo precisa rodar em celular e notebook fraco)
Meça antes e depois de mudar algo pesado: npm run desempenho -- 120
- Camada que cobre a tela inteira (tileSprite ou imagem W×H)
  custa caro: no máximo 2. Uma camada a mais derrubou o teste
  de 60 para 27 quadros/s.
- O Phaser desenha tudo que está visível, mesmo fora da câmera.
  Objetos grandes ou numerosos e parados (nebulosas, meteoros,
  locais) são escondidos longe da tela em esconderLonge().
- O que nasce e morre muito (inimigos, tiros, gemas, faíscas)
  vem de grupo com maxSize e é reaproveitado (get/disable),
  nunca add + destroy a cada vez: criar e destruir gera
  "lixo" e engasgos.
- Dentro de update(): nada de new Map/new Array/filter/map em
  listas grandes a cada quadro; reaproveite (ex.: gradeInimigos).
- Não ligue antialiasGL (suavização de bordas do WebGL): derrubou o teste de 36 para
  20 quadros/s. O texto legível no celular vem de antialias: true (esticar suave).
- Guarde em variável o que é buscado toda hora (cache), em vez
  de percorrer todos os inimigos várias vezes no mesmo quadro.
