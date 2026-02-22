<script lang="ts">
  import type { CompleteAppearanceItem } from '../../../types';
  interface Props { details: CompleteAppearanceItem; }
  let { details }: Props = $props();
</script>

<div class="detail-section">
  <h4>Sprite Preview</h4>
  <div class="detail-sprites" id="detail-sprites-{details.id}">
    {#key details.id}
      <div class="sprite-loading">🔄 Loading sprites...</div>
    {/key}
  </div>
</div>
