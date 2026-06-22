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
    <span class="detail-value">#{details.id}</span>
    <button
      type="button"
      class="copy-btn"
      title={translate("asset.info.copyId")}
      onclick={() => copyText(String(details.id))}>📋</button
    >
    <button
      type="button"
      class="copy-btn"
      title={translate("asset.info.editId")}
      onclick={editId}>✏️</button
    >
    {#if xmlText}
      <button
        type="button"
        class="copy-btn"
        title={translate("asset.info.copyXml")}
        onclick={() => copyText(xmlText)}>{"</>"}</button
      >
    {/if}
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
  .copy-btn {
    margin-left: 6px;
    padding: 1px 6px;
    font-size: 12px;
    line-height: 1.4;
    cursor: pointer;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: var(--surface-bg, transparent);
    color: var(--text-secondary);
  }
  .copy-btn:hover {
    color: var(--text-primary);
    border-color: var(--text-muted);
  }
</style>
