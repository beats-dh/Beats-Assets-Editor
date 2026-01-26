# Análise do Projeto e Plano de Migração para Svelte Puro (Completo)

## Análise da Situação Atual

* **Stack:** Vite + Vanilla TypeScript.

* **Estrutura Atual:**

  * `index.html`: Contém o markup do Loading, App Principal, Modais.

  * `src/main.ts`: Ponto de entrada, inicializa módulos.

  * `src/mainMenu.ts`: Gera via DOM a tela de Launcher (Tela Principal).

  * `src/assetUI.ts`: Gerencia o Grid de Assets.

* **Requisito:** Migrar para Svelte mantendo **layout/CSS idênticos**, removendo `LoadingScreen`, e seguindo a ordem: Launcher -> Home -> Grid.

***

## Plano de Implementação Detalhado

### 1. Preparação do Ambiente

* **Instalar Dependências:**

  * `npm install svelte @sveltejs/vite-plugin-svelte svelte-preprocess`

  * `npm install -D @tsconfig/svelte`

* **Configurar Vite (`vite.config.ts`):**

  * Adicionar `svelte()` plugin.

  * Configurar alias se necessário.

* **Limpar** **`index.html`:**

  * Remover todo o conteúdo de `<body>` exceto `<div id="app"></div>`.

* **Entrada (`src/main.ts`):**

  * Alterar para montar `App.svelte` no div `#app`.

  * Importar globalmente os CSS: `import './styles/main.css';`, `import './features/layout/headerSpacing.css';`, etc.

### 2. Gerenciamento de Estado (Stores)

Criar `src/stores/` para substituir a manipulação de DOM:

* `appState.ts`:

  * `currentView`: 'launcher' | 'assets-editor' | 'monster-editor'.

  * `tibiaPath`: Caminho do diretório do Tibia.

* `settingsStore.ts`:

  * `theme`: Controle do tema (ocean, forest, etc.).

  * `language`: Controle de i18n.

* `assetsStore.ts`:

  * `assets`: Lista de itens carregados.

  * `pagination`: Página atual, itens por página.

  * `filters`: Categoria atual, busca.

### 3. Execução Faseada (Tela por Tela)

#### Fase 1: Tela Principal (Launcher)

* **Criar** **`src/components/Launcher.svelte`:**

  * **Migração de HTML/CSS:** Portar a estrutura gerada em `src/mainMenu.ts` (Hero, Inputs, Grid de Opções).

  * **Lógica:**

    * Binding do input de Path do Tibia (`tibiaPath`).

    * Botões de navegação que alteram `appState.currentView`.

    * Configurações de Tema/Language conectadas à `settingsStore`.

  * **Verificação:** Garantir que o Launcher abre e se parece exatamente com o atual.

#### Fase 2: Layout do Editor e Header

* **Criar** **`src/components/AssetEditorLayout.svelte`:**

  * Wrapper principal para o editor.

* **Criar** **`src/components/Header.svelte`:**

  * **Migração:** HTML do `<header class="app-header">` do `index.html`.

  * **Lógica:**

    * Botão Home -> volta para `currentView = 'launcher'`.

    * Botão Settings -> Toggle do menu (agora um componente `SettingsMenu.svelte`).

    * Stats -> Assinar store de estatísticas.

#### Fase 3: Home do Editor (Categorias)

* **Criar** **`src/components/CategoryNav.svelte`:**

  * **Migração:** HTML da `<nav class="category-nav">`.

  * **Estrutura:**

    * Cards Principais (Objects, Outfits, etc.).

    * Grid de Subcategorias (Armors, Boots, etc.).

  * **Lógica:** Clique no card define a categoria na `assetsStore` e muda a view interna para o Grid.

#### Fase 4: Grid de Assets (Visualização)

* **Criar** **`src/components/CategoryView.svelte`:**

  * **Migração:** HTML do `<main id="category-view">`.

  * **Componentes Internos:**

    * Barra de Busca (Input com debounce).

    * Paginação (Botões Prev/Next, Select de PageSize).

    * Grid (Loop `{#each}` renderizando os assets).

  * **Lógica:** Substituir `assetUI.ts`. O componente reage a mudanças na `assetsStore` e busca dados do backend.

#### Fase 5: Modais e Funcionalidades

* **`AssetDetailsModal.svelte`:** Tabs de visualização e edição.

* **`SpriteLibraryDrawer.svelte`:** Drawer lateral de sprites.

* **`ConfirmModal.svelte`** e **`Toast.svelte`**.

### 4. Validação

* A cada fase, verificar se o CSS (que não será alterado) está aplicando corretamente aos novos componentes Svelte.

