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
                                <div class="monster-modal-field">
                                    <label for="attack-name-{i}">Nome</label>
                                    <input id="attack-name-{i}" type="text" bind:value={attack.name} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="attack-interval-{i}">Intervalo (ms)</label>
                                    <input id="attack-interval-{i}" type="number" bind:value={attack.interval} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="attack-chance-{i}">Chance (%)</label>
                                    <input id="attack-chance-{i}" type="number" bind:value={attack.chance} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="attack-min-{i}">Dano Min</label>
                                    <input id="attack-min-{i}" type="number" bind:value={attack.minDamage} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="attack-max-{i}">Dano Max</label>
                                    <input id="attack-max-{i}" type="number" bind:value={attack.maxDamage} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="attack-type-{i}">Tipo</label>
                                    <input id="attack-type-{i}" type="text" bind:value={attack.combatType} />
                                </div>
                                <div class="monster-modal-field checkbox">
                                    <label>
                                        <input type="checkbox" bind:checked={attack.target} />
                                        <span>Precisa Alvo</span>
                                    </label>
                                </div>
                                <div class="monster-modal-field">
                                    <label for="attack-effect-{i}">Efeito</label>
                                    <input id="attack-effect-{i}" type="text" bind:value={attack.effect} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="attack-range-{i}">Alcance</label>
                                    <input id="attack-range-{i}" type="number" bind:value={attack.range} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="attack-radius-{i}">Raio</label>
                                    <input id="attack-radius-{i}" type="number" bind:value={attack.radius} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="attack-length-{i}">Comprimento</label>
                                    <input id="attack-length-{i}" type="number" bind:value={attack.length} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="attack-spread-{i}">Abertura</label>
                                    <input id="attack-spread-{i}" type="number" bind:value={attack.spread} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="attack-shoot-{i}">Efeito Projetil</label>
                                    <input id="attack-shoot-{i}" type="text" bind:value={attack.shootEffect} />
                                </div>
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
                                <div class="monster-modal-field">
                                    <label for="defense-name-{i}">Nome</label>
                                    <input id="defense-name-{i}" type="text" bind:value={defense.name} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="defense-interval-{i}">Intervalo (ms)</label>
                                    <input id="defense-interval-{i}" type="number" bind:value={defense.interval} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="defense-chance-{i}">Chance (%)</label>
                                    <input id="defense-chance-{i}" type="number" bind:value={defense.chance} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="defense-min-{i}">Dano Min</label>
                                    <input id="defense-min-{i}" type="number" bind:value={defense.minDamage} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="defense-max-{i}">Dano Max</label>
                                    <input id="defense-max-{i}" type="number" bind:value={defense.maxDamage} />
                                </div>
                                <div class="monster-modal-field">
                                    <label for="defense-type-{i}">Tipo</label>
                                    <input id="defense-type-{i}" type="text" bind:value={defense.combatType} />
                                </div>
                                <div class="monster-modal-field checkbox">
                                    <label>
                                        <input type="checkbox" bind:checked={defense.target} />
                                        <span>Precisa Alvo</span>
                                    </label>
                                </div>
                                <div class="monster-modal-field">
                                    <label for="defense-effect-{i}">Efeito</label>
                                    <input id="defense-effect-{i}" type="text" bind:value={defense.effect} />
                                </div>
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
