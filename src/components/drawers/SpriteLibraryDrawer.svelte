<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { dndzone } from 'svelte-dnd-action';
  import type { DndEvent } from 'svelte-dnd-action';
  import { translate } from '../../i18n';
  import { getSpriteById, getCachedSpriteById } from '../../spriteCache';
  import { getSpriteUrl as getUnifiedSpriteUrl } from '../../utils/spriteUrlCache';
  import { showStatus } from '../../utils';
  import { spriteLibraryStore } from '../../stores/spriteLibraryStore';
  import '../../styles/texture.css'; // Import texture styles

  // Type for items in the drag & drop list
  type SpriteItem = {
    id: string; // Must be string for dndzone
    spriteId: number; // Actual sprite ID
  };

  let isOpen = false;
  let mode: 'browse' | 'select' = 'browse';
  let onSelectCallback: ((id: number) => void) | undefined;

  let searchInput = '';
  let pageStart = 1;
  let pageSize = 100;
  let order: 'asc' | 'desc' = 'asc';
  
  let visibleRange: number[] = [];
  let spriteItems: SpriteItem[] = []; // For dndzone
  let spriteUrls: Map<number, string> = new Map();
  let selectedIds: Set<number> = new Set();
  
  let libraryListElement: HTMLElement;
  let loading = false;
  
  // Convert visibleRange to spriteItems whenever it changes
  $: spriteItems = visibleRange.map(spriteId => ({
    id: `sprite-${spriteId}`,
    spriteId
  }));

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
        // Update periodically
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

  function handleSpriteClick(event: MouseEvent, spriteId: number) {
    if (mode === 'select' && onSelectCallback) {
      onSelectCallback(spriteId);
      closeDrawer();
      return;
    }

    const multiSelect = event.ctrlKey || event.metaKey;
    if (!multiSelect) {
      selectedIds.clear();
      selectedIds.add(spriteId);
    } else {
      if (selectedIds.has(spriteId)) {
        selectedIds.delete(spriteId);
      } else {
        selectedIds.add(spriteId);
      }
    }
    selectedIds = new Set(selectedIds);
  }

  function handleDndConsider(e: CustomEvent<DndEvent<SpriteItem>>) {
    spriteItems = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<SpriteItem>>) {
    spriteItems = e.detail.items;
    // Don't update visibleRange - library is read-only for drag operations
  }
</script>

{#if isOpen}
  <div id="sprite-library-drawer" class="is-open" aria-hidden="false">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="sprite-library-backdrop" on:click={closeDrawer}></div>
    <div class="sprite-library-panel" role="dialog" aria-label={translate('texture.library.title')}>
      <div class="sprite-library-header">
        <div>
          <h3>{translate('texture.library.title')}</h3>
          <p class="sprite-library-subtitle">{translate('texture.library.subtitle')}</p>
        </div>
        <button type="button" class="close-btn" on:click={closeDrawer}>✕</button>
      </div>

      <div class="sprite-library-controls">
        <div class="sprite-library-controls--grid">
          <div class="sprite-library-control" style="grid-column: 1 / span 2;">
            <input 
              type="text" 
              bind:value={searchInput} 
              placeholder={translate('texture.library.searchPlaceholder')}
              on:keydown={handleKeyDown}
            />
          </div>
          <div class="sprite-library-control" style="grid-column: 1 / span 2;">
             <button class="btn-primary sprite-library-order-btn" on:click={handleSearch}>
                {translate('texture.library.button.search')}
             </button>
          </div>
          
          <div class="sprite-library-control">
            <span>{translate('texture.library.start')}</span>
            <input type="number" bind:value={pageStart} min="1" on:change={() => loadPageFromState()} />
          </div>
          <div class="sprite-library-control">
            <span>{translate('texture.library.pageSize')}</span>
            <input type="number" bind:value={pageSize} min="1" max="500" on:change={() => loadPageFromState()} />
          </div>

          <div class="sprite-library-control order-control">
             <button class="btn-secondary sprite-library-order-btn" on:click={toggleOrder}>
               {order === 'asc' ? translate('texture.library.order.asc') : translate('texture.library.order.desc')}
             </button>
          </div>
        </div>
        
        <div class="sprite-library-pager">
             <button class="btn-secondary" on:click={goToPrevPage}>{translate('texture.library.prev')}</button>
             <button class="btn-secondary" on:click={goToNextPage}>{translate('texture.library.next')}</button>
        </div>
      </div>

      <div 
        class="sprite-library-list" 
        bind:this={libraryListElement}
        use:dndzone={{
          items: spriteItems,
          flipDurationMs: 200,
          dropTargetStyle: {},
          type: 'sprite'
        }}
        on:consider={handleDndConsider}
        on:finalize={handleDndFinalize}
      >
        {#if spriteItems.length === 0}
          <div class="sprite-library-empty">{translate('texture.library.empty')}</div>
        {:else}
          {#each spriteItems as item (item.id)}
            <button 
              class="texture-sprite-chip sprite-library-chip" 
              class:is-selected={selectedIds.has(item.spriteId)}
              on:click={(e) => handleSpriteClick(e, item.spriteId)}
            >
              <div class="texture-sprite-thumb">
                {#if spriteUrls.has(item.spriteId)}
                  <img src={spriteUrls.get(item.spriteId)} alt="Sprite {item.spriteId}" draggable="false" />
                {:else}
                  <div class="texture-sprite-placeholder">…</div>
                {/if}
              </div>
              <div class="texture-sprite-meta">
                <span class="texture-sprite-id">#{item.spriteId}</span>
                <span class="texture-sprite-slot">{translate('texture.spriteList.slotLabel', { value: item.spriteId })}</span>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 4px;
  }
  .close-btn:hover {
    color: var(--text-primary);
  }
  .btn-primary {
    background: var(--primary-color, #646cff);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer; 
    font-weight: 600;
  }
</style>
