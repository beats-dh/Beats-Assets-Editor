<script lang="ts">
  import type { CompleteAppearanceItem } from '../../../types';
  interface Props { details: CompleteAppearanceItem; category: string; }
  let { details, category }: Props = $props();
  let flags = $derived(details.flags);
</script>

<div class="detail-section">
  <h4>Basic Information</h4>
  <div class="detail-item"><span class="detail-label">ID:</span><span class="detail-value">#{details.id}</span></div>
  {#if details.name}<div class="detail-item"><span class="detail-label">Name:</span><span class="detail-value" id="detail-name-value">{details.name}</span></div>{/if}
  {#if details.description}<div class="detail-item"><span class="detail-label">Description:</span><span class="detail-value">{details.description}</span></div>{/if}
  <div class="detail-item"><span class="detail-label">Category:</span><span class="detail-value">{category}</span></div>
  {#if flags?.minimum_level !== undefined && flags.minimum_level > 0}
    <div class="detail-item"><span class="detail-label">Minimum Level:</span><span class="detail-value">{flags.minimum_level}</span></div>
  {/if}
</div>
