# Star Hunter Survivors
Jogo de navinha estilo Vampire Survivors, para navegador.
Um jogador só, sem login; tudo salvo no aparelho.

Rodar: npx serve . e abrir http://localhost:3000
Testes: npm install (uma vez) e npm test. Os de navegador usam o Chrome
  em /usr/bin/google-chrome (ou CHROME_PATH) e o Phaser de node_modules.
Arquivos em src/ são scripts comuns carregados em ordem pelo index.html;
  um arquivo novo precisa de uma linha lá, na posição certa.
Modo de teste: abra o jogo com ?teste=1 para pular o relógio.
Antes de publicar: npm run versao (carimba ?v= nos scripts do index.html; sem isso o
  navegador de quem já jogou pode ficar com .js antigo em cache). Linha nova de script
  no index.html: use src="src/arquivo.js" e rode o comando, ele põe o carimbo.
Specs ficam em docs/spec/, numerados.
Os testes definem o que é "pronto": se um teste parecer
errado, pergunte antes de alterá-lo, porque mudar o
teste esconde o bug.

## Pegadinhas
- Phaser 3 fica em lib/phaser.min.js (o Poki proíbe buscar arquivos em
  outros sites), sem etapa de build: o GitHub Pages publica os arquivos como estão.
- Poki: src/poki.js (pokiJogando, pokiParado, pokiIntervalo). Toda saída do jogo
  (pausa, fim, cena) chama pokiParado; toda volta ao jogo, pokiJogando. Sem o PokiSDK
  tudo vira "não faz nada". npm run poki gera dist-poki/ para enviar. NA_POKI = versão
  do Poki: sem modo de teste e sem tela cheia. Regras: docs do Poki em requirements-quality.
- W e H (src/config.js) mudam conforme o aparelho (RN-88): 960×540 no computador, mais largo no
  celular, mais alto no tablet. Posicione a interface a partir de W/H (W - 140, H / 2), nunca 960/540.
  Os testes rodam em 960×540; para outro tamanho, mude o viewport e recarregue a página.
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
- Modos: this.modo é 'campanha', 'infinito', 'arena' ou 'prologo' (init da partida).
  A arena fica em src/arena.js (rivais no grupo this.enemies com isRival); o prólogo em
  src/prologo.js e não pode mexer no progresso (créditos, estatísticas, conquistas).
- Os testes de navegador abrem com o prólogo já visto; use abrirJogo({ prologo: true })
  para testar como jogador novo.
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
