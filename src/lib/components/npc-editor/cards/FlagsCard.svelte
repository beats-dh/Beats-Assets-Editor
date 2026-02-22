<script lang="ts">
  import { npcState } from '../../../../stores/npcState.svelte';

  function handleFlagChange(field: 'floorchange', val: boolean) {
    const npc = npcState.currentNpc;
    if (!npc) return;
    if (!npc.flags) {
      npc.flags = { floorchange: false };
    }
    
    npc.flags[field] = val;

    if (!npc.meta) npc.meta = { missingFields: [], touchedFields: [] };
    if (!npc.meta.touchedFields.includes('flags')) {
      npc.meta.touchedFields.push('flags');
    }
    npc.meta.missingFields = npc.meta.missingFields.filter(f => f !== 'flags');
  }
  
  let floorchange = $derived(npcState.currentNpc?.flags?.floorchange ?? false);
</script>

<div class="monster-card">
  <div class="monster-card-header">🏁 Flags</div>
  <div class="monster-card-body">
    <div class="card-content">
      <div class="flags-grid" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));">
          <label class="flag-checkbox">
            <input 
               type="checkbox" 
               checked={floorchange} 
               onchange={(e) => handleFlagChange('floorchange', e.currentTarget.checked)}
            />
            Floor Change
          </label>
      </div>
    </div>
  </div>
</div>
