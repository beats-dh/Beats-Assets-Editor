<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { translate } from '../../../i18n';
  import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../../types';

  export let state: any;
  export let spriteInfo: CompleteSpriteInfo | undefined;
  export let isOutfit: boolean;
  export let details: CompleteAppearanceItem;

  const dispatch = createEventDispatcher();

  const clamp = (value: number, min: number, max: number) => {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
  };

  const getFrameCount = () => {
    if (!spriteInfo) return 1;
    if (spriteInfo.animation && spriteInfo.animation.phases.length > 0) return spriteInfo.animation.phases.length;
    if (spriteInfo.pattern_frames && spriteInfo.pattern_frames > 0) return spriteInfo.pattern_frames;
    return 1;
  };

  $: frameGroupOptions = details?.frame_groups ?? [];
  $: directionCount = Math.max(1, spriteInfo?.pattern_width ?? 1);
  $: addonMax = Math.max(0, (spriteInfo?.pattern_height ?? 1) - 1);
  $: mountMax = Math.max(0, (spriteInfo?.pattern_depth ?? 1) - 1);
  $: frameMax = Math.max(0, getFrameCount() - 1);
  $: patternWidthMax = Math.max(0, (spriteInfo?.pattern_width ?? 1) - 1);
  $: patternHeightMax = Math.max(0, (spriteInfo?.pattern_height ?? 1) - 1);
  $: patternDepthMax = Math.max(0, (spriteInfo?.pattern_depth ?? 1) - 1);
  $: layerMax = Math.max(0, (spriteInfo?.layers ?? 1) - 1);

  $: directionLabels = [
    translate('texture.preview.direction.short.north'),
    translate('texture.preview.direction.short.east'),
    translate('texture.preview.direction.short.south'),
    translate('texture.preview.direction.short.west')
  ];

  function handleChange(key: string, value: any) {
    dispatch('change', { [key]: value });
  }

  function handleFrameGroupChange(event: Event) {
    const value = Number((event.currentTarget as HTMLSelectElement).value);
    handleChange('frameGroupIndex', value);
  }

  function handleNumberChange(key: string, value: string, max: number) {
    const parsed = Number(value || '0');
    handleChange(key, clamp(parsed, 0, max));
  }
</script>

<div class="texture-preview-controls">
  <div class="texture-control-row">
    <label>
      <span>{translate('texture.preview.frameGroup')}</span>
      <select id="texture-frame-group-select" value={state.frameGroupIndex} on:change={handleFrameGroupChange}>
        {#each frameGroupOptions as _, index}
          <option value={index} data-frame-index={index}>
            {translate('texture.preview.frameGroupOption', { index: index + 1 })}
          </option>
        {/each}
      </select>
    </label>
  </div>

  {#if isOutfit}
    <div class="texture-control-row" id="outfit-direction-controls">
      {#each Array.from({ length: directionCount }) as _, index}
        <button
          type="button"
          class="texture-direction-btn"
          class:active={state.direction === index}
          data-direction={index}
          on:click={() => handleChange('direction', index)}
        >
          {directionLabels[index] ?? String(index + 1)}
        </button>
      {/each}
    </div>

    <div class="texture-control-row">
      <label>
        <span>{translate('texture.preview.addon')}</span>
        <input
          type="range"
          id="outfit-addon-slider"
          min="0"
          max={addonMax}
          value={state.addon}
          disabled={state.showFullAddons || addonMax === 0}
          on:input={(e) => handleChange('addon', Number(e.currentTarget.value))}
        />
      </label>
      <span id="outfit-addon-label" class="texture-control-label">
        {translate('texture.preview.addonLabel', { value: state.addon })}
      </span>
    </div>

    <div class="texture-control-row">
      <label>
        <span>{translate('texture.preview.frame')}</span>
        <input
          type="range"
          id="outfit-frame-slider"
          min="0"
          max={frameMax}
          value={state.frame}
          disabled={frameMax <= 0}
          on:input={(e) => handleChange('frame', Number(e.currentTarget.value))}
        />
      </label>
      <span id="outfit-frame-label" class="texture-control-label">
        {translate('texture.preview.frameLabel', { value: state.frame + 1 })}
      </span>
    </div>

    <div class="texture-control-row texture-color-row">
      <label>
        <span>{translate('texture.preview.colors.head')}</span>
        <input type="color" id="outfit-color-head" value={state.headColor} on:input={(e) => handleChange('headColor', e.currentTarget.value)} />
      </label>
      <label>
        <span>{translate('texture.preview.colors.body')}</span>
        <input type="color" id="outfit-color-body" value={state.bodyColor} on:input={(e) => handleChange('bodyColor', e.currentTarget.value)} />
      </label>
      <label>
        <span>{translate('texture.preview.colors.legs')}</span>
        <input type="color" id="outfit-color-legs" value={state.legsColor} on:input={(e) => handleChange('legsColor', e.currentTarget.value)} />
      </label>
      <label>
        <span>{translate('texture.preview.colors.feet')}</span>
        <input type="color" id="outfit-color-feet" value={state.feetColor} on:input={(e) => handleChange('feetColor', e.currentTarget.value)} />
      </label>
    </div>

    <div class="texture-control-row">
      <label>
        <span>{translate('texture.preview.background')}</span>
        <input type="color" id="outfit-background-color" value={state.backgroundColor} on:input={(e) => handleChange('backgroundColor', e.currentTarget.value)} />
      </label>
    </div>

    <div class="texture-control-row texture-checkbox-row">
      <label>
        <input type="checkbox" id="outfit-blend-layers" checked={state.blendLayers} on:change={(e) => handleChange('blendLayers', e.currentTarget.checked)} />
        <span>{translate('texture.preview.blendLayers')}</span>
      </label>
      <label>
        <input type="checkbox" id="outfit-full-addons" checked={state.showFullAddons} on:change={(e) => handleChange('showFullAddons', e.currentTarget.checked)} />
        <span>{translate('texture.preview.showFullAddons')}</span>
      </label>
      <label>
        <input type="checkbox" id="outfit-show-bboxes" checked={state.showBoundingBoxes} on:change={(e) => handleChange('showBoundingBoxes', e.currentTarget.checked)} />
        <span>{translate('texture.preview.showBoundingBoxes')}</span>
      </label>
      <label>
        <input type="checkbox" id="outfit-auto-animate" checked={state.autoAnimate} on:change={(e) => handleChange('autoAnimate', e.currentTarget.checked)} />
        <span>{translate('texture.preview.animatePreview')}</span>
      </label>
      <label id="outfit-mount-wrapper" style={mountMax > 0 ? '' : 'display:none'}>
        <input type="checkbox" id="outfit-mount-toggle" checked={state.mount > 0} on:change={(e) => handleChange('mount', e.currentTarget.checked ? 1 : 0)} />
        <span>{translate('texture.preview.mount')}</span>
      </label>
    </div>
  {:else}
    <div class="texture-control-row">
      <label>
        <span>{translate('texture.preview.patternX')}</span>
        <input type="number" id="object-preview-pattern-x" min="0" value={state.patternX} on:change={(e) => handleNumberChange('patternX', e.currentTarget.value, patternWidthMax)} />
      </label>
      <label>
        <span>{translate('texture.preview.patternY')}</span>
        <input type="number" id="object-preview-pattern-y" min="0" value={state.patternY} on:change={(e) => handleNumberChange('patternY', e.currentTarget.value, patternHeightMax)} />
      </label>
    </div>
    <div class="texture-control-row">
      <label>
        <span>{translate('texture.preview.patternZ')}</span>
        <input type="number" id="object-preview-pattern-z" min="0" value={state.patternZ} on:change={(e) => handleNumberChange('patternZ', e.currentTarget.value, patternDepthMax)} />
      </label>
      <label>
        <span>{translate('texture.preview.layer')}</span>
        <input type="number" id="object-preview-layer" min="0" value={state.layer} on:change={(e) => handleNumberChange('layer', e.currentTarget.value, layerMax)} />
      </label>
    </div>
    <div class="texture-control-row">
      <label>
        <span>{translate('texture.preview.frame')}</span>
        <input type="number" id="object-preview-frame" min="0" value={state.frame} on:change={(e) => handleNumberChange('frame', e.currentTarget.value, frameMax)} />
      </label>
      <label class="texture-checkbox">
        <input type="checkbox" id="object-preview-show-bboxes" checked={state.showBoundingBoxes} on:change={(e) => handleChange('showBoundingBoxes', e.currentTarget.checked)} />
        <span>{translate('texture.preview.showBoundingBoxes')}</span>
      </label>
    </div>
  {/if}
</div>
