# 01 — Star Hunter Survivors: progressão, mapa, poderes, códex e conquistas — SPEC

Marcação: **[DECIDIDO]** = você decidiu. **[SUPOSIÇÃO]** = recomendação, ainda sem confirmação.
Itens do plano que vieram sem marcação (seções 5 e 6) foram marcados como [SUPOSIÇÃO] até você confirmar.

---

## 1. Objetivo

- **Dono da dor:** você (criador do jogo) e os futuros jogadores. [DECIDIDO]
- **Problema:** a partida da v0.2 dura ~4 min, a progressão é rasa, as cartas exigem leitura, os combos vêm de bandeja, o mapa tem borda visível e falta motivo para voltar a jogar. [DECIDIDO]
- **Meta desta versão (v0.3):** partida de 30 min com curva de dificuldade, mapa que dá a volta, 30 inimigos únicos, poder exclusivo por nave, cartas por ícone, combos descobertos pelo jogador, códex na pausa e conquistas que liberam conteúdo.

---

## 2. Regras de negócio

### 2.1 Duração, chefes e vitória
- **RN-01** A partida dura 30 min. Aos 30:00 chega a nave-mãe alienígena, que mata o jogador muito rápido. [DECIDIDO]
- **RN-02** Sobreviver até 30:00 é a vitória: conquista a galáxia e libera a próxima galáxia e a próxima nave. [DECIDIDO]
  - A vitória é registrada no instante 30:00, mesmo que a nave-mãe mate o jogador logo depois. [SUPOSIÇÃO]
  - A nave liberada fica disponível para compra com créditos no hangar, como hoje. [SUPOSIÇÃO]
- **RN-03** Chefes de galáxia aos 10:00, 20:00 e 25:00, cada um mais forte que o anterior. [DECIDIDO]
- **RN-04** Os chefes não liberam nave nem galáxia: só dão recompensas. [DECIDIDO]
  - A recompensa de cada chefe é um baú. [SUPOSIÇÃO]
- **RN-05** Subchefes em horários fixos a cada 3 min (3:00, 6:00 … 27:00). Cada um solta um baú. [DECIDIDO]
  - Não há subchefe aos 30:00, porque é a hora da nave-mãe. [SUPOSIÇÃO]
- **RN-47** Com o modo automático ligado, chefes e nave-mãe ficam "detectados" e só aparecem quando o jogador desliga o automático. A vitória só conta com o automático desligado. Subchefes vêm no horário mesmo com o automático ligado. [DECIDIDO em 25/11/2026]
  - Um chefe não derrotado continua na partida quando chega o próximo. [SUPOSIÇÃO]
  - A nave-mãe não pode ser destruída. A partida termina como vitória quando ela destrói o jogador ou depois de 15 s. [SUPOSIÇÃO]

### 2.2 Curva de dificuldade
- **RN-06** A partida começa com poucos inimigos e aumenta aos poucos, sem ficar fácil demais. [DECIDIDO]
  - Cada minuto tem um **mínimo** e um **máximo** de inimigos vivos (tabela src/dados/ondas.js). Abaixo do mínimo, nascem rápido até chegar nele; entre o mínimo e o máximo, nascem no ritmo da tabela; no máximo, param. Os dois crescem até o fim, que termina com muitos inimigos (~160 a 240). Substitui as "ondas fechadas" de 25/11 de manhã, que deixaram o jogo com inimigos de menos. [DECIDIDO em 25/11/2026]
  - Cercos e enxames só começam depois da fase inicial de ondas (a partir de ~5 min). [SUPOSIÇÃO]
- **RN-49** O buraco negro cresce a cada inimigo que engole (puxa de mais longe e o centro que machuca fica maior, até 3x). Inimigo engolido não dá XP, créditos nem conta como abate, para o jogador não ficar parado ao lado "farmando". [DECIDIDO em 25/11/2026]
- **RN-50** Quando a nave não está mirando em ninguém, a frente dela vira para o lado em que está andando. [DECIDIDO em 25/11/2026]
- **RN-51** Planetas maiores e com volume (luz, sombra, atmosfera, alguns com anéis; 4 tipos por galáxia) e fundo do espaço mais bonito (estrelas coloridas, nebulosas em nuvem, galáxias distantes). [DECIDIDO em 25/11/2026]
- **RN-52** Modo automático removido por completo: sem botão AUTO, sem tecla Espaço, sem rendimento de 60%. Substitui RN-32 (parte do automático), RN-33 (parte do automático), RN-40 (parte do automático) e RN-47. [DECIDIDO em 25/11/2026]
- **RN-53** Subir de nível começa rápido e, a partir do nível 8, cada nível fica bem mais caro (fórmula em `src/dados/progressao.js`). Quando não sobra carta normal (tudo no máximo), aparecem cartas de **Sobrecarga** sem fim (+dano, +vida, -recarga, +área, +velocidade, +reparo), para o personagem continuar evoluindo até os 30 min. [DECIDIDO em 25/11/2026]
- **RN-54** Mais inimigos no começo: a tabela por minuto começa em 12 a 20 e sobe mais cedo. [DECIDIDO em 25/11/2026]
- **RN-55** Armas novas só aparecem nas cartas de subir de nível (sorteadas). Baús, locais e meteoros não dão arma; achar uma arma travada só conta a pista (1/3, 2/3, 3/3) e depois de 3 ela passa a sair nas cartas. Meteoros só soltam créditos (cristal vale mais; valores em `src/config.js`). Sem a tela de trocar/descartar arma, que não acontece mais. [DECIDIDO em 25/11/2026]
- **RN-56** Inimigos comuns não dão créditos; subchefes e chefes continuam dando. [DECIDIDO em 25/11/2026]
- **RN-57** Ao abrir o jogo aparece o menu: Continuar (ou Jogar, sem progresso), Novo jogo (apaga tudo com confirmação), Conquistas e Configurações (volume, efeitos reduzidos, tela cheia; guardadas numa chave separada do save). [DECIDIDO em 25/11/2026]
- **RN-58** Partida mais cheia e mais difícil com o tempo: 14 a 20 inimigos no início, cerca de 50 a 80 aos 3 min, 107 a 160 aos 10 min e até 240 no fim. A vida dos inimigos comuns cresce bem mais rápido (cerca de 4,7x aos 10 min, 18x aos 20 min e 65x aos 29 min) e o dano também (até 2,7x). Os números ficam em `src/dados/ondas.js`. [DECIDIDO em 25/11/2026]
- **RN-59** Inimigo comum que fica a mais de 1.300 px da nave (ficou para trás) reaparece na borda da tela, para a contagem de inimigos sempre valer para o que está perto. Minutos 1 a 6 sobem mais devagar (20 a 30 no minuto 1, 45 a 64 no minuto 3). [DECIDIDO em 25/11/2026]
- **RN-60** Sons gerados por código no navegador (sem arquivos): tiro, explosão, meteoro, gema, moeda, dano, chefe, subir de nível, baú e conquista. Cada som tem um intervalo mínimo para não virar barulho; o volume segue as Configurações. Números em `src/sons.js`. [DECIDIDO em 25/11/2026]
- **RN-61** O jogo tem 7 idiomas: português, inglês, espanhol, francês, italiano, alemão e turco. Ao abrir pela primeira vez, o idioma vem do navegador (idioma sem tradução cai no inglês). O jogador troca no menu (botão IDIOMA) ou em Configurações, e a escolha fica guardada. Textos em `src/idiomas/<idioma>.js` (chave = texto em português). Próximos lotes, quando valer a pena: chinês simplificado, japonês e coreano; depois russo. [DECIDIDO em 25/11/2026]
- **RN-62** Meteoro quebrado sorteia um item: créditos (o mais comum), vida, ímã (puxa todas as gemas) ou um poder temporário: **tempo parado** (inimigos param por 5 s), **lentidão** (inimigos a 45% da velocidade por 8 s) ou **lança-chamas** (cone de fogo por 10 s). Cristal dá créditos e mais um item que não é moeda. Pesos e tempos em `src/config.js`. Substitui a parte "meteoros só soltam créditos" da RN-55. [DECIDIDO em 25/11/2026]
- **RN-63** Duas armas novas: **Super Míssil** (lento, explosão enorme, recarga longa; combo com Núcleo de Energia = Ogiva Solar) e **Nova Radial** (atira para todos os lados; combo com Refrigerador = Supernova). Total de combos passa de 9 para 11. [DECIDIDO em 25/11/2026]
- **RN-64** Cada partida sorteia 5 armas comuns que podem sair nas cartas; as outras não aparecem naquela partida. O poder da nave sempre está. Quantidade em `ARMAS_POR_PARTIDA` (`src/config.js`). [DECIDIDO em 25/11/2026]
- **RN-65** Textos legíveis no celular: a tela é esticada de forma suave (antes, em blocos, o que embaralhava letras pequenas); os desenhos continuam nítidos. [DECIDIDO em 25/11/2026]
- **RN-66** Armas supremas: **Laser Aniquilador**, **Chuva de Meteoros** e **Tempestade Trovejante**. São cartas raras com moldura dourada ("ARMA SUPREMA"), muito fortes, sem combo, que ocupam um espaço de arma normal e podem sair em qualquer partida (fora do sorteio de 5 da RN-64). Raridade em `CHANCE_SUPREMA` (`src/config.js`). [DECIDIDO em 25/11/2026]
- **RN-67** Mistura de inimigos: cada inimigo novo que entra tira 20% da chance dos antigos (que nunca caem abaixo de 30%); os que atiram de longe aparecem com menos da metade da chance, o tiro de inimigo comum causa 30% menos dano e o Cuspidor chega mais perto (fica fácil de acertar). Valores em `MISTURA_INIMIGOS` (`src/dados/ondas.js`). [DECIDIDO em 25/11/2026]
- **RN-68** Modo **Infinito**: escolhido ao tocar em JOGAR no hangar. Não tem nave-mãe nem vitória aos 30:00; segue até a nave cair. Depois de 29:00 a vida e o dano dos inimigos crescem 10% por minuto; depois dos 30:00 vem um chefe a cada 5 min e um subchefe a cada 2 min. Pontuação = abates + 2 por segundo + 100 por subchefe + 500 por chefe. O recorde de cada nave fica salvo no aparelho (save versão 5). Números em `src/dados/modos.js`. [DECIDIDO em 25/11/2026]
- **RN-69** Modo **Arena**: battle royale de ~8 min contra 9 naves controladas pelo computador (sem internet). Zona segura vermelha encolhe; fora dela perde vida. Rivais sobem de nível com o tempo, caçam monstros, brigam entre si e atiram no jogador; chefes caçam o jogador aos 2:30, 5:00 e 7:00. Evolução igual à campanha. Rival abatido solta baú e XP. Créditos pela colocação (1º lugar = 600); vitórias e melhor colocação ficam salvos. Números em `src/dados/modos.js` (ARENA). [DECIDIDO em 25/11/2026]
- **RN-70** Naves com nomes de estrelas da sua galáxia: Falcão vira **Altair** (estrela da constelação da Águia), Titã vira **Antares** (gigante vermelha, Cinturão Rubro) e Agulha vira **Rigel** (azul-branca, Abismo Violeta). Os rivais da arena usam a lista de estrelas da galáxia da partida (`ARENA.nomesPorGalaxia`). Conquistas de cada nave renomeadas (Voo de Altair, Fúria de Antares, Brilho de Rigel). Os ids no save não mudam. [DECIDIDO em 26/11/2026]
- **RN-72** Ajudas para iniciantes, no jogo todo (dá para desligar em Configurações): no celular/tablet um botão **MOVER** fica sempre visível no canto e pisca até o jogador se mexer; no computador as teclas (W A S D, setas, ESC/P, 1/2/3) aparecem desenhadas no começo da partida; nas cartas de nível a melhor escolha ganha o selo **★ RECOMENDADO** e brilho dourado (prioridade: completar combo, arma suprema, fortalecer arma que já tem). Celular ou computador é detectado pelo tipo de ponteiro do navegador. [DECIDIDO em 26/11/2026]
- **RN-73** Prólogo: quem abre o jogo pela primeira vez cai direto numa partida roteirizada de ~4 a 5 min no Abismo Violeta (ano 3025), com a nave exclusiva **Eclipse** já forte. Ensina fazendo, com texto curto, voz do navegador, mão animada e setas: tela cheia (botão no alto; não existe no iPhone), mover, a nave atira sozinha, joias, cartas (RECOMENDADO), horda, baú, meteoro com lança-chamas, pausa, cerco com arma suprema, subchefe e chefe. Depois a nave-mãe destrói a Eclipse e uma entidade encapuzada de olhos brilhando diz: "Você nunca vai conseguir me vencer. Volte para seu tempo!". Termina com "Muitos anos antes..." e o menu. Antes da nave-mãe a Eclipse não cai. Não conta créditos, estatísticas, conquistas nem combos. Só aparece uma vez ("Ver prólogo de novo" em Configurações); "Pular história" aparece depois de 20 s. Roteiro e números em `src/dados/prologo.js`. Substitui o tutorial de 4 passos (RN-71, que não chegou a ser publicado). [DECIDIDO em 26/11/2026]
- **RN-74** Infinito e Arena ficam com cadeado até o jogador terminar 1 partida da campanha (qualquer resultado). [DECIDIDO em 26/11/2026]
- **RN-75** Música de fundo gerada por código, bem baixinha (máximo 22% do volume), diferente em cada mapa (2 músicas por galáxia, trocando a cada 3 min) e uma própria no menu. Tem controle "Volume da música" em Configurações. Músicas em `src/musica.js`. [DECIDIDO em 26/11/2026]
- **RN-76** Sem clarões fortes (risco de convulsão): nenhum flash da câmera; os clarões usam no máximo 20% de opacidade e no máximo 1 por segundo (`clarao()` em `src/ajudas.js`). O trovão não pisca a tela e inimigo atingido só fica meio transparente, sem piscar branco. [DECIDIDO em 26/11/2026]
- **RN-77** Conquista **Viajante do Tempo** (+5% XP) ao assistir o prólogo até o fim; quem pula a história não ganha. Aparece um aviso de conquista no menu. É a única coisa que o prólogo conta no progresso (`SAVE.stats.prologo`, saves antigos começam com falso, sem mudar a versão do save). [DECIDIDO em 26/11/2026]
- **RN-78** Menu de quem nunca jogou mostra só **JOGAR** (sem "Novo jogo", porque não há o que apagar). Depois de ter créditos, naves, melhorias ou tempo jogado, aparecem **CONTINUAR** e **NOVO JOGO**. A conquista do prólogo sozinha não conta como "já jogou". [DECIDIDO em 26/11/2026]
- **RN-79** Ritmo do prólogo: 30 monstros já no primeiro segundo e ondas sem parar, elite aos ~12 s de tiro, subchefes no meio da horda (~40 s); as cartas de nível são escolhidas sozinhas (a recomendada) depois que a aula das cartas termina; depois do chefe a comemoração dura 4 s e a nave-mãe chega em 11 s, com monstros vindo o tempo todo (a tela nunca fica vazia, inclusive durante a aula das joias). [DECIDIDO em 26/11/2026]
- **RN-82** Prólogo equilibrado: a vida dos monstros acompanha a força da Eclipse (+20% a cada nível que ela sobe), para que apareçam na tela antes de morrer; subchefes têm vida extra e ficam uns 15 a 20 s na tela. A aula das cartas sempre abre as 3 cartas, mesmo que o jogador já tenha visto uma carta antes (antes travava). Números em `PROLOGO_INICIO` (`src/dados/prologo.js`). [DECIDIDO em 26/11/2026]
- **RN-83** Cada publicação carimba a versão nos scripts (`npm run versao`), para que quem já jogou receba os arquivos novos em vez dos guardados no cache do navegador. Prólogo mais resistente: monstros com 1,8× de vida (+25% por nível da Eclipse), subchefes com 1,9× extra (uns 30 s na tela) e 110 de XP por nível. [DECIDIDO em 26/11/2026]
- **RN-80** Cada combo tem visual próprio e único: cor, tiro brilhante com rastro, explosão e enfeites diferentes (ex.: Rajada Fênix com brasas, Colapso Gravitacional vira buraco negro roxo, Halo Eterno com esferas douradas e halo, Aura Vampírica com a vida voando até a nave, Supernova com anéis arco-íris). A descrição do visual aparece no baú do combo. Cores em `VISUAL_COMBOS` (`src/dados/armas.js`). Tudo reaproveita o estoque de faíscas; medido sem perda de quadros/s. [DECIDIDO em 26/11/2026]
- **RN-81** Lança-chamas com cara de fogo: chamas macias e brilhantes que saem do bico da nave pequenas e brancas, crescem, perdem velocidade e passam de amarelo a laranja, vermelho e fumaça. Estoque próprio (`chamasFx`); com "efeitos reduzidos" sai menos fogo. Medido sem perda de quadros/s. [DECIDIDO em 26/11/2026]
- **RN-46** Meteoros bem perto da nave (até ~150 px) são atacados como se fossem inimigos; meteoros mais longe só quando não há inimigo por perto. Vale para todas as armas, inclusive mísseis. [DECIDIDO em 25/11/2026; distância de 150 px é SUPOSIÇÃO]
- **RN-07** A curva fica numa tabela por minuto (quantidade, ritmo e tipos), separada da lógica. [SUPOSIÇÃO]
- **RN-08** Alvo de equilíbrio: quem escolhe bem as cartas chega aos 30 min com esforço; quem não melhora a nave morre entre 10 e 15 min. [SUPOSIÇÃO]

### 2.3 Inimigos
- **RN-09** 10 inimigos totalmente diferentes por galáxia (visual e comportamento próprios), 30 no total. [DECIDIDO]
- **RN-10** Cada galáxia apresenta um inimigo novo a cada ~3 min. [SUPOSIÇÃO]
- **RN-11** Comportamentos distribuídos sem repetir entre galáxias (perseguidor, rápido, tanque, atirador, kamikaze, divisor, escudo frontal, teleporte, orbitador, invocador, minador, laser que carrega, enxame, ladrão de gemas, curador de aliados e outros até 30). [SUPOSIÇÃO]
- **RN-12** Limite de ~250 inimigos na tela. Se o jogo ficar lento, os efeitos visuais diminuem antes da jogabilidade. [SUPOSIÇÃO]

### 2.4 Mapa
- **RN-13** O mapa parece infinito, mas tem tamanho fixo. [DECIDIDO]
- **RN-14** Tamanho ~8 vezes a área atual, cerca de 17.000×17.000. [DECIDIDO]
- **RN-15** Sem borda: quem sai por um lado reaparece do outro sem perceber. [DECIDIDO]
- **RN-16** ~30 locais únicos por galáxia: os tipos atuais (planeta, estação, ninho, buraco negro, relíquia) com variações, mais 2 ou 3 tipos novos. [SUPOSIÇÃO]
- **RN-17** O minimapa mostra só o que já foi descoberto. [DECIDIDO na v0.2]
- **RN-18** Inimigos, tiros, gemas, locais e minimapa funcionam certo na emenda do mapa. [SUPOSIÇÃO]

### 2.5 Poder exclusivo de cada nave
- **RN-19** Cada nave começa com um poder só dela, que nunca aparece nas cartas de outra nave. [DECIDIDO]
- **RN-20** O poder sobe de nível pelas cartas ("melhorar o poder da nave" pode vir entre as 3 opções). [DECIDIDO]
- **RN-21** O poder também tem um combo secreto, descoberto pelo jogador. [DECIDIDO]
- **RN-22** O poder ocupa o 1º espaço de arma (fixo) e vai até o nível 5. No nível 5, com um item passivo específico da nave, o próximo baú evolui o poder. [SUPOSIÇÃO]
  - O item passivo específico é um dos itens passivos que já existem, não um item novo. [SUPOSIÇÃO]
- **RN-23** Poderes: Falcão = Rajada Falcão (leque que ricocheteia); Titã = Martelo Gravitacional (onda que esmaga e atordoa); Agulha = Enxame de Agulhas (dardos teleguiados rápidos). [SUPOSIÇÃO]

### 2.6 Cartas
- **RN-24** Cada carta tem um desenho grande (ícone em pixel art) do poder. [DECIDIDO]
- **RN-25** Texto mínimo (nome e efeito curto) e nenhuma dica de combo. [DECIDIDO]
- **RN-26** Cada poder tem um ícone próprio, o mesmo na carta, no painel, na pausa e no códex. [SUPOSIÇÃO]

### 2.7 Combos descobertos
- **RN-27** O jogador descobre os combos sozinho; ao fazer um, desbloqueia aquele conhecimento. [DECIDIDO]
- **RN-28** O conhecimento fica salvo para sempre, entre partidas e para todas as naves. [DECIDIDO]
- **RN-29** Painel no canto do mapa mostra os ícones dos poderes escolhidos; quando um combo acontece, aparece a linha `[ícone A] + [ícone B] = [ícone C]`. [DECIDIDO]

### 2.8 Pausa e códex
- **RN-30** A pausa mostra todos os poderes que podem aparecer, os combos descobertos (com ícones) e os não descobertos como `[?] + [?] = [?]`. [DECIDIDO]
- **RN-31** A pausa abre por botão na tela, tecla ESC ou P, e automaticamente ao trocar de aba. [SUPOSIÇÃO]
- **RN-32** Na pausa dá para ligar/desligar o automático e recolher a nave. [SUPOSIÇÃO]
- **RN-33** Ao trocar de aba, o jogo pausa e não conta tempo de partida nem rendimento do automático. [SUPOSIÇÃO]

### 2.9 Conquistas
- **RN-34** O jogo tem conquistas, e elas liberam coisas de jogo (não só créditos ou cores). [DECIDIDO]
- **RN-35** Armas travadas não aparecem nas cartas: só podem ser achadas em baús de subchefe ou em locais únicos. Achar a mesma arma 3 vezes libera ela nas cartas para sempre. [DECIDIDO]
  - Das 6 armas comuns, 2 começam travadas (ex.: Disco Serra). [SUPOSIÇÃO]
  - As travadas são o Disco Serra e o Raio em Cadeia (as "escondidas" da v0.2). Saem de 2 planetas por galáxia e de baús de subchefe (35% de chance, em CHANCE_ARMA_TRAVADA). O cristal, que antes dava arma, passa a dar baú comum, para seguir a regra. [SUPOSIÇÃO — escolha da implementação]
  - Combos: a evolução do Titã usa a Blindagem, o mesmo item da Onda de Choque (só havia 2 itens livres para 3 poderes), como acontece no Vampire Survivors. [SUPOSIÇÃO — escolha da implementação]
- **RN-36** Bônus permanentes pequenos (ex.: +5% de dano, +1 de vida regenerada). [SUPOSIÇÃO]
- **RN-37** ~20 conquistas iniciais, com tela própria no hangar. [SUPOSIÇÃO]
- **RN-38** Exemplos: sobreviver 10/20/30 min; 1º combo e todos os combos; 1.000 e 10.000 abates; todos os locais de uma galáxia; 5 min sem dano; cada galáxia com cada nave. [SUPOSIÇÃO]
- **RN-39** Ao desbloquear, aparece um aviso pequeno no canto, sem pausar o jogo. [SUPOSIÇÃO]

### 2.10 O que continua igual
- **RN-40** Modo automático (rende 60%), hangar com melhorias permanentes, 3 naves e 3 galáxias. [SUPOSIÇÃO]
- **RN-48** Não existe ganho de créditos com o jogo fechado (progresso offline). A melhoria "Drones de Coleta" sai do hangar; quem já tinha comprado recebe os créditos de volta (save versão 3). [DECIDIDO em 25/11/2026]

### 2.11 Base técnica e dados
- **RN-41** O projeto passa a viver no GitHub e é trabalhado com o Claude Code. [DECIDIDO]
  - O código é dividido em arquivos (cenas, armas, inimigos, mapa, conquistas, tabelas de equilíbrio), e uma versão de teste é publicada no GitHub Pages para abrir no celular. [SUPOSIÇÃO]
  - O Game Creator AI deixa de ser o lugar principal deste jogo. [SUPOSIÇÃO]
- **RN-42** Não há conversão do save da v0.2: o navegador guarda o save por site, então o progresso do Game Creator AI não chega ao link novo e ninguém tem save v0.2 nele. [DECIDIDO em 25/11/2026]
  - A partir de agora o save tem número de versão, para que mudanças futuras de formato possam converter o progresso de quem joga pelo link novo. [DECIDIDO em 25/11/2026]
- **RN-43** Se o navegador não tiver localStorage, o jogo roda sem salvar e avisa uma vez. [SUPOSIÇÃO]
- **RN-44** Jogo de um jogador só, sem login; tudo fica no aparelho. [SUPOSIÇÃO]
- **RN-45** Existe um modo de teste (ex.: link com `?teste=1`) que permite avançar o relógio da partida, para testar eventos dos 10, 20 e 30 min sem jogar meia hora. Ele não aparece para o jogador comum. [SUPOSIÇÃO — lacuna preenchida por mim]

---

## 3. Telas, dados e fluxos

### 3.1 Telas
| Tela | O que mostra |
|---|---|
| **Hangar** | Naves (cada card mostra o poder exclusivo com ícone), galáxias, melhorias, créditos, botões novos **Conquistas** e **Códex**. |
| **Partida** | Nave, inimigos, mapa que dá a volta, minimapa (só o descoberto), relógio até 30:00, painel de poderes e combos no canto, botão de pausa, avisos de conquista no canto. |
| **Subir de nível** | 3 cartas com ícone grande, nome e efeito curto. Sem dica de combo. |
| **Pausa / códex** | Poderes possíveis, combos descobertos e ocultos, botão do automático, botão de recolher a nave, botão de continuar. |
| **Conquistas (hangar)** | Lista de ~20 conquistas: bloqueadas e desbloqueadas, com o que cada uma libera. |
| **Fim de partida** | Vitória (sobreviveu até 30:00 → galáxia conquistada, nave/galáxia liberada) ou derrota (tempo sobrevivido, abates, créditos). |

### 3.2 Dados salvos no navegador
- Tudo o que já é salvo hoje (créditos, naves, melhorias).
- Combos descobertos.
- Conquistas desbloqueadas e contadores (ex.: quantas vezes cada arma travada foi achada).
- Armas liberadas nas cartas.
- Estatísticas: abates, tempo total, melhor tempo por galáxia e por nave, locais descobertos por galáxia.
- Galáxias conquistadas e por qual nave.
- Número de versão do save, para converter o formato em versões futuras.

### 3.3 Tabelas de ajuste (arquivos separados da lógica)
- Curva de ondas por minuto, por galáxia.
- Os 30 inimigos (vida, velocidade, dano, comportamento, minuto de entrada).
- Chefes, subchefes e nave-mãe (horário, força, recompensa).
- Conquistas (condição e o que liberam).

### 3.4 Fluxo principal
1. Hangar → escolhe nave e galáxia → inicia partida.
2. Nave começa só com o poder exclusivo no 1º espaço.
3. Mata inimigos → junta gemas → sobe de nível → escolhe 1 entre 3 cartas.
4. A cada 3 min, subchefe → baú. Aos 10, 20 e 25 min, chefe → baú.
5. Baú pode evoluir arma/poder (se a condição estiver cumprida) ou entregar arma travada (contador +1).
6. Ao fazer um combo pela primeira vez → linha `A + B = C` no painel → combo fica salvo para sempre.
7. Ao cumprir uma conquista → aviso no canto → recompensa liberada.
8. Aos 30:00 → nave-mãe → vitória registrada → tela de vitória → próxima galáxia e nave liberadas.
9. Se morrer antes → tela de derrota → volta ao hangar.

---

## 4. Fora do escopo
- Sons e música.
- Números de dano saltando dos inimigos.
- Login e save na nuvem.
- Multiplayer.
- Lançamento na Steam ou no celular.
- Novas galáxias além das 3.
- Novas armas comuns além das 6 atuais (exceto os 3 poderes exclusivos).
- Loja com dinheiro real.
- Ganhar créditos com o jogo fechado (progresso offline): removido a pedido do dono.
- Converter o save da v0.2 (do Game Creator AI) para o link novo.

---

## 5. Entregas

Cada entrega deixa o jogo jogável e testável sozinha.

### E1 — Mudança para o GitHub, sem mudar o jogo
- Leva a v0.2 para o repositório, dividida em arquivos; publica a versão de teste no GitHub Pages.
- Adiciona número de versão ao save e aviso quando não há localStorage.
- Adiciona o modo de teste (avançar relógio).
- **Cobre:** RN-41, RN-42, RN-43, RN-44, RN-45, RN-40, RN-48.
- **Valor sozinha:** o mesmo jogo de hoje, guardado com histórico e jogável pelo celular via link.

### E2 — Partida de 30 minutos
- Relógio até 30:00; subchefes a cada 3 min com baú; chefes aos 10, 20 e 25 com baú; nave-mãe aos 30:00; vitória libera próxima galáxia e nave.
- Curva em tabela por minuto: ondas fechadas nos primeiros ~10 min, fluxo depois (ainda com os 3 inimigos atuais).
- Chefes e nave-mãe esperam o automático desligar.
- Meteoros perto da nave passam a ser atacados.
- Pausa básica (botão, ESC/P, troca de aba) que congela o tempo.
- Modo de teste ganha o botão "próximo evento".
- **Cobre:** RN-01 a RN-08, RN-31, RN-33, RN-46, RN-47.
- **Valor sozinha:** acaba a dor principal (partida curta demais).

### E3 — Mapa que dá a volta
- Mapa ~17.000×17.000 sem borda; tudo funciona na emenda; ~30 locais por galáxia; minimapa adaptado.
- **Cobre:** RN-13 a RN-18.
- **Valor sozinha:** acaba a borda visível e dá o que explorar nos 30 min.

### E4 — Inimigos da galáxia 1 (10 únicos)
- 10 inimigos novos da galáxia 1, entrando a cada ~3 min pela tabela; limite de 250 na tela com redução de efeitos.
- **Cobre:** RN-09 (parcial), RN-10, RN-11 (parcial), RN-12.
- **Valor sozinha:** a galáxia 1 inteira já tem variedade real.

### E5 — Inimigos das galáxias 2 e 3 (20 únicos)
- Mais 20 inimigos, sem repetir comportamento entre galáxias.
- **Cobre:** RN-09 (completo), RN-11 (completo).

### E6 — Poder exclusivo de cada nave
- 3 poderes no 1º espaço, níveis 1 a 5 pelas cartas, evolução com passivo + baú; card da nave no hangar mostra o poder.
- **Cobre:** RN-19, RN-20, RN-22, RN-23.

### E7 — Cartas por ícone e painel no canto
- Ícone pixel art para cada poder/arma/item; cartas com ícone grande, nome e efeito curto, sem dica de combo; painel no canto com os ícones escolhidos.
- **Cobre:** RN-24, RN-25, RN-26, RN-29 (parte dos ícones).

### E8 — Combos descobertos e códex
- Combos salvos para sempre ao serem feitos; linha `A + B = C` no painel; combo secreto do poder da nave; códex na pausa (descobertos e ocultos) e no hangar; automático e recolher nave na pausa.
- **Cobre:** RN-21, RN-27, RN-28, RN-29, RN-30, RN-32.

### E9 — Conquistas
- ~20 conquistas em tabela; tela no hangar; aviso no canto sem pausar; armas travadas achadas em baús/locais e liberadas após 3 achados; bônus permanentes; estatísticas salvas.
- **Cobre:** RN-34 a RN-39.

---

## 6. Métrica de sucesso
- **Antes (v0.2):** a partida acaba em ~4 min (chefe aos 4:00). Não há conquistas nem combos a descobrir.
- **Depois:** [SUPOSIÇÃO]
  - em 3 partidas de teste por galáxia, jogando direito, a duração mediana fica entre 15 e 30 min, e pelo menos 1 em 3 chega aos 30:00;
  - o jogo fica fluido (acima de ~50 quadros por segundo) no seu computador, com a tela cheia de inimigos;
  - você escolhe as cartas olhando só o desenho depois de 2 ou 3 partidas.
- **Quando medir:** logo após cada entrega, no navegador do computador e pelo link de teste no celular. A medição de duração completa só faz sentido a partir da E4 (com inimigos novos) e de novo ao final da E9.
