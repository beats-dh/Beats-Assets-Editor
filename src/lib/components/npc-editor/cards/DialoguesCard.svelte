<script lang="ts">
  import { npcState } from '../../../../stores/npcState.svelte';

  let hasInteractions = $state(false);

  // Sync state whenever the NPC loads
  $effect(() => {
    hasInteractions = !!npcState.currentNpc?.interactions;
  });

  function addKeyword() {
    if (!npcState.currentNpc) return;
    if (!npcState.currentNpc.interactions) initInteractions();

    npcState.currentNpc.interactions!.keywords = [
      ...npcState.currentNpc.interactions!.keywords,
      { words: [], response: "" }
    ];
  }

  function removeKeyword(index: number) {
    if (!npcState.currentNpc?.interactions) return;
    const items = npcState.currentNpc.interactions.keywords;
    items.splice(index, 1);
    npcState.currentNpc.interactions.keywords = items;
  }

  function updateWords(index: number, val: string) {
    if (!npcState.currentNpc?.interactions) return;
    const arr = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
    npcState.currentNpc.interactions.keywords[index].words = arr;
  }

  function getWordsStr(index: number): string {
    if (!npcState.currentNpc?.interactions) return "";
    return npcState.currentNpc.interactions.keywords[index].words.join(", ");
  }

  function toggleInteractions() {
    if (!npcState.currentNpc) return;
    
    // Toggle visual state only. Do not wipe the backend data.
    hasInteractions = !hasInteractions;
    
    if (hasInteractions && !npcState.currentNpc.interactions) {
      initInteractions();
    }
  }

  function initInteractions() {
    if (!npcState.currentNpc) return;
    npcState.currentNpc.interactions = {
      messages: {},
      keywords: [],
      modules: [],
      rawCode: ""
    };
  }

  function setStandardMessage(key: string, e: Event) {
    const target = e.target as HTMLInputElement;
    if (!npcState.currentNpc) return;
    if (!npcState.currentNpc.interactions) initInteractions();

    if (target.value.trim() === "") {
        delete npcState.currentNpc.interactions!.messages[key];
    } else {
        npcState.currentNpc.interactions!.messages[key] = target.value;
    }
  }

  function getStandardMessage(key: string): string {
    return npcState.currentNpc?.interactions?.messages?.[key] || "";
  }
</script>

<div class="monster-card">
  <div class="monster-card-header">
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <span>💬 Diálogos e Palavras-chave</span>
      <label style="font-size: 13px; font-weight: normal; display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text-primary);">
        <input 
          style="accent-color: #8b5cf6; width: 16px; height: 16px; cursor: pointer; margin: 0;"
          type="checkbox" 
          checked={hasInteractions} 
          onchange={toggleInteractions} 
        />
        Habilitar NpcLib
      </label>
    </div>
  </div>
  
  <div class="monster-card-body" class:disabled={!hasInteractions}>
    {#if hasInteractions}
      <div class="card-content">
          <div class="form-group">
            <label>Mensagem de Saudações (GREET)</label>
            <input 
                type="text" 
                class="input-primary" 
                placeholder="Ex: Greetings, |PLAYERNAME|."
                value={getStandardMessage('MESSAGE_GREET')}
                oninput={(e) => setStandardMessage('MESSAGE_GREET', e)}
            />
          </div>

          <div class="form-group">
            <label>Mensagem de Despedida (FAREWELL)</label>
            <input 
                type="text" 
                class="input-primary" 
                placeholder="Ex: Farewell, |PLAYERNAME|."
                value={getStandardMessage('MESSAGE_FAREWELL')}
                oninput={(e) => setStandardMessage('MESSAGE_FAREWELL', e)}
            />
          </div>

          <div class="form-group">
            <label>Mensagem ao Ignorar (WALKAWAY)</label>
            <input 
                type="text" 
                class="input-primary" 
                placeholder="Ex: Good bye."
                value={getStandardMessage('MESSAGE_WALKAWAY')}
                oninput={(e) => setStandardMessage('MESSAGE_WALKAWAY', e)}
            />
          </div>

          <hr style="border-color: var(--border); margin: 16px 0;" />

          <div class="list-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-weight: 500; font-size: 14px; color: var(--text-muted);">Respostas Diretas (Keywords)</span>
            <button class="btn-primary" onclick={addKeyword} style="padding: 6px 12px; font-size: 12px;">
                + Nova Regra
            </button>
          </div>

          <div class="keywords-list" style="display: flex; flex-direction: column; gap: 8px;">
            {#if npcState.currentNpc?.interactions?.keywords.length === 0}
                <div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 24px; background: rgba(0,0,0,0.1); border-radius: 6px;">
                    Nenhuma resposta direta configurada.
                </div>
            {/if}

            {#each npcState.currentNpc!.interactions!.keywords as kw, i}
              <div class="keyword-item" style="display: grid; grid-template-columns: 1.2fr 1.5fr 36px; gap: 12px; align-items: start; background: var(--surface); padding: 12px; border-radius: 6px; border: 1px solid var(--border);">
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 12px;">Gatilhos 
                        <span style="opacity: 0.6; font-weight: normal;">(virgula para múltiplos)</span>
                    </label>
                    <input
                        type="text"
                        class="input-primary"
                        placeholder="Ex: hi, hello"
                        value={getWordsStr(i)}
                        oninput={(e) => updateWords(i, e.currentTarget.value)}
                    />
                </div>
                
                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 12px;">Resposta do NPC</label>
                    <input
                        type="text"
                        class="input-primary"
                        placeholder="Ex: Olá mortal!"
                        value={kw.response}
                        oninput={(e) => {
                            if(npcState.currentNpc?.interactions) {
                                npcState.currentNpc.interactions.keywords[i].response = e.currentTarget.value;
                            }
                        }}
                    />
                </div>

                <div class="form-group" style="margin: 0;">
                    <label style="font-size: 12px; visibility: hidden;">Ação</label>
                    <button
                        class="btn-danger-icon"
                        onclick={() => removeKeyword(i)}
                        title="Remover Keyword"
                        style="height: 36px; width: 36px; padding: 0; display: flex; align-items: center; justify-content: center; box-sizing: border-box; margin-top: auto;"
                    >
                        ✕
                    </button>
                </div>
              </div>
            {/each}
          </div>
      </div>
    {:else}
      <div style="text-align: center; padding: 40px 0; color: var(--text-muted); font-size: 13px;">
         Habilite esta opção para adicionar lógicas conversacionais a este NPC.
      </div>
    {/if}
  </div>
</div>

<style>
  .disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  
  .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
  }
  
  .btn-sm:hover {
      background: var(--primary) !important;
      color: white !important;
      border-color: var(--primary) !important;
  }
  
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
