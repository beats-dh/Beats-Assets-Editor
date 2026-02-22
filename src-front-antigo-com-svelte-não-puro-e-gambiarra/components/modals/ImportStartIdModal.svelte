<script lang="ts">
  import { translate } from '../../i18n';
  import { isImportModalOpen, importContext, closeImportModal, type ImportStartIds } from '../../stores/importExportStore';

  let startIds: ImportStartIds = {
    objects: null,
    outfits: null,
    effects: null,
    missiles: null
  };

  // Initialize start IDs based on context when modal opens
  $: if ($isImportModalOpen && $importContext) {
    const { latest, present } = $importContext;
    startIds = {
      objects: present.objects ? (latest.objects > 0 ? latest.objects + 1 : 1) : null,
      outfits: present.outfits ? (latest.outfits > 0 ? latest.outfits + 1 : 1) : null,
      effects: present.effects ? (latest.effects > 0 ? latest.effects + 1 : 1) : null,
      missiles: present.missiles ? (latest.missiles > 0 ? latest.missiles + 1 : 1) : null
    };
  }

  function handleConfirm() {
    closeImportModal(startIds);
  }

  function handleCancel() {
    closeImportModal(null);
  }
</script>

{#if $isImportModalOpen && $importContext}
  <div class="modal-backdrop" on:click={handleCancel} role="button" tabindex="-1">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{translate('importStartIds.title')}</h3>
        <button class="close-btn" on:click={handleCancel}>&times;</button>
      </div>
      
      <div class="modal-body">
        <p class="modal-description">{translate('importStartIds.description')}</p>
        
        <div class="start-id-table">
          <div class="table-header">
            <span>{translate('importStartIds.header.category')}</span>
            <span>{translate('importStartIds.header.latest')}</span>
            <span>{translate('importStartIds.header.start')}</span>
          </div>

          <!-- Objects -->
          <div class="table-row" class:disabled={!$importContext.present.objects}>
            <span>{translate('category.objects')}</span>
            <span class="latest-val">{$importContext.latest.objects}</span>
            <input 
              type="number" 
              min="0" 
              bind:value={startIds.objects} 
              disabled={!$importContext.present.objects}
              placeholder={$importContext.present.objects ? translate('importStartIds.placeholder') : translate('importStartIds.notInImport')}
            />
          </div>

          <!-- Outfits -->
          <div class="table-row" class:disabled={!$importContext.present.outfits}>
            <span>{translate('category.outfits')}</span>
            <span class="latest-val">{$importContext.latest.outfits}</span>
            <input 
              type="number" 
              min="0" 
              bind:value={startIds.outfits} 
              disabled={!$importContext.present.outfits}
              placeholder={$importContext.present.outfits ? translate('importStartIds.placeholder') : translate('importStartIds.notInImport')}
            />
          </div>

          <!-- Effects -->
          <div class="table-row" class:disabled={!$importContext.present.effects}>
            <span>{translate('category.effects')}</span>
            <span class="latest-val">{$importContext.latest.effects}</span>
            <input 
              type="number" 
              min="0" 
              bind:value={startIds.effects} 
              disabled={!$importContext.present.effects}
              placeholder={$importContext.present.effects ? translate('importStartIds.placeholder') : translate('importStartIds.notInImport')}
            />
          </div>

          <!-- Missiles -->
          <div class="table-row" class:disabled={!$importContext.present.missiles}>
            <span>{translate('category.missiles')}</span>
            <span class="latest-val">{$importContext.latest.missiles}</span>
            <input 
              type="number" 
              min="0" 
              bind:value={startIds.missiles} 
              disabled={!$importContext.present.missiles}
              placeholder={$importContext.present.missiles ? translate('importStartIds.placeholder') : translate('importStartIds.notInImport')}
            />
          </div>

          <!-- Sounds (Placeholder) -->
          <div class="table-row disabled">
            <span>{translate('category.sounds')}</span>
            <span class="latest-val">{$importContext.latest.sounds}</span>
            <span class="placeholder-text">{translate('importStartIds.notApplicable')}</span>
          </div>

        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" on:click={handleCancel}>{translate('action.button.cancel')}</button>
        <button class="btn-primary" on:click={handleConfirm}>{translate('action.button.import')}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--surface-card);
    border-radius: 8px;
    width: 600px;
    max-width: 90%;
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-description {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  .start-id-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .table-header, .table-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    align-items: center;
    padding: 0.5rem;
  }

  .table-header {
    font-weight: bold;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .table-row {
    background: var(--surface-hover);
    border-radius: 4px;
  }

  .table-row.disabled {
    opacity: 0.5;
  }

  .latest-val {
    font-family: monospace;
  }

  input {
    background: var(--surface-input);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    width: 100%;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }

  .btn-primary {
    background: var(--primary-color);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
  }

  .btn-secondary {
    background: var(--surface-hover);
    color: var(--text-primary);
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    cursor: pointer;
  }
</style>