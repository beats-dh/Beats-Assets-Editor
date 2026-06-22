<script lang="ts">
  import { translate } from "../../../../i18n";
  import { outfitColorHexCache } from "../../monster-editor/utils";
  import type {
    CompleteAppearanceItem,
    CompleteSpriteInfo,
  } from "../../../../types";
  interface Props {
    previewState: any;
    spriteInfo: CompleteSpriteInfo | undefined;
    isOutfit: boolean;
    details: CompleteAppearanceItem;
    onChange?: (detail: any) => void;
  }
  let {
    previewState: ps,
    spriteInfo,
    isOutfit,
    details,
    onChange,
  }: Props = $props();

  const clamp = (value: number, min: number, max: number) => {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
  };
  const getFrameCount = () => {
    if (!spriteInfo) return 1;
    if (spriteInfo.animation && spriteInfo.animation.phases.length > 0)
      return spriteInfo.animation.phases.length;
    return 1;
  };

  let frameGroupOptions = $derived(details?.frame_groups ?? []);
  let directionCount = $derived(Math.max(1, spriteInfo?.pattern_width ?? 1));
  let addonMax = $derived(Math.max(0, (spriteInfo?.pattern_height ?? 1) - 1));
  let mountMax = $derived(Math.max(0, (spriteInfo?.pattern_depth ?? 1) - 1));
  let frameMax = $derived(Math.max(0, getFrameCount() - 1));
  let patternWidthMax = $derived(
    Math.max(0, (spriteInfo?.pattern_width ?? 1) - 1),
  );
  let patternHeightMax = $derived(
    Math.max(0, (spriteInfo?.pattern_height ?? 1) - 1),
  );
  let patternDepthMax = $derived(
    Math.max(0, (spriteInfo?.pattern_depth ?? 1) - 1),
  );
  let layerMax = $derived(Math.max(0, (spriteInfo?.layers ?? 1) - 1));
  let directionLabels = $derived([
    translate("texture.preview.direction.short.north"),
    translate("texture.preview.direction.short.east"),
    translate("texture.preview.direction.short.south"),
    translate("texture.preview.direction.short.west"),
  ]);

  function handleChange(key: string, value: any) {
    onChange?.({ [key]: value });
  }
  function handleFrameGroupChange(event: Event) {
    handleChange(
      "frameGroupIndex",
      Number((event.currentTarget as HTMLSelectElement).value),
    );
  }
  function handleNumberChange(key: string, value: string, max: number) {
    handleChange(key, clamp(Number(value || "0"), 0, max));
  }
  function randomOutfitHex(): string {
    const i = Math.floor(Math.random() * outfitColorHexCache.length);
    return outfitColorHexCache[i] ?? "#ffffff";
  }
  function randomizeOutfitColors() {
    onChange?.({
      headColor: randomOutfitHex(),
      bodyColor: randomOutfitHex(),
      legsColor: randomOutfitHex(),
      feetColor: randomOutfitHex(),
    });
  }
</script>

<div class="texture-preview-controls">
  <div class="texture-control-row">
    <label
      ><span>{translate("texture.preview.frameGroup")}</span>
      <select
        id="texture-frame-group-select"
        value={ps.frameGroupIndex}
        onchange={handleFrameGroupChange}
      >
        {#each frameGroupOptions as _, index}<option value={index}
            >{translate("texture.preview.frameGroupOption", {
              index: index + 1,
            })}</option
          >{/each}
      </select>
    </label>
  </div>

  <div class="texture-control-row texture-zoom-control">
    <label
      ><span>🔍 {translate("texture.preview.zoom")}</span><input
        type="range"
        class="texture-zoom-input"
        min="0.5"
        max="4"
        step="0.5"
        value={ps.previewZoom ?? 1}
        oninput={(e) =>
          handleChange(
            "previewZoom",
            Number((e.target as HTMLInputElement).value),
          )}
      /></label
    ><span class="texture-control-label"
      >{translate("texture.preview.zoomLabel", {
        value: ps.previewZoom ?? 1,
      })}</span
    >
  </div>

  {#if isOutfit}
    <div class="texture-control-row" id="outfit-direction-controls">
      {#each Array.from({ length: directionCount }) as _, index}
        <button
          type="button"
          class="texture-direction-btn"
          class:active={ps.direction === index}
          onclick={() => handleChange("direction", index)}
          >{directionLabels[index] ?? String(index + 1)}</button
        >
      {/each}
    </div>
    <div class="texture-control-row">
      <label
        ><span>{translate("texture.preview.addon")}</span><input
          type="range"
          id="outfit-addon-slider"
          min="0"
          max={addonMax}
          value={ps.addon}
          disabled={ps.showFullAddons || addonMax === 0}
          oninput={(e) =>
            handleChange("addon", Number((e.target as HTMLInputElement).value))}
        /></label
      ><span id="outfit-addon-label" class="texture-control-label"
        >{translate("texture.preview.addonLabel", { value: ps.addon })}</span
      >
    </div>
    <div class="texture-control-row">
      <label
        ><span>{translate("texture.preview.frame")}</span><input
          type="range"
          id="outfit-frame-slider"
          min="0"
          max={frameMax}
          value={ps.frame}
          disabled={frameMax <= 0}
          oninput={(e) =>
            handleChange("frame", Number((e.target as HTMLInputElement).value))}
        /></label
      ><span id="outfit-frame-label" class="texture-control-label"
        >{translate("texture.preview.frameLabel", {
          value: ps.frame + 1,
        })}</span
      >
    </div>
    <div class="texture-control-row texture-color-row">
      <label
        ><span>{translate("texture.preview.colors.head")}</span><input
          type="color"
          id="outfit-color-head"
          value={ps.headColor}
          oninput={(e) =>
            handleChange("headColor", (e.target as HTMLInputElement).value)}
        /></label
      >
      <label
        ><span>{translate("texture.preview.colors.body")}</span><input
          type="color"
          id="outfit-color-body"
          value={ps.bodyColor}
          oninput={(e) =>
            handleChange("bodyColor", (e.target as HTMLInputElement).value)}
        /></label
      >
      <label
        ><span>{translate("texture.preview.colors.legs")}</span><input
          type="color"
          id="outfit-color-legs"
          value={ps.legsColor}
          oninput={(e) =>
            handleChange("legsColor", (e.target as HTMLInputElement).value)}
        /></label
      >
      <label
        ><span>{translate("texture.preview.colors.feet")}</span><input
          type="color"
          id="outfit-color-feet"
          value={ps.feetColor}
          oninput={(e) =>
            handleChange("feetColor", (e.target as HTMLInputElement).value)}
        /></label
      >
      <button
        type="button"
        class="texture-direction-btn outfit-randomize-btn"
        title={translate("texture.preview.randomizeColors")}
        onclick={randomizeOutfitColors}>🎲</button
      >
    </div>
    <div class="texture-control-row">
      <label
        ><span>{translate("texture.preview.background")}</span><input
          type="color"
          id="outfit-background-color"
          value={ps.backgroundColor}
          oninput={(e) =>
            handleChange(
              "backgroundColor",
              (e.target as HTMLInputElement).value,
            )}
        /></label
      >
    </div>
    <div class="texture-control-row texture-checkbox-row">
      <label
        ><input
          type="checkbox"
          id="outfit-blend-layers"
          checked={ps.blendLayers}
          onchange={(e) =>
            handleChange("blendLayers", (e.target as HTMLInputElement).checked)}
        /><span>{translate("texture.preview.blendLayers")}</span></label
      >
      <label
        ><input
          type="checkbox"
          id="outfit-full-addons"
          checked={ps.showFullAddons}
          onchange={(e) =>
            handleChange(
              "showFullAddons",
              (e.target as HTMLInputElement).checked,
            )}
        /><span>{translate("texture.preview.showFullAddons")}</span></label
      >
      <label
        ><input
          type="checkbox"
          id="outfit-show-bboxes"
          checked={ps.showBoundingBoxes}
          onchange={(e) =>
            handleChange(
              "showBoundingBoxes",
              (e.target as HTMLInputElement).checked,
            )}
        /><span>{translate("texture.preview.showBoundingBoxes")}</span></label
      >
      <label
        ><input
          type="checkbox"
          id="outfit-auto-animate"
          checked={ps.autoAnimate}
          onchange={(e) =>
            handleChange("autoAnimate", (e.target as HTMLInputElement).checked)}
        /><span>{translate("texture.preview.animatePreview")}</span></label
      >
      {#if mountMax > 0}<label id="outfit-mount-wrapper"
          ><input
            type="checkbox"
            id="outfit-mount-toggle"
            checked={ps.mount > 0}
            onchange={(e) =>
              handleChange(
                "mount",
                (e.target as HTMLInputElement).checked ? 1 : 0,
              )}
          /><span>{translate("texture.preview.mount")}</span></label
        >{/if}
    </div>
  {:else}
    <div class="texture-control-row">
      <label
        ><span>{translate("texture.preview.patternX")}</span><input
          type="number"
          id="object-preview-pattern-x"
          min="0"
          value={ps.patternX}
          onchange={(e) =>
            handleNumberChange(
              "patternX",
              (e.target as HTMLInputElement).value,
              patternWidthMax,
            )}
        /></label
      ><label
        ><span>{translate("texture.preview.patternY")}</span><input
          type="number"
          id="object-preview-pattern-y"
          min="0"
          value={ps.patternY}
          onchange={(e) =>
            handleNumberChange(
              "patternY",
              (e.target as HTMLInputElement).value,
              patternHeightMax,
            )}
        /></label
      >
    </div>
    <div class="texture-control-row">
      <label
        ><span>{translate("texture.preview.patternZ")}</span><input
          type="number"
          id="object-preview-pattern-z"
          min="0"
          value={ps.patternZ}
          onchange={(e) =>
            handleNumberChange(
              "patternZ",
              (e.target as HTMLInputElement).value,
              patternDepthMax,
            )}
        /></label
      ><label
        ><span>{translate("texture.preview.layer")}</span><input
          type="number"
          id="object-preview-layer"
          min="0"
          value={ps.layer}
          onchange={(e) =>
            handleNumberChange(
              "layer",
              (e.target as HTMLInputElement).value,
              layerMax,
            )}
        /></label
      >
    </div>
    <div class="texture-control-row">
      <label
        ><span>{translate("texture.preview.frame")}</span><input
          type="number"
          id="object-preview-frame"
          min="0"
          value={ps.frame}
          onchange={(e) =>
            handleNumberChange(
              "frame",
              (e.target as HTMLInputElement).value,
              frameMax,
            )}
        /></label
      ><label class="texture-checkbox"
        ><input
          type="checkbox"
          id="object-preview-show-bboxes"
          checked={ps.showBoundingBoxes}
          onchange={(e) =>
            handleChange(
              "showBoundingBoxes",
              (e.target as HTMLInputElement).checked,
            )}
        /><span>{translate("texture.preview.showBoundingBoxes")}</span></label
      >
    </div>
  {/if}
</div>
