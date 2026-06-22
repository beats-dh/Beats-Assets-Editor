<script lang="ts">
  import { translate } from "../../../../i18n";
  import type { CompleteSpriteInfo } from "../../../../types";
  interface Props {
    spriteInfo: CompleteSpriteInfo | undefined;
    onChange?: (detail: any) => void;
    onSave?: () => void;
  }
  let { spriteInfo = $bindable(), onChange, onSave }: Props = $props();

  function getFrameCount() {
    if (!spriteInfo) return 1;
    if (spriteInfo.animation && spriteInfo.animation.phases.length > 0)
      return spriteInfo.animation.phases.length;
    return 1;
  }
  function updateFrameCount(count: number) {
    if (!spriteInfo) return;
    if (!spriteInfo.animation) {
      spriteInfo.animation = {
        loop_type: 0,
        loop_count: 0,
        synchronized: false,
        phases: [],
      };
    }
    const currentPhases = spriteInfo.animation.phases || [];
    if (count > currentPhases.length) {
      spriteInfo.animation.phases = [
        ...currentPhases,
        ...Array(count - currentPhases.length)
          .fill(null)
          .map(() => ({ duration_min: 100, duration_max: 100 })),
      ];
    } else if (count < currentPhases.length) {
      spriteInfo.animation.phases = currentPhases.slice(0, count);
    }
    onChange?.({ animation: spriteInfo.animation });
  }

  function applyDurationToAllFrames() {
    if (!spriteInfo?.animation?.phases) return;
    const phases = spriteInfo.animation.phases;
    if (phases.length < 2) return;
    const first = phases[0];
    for (let i = 1; i < phases.length; i++) {
      phases[i].duration_min = first.duration_min;
      phases[i].duration_max = first.duration_max;
    }
    onChange?.({ animation: spriteInfo.animation });
  }
</script>

{#if spriteInfo}
  <div class="texture-form-section">
    <h4>{translate("texture.section.spriteSettings")}</h4>
    <div class="texture-form-grid">
      <label
        ><span>{translate("texture.form.patternWidth")}</span><input
          type="number"
          id="texture-pattern-width"
          min="0"
          bind:value={spriteInfo.pattern_width}
        /></label
      >
      <label
        ><span>{translate("texture.form.patternHeight")}</span><input
          type="number"
          id="texture-pattern-height"
          min="0"
          bind:value={spriteInfo.pattern_height}
        /></label
      >
      <label
        ><span>{translate("texture.form.patternDepth")}</span><input
          type="number"
          id="texture-pattern-depth"
          min="0"
          bind:value={spriteInfo.pattern_depth}
        /></label
      >
      <label
        ><span>{translate("texture.form.layers")}</span><input
          type="number"
          id="texture-pattern-layers"
          min="0"
          bind:value={spriteInfo.layers}
        /></label
      >
      <label
        ><span>{translate("texture.form.boundingSquare")}</span><input
          type="number"
          id="texture-bounding-square"
          min="0"
          bind:value={spriteInfo.bounding_square}
        /></label
      >
      <label class="texture-checkbox"
        ><input
          type="checkbox"
          id="texture-is-opaque"
          bind:checked={spriteInfo.is_opaque}
        /><span>{translate("texture.form.isOpaque")}</span></label
      >
    </div>
  </div>
  <div class="texture-form-section">
    <h4>{translate("texture.section.animation")}</h4>
    <div class="texture-form-grid texture-animation-grid">
      <label
        ><span>{translate("texture.form.frameCount")}</span><input
          type="number"
          id="texture-animation-frame-count"
          min="0"
          value={getFrameCount()}
          oninput={(e) =>
            updateFrameCount(Number((e.target as HTMLInputElement).value))}
        /></label
      >
      {#if spriteInfo.animation}
        <label
          ><span>{translate("texture.form.loopType")}</span><input
            type="number"
            id="texture-animation-loop-type"
            bind:value={spriteInfo.animation.loop_type}
          /></label
        >
        <label
          ><span>{translate("texture.form.loopCount")}</span><input
            type="number"
            id="texture-animation-loop-count"
            min="0"
            bind:value={spriteInfo.animation.loop_count}
          /></label
        >
        <label class="texture-checkbox"
          ><input
            type="checkbox"
            id="texture-animation-synchronized"
            bind:checked={spriteInfo.animation.synchronized}
          /><span>{translate("texture.form.synchronized")}</span></label
        >
      {/if}
    </div>
    {#if spriteInfo.animation?.phases}
      <div id="texture-animation-phases" class="texture-animation-phases">
        {#if spriteInfo.animation.phases.length === 0}<p class="texture-empty">
            {translate("texture.animation.empty")}
          </p>
        {:else}{#each spriteInfo.animation.phases as phase, i}
            <div class="texture-phase-row">
              <label
                ><span class="texture-phase-label"
                  >{translate("texture.animation.phaseMin", {
                    index: i + 1,
                  })}</span
                ><input
                  type="number"
                  class="texture-phase-min"
                  min="0"
                  bind:value={phase.duration_min}
                /></label
              >
              <label
                ><span class="texture-phase-label"
                  >{translate("texture.animation.phaseMax")}</span
                ><input
                  type="number"
                  class="texture-phase-max"
                  min="0"
                  bind:value={phase.duration_max}
                /></label
              >
            </div>
          {/each}{/if}
      </div>
      {#if spriteInfo.animation.phases.length > 1}
        <button
          type="button"
          class="btn-secondary texture-apply-all-frames"
          title={translate("texture.animation.applyAllFrames.tooltip")}
          onclick={applyDurationToAllFrames}
          >{translate("texture.animation.applyAllFrames")}</button
        >
      {/if}
    {/if}
  </div>
  <div class="texture-form-actions">
    <button
      id="texture-save-button"
      class="btn-primary"
      onclick={() => onSave?.()}>{translate("texture.button.save")}</button
    >
  </div>
{/if}
