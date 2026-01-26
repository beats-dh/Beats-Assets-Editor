<script lang="ts">
  import type { CompleteAppearanceItem } from '../../types';
  import { getAppearanceTypeName } from '../../utils/assetHelpers';

  export let details: CompleteAppearanceItem;
  export let category: string;

  $: flags = details.flags;
</script>

<div class="detail-section">
  <h4>Basic Information</h4>
  <div class="detail-item">
    <span class="detail-label">ID:</span>
    <span class="detail-value">#{details.id}</span>
  </div>
  {#if details.name}
    <div class="detail-item">
      <span class="detail-label">Name:</span>
      <span class="detail-value" id="detail-name-value">{details.name}</span>
    </div>
  {/if}
  {#if details.description}
    <div class="detail-item">
      <span class="detail-label">Description:</span>
      <span class="detail-value">{details.description}</span>
    </div>
  {/if}
  <div class="detail-item">
    <span class="detail-label">Category:</span>
    <span class="detail-value">{category}</span>
  </div>
  {#if details.appearance_type !== null && details.appearance_type !== undefined}
    <div class="detail-item">
      <span class="detail-label">Appearance Type:</span>
      <span class="detail-value">{getAppearanceTypeName(details.appearance_type)}</span>
    </div>
  {/if}
  {#if flags?.transparency_level !== null && flags?.transparency_level !== undefined}
    <div class="detail-item">
      <span class="detail-label">Transparency Level:</span>
      <span class="detail-value">{flags.transparency_level}</span>
    </div>
  {/if}
</div>
