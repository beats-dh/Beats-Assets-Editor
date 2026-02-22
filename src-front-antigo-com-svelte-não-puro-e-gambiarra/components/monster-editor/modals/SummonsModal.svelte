<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  import type { MonsterSummon } from '../../../monsterTypes';
  
  export let isOpen = false;
  
  let summonData: MonsterSummon | undefined;
  let enabled = false;

  $: if (isOpen && $currentMonster) {
      if ($currentMonster.summon) {
          summonData = JSON.parse(JSON.stringify($currentMonster.summon));
          enabled = true;
      } else {
          summonData = { maxSummons: 0, summons: [] };
          enabled = false;
      }
  }

  function save() {
      if ($currentMonster) {
          if (!enabled) {
              $currentMonster.summon = undefined;
          } else if (summonData) {
              $currentMonster.summon = summonData;
          }
      }
      isOpen = false;
  }

  function addSummon() {
      if (summonData) {
          summonData.summons = [...summonData.summons, { name: "", chance: 10, interval: 2000, count: 1 }];
      }
  }

  function removeSummon(index: number) {
      if (summonData) {
          summonData.summons = summonData.summons.filter((_, i) => i !== index);
      }
  }
</script>

{#if isOpen && summonData}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="monster-modal-backdrop" on:click|self={() => isOpen = false}>
    <div class="monster-modal">
        <div class="monster-modal-header">
            <h3>Editar Summons</h3>
            <button class="modal-close-button" on:click={() => isOpen = false}>&times;</button>
        </div>
        <div class="monster-modal-body">
             <div class="monster-modal-section">
                <h4>Configuracoes</h4>
                <div class="monster-modal-field checkbox">
                    <input type="checkbox" bind:checked={enabled} />
                    <span>Ativar Summons</span>
                </div>
                
                <div class="monster-modal-field">
                    <label>Max Summons</label>
                    <input type="number" bind:value={summonData.maxSummons} disabled={!enabled} />
                </div>
             </div>

             <div class="monster-modal-section">
                <h4>Criaturas</h4>
                <div class="modal-list">
                    {#if !enabled}
                        <div class="empty-state">Summons desativados.</div>
                    {:else if summonData.summons.length === 0}
                        <div class="empty-state">Nenhum summon configurado.</div>
                    {:else}
                        {#each summonData.summons as summon, i}
                            <div class="modal-list-item">
                                <div class="modal-list-item-header">
                                    Summon {i + 1}
                                    <button class="btn-icon" on:click={() => removeSummon(i)}>&times;</button>
                                </div>
                                <div class="modal-grid">
                                    <div class="monster-modal-field">
                                        <label>Name</label>
                                        <input type="text" bind:value={summon.name} />
                                    </div>
                                    <div class="monster-modal-field">
                                        <label>Chance (%)</label>
                                        <input type="number" bind:value={summon.chance} />
                                    </div>
                                    <div class="monster-modal-field">
                                        <label>Interval (ms)</label>
                                        <input type="number" bind:value={summon.interval} />
                                    </div>
                                    <div class="monster-modal-field">
                                        <label>Count</label>
                                        <input type="number" bind:value={summon.count} />
                                    </div>
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
                <button class="btn-secondary" on:click={addSummon} disabled={!enabled} style="margin-top: 1rem;">Adicionar Summon</button>
             </div>
        </div>
        <div class="monster-modal-footer">
            <button class="btn-secondary" on:click={() => isOpen = false}>Cancelar</button>
            <button class="btn-primary" on:click={save}>Salvar</button>
        </div>
    </div>
</div>
{/if}
