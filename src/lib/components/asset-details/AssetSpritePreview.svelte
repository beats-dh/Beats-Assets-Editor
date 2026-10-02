<script lang="ts">
  import type { CompleteAppearanceItem } from "../../../types";
  import { translate } from "../../../i18n";
  interface Props {
    details: CompleteAppearanceItem;
  }
  let { details }: Props = $props();
</script>

<div class="detail-section">
  <h4>{translate("asset.preview.title")}</h4>
  <div class="detail-sprites" id="detail-sprites-{details.id}">
    {#key details.id}
      <div class="sprite-loading">{translate("asset.preview.loading")}</div>
    {/key}
  </div>
</div>
