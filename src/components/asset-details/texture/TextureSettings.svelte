<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { translate } from '../../../i18n';
  import type { CompleteAppearanceItem, CompleteSpriteInfo } from '../../../types';

  export let details: CompleteAppearanceItem;
  export let state: any; // Used if we need to know current frame for highlighting?
  export let spriteInfo: CompleteSpriteInfo | undefined;

  const dispatch = createEventDispatcher();

  // Local state for form inputs to avoid direct mutation of props before save?
  // Or we bind directly to spriteInfo properties?
  // Svelte allows binding to object properties.
  // We need to ensure spriteInfo is not undefined.
  
  // Helpers
  function getFrameCount() {
      if (!spriteInfo) return 1;
      if (spriteInfo.animation && spriteInfo.animation.phases.length > 0) return spriteInfo.animation.phases.length;
      if (spriteInfo.pattern_frames && spriteInfo.pattern_frames > 0) return spriteInfo.pattern_frames;
      return 1;
  }

  // Bounding Boxes
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

  // Animation Phases
  function updateFrameCount(count: number) {
     if (!spriteInfo) return;
     // Update animations phases array
     if (!spriteInfo.animation) {
         spriteInfo.animation = { 
             sprite_id: 0, // dummy
             loop_type: 0, loop_count: 0, default_start_phase: 0, synchronized: false, random_start_phase: false, 
             phases: [] 
         };
     }
     
     const currentPhases = spriteInfo.animation.phases || [];
     if (count > currentPhases.length) {
         // Add
         const added = Array(count - currentPhases.length).fill(null).map(() => ({ duration_min: 100, duration_max: 100 }));
         spriteInfo.animation.phases = [...currentPhases, ...added];
     } else if (count < currentPhases.length) {
         // Remove
         spriteInfo.animation.phases = currentPhases.slice(0, count);
     }
     
     // Also update pattern_frames if needed?
     // Backup logic: setNumberInput('texture-pattern-frames', ... or getFrameCount)
     // Usually pattern_frames should match animation count if it's an animation.
     spriteInfo.pattern_frames = count;
     
     dispatch('change', { animation: spriteInfo.animation, pattern_frames: count });
  }

  function handleSave() {
     dispatch('save');
  }
</script>

{#if spriteInfo}
    <!-- Sprite Settings -->
    <div class="texture-form-section">
      <h4>{translate('texture.section.spriteSettings')}</h4>
      <div class="texture-form-grid">
        <label>
          <span>{translate('texture.form.patternWidth')}</span>
          <input type="number" min="0" bind:value={spriteInfo.pattern_width} on:change />
        </label>
        <label>
          <span>{translate('texture.form.patternHeight')}</span>
          <input type="number" min="0" bind:value={spriteInfo.pattern_height} on:change />
        </label>
        <label>
          <span>{translate('texture.form.patternDepth')}</span>
          <input type="number" min="0" bind:value={spriteInfo.pattern_depth} on:change />
        </label>
        <label>
          <span>{translate('texture.form.layers')}</span>
          <input type="number" min="0" bind:value={spriteInfo.layers} on:change />
        </label>
        <label>
          <span>{translate('texture.form.patternFrames')}</span>
          <!-- If animation exists, this is derived/sync with frame count -->
          <input type="number" min="0" value={spriteInfo.pattern_frames} on:input={(e) => updateFrameCount(Number(e.currentTarget.value))} />
        </label>
        <label>
          <span>{translate('texture.form.boundingSquare')}</span>
          <input type="number" min="0" bind:value={spriteInfo.bounding_square} on:change />
        </label>
        <label class="texture-checkbox">
          <input type="checkbox" bind:checked={spriteInfo.is_opaque} on:change />
          <span>{translate('texture.form.isOpaque')}</span>
        </label>
        <label class="texture-checkbox">
          <input type="checkbox" bind:checked={spriteInfo.is_animation} on:change />
          <span>{translate('texture.form.isAnimation')}</span>
        </label>
      </div>
    </div>

    <!-- Animation Settings -->
    <div class="texture-form-section">
      <h4>{translate('texture.section.animation')}</h4>
      <div class="texture-form-grid">
        <label>
          <span>{translate('texture.form.frameCount')}</span>
          <input type="number" min="0" value={getFrameCount()} on:input={(e) => updateFrameCount(Number(e.currentTarget.value))} />
        </label>
        
        {#if spriteInfo.animation}
            <label>
              <span>{translate('texture.form.defaultStartPhase')}</span>
              <input type="number" min="0" bind:value={spriteInfo.animation.default_start_phase} on:change />
            </label>
            <label>
              <span>{translate('texture.form.loopType')}</span>
              <input type="number" bind:value={spriteInfo.animation.loop_type} on:change />
            </label>
            <label>
              <span>{translate('texture.form.loopCount')}</span>
              <input type="number" min="0" bind:value={spriteInfo.animation.loop_count} on:change />
            </label>
            <label class="texture-checkbox">
              <input type="checkbox" bind:checked={spriteInfo.animation.synchronized} on:change />
              <span>{translate('texture.form.synchronized')}</span>
            </label>
            <label class="texture-checkbox">
              <input type="checkbox" bind:checked={spriteInfo.animation.random_start_phase} on:change />
              <span>{translate('texture.form.randomStart')}</span>
            </label>
        {/if}
      </div>

      <!-- Animation Phases -->
      {#if spriteInfo.animation && spriteInfo.animation.phases}
          <div class="texture-animation-phases">
            {#if spriteInfo.animation.phases.length === 0}
               <p class="texture-empty">{translate('texture.animation.empty')}</p>
            {:else}
               {#each spriteInfo.animation.phases as phase, i}
                  <div class="texture-phase-row">
                     <label>
                        <span class="texture-phase-label">{translate('texture.animation.phaseMin', { index: i + 1 })}</span>
                        <input type="number" min="0" bind:value={phase.duration_min} on:change />
                     </label>
                     <label>
                        <span class="texture-phase-label">{translate('texture.animation.phaseMax')}</span>
                        <input type="number" min="0" bind:value={phase.duration_max} on:change />
                     </label>
                  </div>
               {/each}
            {/if}
          </div>
      {/if}
    </div>

    <!-- Actions -->
    <div class="texture-form-actions">
       <button class="btn-primary" on:click={handleSave}>{translate('texture.button.save')}</button>
    </div>
{/if}

<style>
  /* Local overrides if needed, mostly using texture.css classes */
</style>
