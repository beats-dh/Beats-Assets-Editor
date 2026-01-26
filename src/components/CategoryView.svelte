<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { 
    currentCategory, 
    currentSubcategory, 
    viewMode, 
    assets, 
    currentPage, 
    pageSize, 
    totalItems, 
    searchQuery,
    isLoading 
  } from '../stores/assetsStore';
  import { openAssetDetails } from '../stores/selectionStore';
  import { translate } from '../i18n';
  import { loadAssetsData } from '../services/assetService';
  import { isAssetSelected } from '../assetSelection';
  
  // Back button
  function goBack() {
    viewMode.set('categories');
  }

  // Search
  let timer: number;
  function handleSearch(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    searchQuery.set(val);
    clearTimeout(timer);
    timer = setTimeout(() => {
      currentPage.set(0); 
      loadAssetsData(); 
    }, 300);
  }

  function clearSearch() {
    searchQuery.set('');
    currentPage.set(0);
    loadAssetsData();
  }

  // Pagination
  function prevPage() {
    if ($currentPage > 0) {
      currentPage.update(n => n - 1);
      loadAssetsData();
    }
  }

  function nextPage() {
    const maxPage = Math.max(1, Math.ceil($totalItems / $pageSize));
    if ($currentPage < maxPage - 1) {
      currentPage.update(n => n + 1);
      loadAssetsData();
    }
  }
  
  function handlePageSizeChange(e: Event) {
    const size = parseInt((e.target as HTMLSelectElement).value);
    pageSize.set(size);
    currentPage.set(0);
    loadAssetsData();
  }

  function getPaginationInfo(current: number, size: number, total: number) {
    const totalPages = Math.max(1, Math.ceil(total / size));
    const pageNum = Math.min(current, totalPages - 1);
    return `${pageNum + 1} de ${totalPages}`;
  }

  function getResultsText(current: number, size: number, total: number) {
    if (total === 0) return '0 itens';
    const start = current * size + 1;
    const end = Math.min(total, (current + 1) * size);
    return `${start}-${end} de ${total}`;
  }

  // Initial load
  onMount(() => {
    loadAssetsData();
  });

  $: shouldShowName = !['Effects', 'Missiles', 'Outfits'].includes($currentCategory);
</script>

<main id="category-view" class="category-view" style="display: block;">
  <!-- Modern Unified Header -->
  <header class="modern-header">
    <div class="header-left">
      <button id="back-btn" class="modern-back-btn" on:click={goBack}>
        <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>{translate('categoryView.back')}</span>
      </button>

      <div class="header-divider"></div>
    </div>

    <div id="appearance-action-bar" class="appearance-action-bar" aria-label="Appearance actions"></div>

    <div class="header-center">
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            id="asset-search"
            placeholder={translate('search.placeholder')}
            class="search-input"
            value={$searchQuery}
            on:input={handleSearch}
          />
          {#if $searchQuery}
            <button id="clear-search" class="clear-search-btn" on:click={clearSearch} style="display: flex;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          {/if}
        </div>
      </div>
    </div>

    <div class="header-right">
      <div class="results-info">
        <span id="results-count" class="results-text">
          {getResultsText($currentPage, $pageSize, $totalItems)}
        </span>
      </div>

      <div class="pagination-nav" role="group">
        <button 
          id="prev-page" 
          class="pagination-btn" 
          type="button" 
          disabled={$currentPage <= 0}
          on:click={prevPage}
        >
          <span>◀</span>
        </button>
        <div class="pagination-info">
          <span id="page-info" class="results-text">
            {getPaginationInfo($currentPage, $pageSize, $totalItems)}
          </span>
        </div>
        <button 
          id="next-page" 
          class="pagination-btn" 
          type="button" 
          disabled={$currentPage >= Math.ceil($totalItems / $pageSize) - 1}
          on:click={nextPage}
        >
          <span>▶</span>
        </button>
      </div>

      <div class="page-size-container">
        <select id="page-size" class="page-size-select" value={$pageSize} on:change={handlePageSizeChange}>
          <option value="100">100</option>
          <option value="500">500</option>
          <option value="1000">1000</option>
          <option value="10000">10000</option>
          <option value="50000">50000</option>
        </select>
      </div>

      {#if $currentCategory === 'Objects'}
        <div id="subcategory-container" class="filter-container" style="display: flex;">
          <!-- We can add subcategory logic here if needed, but typically it's selected in Nav -->
          <!-- The original code shows a select here for Objects -->
           <select id="subcategory-select" class="filter-select" disabled>
              <option value={$currentSubcategory}>{$currentSubcategory}</option>
           </select>
        </div>
      {/if}

    </div>
  </header>

  <div class="view-content">
    <div id="assets-grid" class="modern-assets-grid">
      {#if $isLoading}
        <div class="loading-spinner">
          <div>🔄 Loading assets...</div>
        </div>
      {:else if $assets.length === 0}
         <div class="empty-state">
            <h3>📭 No Assets Found</h3>
            <p>No assets match your current search criteria.</p>
         </div>
      {:else}
        {#each $assets as asset (asset.id)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div 
            class="asset-item" 
            class:is-selected={isAssetSelected($currentCategory, asset.id)}
            data-asset-id={asset.id} 
            data-category={$currentCategory}
            on:click={() => openAssetDetails(asset)}
          >
            <label class="asset-select-control" aria-label="Select appearance #{asset.id}" on:click|stopPropagation>
              <input 
                type="checkbox" 
                class="asset-select-checkbox" 
                data-asset-id={asset.id} 
                data-category={$currentCategory} 
                checked={isAssetSelected($currentCategory, asset.id)} 
              />
              <span class="asset-select-indicator" aria-hidden="true"></span>
            </label>
            <div class="asset-id">#{asset.id}</div>
            <div class="asset-visual-row">
              <div class="asset-image-container" id="sprite-{asset.id}">
                <div class="asset-image-overlay">
                  <div class="asset-flags">
                    {#if asset.flags}
                      <div class="flag-indicator" title="Has flags"></div>
                    {/if}
                  </div>
                </div>
                <div class="sprite-loading">🔄</div>
              </div>
            </div>
            {#if shouldShowName}
              <div class="asset-name">{asset.name || 'Unnamed'}</div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
</main>
