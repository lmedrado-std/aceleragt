# Principais Módulos do Projeto "Goal Getter"

Este documento resume os arquivos mais importantes da aplicação, servindo como um guia rápido para desenvolvimento e manutenções futuras. Ao solicitar ajuda, referenciar um destes módulos pode acelerar o entendimento do problema.

### 1. Cérebro da Aplicação (Gerenciamento de Dados)

-   **Arquivo:** `src/lib/storage.ts`
-   **Responsabilidade:**
    -   Define as estruturas de dados principais (`Seller`, `Goals`, `Store`, `AppState`).
    -   Gerencia toda a lógica de salvar (`saveState`) e carregar (`loadState`) os dados do `localStorage`.
    -   Define o estado inicial da aplicação (`getInitialState`), incluindo as metas padrão.
    -   Controla a senha do administrador.
-   **Quando modificar:** Ao alterar a estrutura dos dados, a forma de armazenamento ou os valores padrão.

### 2. Painel Principal (Orquestrador)

-   **Arquivo:** `src/components/goal-getter-dashboard.tsx`
-   **Responsabilidade:**
    -   Componente principal que renderiza as abas de "Administrador" e "Vendedor".
    -   Gerencia o estado geral do painel usando `react-hook-form`.
    -   Lida com a lógica de mudança de abas, autenticação e carregamento dos dados da loja específica.
    -   Contém a função `addSeller` e a lógica para calcular os rankings.
-   **Quando modificar:** Ao alterar a estrutura geral do dashboard ou como os dados fluem entre as abas.

### 3. Painel do Administrador

-   **Arquivo:** `src/components/admin-tab.tsx`
-   **Responsabilidade:**
    -   Renderiza toda a interface da aba do administrador.
    -   Contém os formulários para adicionar vendedores, definir metas (Vendas, PA, Ticket Médio) e inserir o desempenho de cada vendedor.
    -   Dispara o cálculo de incentivos.
-   **Quando modificar:** Ao alterar funcionalidades exclusivas do administrador.

### 4. Painel do Vendedor

-   **Arquivo:** `src/components/seller-tab.tsx` e `src/components/progress-display.tsx`
-   **Responsabilidade:**
    -   `seller-tab.tsx`: Carrega os dados de um vendedor específico.
    -   `progress-display.tsx`: Componente visual que exibe as barras de progresso, os cartões de métricas, os rankings e o resumo de ganhos.
-   **Quando modificar:** Ao alterar como os dados de desempenho do vendedor são visualizados.

### 5. Lógica de Cálculo de Incentivos (Genkit)

-   **Arquivo:** `src/ai/flows/incentive-projection.ts`
-   **Responsabilidade:**
    -   Contém o fluxo `incentiveProjectionFlow`.
    -   Implementa todas as regras de negócio para calcular os prêmios e bônus com base no desempenho e nas metas.
-   **Quando modificar:** Ao alterar as regras de cálculo dos incentivos.

### 6. Fluxo de Entrada e Navegação

-   **Arquivo:** `src/app/page.tsx` (Página Inicial)
-   **Arquivo:** `src/app/loja/[storeId]/page.tsx` (Página da Loja)
-   **Arquivo:** `src/app/login/...` (Páginas de Login)
-   **Responsabilidade:**
    -   `page.tsx`: A primeira página que o usuário vê, com a lista de lojas.
    -   `loja/[storeId]/page.tsx`: A página intermediária onde o usuário seleciona seu perfil (administrador ou vendedor) para acessar o dashboard.
-   **Quando modificar:** Ao alterar o fluxo de login ou a forma como o usuário acessa uma loja.
