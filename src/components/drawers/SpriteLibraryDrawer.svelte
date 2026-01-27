<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { translate } from '../../i18n';
  import { getSpriteById, getCachedSpriteById } from '../../spriteCache';
  import { getSpriteUrl as getUnifiedSpriteUrl } from '../../utils/spriteUrlCache';
  import { showStatus } from '../../utils';
  import { spriteLibraryStore } from '../../stores/spriteLibraryStore';

  let isOpen = false;
  let mode: 'browse' | 'select' = 'browse';
  let onSelectCallback: ((id: number) => void) | undefined;

  let searchInput = '';
  let pageStart = 1;
  let pageSize = 100;
  let order: 'asc' | 'desc' = 'asc';
  
  let visibleRange: number[] = [];
  let spriteUrls: Map<number, string> = new Map();
  let loading = false;
  let selectedIds: Set<number> = new Set();

  const unsubscribe = spriteLibraryStore.subscribe(state => {
    isOpen = state.isOpen;
    mode = state.mode;
    onSelectCallback = state.onSelect;
    if (isOpen && visibleRange.length === 0) {
      loadPageFromState();
    }
  });

  onDestroy(() => {
    unsubscribe();
  });

  function closeDrawer() {
    spriteLibraryStore.close();
  }

  function parseSpriteIdInput(raw: string): number[] {
    if (!raw) return [];
    const ids: number[] = [];
    raw.split(',').forEach((part) => {
      const token = part.trim();
      if (!token) return;
      const rangeMatch = token.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = Number(rangeMatch[1]);
        const end = Number(rangeMatch[2]);
        if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
          for (let i = start; i <= end && ids.length < 1000; i += 1) {
            ids.push(i);
          }
        }
        return;
      }
      const value = Number(token);
      if (Number.isFinite(value)) {
        ids.push(value);
      }
    });
    return Array.from(new Set(ids));
  }

  async function loadSprites(rawInput: string) {
    const ids = parseSpriteIdInput(rawInput);
    if (ids.length === 0) {
      showStatus(translate('status.spriteDropInvalid'), 'error');
      return;
    }
    visibleRange = ids;
    await loadSpriteImages(ids);
  }

  async function loadPageFromState() {
    const ids: number[] = [];
    const start = Math.max(1, pageStart);
    if (order === 'asc') {
      for (let i = 0; i < pageSize; i += 1) ids.push(start + i);
    } else {
      for (let i = 0; i < pageSize; i += 1) ids.push(Math.max(1, start - i));
    }
    visibleRange = ids;
    await loadSpriteImages(ids);
  }

  async function loadSpriteImages(ids: number[]) {
    loading = true;
    let loadedCount = 0;
    
    // First pass: check cache
    for (const id of ids) {
      const cached = getCachedSpriteById(id);
      if (cached) {
        spriteUrls.set(id, getUnifiedSpriteUrl(cached));
      }
    }
    spriteUrls = new Map(spriteUrls); // Trigger update

    // Second pass: fetch missing
    for (const id of ids) {
      if (getCachedSpriteById(id)) continue;
      
      const data = await getSpriteById(id);
      if (data) {
        spriteUrls.set(id, getUnifiedSpriteUrl(data));
        loadedCount++;
        // Update periodically to show progress
        if (loadedCount % 10 === 0) {
           spriteUrls = new Map(spriteUrls);
        }
      }
    }
    
    spriteUrls = new Map(spriteUrls);
    loading = false;
    
    if (loadedCount > 0) {
      showStatus(translate('status.spriteLibraryLoaded', { count: loadedCount }), 'success');
    }
  }

  function handleSearch() {
    loadSprites(searchInput);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  function goToNextPage() {
    if (order === 'asc') {
      pageStart = Math.max(1, pageStart + pageSize);
    } else {
      pageStart = Math.max(1, pageStart - pageSize);
    }
    loadPageFromState();
  }

  function goToPrevPage() {
    if (order === 'asc') {
      pageStart = Math.max(1, pageStart - pageSize);
    } else {
      pageStart = pageStart + pageSize;
    }
    loadPageFromState();
  }

  function toggleOrder() {
    order = order === 'asc' ? 'desc' : 'asc';
    loadPageFromState();
  }

  function selectSprite(id: number) {
    if (mode === 'select' && onSelectCallback) {
      onSelectCallback(id);
      closeDrawer();
      return;
    }

    // Browse mode selection
    selectedIds.clear();
    selectedIds.add(id);
    selectedIds = new Set(selectedIds);
  }

  function handleDragStart(event: DragEvent, id: number) {
    const cachedUrl = spriteUrls.get(id);
    if (!event.dataTransfer || !cachedUrl) return;
    
    if (!selectedIds.has(id)) {
      selectedIds.clear();
      selectedIds.add(id);
      selectedIds = new Set(selectedIds);
    }
    
    const spriteIds = Array.from(selectedIds).sort((a, b) => a - b);
    const payload = { spriteIds };
    event.dataTransfer.setData('application/x-asset-sprite', JSON.stringify(payload));
    event.dataTransfer.setData('text/plain', spriteIds.join(','));
    event.dataTransfer.effectAllowed = 'copy';
  }
</script>

{#if isOpen}
  <div id="sprite-library-drawer" class="is-open" aria-hidden="false">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="sprite-library-backdrop" on:click={closeDrawer}></div>
    <div class="sprite-library-panel" role="dialog" aria-label={translate('texture.library.title')}>
      <div class="sprite-library-header">
        <div class="header-controls">
          <h3>{translate('texture.library.title')}</h3>
          <div class="search-box">
            <input 
              type="text" 
              bind:value={searchInput} 
              placeholder={translate('texture.library.searchPlaceholder')}
              on:keydown={handleKeyDown}
            />
            <button class="btn-secondary" on:click={handleSearch}>
              {translate('texture.library.button.search')}
            </button>
          </div>
        </div>
        <button type="button" class="icon-btn close-btn" on:click={closeDrawer}>✕</button>
      </div>

      <div class="sprite-library-controls">
        <div class="pagination-controls">
          <label>
            {translate('texture.library.start')}:
            <input type="number" bind:value={pageStart} min="1" on:change={() => loadPageFromState()} />
          </label>
          <label>
            {translate('texture.library.pageSize')}:
            <input type="number" bind:value={pageSize} min="1" max="500" on:change={() => loadPageFromState()} />
          </label>
          <button class="btn-secondary" on:click={toggleOrder}>
            {order === 'asc' ? translate('texture.library.order.asc') : translate('texture.library.order.desc')}
          </button>
        </div>
        <div class="nav-buttons">
          <button class="btn-secondary" on:click={goToPrevPage}>
            {translate('texture.library.prev')}
          </button>
          <button class="btn-secondary" on:click={goToNextPage}>
            {translate('texture.library.next')}
          </button>
        </div>
      </div>

      <div class="sprite-library-content">
        {#if visibleRange.length === 0}
          <div class="sprite-library-empty">{translate('texture.library.empty')}</div>
        {:else}
          <div class="sprite-grid">
            {#each visibleRange as id}
              <button 
                class="texture-sprite-chip sprite-library-chip" 
                class:is-selected={selectedIds.has(id)}
                on:click={() => selectSprite(id)}
                draggable="true"
                on:dragstart={(e) => handleDragStart(e, id)}
              >
                <div class="texture-sprite-thumb">
                  {#if spriteUrls.has(id)}
                    <img src={spriteUrls.get(id)} alt="Sprite {id}" />
                  {:else}
                    <div class="texture-sprite-placeholder">…</div>
                  {/if}
                </div>
                <div class="texture-sprite-meta">
                  <span class="texture-sprite-id">#{id}</span>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  #sprite-library-drawer {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 2000;
    display: none;
  }

  #sprite-library-drawer.is-open {
    display: block;
  }

  .sprite-library-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
  }

  .sprite-library-panel {
    position: absolute;
    top: 0;
    right: 0;
    width: 400px;
    height: 100%;
    background: var(--bg-secondary, #1e1e1e);
    box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--border-color, #333);
  }

  .sprite-library-header {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color, #333);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: var(--bg-tertiary, #252525);
  }

  .header-controls {
    flex: 1;
  }

  .header-controls h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    color: var(--text-primary, #e0e0e0);
  }

  .search-box {
    display: flex;
    gap: 0.5rem;
  }

  .search-box input {
    flex: 1;
    background: var(--bg-input, #111);
    border: 1px solid var(--border-input, #444);
    color: var(--text-primary, #e0e0e0);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary, #aaa);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.25rem;
  }

  .close-btn:hover {
    color: var(--text-primary, #fff);
  }

  .sprite-library-controls {
    padding: 0.75rem;
    background: var(--bg-tertiary, #252525);
    border-bottom: 1px solid var(--border-color, #333);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .pagination-controls {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .pagination-controls label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.85rem;
    color: var(--text-secondary, #aaa);
  }

  .pagination-controls input {
    width: 60px;
    background: var(--bg-input, #111);
    border: 1px solid var(--border-input, #444);
    color: var(--text-primary, #e0e0e0);
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
  }

  .nav-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: space-between;
  }

  .sprite-library-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .sprite-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.5rem;
  }

  .sprite-library-chip {
    background: var(--bg-card, #2a2a2a);
    border: 1px solid var(--border-color, #333);
    border-radius: 4px;
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.2s;
  }

  .sprite-library-chip:hover {
    background: var(--bg-hover, #333);
    border-color: var(--primary-color, #646cff);
  }

  .sprite-library-chip.is-selected {
    background: var(--primary-color-dim, #3a3a5e);
    border-color: var(--primary-color, #646cff);
  }

  .texture-sprite-thumb {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M0 0h4v4H0zm4 4h4v4H4z" fill="%23222" fill-opacity="0.4"/></svg>');
  }

  .texture-sprite-thumb img {
    max-width: 100%;
    max-height: 100%;
    image-rendering: pixelated;
  }

  .texture-sprite-meta {
    font-size: 0.75rem;
    color: var(--text-secondary, #888);
  }

  .btn-secondary {
    background: var(--bg-button, #333);
    border: 1px solid var(--border-button, #555);
    color: var(--text-primary, #e0e0e0);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .btn-secondary:hover {
    background: var(--bg-button-hover, #444);
  }

  .sprite-library-empty {
    text-align: center;
    color: var(--text-secondary, #888);
    padding: 2rem;
  }
</style>
