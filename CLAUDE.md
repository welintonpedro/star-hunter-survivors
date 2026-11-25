# Star Hunter Survivors
Jogo de navinha estilo Vampire Survivors + idle, para navegador.
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
- O dono é leigo: explique em português simples o que
  mudou e como testar no navegador.
