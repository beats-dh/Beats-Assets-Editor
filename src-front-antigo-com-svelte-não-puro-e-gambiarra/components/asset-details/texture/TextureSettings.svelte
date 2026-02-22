<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { translate } from '../../../i18n';
  import type { CompleteSpriteInfo } from '../../../types';

  export let spriteInfo: CompleteSpriteInfo | undefined;

  const dispatch = createEventDispatcher();

  function getFrameCount() {
    if (!spriteInfo) return 1;
    if (spriteInfo.animation && spriteInfo.animation.phases.length > 0) return spriteInfo.animation.phases.length;
    if (spriteInfo.pattern_frames && spriteInfo.pattern_frames > 0) return spriteInfo.pattern_frames;
    return 1;
  }

  function updateFrameCount(count: number) {
    if (!spriteInfo) return;
    if (!spriteInfo.animation) {
      spriteInfo.animation = {
        sprite_id: 0,
        loop_type: 0,
        loop_count: 0,
        default_start_phase: 0,
        synchronized: false,
        random_start_phase: false,
        phases: []
      };
    }

    const currentPhases = spriteInfo.animation.phases || [];
    if (count > currentPhases.length) {
      const added = Array(count - currentPhases.length).fill(null).map(() => ({ duration_min: 100, duration_max: 100 }));
      spriteInfo.animation.phases = [...currentPhases, ...added];
    } else if (count < currentPhases.length) {
      spriteInfo.animation.phases = currentPhases.slice(0, count);
    }

    spriteInfo.pattern_frames = count;
    dispatch('change', { animation: spriteInfo.animation, pattern_frames: count });
  }

  function handleSave() {
    dispatch('save');
  }
</script>

{#if spriteInfo}
  <div class="texture-form-section">
    <h4>{translate('texture.section.spriteSettings')}</h4>
    <div class="texture-form-grid">
      <label>
        <span>{translate('texture.form.patternWidth')}</span>
        <input type="number" id="texture-pattern-width" min="0" bind:value={spriteInfo.pattern_width} on:change />
      </label>
      <label>
        <span>{translate('texture.form.patternHeight')}</span>
        <input type="number" id="texture-pattern-height" min="0" bind:value={spriteInfo.pattern_height} on:change />
      </label>
      <label>
        <span>{translate('texture.form.patternDepth')}</span>
        <input type="number" id="texture-pattern-depth" min="0" bind:value={spriteInfo.pattern_depth} on:change />
      </label>
      <label>
        <span>{translate('texture.form.layers')}</span>
        <input type="number" id="texture-pattern-layers" min="0" bind:value={spriteInfo.layers} on:change />
      </label>
      <label>
        <span>{translate('texture.form.patternFrames')}</span>
        <input type="number" id="texture-pattern-frames" min="0" value={spriteInfo.pattern_frames} on:input={(e) => updateFrameCount(Number(e.currentTarget.value))} />
      </label>
      <label>
        <span>{translate('texture.form.boundingSquare')}</span>
        <input type="number" id="texture-bounding-square" min="0" bind:value={spriteInfo.bounding_square} on:change />
      </label>
      <label class="texture-checkbox">
        <input type="checkbox" id="texture-is-opaque" bind:checked={spriteInfo.is_opaque} on:change />
        <span>{translate('texture.form.isOpaque')}</span>
      </label>
      <label class="texture-checkbox">
        <input type="checkbox" id="texture-is-animation" bind:checked={spriteInfo.is_animation} on:change />
        <span>{translate('texture.form.isAnimation')}</span>
      </label>
    </div>
  </div>

  <div class="texture-form-section">
    <h4>{translate('texture.section.animation')}</h4>
    <div class="texture-form-grid texture-animation-grid">
      <label>
        <span>{translate('texture.form.frameCount')}</span>
        <input type="number" id="texture-animation-frame-count" min="0" value={getFrameCount()} on:input={(e) => updateFrameCount(Number(e.currentTarget.value))} />
      </label>

      {#if spriteInfo.animation}
        <label>
          <span>{translate('texture.form.defaultStartPhase')}</span>
          <input type="number" id="texture-animation-default-phase" min="0" bind:value={spriteInfo.animation.default_start_phase} on:change />
        </label>
        <label>
          <span>{translate('texture.form.loopType')}</span>
          <input type="number" id="texture-animation-loop-type" bind:value={spriteInfo.animation.loop_type} on:change />
        </label>
        <label>
          <span>{translate('texture.form.loopCount')}</span>
          <input type="number" id="texture-animation-loop-count" min="0" bind:value={spriteInfo.animation.loop_count} on:change />
        </label>
        <label class="texture-checkbox">
          <input type="checkbox" id="texture-animation-synchronized" bind:checked={spriteInfo.animation.synchronized} on:change />
          <span>{translate('texture.form.synchronized')}</span>
        </label>
        <label class="texture-checkbox">
          <input type="checkbox" id="texture-animation-random-start" bind:checked={spriteInfo.animation.random_start_phase} on:change />
          <span>{translate('texture.form.randomStart')}</span>
        </label>
      {/if}
    </div>

    {#if spriteInfo.animation && spriteInfo.animation.phases}
      <div id="texture-animation-phases" class="texture-animation-phases">
        {#if spriteInfo.animation.phases.length === 0}
          <p class="texture-empty">{translate('texture.animation.empty')}</p>
        {:else}
          {#each spriteInfo.animation.phases as phase, i}
            <div class="texture-phase-row">
              <label>
                <span class="texture-phase-label">{translate('texture.animation.phaseMin', { index: i + 1 })}</span>
                <input type="number" class="texture-phase-min" min="0" bind:value={phase.duration_min} on:change />
              </label>
              <label>
                <span class="texture-phase-label">{translate('texture.animation.phaseMax')}</span>
                <input type="number" class="texture-phase-max" min="0" bind:value={phase.duration_max} on:change />
              </label>
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  </div>

  <div class="texture-form-actions">
    <button id="texture-save-button" class="btn-primary" on:click={handleSave}>{translate('texture.button.save')}</button>
  </div>
{/if}
