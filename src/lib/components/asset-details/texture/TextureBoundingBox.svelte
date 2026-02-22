<script lang="ts">
  import { translate } from '../../../../i18n';
  import type { CompleteSpriteInfo } from '../../../../types';
  interface Props { spriteInfo: CompleteSpriteInfo | undefined; onChange?: (detail: any) => void; }
  let { spriteInfo = $bindable(), onChange }: Props = $props();

  function addBoundingBox() {
    if (!spriteInfo) return;
    if (!spriteInfo.bounding_boxes) spriteInfo.bounding_boxes = [];
    spriteInfo.bounding_boxes = [...spriteInfo.bounding_boxes, { x: 0, y: 0, width: 32, height: 32 }];
    onChange?.({ bounding_boxes: spriteInfo.bounding_boxes });
  }
  function removeBoundingBox(index: number) {
    if (!spriteInfo?.bounding_boxes) return;
    spriteInfo.bounding_boxes = spriteInfo.bounding_boxes.filter((_, i) => i !== index);
    onChange?.({ bounding_boxes: spriteInfo.bounding_boxes });
  }
</script>

{#if spriteInfo}
<div class="texture-form-section texture-bounding-section">
  <h4>{translate('texture.section.boundingBoxes')}</h4>
  <div class="texture-bounding-boxes">
    <table class="texture-bounding-table">
      <thead><tr><th>{translate('texture.bounding.header.index')}</th><th>{translate('texture.bounding.header.x')}</th><th>{translate('texture.bounding.header.y')}</th><th>{translate('texture.bounding.header.width')}</th><th>{translate('texture.bounding.header.height')}</th><th>{translate('texture.bounding.header.actions')}</th></tr></thead>
      <tbody id="texture-bounding-box-body">
        {#if !spriteInfo.bounding_boxes || spriteInfo.bounding_boxes.length === 0}
          <tr class="texture-empty-row"><td colspan="6">{translate('texture.bounding.empty')}</td></tr>
        {:else}
          {#each spriteInfo.bounding_boxes as box, i}
            <tr>
              <td>{i + 1}</td>
              <td><input type="number" class="texture-box-x" min="0" bind:value={box.x} /></td>
              <td><input type="number" class="texture-box-y" min="0" bind:value={box.y} /></td>
              <td><input type="number" class="texture-box-width" min="0" bind:value={box.width} /></td>
              <td><input type="number" class="texture-box-height" min="0" bind:value={box.height} /></td>
              <td><button type="button" class="texture-remove-box" onclick={() => removeBoundingBox(i)}>&times;</button></td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
    <button id="texture-add-bounding-box" class="btn-secondary" onclick={addBoundingBox}>{translate('texture.bounding.button.add')}</button>
  </div>
</div>
{/if}
