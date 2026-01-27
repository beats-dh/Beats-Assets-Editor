<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '../../utils/invoke';
  import { translate } from '../../i18n';
  import { currentSubcategory } from '../../stores/assetsStore';
  import { openConfirmModal } from '../../stores/confirmStore';
  import { closeAssetDetails } from '../../stores/selectionStore';
  import { loadAssetsData } from '../../services/assetService';

  export let id: number;
  export let onSave: () => void; // Callback to refresh parent if needed

  let data: any = null;
  let loading = false;
  let error = '';
  let subcategory = '';

  // Form fields (will be populated from data)
  let soundType = 'Unknown';
  let soundIdValue: number | undefined;
  let randomSoundIds: number[] = [];
  let randomPitchMin: number | undefined;
  let randomPitchMax: number | undefined;
  let randomVolumeMin: number | undefined;
  let randomVolumeMax: number | undefined;
  
  // Ambience Stream
  let loopingSoundId: number | undefined;
  let delayedEffects: Array<{ numeric_sound_effect_id: number, delay_seconds: number }> = [];

  // Ambience Object Stream
  let maxSoundDistance: number | undefined;
  let countedAppearanceTypes: number[] = [];
  let soundEffectsByCount: Array<{ count: number, looping_sound_id: number }> = [];

  // Music Template
  let musicType = 'Unknown';

  const typeOptions = [
    'Unknown','Spell Attack','Spell Healing','Spell Support','Weapon Attack','Creature Noise','Creature Death','Creature Attack','Ambience Stream','Food and Drink','Item Movement','Event','UI','Whisper','Chat Message','Party','VIP List','Raid Announcement','Server Message','Spell Generic'
  ];

  const musicOptions = ['Unknown','Music','Music Immediate','Music Title'];

  $: if (id) {
    subcategory = $currentSubcategory || 'All';
    loadData(id);
  }

  async function loadData(soundId: number) {
    loading = true;
    error = '';
    data = null;
    try {
      if (subcategory === 'Ambience Streams') {
        data = await invoke('get_ambience_stream_by_id', { id: soundId });
        data._type = 'Ambience Stream';
        loopingSoundId = data.looping_sound_id;
        delayedEffects = [...(data.delayed_effects || [])];
      } else if (subcategory === 'Ambience Object Streams') {
        data = await invoke('get_ambience_object_stream_by_id', { id: soundId });
        data._type = 'Ambience Object Stream';
        maxSoundDistance = data.max_sound_distance;
        countedAppearanceTypes = [...(data.counted_appearance_types || [])];
        soundEffectsByCount = [...(data.sound_effects || [])];
      } else if (subcategory === 'Music Templates') {
        data = await invoke('get_music_template_by_id', { id: soundId });
        data._type = 'Music Template';
        soundIdValue = data.sound_id;
        musicType = data.music_type || 'Unknown';
      } else {
        data = await invoke('get_numeric_sound_effect_by_id', { id: soundId });
        data._type = 'Sound Effect';
        soundType = data.sound_type || 'Unknown';
        soundIdValue = data.sound_id;
        randomSoundIds = [...(data.random_sound_ids || [])];
        randomPitchMin = data.random_pitch_min;
        randomPitchMax = data.random_pitch_max;
        randomVolumeMin = data.random_volume_min;
        randomVolumeMax = data.random_volume_max;
      }
    } catch (e) {
      error = String(e);
      console.error(e);
    } finally {
      loading = false;
    }
  }

  async function handleSave() {
    try {
      if (data._type === 'Sound Effect') {
        const mode = soundIdValue !== undefined ? 'simple' : 'random';
        const info: any = {
          id: id,
          sound_type: soundType,
          sound_id: undefined,
          random_sound_ids: undefined,
          random_pitch_min: randomPitchMin,
          random_pitch_max: randomPitchMax,
          random_volume_min: randomVolumeMin,
          random_volume_max: randomVolumeMax,
        };

        if (mode === 'simple') {
          info.sound_id = soundIdValue;
          info.random_sound_ids = [];
        } else {
          info.random_sound_ids = randomSoundIds;
        }

        if (id === 0) {
           const newId = await invoke('add_numeric_sound_effect', { info }) as number;
           // handle new id...
        } else {
           await invoke('update_numeric_sound_effect', { info });
        }

      } else if (data._type === 'Ambience Stream') {
        const info = {
          id: id,
          looping_sound_id: loopingSoundId || 0,
          delayed_effects: delayedEffects.filter(d => d.numeric_sound_effect_id > 0)
        };
        await invoke('update_ambience_stream', { info });

      } else if (data._type === 'Ambience Object Stream') {
        const info = {
          id: id,
          max_sound_distance: maxSoundDistance,
          counted_appearance_types: countedAppearanceTypes,
          sound_effects: soundEffectsByCount.filter(e => e.count > 0 && e.looping_sound_id > 0)
        };
        await invoke('update_ambience_object_stream', { info });

      } else if (data._type === 'Music Template') {
        const info = {
          id: id,
          sound_id: soundIdValue || 0,
          music_type: musicType
        };
        await invoke('update_music_template', { info });
      }

      await invoke('save_sounds_file');
      alert('Saved successfully!');
      if (onSave) onSave();
      
    } catch (e) {
      console.error('Failed to save sound', e);
      alert('Failed to save: ' + e);
    }
  }

  async function handleDelete() {
    if (data._type !== 'Sound Effect') return; // Only numeric sound effects deletion supported in legacy
    const ok = await openConfirmModal('Tem certeza que deseja excluir este som?', 'Confirmar exclusão');
    if (!ok) return;
    
    try {
      await invoke('delete_numeric_sound_effect', { id });
      await invoke('save_sounds_file');
      closeAssetDetails();
      await loadAssetsData();
    } catch (e) {
      console.error('Failed to delete sound', e);
      alert('Failed to delete: ' + e);
    }
  }

  // Helpers for array fields
  function addDelayedEffect() {
    delayedEffects = [...delayedEffects, { numeric_sound_effect_id: 0, delay_seconds: 0 }];
  }
  function removeDelayedEffect(index: number) {
    delayedEffects = delayedEffects.filter((_, i) => i !== index);
  }

  function addSoundEffectByCount() {
    soundEffectsByCount = [...soundEffectsByCount, { count: 0, looping_sound_id: 0 }];
  }
  function removeSoundEffectByCount(index: number) {
    soundEffectsByCount = soundEffectsByCount.filter((_, i) => i !== index);
  }

</script>

{#if loading}
  <div class="loading-spinner">Loading...</div>
{:else if data}
  <div class="edit-section">
    <h3>Editar {data._type}</h3>
    
    {#if data._type === 'Sound Effect'}
      <div class="form-grid">
        <label>Tipo
          <select bind:value={soundType}>
            {#each typeOptions as t}
              <option value={t}>{t === 'Unknown' ? translate('general.unknown') : t}</option>
            {/each}
          </select>
        </label>
        
        <label>Sound ID (Simples)
          <input type="number" bind:value={soundIdValue} placeholder="Optional if random" />
        </label>
        
        <label>Random IDs (comma separated)
          <input 
            type="text" 
            value={randomSoundIds.join(',')} 
            on:input={(e) => randomSoundIds = e.currentTarget.value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0)}
            placeholder="e.g. 101,102,103" 
          />
        </label>

        <label>Pitch Min
          <input type="number" step="0.01" bind:value={randomPitchMin} />
        </label>
        <label>Pitch Max
          <input type="number" step="0.01" bind:value={randomPitchMax} />
        </label>
        <label>Volume Min
          <input type="number" step="0.01" bind:value={randomVolumeMin} />
        </label>
        <label>Volume Max
          <input type="number" step="0.01" bind:value={randomVolumeMax} />
        </label>
      </div>
      
      <div class="edit-actions">
        <button class="btn-save" on:click={handleSave}>Salvar</button>
        <button class="btn-delete" on:click={handleDelete}>Excluir Som</button>
      </div>

    {:else if data._type === 'Ambience Stream'}
      <div class="form-grid">
        <label>Looping Sound ID
          <input type="number" bind:value={loopingSoundId} />
        </label>
      </div>
      <div class="details-section">
        <h4>Delayed Effects</h4>
        {#each delayedEffects as effect, i}
          <div class="table-row delay-row">
            <input type="number" bind:value={effect.numeric_sound_effect_id} placeholder="Effect ID" />
            <input type="number" bind:value={effect.delay_seconds} placeholder="Delay (s)" />
            <button type="button" class="remove-delay" on:click={() => removeDelayedEffect(i)}>Remover</button>
          </div>
        {/each}
        <button type="button" on:click={addDelayedEffect}>Adicionar Efeito</button>
      </div>
      <div class="edit-actions">
        <button class="btn-save" on:click={handleSave}>Salvar</button>
      </div>

    {:else if data._type === 'Ambience Object Stream'}
      <div class="form-grid">
        <label>Max Sound Distance
          <input type="number" bind:value={maxSoundDistance} />
        </label>
        <label>Counted Appearance Types (comma)
          <input 
            type="text" 
            value={countedAppearanceTypes.join(',')} 
            on:input={(e) => countedAppearanceTypes = e.currentTarget.value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))}
          />
        </label>
      </div>
      <div class="details-section">
        <h4>Sound Effects by Count</h4>
        {#each soundEffectsByCount as effect, i}
          <div class="table-row effect-row">
            <input type="number" bind:value={effect.count} placeholder="Count" />
            <input type="number" bind:value={effect.looping_sound_id} placeholder="Looping Sound ID" />
            <button type="button" class="remove-effect" on:click={() => removeSoundEffectByCount(i)}>Remover</button>
          </div>
        {/each}
        <button type="button" on:click={addSoundEffectByCount}>Adicionar Efeito</button>
      </div>
      <div class="edit-actions">
        <button class="btn-save" on:click={handleSave}>Salvar</button>
      </div>

    {:else if data._type === 'Music Template'}
      <div class="form-grid">
        <label>Sound ID
          <input type="number" bind:value={soundIdValue} />
        </label>
        <label>Music Type
          <select bind:value={musicType}>
            {#each musicOptions as o}
              <option value={o}>{o === 'Unknown' ? translate('general.unknown') : o}</option>
            {/each}
          </select>
        </label>
      </div>
      <div class="edit-actions">
        <button class="btn-save" on:click={handleSave}>Salvar</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
  input, select {
    padding: 0.5rem;
    background: var(--surface-input);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-primary);
  }
  .edit-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  .btn-save {
    background: var(--primary-color);
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .btn-delete {
    background: var(--error-color, #ff4444);
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .table-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
</style>