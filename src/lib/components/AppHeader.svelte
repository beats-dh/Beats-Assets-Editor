<script lang="ts">
  import { appState } from "../stores/app.svelte";
  import SettingsMenu from "./SettingsMenu.svelte";

  // Props
  interface Props {
    onhome?: () => void;
    // Category view props
    categoryName?: string;
    categoryCount?: number;
    currentPage?: number;
    totalPages?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    onSearch?: (query: string) => void;
  }

  let { 
    onhome, 
    categoryName, 
    categoryCount = 0, 
    currentPage = 0, 
    totalPages = 0,
    pageSize = 100,
    onPageChange,
    onPageSizeChange,
    onSearch
  }: Props = $props();

  // Page size options
  const pageSizeOptions = [50, 100, 200, 500, 1000, 5000];

  // Derived state
  let stats = $derived(appState.stats);
  let currentView = $derived(appState.currentView);
  let isInCategory = $derived(currentView === "category");

  // Local state
  let showSettings = $state(false);
  let searchQuery = $state("");

  function toggleSettings(e: MouseEvent) {
    e.stopPropagation();
    showSettings = !showSettings;
  }

  function closeSettings() {
    showSettings = false;
  }

  function goHome() {
    onhome?.();
  }

  function goBack() {
    appState.setCurrentView("home");
    appState.setCurrentCategory(null);
  }

  async function refresh() {
    // Clear frontend cache
    const { frontendCache } = await import("../cache/frontendCache");
    frontendCache.clearAll();
    
    appState.setCurrentView("home");
  }

  function prevPage() {
    if (currentPage > 0 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  }

  function nextPage() {
    if (currentPage < totalPages - 1 && onPageChange) {
      onPageChange(currentPage + 1);
    }
  }

  function handleSearch() {
    onSearch?.(searchQuery);
  }

  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  function clearSearch() {
    searchQuery = "";
    onSearch?.("");
  }

  // Close settings on outside click
  $effect(() => {
    if (showSettings) {
      const handler = () => closeSettings();
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  });
</script>

<!-- Navigation Header - Using original CSS classes -->
<header class="app-header">
  <div class="header-content header-layout">
    
    {#if isInCategory && categoryName}
      <!-- Category View Header: [BACK + NAME] | [SEARCH] | [PAGINATION + ACTIONS] -->
      
      <!-- LEFT: Back button + Category name -->
      <div class="header-left">
        <button class="icon-btn back-btn" onclick={goBack} title="Voltar">
          ←
        </button>
        <div class="category-title-section">
          <h1 class="category-name">{categoryName}</h1>
          <span class="category-count">{categoryCount.toLocaleString()} items</span>
        </div>
      </div>

      <!-- CENTER: Search bar -->
      <div class="header-center">
        <div class="search-container">
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por ID ou nome..."
            bind:value={searchQuery}
            onkeydown={handleSearchKeydown}
          />
          {#if searchQuery}
            <button class="search-clear" onclick={clearSearch} title="Limpar">
              ✕
            </button>
          {/if}
          <button class="search-btn" onclick={handleSearch} title="Buscar">
            🔍
          </button>
        </div>
      </div>

      <!-- RIGHT: Pagination + Actions -->
      <div class="header-right">
        {#if totalPages > 1}
          <div class="header-pagination">
            <button
              class="icon-btn"
              disabled={currentPage === 0}
              onclick={prevPage}
              title="Página anterior"
            >
              ◀
            </button>
            <span class="page-info">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              class="icon-btn"
              disabled={currentPage >= totalPages - 1}
              onclick={nextPage}
              title="Próxima página"
            >
              ▶
            </button>
          </div>
        {/if}

        <!-- Page size selector -->
        <select 
          class="page-size-select"
          value={pageSize}
          onchange={(e) => onPageSizeChange?.(Number((e.target as HTMLSelectElement).value))}
          title="Items por página"
        >
          {#each pageSizeOptions as size}
            <option value={size}>{size}</option>
          {/each}
        </select>

        <div class="header-actions">
          <button
            id="settings-btn"
            class="icon-btn"
            title="Configurações"
            onclick={toggleSettings}
          >
            ⚙️
          </button>

          {#if showSettings}
            <SettingsMenu onclose={closeSettings} />
          {/if}

          <button id="home-btn" class="icon-btn" title="Tela inicial" onclick={goHome}>
            🏠
          </button>
          <button id="refresh-btn" class="icon-btn" title="Refresh" onclick={refresh}>
            🔄
          </button>
        </div>
      </div>

    {:else}
      <!-- Normal Header (Home view) -->
      <div class="header-left">
        <div class="logo-section">
          <div class="app-logo">⚔️</div>
          <div class="app-title">
            <h1>Tibia Assets Editor</h1>
            <p class="app-subtitle">Professional Asset Management</p>
          </div>
        </div>
      </div>

      <!-- Header Stats -->
      <div class="header-center">
        {#if stats}
          <div class="header-stats" id="header-stats">
            <div class="stat-item">
              <span class="stat-value">{stats.actual_objects.toLocaleString()}</span>
              <span class="stat-label">Objects</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{stats.actual_outfits.toLocaleString()}</span>
              <span class="stat-label">Outfits</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{stats.actual_effects.toLocaleString()}</span>
              <span class="stat-label">Effects</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{stats.actual_missiles.toLocaleString()}</span>
              <span class="stat-label">Missiles</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Header Actions -->
      <div class="header-right">
        <div class="header-actions">
          <button
            id="settings-btn"
            class="icon-btn"
            title="Configurações"
            onclick={toggleSettings}
          >
            ⚙️
          </button>

          {#if showSettings}
            <SettingsMenu onclose={closeSettings} />
          {/if}

          <button id="home-btn" class="icon-btn" title="Tela inicial" onclick={goHome}>
            🏠
          </button>
          <button id="refresh-btn" class="icon-btn" title="Refresh" onclick={refresh}>
            🔄
          </button>
        </div>
      </div>
    {/if}
  </div>
</header>

<style>
  /* Override global styles to use full width */
  .header-layout {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 1rem !important;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .header-center {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 0 2rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-shrink: 0;
  }

  .back-btn {
    font-size: 1.25rem;
  }

  .category-title-section {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }

  .category-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary, #fff);
    margin: 0;
  }

  .category-count {
    font-size: 0.875rem;
    color: var(--text-secondary, #94a3b8);
  }

  /* Search */
  .search-container {
    display: flex;
    align-items: center;
    background: var(--bg-secondary, rgba(30, 41, 59, 0.8));
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    border-radius: 0.75rem;
    overflow: hidden;
    max-width: 400px;
    width: 100%;
  }

  .search-input {
    flex: 1;
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    color: var(--text-primary, #fff);
    font-size: 0.875rem;
    outline: none;
  }

  .search-input::placeholder {
    color: var(--text-muted, #64748b);
  }

  .search-clear,
  .search-btn {
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: none;
    color: var(--text-secondary, #94a3b8);
    cursor: pointer;
    transition: color 0.2s;
  }

  .search-clear:hover,
  .search-btn:hover {
    color: var(--text-primary, #fff);
  }

  /* Pagination */
  .header-pagination {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .page-info {
    font-size: 0.875rem;
    color: var(--text-secondary, #94a3b8);
    white-space: nowrap;
    min-width: 60px;
    text-align: center;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
