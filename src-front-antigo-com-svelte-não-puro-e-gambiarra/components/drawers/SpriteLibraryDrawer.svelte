<script lang="ts">
  import { onDestroy } from 'svelte';
  import { dndzone } from 'svelte-dnd-action';
  import type { DndEvent } from 'svelte-dnd-action';
  import { translate } from '../../i18n';
  import { getSpriteById, getCachedSpriteById } from '../../spriteCache';
  import { getSpriteUrl as getUnifiedSpriteUrl } from '../../utils/spriteUrlCache';
  import { showStatus } from '../../utils';
  import { spriteLibraryStore } from '../../stores/spriteLibraryStore';
  import '../../styles/texture.css';

  type SpriteItem = {
    id: string;
    spriteId: number;
  };

  let isOpen = false;
  let mode: 'browse' | 'select' = 'browse';
  let onSelectCallback: ((id: number) => void) | undefined;

  let searchInput = '';
  let pageStart = 1;
  let pageSize = 100;
  let order: 'asc' | 'desc' = 'asc';

  let visibleRange: number[] = [];
  let spriteItems: SpriteItem[] = [];
  let spriteUrls: Map<number, string> = new Map();
  let selectedIds: Set<number> = new Set();

  let libraryListElement: HTMLElement;
  let loading = false;

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

    for (const id of ids) {
      const cached = getCachedSpriteById(id);
      if (cached) {
        spriteUrls.set(id, getUnifiedSpriteUrl(cached));
      }
    }
    spriteUrls = new Map(spriteUrls);

    for (const id of ids) {
      if (getCachedSpriteById(id)) continue;

      const data = await getSpriteById(id);
      if (data) {
        spriteUrls.set(id, getUnifiedSpriteUrl(data));
        loadedCount++;
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
          <h3 data-i18n="texture.library.title">{translate('texture.library.title')}</h3>
        </div>
        <button
          type="button"
          class="close-btn"
          id="sprite-library-close"
          aria-label={translate('texture.library.button.close')}
          data-i18n-aria-label="texture.library.button.close"
          on:click={closeDrawer}
        >
          ✕
        </button>
      </div>

      <div class="sprite-library-controls sprite-library-controls--grid">
        <label class="sprite-library-control">
          <span data-i18n="texture.library.start">{translate('texture.library.start')}</span>
          <input
            id="sprite-library-start"
            type="number"
            min="1"
            bind:value={pageStart}
            on:change={() => loadPageFromState()}
          />
        </label>
        <label class="sprite-library-control">
          <span data-i18n="texture.library.pageSize">{translate('texture.library.pageSize')}</span>
          <input
            id="sprite-library-size"
            type="number"
            min="1"
            max="500"
            bind:value={pageSize}
            on:change={() => loadPageFromState()}
          />
        </label>
        <label class="sprite-library-control order-control">
          <span data-i18n="texture.library.order">{translate('texture.library.order')}</span>
          <div class="sprite-library-order-row">
            <button
              type="button"
              id="sprite-library-order"
              class="btn-secondary sprite-library-order-btn"
              data-order={order}
              data-i18n={order === 'asc' ? 'texture.library.order.asc' : 'texture.library.order.desc'}
              on:click={toggleOrder}
            >
              {order === 'asc' ? translate('texture.library.order.asc') : translate('texture.library.order.desc')}
            </button>
            <div class="sprite-library-pager">
              <button
                type="button"
                id="sprite-library-prev"
                class="btn-secondary"
                title={translate('texture.library.prev')}
                data-i18n-title="texture.library.prev"
                on:click={goToPrevPage}
              >
                ◀
              </button>
              <button
                type="button"
                id="sprite-library-next"
                class="btn-secondary"
                title={translate('texture.library.next')}
                data-i18n-title="texture.library.next"
                on:click={goToNextPage}
              >
                ▶
              </button>
            </div>
          </div>
        </label>
      </div>

      <div class="sprite-library-controls">
        <input
          id="sprite-library-search"
          type="text"
          bind:value={searchInput}
          placeholder={translate('texture.library.searchPlaceholder')}
          data-i18n-placeholder="texture.library.searchPlaceholder"
          on:keydown={handleKeyDown}
        />
        <button
          type="button"
          id="sprite-library-search-btn"
          class="btn-secondary"
          data-i18n="texture.library.button.search"
          on:click={handleSearch}
        >
          {translate('texture.library.button.search')}
        </button>
      </div>

      <p class="sprite-library-hint" data-i18n="texture.library.hint">{translate('texture.library.hint')}</p>

      <div
        class="sprite-library-list"
        id="sprite-library-list"
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
