Eu realizei a análise completa do código legado, incluindo o arquivo `spriteLibrary.ts` que havia passado despercebido inicialmente. A funcionalidade da aba Texture depende fortemente de uma "Biblioteca de Sprites" externa para arrastar e soltar novos sprites.

Aqui está o plano detalhado para atingir 100% de paridade com o legado:

### **1. Componente `SpriteLibrary.svelte` (Novo)**
Implementarei um novo componente drawer que replica exatamente o comportamento do `spriteLibrary.ts` legado:
*   **Interface:** Drawer lateral deslizante (`#sprite-library-drawer`).
*   **Controles:**
    *   Busca por ID ou Range (ex: `100-200`).
    *   Paginação: Input de ID inicial, tamanho da página (ex: 100), botões Anterior/Próximo.
    *   Ordenação: Crescente/Decrescente.
*   **Performance:** Implementar **Virtual Scrolling** para lidar com milhares de sprites sem travar a UI (como no legado).
*   **Drag & Drop:** Os itens da biblioteca gerarão o payload `application/x-asset-sprite` contendo a lista de IDs selecionados, permitindo arrastar diretamente para a aba Texture.
*   **Seleção Múltipla:** Suporte a Ctrl+Click para selecionar e arrastar múltiplos sprites de uma vez.

### **2. Atualização dos Controles e Preview (`TextureEditor` e `TexturePreview`)**
Para corrigir as diferenças entre tipos de assets:
*   **Modos Distintos:** O editor detectará se é `Outfit` ou `Object`.
    *   **Modo Object:** Controles para `Pattern X`, `Pattern Y`, `Pattern Z`, `Layer` e `Frame`.
    *   **Modo Outfit:** Controles para `Direção`, `Addon`, `Montaria` e **Mistura de Cores**.
*   **Mistura de Cores (Color Blending):** Implementarei o algoritmo exato do legado `(pixelBase + cor) / 2` no Canvas para visualizar as cores de Cabeça/Corpo/Pernas/Pés em tempo real.
*   **Botão da Biblioteca:** Adicionar o botão "Abrir Biblioteca" na interface para acionar o drawer.

### **3. Lógica de Drag & Drop Avançada**
*   **Ctrl+Drop:** Implementar a lógica onde segurar `Ctrl` ao soltar sprites distribui os IDs através dos **frames** da animação (ao invés de slots sequenciais).
*   **Integração:** Conectar o evento `drop` da Biblioteca com a lista de sprites da aba Texture.

### **4. Migração de Estilos**
*   Portar todo o CSS de `texture.css` e estilos relevantes de `spriteLibrary.ts` para garantir que o visual (drop zones, chips de sprites, botões) seja idêntico ao original.

### **5. Verificação e Testes**
*   Testar o fluxo completo: Abrir Modal -> Abrir Biblioteca -> Buscar Sprites -> Arrastar para a lista (com e sem Ctrl) -> Salvar.
*   Verificar a fidelidade visual da mistura de cores em Outfits.

Vou começar criando o componente `SpriteLibrary.svelte` e integrando-o ao modal.
