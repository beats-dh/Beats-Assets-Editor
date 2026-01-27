<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  import type { MonsterVoices } from '../../../monsterTypes';
  
  export let isOpen = false;
  
  let voicesData: MonsterVoices | undefined;
  let enabled = false;

  $: if (isOpen && $currentMonster) {
      if ($currentMonster.voices) {
          voicesData = JSON.parse(JSON.stringify($currentMonster.voices));
          enabled = true;
      } else {
          voicesData = { interval: 5000, chance: 10, entries: [] };
          enabled = false;
      }
  }

  function save() {
      if ($currentMonster) {
          if (!enabled) {
              $currentMonster.voices = undefined;
          } else if (voicesData) {
              $currentMonster.voices = voicesData;
          }
      }
      isOpen = false;
  }

  function addVoice() {
      if (voicesData) {
          voicesData.entries = [...voicesData.entries, { text: "", yell: false }];
      }
  }

  function removeVoice(index: number) {
      if (voicesData) {
          voicesData.entries = voicesData.entries.filter((_, i) => i !== index);
      }
  }
</script>

{#if isOpen && voicesData}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="monster-modal-backdrop" on:click|self={() => isOpen = false}>
    <div class="monster-modal">
        <div class="monster-modal-header">
            <h3>Editar Falas</h3>
            <button class="modal-close-button" on:click={() => isOpen = false}>&times;</button>
        </div>
        <div class="monster-modal-body">
             <div class="monster-modal-section">
                <h4>Configuracoes</h4>
                <div class="monster-modal-field checkbox">
                    <input type="checkbox" bind:checked={enabled} />
                    <span>Ativar Falas</span>
                </div>
                
                <div class="modal-grid">
                    <div class="monster-modal-field">
                        <label>Intervalo (ms)</label>
                        <input type="number" bind:value={voicesData.interval} disabled={!enabled} />
                    </div>
                    <div class="monster-modal-field">
                        <label>Chance (%)</label>
                        <input type="number" bind:value={voicesData.chance} disabled={!enabled} />
                    </div>
                </div>
             </div>

             <div class="monster-modal-section">
                <h4>Falas</h4>
                <div class="modal-list">
                    {#if !enabled}
                        <div class="empty-state">Falas desativadas.</div>
                    {:else if voicesData.entries.length === 0}
                        <div class="empty-state">Nenhuma fala cadastrada.</div>
                    {:else}
                        {#each voicesData.entries as voice, i}
                            <div class="modal-list-item">
                                <div class="modal-list-item-header">
                                    Fala {i + 1}
                                    <button class="btn-icon" on:click={() => removeVoice(i)}>&times;</button>
                                </div>
                                <div class="monster-modal-field">
                                    <label>Texto</label>
                                    <textarea rows="2" bind:value={voice.text}></textarea>
                                </div>
                                <div class="monster-modal-field checkbox">
                                    <input type="checkbox" bind:checked={voice.yell} />
                                    <span>Gritar</span>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
                <button class="btn-secondary" on:click={addVoice} disabled={!enabled} style="margin-top: 1rem;">Adicionar fala</button>
             </div>
        </div>
        <div class="monster-modal-footer">
            <button class="btn-secondary" on:click={() => isOpen = false}>Cancelar</button>
            <button class="btn-primary" on:click={save}>Salvar</button>
        </div>
    </div>
</div>
{/if}
