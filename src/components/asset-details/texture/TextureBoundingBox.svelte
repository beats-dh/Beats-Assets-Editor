<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { translate } from '../../../i18n';
  import type { CompleteSpriteInfo } from '../../../types';

  export let spriteInfo: CompleteSpriteInfo | undefined;

  const dispatch = createEventDispatcher();

  function addBoundingBox() {
      if (!spriteInfo) return;
      if (!spriteInfo.bounding_boxes) spriteInfo.bounding_boxes = [];
      spriteInfo.bounding_boxes = [...spriteInfo.bounding_boxes, { x: 0, y: 0, width: 32, height: 32 }];
      dispatch('change', { bounding_boxes: spriteInfo.bounding_boxes });
  }

  function removeBoundingBox(index: number) {
      if (!spriteInfo || !spriteInfo.bounding_boxes) return;
      spriteInfo.bounding_boxes = spriteInfo.bounding_boxes.filter((_, i) => i !== index);
      dispatch('change', { bounding_boxes: spriteInfo.bounding_boxes });
  }
</script>

{#if spriteInfo}
  <div class="texture-form-section texture-bounding-section">
     <h4>{translate('texture.section.boundingBoxes')}</h4>
     <div class="texture-bounding-boxes">
        <table class="texture-bounding-table">
           <thead>
             <tr>
               <th>{translate('texture.bounding.header.index')}</th>
               <th>{translate('texture.bounding.header.x')}</th>
               <th>{translate('texture.bounding.header.y')}</th>
               <th>{translate('texture.bounding.header.width')}</th>
               <th>{translate('texture.bounding.header.height')}</th>
               <th>{translate('texture.bounding.header.actions')}</th>
             </tr>
           </thead>
           <tbody>
              {#if !spriteInfo.bounding_boxes || spriteInfo.bounding_boxes.length === 0}
                 <tr class="texture-empty-row">
                    <td colspan="6">{translate('texture.bounding.empty')}</td>
                 </tr>
              {:else}
                 {#each spriteInfo.bounding_boxes as box, i}
                    <tr>
                       <td>{i + 1}</td>
                       <td><input type="number" bind:value={box.x} on:change /></td>
                       <td><input type="number" bind:value={box.y} on:change /></td>
                       <td><input type="number" bind:value={box.width} on:change /></td>
                       <td><input type="number" bind:value={box.height} on:change /></td>
                       <td>
                          <button class="texture-remove-box" on:click={() => removeBoundingBox(i)}>✕</button>
                       </td>
                    </tr>
                 {/each}
              {/if}
           </tbody>
        </table>
        <button class="btn-secondary" on:click={addBoundingBox}>{translate('texture.bounding.button.add')}</button>
     </div>
  </div>
{/if}
