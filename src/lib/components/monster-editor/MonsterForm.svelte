<script lang="ts">
  import { monsterState } from '../../../stores/monsterState.svelte';
  import { invoke } from '../../../utils/invoke';
  import { COMMANDS } from '../../../commands';

  import BasicInfoCard from './cards/BasicInfoCard.svelte';
  import ClassificationCard from './cards/ClassificationCard.svelte';
  import CombatStatsCard from './cards/CombatStatsCard.svelte';
  import FlagsCard from './cards/FlagsCard.svelte';
  import LootCard from './cards/LootCard.svelte';
  import SpellsCard from './cards/SpellsCard.svelte';
  import ElementsCard from './cards/ElementsCard.svelte';
  import SummonsCard from './cards/SummonsCard.svelte';
  import VoicesCard from './cards/VoicesCard.svelte';
  import AdvancedSettingsCard from './cards/AdvancedSettingsCard.svelte';
  import OutfitCard from './cards/OutfitCard.svelte';
  import EventsCard from './cards/EventsCard.svelte';

  async function handleSave() {
    if (!monsterState.currentMonster || !monsterState.currentFilePath) return;

    if (!monsterState.currentMonster.meta) {
      monsterState.currentMonster.meta = { missingFields: [], touchedFields: [] };
    }

    try {
      await invoke(COMMANDS.SAVE_MONSTER_FILE, {
        filePath: monsterState.currentFilePath,
        monster: monsterState.currentMonster,
      });
      alert('Monster saved successfully!');
      window.dispatchEvent(new CustomEvent('reload-monster-list'));
    } catch (err) {
      alert(`Failed to save: ${err}`);
    }
  }
</script>

<div class="monster-editor-area">
  {#if !monsterState.currentMonster}
    <div class="monster-editor-empty">Select a monster to edit</div>
  {:else}
    <div class="monster-editor-toolbar">
      <button class="btn-primary" onclick={handleSave}>Save Monster</button>
    </div>

    <div class="monster-content-area">
      <div class="monster-cards-grid">
        <OutfitCard />
        <BasicInfoCard />
        <ClassificationCard />
        <CombatStatsCard />
        <EventsCard />
        <SummonsCard />
        <VoicesCard />
        <SpellsCard />
        <ElementsCard />
        <LootCard />
        <FlagsCard />
        <AdvancedSettingsCard />
      </div>
    </div>
  {/if}
</div>
