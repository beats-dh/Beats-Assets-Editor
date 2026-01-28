O plano a seguir detalha a migração completa e rigorosa das funcionalidades da aba "Texture" do código legado (TypeScript puro) para o projeto atual (Svelte), garantindo paridade funcional total.

## 1. Análise de Gaps (Legado vs. Atual)

| Funcionalidade | Implementação Legada (`textureTab.ts`) | Implementação Atual (Svelte) | Status |
| :--- | :--- | :--- | :--- |
| **Drag & Drop** | Suporta arrastar sprites para a área de preview para substituição/adição. Parseia `application/x-asset-sprite`. | Ausente no Preview. Existe apenas na lista de sprites (`TextureSpriteList`). | 🔴 Crítico |
| **Animação** | Loop robusto respeitando durações variáveis por fase (`duration_min/max`). | Loop básico com placeholder/TODO. Não respeita fases individuais corretamente. | 🔴 Crítico |
| **Canvas Scaling** | Escala inteligente baseada em `MIN_PREVIEW_DIM` (140px). | Implementação simplificada recalculada a cada frame. | 🟡 Melhoria |
| **Overlay** | Desenha quadrado delimitador (tracejado verde) e bounding boxes (laranja). | Implementado, mas precisa de validação de fidelidade visual. | 🟢 Ok |
| **Validações** | Validação explicita de inputs numéricos e checkbox. | Binding direto do Svelte. Precisa de validação de limites (min/max). | 🟡 Melhoria |
| **Decoding** | Web Worker (`imageBitmapWorker`) para decodificação off-main-thread. | Decodificação na main thread (`loadImage`). | 🟡 Performance |

## 2. Plano de Implementação

### Passo 1: Implementar Drag & Drop no Preview
**Arquivo:** `src/components/asset-details/texture/TexturePreview.svelte`
*   Adicionar handlers de evento `ondragover`, `ondragleave` e `ondrop` ao container principal (`.texture-preview-card`).
*   Implementar a função `parseSpriteDragPayload` (portada do legado) para extrair IDs de sprites arrastados.
*   Emitir evento `dropSprites` para o componente pai (`TextureEditor`) tratar a lógica de substituição/adição via backend.

### Passo 2: Reimplementar Engine de Animação
**Arquivo:** `src/components/asset-details/texture/TexturePreview.svelte`
*   Substituir o loop `animate` atual por um sistema robusto que:
    *   Utiliza `requestAnimationFrame`.
    *   Calcula o tempo decorrido (`timestamp - lastFrameTime`).
    *   Consulta a duração da fase atual (`phases[currentPhase].duration_min`).
    *   Avança o frame localmente para renderização suave, sem depender do slider global (evitando loops de estado), mas sincronizando quando necessário.

### Passo 3: Refinar Renderização do Canvas
**Arquivo:** `src/components/asset-details/texture/TexturePreview.svelte`
*   Garantir que a lógica de "Outfit" (Color Blending) vs "Object" (Camadas) esteja 100% alinhada.
*   Ajustar o cálculo de escala para garantir que sprites pequenos (ex: 32x32) sejam renderizados grandes e nítidos (`image-rendering: pixelated`).
*   Verificar o desenho dos overlays (Bounding Square e Bounding Boxes) para garantir que sigam a escala correta.

### Passo 4: Integração e Validação
**Arquivo:** `src/components/asset-details/texture/TextureEditor.svelte`
*   Tratar o evento `dropSprites` vindo do Preview.
*   Chamar as funções de backend (`replace_appearance_sprites` ou `append_appearance_sprites`) conforme a lógica legada.
*   Adicionar validações nos inputs de `TextureSettings.svelte` para impedir valores negativos ou inválidos.

## 3. Testes de Verificação
Após a implementação, realizarei os seguintes testes manuais (simulados) e verificação de código:
1.  **Teste de D&D**: Arrastar um sprite da lista para o preview -> Deve substituir/adicionar.
2.  **Teste de Animação**: Configurar fases com tempos diferentes (ex: 100ms e 1000ms) -> A animação deve respeitar o ritmo.
3.  **Teste Visual**: Verificar se as cores do Outfit (Head/Body/Legs/Feet) são aplicadas corretamente.
4.  **Teste de Regressão**: Confirmar se a edição de metadados (width/height) continua salvando corretamente.
