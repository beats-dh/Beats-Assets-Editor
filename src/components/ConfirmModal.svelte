<script lang="ts">
  import { confirmState, closeConfirm } from '../stores/confirmStore';
  
  function handleConfirm() {
    if ($confirmState) {
      $confirmState.onConfirm();
    }
    closeConfirm();
  }

  function handleCancel() {
    if ($confirmState?.onCancel) {
      $confirmState.onCancel();
    }
    closeConfirm();
  }
</script>

{#if $confirmState}
  <div id="confirm-modal" class="asset-details-modal" role="dialog" aria-modal="true" style="display: flex;">
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
