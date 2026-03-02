<script lang="ts">
  import { translate } from "../../i18n";
  import {
    importExportState,
    closeImportModal,
    type ImportStartIds,
  } from "../../stores/importExportState.svelte";

  let startIds = $state<ImportStartIds>({
    objects: null,
    outfits: null,
    effects: null,
    missiles: null,
  });

  // Initialize start IDs when modal opens
  $effect(() => {
    if (importExportState.isModalOpen && importExportState.context) {
      const { latest, present } = importExportState.context;
      startIds = {
        objects: present.objects
          ? latest.objects > 0
            ? latest.objects + 1
            : 1
          : null,
        outfits: present.outfits
          ? latest.outfits > 0
            ? latest.outfits + 1
            : 1
          : null,
        effects: present.effects
          ? latest.effects > 0
            ? latest.effects + 1
            : 1
          : null,
        missiles: present.missiles
          ? latest.missiles > 0
            ? latest.missiles + 1
            : 1
          : null,
      };
    }
  });

  function handleConfirm() {
    closeImportModal(startIds);
  }

  function handleCancel() {
    closeImportModal(null);
  }
</script>

{#if importExportState.isModalOpen && importExportState.context}
  <div
    class="modal-backdrop"
    onclick={handleCancel}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape")
        handleCancel();
    }}
    role="button"
    tabindex="0"
  >
    <div
      class="modal-content"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <div class="modal-header">
        <h3>{translate("importStartIds.title")}</h3>
        <button class="close-btn" onclick={handleCancel}>&times;</button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          {translate("importStartIds.description")}
        </p>

        <div class="start-id-table">
          <div class="table-header">
            <span>{translate("importStartIds.header.category")}</span>
            <span>{translate("importStartIds.header.latest")}</span>
            <span>{translate("importStartIds.header.start")}</span>
          </div>

          <div
            class="table-row"
            class:disabled={!importExportState.context.present.objects}
          >
            <span>{translate("category.objects")}</span>
            <span class="latest-val"
              >{importExportState.context.latest.objects}</span
            >
            <input
              type="number"
              min="0"
              bind:value={startIds.objects}
              disabled={!importExportState.context.present.objects}
              placeholder={importExportState.context.present.objects
                ? translate("importStartIds.placeholder")
                : translate("importStartIds.notInImport")}
            />
          </div>

          <div
            class="table-row"
            class:disabled={!importExportState.context.present.outfits}
          >
            <span>{translate("category.outfits")}</span>
            <span class="latest-val"
              >{importExportState.context.latest.outfits}</span
            >
            <input
              type="number"
              min="0"
              bind:value={startIds.outfits}
              disabled={!importExportState.context.present.outfits}
              placeholder={importExportState.context.present.outfits
                ? translate("importStartIds.placeholder")
                : translate("importStartIds.notInImport")}
            />
          </div>

          <div
            class="table-row"
            class:disabled={!importExportState.context.present.effects}
          >
            <span>{translate("category.effects")}</span>
            <span class="latest-val"
              >{importExportState.context.latest.effects}</span
            >
            <input
              type="number"
              min="0"
              bind:value={startIds.effects}
              disabled={!importExportState.context.present.effects}
              placeholder={importExportState.context.present.effects
                ? translate("importStartIds.placeholder")
                : translate("importStartIds.notInImport")}
            />
          </div>

          <div
            class="table-row"
            class:disabled={!importExportState.context.present.missiles}
          >
            <span>{translate("category.missiles")}</span>
            <span class="latest-val"
              >{importExportState.context.latest.missiles}</span
            >
            <input
              type="number"
              min="0"
              bind:value={startIds.missiles}
              disabled={!importExportState.context.present.missiles}
              placeholder={importExportState.context.present.missiles
                ? translate("importStartIds.placeholder")
                : translate("importStartIds.notInImport")}
            />
          </div>

          <div class="table-row disabled">
            <span>{translate("category.sounds")}</span>
            <span class="latest-val"
              >{importExportState.context.latest.sounds}</span
            >
            <span class="placeholder-text"
              >{translate("importStartIds.notApplicable")}</span
            >
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" onclick={handleCancel}
          >{translate("action.button.cancel")}</button
        >
        <button class="btn-primary" onclick={handleConfirm}
          >{translate("action.button.import")}</button
        >
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
  .table-header,
  .table-row {
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
