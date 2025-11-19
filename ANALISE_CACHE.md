# Análise de Cache - Beats Assets Editor

## Resumo Executivo

Esta análise identifica **duplicações de cache** e oportunidades de **unificação** para economizar memória RAM e criar um sistema de cache consistente e único para toda a aplicação.

### 🔴 Problemas Críticos Identificados

1. **Sprite Cache Duplicado**: Backend + Frontend armazenam os mesmos dados = **~50% memória desperdiçada**
2. **Preview Cache Duplicado**: Backend + Frontend armazenam os mesmos dados = **~50% memória desperdiçada**
3. **Sprite URL Cache Duplicado**: 3 implementações diferentes = código duplicado e URLs criados múltiplas vezes

### 📊 Impacto Estimado

- **Redução de memória**: ~40-50% (removendo duplicações)
- **Exemplo**: 1000 appearances × 10 sprites = **~50MB economizados**
- **Benefícios**: Cache único, consistente, menos código, menos bugs

### ✅ Recomendação

**Remover caches frontend duplicados** e confiar apenas no cache backend (já persiste entre chamadas IPC e é eficiente).

## 1. Caches Identificados

### 🔴 Backend (Rust) - `src-tauri/src/state.rs`

#### 1.1. `sprite_cache: DashMap<String, Arc<Vec<Vec<u8>>>>`
- **Localização**: `AppState`
- **Chave**: `"category:appearanceId"` (ex: `"Objects:1234"`)
- **Valor**: `Arc<Vec<Vec<u8>>>` - Array de sprites PNG em bytes
- **Uso**: Cache de sprites completos por appearance
- **Tamanho**: Pode crescer muito (todos os sprites de todas as appearances)

#### 1.2. `preview_cache: DashMap<String, Arc<Vec<u8>>>`
- **Localização**: `AppState`
- **Chave**: `"category:appearanceId"` (ex: `"Objects:1234"`)
- **Valor**: `Arc<Vec<u8>>` - Primeiro sprite (preview) PNG em bytes
- **Uso**: Cache de preview (primeiro sprite) por appearance
- **Tamanho**: Menor que sprite_cache (apenas 1 sprite por appearance)

#### 1.3. `search_cache: DashMap<String, Arc<Vec<u32>>>`
- **Localização**: `AppState`
- **Chave**: `"category:search_term:subcategory"` (ex: `"Objects:sword:All"`)
- **Valor**: `Arc<Vec<u32>>` - IDs filtrados
- **Uso**: Cache de resultados de busca
- **Tamanho**: Pequeno (apenas IDs, não dados completos)

#### 1.4. `sprite_cache: DashMap<String, Arc<Vec<TibiaSprite>>>` (dentro de SpriteLoader)
- **Localização**: `SpriteLoader` (dentro de `sprite_loader: RwLock<Option<SpriteLoader>>`)
- **Chave**: Nome do arquivo LZMA (ex: `"sprites-123.dat"`)
- **Valor**: `Arc<Vec<TibiaSprite>>` - Sprite sheet completo descomprimido
- **Uso**: Cache de sprite sheets LZMA descomprimidos
- **Tamanho**: Médio (sprite sheets podem ter centenas de sprites)

### 🟡 Frontend (TypeScript)

#### 2.1. `spriteCache: Map<string, Uint8Array[]>` - `spriteCache.ts`
- **Localização**: `src/spriteCache.ts`
- **Chave**: `"category:appearanceId"` (ex: `"Objects:1234"`)
- **Valor**: `Uint8Array[]` - Array de sprites
- **Uso**: Cache de sprites completos por appearance
- **Problema**: 🔴 **DUPLICADO** com backend `sprite_cache`

#### 2.2. `singleSpriteCache: Map<number, Uint8Array>` - `spriteCache.ts`
- **Localização**: `src/spriteCache.ts`
- **Chave**: `spriteId` (ex: `1234`)
- **Valor**: `Uint8Array` - Sprite individual
- **Uso**: Cache de sprites individuais por ID
- **Problema**: ⚠️ Pode ser unificado com `spriteCache` usando chave diferente

#### 2.3. `spriteUrlCache: WeakMap<Uint8Array, string>` - `spriteCache.ts`
- **Localização**: `src/spriteCache.ts`
- **Chave**: `Uint8Array` (referência ao buffer)
- **Valor**: `string` - Blob URL
- **Uso**: Cache de Blob URLs para buffers de sprite
- **Status**: ✅ OK - WeakMap é eficiente e não causa memory leak

#### 2.4. `previewSpriteCaches: Map<string, Map<number, Uint8Array>>` - `assetUI.ts`
- **Localização**: `src/assetUI.ts`
- **Chave**: `category` -> `appearanceId` -> `Uint8Array`
- **Valor**: Preview sprites por categoria
- **Uso**: Cache de previews para grid de assets
- **Problema**: 🔴 **DUPLICADO** com backend `preview_cache` e frontend `spriteCache`

#### 2.5. `assetsQueryCache: Map<string, { ids, itemsById, total }>` - `assetUI.ts`
- **Localização**: `src/assetUI.ts`
- **Chave**: Query string (category + search + subcategory + page)
- **Valor**: Resultados da query (IDs, items, total)
- **Uso**: Cache de resultados de busca/paginação
- **Problema**: ⚠️ Pode ser unificado com backend `search_cache`

#### 2.6. `previewCache: Map<string, PreviewAnimationSequence>` - `assetPreviewAnimator.ts`
- **Localização**: `src/features/previewAnimation/assetPreviewAnimator.ts`
- **Chave**: `"category:appearanceId"` (ex: `"Objects:1234"`)
- **Valor**: Sequência de animação (frames + interval)
- **Uso**: Cache de animações de preview
- **Status**: ✅ OK - Dados diferentes (animações, não sprites)

#### 2.7. `spriteUrlCache: WeakMap<Uint8Array, string>` - `assetPreviewAnimator.ts`
- **Localização**: `src/features/previewAnimation/assetPreviewAnimator.ts`
- **Chave**: `Uint8Array`
- **Valor**: `string` - Blob URL
- **Problema**: 🔴 **DUPLICADO** com `spriteUrlCache` em `spriteCache.ts`

#### 2.8. `spriteUrlCache: Map<number, string>` - `spriteLibrary.ts`
- **Localização**: `src/spriteLibrary.ts`
- **Chave**: `spriteId` (número)
- **Valor**: `string` - Blob URL
- **Problema**: 🔴 **DUPLICADO** - Diferente dos outros (usa número, não Uint8Array)

#### 2.9. `detailCache: Map<string, CompleteAppearanceItem>` - `animation.ts`
- **Localização**: `src/animation.ts`
- **Chave**: `"category:appearanceId"`
- **Valor**: `CompleteAppearanceItem` - Dados completos da appearance
- **Uso**: Cache de detalhes de appearance para animações
- **Status**: ✅ OK - Dados diferentes (detalhes, não sprites)

#### 2.10. `imageCache: Map<number, Promise<HTMLImageElement>>` - `textureTab.ts`
- **Localização**: `src/textureTab.ts`
- **Chave**: `spriteIndex` (número)
- **Valor**: `Promise<HTMLImageElement>` - Imagem carregada
- **Uso**: Cache local de imagens durante edição de texture
- **Status**: ✅ OK - Cache temporário local (limpo após edição)

#### 2.11. `outfitSpriteMetadataCache: Map<number, { spriteInfo, baseOffset }>` - `monsterEditor.ts`
- **Localização**: `src/monsterEditor.ts`
- **Chave**: `lookType` (número)
- **Valor**: Metadados de sprite (spriteInfo + baseOffset)
- **Uso**: Cache de metadados de outfit sprites
- **Status**: ✅ OK - Dados diferentes (metadados, não sprites)

## 2. Tabela Comparativa de Caches Duplicados

| Tipo de Cache | Backend (Rust) | Frontend (TypeScript) | Status | Ação |
|---------------|----------------|----------------------|--------|------|
| **Sprites Completos** | `sprite_cache: DashMap<String, Arc<Vec<Vec<u8>>>>` | `spriteCache: Map<string, Uint8Array[]>` | 🔴 **DUPLICADO** | Remover frontend |
| **Previews** | `preview_cache: DashMap<String, Arc<Vec<u8>>>` | `previewSpriteCaches: Map<string, Map<number, Uint8Array>>` | 🔴 **DUPLICADO** | Remover frontend |
| **Sprite URLs** | N/A | `spriteUrlCache` em 3 lugares diferentes | 🔴 **DUPLICADO** | Unificar em módulo único |
| **Query/Search** | `search_cache: DashMap<String, Arc<Vec<u32>>>` | `assetsQueryCache: Map<string, {...}>` | 🟡 **PARCIAL** | Simplificar frontend |
| **Sprites Individuais** | N/A | `singleSpriteCache: Map<number, Uint8Array>` | ✅ **OK** | Manter (uso específico) |
| **Animações** | N/A | `previewCache: Map<string, PreviewAnimationSequence>` | ✅ **OK** | Manter (dados diferentes) |
| **Detalhes** | N/A | `detailCache: Map<string, CompleteAppearanceItem>` | ✅ **OK** | Manter (dados diferentes) |

## 3. Problemas Identificados

### 🔴 Duplicações Críticas

#### 3.1. Sprite Cache Duplicado (Backend + Frontend)
**Problema**: Mesmos dados em dois lugares
- **Backend**: `sprite_cache: DashMap<String, Arc<Vec<Vec<u8>>>>`
- **Frontend**: `spriteCache: Map<string, Uint8Array[]>`

**Impacto**:
- Memória duplicada: cada sprite armazenado 2x
- Inconsistência: cache pode ficar dessincronizado
- Complexidade: precisa limpar ambos os caches

**Solução**: Remover cache frontend, usar apenas backend (já retorna via IPC)

#### 3.2. Preview Cache Duplicado (Backend + Frontend)
**Problema**: Mesmos dados em dois lugares
- **Backend**: `preview_cache: DashMap<String, Arc<Vec<u8>>>`
- **Frontend**: `previewSpriteCaches: Map<string, Map<number, Uint8Array>>`

**Impacto**: Mesmo problema do sprite cache

**Solução**: Remover cache frontend, usar apenas backend

#### 3.3. Sprite URL Cache Duplicado (3 lugares diferentes)
**Problema**: Mesma funcionalidade em 3 lugares
- `spriteCache.ts`: `spriteUrlCache: WeakMap<Uint8Array, string>`
- `assetPreviewAnimator.ts`: `spriteUrlCache: WeakMap<Uint8Array, string>`
- `spriteLibrary.ts`: `spriteUrlCache: Map<number, string>` (diferente!)

**Impacto**:
- Código duplicado
- Blob URLs criados múltiplas vezes para o mesmo buffer
- Memory leaks potenciais (URLs não revogados)

**Solução**: Criar módulo único `spriteUrlCache.ts` compartilhado

### 🟡 Oportunidades de Unificação

#### 3.4. Single Sprite Cache vs Sprite Cache
**Problema**: Dois caches para sprites
- `singleSpriteCache: Map<number, Uint8Array>` - por sprite ID
- `spriteCache: Map<string, Uint8Array[]>` - por appearance

**Solução**: Unificar usando chave composta ou estrutura hierárquica

#### 3.5. Query Cache (Frontend vs Backend)
**Problema**: Cache de queries em dois lugares
- **Backend**: `search_cache: DashMap<String, Arc<Vec<u32>>>` - apenas IDs
- **Frontend**: `assetsQueryCache: Map<string, { ids, itemsById, total }>` - IDs + items + total

**Solução**: Frontend pode usar apenas IDs do backend e construir items sob demanda

## 4. Recomendações de Unificação

### Prioridade 1: Alta Impacto, Alto Esforço

#### 4.1. Remover Cache Frontend de Sprites
**Ação**: Remover `spriteCache` e `previewSpriteCaches` do frontend
**Benefício**: 
- Redução de ~50% no uso de memória de sprites
- Cache único e consistente
- Menos código para manter

**Implementação**:
1. Remover `spriteCache` de `spriteCache.ts`
2. Remover `previewSpriteCaches` de `assetUI.ts`
3. Sempre chamar backend via IPC (já tem cache lá)
4. Backend já retorna dados, frontend só usa

#### 4.2. Unificar Sprite URL Cache
**Ação**: Criar módulo único `src/utils/spriteUrlCache.ts`
**Benefício**:
- Código único e reutilizável
- Blob URLs criados uma vez por buffer
- Limpeza centralizada

**Implementação**:
```typescript
// src/utils/spriteUrlCache.ts
const spriteUrlCache = new WeakMap<Uint8Array, string>();
const urlRegistry = new Set<string>();

export function getSpriteUrl(buffer: Uint8Array): string {
  const cached = spriteUrlCache.get(buffer);
  if (cached) return cached;
  const url = URL.createObjectURL(new Blob([buffer], { type: 'image/png' }));
  spriteUrlCache.set(buffer, url);
  urlRegistry.add(url);
  return url;
}

export function clearSpriteUrlCache(): void {
  urlRegistry.forEach(url => URL.revokeObjectURL(url));
  urlRegistry.clear();
}
```

### Prioridade 2: Média Impacto, Médio Esforço

#### 4.3. Unificar Single Sprite Cache
**Ação**: Integrar `singleSpriteCache` em estrutura unificada
**Benefício**: Cache único para todos os sprites

**Implementação**: Usar chave composta `"sprite:{id}"` no cache unificado

#### 4.4. Simplificar Query Cache Frontend
**Ação**: Frontend usar apenas IDs do backend, construir items sob demanda
**Benefício**: Menos memória, cache mais simples

### Prioridade 3: Baixa Prioridade

#### 4.5. Adicionar Limite LRU aos Caches
**Ação**: Implementar LRU (Least Recently Used) para caches grandes
**Benefício**: Previne uso excessivo de memória

## 5. Estrutura Proposta de Cache Unificado

### Backend (Rust) - Único Ponto de Verdade
```
AppState {
  sprite_cache: DashMap<String, Arc<Vec<Vec<u8>>>>,      // Sprites completos
  preview_cache: DashMap<String, Arc<Vec<u8>>>,          // Previews
  search_cache: DashMap<String, Arc<Vec<u32>>>,           // IDs filtrados
  sprite_loader.sprite_cache: DashMap<String, Arc<Vec<TibiaSprite>>>, // Sprite sheets
}
```

### Frontend (TypeScript) - Apenas Caches Necessários
```
utils/spriteUrlCache.ts {
  spriteUrlCache: WeakMap<Uint8Array, string>,  // Blob URLs (único)
}

features/previewAnimation/assetPreviewAnimator.ts {
  previewCache: Map<string, PreviewAnimationSequence>,  // Animações (OK)
}

animation.ts {
  detailCache: Map<string, CompleteAppearanceItem>,  // Detalhes (OK)
}

monsterEditor.ts {
  outfitSpriteMetadataCache: Map<number, {...}>,  // Metadados (OK)
}
```

## 6. Impacto Estimado

### Redução de Memória
- **Antes**: Sprites armazenados 2x (backend + frontend) = ~2x memória
- **Depois**: Sprites armazenados 1x (apenas backend) = ~50% redução
- **Exemplo**: 1000 appearances com 10 sprites cada = ~40MB → ~20MB

### Benefícios Adicionais
- ✅ Cache consistente (único ponto de verdade)
- ✅ Menos código para manter
- ✅ Menos bugs de sincronização
- ✅ Cache rico durante uso (backend persiste entre chamadas)

## 7. Análise Detalhada de Uso

### 7.1. `previewSpriteCaches` em `assetUI.ts`
**Uso atual**:
- Linha 463: Verifica cache local antes de chamar backend
- Linha 481: Chama `getAppearancePreviewSpritesBatch` (que já usa cache backend)
- Linha 490+: Armazena resultado no cache local

**Problema**: Cache local é redundante - backend já tem `preview_cache` que persiste entre chamadas IPC

**Solução**: Remover cache local, confiar apenas no backend (já é rápido via IPC)

### 7.2. `spriteCache` em `spriteCache.ts`
**Uso atual**:
- Linha 156: Verifica cache antes de chamar backend
- Linha 179: Armazena resultado do backend no cache local
- Linha 265: Armazena resultado de batch no cache local

**Problema**: Backend já tem `sprite_cache` que persiste

**Solução**: Remover cache local, confiar apenas no backend

### 7.3. `assetsQueryCache` em `assetUI.ts`
**Uso atual**:
- Linha 161: Cache de resultados de query (IDs + items + total)
- Backend tem `search_cache` mas só armazena IDs

**Análise**: 
- Frontend cache armazena items completos (mais memória)
- Backend cache armazena apenas IDs (menos memória)
- Frontend pode usar IDs do backend e buscar items sob demanda

**Solução**: Simplificar para usar apenas IDs do backend

## 8. Plano de Implementação

### Fase 1: Remover Caches Duplicados Frontend (Alta Prioridade)

#### 1.1. Remover `previewSpriteCaches` de `assetUI.ts`
**Arquivo**: `src/assetUI.ts`
**Mudanças**:
- Remover `previewSpriteCaches` (linha 35)
- Remover `getPreviewCache()` (linha 129)
- Remover `clearPreviewSpriteCaches()` (linha 138) ou simplificar
- Remover `invalidatePreviewSpriteCache()` (linha 142) ou simplificar
- Linha 463-471: Remover verificação de cache local, sempre chamar backend
- Linha 490+: Remover armazenamento no cache local

**Benefício**: ~50% redução de memória em previews

#### 1.2. Remover `spriteCache` de `spriteCache.ts`
**Arquivo**: `src/spriteCache.ts`
**Mudanças**:
- Remover `spriteCache` (linha 5)
- Remover `hasCachedSprites()` (linha 11) ou fazer verificar backend
- Remover `invalidateAppearanceSpritesCache()` (linha 28) ou simplificar
- Linha 156-157: Remover verificação de cache local
- Linha 179: Remover armazenamento no cache local
- Linha 265: Remover armazenamento no cache local
- Sempre chamar backend (já tem cache lá)

**Benefício**: ~50% redução de memória em sprites completos

#### 1.3. Manter `singleSpriteCache` (Opcional)
**Decisão**: Manter ou remover?
- **Manter**: Útil para sprites individuais por ID (não por appearance)
- **Remover**: Backend pode adicionar cache de sprite individual se necessário

**Recomendação**: Manter por enquanto (uso específico, não duplicado)

### Fase 2: Unificar Sprite URL Cache (Média Prioridade)

#### 2.1. Criar `src/utils/spriteUrlCache.ts`
**Conteúdo**:
```typescript
const spriteUrlCache = new WeakMap<Uint8Array, string>();
const urlRegistry = new Set<string>();

export function getSpriteUrl(buffer: Uint8Array): string {
  const cached = spriteUrlCache.get(buffer);
  if (cached) return cached;
  const url = URL.createObjectURL(new Blob([buffer], { type: 'image/png' }));
  spriteUrlCache.set(buffer, url);
  urlRegistry.add(url);
  return url;
}

export function clearSpriteUrlCache(): void {
  urlRegistry.forEach(url => URL.revokeObjectURL(url));
  urlRegistry.clear();
}
```

#### 2.2. Substituir Usos
- `spriteCache.ts`: Usar `getSpriteUrl()` unificado
- `assetPreviewAnimator.ts`: Usar `getSpriteUrl()` unificado
- `spriteLibrary.ts`: Adaptar para usar `getSpriteUrl()` (precisa converter número para Uint8Array primeiro)

### Fase 3: Simplificar Query Cache (Baixa Prioridade)

#### 3.1. Simplificar `assetsQueryCache`
- Usar apenas IDs do backend `search_cache`
- Construir items sob demanda quando necessário
- Reduzir memória armazenada

### Fase 4: Otimizações Adicionais (Futuro)

#### 4.1. Adicionar Limite LRU
- Implementar LRU para `sprite_cache` e `preview_cache` no backend
- Prevenir uso excessivo de memória

#### 4.2. Métricas de Cache
- Adicionar estatísticas de hit/miss rate
- Monitorar uso de memória

## 9. Estimativa de Impacto

### Redução de Memória
- **Sprites completos**: ~50% redução (remover duplicação frontend)
- **Previews**: ~50% redução (remover duplicação frontend)
- **Total estimado**: ~40-50% redução no uso de memória de sprites

### Exemplo Prático
- **1000 appearances** com **10 sprites** cada
- **Tamanho médio**: ~5KB por sprite PNG
- **Antes**: 1000 × 10 × 5KB × 2 (backend + frontend) = **~100MB**
- **Depois**: 1000 × 10 × 5KB × 1 (apenas backend) = **~50MB**
- **Economia**: **~50MB de RAM**

### Benefícios Adicionais
- ✅ Cache único e consistente
- ✅ Menos código (~200 linhas removidas)
- ✅ Menos bugs de sincronização
- ✅ Cache persiste entre navegações (backend mantém estado)

---

**Data da Análise**: 2024
**Status**: 🔴 **Duplicações críticas identificadas - Recomendação: Unificar imediatamente**
**Prioridade**: **ALTA** - Impacto significativo em memória e consistência
