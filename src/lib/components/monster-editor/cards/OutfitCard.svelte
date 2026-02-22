<script lang="ts">
  import { monsterState } from '../../../../stores/monsterState.svelte';
  import ColorField from './ColorField.svelte';
  let m = $derived(monsterState.currentMonster);

  function handleColorChange(field: 'head' | 'body' | 'legs' | 'feet', val: number) {
    if (!m) return;
    m.look[field] = val;
  }
</script>

{#if m}
<div class="monster-card">
  <div class="monster-card-header">👔 Outfit</div>
  <div class="monster-card-body">
    <div class="card-content">
      <div class="form-row">
        <div class="form-group"><label>Look Type</label><input type="number" bind:value={m.look.type} /></div>
        <div class="form-group"><label>Look Type Ex</label><input type="number" bind:value={m.look.typeEx} /></div>
        <div class="form-group"><label>Mount</label><input type="number" bind:value={m.look.mount} /></div>
      </div>
      <div class="form-row">
        <ColorField label="Head" value={m.look.head} onChange={(v) => handleColorChange('head', v)} />
        <ColorField label="Body" value={m.look.body} onChange={(v) => handleColorChange('body', v)} />
        <ColorField label="Legs" value={m.look.legs} onChange={(v) => handleColorChange('legs', v)} />
        <ColorField label="Feet" value={m.look.feet} onChange={(v) => handleColorChange('feet', v)} />
      </div>
      <div class="form-row">
        <div class="form-group"><label>Addons</label><input type="number" bind:value={m.look.addons} /></div>
        <div class="form-group"><label>Corpse</label><input type="number" bind:value={m.look.corpse} /></div>
      </div>
    </div>
  </div>
</div>
{/if}
