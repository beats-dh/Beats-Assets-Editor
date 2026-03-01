<script lang="ts">
  import {
    outfitColorHexCache,
    clampColorId,
    findClosestColorId,
    normalizeHex,
    hexToRgb,
  } from "../utils";
  interface Props {
    label: string;
    value: number;
    onChange: (val: number) => void;
  }
  let { label, value, onChange }: Props = $props();
  let colorId = $derived(clampColorId(value));
  let hexValue = $derived(outfitColorHexCache[colorId]);

  function handleNumberInput(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    if (isNaN(val)) return;
    const normalized = clampColorId(val);
    if (normalized !== value) onChange(normalized);
  }
  function handleColorInput(e: Event) {
    const hex = (e.target as HTMLInputElement).value;
    const normalized = normalizeHex(hex);
    let targetIndex = outfitColorHexCache.indexOf(normalized);
    if (targetIndex === -1) {
      const rgb = hexToRgb(normalized);
      targetIndex = findClosestColorId(rgb);
    }
    if (targetIndex !== value) onChange(targetIndex);
  }
</script>

<div class="monster-color-field">
  <label class="monster-color-label" for="color-{label}">{label}</label>
  <div class="monster-color-controls">
    <input
      id="color-{label}"
      type="number"
      class="monster-color-number"
      min="0"
      max={outfitColorHexCache.length - 1}
      value={colorId}
      oninput={handleNumberInput}
    />
    <input
      type="color"
      class="monster-color-input"
      value={hexValue}
      oninput={handleColorInput}
    />
  </div>
</div>
