<script lang="ts">
  import { translate } from "../../i18n";
  import {
    spriteImportSizeState,
    closeSpriteImportSizeModal,
    STANDARD_TILE_SIZES,
    type TileSize,
  } from "../../stores/spriteImportSizeState.svelte";

  // For each standard tile size, whether the image divides evenly into it and
  // how many tiles that yields. Sizes that don't tile the image cleanly are
  // disabled (slicing them would silently drop edge pixels).
  const options = $derived(
    STANDARD_TILE_SIZES.map((size) => {
      const { imageWidth: w, imageHeight: h } = spriteImportSizeState;
      const fits = w > 0 && h > 0 && w % size.width === 0 && h % size.height === 0;
      const count = fits ? (w / size.width) * (h / size.height) : 0;
      return { size, fits, count };
    }),
  );

  function choose(size: TileSize) {
    closeSpriteImportSizeModal(size);
  }

  function handleCancel() {
    closeSpriteImportSizeModal(null);
  }
</script>

{#if spriteImportSizeState.isOpen}
  <div
    class="modal-backdrop"
    onclick={handleCancel}
    onkeydown={(e) => {
      if (e.key === "Escape") handleCancel();
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
        <h3>{translate("spriteImportSize.title")}</h3>
        <button class="close-btn" onclick={handleCancel}>&times;</button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          {translate("spriteImportSize.description", {
            width: String(spriteImportSizeState.imageWidth),
            height: String(spriteImportSizeState.imageHeight),
          })}
        </p>

        <div class="size-grid">
          {#each options as opt (opt.size.width + "x" + opt.size.height)}
            <button
              type="button"
              class="size-btn"
              disabled={!opt.fits}
              onclick={() => choose(opt.size)}
            >
              <span class="size-label">{opt.size.width}×{opt.size.height}</span>
              <span class="size-count">
                {opt.fits
                  ? translate("spriteImportSize.tilesCount", {
                      count: String(opt.count),
                    })
                  : translate("spriteImportSize.notDivisible")}
              </span>
            </button>
          {/each}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" onclick={handleCancel}
          >{translate("action.button.cancel")}</button
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
    z-index: 2000;
  }
  .modal-content {
    background: var(--surface-card);
    border-radius: 8px;
    width: 420px;
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
    margin-bottom: 1.25rem;
  }
  .size-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .size-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.9rem 0.5rem;
    background: var(--surface-hover);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    cursor: pointer;
  }
  .size-btn:hover:not(:disabled) {
    border-color: var(--primary-accent);
  }
  .size-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .size-label {
    font-size: 1.05rem;
    font-weight: 600;
    font-family: monospace;
  }
  .size-count {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
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
