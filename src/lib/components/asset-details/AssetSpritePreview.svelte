<script lang="ts">
  import type { CompleteAppearanceItem } from '../../../types';
  interface Props { details: CompleteAppearanceItem; }
  let { details }: Props = $props();
  let rawSpriteBlocks = $derived(Array.isArray(details.sprite_data) ? details.sprite_data.length : 0);
</script>

<div class="detail-section">
  <h4>Sprite Preview</h4>
  {#if rawSpriteBlocks > 0}
    <p class="sprite-preview-meta">Blocos de dados brutos: {rawSpriteBlocks}</p>
  {:else}
    <p class="sprite-preview-meta sprite-preview-meta--empty">Nenhum bloco de dados bruto embutido para este asset.</p>
  {/if}
  <div class="detail-sprites" id="detail-sprites-{details.id}">
    {#key details.id}
      <div class="sprite-loading">🔄 Loading sprites...</div>
    {/key}
  </div>
</div>
