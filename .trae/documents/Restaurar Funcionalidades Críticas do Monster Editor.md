# Relatório de Análise e Plano de Migração

Realizei uma análise comparativa completa entre o projeto legado e a versão atual em Svelte. Abaixo detalho as funcionalidades ausentes e o plano para migração completa.

## 📊 Relatório de Gaps (Funcionalidades Ausentes)

A migração para Svelte cobriu a estrutura básica e o Editor de Monstros, mas deixou para trás três módulos críticos que existiam no projeto original:

### 1. Editor de Texturas (`textureTab.ts`) - 🔴 Crítico
*   **Legado**: Possuía um editor robusto (~1500 linhas) com:
    *   Preview de sprites com animação em tempo real (Canvas).
    *   Edição de *Bounding Boxes* (áreas de colisão).
    *   Configuração de fases de animação (duração, loops).
    *   Drag-and-drop para substituir sprites.
*   **Atual**: O modal de assets exibe apenas "Texture editor coming soon...". Toda a lógica de manipulação visual e workers foi perdida.

### 2. Suporte a Sons (`sounds.ts`) - 🟠 Importante
*   **Legado**: Tratava sons como uma categoria distinta com propriedades específicas:
    *   Visualização de *Numeric Sound Effects* (IDs, variações de pitch/volume).
    *   Listagem de arquivos de áudio associados.
    *   Badge e ícones específicos para áudio.
*   **Atual**: O sistema trata sons como assets visuais genéricos, tentando carregar sprites que não existem e ocultando os campos de configuração de áudio.

### 3. Editor de NPCs (`npcEditor.ts`) - 🟡 Pendente
*   **Legado**: Implementava uma interface inicial para seleção de diretório de scripts NPC (`createFolderSelectionView`), preparando o terreno para indexação.
*   **Atual**: A rota existe mas exibe apenas uma tela de "Coming Soon". A funcionalidade de seleção de pasta e a estrutura base não foram portadas.

---

## 🚀 Plano de Execução

Para atingir o objetivo de reescrita completa mantendo a funcionalidade original, proponho a seguinte ordem de implementação:

### Fase 1: Editor de NPCs (Estrutura Base)
Criaremos a estrutura completa do Editor de NPCs, similar ao que fizemos com o Editor de Monstros, mas focada na funcionalidade original de seleção de diretórios e listagem.
1.  Criar `src/components/npc-editor/` (Layout, Sidebar, Setup).
2.  Implementar a seleção de diretório e persistência do caminho (Store).
3.  Listar arquivos `.lua` encontrados (se a API permitir) ou manter a tela de "Folder Selection" fiel ao legado.

### Fase 2: Módulo de Sons (Sound Editor)
Integrar o suporte nativo a áudio no editor de assets.
1.  Criar `src/components/asset-editor/cards/SoundInfoCard.svelte`.
2.  Atualizar `AssetDetailsModal.svelte` para detectar a categoria "Sounds".
3.  Implementar a lógica de exibição de *Sound Stats* e *Randomization* (portar de `sounds.ts`).

### Fase 3: Editor de Texturas (O Grande Desafio)
Portar a lógica complexa de `textureTab.ts` para Svelte puro.
1.  Criar `src/components/asset-editor/TextureEditor.svelte`.
2.  Migrar a lógica de Canvas e *Web Workers* para o ciclo de vida do Svelte (`onMount`).
3.  Implementar os controles de animação, bounding boxes e drag-and-drop de sprites.

**Você autoriza o início imediato pela Fase 1 (Editor de NPCs) seguido das demais fases?**