<script lang="ts">
  import type { CompleteAppearanceItem } from "../../../types";
  import { translate } from "../../../i18n";
  import {
    copyText,
    buildOutfitXml,
    buildItemXml,
  } from "../../../services/clipboardService";
  interface Props {
    details: CompleteAppearanceItem;
    category: string;
  }
  let { details, category }: Props = $props();
  let flags = $derived(details.flags);

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
