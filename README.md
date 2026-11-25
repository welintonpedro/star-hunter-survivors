# Star Hunter Survivors

Jogo de navinha estilo Vampire Survivors, feito em Phaser 3, para navegador.

- **Versão atual:** v0.2 (protótipo trazido do Game Creator AI).
- **Próxima versão:** v0.3, planejada em `docs/spec/01-star-hunter-progressao-spec.md`.

## Como jogar no computador
1. Instale o Node.js (https://nodejs.org, versão LTS).
2. Nesta pasta, rode `npx serve .`
3. Abra http://localhost:3000 no navegador.

Controles: WASD/setas ou arrastar · 1/2/3 = escolher carta.

## Modo de teste
Coloque `?teste=1` no fim do link (ex.: http://localhost:3000/?teste=1). Na partida aparecem
botões para avançar o relógio (+1 min, +5 min, ir para 9:55). Sem isso no link, os botões não aparecem.

## Testes automáticos
1. Precisa do Node.js e do Google Chrome instalados.
2. Nesta pasta, rode `npm install` (só na primeira vez: baixa o Phaser e o controlador do Chrome).
3. Rode `npm test`. Cada linha `ok` é um teste que passou; `not ok` mostra o que quebrou.
