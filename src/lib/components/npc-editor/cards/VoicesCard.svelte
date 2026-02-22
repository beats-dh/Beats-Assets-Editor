<script lang="ts">
  import { npcState } from '../../../../stores/npcState.svelte';

  let npc = $derived(npcState.currentNpc);

  function handleInput() {
    if (npc) {
      if (!npc.meta) npc.meta = { missingFields: [], touchedFields: [] };
      if (!npc.meta.touchedFields.includes('voices')) {
        npc.meta.touchedFields.push('voices');
      }
      npc.meta.missingFields = npc.meta.missingFields.filter(f => f !== 'voices');
      
      // Update proxy structure if undefined
      if (!npc.voices) {
        npc.voices = { interval: 0, chance: 0, lines: [] };
      }
    }
  }

  function addVoice() {
    if (npc) {
      handleInput();
      npc.voices!.lines = [...npc.voices!.lines, { text: '', yell: false }];
    }
  }

  function removeVoice(index: number) {
    if (npc && npc.voices) {
      handleInput();
      npc.voices.lines.splice(index, 1);
      npc.voices.lines = [...npc.voices.lines];
    }
  }
</script>

{#if npc}
<div class="monster-card">
  <div class="monster-card-header">💬 Voices</div>
  <div class="monster-card-body">
    <div class="card-content">
      {#if !npc.voices || (npc.voices.lines.length === 0 && npc.voices.interval === 0)}
        <div class="form-group" style="margin-bottom: 10px;">
            <span style="color: var(--text-secondary);">No voices configured.</span>
        </div>
        <button class="btn-primary" onclick={addVoice}>Add Voice Setup</button>
      {:else}
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: start; margin-bottom: 16px;">
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 11px;">Interval (ms)</label>
            <input type="number" bind:value={npc.voices.interval} onchange={handleInput} />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 11px;">Chance (%)</label>
            <input type="number" bind:value={npc.voices.chance} onchange={handleInput} />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="font-size: 11px; visibility: hidden;">Action</label>
            <button class="btn-primary" onclick={addVoice}>+ Add Quote</button>
          </div>
        </div>
        
        <div class="voices-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 250px; overflow-y: auto;">
            {#each npc.voices.lines as voice, i}
              <div class="voice-item" style="display: flex; gap: 12px; align-items: center;">
                <input type="text" style="flex: 1; font-size: 13px; background: transparent; border: none; color: var(--text-primary); outline: none; padding: 0;" placeholder="NPC Quote..." bind:value={voice.text} onchange={handleInput} />
                
                <label style="font-size: 11px; margin: 0; display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text-primary);">
                  <input type="checkbox" style="accent-color: #8b5cf6; width: 16px; height: 16px; cursor: pointer; margin: 0;" bind:checked={voice.yell} onchange={handleInput} /> 
                  Yell
                </label>
                
                <button class="btn-danger-icon" style="padding: 6px 8px; font-size: 12px; margin: 0; display: flex; align-items: center; justify-content: center;" onclick={() => removeVoice(i)} title="Remove Voice">
                  ✕
                </button>
              </div>
            {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}

<style>
  .btn-danger-icon {
      background: rgba(255, 60, 60, 0.1);
      color: #ff4444;
      border: 1px solid rgba(255, 60, 60, 0.2);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
  }
  
  .btn-danger-icon:hover {
      background: #ff4444;
      color: white;
  }
</style>
