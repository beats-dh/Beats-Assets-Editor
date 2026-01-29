<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { translate } from '../../../i18n';
  import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../../types';

  export let state: any; // We'll refine type later
  export let spriteInfo: CompleteSpriteInfo | undefined;
  export let isOutfit: boolean;
  export let details: CompleteAppearanceItem;

  const dispatch = createEventDispatcher();

  function handleChange(key: string, value: any) {
    dispatch('change', { [key]: value });
  }

  // Helpers
  $: maxAddons = Math.max(0, (spriteInfo?.pattern_height || 1) - 1);
  $: maxFrames = Math.max(0, ((spriteInfo?.pattern_frames || (spriteInfo?.animation?.phases?.length)) || 1) - 1);
  $: maxMounts = Math.max(0, (spriteInfo?.pattern_depth || 1) - 1);
  
  $: hasMount = maxMounts > 0;
  $: hasFrames = maxFrames > 0;
</script>

<div class="texture-preview-controls">
  <!-- Direction Controls (Outfit) -->
  {#if isOutfit}
    <div class="texture-control-row" id="outfit-direction-controls">
      <button class="texture-direction-btn" class:active={state.direction === 2} on:click={() => handleChange('direction', 2)}>South</button>
      <button class="texture-direction-btn" class:active={state.direction === 0} on:click={() => handleChange('direction', 0)}>North</button>
      <button class="texture-direction-btn" class:active={state.direction === 1} on:click={() => handleChange('direction', 1)}>East</button>
      <button class="texture-direction-btn" class:active={state.direction === 3} on:click={() => handleChange('direction', 3)}>West</button>
    </div>

    <!-- Addon & Mount -->
    <div class="texture-control-row">
      <label>
         <span id="outfit-addon-label">{translate('texture.preview.addonLabel', { value: state.addon })}</span>
         <input 
           type="range" 
           min="0" 
           max={maxAddons} 
           step="1" 
           value={state.addon} 
           disabled={state.showFullAddons || maxAddons === 0}
           on:input={(e) => handleChange('addon', Number(e.currentTarget.value))}
         />
      </label>
      
      {#if hasMount}
        <label class="texture-checkbox">
           <input 
             type="checkbox" 
             checked={state.mount > 0} 
             on:change={(e) => handleChange('mount', e.currentTarget.checked ? 1 : 0)}
           />
           <span>{translate('texture.preview.mount')}</span>
        </label>
      {/if}
    </div>

    <!-- Colors -->
    <div class="texture-control-row texture-color-row">
       <label title="Head">
          <span>Head</span> <!-- Translate? Backup hardcoded hexToRgb but keys logic? -->
          <input type="color" value={state.headColor} on:input={(e) => handleChange('headColor', e.currentTarget.value)} />
       </label>
       <label title="Body">
          <span>Body</span>
          <input type="color" value={state.bodyColor} on:input={(e) => handleChange('bodyColor', e.currentTarget.value)} />
       </label>
       <label title="Legs">
          <span>Legs</span>
          <input type="color" value={state.legsColor} on:input={(e) => handleChange('legsColor', e.currentTarget.value)} />
       </label>
       <label title="Feet">
          <span>Feet</span>
          <input type="color" value={state.feetColor} on:input={(e) => handleChange('feetColor', e.currentTarget.value)} />
       </label>
       <label title="Background">
          <span>BG</span>
          <input type="color" value={state.backgroundColor} on:input={(e) => handleChange('backgroundColor', e.currentTarget.value)} />
       </label>
    </div>

    <!-- Toggles -->
    <div class="texture-control-row texture-checkbox-row">
        <label>
           <input type="checkbox" checked={state.blendLayers} on:change={(e) => handleChange('blendLayers', e.currentTarget.checked)} />
           <span>{translate('texture.preview.blendLayers')}</span>
        </label>
        <label>
           <input type="checkbox" checked={state.showFullAddons} on:change={(e) => handleChange('showFullAddons', e.currentTarget.checked)} />
           <span>{translate('texture.preview.showFullAddons')}</span>
        </label>
    </div>

  {:else}
    <!-- Object Controls -->
    <!-- Frame Group Select is in Parent or standardized? Backup had it inside renderObjectTextureTab -->
    <!-- We can put it in parent (TextureEditor) to switch sprites -->
    
    <div class="texture-control-row">
       <label>
         <span>{translate('texture.preview.patternX')}</span>
         <input type="number" min="0" value={state.patternX} on:input={(e) => handleChange('patternX', Number(e.currentTarget.value))} />
       </label>
       <label>
         <span>{translate('texture.preview.patternY')}</span>
         <input type="number" min="0" value={state.patternY} on:input={(e) => handleChange('patternY', Number(e.currentTarget.value))} />
       </label>
    </div>
    <div class="texture-control-row">
       <label>
         <span>{translate('texture.preview.patternZ')}</span>
         <input type="number" min="0" value={state.patternZ} on:input={(e) => handleChange('patternZ', Number(e.currentTarget.value))} />
       </label>
       <label>
         <span>{translate('texture.preview.layer')}</span>
         <input type="number" min="0" value={state.layer} on:input={(e) => handleChange('layer', Number(e.currentTarget.value))} />
       </label>
    </div>
  {/if}

  <!-- Common animation / frame controls -->
  <div class="texture-control-row">
     <label>
       <span id="outfit-frame-label">{translate('texture.preview.frameLabel', { value: state.frame + 1 })}</span>
       <input 
         type="range" 
         min="0" 
         max={maxFrames} 
         value={state.frame} 
         disabled={!hasFrames}
         on:input={(e) => handleChange('frame', Number(e.currentTarget.value))}
       />
     </label>
     
     <label class="texture-checkbox">
        <input type="checkbox" checked={state.autoAnimate} on:change={(e) => handleChange('autoAnimate', e.currentTarget.checked)} />
        <span>{translate('texture.preview.autoAnimate')}</span>
     </label>

     <label class="texture-checkbox">
        <input type="checkbox" checked={state.showBoundingBoxes} on:change={(e) => handleChange('showBoundingBoxes', e.currentTarget.checked)} />
        <span>{translate('texture.preview.showBoundingBoxes')}</span>
     </label>
  </div>

</div>