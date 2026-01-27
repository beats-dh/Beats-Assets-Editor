# Relatório de Análise Comparativa: Migração para Svelte Puro

## 1. Resumo Executivo
*   **Estado da Migração:** Aproximadamente **70% concluída**.
*   **Visão Geral:** O núcleo da aplicação (Asset Browser e Monster Editor) já foi portado para componentes Svelte modernos e funcionais. A lógica de estado foi migrada para Svelte Stores (`src/stores`).
*   **Áreas Críticas:**
    *   **Sujeira no Código (High Priority):** A raiz de `src/` no projeto atual contém inúmeros arquivos TypeScript legados (`assetUI.ts`, `monsterEditor.ts`, etc.) que não deveriam estar lá ou deveriam ter sido refatorados.
    *   **NPC Editor:** A funcionalidade existe no projeto Base (como uma tela de seleção de pastas), mas está marcada como "Coming Soon" no projeto atual.
    *   **Configuração de Build:** O arquivo `vite.config.ts` ainda referencia arquivos antigos que podem não existir ou não ser necessários, herança do projeto anterior.

---

## 2. Análise Estrutural e de Código

### A. Estrutura de Diretórios (`src/`)
| Projeto Base (Vanilla TS) | Projeto Atual (Svelte) | Status |
| :--- | :--- | :--- |
| `src/main.ts` (Lógica DOM pesada) | `src/main.ts` (Limpo, monta App.svelte) | ✅ Migrado |
| `src/monsterEditor.ts` | `src/components/monster-editor/*` | ✅ Migrado (Componentes + Store) |
| `src/assetUI.ts` | `src/components/CategoryView.svelte` | ⚠️ Parcial (Ainda existem deps do legado) |
| `src/npcEditor.ts` | **Faltando** (Placeholder em `App.svelte`) | ❌ Não Migrado |
| `src/sounds.ts` | `src/components/AddSoundModal.svelte` | ⚠️ Misto (Modal existe, lógica de load incerta) |
| `src/importExport.ts` | Integrado em `CategoryView.svelte` | ✅ Migrado |

### B. Arquivos "Fantasmas" (Limpeza Necessária)
Os seguintes arquivos existem na raiz de `src/` do projeto atual e parecem ser **código morto** ou **dependências legadas** que impedem uma migração "pura":
*   `src/assetUI.ts` (Usado parcialmente por `CategoryView.svelte`, precisa ser refatorado para `src/utils` ou `src/services`)
*   `src/monsterEditor.ts` (Provavelmente morto, substituído por componentes)
*   `src/npcEditor.ts` (Morto, não referenciado)
*   `src/mainMenu.ts` (Provavelmente morto, substituído por `Launcher.svelte`)
*   `src/navigation.ts` (Provavelmente morto, substituído por Roteamento via Estado)

### C. Configuração de Build (`vite.config.ts`)
*   **Problema:** O `vite.config.ts` atual ainda define `manualChunks` apontando para os arquivos antigos (`monsterEditor.ts`, `npcEditor.ts`), o que força o bundler a incluir esses arquivos mesmo que não sejam usados pela aplicação Svelte.

---

## 3. Funcionalidades e Fluxos

### ✅ Implementado (Svelte)
1.  **Asset Browser:**
    *   Grid de assets, paginação, busca e filtros (via `CategoryView.svelte`).
    *   Seleção e edição de assets (via `AssetDetailsModal.svelte`).
    *   Importação/Exportação (via botões no header de `CategoryView`).
2.  **Monster Editor:**
    *   Layout completo com Sidebar e Form.
    *   Edição de todas as seções (Outfit, Spells, Loot, etc.) via componentes dedicados (`src/components/monster-editor/cards`).
    *   Gerenciamento de estado via `monsterStore.ts`.

### ❌ Faltando / Pendente
1.  **NPC Editor:**
    *   **Base:** Permite selecionar diretório de scripts NPC.
    *   **Atual:** Tela "Coming Soon".
2.  **Limpeza de Dependências:**
    *   `CategoryView.svelte` ainda importa `loadSpritesForAssets` de `../assetUI`. Isso mantém o arquivo legado vivo.

---

## 4. Plano de Ação (Próximos Passos)

Para concluir a refatoração para "Svelte Puro", recomendo a seguinte ordem de execução:

1.  **Limpeza de Build (Imediato):**
    *   Corrigir `vite.config.ts` removendo `manualChunks` obsoletos.
2.  **Refatoração de `assetUI.ts`:**
    *   Extrair `loadSpritesForAssets` e outras funções úteis para `src/services/spriteService.ts` ou `src/utils`.
    *   Remover `src/assetUI.ts`.
3.  **Remoção de Código Morto:**
    *   Apagar `monsterEditor.ts`, `npcEditor.ts`, `mainMenu.ts`, `navigation.ts` da raiz, garantindo que nada quebrou.
4.  **Implementação do NPC Editor:**
    *   Criar `src/components/npc-editor/NpcEditorLayout.svelte` portando a lógica simples de seleção de pasta do projeto base.

Este plano garante que o projeto deixe de ser um "híbrido sujo" e se torne uma aplicação Svelte limpa e sustentável.