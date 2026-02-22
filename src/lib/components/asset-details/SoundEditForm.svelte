<script lang="ts">
  import { invoke } from '../../../utils/invoke';
  import { translate } from '../../../i18n';
  import { assetsState } from '../../../stores/assetsState.svelte';
  import { confirmState } from '../../../stores/confirmState.svelte';
  import { selectionState } from '../../../stores/selectionState.svelte';
  import { loadAssetsData } from '../../../services/assetService';
  interface Props { id: number; onSave?: () => void; }
  let { id, onSave }: Props = $props();
  let data = $state<any>(null);
  let loading = $state(false);
  let error = $state('');
  let subcategory = $derived(assetsState.currentSubcategory || 'All');

  // Form fields
  let soundType = $state('Unknown');
  let soundIdValue = $state<number | undefined>();
  let randomSoundIds = $state<number[]>([]);
  let randomPitchMin = $state<number | undefined>();
  let randomPitchMax = $state<number | undefined>();
  let randomVolumeMin = $state<number | undefined>();
  let randomVolumeMax = $state<number | undefined>();
  let loopingSoundId = $state<number | undefined>();
  let delayedEffects = $state<Array<{ numeric_sound_effect_id: number; delay_seconds: number }>>([]);
  let maxSoundDistance = $state<number | undefined>();
  let countedAppearanceTypes = $state<number[]>([]);
  let soundEffectsByCount = $state<Array<{ count: number; looping_sound_id: number }>>([]);
  let musicType = $state('Unknown');

  const typeOptions = ['Unknown','Spell Attack','Spell Healing','Spell Support','Weapon Attack','Creature Noise','Creature Death','Creature Attack','Ambience Stream','Food and Drink','Item Movement','Event','UI','Whisper','Chat Message','Party','VIP List','Raid Announcement','Server Message','Spell Generic'];
  const musicOptions = ['Unknown','Music','Music Immediate','Music Title'];

  $effect(() => { if (id) loadData(id); });

  async function loadData(soundId: number) {
    loading = true; error = ''; data = null;
    try {
      if (subcategory === 'Ambience Streams') {
        data = await invoke('get_ambience_stream_by_id', { id: soundId }); data._type = 'Ambience Stream';
        loopingSoundId = data.looping_sound_id; delayedEffects = [...(data.delayed_effects || [])];
      } else if (subcategory === 'Ambience Object Streams') {
        data = await invoke('get_ambience_object_stream_by_id', { id: soundId }); data._type = 'Ambience Object Stream';
        maxSoundDistance = data.max_sound_distance; countedAppearanceTypes = [...(data.counted_appearance_types || [])]; soundEffectsByCount = [...(data.sound_effects || [])];
      } else if (subcategory === 'Music Templates') {
        data = await invoke('get_music_template_by_id', { id: soundId }); data._type = 'Music Template';
        soundIdValue = data.sound_id; musicType = data.music_type || 'Unknown';
      } else {
        data = await invoke('get_numeric_sound_effect_by_id', { id: soundId }); data._type = 'Sound Effect';
        soundType = data.sound_type || 'Unknown'; soundIdValue = data.sound_id;
        randomSoundIds = [...(data.random_sound_ids || [])];
        randomPitchMin = data.random_pitch_min; randomPitchMax = data.random_pitch_max;
        randomVolumeMin = data.random_volume_min; randomVolumeMax = data.random_volume_max;
      }
    } catch (e) { error = String(e); } finally { loading = false; }
  }

  async function handleSave() {
    try {
      if (data._type === 'Sound Effect') {
        const info: any = { id, sound_type: soundType, sound_id: soundIdValue !== undefined ? soundIdValue : undefined, random_sound_ids: soundIdValue !== undefined ? [] : randomSoundIds, random_pitch_min: randomPitchMin, random_pitch_max: randomPitchMax, random_volume_min: randomVolumeMin, random_volume_max: randomVolumeMax };
        if (id === 0) await invoke('add_numeric_sound_effect', { info }); else await invoke('update_numeric_sound_effect', { info });
      } else if (data._type === 'Ambience Stream') {
        await invoke('update_ambience_stream', { info: { id, looping_sound_id: loopingSoundId || 0, delayed_effects: delayedEffects.filter(d => d.numeric_sound_effect_id > 0) } });
      } else if (data._type === 'Ambience Object Stream') {
        await invoke('update_ambience_object_stream', { info: { id, max_sound_distance: maxSoundDistance, counted_appearance_types: countedAppearanceTypes, sound_effects: soundEffectsByCount.filter(e => e.count > 0 && e.looping_sound_id > 0) } });
      } else if (data._type === 'Music Template') {
        await invoke('update_music_template', { info: { id, sound_id: soundIdValue || 0, music_type: musicType } });
      }
      await invoke('save_sounds_file');
      alert('Saved successfully!'); if (onSave) onSave();
    } catch (e) { console.error('Failed to save sound', e); alert('Failed to save: ' + e); }
  }

  async function handleDelete() {
    if (data._type !== 'Sound Effect') return;
    confirmState.show('Tem certeza que deseja excluir este som?', 'Confirmar exclusão', async () => {
      try { await invoke('delete_numeric_sound_effect', { id }); await invoke('save_sounds_file'); selectionState.closeDetails(); await loadAssetsData(); } catch (e) { console.error('Failed to delete sound', e); alert('Failed to delete: ' + e); }
    });
  }

  function addDelayedEffect() { delayedEffects = [...delayedEffects, { numeric_sound_effect_id: 0, delay_seconds: 0 }]; }
  function removeDelayedEffect(i: number) { delayedEffects = delayedEffects.filter((_, idx) => idx !== i); }
  function addSoundEffectByCount() { soundEffectsByCount = [...soundEffectsByCount, { count: 0, looping_sound_id: 0 }]; }
  function removeSoundEffectByCount(i: number) { soundEffectsByCount = soundEffectsByCount.filter((_, idx) => idx !== i); }
</script>

{#if loading}
  <div class="loading-spinner">Loading...</div>
{:else if data}
  <div class="edit-section">
    <h3>Editar {data._type}</h3>
    {#if data._type === 'Sound Effect'}
      <div class="form-grid">
        <label>Tipo<select bind:value={soundType}>{#each typeOptions as t}<option value={t}>{t === 'Unknown' ? translate('general.unknown') : t}</option>{/each}</select></label>
        <label>Sound ID (Simples)<input type="number" bind:value={soundIdValue} placeholder="Optional if random" /></label>
        <label>Random IDs (comma separated)<input type="text" value={randomSoundIds.join(',')} oninput={(e) => randomSoundIds = (e.target as HTMLInputElement).value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0)} placeholder="e.g. 101,102,103" /></label>
        <label>Pitch Min<input type="number" step="0.01" bind:value={randomPitchMin} /></label>
        <label>Pitch Max<input type="number" step="0.01" bind:value={randomPitchMax} /></label>
        <label>Volume Min<input type="number" step="0.01" bind:value={randomVolumeMin} /></label>
        <label>Volume Max<input type="number" step="0.01" bind:value={randomVolumeMax} /></label>
      </div>
      <div class="edit-actions"><button class="btn-save" onclick={handleSave}>Salvar</button><button class="btn-delete" onclick={handleDelete}>Excluir Som</button></div>
    {:else if data._type === 'Ambience Stream'}
      <div class="form-grid"><label>Looping Sound ID<input type="number" bind:value={loopingSoundId} /></label></div>
      <div class="details-section"><h4>Delayed Effects</h4>{#each delayedEffects as effect, i}<div class="table-row delay-row"><input type="number" bind:value={effect.numeric_sound_effect_id} placeholder="Effect ID" /><input type="number" bind:value={effect.delay_seconds} placeholder="Delay (s)" /><button type="button" class="remove-delay" onclick={() => removeDelayedEffect(i)}>Remover</button></div>{/each}<button type="button" onclick={addDelayedEffect}>Adicionar Efeito</button></div>
      <div class="edit-actions"><button class="btn-save" onclick={handleSave}>Salvar</button></div>
    {:else if data._type === 'Ambience Object Stream'}
      <div class="form-grid"><label>Max Sound Distance<input type="number" bind:value={maxSoundDistance} /></label><label>Counted Appearance Types (comma)<input type="text" value={countedAppearanceTypes.join(',')} oninput={(e) => countedAppearanceTypes = (e.target as HTMLInputElement).value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))} /></label></div>
      <div class="details-section"><h4>Sound Effects by Count</h4>{#each soundEffectsByCount as effect, i}<div class="table-row effect-row"><input type="number" bind:value={effect.count} placeholder="Count" /><input type="number" bind:value={effect.looping_sound_id} placeholder="Looping Sound ID" /><button type="button" class="remove-effect" onclick={() => removeSoundEffectByCount(i)}>Remover</button></div>{/each}<button type="button" onclick={addSoundEffectByCount}>Adicionar Efeito</button></div>
      <div class="edit-actions"><button class="btn-save" onclick={handleSave}>Salvar</button></div>
    {:else if data._type === 'Music Template'}
      <div class="form-grid"><label>Sound ID<input type="number" bind:value={soundIdValue} /></label><label>Music Type<select bind:value={musicType}>{#each musicOptions as o}<option value={o}>{o === 'Unknown' ? translate('general.unknown') : o}</option>{/each}</select></label></div>
      <div class="edit-actions"><button class="btn-save" onclick={handleSave}>Salvar</button></div>
    {/if}
  </div>
{/if}

<style>
  .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  label { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary); }
  .edit-actions { display: flex; gap: 1rem; margin-top: 1rem; }
  .btn-save { background: var(--primary-color); color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
  .btn-delete { background: var(--error-color, #ff4444); color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
  .table-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; }
</style>
