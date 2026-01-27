# Relatório de Análise e Plano de Migração

## 1. Visão Geral da Migração
O projeto original (Legacy) utilizava TypeScript puro com manipulação direta do DOM e uma arquitetura baseada em eventos manuais. A nova implementação (Svelte) adota uma arquitetura reativa, baseada em componentes e Stores.

A migração estrutural está **90% concluída**. Os principais editores (Monstros e NPCs) e o navegador de assets já foram portados. O principal gap identificado reside nas **operações em lote** e **importação/exportação avançada** no navegador de assets.

## 2. Comparativo Funcional Detalhado

| Módulo | Funcionalidade | Status Legacy | Status Svelte | Gap / Ação Necessária |
| :--- | :--- | :--- | :--- | :--- |
| **Monster Editor** | Edição Básica (Nome, HP, Exp) | ✅ Completo | ✅ Completo | Nenhuma |
| | Previsão de Outfit (Animado) | ✅ Completo | ✅ Completo | Nenhuma |
| | Abas Avançadas (Loot, Spells, Flags) | ✅ Completo | ✅ Completo | Nenhuma (Componentes `*Card.svelte` cobrem tudo) |
| | Workers (Outfit Compose) | ✅ Presente | ✅ Presente | Nenhuma |
| **NPC Editor** | Seleção de Pasta de Scripts | ✅ Presente | ✅ Presente | Nenhuma (Implementado em `NpcEditorLayout`) |
| | Edição de Diálogos | 🚧 Pendente | 🚧 Pendente | Funcionalidade futura em ambas as versões |
| **Asset Browser** | Listagem e Paginação | ✅ Completo | ✅ Completo | Nenhuma |
| | Visualização de Sprites | ✅ Completo | ✅ Completo | Nenhuma |
| | Filtros (Categoria/Busca) | ✅ Completo | ✅ Completo | Nenhuma |
| | **Sons (Streams/Effects)** | ✅ Completo | ✅ Completo | Migrado recentemente |
| | **Infinite Scroll** | ✅ Existente | ❌ Substituído | Substituído por Paginação (Decisão de Design: Maior estabilidade) |
| **Ações em Lote** | Seleção Múltipla | ✅ Completo | ✅ Completo | Lógica migrada para `selectionStore` |
| | **Delete em Massa** | ✅ Completo | ❌ Parcial | **Prioridade Alta**: Implementar botão de delete para múltiplos itens |
| | **Copy/Paste Flags** | ✅ Completo | ❌ Ausente | **Prioridade Média**: Migrar lógica de copiar/colar flags entre assets |
| | **Importar (JSON/AEC)** | ✅ Avançado | ❌ Básico | **Prioridade Alta**: Migrar modal de "Start IDs" e lógica de importação em lote |
| | **Exportar (JSON/AEC)** | ✅ Completo | ❌ Ausente | **Prioridade Alta**: Implementar exportação de seleção |

## 3. Arquivos e Estrutura
- **Legacy**: `assetUI.ts`, `assetDetails.ts`, `importExport.ts` (monólitos).
- **Svelte**: `assetService.ts`, `CategoryView.svelte`, `selectionStore.ts` (modular).
- **Limpeza**: Os arquivos legados (`monsterEditor.ts`, `npcEditor.ts`, `assetUI.ts`) já foram removidos ou estão prontos para remoção, pois suas funcionalidades foram portadas.

## 4. Plano de Ação Priorizado

### Fase 1: Restaurar Importação e Exportação (Alta Prioridade)
O sistema de Import/Export do legacy (`importExport.ts`) era robusto, permitindo definir IDs iniciais para evitar conflitos. Isso precisa ser trazido para o Svelte.
1.  **Criar `ImportExportService.ts`**: Migrar a lógica de IO do legacy para um serviço Svelte-friendly.
2.  **Criar Modais**: Implementar `ImportStartIdModal.svelte` para replicar a funcionalidade de escolha de IDs.
3.  **Integrar na UI**: Adicionar botões de "Importar" e "Exportar" na barra de ações do `CategoryView`.

### Fase 2: Ações em Lote (Média Prioridade)
Restaurar a capacidade de manipular múltiplos assets simultaneamente.
1.  **Atualizar Toolbar**: Expandir a barra de ferramentas do `CategoryView` para incluir "Delete", "Copy Flags", "Paste Flags" quando houver seleção múltipla.
2.  **Conectar à Store**: Utilizar `selectionStore` para habilitar/desabilitar esses botões dinamicamente.

### Fase 3: Limpeza Final
1.  Remover quaisquer arquivos `.ts` soltos na raiz que não sejam mais referenciados (`mainMenu.css` legacy, etc).

## Conclusão
A migração foi bem sucedida na maior parte dos componentes visuais e de edição complexa. O trabalho restante é focado em ferramentas de produtividade (IO e Batch Actions) que residiam em `importExport.ts`. Recomendamos focar na **Fase 1** imediatamente.