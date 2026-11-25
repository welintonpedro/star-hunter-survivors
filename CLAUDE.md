# Star Hunter Survivors
Jogo de navinha estilo Vampire Survivors + idle, para navegador.
Um jogador só, sem login; tudo salvo no aparelho.

Rodar: npx serve . e abrir http://localhost:3000
Testes: definidos na entrega E1 (docs/spec/01-star-hunter-progressao-test.md)
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
