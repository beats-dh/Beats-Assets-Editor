<script lang="ts">
  import { translate } from '../../i18n';
  import '../../styles/modals.css';
  import { getAppearancePreviewSpritesBatch, loadSprites, pixelSprite } from '../../spriteCache';
  import { getSpriteUrl } from '../../utils/spriteUrlCache';
  import { onMount, tick } from 'svelte';
  import { assetsState } from '../../stores/assetsState.svelte';

  let { isOpen, itemDetails, dataType, onClose, onDelete } = $props<{
    isOpen: boolean;
    itemDetails: any;
    dataType: string;
    onClose: () => void;
    onDelete?: (id: number) => void;
  }>();

  let previewSpriteUrl = $state<string | null>(null);

  $effect(() => {
    if (isOpen && itemDetails) {
      if ((dataType === 'creatures' || dataType === 'bosses') && itemDetails.outfit?.looktype) {
        // Usa do cache global se já existir antes de bater na API IPC
        const cachedUrl = assetsState.outfitSprites.get(itemDetails.outfit.looktype);
        if (cachedUrl) {
           previewSpriteUrl = cachedUrl;
        } else {
           fetchPreviewSprite(itemDetails.outfit.looktype);
        }
      } else {
        previewSpriteUrl = null;
      }
    }
  });

  async function fetchPreviewSprite(looktype: number) {
    previewSpriteUrl = null;
    try {
      await loadSprites();
      const batchResult = await getAppearancePreviewSpritesBatch('Outfits', [looktype]);
      const buffer = batchResult.get(looktype);
      if (buffer) {
        const url = getSpriteUrl(buffer);
        previewSpriteUrl = url;
        
        // Alimentar o memory store retroativamente
        const newMap = new Map(assetsState.outfitSprites);
        newMap.set(looktype, url);
        assetsState.outfitSprites = newMap;
      }
    } catch (e) {
      console.warn("Failed to fetch preview sprite for Modal looktype", looktype, e);
    }
  }

  // Função para fechar clicando no fundo ou botão
  function close() {
    onClose();
  }

  function getIcon(type: string): string {
    switch (type) {
      case 'creatures': return '🐉';
      case 'bosses': return '👑';
      case 'quests': return '📜';
      case 'titles': return '🏅';
      case 'houses': return '🏘️';
      case 'map_houses': return '🗺️';
      default: return '📄';
    }
  }

  function formatTitle(item: any, type: string) {
    if (type === 'map_houses') return `Map Layout #${item.house_id}`;
    return item.name || `Unnamed Item #${item.id}`;
  }
</script>

{#if isOpen && itemDetails}
  <div id="static-data-modal" class="asset-details-modal" role="dialog" aria-modal="true" style="display: flex;">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={close}></div>
    <div class="modal-content" style="max-width: 500px; max-height: 80vh;">
      <div class="modal-header" style="justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          {#if previewSpriteUrl}
            <canvas use:pixelSprite={previewSpriteUrl} style="width:48px;height:48px;margin-right:0.5rem;"></canvas>
          {:else}
            <span style="font-size: 1.5rem;">{getIcon(dataType)}</span>
          {/if}
          <h2 style="margin: 0;">{formatTitle(itemDetails, dataType)}</h2>
        </div>
        <div class="modal-tabs">
        {#if onDelete && dataType !== 'houses' && dataType !== 'map_houses'}
          <button class="close-btn" style="background: var(--bg-error, #ef4444); width: auto; padding: 0 10px; font-size: 0.9rem; font-weight: bold;" onclick={() => { if (confirm('Tem certeza que deseja excluir esse item?')) onDelete(itemDetails.id ?? itemDetails.house_id); }} title="Excluir Item">
            🗑️ Excluir
          </button>
        {/if}
        <button class="close-btn" onclick={close} title="Fechar (Esc)">&times;</button>
      </div>
      </div>
      
      <div class="modal-body" style="padding: 1.5rem; overflow-y: auto;">
        
        <!-- ======================= -->
        <!-- CREATURES / BOSSES      -->
        <!-- ======================= -->
        {#if dataType === 'creatures' || dataType === 'bosses'}
          <div class="detail-section">
            <h3 class="section-title">General Info</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">ID</span>
                <span class="info-value">{itemDetails.id}</span>
              </div>
              {#if dataType === 'creatures'}
                <div class="info-item">
                  <span class="info-label">Difficulty</span>
                  <span class="info-value">{itemDetails.difficulty || 0}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Occurrence</span>
                  <span class="info-value">{itemDetails.occurrence || 0}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Type</span>
                  <span class="info-value">
                    {#if itemDetails.is_npc}
                      NPC {itemDetails.is_hostile ? '(Hostile)' : '(Friendly)'}
                    {:else}
                      Monster {itemDetails.is_hostile ? '(Hostile)' : '(Passive)'}
                    {/if}
                  </span>
                </div>
              {/if}
              {#if dataType === 'bosses'}
                <div class="info-item">
                  <span class="info-label">Target Tier</span>
                  <span class="info-value">
                    {#if itemDetails.is_archfoe} Archfoe ⚔️ {:else} Standard 🛡️ {/if}
                  </span>
                </div>
              {/if}
            </div>
          </div>

          <div class="detail-section" style="margin-top: 1.5rem;">
            <h3 class="section-title">Outfit Details</h3>
            <div class="info-grid box-panel">
              {#if itemDetails.outfit}
                <div class="info-item">
                  <span class="info-label">LookType</span>
                  <span class="info-value">{itemDetails.outfit.looktype ?? 'Missing'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Addons</span>
                  <span class="info-value">{itemDetails.outfit.addons ?? 0}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Mount ID</span>
                  <span class="info-value">{itemDetails.outfit.mount ?? 0}</span>
                </div>
                
                <div style="grid-column: 1 / -1; margin-top: 0.5rem;">
                  <span class="info-label" style="display:block; margin-bottom: 4px;">Colors</span>
                  {#if itemDetails.outfit.colors}
                    <div style="display: flex; gap: 0.5rem;">
                      <span class="color-badge">Head: {itemDetails.outfit.colors.head ?? 0}</span>
                      <span class="color-badge">Body: {itemDetails.outfit.colors.body ?? 0}</span>
                      <span class="color-badge">Legs: {itemDetails.outfit.colors.legs ?? 0}</span>
                      <span class="color-badge">Feet: {itemDetails.outfit.colors.feet ?? 0}</span>
                    </div>
                  {:else}
                    <span class="info-value">None</span>
                  {/if}
                </div>
              {:else}
                <div class="info-item"><span class="info-value" style="color:var(--text-muted)">No outfit assigned</span></div>
              {/if}
            </div>
          </div>
        {/if}

        <!-- ======================= -->
        <!-- TITLES                  -->
        <!-- ======================= -->
        {#if dataType === 'titles'}
          <div class="detail-section">
            <h3 class="section-title">Title Profile</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">ID</span>
                <span class="info-value">{itemDetails.id}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Grade Rank</span>
                <span class="info-value">★ {itemDetails.grade || 0}</span>
              </div>
            </div>
            
            <div style="margin-top: 1rem;" class="box-panel">
               <span class="info-label" style="display:block; margin-bottom:0.5rem">Unlock Description</span>
               <span class="info-value" style="white-space: pre-wrap;">{itemDetails.description || 'No description provided.'}</span>
            </div>
          </div>
        {/if}

        <!-- ======================= -->
        <!-- QUESTS                  -->
        <!-- ======================= -->
        {#if dataType === 'quests'}
          <div class="detail-section">
            <h3 class="section-title">Quest Tracker Entity</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Quest ID</span>
                <span class="info-value">{itemDetails.id}</span>
              </div>
              <div class="info-item">
                <span class="info-label">System Name</span>
                <span class="info-value">{itemDetails.name}</span>
              </div>
            </div>
          </div>
        {/if}

        <!-- ======================= -->
        <!-- HOUSES                  -->
        <!-- ======================= -->
        {#if dataType === 'houses'}
          <div class="detail-section">
            <h3 class="section-title">Locality Info</h3>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">ID</span><span class="info-value">{itemDetails.id}</span></div>
              <div class="info-item"><span class="info-label">Town</span><span class="info-value">{itemDetails.town || 'Unknown'}</span></div>
              <div class="info-item"><span class="info-label">Building</span><span class="info-value">{itemDetails.guildhall ? 'Guildhall' : 'House'}</span></div>
              <div class="info-item"><span class="info-label">Premium?</span><span class="info-value">{itemDetails.is_premium ? 'Yes ✅' : 'No ❌'}</span></div>
            </div>

            <h3 class="section-title" style="margin-top: 1.5rem;">Estate Specs</h3>
            <div class="info-grid box-panel">
              <div class="info-item"><span class="info-label">Location (World)</span>
                <span class="info-value">
                  {#if itemDetails.position}
                    {itemDetails.position.x ?? '-'}, {itemDetails.position.y ?? '-'}, {itemDetails.position.z ?? '-'}
                  {:else}
                    Unmapped
                  {/if}
                </span>
              </div>
              <div class="info-item"><span class="info-label">Size</span><span class="info-value">{itemDetails.size || 0} SQM</span></div>
              <div class="info-item"><span class="info-label">Rent Cost</span><span class="info-value">{itemDetails.rent || 0} Gold/mo</span></div>
              <div class="info-item"><span class="info-label">Beds</span><span class="info-value">{itemDetails.beds || 0} slot(s)</span></div>
            </div>

            <div style="margin-top: 1.5rem;" class="box-panel">
               <span class="info-label" style="display:block; margin-bottom:0.5rem">House Advertisement</span>
               <span class="info-value" style="white-space: pre-wrap;">{itemDetails.description || 'No description found.'}</span>
            </div>
          </div>
        {/if}

        <!-- ======================= -->
        <!-- MAP HOUSES              -->
        <!-- ======================= -->
        {#if dataType === 'map_houses'}
          <div class="detail-section">
            <h3 class="section-title">Topology Array</h3>
            <div class="info-grid">
              <div class="info-item"><span class="info-label">House ID Bound</span><span class="info-value">#{itemDetails.house_id}</span></div>
            </div>

            <div class="box-panel" style="margin-top: 1.5rem;">
               {#if itemDetails.layout}
                 <div class="info-grid">
                   <div class="info-item"><span class="info-label">Start Coordinate</span>
                     <span class="info-value">
                       {#if itemDetails.layout.position}
                         {itemDetails.layout.position.x ?? '-'}, {itemDetails.layout.position.y ?? '-'}, {itemDetails.layout.position.z ?? '-'}
                       {:else}
                        -
                       {/if}
                     </span>
                   </div>
                   <div class="info-item"><span class="info-label">Floor Levels</span><span class="info-value">{itemDetails.layout.size?.floors ?? 1}</span></div>
                   <div class="info-item"><span class="info-label">Dimensions</span><span class="info-value">{itemDetails.layout.size?.width ?? 0} x {itemDetails.layout.size?.height ?? 0} tiles</span></div>
                 </div>

                 <!-- Grid Layout Info -->
                 {#if itemDetails.layout.tiles?.floor_data?.rows}
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                       <span class="info-label">Floormap Chunk Data</span>
                       <ul style="margin: 0.5rem 0 0 1rem; color: var(--text-secondary); font-size: 0.9em;">
                          <li>Compiled Map Rows Extracted: {itemDetails.layout.tiles.floor_data.rows.length} </li>
                          <li>Tiles successfully deserialized!</li>
                       </ul>
                    </div>
                 {/if}
               {:else}
                 <div class="info-value" style="color:var(--text-muted); padding: 1rem; text-align: center;">This layout bundle has no structure.</div>
               {/if}
            </div>
          </div>
        {/if}

      </div>
    </div>
  </div>
{/if}

<style>
  .box-panel {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    padding: 1rem;
    border-radius: 6px;
  }

  .color-badge {
    background-color: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    padding: 3px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    color: var(--text-primary);
  }
</style>
