<script lang="ts">
  import { invoke } from '../../../utils/invoke';
  import { translate } from '../../../i18n';
  import { assetsState } from '../../../stores/assetsState.svelte';
  import AudioPlayer from './AudioPlayer.svelte';
  interface Props { id: number; }
  let { id }: Props = $props();
  let data = $state<any>(null);
  let loading = $state(false);
  let error = $state('');
  let subcategory = $derived(assetsState.currentSubcategory || 'All');

  $effect(() => { if (id) loadData(id); });

  async function loadData(soundId: number) {
    loading = true; error = ''; data = null;
    try {
      if (subcategory === 'Ambience Streams') { data = await invoke('get_ambience_stream_by_id', { id: soundId }); data._type = 'Ambience Stream'; }
      else if (subcategory === 'Ambience Object Streams') { data = await invoke('get_ambience_object_stream_by_id', { id: soundId }); data._type = 'Ambience Object Stream'; }
      else if (subcategory === 'Music Templates') { data = await invoke('get_music_template_by_id', { id: soundId }); data._type = 'Music Template'; }
      else { data = await invoke('get_numeric_sound_effect_by_id', { id: soundId }); data._type = 'Sound Effect'; }
    } catch (e) { error = String(e); console.error(e); }
    finally { loading = false; }
  }
  function getSoundTypeLabel(type: string) { return type === 'Unknown' ? translate('general.unknown') : type; }
</script>

{#if loading}
  <div class="details-loading-state"><div class="loading-spinner"><div>🔄 {translate('loading.subtitle')}</div></div></div>
{:else if error}
  <div class="detail-error"><p>Error loading sound details: {error}</p></div>
{:else if data}
  <div class="asset-details-header">
    <div class="detail-header-left">
      <div class="detail-icon">{#if data._type === 'Ambience Stream'}🌫️{:else if data._type === 'Ambience Object Stream'}🪵{:else if data._type === 'Music Template'}🎼{:else}🔊{/if}</div>
      <div class="detail-title-group"><h2>{data._type} #{id}</h2>
        {#if data._type === 'Sound Effect'}<p class="detail-subtitle">{getSoundTypeLabel(data.sound_type)}</p>
        {:else if data._type === 'Ambience Stream'}<p class="detail-subtitle">Looping ambience with optional delayed effects</p>
        {:else if data._type === 'Ambience Object Stream'}<p class="detail-subtitle">Object-based ambience with counts</p>
        {:else if data._type === 'Music Template'}<p class="detail-subtitle">Background music template</p>{/if}
      </div>
    </div>
  </div>
  <div class="details-section"><h3>Basic Information</h3>
    <div class="details-grid">
      <div class="detail-item"><span class="detail-label">ID:</span><span class="detail-value">#{id}</span></div>
      {#if data._type === 'Sound Effect'}
        <div class="detail-item"><span class="detail-label">Type:</span><span class="detail-value">{getSoundTypeLabel(data.sound_type)}</span></div>
        {#if data.sound_id !== null && data.sound_id !== undefined}<div class="detail-item"><span class="detail-label">Primary Sound ID:</span><span class="detail-value">{data.sound_id}</span></div>{/if}
        {#if data.random_sound_ids && data.random_sound_ids.length > 0}<div class="detail-item"><span class="detail-label">Random Sounds:</span><span class="detail-value"><div class="random-sounds-controls">{#each data.random_sound_ids as rid}<button class="random-sound-btn" title="Play {rid}">▶ {rid}</button>{/each}</div></span></div>{/if}
        {#if data.random_pitch_min != null}<div class="detail-item"><span class="detail-label">Random Pitch:</span><span class="detail-value">{data.random_pitch_min} – {data.random_pitch_max}</span></div>{/if}
        {#if data.random_volume_min != null}<div class="detail-item"><span class="detail-label">Random Volume:</span><span class="detail-value">{data.random_volume_min} – {data.random_volume_max}</span></div>{/if}
      {:else if data._type === 'Ambience Stream'}
        <div class="detail-item"><span class="detail-label">Looping Sound ID:</span><span class="detail-value">{data.looping_sound_id}</span></div>
        <div class="detail-item"><span class="detail-label">Delayed Effects:</span><span class="detail-value">{data.delayed_effects?.length || 0}</span></div>
      {:else if data._type === 'Ambience Object Stream'}
        <div class="detail-item"><span class="detail-label">Max Sound Distance:</span><span class="detail-value">{data.max_sound_distance ?? '—'}</span></div>
        <div class="detail-item"><span class="detail-label">Counted Types:</span><span class="detail-value">{data.counted_appearance_types?.length || 0}</span></div>
      {:else if data._type === 'Music Template'}
        <div class="detail-item"><span class="detail-label">Sound ID:</span><span class="detail-value">{data.sound_id}</span></div>
        <div class="detail-item"><span class="detail-label">Music Type:</span><span class="detail-value">{getSoundTypeLabel(data.music_type)}</span></div>
      {/if}
    </div>
  </div>

  {#if data._type === 'Ambience Stream' && data.delayed_effects?.length > 0}
    <div class="details-section"><h3>Delayed Effects</h3><div class="table-like"><div class="table-row table-header"><div>Effect ID</div><div>Delay (s)</div></div>{#each data.delayed_effects as effect}<div class="table-row"><div>{effect.numeric_sound_effect_id}</div><div>{effect.delay_seconds}</div></div>{/each}</div></div>
  {/if}
  {#if data._type === 'Ambience Object Stream'}
    {#if data.counted_appearance_types?.length > 0}<div class="details-section"><h3>Counted Appearance Types</h3><div class="tag-list">{#each data.counted_appearance_types as t}<span class="tag">{t}</span>{/each}</div></div>{/if}
    {#if data.sound_effects?.length > 0}<div class="details-section"><h3>Sound Effects by Count</h3><div class="table-like"><div class="table-row table-header"><div>Count</div><div>Looping Sound ID</div></div>{#each data.sound_effects as effect}<div class="table-row"><div>{effect.count}</div><div>{effect.looping_sound_id}</div></div>{/each}</div></div>{/if}
  {/if}

  {#if (data._type === 'Sound Effect' && (data.sound_id || data.random_sound_ids?.length)) || (data._type === 'Ambience Stream' && data.looping_sound_id) || (data._type === 'Ambience Object Stream' && data.sound_effects?.[0]?.looping_sound_id) || (data._type === 'Music Template' && data.sound_id)}
    <div class="details-section"><h3>Audio Preview</h3>
      {#if data._type === 'Sound Effect'}{#if data.sound_id}<AudioPlayer soundId={data.sound_id} />{:else if data.random_sound_ids?.length > 0}<AudioPlayer soundId={data.random_sound_ids[0]} />{/if}
      {:else if data._type === 'Ambience Stream'}<AudioPlayer soundId={data.looping_sound_id} />
      {:else if data._type === 'Ambience Object Stream'}<AudioPlayer soundId={data.sound_effects[0].looping_sound_id} />
      {:else if data._type === 'Music Template'}<AudioPlayer soundId={data.sound_id} />{/if}
    </div>
  {/if}
{/if}

<style>
  .random-sounds-controls { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .random-sound-btn { padding: 0.25rem 0.5rem; font-size: 0.8rem; background: var(--surface-hover); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; }
  .random-sound-btn:hover { background: var(--primary-color); color: white; }
  .table-like { display: flex; flex-direction: column; gap: 0.25rem; }
  .table-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 0.5rem; background: var(--surface-hover); border-radius: 4px; }
  .table-header { font-weight: bold; background: var(--surface-card); border-bottom: 1px solid var(--border-color); }
  .tag-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .tag { background: var(--primary-color-alpha, rgba(62, 166, 255, 0.2)); color: var(--primary-color); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.9rem; }
</style>
