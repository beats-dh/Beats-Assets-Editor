<script lang="ts">
  import { onMount, afterUpdate, tick } from 'svelte';
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
  import { 
    isAssetSelected, 
    toggleAssetSelection, 
    setAssetSelection, 
    clearAssetSelection,
    getCurrentSelection,
    removeAssetSelection,
    openAssetDetails
  } from '../stores/selectionStore';
  import { 
    loadSpritesForAssets 
  } from '../utils/spriteLoading';
  import { COMMANDS } from '../commands';
  import { invoke } from '../utils/invoke';
  import { showStatus } from '../utils';
  import { confirm } from '../stores/confirmStore';
  import { translate } from '../i18n';
  import { loadAssetsData } from '../services/assetService';
  import { open, save } from '@tauri-apps/plugin-dialog';
  import AddSoundModal from './AddSoundModal.svelte';

  // Back button
  function goBack() {
    viewMode.set('categories');
  }

  // Selection Logic
  let selectionTimestamp = 0;
  let selectedCount = 0;
  let hasClipboard = false;

  function updateSelectionState() {
    selectionTimestamp = Date.now();
    const sel = getCurrentSelection();
    selectedCount = sel.length;
  }

  onMount(() => {
    loadAssetsData();
    document.addEventListener('asset-selection-changed', updateSelectionState);
    updateSelectionState(); // initial
    return () => {
      document.removeEventListener('asset-selection-changed', updateSelectionState);
    };
  });

  function handleSelectAll() {
    const cat = $currentCategory;
    $assets.forEach(asset => {
      setAssetSelection(cat, asset.id, true, false); 
    });
    updateSelectionState();
  }

  function handleDeselectAll() {
    clearAssetSelection();
  }

  // --- Actions ---

  async function handleImport() {
    try {
      const selection = await open({
        multiple: true,
        filters: [{ name: "Appearance", extensions: ["json", "aec"] }]
      });

      const paths = Array.isArray(selection) ? selection : (selection ? [selection] : []);
      if (paths.length === 0) return;

      // Simple prompt for start ID for now
      // Ideally we would use a custom modal for per-category start IDs like in legacy code
      const startIdInput = prompt(translate('prompt.enterImportStartId'), "");
      if (startIdInput === null) return;
      
      const startId = startIdInput.trim() ? parseInt(startIdInput) : null;
      
      const startIds = {
        objects: startId,
        outfits: startId,
        effects: startId,
        missiles: startId
      };

      const result = await invoke<{imported: number[], skipped: number[]}>(COMMANDS.IMPORT_APPEARANCES_FROM_FILES_ALL, {
        paths,
        startIds
      });

      if (result.imported.length > 0) {
        await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
        await loadAssetsData();
        showStatus(translate('status.appearanceImportBatch', { count: result.imported.length }), 'success');
      } else {
        showStatus(translate('status.appearanceImportFailed'), 'error');
      }
    } catch (err) {
      console.error(err);
      showStatus('Error importing assets', 'error');
    }
  }

  async function handleExport() {
    const sel = getCurrentSelection();
    if (sel.length === 0) {
      // Export current category/id if nothing selected? 
      // Legacy behavior: "getActionTargets" -> if nothing selected, use detailTarget or prompt.
      // Here we require selection for simplicity in this context, or export single.
      const idInput = prompt(translate('prompt.enterExportId'), "");
      if (!idInput) return;
      const id = parseInt(idInput);
      if (isNaN(id)) return;
      await exportAsset($currentCategory, id);
      return;
    }

    // Export primary selection (legacy only exports one at a time via this button usually, unless batch)
    // Legacy `handleExport` takes category and id.
    const target = sel[sel.length - 1]; // Use last selected as primary
    await exportAsset(target.category, target.id);
  }

  async function exportAsset(category: string, id: number) {
    try {
      const defaultName = `appearance-${id}.json`;
      const destination = await save({
        defaultPath: defaultName,
        filters: [{ name: "Appearance", extensions: ["json", "aec"] }]
      });

      if (!destination) return;

      const lower = destination.toLowerCase();
      const useAec = lower.endsWith('.aec');
      const command = useAec ? COMMANDS.EXPORT_APPEARANCE_TO_AEC : COMMANDS.EXPORT_APPEARANCE_TO_JSON;
      
      await invoke(command, { category, id, path: destination });
      showStatus(translate('status.appearanceExported', { id }), "success");
    } catch (err) {
      console.error(err);
      showStatus(translate('status.appearanceExportFailed'), 'error');
    }
  }

  async function handleDuplicate() {
    const sel = getCurrentSelection();
    if (sel.length === 0) return;
    const target = sel[sel.length - 1];

    const desiredIdInput = prompt(translate('prompt.enterDuplicateId'), "");
    let desiredId: number | null = null;
    if (desiredIdInput && desiredIdInput.trim()) {
      desiredId = parseInt(desiredIdInput);
      if (isNaN(desiredId)) {
        showStatus(translate('status.invalidIdAuto'), "error");
        return;
      }
    }

    try {
      await invoke("duplicate_appearance", {
        category: target.category,
        sourceId: target.id,
        targetId: desiredId
      });
      await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
      loadAssetsData();
      showStatus(translate('status.appearanceDuplicated', { id: target.id }), "success");
    } catch (err) {
      console.error(err);
      showStatus(translate('status.appearanceDuplicateFailed'), "error");
    }
  }

  async function handleCopyFlags() {
    const sel = getCurrentSelection();
    if (sel.length === 0) return;
    const target = sel[sel.length - 1];
    try {
      await invoke(COMMANDS.COPY_APPEARANCE_FLAGS, { category: target.category, id: target.id });
      hasClipboard = true;
      showStatus(translate('status.flagsCopied', { id: target.id }), "success");
    } catch (err) {
      console.error(err);
      showStatus(translate('status.flagsCopyFailed'), "error");
    }
  }

  async function handlePasteFlags() {
    if (!hasClipboard) return;
    const sel = getCurrentSelection();
    if (sel.length === 0) return;

    try {
      for (const target of sel) {
        await invoke(COMMANDS.PASTE_APPEARANCE_FLAGS, { category: target.category, id: target.id });
      }
      await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
      loadAssetsData();
      showStatus(translate('status.flagsAppliedMultiple', { count: sel.length }), "success");
    } catch (err) {
      console.error(err);
      showStatus(translate('status.flagsPasteFailed'), "error");
    }
  }

  async function handleCreate() {
    try {
      const idInput = prompt(translate('prompt.enterNewId'), "");
      let newId: number | null = null;
      if (idInput && idInput.trim()) {
        newId = parseInt(idInput);
        if (isNaN(newId)) {
           showStatus(translate('status.invalidIdAuto'), "error");
           return;
        }
      }
      
      const name = prompt(translate('prompt.enterName'), "") || null;
      const description = prompt(translate('prompt.enterDescription'), "") || null;

      const created = await invoke("create_empty_appearance", { 
        category: $currentCategory,
        newId,
        name,
        description
      });
      
      await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
      showStatus(translate('status.assetCreated'), 'success');
      await loadAssetsData();
      openAssetDetails(created);
    } catch (err) {
      console.error(err);
      showStatus('Error creating asset', 'error');
    }
  }

  function handleDelete() {
    if (selectedCount === 0) return;
    
    confirm({
      title: translate('modal.confirmDelete.title'),
      message: translate('modal.confirmDelete.message', { count: selectedCount }),
      confirmLabel: translate('button.delete'),
      cancelLabel: translate('button.cancel'),
      onConfirm: async () => {
        try {
          const sel = getCurrentSelection();
          for (const item of sel) {
            await invoke(COMMANDS.DELETE_APPEARANCE, { category: item.category, id: item.id });
            removeAssetSelection(item.category, item.id);
          }
          await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
          showStatus(translate('status.assetsDeleted', { count: selectedCount }), 'success');
          loadAssetsData();
        } catch (err) {
          console.error(err);
          showStatus('Error deleting assets', 'error');
        }
      }
    });
  }

  function handleAssetClick(e: MouseEvent, asset: any) {
    // Handle Selection with Modifiers
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey) {
        // Range selection
        const lastSel = getCurrentSelection().pop();
        if (lastSel && lastSel.category === $currentCategory) {
           const assetsList = $assets;
           const lastIdx = assetsList.findIndex(a => a.id === lastSel.id);
           const currIdx = assetsList.findIndex(a => a.id === asset.id);
           
           if (lastIdx !== -1 && currIdx !== -1) {
              const start = Math.min(lastIdx, currIdx);
              const end = Math.max(lastIdx, currIdx);
              for (let i = start; i <= end; i++) {
                 setAssetSelection($currentCategory, assetsList[i].id, true, false);
              }
              updateSelectionState();
              return;
           }
        }
      }
      
      // Toggle single (Ctrl/Cmd) or fallback for Shift if no prior selection
      toggleAssetSelection($currentCategory, asset.id);
      return;
    }

    openAssetDetails(asset);
  }

  function handleCheckboxClick(e: Event, asset: any) {
    e.stopPropagation(); // prevent opening details
    toggleAssetSelection($currentCategory, asset.id);
  }
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
  // onMount moved up for organization

  let showNames = true;
  
  // React to category change to set default showNames if needed
  let lastCategory = '';
  $: if ($currentCategory !== lastCategory) {
    lastCategory = $currentCategory;
    showNames = !['Effects', 'Missiles', 'Outfits'].includes($currentCategory);
    loadSubcategories();
  }
  
  // Ensure sprites are loaded/animated when assets change and DOM is updated
  $: if ($assets) {
    (async () => {
      await tick();
      loadSpritesForAssets($assets, $currentCategory);
    })();
  }

  // Dynamic Subcategories
  let subcategories: { value: string, label: string }[] = [];

  async function loadSubcategories() {
    subcategories = [];
    if ($currentCategory === 'Objects') {
      try {
        const subs = await invoke<[string, string][]>(COMMANDS.GET_ITEM_SUBCATEGORIES);
        subcategories = subs.map(([value, label]) => ({ value, label }));
      } catch (err) {
        console.error('Error loading object subcategories', err);
        subcategories = [{ value: 'All', label: translate('subcategory.option.allObjects') }];
      }
    } else if ($currentCategory === 'Sounds') {
      try {
        const types = await invoke<string[]>(COMMANDS.LIST_SOUND_TYPES);
        subcategories = [
          { value: 'All', label: translate('subcategory.option.allSounds') },
          ...types.map(t => {
             const key = {
               'Ambience Streams': 'subcategory.ambienceStreams',
               'Ambience Object Streams': 'subcategory.ambienceObjectStreams',
               'Music Templates': 'subcategory.musicTemplates'
             }[t];
             return { value: t, label: key ? translate(key) : t };
          }),
          // Fallbacks/Extras if not returned by list_sound_types (though list_sound_types usually returns them)
          { value: 'Ambience Streams', label: translate('subcategory.ambienceStreams') },
          { value: 'Ambience Object Streams', label: translate('subcategory.ambienceObjectStreams') },
          { value: 'Music Templates', label: translate('subcategory.musicTemplates') }
        ];
        // Deduplicate
        const seen = new Set();
        subcategories = subcategories.filter(s => {
          if (seen.has(s.value)) return false;
          seen.add(s.value);
          return true;
        });
      } catch (err) {
        console.error('Error loading sound types', err);
        subcategories = [{ value: 'All', label: translate('subcategory.option.allSounds') }];
      }
    }
  }

  function handleSubcategoryChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    currentSubcategory.set(val);
    currentPage.set(0);
    loadAssetsData();
  }

  let showAddSoundModal = false;

  function handleAddSound() {
    showAddSoundModal = true;
  }

  function handleCloseAddSound() {
    showAddSoundModal = false;
  }
</script>

<AddSoundModal 
  isOpen={showAddSoundModal} 
  onClose={handleCloseAddSound} 
/>

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

    <div id="appearance-action-bar" class="appearance-action-bar" aria-label="Appearance actions">
      <div class="appearance-action-group">
         {#if $currentCategory !== 'Sounds'}
           <button class="appearance-action-button" on:click={handleImport}>
             {translate('action.button.import')}
           </button>
           <button class="appearance-action-button" on:click={handleExport} disabled={selectedCount === 0}>
             {translate('action.button.export')}
           </button>
           
           <button class="appearance-action-button" on:click={handleDuplicate} disabled={selectedCount !== 1}>
             {translate('action.button.duplicate')}
           </button>
           <button class="appearance-action-button" on:click={handleCopyFlags} disabled={selectedCount !== 1}>
             {translate('action.button.copyFlags')}
           </button>
           <button class="appearance-action-button" on:click={handlePasteFlags} disabled={selectedCount === 0 || !hasClipboard}>
             {translate('action.button.pasteFlags')}
           </button>
           
           <button class="appearance-action-button destructive" on:click={handleDelete} disabled={selectedCount === 0}>
             {translate('button.delete')}
           </button>

           <button class="appearance-action-button primary" on:click={handleCreate}>
             {translate('button.create')}
           </button>
         {:else}
           <!-- Sounds Actions -->
           <button class="appearance-action-button primary" on:click={handleAddSound}>
             Adicionar Som
           </button>
         {/if}
      </div>
    </div>

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

      {#if subcategories.length > 0}
        <div class="filter-container">
           <select 
             id="subcategory-select" 
             class="filter-select" 
             on:change={handleSubcategoryChange}
             value={$currentSubcategory}
           >
              {#each subcategories as sub}
                <option value={sub.value}>{sub.label}</option>
              {/each}
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
            class:is-selected={selectionTimestamp > 0 && isAssetSelected($currentCategory, asset.id)}
            class:sound-item={$currentCategory === 'Sounds'}
            data-asset-id={asset.id} 
            data-category={$currentCategory}
            on:click={(e) => handleAssetClick(e, asset)}
          >
            <label class="asset-select-control" aria-label="Select appearance #{asset.id}" on:click={(e) => handleCheckboxClick(e, asset)}>
              <input 
                type="checkbox" 
                class="asset-select-checkbox" 
                data-asset-id={asset.id} 
                data-category={$currentCategory} 
                checked={selectionTimestamp > 0 && isAssetSelected($currentCategory, asset.id)} 
                on:change={() => {}}
              />
              <span class="asset-select-indicator" aria-hidden="true"></span>
            </label>

            {#if $currentCategory === 'Sounds'}
              <div class="sound-icon-large">🔊</div>
              <div class="asset-details">
                <span class="asset-id">#{asset.id}</span>
                <span class="asset-name">{asset.name || 'Unnamed'}</span>
              </div>
            {:else}
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
              {#if showNames}
                <div class="asset-name">{asset.name || 'Unnamed'}</div>
              {/if}
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
</main>
