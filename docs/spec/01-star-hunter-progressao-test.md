# 01 — Star Hunter Survivors: progressão, mapa, poderes, códex e conquistas — TESTES

Acompanha o arquivo `01-star-hunter-progressao-spec.md`. As regras (RN-xx) e entregas (E1…E9) são as do spec.
Para testar eventos de 10, 20 e 30 min sem jogar meia hora, use o modo de teste (RN-45). [SUPOSIÇÃO]

---

## 1. Critérios de aceite (para você ler em poucos minutos)

### E1 — Mudança para o GitHub
- **CA-01** Está pronto quando o jogo abre pelo link de teste no celular e funciona igual à v0.2.
- **CA-02** Está pronto quando quem joga pelo link novo atualiza para uma versão nova e continua com os mesmos créditos, naves e melhorias.
- **CA-03** Está pronto quando, num navegador que não deixa salvar, o jogo roda e avisa uma única vez que o progresso não será guardado.
- **CA-04** Está pronto quando o modo de teste deixa pular o relógio da partida e não aparece para quem joga normalmente.
- **CA-05** Está pronto quando automático (60%), progresso offline, hangar, 3 naves e 3 galáxias continuam funcionando como antes.

### E2 — Partida de 30 minutos
- **CA-06** Está pronto quando a partida tem um relógio que vai até 30:00 e, nessa hora, chega a nave-mãe.
- **CA-07** Está pronto quando sobreviver até 30:00 mostra a tela de vitória e libera a próxima galáxia e a próxima nave, mesmo que a nave-mãe destrua o jogador logo depois.
- **CA-08** Está pronto quando aparece um chefe aos 10, 20 e 25 min, cada um visivelmente mais forte, e cada um solta um baú.
- **CA-09** Está pronto quando aparece um subchefe aos 3, 6, 9 … 27 min, cada um solta um baú, e não há subchefe aos 30.
- **CA-10** Está pronto quando matar um chefe não libera nave nem galáxia.
- **CA-11** Está pronto quando o começo tem poucos inimigos e a quantidade cresce aos poucos ao longo da partida.
- **CA-12** Está pronto quando dá para mudar a quantidade de inimigos de um minuto mexendo só na tabela.
- **CA-13** Está pronto quando o jogo pausa pelo botão, pela tecla ESC ou P e ao trocar de aba, e o relógio não anda durante a pausa.
- **CA-14** Está pronto quando ficar em outra aba não conta tempo de partida nem rendimento do automático.

### E3 — Mapa que dá a volta
- **CA-15** Está pronto quando não existe borda: voando reto para qualquer lado, a nave reaparece do outro lado sem salto visível.
- **CA-16** Está pronto quando o mapa é cerca de 8 vezes maior que o atual.
- **CA-17** Está pronto quando inimigos, tiros, gemas e locais continuam funcionando quando estão perto da emenda.
- **CA-18** Está pronto quando cada galáxia tem cerca de 30 locais únicos, com 2 ou 3 tipos novos.
- **CA-19** Está pronto quando o minimapa mostra só o que já foi descoberto, inclusive dos dois lados da emenda.

### E4 e E5 — Inimigos
- **CA-20** Está pronto quando cada galáxia tem 10 inimigos que se parecem e se comportam de jeitos diferentes, sem repetir os das outras galáxias.
- **CA-21** Está pronto quando um inimigo novo entra mais ou menos a cada 3 min.
- **CA-22** Está pronto quando, com a tela cheia, nunca há mais de ~250 inimigos e o jogo continua jogável (se pesar, somem efeitos, não inimigos nem tiros).

### E6 — Poder exclusivo da nave
- **CA-23** Está pronto quando cada nave começa com seu poder no 1º espaço e esse poder nunca aparece nas cartas de outra nave.
- **CA-24** Está pronto quando "melhorar o poder da nave" aparece entre as cartas e leva o poder até o nível 5.
- **CA-25** Está pronto quando, com o poder no nível 5 e o item passivo certo, o próximo baú evolui o poder.
- **CA-26** Está pronto quando o card de cada nave no hangar mostra o ícone e o nome do poder.

### E7 — Cartas por ícone
- **CA-27** Está pronto quando cada carta tem um desenho grande, o nome e um efeito curto, e nenhuma dica de combo.
- **CA-28** Está pronto quando o mesmo poder usa o mesmo desenho na carta, no painel, na pausa e no códex.
- **CA-29** Está pronto quando o painel no canto mostra os ícones dos poderes escolhidos na partida.

### E8 — Combos e códex
- **CA-30** Está pronto quando, ao fazer um combo pela primeira vez, aparece no painel a linha `[A] + [B] = [C]`.
- **CA-31** Está pronto quando um combo descoberto continua descoberto em outra partida, com qualquer nave, mesmo depois de fechar o navegador.
- **CA-32** Está pronto quando a pausa mostra todos os poderes possíveis, os combos já descobertos com ícones e os outros como `[?] + [?] = [?]`.
- **CA-33** Está pronto quando o poder de cada nave também tem um combo secreto que aparece oculto no códex até ser descoberto.
- **CA-34** Está pronto quando a pausa deixa ligar/desligar o automático e recolher a nave.

### E9 — Conquistas
- **CA-35** Está pronto quando existe a tela de Conquistas no hangar com cerca de 20 conquistas, mostrando quais faltam e o que cada uma libera.
- **CA-36** Está pronto quando uma conquista desbloqueada mostra um aviso pequeno no canto e o jogo não pausa.
- **CA-37** Está pronto quando uma arma travada nunca aparece nas cartas, só em baús de subchefe ou locais únicos, e passa a aparecer nas cartas depois de ser achada 3 vezes.
- **CA-38** Está pronto quando os bônus permanentes das conquistas são pequenos e funcionam em todas as partidas seguintes.
- **CA-39** Está pronto quando conquistas e estatísticas (abates, tempo total, melhor tempo por galáxia e nave) continuam salvas depois de fechar o navegador.

---

## 2. Casos de teste (para a IA)

### E1
| ID | Situação | Ação | Resultado esperado |
|---|---|---|---|
| CT-01 | Repositório publicado no GitHub Pages | Abrir o link no celular e no computador | Jogo carrega, hangar aparece, partida inicia sem erro no console |
| CT-02 | Save no link novo, sem número de versão, com 1.500 créditos, nave Titã comprada e 3 melhorias | Abrir a versão com o save versionado | Mesmos créditos, nave e melhorias; save passa a ter número de versão |
| CT-03 | Save corrompido (texto inválido) | Abrir o jogo | Jogo não trava; avisa que o save não pôde ser lido; não apaga o save original sem aviso |
| CT-04 | localStorage bloqueado (aba anônima restrita) | Abrir o jogo e jogar 2 partidas | Aviso aparece uma vez só; jogo funciona normalmente |
| CT-05 | Link sem `?teste=1` | Procurar controles de pular tempo | Não existem |
| CT-06 | Link com `?teste=1` | Avançar relógio para 9:55 | Partida segue a partir de 9:55 |
| CT-07 | Automático ligado, jogo fechado 1 h | Reabrir | Progresso offline calculado como na v0.2 |

### E2
| ID | Situação | Ação | Resultado esperado |
|---|---|---|---|
| CT-08 | Partida em 2:55 | Esperar até 3:00 | Subchefe aparece; ao morrer, solta 1 baú |
| CT-09 | Modo teste | Avançar para 27:00, depois 30:00 | Subchefe aos 27:00; nenhum subchefe aos 30:00 |
| CT-10 | Modo teste | Avançar para 10:00, 20:00, 25:00 | Chefe em cada horário; vida/dano crescente; cada um solta baú |
| CT-11 | Chefe dos 25:00 morto | Verificar hangar após morrer aos 26:00 | Nenhuma nave/galáxia nova liberada |
| CT-12 | Partida em 29:58 | Sobreviver até 30:00 | Nave-mãe aparece; vitória registrada; próxima galáxia e nave liberadas |
| CT-13 | Vitória registrada aos 30:00 | Nave-mãe destrói o jogador aos 30:03 | Tela mostra vitória, não derrota |
| CT-14 | Vencer galáxia 3 (última) | Voltar ao hangar | Sem erro ao tentar liberar "galáxia 4" inexistente |
| CT-15 | Tabela de ondas | Contar inimigos no minuto 1 e no minuto 20 | Minuto 20 bem maior que minuto 1, seguindo a tabela |
| CT-16 | Tabela editada (minuto 5 com o dobro) | Jogar até o minuto 5 | Quantidade muda sem alterar código de lógica |
| CT-17 | Partida em 5:00 | Apertar ESC, esperar 1 min, voltar | Relógio continua em 5:00 |
| CT-18 | Partida em 5:00 | Trocar de aba por 2 min e voltar | Jogo pausado; relógio em 5:00; automático não rendeu esses 2 min |
| CT-19 | Partida em andamento | Apertar P duas vezes rápido | Pausa e despausa uma vez cada, sem travar |

### E3
| ID | Situação | Ação | Resultado esperado |
|---|---|---|---|
| CT-20 | Nave no centro do mapa | Voar reto para a direita por ~17.000 px | Volta ao ponto de partida; nenhuma borda vermelha; sem salto visível |
| CT-21 | Nave perto da emenda direita, inimigo do outro lado | Inimigo persegue | Inimigo vem pelo caminho mais curto (através da emenda) |
| CT-22 | Tiro disparado em direção à emenda | Tiro atravessa | Tiro continua e acerta inimigo do outro lado |
| CT-23 | Gema caída do outro lado da emenda | Nave se aproxima | Gema é atraída e coletada normalmente |
| CT-24 | Local único na emenda | Passar pelo local | Local aparece inteiro, sem cortar ao meio |
| CT-25 | Locais descobertos dos dois lados da emenda | Abrir minimapa | Ambos aparecem nas posições certas |
| CT-26 | Galáxia nova | Contar locais únicos | ~30 locais, com 2 ou 3 tipos novos |

### E4 e E5
| ID | Situação | Ação | Resultado esperado |
|---|---|---|---|
| CT-27 | Galáxia 1, modo teste | Avançar de 3 em 3 min até 27:00 | Um inimigo novo entra a cada ~3 min; 10 diferentes no total |
| CT-28 | Tabela dos 30 inimigos | Comparar comportamentos | Nenhum comportamento repetido entre galáxias |
| CT-29 | Inimigo "divisor" morto | Observar | Vira 2 menores, que contam no limite de 250 |
| CT-30 | Inimigo "ladrão de gemas" | Deixar ele pegar gemas e matá-lo | Gemas roubadas caem de volta |
| CT-31 | Modo teste, minuto 28 | Contar inimigos na tela | Nunca passa de ~250 |
| CT-32 | Computador lento simulado (CPU reduzida) | Jogar no pico | Efeitos visuais diminuem primeiro; acertos e colisões continuam certos |

### E6
| ID | Situação | Ação | Resultado esperado |
|---|---|---|---|
| CT-33 | Nova partida com Falcão | Verificar 1º espaço | Rajada Falcão nível 1 |
| CT-34 | Partida com Titã | Subir 30 níveis anotando as cartas | Nunca aparece Rajada Falcão nem Enxame de Agulhas |
| CT-35 | Poder no nível 5 | Próxima subida de nível | Carta de melhorar o poder não aparece mais |
| CT-36 | Poder nível 5 + passivo certo | Abrir baú | Poder evolui |
| CT-37 | Poder nível 5 sem o passivo | Abrir baú | Poder não evolui; baú entrega outra coisa |
| CT-38 | Hangar | Ver card de cada nave | Ícone e nome do poder exclusivo |

### E7
| ID | Situação | Ação | Resultado esperado |
|---|---|---|---|
| CT-39 | Subir de nível | Ver as 3 cartas | Desenho grande, nome, efeito curto; nenhum texto "COMBO" ou dica |
| CT-40 | Escolher Disco Serra | Comparar ícone na carta, painel, pausa e códex | Mesmo desenho nos 4 lugares |
| CT-41 | Celular em tela pequena | Subir de nível | Desenho continua grande e legível; dá para tocar na carta |
| CT-42 | Carta na tela | Tocar duas vezes rápido | Só uma escolha é registrada |

### E8
| ID | Situação | Ação | Resultado esperado |
|---|---|---|---|
| CT-43 | Nenhum combo descoberto | Fazer um combo | Linha `[A] + [B] = [C]` no painel; combo salvo |
| CT-44 | Combo já descoberto com Falcão | Nova partida com Agulha, abrir códex | Combo aparece como descoberto |
| CT-45 | Combo descoberto | Fechar e reabrir o navegador | Combo continua descoberto |
| CT-46 | Códex aberto | Contar combos ocultos | Todos os não descobertos aparecem como `[?] + [?] = [?]`, sem revelar ícones |
| CT-47 | Poder da nave com combo secreto | Abrir códex antes de descobrir | Combo do poder aparece oculto |
| CT-48 | Pausa | Desligar automático e recolher nave | Automático para; nave volta ao hangar com o que ganhou |
| CT-49 | Mesmo combo feito 2 vezes na partida | Observar | Linha não duplica; nada é salvo em dobro |

### E9
| ID | Situação | Ação | Resultado esperado |
|---|---|---|---|
| CT-50 | Hangar | Abrir Conquistas | ~20 conquistas, com status e recompensa |
| CT-51 | 999 abates no total | Matar 1 inimigo | Aviso no canto; jogo não pausa; conquista salva |
| CT-52 | Disco Serra travado | Subir 30 níveis | Disco Serra nunca aparece nas cartas |
| CT-53 | Disco Serra travado | Abrir baús de subchefe/locais até achar 3 vezes | Contador 1→2→3; na 3ª, passa a aparecer nas cartas em todas as partidas |
| CT-54 | Conquista com +5% de dano | Nova partida | Dano 5% maior, só uma vez (não acumula a cada partida) |
| CT-55 | Duas conquistas no mesmo instante | Observar | Dois avisos, um após o outro, sem sobrepor |
| CT-56 | Conquistas e estatísticas | Fechar e reabrir o navegador | Tudo continua salvo |
| CT-57 | Vencer galáxia 1 com Falcão | Ver conquista "cada galáxia com cada nave" | Progresso marca Falcão × galáxia 1 |

---

## 3. Caminho feliz (resumo)
1. Jogador antigo abre a v0.3 pelo link: créditos e naves estão lá (CT-02).
2. Escolhe o Falcão na galáxia 1; começa com a Rajada Falcão (CT-33).
3. Escolhe cartas pelo desenho; o painel mostra os ícones (CT-39, CT-40).
4. Enfrenta subchefes a cada 3 min e chefes aos 10/20/25, abre baús (CT-08, CT-10).
5. Faz um combo pela primeira vez e vê `A + B = C` (CT-43).
6. Desbloqueia "sobreviver 10 min" com aviso no canto (CT-51).
7. Voa sem encontrar borda e descobre locais no minimapa (CT-20, CT-25).
8. Chega aos 30:00, vê a nave-mãe, ganha a vitória e libera a galáxia 2 e a próxima nave (CT-12, CT-13).
9. No hangar, vê a conquista e o combo salvos no códex (CT-44, CT-50).

---

## 4. Casos de erro
| ID | Caso | Resultado esperado |
|---|---|---|
| CT-03 | Save antigo corrompido | Não trava; avisa; não perde dados sem aviso |
| CT-04 | Sem localStorage | Joga sem salvar; aviso uma vez |
| CT-14 | Vencer a última galáxia | Nada quebra ao não haver próxima |
| CT-18 | Trocar de aba | Pausa; não conta tempo nem automático |
| CT-19 / CT-42 | Clique ou tecla duplicada | Uma ação só |
| CT-31 / CT-32 | Excesso de inimigos / máquina lenta | Limite de 250; cortes só em efeitos |
| CT-21 a CT-24 | Coisas na emenda do mapa | Comportamento igual ao resto do mapa |
| CT-49 | Combo repetido | Sem duplicar |
| CT-55 | Conquistas simultâneas | Avisos em fila |
| CT-58 | Save editado à mão com créditos negativos ou nave inexistente | Jogo corrige para um valor válido e não trava |
| CT-59 | Abrir o jogo em duas abas ao mesmo tempo | A segunda aba não apaga o progresso salvo pela primeira (a última a salvar não pode zerar combos/conquistas) |
| CT-60 | Sem internet depois de carregado | Jogo segue funcionando (tudo é local) |
| CT-61 | Dados sensíveis | Nenhum dado pessoal é coletado nem enviado; o save só tem dados de jogo |

---

## 5. Rastreabilidade

| Regra | Critérios | Casos de teste |
|---|---|---|
| RN-01 | CA-06 | CT-12 |
| RN-02 | CA-07 | CT-12, CT-13, CT-14 |
| RN-03 | CA-08 | CT-10 |
| RN-04 | CA-08, CA-10 | CT-10, CT-11 |
| RN-05 | CA-09 | CT-08, CT-09 |
| RN-06 | CA-11 | CT-15 |
| RN-07 | CA-12 | CT-16 |
| RN-08 | — | — (ver lacunas) |
| RN-09 | CA-20 | CT-27, CT-28 |
| RN-10 | CA-21 | CT-27 |
| RN-11 | CA-20 | CT-28, CT-29, CT-30 |
| RN-12 | CA-22 | CT-31, CT-32 |
| RN-13, RN-15 | CA-15 | CT-20 |
| RN-14 | CA-16 | CT-20 |
| RN-16 | CA-18 | CT-26 |
| RN-17 | CA-19 | CT-25 |
| RN-18 | CA-17 | CT-21 a CT-24 |
| RN-19 | CA-23 | CT-33, CT-34 |
| RN-20 | CA-24 | CT-35 |
| RN-21 | CA-33 | CT-47 |
| RN-22 | CA-23, CA-24, CA-25 | CT-33, CT-35, CT-36, CT-37 |
| RN-23 | CA-26 | CT-33, CT-38 |
| RN-24, RN-25 | CA-27 | CT-39, CT-41 |
| RN-26 | CA-28 | CT-40 |
| RN-27 | CA-30 | CT-43, CT-49 |
| RN-28 | CA-31 | CT-44, CT-45 |
| RN-29 | CA-29, CA-30 | CT-40, CT-43 |
| RN-30 | CA-32 | CT-46, CT-47 |
| RN-31 | CA-13 | CT-17, CT-18, CT-19 |
| RN-32 | CA-34 | CT-48 |
| RN-33 | CA-14 | CT-18 |
| RN-34 | CA-35 | CT-50 |
| RN-35 | CA-37 | CT-52, CT-53 |
| RN-36 | CA-38 | CT-54 |
| RN-37 | CA-35 | CT-50 |
| RN-38 | CA-35, CA-39 | CT-51, CT-57 |
| RN-39 | CA-36 | CT-51, CT-55 |
| RN-40 | CA-05 | CT-07 |
| RN-41 | CA-01 | CT-01 |
| RN-42 | CA-02 | CT-02, CT-03, CT-58 |
| RN-43 | CA-03 | CT-04 |
| RN-44 | CA-39 | CT-56, CT-60, CT-61 |
| RN-45 | CA-04 | CT-05, CT-06 |

### Lacunas
- **RN-08 (alvo de equilíbrio)** não tem teste automático: só se prova jogando. Ela é medida pela métrica de sucesso (3 partidas por galáxia, mediana entre 15 e 30 min).
- **"Escolher a carta só pelo desenho"** (métrica) também depende de você jogar 2 ou 3 partidas; não há caso automático.
- **"Fluido acima de ~50 quadros por segundo"** precisa ser medido no seu computador real; o CT-32 só confere que o corte de efeitos funciona.
- **CT-58 a CT-61** são casos de erro que eu acrescentei e não têm regra própria no plano. Se você concordar, viram regras no spec.
