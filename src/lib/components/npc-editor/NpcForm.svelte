<script lang="ts">
  import { npcState } from '../../../stores/npcState.svelte';
  import { invoke } from '../../../utils/invoke';
  import { COMMANDS } from '../../../commands';

  import BasicInfoCard from './cards/BasicInfoCard.svelte';
  import OutfitCard from './cards/OutfitCard.svelte';
  import FlagsCard from './cards/FlagsCard.svelte';
  import VoicesCard from './cards/VoicesCard.svelte';
  import ShopCard from './cards/ShopCard.svelte';
  import DialoguesCard from './cards/DialoguesCard.svelte';
  import ScriptingCard from './cards/ScriptingCard.svelte';

  async function handleSave() {
    if (!npcState.currentNpc || !npcState.currentFilePath) return;

    if (!npcState.currentNpc.meta) {
      npcState.currentNpc.meta = { missingFields: [], touchedFields: [] };
    }

    try {
      await invoke(COMMANDS.SAVE_NPC_FILE, {
        filePath: npcState.currentFilePath,
        npc: npcState.currentNpc,
      });
      alert('NPC salvo com sucesso!');
      window.dispatchEvent(new CustomEvent('reload-npc-list'));
    } catch (err) {
      alert(`Falha ao salvar: ${err}`);
    }
  }
</script>

<div class="monster-editor-area">
  {#if !npcState.currentNpc}
    <div class="monster-editor-empty">Selecione um NPC na lista ao lado para começar</div>
  {:else}
    <div class="monster-editor-toolbar">
      <button class="btn-primary" onclick={handleSave}>Salvar NPC</button>
    </div>

    <div class="monster-content-area">
      <div class="monster-cards-grid">
        <OutfitCard />
        <BasicInfoCard />
        <FlagsCard />
        <VoicesCard />
        <ShopCard />
        <div style="grid-column: 1 / -1; display: grid; gap: 16px;">
          <DialoguesCard />
          <ScriptingCard />
        </div>
      </div>
    </div>
  {/if}
</div>
