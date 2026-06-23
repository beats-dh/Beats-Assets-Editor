<script lang="ts">
  import type { CompleteAppearanceItem } from "../../../types";
  import { translate } from "../../../i18n";
  import {
    copyText,
    buildOutfitXml,
    buildItemXml,
  } from "../../../services/clipboardService";
  import { invoke } from "../../../utils/invoke";
  import { COMMANDS } from "../../../commands";
  import { showStatus } from "../../../utils";
  import { openPromptModal } from "../../../stores/promptState.svelte";
  import { detailsModal } from "../../../stores/selectionState.svelte";
  import { loadAssetsData } from "../../../services/assetService";
  interface Props {
    details: CompleteAppearanceItem;
    category: string;
  }
  let { details, category }: Props = $props();
  let flags = $derived(details.flags);

  async function editId() {
    const input = await openPromptModal({
      title: translate("asset.info.editIdPrompt"),
      defaultValue: String(details.id),
    });
    if (!input) return;
    const newId = Number.parseInt(input, 10);
    if (Number.isNaN(newId) || newId === details.id) return;
    if (category === "Objects" && newId <= 100) {
      showStatus(translate("status.idTooLow"), "error");
      return;
    }
    try {
      await invoke(COMMANDS.CHANGE_APPEARANCE_ID, {
        category,
        oldId: details.id,
        newId,
      });
      await invoke(COMMANDS.SAVE_APPEARANCES_FILE);
      if (detailsModal.selectedAsset?.id === details.id) {
        detailsModal.selectedAsset = { ...detailsModal.selectedAsset, id: newId };
      }
      await loadAssetsData();
      showStatus(translate("status.idChanged", { id: String(newId) }), "success");
    } catch (err) {
      showStatus(
        translate("status.idChangeFailed", { err: String(err) }),
        "error",
      );
    }
  }

  let xmlText = $derived(
    category === "Outfits"
      ? buildOutfitXml(details.id)
      : category === "Objects"
        ? buildItemXml(details.id)
        : null,
  );
</script>

<div class="detail-section">
  <h4>{translate("asset.info.title")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.info.id")}</span>
    <span class="id-value-group">
      <span class="detail-value">#{details.id}</span>
      <span class="id-actions">
        <button
          type="button"
          class="icon-action"
          title={translate("asset.info.copyId")}
          aria-label={translate("asset.info.copyId")}
          onclick={() => copyText(String(details.id))}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            ><rect x="9" y="9" width="11" height="11" rx="2" /><path
              d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            /></svg
          >
        </button>
        <button
          type="button"
          class="icon-action"
          title={translate("asset.info.editId")}
          aria-label={translate("asset.info.editId")}
          onclick={editId}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            ><path d="M12 20h9" /><path
              d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
            /></svg
          >
        </button>
        {#if xmlText}
          <button
            type="button"
            class="icon-action"
            title={translate("asset.info.copyXml")}
            aria-label={translate("asset.info.copyXml")}
            onclick={() => copyText(xmlText)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              ><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></svg
            >
          </button>
        {/if}
      </span>
    </span>
  </div>
  {#if details.name}<div class="detail-item">
      <span class="detail-label">{translate("asset.info.name")}</span><span
        class="detail-value"
        id="detail-name-value">{details.name}</span
      >
    </div>{/if}
  {#if details.description}<div class="detail-item">
      <span class="detail-label">{translate("asset.info.desc")}</span><span
        class="detail-value">{details.description}</span
      >
    </div>{/if}
  <div class="detail-item">
    <span class="detail-label">{translate("asset.info.category")}</span><span
      class="detail-value">{category}</span
    >
  </div>
  {#if flags?.minimum_level !== undefined && flags.minimum_level > 0}
    <div class="detail-item">
      <span class="detail-label">{translate("asset.info.minLevel")}</span><span
        class="detail-value">{flags.minimum_level}</span
      >
    </div>
  {/if}
</div>

<style>
  .id-value-group {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .id-actions {
    display: flex;
    gap: var(--space-xs);
    flex-shrink: 0;
  }
  .icon-action {
    width: 28px;
    height: 28px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 1px solid var(--border-soft-20);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-muted);
    transition: all var(--transition-fast);
  }
  .icon-action svg {
    width: 14px;
    height: 14px;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .icon-action:hover {
    color: var(--text-primary);
    border-color: var(--border-hover);
    background: var(--tertiary-bg);
  }
  .icon-action:active {
    transform: scale(0.94);
  }
</style>
