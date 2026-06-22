<script lang="ts">
  import {
    color8bitToHex,
    nearest8bitColorId,
    clamp8bitColorId,
    TIBIA_8BIT_COLOR_COUNT,
  } from "../../../utils/tibia8bit";

  interface Props {
    label: string;
    value: number;
    onChange: (val: number) => void;
  }
  let { label, value, onChange }: Props = $props();

  let colorId = $derived(clamp8bitColorId(value ?? 0));
  let hexValue = $derived(color8bitToHex(colorId));

  function handleNumberInput(e: Event) {
    const val = Number.parseInt((e.target as HTMLInputElement).value, 10);
    if (Number.isNaN(val)) return;
    const normalized = clamp8bitColorId(val);
    if (normalized !== value) onChange(normalized);
  }
  function handleColorInput(e: Event) {
    const id = nearest8bitColorId((e.target as HTMLInputElement).value);
    if (id !== value) onChange(id);
  }
</script>

<div class="detail-item">
  <span class="detail-label">{label}</span>
  <div class="number-input" style="display:flex;gap:0.5rem;align-items:center;">
    <input
      type="number"
      min="0"
      max={TIBIA_8BIT_COLOR_COUNT - 1}
      value={colorId}
      oninput={handleNumberInput}
    />
    <input
      type="color"
      value={hexValue}
      oninput={handleColorInput}
      style="width:2.5rem;min-width:2.5rem;height:2rem;padding:0;border:none;background:none;cursor:pointer;"
      aria-label={label}
    />
  </div>
</div>
