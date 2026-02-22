<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  import ColorField from './ColorField.svelte';
  import MonsterOutfitPreview from './MonsterOutfitPreview.svelte';
  let m = $derived(monsterState.currentMonster);

  function handleColorChange(field: 'head' | 'body' | 'legs' | 'feet', val: number) {
    if (!m) return;
    if (!m.outfit) {
      m.outfit = { lookType: 0, lookHead: 0, lookBody: 0, lookLegs: 0, lookFeet: 0, lookAddons: 0, lookMount: 0 };
    }
    if (field === 'head') m.outfit.lookHead = val;
    else if (field === 'body') m.outfit.lookBody = val;
    else if (field === 'legs') m.outfit.lookLegs = val;
    else if (field === 'feet') m.outfit.lookFeet = val;
  }
</script>

{#if m && m.outfit}
<div class="monster-card">
  <div class="monster-card-header">👔 Outfit</div>
  <div class="monster-card-body">
    <div class="card-content">
      <MonsterOutfitPreview outfit={m.outfit} />
      
      <div class="form-row">
        <div class="form-group"><label>Look Type</label><input type="number" bind:value={m.outfit.lookType} /></div>
        <div class="form-group"><label>Look Type Ex</label><input type="number" value={0} disabled title="Not implemented in Rust struct yet" /></div>
        <div class="form-group"><label>Mount</label><input type="number" bind:value={m.outfit.lookMount} /></div>
      </div>
      <div class="form-row">
        <ColorField label="Head" value={m.outfit.lookHead} onChange={(v) => handleColorChange('head', v)} />
        <ColorField label="Body" value={m.outfit.lookBody} onChange={(v) => handleColorChange('body', v)} />
        <ColorField label="Legs" value={m.outfit.lookLegs} onChange={(v) => handleColorChange('legs', v)} />
        <ColorField label="Feet" value={m.outfit.lookFeet} onChange={(v) => handleColorChange('feet', v)} />
      </div>
      <div class="form-row">
        <div class="form-group"><label>Addons</label><input type="number" bind:value={m.outfit.lookAddons} /></div>
        <div class="form-group"><label>Corpse</label><input type="number" bind:value={m.corpse} /></div>
      </div>
    </div>
  </div>
</div>
{/if}
