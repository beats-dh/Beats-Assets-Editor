<script lang="ts">
  import { confirmState, closeConfirm } from '../stores/confirmStore';
  
  function handleConfirm() {
    // Legacy support
    if ($confirmState && $confirmState.resolve) {
      closeConfirm(true);
    } else {
      // Callback style fallback (if any code still uses it without resolve)
      if ($confirmState?.onConfirm) $confirmState.onConfirm();
      closeConfirm(true); 
    }
  }

  function handleCancel() {
    // Legacy support
    if ($confirmState && $confirmState.resolve) {
      closeConfirm(false);
    } else {
      if ($confirmState?.onCancel) $confirmState.onCancel();
      closeConfirm(false);
    }
  }
</script>

{#if $confirmState}
  <div id="confirm-modal" class="asset-details-modal" role="dialog" aria-modal="true" style="display: flex;">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-backdrop" on:click={handleCancel}></div>
    <div class="modal-content" role="document">
      <div class="modal-header">
        <h2>{$confirmState.title}</h2>
        <button class="close-btn" on:click={handleCancel} aria-label="Close">✕</button>
      </div>
      <div class="modal-body">
        <p>{$confirmState.message}</p>
        <div class="edit-actions">
          <button class="btn-delete" on:click={handleConfirm}>{$confirmState.confirmLabel || 'Confirm'}</button>
          <button class="btn-save" on:click={handleCancel}>{$confirmState.cancelLabel || 'Cancel'}</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Reuse existing styles or ensure they are present */
  .asset-details-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
  }
  
  .modal-content {
    background: var(--surface-card);
    padding: 20px;
    border-radius: 8px;
    z-index: 2001;
    min-width: 300px;
    max-width: 500px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.2rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--text-secondary);
  }

  .edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }

  .btn-delete {
    background: var(--primary-color); /* Usually confirm is primary action */
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .btn-save {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
