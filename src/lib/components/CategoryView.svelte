<script lang="ts">
  import { appState } from "../stores/app.svelte";
  import { invoke } from "../api/invoke";
  import { COMMANDS } from "../api/commands";
  import ItemDetailsModal from "./ItemDetailsModal.svelte";

  // Props
  interface Props {
    category: string;
    initialPage?: number; // Starting page when component mounts
    requestedPage?: number; // Page requested from header
    pageRequestId?: number; // Increments when header requests page change
    pageSize?: number; // Items per page from header
    pageSizeRequestId?: number; // Increments when header changes page size
    onInfoChange?: (info: { name: string; count: number; page: number; pages: number }) => void;
    onPageChange?: (page: number) => void;
    searchQuery?: string;
  }
  let { 
    category, 
    initialPage = 0, 
    requestedPage = 0, 
    pageRequestId = 0, 
    pageSize: propPageSize = 100,
    pageSizeRequestId = 0,
    onInfoChange, 
    onPageChange, 
    searchQuery = "" 
  }: Props = $props();

  // Parse category (may include subcategory like "Objects:Armors")
  let categoryParts = $derived(category.split(":"));
  let mainCategory = $derived(categoryParts[0]);
  let subcategory = $derived(categoryParts[1] || null);
  let displayName = $derived(subcategory ? `${mainCategory} / ${subcategory}` : mainCategory);

  // Types matching backend
  interface AppearanceItem {
    id: number;
    name?: string;
    description?: string;
    type_name?: string;
  }

  interface AppearancePage {
    total: number;
    items: AppearanceItem[];
  }

  // State
  let items = $state<AppearanceItem[]>([]);
  let sprites = $state<Map<number, string>>(new Map());
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let totalCount = $state(0);
  
  // Pagination - initialize with initialPage prop
  let currentPage = $state(initialPage);
  let pageSize = $state(propPageSize);
  let totalPages = $derived(Math.ceil(totalCount / pageSize));
  
  // Track search and page request changes
  let lastSearch = "";
  let lastPageRequestId = 0;
  let lastPageSizeRequestId = 0;

  // Load on mount
  $effect(() => {
    // Initial load
    loadItems();
  });

  // React to page changes from header
  $effect(() => {
    if (pageRequestId > 0 && pageRequestId !== lastPageRequestId) {
      lastPageRequestId = pageRequestId;
      if (requestedPage !== currentPage && requestedPage >= 0 && requestedPage < totalPages) {
        currentPage = requestedPage;
        loadItems();
      }
    }
  });

  // React to page size changes from header
  $effect(() => {
    if (pageSizeRequestId > 0 && pageSizeRequestId !== lastPageSizeRequestId) {
      lastPageSizeRequestId = pageSizeRequestId;
      pageSize = propPageSize;
      currentPage = 0; // Reset to first page when page size changes
      loadItems();
    }
  });

  // Search changes
  $effect(() => {
    if (searchQuery !== lastSearch) {
      lastSearch = searchQuery;
      if (lastSearch !== "") {
        // Search changed, reset to page 0
        currentPage = 0;
        onPageChange?.(0);
      }
      loadItems();
    }
  });

  // Notify parent of info changes
  $effect(() => {
    onInfoChange?.({
      name: displayName,
      count: totalCount,
      page: currentPage,
      pages: totalPages,
    });
  });

  async function loadItems() {
    isLoading = true;
    error = null;
    
    try {
      // Import cache dynamically to avoid circular deps
      const { frontendCache } = await import("../cache/frontendCache");
      
      // Check cache first
      const cached = frontendCache.getPage(
        mainCategory,
        currentPage,
        pageSize,
        searchQuery || undefined,
        subcategory || undefined
      );
      
      if (cached) {
        // Use cached data
        items = cached.items;
        totalCount = cached.total;
        
        // Load sprites (may also be cached)
        if (items.length > 0) {
          const ids = items.map(item => item.id);
          await loadSprites(ids);
        }
      } else {
        // Cache miss - fetch from backend
        const result = await invoke<AppearancePage>(
          COMMANDS.LIST_APPEARANCES_BY_CATEGORY,
          {
            category: mainCategory,
            page: currentPage,
            pageSize: pageSize,
            search: searchQuery || null,
            subcategory: subcategory,
          }
        );
        
        items = result.items || [];
        totalCount = result.total || 0;

        // Store in cache
        frontendCache.setPage(
          mainCategory,
          currentPage,
          pageSize,
          items,
          totalCount,
          searchQuery || undefined,
          subcategory || undefined
        );

        // Load preview sprites in batch
        if (items.length > 0) {
          const ids = items.map(item => item.id);
          await loadSprites(ids);
        }
      }
    } catch (e) {
      console.error("Error loading items:", e);
      error = e instanceof Error ? e.message : String(e);
    } finally {
      isLoading = false;
    }
  }

  async function loadSprites(ids: number[]) {
    try {
      const { frontendCache } = await import("../cache/frontendCache");
      
      // Check which sprites are already cached
      const { cached, missing } = frontendCache.getSprites(mainCategory, ids);
      
      // Start with cached sprites
      const newSprites = new Map<number, string>(cached);
      
      // Only fetch missing sprites from backend
      if (missing.length > 0) {
        const result = await invoke<Record<number, number[]>>(
          COMMANDS.GET_APPEARANCE_PREVIEW_SPRITES_BATCH,
          {
            category: mainCategory,
            appearanceIds: missing,
          }
        );

        // Convert raw data to blob URLs and cache them
        const fetchedSprites = new Map<number, string>();
        for (const [id, data] of Object.entries(result)) {
          if (data && Array.isArray(data) && data.length > 0) {
            const uint8Array = new Uint8Array(data);
            const blob = new Blob([uint8Array], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            const numId = Number(id);
            newSprites.set(numId, url);
            fetchedSprites.set(numId, url);
          }
        }
        
        // Cache the newly fetched sprites
        frontendCache.setSprites(mainCategory, fetchedSprites);
      }
      
      sprites = newSprites;
    } catch (e) {
      console.error("Error loading sprites:", e);
      // Don't fail the whole view if sprites fail
    }
  }

  function goToPage(page: number) {
    if (page >= 0 && page < totalPages) {
      currentPage = page;
      loadItems();
    }
  }

  // Modal state
  let selectedItemId = $state<number | null>(null);
  let selectedItemSpriteUrl = $state<string | undefined>(undefined);

  function selectItem(id: number) {
    selectedItemId = id;
    selectedItemSpriteUrl = sprites.get(id);
  }

  function closeModal() {
    selectedItemId = null;
    selectedItemSpriteUrl = undefined;
  }

  function goBack() {
    appState.setCurrentView("home");
    appState.setCurrentCategory(null);
  }

  // Cleanup blob URLs on destroy
  $effect(() => {
    return () => {
      sprites.forEach(url => URL.revokeObjectURL(url));
    };
  });
</script>

<!-- Category View -->
<div class="category-view">
  <!-- Content -->
  {#if isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Carregando items...</p>
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error-message">Erro: {error}</p>
      <button class="btn-secondary" onclick={loadItems}>Tentar novamente</button>
    </div>
  {:else if items.length === 0}
    <div class="empty-container">
      <p>Nenhum item encontrado nesta categoria.</p>
    </div>
  {:else}
    <!-- Items Grid -->
    <div class="items-grid">
      {#each items as item (item.id)}
        <button
          class="item-card"
          onclick={() => selectItem(item.id)}
          title={item.name || `ID: ${item.id}`}
        >
          <div class="item-sprite">
            {#if sprites.has(item.id)}
              <img
                src={sprites.get(item.id)}
                alt={item.name || `Item ${item.id}`}
                class="sprite-image"
              />
            {:else}
              <div class="sprite-placeholder">?</div>
            {/if}
          </div>
          <div class="item-info">
            <span class="item-id">#{item.id}</span>
            {#if item.name}
              <span class="item-name">{item.name}</span>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Item Details Modal -->
{#if selectedItemId !== null}
  <ItemDetailsModal 
    category={mainCategory}
    itemId={selectedItemId}
    spriteUrl={selectedItemSpriteUrl}
    onclose={closeModal}
  />
{/if}

<style>
  .category-view {
    padding: 0.75rem;
    height: calc(100vh - 60px);
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  }

  .category-header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-btn {
    font-size: 1.5rem;
    padding: 0.5rem 1rem;
    background: var(--bg-secondary, rgba(30, 41, 59, 0.8));
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    border-radius: 0.75rem;
    color: var(--text-primary, #fff);
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-btn:hover {
    background: var(--bg-hover, rgba(51, 65, 85, 0.8));
    transform: translateX(-2px);
  }

  .category-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary, #fff);
    margin: 0;
  }

  .subcategory-label {
    color: var(--text-secondary, #94a3b8);
    font-weight: 500;
  }

  .category-count {
    font-size: 0.875rem;
    color: var(--text-secondary, #94a3b8);
    margin: 0.25rem 0 0;
  }

  .pagination {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .page-info {
    font-size: 0.875rem;
    color: var(--text-secondary, #94a3b8);
  }

  .btn-icon {
    padding: 0.5rem 0.75rem;
    background: var(--bg-secondary, rgba(30, 41, 59, 0.8));
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    border-radius: 0.5rem;
    color: var(--text-primary, #fff);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-icon:hover:not(:disabled) {
    background: var(--bg-hover, rgba(51, 65, 85, 0.8));
  }

  .btn-icon:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-container,
  .error-container,
  .empty-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--text-secondary, #94a3b8);
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border-color, rgba(255, 255, 255, 0.1));
    border-top-color: var(--primary, #4f46e5);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-message {
    color: #ef4444;
  }

  .items-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.75rem;
    overflow-y: auto;
    padding: 0.25rem;
    align-content: start;
  }

  /* Custom scrollbar */
  .items-grid::-webkit-scrollbar {
    width: 8px;
  }

  .items-grid::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .items-grid::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.5);
    border-radius: 4px;
  }

  .items-grid::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.7);
  }

  .item-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-secondary, rgba(30, 41, 59, 0.6));
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
  }

  .item-card:hover {
    background: var(--bg-hover, rgba(51, 65, 85, 0.8));
    border-color: var(--primary, #4f46e5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .item-sprite {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .sprite-image {
    max-width: 100%;
    max-height: 100%;
    image-rendering: pixelated;
  }

  .sprite-placeholder {
    font-size: 1.5rem;
    color: var(--text-muted, #64748b);
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
  }

  .item-id {
    font-size: 0.75rem;
    color: var(--text-muted, #64748b);
    font-family: monospace;
  }

  .item-name {
    font-size: 0.75rem;
    color: var(--text-secondary, #94a3b8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-secondary {
    padding: 0.75rem 1.5rem;
    background: var(--bg-secondary, rgba(30, 41, 59, 0.8));
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    border-radius: 0.75rem;
    color: var(--text-primary, #fff);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: var(--bg-hover, rgba(51, 65, 85, 0.8));
  }
</style>
