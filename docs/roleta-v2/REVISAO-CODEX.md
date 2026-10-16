# Roleta V2 — pacote para revisão independente (Codex)

Branch: `feat/roleta-v2` (derivada de `origin/developer` @ `fb30fdc`)
Escopo: roleta do vendedor, concessão de giros, configuração de prêmios, histórico de giros.
Fora do escopo (não alterado): autenticação, login, metas, vendas, histórico de períodos, admin global, `schema.prisma`, banco.

## Commits
| Commit | Conteúdo |
|---|---|
| `feat(roleta): motor puro…` | `src/lib/wheel/engine.ts`, `validation.ts`, testes unitários, vitest |
| `fix(roleta): débito, sorteio e registro transacionais…` | APIs `spin`, `settings`, `grant`, `status`, `history`; `src/lib/wheel/server.ts`; testes de integração; SQL de inventário |
| `feat(roleta): roleta SVG do vendedor e telas do gestor` | `prize-wheel.tsx`, `wheel/*`, `wheel-settings/manager/history.tsx`, ajuste mínimo em `seller-tab.tsx`, Playwright |
| `style(roleta): acabamento idêntico às roletas de referência` | paleta/geometria da referência, cabeçalho "Gire & Ganhe" |
| `docs(roleta): pacote de revisão` | este arquivo |

Diff completo: `git diff origin/developer..feat/roleta-v2` (29 arquivos de código/teste).

## Critérios de aceite (da Tarefa 001 aprovada)
1. Giro ~9 s → `SPIN_DURATION_MS = 9000`, 8 voltas; `prefers-reduced-motion` → 1,2 s.
2. Som com mudo persistido (`localStorage` `aceleragt.roleta.som`), áudio só liberado no gesto do clique.
3. Botão de apagar histórico removido; `DELETE /api/wheel/history` responde 410 e não apaga nada.
4. Prêmios e pesos preservados; peso nulo = 10 (default da coluna e da tela antiga); prêmio ativo exige peso inteiro > 0; remover = arquivar (`is_active=false`), nunca excluir.
5. Motor SVG e acabamento das referências (viewBox 500, raio 238, aro 13 px, anel branco 4 px, ponteiro 18/40 px, cubo 27%, cubic-bezier(.07,.72,.04,1)). Cores das fatias = configuração do AceleraGT.
6. Concorrência, clique duplo, sincronização da roda, créditos negativos e contadores inconsistentes corrigidos (ver testes).
7. Débito + sorteio + registro numa única transação, com janela anti-repetição de 4 s.
8. Totais do histórico calculados no banco; paginação, filtros e CSV.
9. Nenhuma migration; nenhuma escrita em banco remoto.
10. Autenticação e demais módulos intocados.

## Mudanças de contrato (todas com consumidores atualizados nesta branch)
- `POST /api/wheel/spin`: novos campos `spinId`, `wheelSnapshot`, `selectedIndex`, `stopAngleDeg`; mantém `prize`, `remainingCredits`, `message`. Sem saldo: **409** `{noCredits:true}` (antes 400). Repetição < 4 s: **429** `{tooSoon:true}`. Sem prêmio sorteável: 409 `{notConfigured:true}` e o crédito não é descontado.
- `GET /api/wheel/settings`: `segments` = prêmios ativos (editor); novo `wheel` = fatias sorteáveis (ativas e peso > 0); `archived` com `?include=archived`.
- `POST /api/wheel/settings`: validação zod no servidor; arquiva em vez de excluir; id de prêmio de outra loja nunca é alterado.
- `POST /api/wheel/grant`: inteiro 1–50; vendedor precisa pertencer à loja; `grantedBy` do corpo é ignorado.
- `GET /api/wheel/status`: `stats` sobre todos os giros da loja; novos `filteredStats`, `pagination`, `sellers`, `credits` (com `sellerId`), `spins[].sellerName`; `segments` passa a conter só as fatias sorteáveis.

## Testes executados
| Suíte | Resultado | Como rodar |
|---|---|---|
| Unitários (Vitest) — `tests/unit/engine.test.ts` | **18/18** | `npm run test:unit` |
| Integração (Vitest + Postgres 16 local) — `tests/integration/wheel-api.test.ts` | **16/16** | `TEST_DATABASE_URL=postgresql://postgres@localhost:5433/aceleragt_test npm test` (recusa URLs remotas) |
| Ponta a ponta (Playwright 1.56, Chromium) — `tests/e2e/roleta.spec.ts` | **7/7**, duas rodadas seguidas | ver `playwright.config.ts` |
| `next build` | OK (fonte Google simulada via `NEXT_FONT_GOOGLE_MOCKED_RESPONSES`, pois o sandbox bloqueia fonts.googleapis.com) | `npm run build` |
| `tsc --noEmit` | **0 erros novos**; 3 erros antigos da roleta resolvidos; os demais 42 são pré-existentes em outros módulos | `npm run typecheck` |

Destaques:
- **Prova exaustiva das probabilidades:** para vários conjuntos de pesos, percorrendo todos os valores do RNG, cada fatia sai exatamente `peso` vezes.
- **Geometria:** para n = 2…12, todos os índices, deslocamentos de ±35% e voltas extras, `indexAtAngle(targetRotation(...)) === índice`.
- **Controle negativo:** os mesmos testes de concorrência rodados contra o `spin` antigo da `developer` falham.
  - Saldo 1 + 10 pedidos simultâneos → 5 giros gravados e saldo negativo.
  - Saldo 5 + 10 pedidos → 9 giros.
  - Na branch: exatamente 1 giro e 1 crédito descontado.
- **E2E — a roda para no prêmio gravado:** lê a rotação real do SVG (`DOMMatrix` do rotor) e confirma que a fatia sob o ponteiro tem o mesmo id do prêmio gravado no servidor.
- **E2E — demais cenários:**
  - gestor troca os prêmios com a tela do vendedor aberta;
  - clique duplo gera um giro só;
  - mudo persiste após recarregar;
  - celular 390 px com movimento reduzido;
  - concessão com clique duplo soma só 1 giro;
  - validação de peso 0;
  - % de chance;
  - histórico sem botão de apagar.
- **Compatibilidade de esquema:** as consultas usam `select` explícito (não dependem de `notes`/`paid_at`). Um banco montado com o DDL do antigo `/api/setup-db` falha também no código atual da `developer` (coluna `is_active` de `prize_wheel_settings`). Logo, se a roleta funciona hoje em produção, o banco real segue o `schema.prisma`. Confirmação final: `docs/roleta-v2/inventario-somente-leitura.sql` (transação READ ONLY) no SQL Editor do Neon.

## Pontos de risco para a revisão
1. **Banco real não inspecionado diretamente.** O sandbox não alcança o Neon. Rodar o inventário somente leitura antes do merge. Pontos a olhar:
   - item 3: peso nulo/0, tipo desconhecido;
   - item 4: lojas com mais de 12 ou menos de 2 prêmios ativos, que precisarão de ajuste na tela para salvar;
   - item 7: fuso do servidor.
2. **Fuso:** `created_at` é `timestamp` sem fuso. A branch grava `created_at` com o relógio da aplicação (UTC). Se o Neon não estiver em UTC, giros antigos (gravados por `now()` do banco) ficam deslocados nos filtros por data. A janela anti-repetição não é afetada, porque compara só giros novos.
3. **APIs continuam sem autenticação** (decisão: fora do escopo). A validação reduz abuso, mas quem conhece os ids ainda consegue chamar `grant`/`spin`. Prioridade da próxima tarefa.
4. **Histórico ainda lê rótulo/valor atuais do prêmio** (snapshot no giro ficou para a próxima entrega). Mitigação: prêmios não são mais excluídos, só arquivados, e o histórico marca "(arquivado)".
5. **Peso 0 legado:** a fatia deixa de aparecer na roda (antes aparecia, mas nunca saía). O gestor vê um aviso na configuração.
6. **Janela de 4 s:** o mesmo vendedor girando em dois aparelhos ao mesmo tempo recebe 429 no segundo, sem desconto de crédito. Comportamento intencional.
7. **`package-lock.json`:** +94 pacotes, só de desenvolvimento (vitest, @playwright/test); 0 versões existentes alteradas; removido `react-custom-roulette`.
8. **Flutuação de teste:** o e2e do gestor falhou 1 vez em 4 rodadas (antes do ajuste de espera); nas 3 rodadas seguintes passou.

## Achados fora do escopo (não corrigidos nesta branch)
- **Dois `use-toast` diferentes:**
  - `src/components/ui/toaster.tsx` escuta `@/components/ui/use-toast`;
  - 13 componentes importam `@/hooks/use-toast`, e os avisos deles nunca aparecem;
  - nesta branch só os componentes da roleta foram apontados para o correto.
- **Cabeçalho do painel transborda no celular** (571 px de largura em tela de 390 px) antes mesmo de abrir a roleta. Componente: `goal-getter-dashboard`.
- **CI:** `deploy_developer.yml` dispara a cada push em `developer` (build + `firebase deploy --only hosting`, `w9jds/firebase-action@master`, `FIREBASE_TOKEN`). As 9 execuções registradas desde 10/2025 falharam. Não há `firebase.json` no repositório. `neon_workflow.yml` dispara em todo PR e tenta criar a branch Neon `pr-<branch>`; a última execução também falhou.
- **Repositório público:** credenciais antigas (Neon, Gemini) seguem no histórico do git (ver auditoria). Rotação recomendada independentemente desta tarefa.
