<script lang="ts">
  import { translate } from '../../i18n';
  import '../../styles/modals.css';
  import MonsterOutfitPreview from './monster-editor/cards/MonsterOutfitPreview.svelte';
  import { assetsState } from '../../stores/assetsState.svelte';

  let { isOpen, dataType, onClose, onSubmit } = $props<{
    isOpen: boolean;
    dataType: string;
    onClose: () => void;
    onSubmit: (item: any) => void;
  }>();

  // Basic Fields
  let id = $state<number | ''>('');
  let name = $state('');

  // Creature / Boss Fields
  let looktype = $state<number | ''>('');
  let head = $state<number>(0);
  let body = $state<number>(0);
  let legs = $state<number>(0);
  let feet = $state<number>(0);
  let addons = $state<number>(0);
  let mount = $state<number>(0);

  // Creature exclusives
  let difficulty = $state<number | ''>('');
  let occurrence = $state<number | ''>('');
  let isNpc = $state(false);
  let isHostile = $state(false);

  // Boss exclusives
  let isArchfoe = $state(false);

  // Title exclusives
  let titleDescription = $state('');
  let grade = $state<number | ''>('');

  $effect(() => {
    if (isOpen) {
      // Reset fields on open
      id = '';
      name = '';
      looktype = 136;
      head = 0; body = 0; legs = 0; feet = 0;
      addons = 0; mount = 0;
      difficulty = ''; occurrence = '';
      isNpc = false; isHostile = false;
      isArchfoe = false;
      titleDescription = ''; grade = '';
    }
  });

  function close() {
    onClose();
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (id === '' || name.trim() === '') {
      alert('ID e Name são obrigatórios.');
      return;
    }

    const payload: any = { id: Number(id), name: name.trim() };

    if (dataType === 'creatures' || dataType === 'bosses') {
      payload.outfit = {
        looktype: Number(looktype || 0),
        colors: { head, body, legs, feet },
        addons: Number(addons || 0),
        mount: Number(mount || 0)
      };
    }

    if (dataType === 'creatures') {
      payload.difficulty = difficulty !== '' ? Number(difficulty) : 0;
      payload.occurrence = occurrence !== '' ? Number(occurrence) : 0;
      payload.is_npc = isNpc;
      payload.is_hostile = isHostile;
    }

    if (dataType === 'bosses') {
      payload.is_archfoe = isArchfoe;
    }

    if (dataType === 'titles') {
      payload.description = titleDescription.trim();
      payload.grade = grade !== '' ? Number(grade) : 0;
    }

    onSubmit(payload);
  }

  function getTitle(type: string): string {
    switch (type) {
      case 'creatures': return 'Nova Criatura';
      case 'bosses': return 'Novo Boss';
      case 'quests': return 'Nova Quest Tracker';
      case 'titles': return 'Novo Título';
      default: return 'Novo Item';
    }
  }
</script>

{#if isOpen}
  <div class="asset-details-modal" role="dialog" aria-modal="true" style="display: flex;">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={close}></div>
    <div class="modal-content" style="max-width: 750px; max-height: 90vh; display: flex; flex-direction: column;">
      
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
           <span style="font-size: 1.5rem;">➕</span>
          <h2 style="margin: 0; color: var(--text-primary); font-size: 1.25rem;">
            {getTitle(dataType)}
          </h2>
        </div>
        <button class="close-btn" onclick={close} title="Fechar (Esc)">&times;</button>
      </div>

      <div class="modal-body" style="padding: 1.5rem; overflow-y: auto; flex-grow: 1; display: flex; gap: 1.5rem; align-items: flex-start;">
        
        {#if (dataType === 'creatures' || dataType === 'bosses') && typeof looktype === 'number'}
          <!-- Left Sidebar: Visuals -->
          <div class="visual-sidebar" style="width: 170px; flex-shrink: 0; display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 0;">
            <div class="preview-hero" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 0.5rem; min-height: 140px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
              <MonsterOutfitPreview 
                outfit={{ lookType: Number(looktype) || 0, lookHead: head, lookBody: body, lookLegs: legs, lookFeet: feet, lookAddons: addons, lookMount: mount }} 
                showInfo={false} 
              />
            </div>
            
            <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem;">
              <div id="lblColors" style="font-size: 0.75rem; color:var(--text-secondary); font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase;">Paleta (HSL)</div>
              <div class="form-group row" aria-labelledby="lblColors" style="gap: 0.5rem; margin-bottom: 0.5rem;">
                 <div class="field" style="flex: 1;"><label for="cHead" style="font-size: 0.65rem;">Head</label><input type="number" id="cHead" bind:value={head} min="0" max="132" class="modern-input" style="padding: 0.25rem 0.4rem; font-size: 0.8rem;" /></div>
                 <div class="field" style="flex: 1;"><label for="cBody" style="font-size: 0.65rem;">Body</label><input type="number" id="cBody" bind:value={body} min="0" max="132" class="modern-input" style="padding: 0.25rem 0.4rem; font-size: 0.8rem;" /></div>
              </div>
              <div class="form-group row" style="gap: 0.5rem;">
                 <div class="field" style="flex: 1;"><label for="cLegs" style="font-size: 0.65rem;">Legs</label><input type="number" id="cLegs" bind:value={legs} min="0" max="132" class="modern-input" style="padding: 0.25rem 0.4rem; font-size: 0.8rem;" /></div>
                 <div class="field" style="flex: 1;"><label for="cFeet" style="font-size: 0.65rem;">Feet</label><input type="number" id="cFeet" bind:value={feet} min="0" max="132" class="modern-input" style="padding: 0.25rem 0.4rem; font-size: 0.8rem;" /></div>
              </div>
            </div>
          </div>
        {/if}

        <form id="staticDataForm" onsubmit={handleSubmit} style="flex: 1; display: flex; flex-direction: column; gap: 1rem;">
          
          <div class="form-group row" style="gap: 1rem;">
            <div class="field" style="flex: 1;">
               <label for="itemId">ID Numérico *</label>
               <input type="number" id="itemId" bind:value={id} required min="1" class="modern-input" placeholder="Ex: 2000" />
            </div>
            <div class="field" style="flex: 2;">
               <label for="itemName">Nome *</label>
               <input type="text" id="itemName" bind:value={name} required class="modern-input" placeholder="Ex: Demon" />
            </div>
          </div>

          {#if dataType === 'creatures'}
            <div class="form-group row" style="gap: 1rem;">
               <div class="field" style="flex: 1;">
                 <label for="itemDifficulty">Difficulty (0-5)</label>
                 <input type="number" id="itemDifficulty" bind:value={difficulty} min="0" max="5" class="modern-input" />
               </div>
               <div class="field" style="flex: 1;">
                 <label for="itemOccurence">Occurrence (0-5)</label>
                 <input type="number" id="itemOccurence" bind:value={occurrence} min="0" max="5" class="modern-input" />
               </div>
            </div>
            <div class="form-group row" style="align-items: center; margin-top: 0.5rem; background: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
               <label class="checkbox-label" style="flex: 1;">
                  <input type="checkbox" bind:checked={isNpc} /> Específico de NPC?
               </label>
               <label class="checkbox-label" style="flex: 1;">
                  <input type="checkbox" bind:checked={isHostile} /> É Hostil? (Agressivo)
               </label>
            </div>
          {/if}

          {#if dataType === 'bosses'}
             <div class="form-group row" style="align-items: center; margin-top: 0.5rem; background: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
               <label class="checkbox-label">
                  <input type="checkbox" bind:checked={isArchfoe} /> Contará como Archfoe na Bosstiary?
               </label>
            </div>
          {/if}

          {#if dataType === 'creatures' || dataType === 'bosses'}
            <div class="section-divider" style="margin-top: 0.5rem; font-size: 0.85rem;">Equipamento / ID Base</div>
            <div class="form-group row" style="gap: 1rem;">
               <div class="field" style="flex: 1.5;">
                 <label for="itemLooktype">LookType (ID Sprite)</label>
                 <input type="number" id="itemLooktype" bind:value={looktype} min="0" class="modern-input" />
               </div>
               <div class="field" style="flex: 1;">
                 <label for="itemAddons">Addons (0-3)</label>
                 <input type="number" id="itemAddons" bind:value={addons} min="0" max="3" class="modern-input" />
               </div>
               <div class="field" style="flex: 1;">
                 <label for="itemMount">Mount Type</label>
                 <input type="number" id="itemMount" bind:value={mount} min="0" class="modern-input" />
               </div>
            </div>
          {/if}

          {#if dataType === 'titles'}
            <div class="form-group">
               <label for="itemTitleDesc">System Description</label>
               <textarea id="itemTitleDesc" bind:value={titleDescription} class="modern-input" rows="3" placeholder="Mensagem do título..."></textarea>
            </div>
            <div class="form-group row">
               <div class="field" style="flex: 1;">
                 <label for="itemGrade">Grade Num (se possuir)</label>
                 <input type="number" id="itemGrade" bind:value={grade} class="modern-input" />
               </div>
            </div>
          {/if}
          
        </form>
      </div>

      <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); background: var(--bg-secondary); display: flex; justify-content: flex-end; gap: 0.5rem;">
        <button type="button" class="modern-back-btn" onclick={close} style="background: transparent; border: 1px solid var(--border-soft); color: var(--text-primary);">
          Cancelar
        </button>
        <button type="submit" form="staticDataForm" class="modern-back-btn" style="background: var(--gradient-primary); color: white; border: none;">
          Criar e Fechar
        </button>
      </div>
      
    </div>
  </div>
{/if}

<style>
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .form-group.row {
    flex-direction: row;
    gap: 0.5rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .field label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .modern-input {
    box-sizing: border-box;
    width: 100%;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 0.4rem 0.6rem;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }
  .modern-input:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
  }
  .modern-input:hover:not(:focus) {
    border-color: rgba(255, 255, 255, 0.3);
  }
  .section-divider {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-top: 1rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid var(--border-color);
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--text-primary);
    cursor: pointer;
  }
  .checkbox-label input[type="checkbox"] {
    accent-color: var(--accent-primary);
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
</style>
