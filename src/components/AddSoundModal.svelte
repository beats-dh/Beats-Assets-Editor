<script lang="ts">
  export let isOpen = false;
  export let onClose: () => void;
</script>

{#if isOpen}
  <div id="add-sound-modal" class="asset-details-modal" role="dialog" aria-modal="true" style="display: flex;">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-backdrop" on:click={onClose}></div>
    <div class="modal-content" role="document">
      <div class="modal-header">
        <h2>Add Sound</h2>
        <button class="close-btn" on:click={onClose}>✕</button>
      </div>
      <div class="modal-body">
        <p>Sound addition migration in progress...</p>
      </div>
    </div>
  </div>
{/if}
