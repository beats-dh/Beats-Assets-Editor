<script lang="ts">
  import { dndzone } from "svelte-dnd-action";
  import type { DndEvent } from "svelte-dnd-action";
  import { translate } from "../../i18n";
  import {
    getSpriteById,
    getCachedSpriteById,
    pixelSprite,
  } from "../../spriteCache";
  import { getSpriteUrl as getUnifiedSpriteUrl } from "../../utils/spriteUrlCache";
  import { showStatus } from "../../utils";
  import {
    spriteLibraryState,
    closeSpriteLibrary,
  } from "../../stores/spriteLibraryState.svelte";
  import { SvelteMap, SvelteSet } from "svelte/reactivity";
  import "../../styles/texture.css";

  type SpriteItem = {
    id: string;
    spriteId: number;
  };

  let searchInput = $state("");
  let pageStart = $state(1);
  let pageSize = $state(100);
  let order = $state<"asc" | "desc">("asc");

  let visibleRange = $state<number[]>([]);
  let spriteUrls = $state(new SvelteMap<number, string>());
  let selectedIds = $state(new SvelteSet<number>());

  let spriteItems = $derived(
    visibleRange.map((spriteId) => ({
      id: `sprite-${spriteId}`,
      spriteId,
    })),
  );

  // React to store open
  $effect(() => {
    if (spriteLibraryState.isOpen && visibleRange.length === 0) {
      loadPageFromState();
    }
  });

  function closeDrawer() {
    closeSpriteLibrary();
  }

  function parseSpriteIdInput(raw: string): number[] {
    if (!raw) return [];
    const ids: number[] = [];
    raw.split(",").forEach((part) => {
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
      if (Number.isFinite(value)) ids.push(value);
    });
    return Array.from(new Set(ids));
  }

  async function loadSprites(rawInput: string) {
    const ids = parseSpriteIdInput(rawInput);
    if (ids.length === 0) {
      showStatus(translate("status.spriteDropInvalid"), "error");
      return;
    }
    visibleRange = ids;
    await loadSpriteImages(ids);
  }

  async function loadPageFromState() {
    const ids: number[] = [];
    const start = Math.max(1, pageStart);
    const seen = new Set<number>();
    if (order === "asc") {
      for (let i = 0; i < pageSize; i += 1) {
        const id = start + i;
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    } else {
      for (let i = 0; i < pageSize; i += 1) {
        const id = Math.max(1, start - i);
        if (!seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }
    visibleRange = ids;
    await loadSpriteImages(ids);
  }

  async function loadSpriteImages(ids: number[]) {
    let loadedCount = 0;

    for (const id of ids) {
      const cached = getCachedSpriteById(id);
      if (cached) spriteUrls.set(id, getUnifiedSpriteUrl(cached));
    }

    for (const id of ids) {
      if (getCachedSpriteById(id)) continue;
      const data = await getSpriteById(id);
      if (data) {
        spriteUrls.set(id, getUnifiedSpriteUrl(data));
        loadedCount++;
      }
    }

    if (loadedCount > 0) {
      showStatus(
        translate("status.spriteLibraryLoaded", { count: loadedCount }),
        "success",
      );
    }
  }

  function handleSearch() {
    loadSprites(searchInput);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function goToNextPage() {
    if (order === "asc") {
      pageStart = Math.max(1, pageStart + pageSize);
    } else {
      pageStart = Math.max(1, pageStart - pageSize);
    }
    loadPageFromState();
  }

  function goToPrevPage() {
    if (order === "asc") {
      pageStart = Math.max(1, pageStart - pageSize);
    } else {
      pageStart = pageStart + pageSize;
    }
    loadPageFromState();
  }

  function toggleOrder() {
    order = order === "asc" ? "desc" : "asc";
    loadPageFromState();
  }

  function handleSpriteClick(event: MouseEvent, spriteId: number) {
    if (spriteLibraryState.mode === "select" && spriteLibraryState.onSelect) {
      spriteLibraryState.onSelect(spriteId);
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
  }

  function handleDndConsider(e: CustomEvent<DndEvent<SpriteItem>>) {
    spriteItems = e.detail.items;
  }
  function handleDndFinalize(e: CustomEvent<DndEvent<SpriteItem>>) {
    spriteItems = e.detail.items;
  }
</script>

{#if spriteLibraryState.isOpen}
  <div id="sprite-library-drawer" class="is-open" aria-hidden="false">
    <!-- Non-modal drawer: the backdrop is transparent and lets you keep using
         the grid behind it (pointer-events:none), so it is decorative only.
         Use the header close button to dismiss. -->
    <div class="sprite-library-backdrop" aria-hidden="true"></div>
    <div
      class="sprite-library-panel"
      role="dialog"
      aria-label={translate("texture.library.title")}
    >
      <div class="sprite-library-header">
        <div><h3>{translate("texture.library.title")}</h3></div>
        <button
          type="button"
          class="close-btn"
          id="sprite-library-close"
          aria-label={translate("texture.library.button.close")}
          onclick={closeDrawer}>✕</button
        >
      </div>

      <div class="sprite-library-controls sprite-library-controls--grid">
        <label class="sprite-library-control">
          <span>{translate("texture.library.start")}</span>
          <input
            id="sprite-library-start"
            type="number"
            min="1"
            bind:value={pageStart}
            onchange={() => loadPageFromState()}
          />
        </label>
        <label class="sprite-library-control">
          <span>{translate("texture.library.pageSize")}</span>
          <input
            id="sprite-library-size"
            type="number"
            min="1"
            max="500"
            bind:value={pageSize}
            onchange={() => loadPageFromState()}
          />
        </label>
        <label class="sprite-library-control order-control">
          <span>{translate("texture.library.order")}</span>
          <div class="sprite-library-order-row">
            <button
              type="button"
              id="sprite-library-order"
              class="btn-secondary sprite-library-order-btn"
              data-order={order}
              onclick={toggleOrder}
            >
              {order === "asc"
                ? translate("texture.library.order.asc")
                : translate("texture.library.order.desc")}
            </button>
            <div class="sprite-library-pager">
              <button
                type="button"
                id="sprite-library-prev"
                class="btn-secondary"
                title={translate("texture.library.prev")}
                onclick={goToPrevPage}>◀</button
              >
              <button
                type="button"
                id="sprite-library-next"
                class="btn-secondary"
                title={translate("texture.library.next")}
                onclick={goToNextPage}>▶</button
              >
            </div>
          </div>
        </label>
      </div>

      <div class="sprite-library-controls">
        <input
          id="sprite-library-search"
          type="text"
          bind:value={searchInput}
          placeholder={translate("texture.library.searchPlaceholder")}
          onkeydown={handleKeyDown}
        />
        <button
          type="button"
          id="sprite-library-search-btn"
          class="btn-secondary"
          onclick={handleSearch}
          >{translate("texture.library.button.search")}</button
        >
      </div>

      <p class="sprite-library-hint">{translate("texture.library.hint")}</p>

      <div
        class="sprite-library-list"
        id="sprite-library-list"
        use:dndzone={{
          items: spriteItems,
          flipDurationMs: 200,
          dropTargetStyle: {},
          type: "sprite",
        }}
        onconsider={handleDndConsider}
        onfinalize={handleDndFinalize}
      >
        {#if spriteItems.length === 0}
          <div class="sprite-library-empty">
            {translate("texture.library.empty")}
          </div>
        {:else}
          {#each spriteItems as item (item.id)}
            <button
              class="texture-sprite-chip sprite-library-chip"
              class:is-selected={selectedIds.has(item.spriteId)}
              onclick={(e) => handleSpriteClick(e, item.spriteId)}
            >
              <div class="texture-sprite-thumb">
                {#if spriteUrls.has(item.spriteId)}
                  <canvas
                    use:pixelSprite={spriteUrls.get(item.spriteId) ?? null}
                    style="width:32px;height:32px;"
                  ></canvas>
                {:else}
                  <div class="texture-sprite-placeholder">…</div>
                {/if}
              </div>
              <div class="texture-sprite-meta">
                <span class="texture-sprite-id">#{item.spriteId}</span>
                <span class="texture-sprite-slot"
                  >{translate("texture.spriteList.slotLabel", {
                    value: item.spriteId,
                  })}</span
                >
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
