<script lang="ts">
  import type { CompleteAppearanceItem } from "../../../types";
  import { translate } from "../../../i18n";
  interface Props {
    details: CompleteAppearanceItem;
    category: string;
  }
  let { details, category }: Props = $props();
  let flags = $derived(details.flags);
</script>

<div class="detail-section">
  <h4>{translate("asset.info.title")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.info.id")}</span><span
      class="detail-value">#{details.id}</span
    >
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
