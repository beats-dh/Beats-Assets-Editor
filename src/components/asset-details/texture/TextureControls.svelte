<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CompleteSpriteInfo } from '../../../types';
  import { translate } from '../../../i18n';

  export let state: any;
  export let spriteInfo: CompleteSpriteInfo | undefined;
  export let isOutfit: boolean;

  const dispatch = createEventDispatcher();

  function update(key: string, value: any) {
    dispatch('change', { [key]: value });
  }

  // Helper to safely get limits
  $: maxDirection = Math.max(0, (spriteInfo?.pattern_width ?? 1) - 1);
  $: maxAddon = Math.max(0, (spriteInfo?.pattern_height ?? 1) - 1);
  $: maxMount = Math.max(0, (spriteInfo?.pattern_depth ?? 1) - 1);
  $: maxFrame = Math.max(0, (spriteInfo?.animation?.phases?.length ?? (spriteInfo?.pattern_frames ?? 1)) - 1);
  
  // For objects
  $: maxPatternX = Math.max(0, (spriteInfo?.pattern_width ?? 1) - 1);
  $: maxPatternY = Math.max(0, (spriteInfo?.pattern_height ?? 1) - 1);
  $: maxPatternZ = Math.max(0, (spriteInfo?.pattern_depth ?? 1) - 1);
  $: maxLayer = Math.max(0, (spriteInfo?.layers ?? spriteInfo?.pattern_layers ?? 1) - 1);
</script>

<div class="texture-preview-controls">
  <!-- Common: Frame Group Selection could go here if multiple groups exist -->
  
  {#if isOutfit}
    <!-- Outfit Controls -->
    <div class="texture-control-row">
      <label class="texture-control-label">Direction:</label>
      <div id="outfit-direction-controls" class="direction-controls">
        <button 
          class="texture-direction-btn" 
          class:active={state.direction === 2} 
          on:click={() => update('direction', 2)}
          disabled={maxDirection < 2}
        >S</button>
        <button 
          class="texture-direction-btn" 
          class:active={state.direction === 1} 
          on:click={() => update('direction', 1)}
          disabled={maxDirection < 1}
        >E</button>
        <button 
          class="texture-direction-btn" 
          class:active={state.direction === 3} 
          on:click={() => update('direction', 3)}
          disabled={maxDirection < 3}
        >W</button>
        <button 
          class="texture-direction-btn" 
          class:active={state.direction === 0} 
          on:click={() => update('direction', 0)}
          disabled={maxDirection < 0}
        >N</button>
      </div>
    </div>

    <div class="texture-control-row">
      <label>
        <span>Addon</span>
        <input 
          type="range" 
          min="0" 
          max={maxAddon} 
          value={state.addon} 
          on:input={(e) => update('addon', parseInt(e.currentTarget.value))} 
        />
      </label>
      <span class="texture-control-label">Value: {state.addon}</span>
    </div>

    <div class="texture-control-row">
      <label>
        <span>Frame</span>
        <input 
          type="range" 
          min="0" 
          max={maxFrame} 
          value={state.frame} 
          on:input={(e) => update('frame', parseInt(e.currentTarget.value))}
        />
      </label>
      <span class="texture-control-label">Value: {state.frame + 1}</span>
    </div>

    <div class="texture-control-row texture-color-row">
      <label>
        <span>Head</span>
        <input type="color" value={state.headColor} on:input={(e) => update('headColor', e.currentTarget.value)} />
      </label>
      <label>
        <span>Body</span>
        <input type="color" value={state.bodyColor} on:input={(e) => update('bodyColor', e.currentTarget.value)} />
      </label>
      <label>
        <span>Legs</span>
        <input type="color" value={state.legsColor} on:input={(e) => update('legsColor', e.currentTarget.value)} />
      </label>
      <label>
        <span>Feet</span>
        <input type="color" value={state.feetColor} on:input={(e) => update('feetColor', e.currentTarget.value)} />
      </label>
    </div>

    <div class="texture-control-row texture-checkbox-row">
      <label>
        <input type="checkbox" checked={state.blendLayers} on:change={(e) => update('blendLayers', e.currentTarget.checked)} /> 
        <span>Blend Layers</span>
      </label>
      <label>
        <input type="checkbox" checked={state.showFullAddons} on:change={(e) => update('showFullAddons', e.currentTarget.checked)} /> 
        <span>Full Addons</span>
      </label>
      <label>
        <input type="checkbox" checked={state.mount > 0} on:change={(e) => update('mount', e.currentTarget.checked ? 1 : 0)} disabled={maxMount === 0} /> 
        <span>Mount</span>
      </label>
    </div>

  {:else}
    <!-- Object Controls -->
    <div class="texture-control-row">
      <label>
        <span>Pattern X</span>
        <input type="number" min="0" max={maxPatternX} value={state.patternX} on:input={(e) => update('patternX', parseInt(e.currentTarget.value))} />
      </label>
      <label>
        <span>Pattern Y</span>
        <input type="number" min="0" max={maxPatternY} value={state.patternY} on:input={(e) => update('patternY', parseInt(e.currentTarget.value))} />
      </label>
    </div>
    <div class="texture-control-row">
      <label>
        <span>Pattern Z</span>
        <input type="number" min="0" max={maxPatternZ} value={state.patternZ} on:input={(e) => update('patternZ', parseInt(e.currentTarget.value))} />
      </label>
      <label>
        <span>Layer</span>
        <input type="number" min="0" max={maxLayer} value={state.layer} on:input={(e) => update('layer', parseInt(e.currentTarget.value))} />
      </label>
    </div>
    <div class="texture-control-row">
      <label>
        <span>Frame</span>
        <input type="number" min="0" max={maxFrame} value={state.frame} on:input={(e) => update('frame', parseInt(e.currentTarget.value))} />
      </label>
    </div>
  {/if}

  <!-- Common Controls -->
  <div class="texture-control-row">
    <label>
      <span>Background</span>
      <input type="color" value={state.backgroundColor} on:input={(e) => update('backgroundColor', e.currentTarget.value)} />
    </label>
  </div>
  
  <div class="texture-control-row texture-checkbox-row">
    <label>
      <input type="checkbox" checked={state.showBoundingBoxes} on:change={(e) => update('showBoundingBoxes', e.currentTarget.checked)} /> 
      <span>Show B-Boxes</span>
    </label>
    <label>
      <input type="checkbox" checked={state.autoAnimate} on:change={(e) => update('autoAnimate', e.currentTarget.checked)} /> 
      <span>Animate</span>
    </label>
  </div>
</div>

<style>
  .direction-controls {
    display: flex;
    gap: 0.5rem;
  }
</style>