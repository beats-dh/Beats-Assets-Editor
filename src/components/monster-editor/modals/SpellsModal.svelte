<script lang="ts">
  import { currentMonster } from '../../../stores/monsterStore';
  import type { AttackEntry, DefenseEntry, LuaProperty } from '../../../monsterTypes';
  
  export let isOpen = false;
  
  let attacks: AttackEntry[] = [];
  let defenses: DefenseEntry[] = [];

  $: if (isOpen && $currentMonster) {
      attacks = JSON.parse(JSON.stringify($currentMonster.attacks));
      defenses = JSON.parse(JSON.stringify($currentMonster.defenses.entries));
  }

  function save() {
      if ($currentMonster) {
          $currentMonster.attacks = attacks;
          $currentMonster.defenses.entries = defenses;
      }
      isOpen = false;
  }

  function addAttack() {
      attacks = [...attacks, { name: "", interval: 2000, chance: 100 } as AttackEntry];
  }
  
  function addDefense() {
      defenses = [...defenses, { name: "", interval: 2000, chance: 100 } as DefenseEntry];
  }

  function removeAttack(index: number) {
      attacks = attacks.filter((_, i) => i !== index);
  }
  
  function removeDefense(index: number) {
      defenses = defenses.filter((_, i) => i !== index);
  }

  // Helpers for nested properties
  function addProperty(list: LuaProperty[] | undefined): LuaProperty[] {
      return [...(list || []), { key: "", value: "" }];
  }
  
  function removeProperty(list: LuaProperty[] | undefined, index: number): LuaProperty[] {
      if (!list) return [];
      return list.filter((_, i) => i !== index);
  }
</script>

{#if isOpen}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="monster-modal-backdrop" on:click|self={() => isOpen = false}>
    <div class="monster-modal" style="width: min(1100px, 95%);">
        <div class="monster-modal-header">
            <h3>Editar Ataques & Defesas</h3>
            <button class="modal-close-button" on:click={() => isOpen = false}>&times;</button>
        </div>
        <div class="monster-modal-body">
             <div class="monster-modal-section">
                <h4>Ataques</h4>
                <div class="modal-list">
                    {#each attacks as attack, i}
                        <div class="modal-list-item">
                            <div class="modal-list-item-header">
                                Ataque {i + 1}
                                <button class="btn-icon" on:click={() => removeAttack(i)}>&times;</button>
                            </div>
                            <div class="modal-grid">
                                <div class="monster-modal-field"><label>Nome</label><input type="text" bind:value={attack.name} /></div>
                                <div class="monster-modal-field"><label>Intervalo (ms)</label><input type="number" bind:value={attack.interval} /></div>
                                <div class="monster-modal-field"><label>Chance (%)</label><input type="number" bind:value={attack.chance} /></div>
                                <div class="monster-modal-field"><label>Dano Min</label><input type="number" bind:value={attack.minDamage} /></div>
                                <div class="monster-modal-field"><label>Dano Max</label><input type="number" bind:value={attack.maxDamage} /></div>
                                <div class="monster-modal-field"><label>Tipo</label><input type="text" bind:value={attack.combatType} /></div>
                                <div class="monster-modal-field checkbox"><input type="checkbox" bind:checked={attack.target} /><span>Precisa Alvo</span></div>
                                <div class="monster-modal-field"><label>Efeito</label><input type="text" bind:value={attack.effect} /></div>
                                <div class="monster-modal-field"><label>Alcance</label><input type="number" bind:value={attack.range} /></div>
                                <div class="monster-modal-field"><label>Raio</label><input type="number" bind:value={attack.radius} /></div>
                                <div class="monster-modal-field"><label>Comprimento</label><input type="number" bind:value={attack.length} /></div>
                                <div class="monster-modal-field"><label>Abertura</label><input type="number" bind:value={attack.spread} /></div>
                                <div class="monster-modal-field"><label>Efeito Projetil</label><input type="text" bind:value={attack.shootEffect} /></div>
                            </div>
                            
                            <!-- Properties -->
                            <div class="attack-subsection">
                                <div class="attack-subsection-title">Condicao</div>
                                <div class="attack-property-list">
                                    {#each (attack.condition || []) as prop, j}
                                        <div class="attack-property-row">
                                            <input type="text" bind:value={prop.key} placeholder="Chave" />
                                            <input type="text" bind:value={prop.value} placeholder="Valor" />
                                            <button class="btn-icon" on:click={() => attack.condition = removeProperty(attack.condition, j)}>&times;</button>
                                        </div>
                                    {/each}
                                    <button class="btn-secondary btn-compact" on:click={() => attack.condition = addProperty(attack.condition)}>Adicionar propriedade</button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
                <button class="btn-secondary" on:click={addAttack} style="margin-top: 1rem;">Adicionar Ataque</button>
             </div>

             <div class="monster-modal-section">
                <h4>Defesas</h4>
                <div class="modal-list">
                    {#each defenses as defense, i}
                        <div class="modal-list-item">
                            <div class="modal-list-item-header">
                                Defesa {i + 1}
                                <button class="btn-icon" on:click={() => removeDefense(i)}>&times;</button>
                            </div>
                            <div class="modal-grid">
                                <div class="monster-modal-field"><label>Nome</label><input type="text" bind:value={defense.name} /></div>
                                <div class="monster-modal-field"><label>Intervalo (ms)</label><input type="number" bind:value={defense.interval} /></div>
                                <div class="monster-modal-field"><label>Chance (%)</label><input type="number" bind:value={defense.chance} /></div>
                                <div class="monster-modal-field"><label>Dano Min</label><input type="number" bind:value={defense.minDamage} /></div>
                                <div class="monster-modal-field"><label>Dano Max</label><input type="number" bind:value={defense.maxDamage} /></div>
                                <div class="monster-modal-field"><label>Tipo</label><input type="text" bind:value={defense.combatType} /></div>
                                <div class="monster-modal-field checkbox"><input type="checkbox" bind:checked={defense.target} /><span>Precisa Alvo</span></div>
                                <div class="monster-modal-field"><label>Efeito</label><input type="text" bind:value={defense.effect} /></div>
                            </div>
                             <!-- Properties -->
                            <div class="attack-subsection">
                                <div class="attack-subsection-title">Condicao</div>
                                <div class="attack-property-list">
                                    {#each (defense.condition || []) as prop, j}
                                        <div class="attack-property-row">
                                            <input type="text" bind:value={prop.key} placeholder="Chave" />
                                            <input type="text" bind:value={prop.value} placeholder="Valor" />
                                            <button class="btn-icon" on:click={() => defense.condition = removeProperty(defense.condition, j)}>&times;</button>
                                        </div>
                                    {/each}
                                    <button class="btn-secondary btn-compact" on:click={() => defense.condition = addProperty(defense.condition)}>Adicionar propriedade</button>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
                <button class="btn-secondary" on:click={addDefense} style="margin-top: 1rem;">Adicionar Defesa</button>
             </div>
        </div>
        <div class="monster-modal-footer">
            <button class="btn-secondary" on:click={() => isOpen = false}>Cancelar</button>
            <button class="btn-primary" on:click={save}>Salvar</button>
        </div>
    </div>
</div>
{/if}
