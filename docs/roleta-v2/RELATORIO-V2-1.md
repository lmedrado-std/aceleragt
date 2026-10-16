# Roleta V2.1 — relatório da Tarefa 002 (suspense, áudio e celebração)

Branch: `feat/roleta-v2-1` (derivada de `origin/developer` @ `6522130`). Sem merge, sem push, `main` e banco intocados.

## 1. Causa da animação curta (medida antes de alterar)
Medição real no Chromium, amostrando a rotação do SVG a cada quadro, na versão publicada:

| Situação | Rotação total | % do trajeto em 1 s / 2 s / 3 s / 6 s | Movimento perceptível até |
|---|---|---|---|
| Normal (9 s configurados) | 2.988° | 69% / 83% / 90% / 99% | ~8,6 s, mas 90% já em 3 s |
| `prefers-reduced-motion` | 705° | 100% em 1,2 s | 1,1 s, **sem som e sem confete** |

1. **Curva concentrada no início.** A curva única `cubic-bezier(.07,.72,.04,1)`, herdada da referência, faz quase todo o percurso no começo. Os 9 s existiam, mas ~6 s eram um rastejo imperceptível. O giro "parecia" durar ~3 s.
2. **Movimento reduzido ativo no aparelho.** O Windows liga essa preferência quando "Efeitos de animação" está desativado. Nesse caso o giro caía para 1,2 s, e o código desligava o som e o confete. Isso explica "os efeitos quase não aparecem".
3. **Tic por cronômetro.** O "tic" tocava num timer fixo, sem relação com as fatias passando, e o confete era um único disparo.

## 2. O que mudou
- **Motor de giro** (`src/lib/wheel/motion.ts`, novo, puro e testado):
  - ângulo calculado quadro a quadro, com arranque (~0,8 s), velocidade sustentada (até ~3,4 s) e desaceleração longa;
  - **12 s fixos** e 11 voltas, que não encurtam se o servidor responder rápido;
  - medido: 43% do trajeto em 3 s, 81% em 6 s, 98% em 9 s; 2 a 3 fatias ainda passam devagar nos 3 s finais;
  - recuo final de até 3° que nunca cruza a divisa;
  - ângulo final = `stopAngleDeg` do servidor, verificado para 2 a 12 fatias.
- **Efeitos de giro** (`prize-wheel.tsx`, `wheel-svg.tsx`, CSS):
  - um tic por divisa que passa no ponteiro (~95 por giro com 8 fatias);
  - ponteiro que balança a cada pino;
  - 24 luzes no aro que piscam no ritmo da fase;
  - mensagens de suspense em 5 etapas;
  - zoom e foco na reta final (últimos 3,2 s);
  - fatia vencedora pulsando com brilho;
  - vibração curta nos tics finais (Android).
- **Áudio** (`wheel-audio.ts`, reescrito, 100% sintetizado):
  - sons: arranque ("whoosh"), rolamento com intensidade pela velocidade, trilha crescente, rufar de tambor acelerando nos 3 s finais, batida de parada, fanfarra de metais na vitória e "uóóó" suave no "Tente novamente";
  - o áudio só é liberado no clique;
  - o mudo zera tudo na hora e fica salvo no navegador;
  - fontes rastreadas e encerradas entre giros, então os sons não acumulam;
  - as referências não têm arquivos de áudio (também sintetizam), então não havia o que reaproveitar.
- **Celebração** (`wheel-celebration.tsx`, novo):
  - abre 450 ms depois que a roda para;
  - efeitos visuais por ~5,2 s: canhões de confete nas laterais, fogos, chuva de estrelas, 14 balões e brilhos;
  - cartão com ícone, nome, valor, descrição, "Girar de novo" e "Voltar à roleta";
  - a fanfarra toca junto com a abertura;
  - nunca repete ao re-renderizar (guarda por `spinId`, compatível com o modo estrito do React);
  - ancorada na área visível da tela (`visualViewport`);
  - fecha com Esc ou clique fora.
- **Layout** (pedido do usuário): roleta no topo; título, saldo, mudo, último resultado e lista de prêmios na coluna lateral (≥1024 px). Em monitores de 768 px de altura, roda e botão cabem inteiros na tela. No celular, roda no topo, botão logo abaixo e textos depois.
- **Movimento reduzido:** giro de 3 s sem confete e sem balões; resultado em diálogo acessível; som mantido (som não é movimento).
- **Servidor:** janela anti-repetição de 4 s para 2,5 s. O giro reduzido dura 3 s e "Girar de novo" bateria na janela antiga; clique duplo e reenvio continuam bloqueados.

## 3. Referências pedidas
| Projeto | Decisão |
|---|---|
| `catdad/canvas-confetti` | **Usado.** Já era dependência; canhões laterais, fogos e estrelas via `confetti.create` num canvas próprio. |
| `goldfire/howler.js` | Não incluído. Howler serve para tocar arquivos de áudio, e aqui todos os sons são sintetizados com Web Audio; seria dependência sem uso. |
| `ihakalanka/react-confetti-burst` | Não incluído. Redundante com `canvas-confetti`. |
| `armineslami/wheel-of-fortune` | Não incluído. O motor SVG atual foi mantido, como pedido. |

Nenhuma dependência nova: `package.json` e `package-lock.json` não mudaram.

## 4. Testes executados
| Suíte | Resultado |
|---|---|
| Unitários (Vitest): motor de sorteio e motor de giro | **24/24** |
| Integração (Vitest + Postgres local): APIs da roleta | **16/16** |
| Ponta a ponta (Playwright, modo dev) | **12/12** |
| Ponta a ponta (Playwright, **build de produção** `next start`) | **12/12** |
| `next build` | OK (fonte Google simulada, porque o sandbox bloqueia fonts.googleapis.com) |
| `tsc --noEmit` | 0 erros novos |

Critérios de aceite da Tarefa 002 (`tests/e2e/roleta-v21.spec.ts`):
1. **Tempo real da animação:** medido no navegador entre 11,3 s e 12,8 s; registro interno 12.016–12.066 ms.
2. **Voltas:** rotação total acima de 3.600° (medido ~4.270°, quase 12 voltas).
3. **Prêmio = servidor:** a fatia sob o ponteiro (lida da rotação real) e o cartão mostram o `prize.id` do servidor.
4. **Áudio:** com som, cada som toca exatamente 1 vez e os tics passam de 40. Silenciado, nenhum som toca e o AudioContext nem é criado.
5. **Celebração após a parada:** aos 6 s não há celebração (fase `spinning`); ela abre depois da parada medida.
6. **Dois giros seguidos:** 2 arranques e 2 fanfarras; nenhuma fonte de áudio pendurada depois; nenhum erro de página.
7. **390 px:** roda acima dos textos, nada transborda e o cartão cabe na tela.
8. **Créditos:** os efeitos não consomem crédito; o servidor mostra exatamente 1 crédito e 1 giro por giro.
9. **Build e suíte anterior:** os testes da V2 continuam passando.

## 5. Limitações e pontos de atenção
- **Movimento reduzido:** se o computador da loja estiver com "Efeitos de animação" desligados, a roleta continua em modo curto (3 s, sem confete), por acessibilidade. Para a experiência completa, ative no Windows: Configurações → Acessibilidade → Efeitos visuais → Efeitos de animação.
- **Vibração:** só funciona no Android; o iPhone não permite vibração pela web.
- **Áudio no iPhone:** toca normalmente após o toque no botão. Com a chave de silencioso física ligada, o iOS pode silenciar áudio da web.
- **Cabeçalho do painel no celular:** a página tem 571 px de largura em telas de 390 px por causa do cabeçalho (`goal-getter-dashboard`, outro módulo, já era assim). A celebração foi ancorada na área visível para não ser afetada. A correção do cabeçalho fica para outra tarefa.
- **Teste do gestor** (herdado da V2): a primeira chamada a `/api/wheel/grant` em modo dev compila a rota e já excedeu os 5 s de espera; a espera foi ampliada para 20 s.
- **APIs continuam sem autenticação** (fora do escopo, como na V2).

## 6. Arquivos
| Arquivo | Mudança |
|---|---|
| `src/lib/wheel/motion.ts` | novo: perfil de 12 s, recuo seguro |
| `src/components/prize-wheel.tsx` | giro por quadro, tics, fases, celebração, layout lateral |
| `src/components/wheel/wheel-audio.ts` | reescrito: áudio imersivo sintetizado |
| `src/components/wheel/wheel-celebration.tsx` | novo: confete, fogos, balões, brilhos, cartão |
| `src/components/wheel/wheel-svg.tsx` | luzes no aro, ponteiro animável, brilho do vencedor, estados visuais |
| `src/components/wheel/prize-wheel.module.css` | estilos de fase, celebração e layout |
| `src/lib/wheel/server.ts` | janela anti-repetição 2,5 s |
| `tests/unit/motion.test.ts`, `tests/e2e/roleta-v21.spec.ts` | novos |
| `tests/e2e/roleta.spec.ts` | tempos ajustados ao giro de 12 s |
