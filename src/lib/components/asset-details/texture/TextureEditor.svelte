<script lang="ts">
  import type { CompleteAppearanceItem } from '../../../../types';
  import { assetsState } from '../../../../stores/assetsState.svelte';
  import { computeGroupOffsetsFromDetails } from '../../../../animation';
  import { getAppearanceSprites, getSpriteById } from '../../../../spriteCache';
  import TexturePreview from './TexturePreview.svelte';
  import TextureControls from './TextureControls.svelte';
  import TextureSpriteList from './TextureSpriteList.svelte';
  import TextureSettings from './TextureSettings.svelte';
  import TextureBoundingBox from './TextureBoundingBox.svelte';
  import { invoke } from '../../../../utils/invoke';
  import { invalidateDetailSpriteCache, loadDetailSprites, refreshAssetPreview } from '../../../../utils/spriteLoading';
  import { showStatus } from '../../../../utils';
  import { openBrowse } from '../../../../stores/spriteLibraryState.svelte';
  import { translate } from '../../../../i18n';
  import '../../../../styles/texture.css';

  interface Props { details: CompleteAppearanceItem; }
  let { details }: Props = $props();

  let sprites = $state<Uint8Array[]>([]);
  const defaultState = { frameGroupIndex: 0, direction: 0, addon: 0, mount: 0, frame: 0, headColor: '#ffc107', bodyColor: '#ff5722', legsColor: '#4caf50', feetColor: '#2196f3', backgroundColor: '#262626', blendLayers: true, showFullAddons: true, showBoundingBoxes: true, autoAnimate: false, patternX: 0, patternY: 0, patternZ: 0, layer: 0 };
  let state = $state({ ...defaultState });
  let lastDetailsId = $state<number | null>(null);

  let textureCategory = $derived(details?.appearance_type === 2 ? 'Outfits' : details?.appearance_type === 1 ? 'Objects' : (assetsState.currentCategory === 'Outfits' || assetsState.currentCategory === 'Objects') ? assetsState.currentCategory : 'Other');
  let isOutfit = $derived(textureCategory === 'Outfits');
  let isUnsupported = $derived(textureCategory === 'Other');
  let activeTextureCategory = $derived(isOutfit ? 'Outfits' : textureCategory === 'Objects' ? 'Objects' : null);
  let currentFrameGroup = $derived(details?.frame_groups ? details.frame_groups[state.frameGroupIndex] : undefined);
  let spriteInfo = $derived(currentFrameGroup?.sprite_info);

  $effect(() => {
    if (details && details.id !== lastDetailsId) { lastDetailsId = details.id; state = { ...defaultState }; loadSprites(); }
  });

  async function loadSprites() {
    if (!details || !activeTextureCategory) return;
    try { sprites = await getAppearanceSprites(activeTextureCategory, details.id); } catch (err) { console.error('Failed to load sprites:', err); }
  }

  function getGroupOffset(): number { if (!details) return 0; return (computeGroupOffsetsFromDetails(details))[state.frameGroupIndex] ?? 0; }
  async function fetchSpriteBuffers(spriteIds: number[]): Promise<Uint8Array[]> { return Promise.all(spriteIds.map(async (id) => (await getSpriteById(id)) ?? new Uint8Array())); }

  function refreshDetailPreviews(): void {
    if (!details || !activeTextureCategory) return;
    invalidateDetailSpriteCache(activeTextureCategory, details.id);
    void refreshAssetPreview(activeTextureCategory, details.id);
    requestAnimationFrame(() => loadDetailSprites(activeTextureCategory!, details.id, undefined, details));
  }

  function handleStateChange(newState: any) {
    if (newState.frameGroupIndex !== undefined && newState.frameGroupIndex !== state.frameGroupIndex) { state = { ...state, frameGroupIndex: newState.frameGroupIndex, direction: 0, addon: 0, mount: 0, frame: 0, patternX: 0, patternY: 0, patternZ: 0, layer: 0 }; return; }
    state = { ...state, ...newState };
  }

  async function handleReorder(detail: { newOrder: number[] }) {
    const category = activeTextureCategory; if (!category || !spriteInfo?.sprite_ids) return;
    const ids = spriteInfo.sprite_ids.slice(); const reordered = detail.newOrder.map(i => ids[i]).filter(id => typeof id === 'number') as number[];
    if (reordered.length !== ids.length) return;
    const updates = reordered.map((spriteId, index) => ({ index, sprite_id: spriteId }));
    try {
      await invoke('replace_appearance_sprites', { category, id: details.id, update: { frame_group_index: state.frameGroupIndex, updates } });
      await invoke('save_appearances_file');
      spriteInfo.sprite_ids = reordered; if (details.frame_groups[state.frameGroupIndex]) details.frame_groups[state.frameGroupIndex].sprite_info = spriteInfo;
      const offset = getGroupOffset(); const count = spriteInfo.sprite_ids.length; const current = sprites.slice(); const groupSprites = current.slice(offset, offset + count); const reorderedSprites = detail.newOrder.map(index => groupSprites[index] ?? new Uint8Array()); current.splice(offset, count, ...reorderedSprites); sprites = current;
      refreshDetailPreviews(); void loadSprites(); showStatus(translate('status.spriteReplaced'), 'success');
    } catch (err) { console.error('Failed to reorder sprites:', err); showStatus(translate('status.spriteReplaceFailed'), 'error'); }
  }

  async function handleRemove(detail: { indices: number[] }) {
    const category = activeTextureCategory; if (!category || !spriteInfo?.sprite_ids) return;
    const indices = Array.from(new Set(detail.indices)).filter(i => Number.isInteger(i)).sort((a, b) => a - b); if (indices.length === 0) return;
    try {
      await invoke('remove_appearance_sprites', { category, id: details.id, update: { frame_group_index: state.frameGroupIndex, indices } });
      await invoke('save_appearances_file');
      indices.slice().sort((a, b) => b - a).forEach(i => spriteInfo.sprite_ids?.splice(i, 1));
      if (details.frame_groups[state.frameGroupIndex]) details.frame_groups[state.frameGroupIndex].sprite_info = spriteInfo;
      const offset = getGroupOffset(); const current = sprites.slice();
      indices.slice().sort((a, b) => b - a).forEach(i => { const t = offset + i; if (t >= 0 && t < current.length) current.splice(t, 1); });
      sprites = current; refreshDetailPreviews(); void loadSprites(); showStatus(translate('status.spriteRemoved'), 'success');
    } catch (err) { console.error('Failed to remove sprite:', err); showStatus(translate('status.spriteRemoveFailed'), 'error'); }
  }

  async function handleReplace(detail: { index: number; spriteIds: number[] }) {
    const category = activeTextureCategory; if (!category || !spriteInfo?.sprite_ids) return;
    const { index, spriteIds } = detail; if (!spriteIds?.length) return;
    const offset = getGroupOffset(); const previousCount = spriteInfo.sprite_ids.length;
    const updates: Array<{ index: number; sprite_id: number }> = []; const appendIds: number[] = [];
    spriteIds.forEach((spriteId, off) => { const ti = index + off; if (ti < spriteInfo.sprite_ids.length) updates.push({ index: ti, sprite_id: spriteId }); else appendIds.push(spriteId); });
    try {
      if (updates.length > 0) { await invoke('replace_appearance_sprites', { category, id: details.id, update: { frame_group_index: state.frameGroupIndex, updates } }); updates.forEach(u => { if (spriteInfo.sprite_ids && u.index < spriteInfo.sprite_ids.length) spriteInfo.sprite_ids[u.index] = u.sprite_id; }); }
      if (appendIds.length > 0) { await invoke('append_appearance_sprites', { category, id: details.id, update: { frame_group_index: state.frameGroupIndex, sprite_ids: appendIds } }); spriteInfo.sprite_ids.push(...appendIds); }
      if (updates.length > 0 || appendIds.length > 0) {
        await invoke('save_appearances_file');
        if (details.frame_groups[state.frameGroupIndex]) details.frame_groups[state.frameGroupIndex].sprite_info = { ...spriteInfo };
        const current = sprites.slice();
        if (updates.length > 0) { const buffers = await fetchSpriteBuffers(updates.map(u => u.sprite_id)); updates.forEach((u, ui) => { const t = offset + u.index; if (t >= 0 && t < current.length) current[t] = buffers[ui] ?? new Uint8Array(); }); }
        if (appendIds.length > 0) { const buffers = await fetchSpriteBuffers(appendIds); current.splice(offset + previousCount, 0, ...buffers); }
        sprites = current; refreshDetailPreviews(); void loadSprites(); showStatus(translate('status.spriteReplaced'), 'success');
      }
    } catch (err) { console.error('Failed to replace sprites:', err); showStatus(translate('status.spriteReplaceFailed'), 'error'); }
  }

  async function handleAppend(detail: { spriteIds: number[] }) {
    const category = activeTextureCategory; if (!category || !spriteInfo?.sprite_ids) return;
    const { spriteIds } = detail; if (!spriteIds?.length) return;
    const offset = getGroupOffset(); const previousCount = spriteInfo.sprite_ids.length;
    try {
      await invoke('append_appearance_sprites', { category, id: details.id, update: { frame_group_index: state.frameGroupIndex, sprite_ids: spriteIds } });
      await invoke('save_appearances_file');
      spriteInfo.sprite_ids.push(...spriteIds); if (details.frame_groups[state.frameGroupIndex]) details.frame_groups[state.frameGroupIndex].sprite_info = { ...spriteInfo };
      const current = sprites.slice(); const buffers = await fetchSpriteBuffers(spriteIds); current.splice(offset + previousCount, 0, ...buffers); sprites = current;
      refreshDetailPreviews(); void loadSprites(); showStatus(translate('status.spriteReplaced'), 'success');
    } catch (err) { console.error('Failed to append sprites:', err); showStatus(translate('status.spriteReplaceFailed'), 'error'); }
  }

  function handleSettingsChange(_detail: any) { /* Settings mutated via bindings */ }

  function collectTextureUpdatePayload() {
    if (!spriteInfo) return null;
    const payload: any = { frame_group_index: state.frameGroupIndex, pattern_width: Number(spriteInfo.pattern_width || 0), pattern_height: Number(spriteInfo.pattern_height || 0), pattern_depth: Number(spriteInfo.pattern_depth || 0), layers: Number(spriteInfo.layers || 1), pattern_frames: Number(spriteInfo.pattern_frames || 1), bounding_square: Number(spriteInfo.bounding_square || 0), is_opaque: !!spriteInfo.is_opaque, is_animation: !!spriteInfo.is_animation, bounding_boxes: spriteInfo.bounding_boxes || [] };
    if (spriteInfo.animation) { const a = spriteInfo.animation; payload.animation = { default_start_phase: Number(a.default_start_phase || 0), loop_type: Number(a.loop_type || 0), loop_count: Number(a.loop_count || 0), synchronized: !!a.synchronized, random_start_phase: !!a.random_start_phase, phases: a.phases?.map(p => ({ duration_min: Number(p.duration_min || 100), duration_max: Number(p.duration_max || 100) })) || [] }; }
    else payload.animation = null;
    return payload;
  }

  async function handleSaveSettings() {
    const update = collectTextureUpdatePayload(); if (!update) return;
    const category = activeTextureCategory; if (!category) return;
    try { await invoke('update_appearance_texture_settings', { category, id: details.id, update }); await invoke('save_appearances_file'); showStatus(translate('status.textureSaved'), 'success'); loadSprites(); }
    catch (err) { console.error('Failed to save texture settings:', err); showStatus(translate('status.textureSaveFailed'), 'error'); }
  }
</script>

{#if isUnsupported}
  <div class="texture-empty-state"><p>{translate('texture.emptyState.unsupported')}</p></div>
{:else}
  <div class="texture-layout">
    <div class="texture-preview-column">
      <TexturePreview {details} {sprites} previewState={state} {spriteInfo} {isOutfit} onDropSprites={(d) => handleAppend(d)} onStateChange={(d) => handleStateChange(d)} />
      <TextureControls previewState={state} {spriteInfo} {isOutfit} {details} onChange={(d) => handleStateChange(d)} />
      <TextureSpriteList {sprites} {details} frameGroupIndex={state.frameGroupIndex} onReorder={handleReorder} onRemove={handleRemove} onReplace={handleReplace} onAppend={handleAppend} onAdd={() => openBrowse()} />
      <TextureBoundingBox bind:spriteInfo={spriteInfo} onChange={handleSettingsChange} />
    </div>
    <div class="texture-settings-column">
      <TextureSettings bind:spriteInfo={spriteInfo} onChange={handleSettingsChange} onSave={handleSaveSettings} />
    </div>
  </div>
{/if}
