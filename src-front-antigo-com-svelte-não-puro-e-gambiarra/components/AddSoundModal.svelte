<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { invoke } from '../utils/invoke';
  import { open as openDialog } from '@tauri-apps/plugin-dialog';
  import { 
    getAllSounds, 
    refreshSounds, 
    getSoundAudioData, 
    addNumericSoundEffect,
    importAndAddSound,
    type SoundInfo 
  } from '../services/soundService';
  import { SOUND_TYPES } from '../soundTypes';

  // Props
  export let isOpen = false;
  export let onClose: () => void;
  export let onSoundCreated: ((id: number) => void) | undefined = undefined;

  // State
  let mode: 'simple' | 'random' = 'simple';
  let soundType = 'Unknown';
  let soundId = '';
  let randomIds = '';
  let selectedIds: number[] = [];
  
  // Pitch and Volume
  let pitchMin = '';
  let pitchMax = '';
  let volumeMin = '';
  let volumeMax = '';
  
  // Sound picker
  let allSounds: SoundInfo[] = [];
  let searchFilter = '';
  let loading = false;
  let error = '';
  
  // Audio playback
  let currentAudio: HTMLAudioElement | null = null;
  let isPlaying = false;
  let playingSequence = false;
  let sequenceAbort = false;
  
  // Upload section
  let selectedFilePath: string | null = null;
  let uploadId = '';
  let isStream = false;
  let uploading = false;

  const typeOptions = SOUND_TYPES || [
    'Unknown','Spell Attack','Spell Healing','Spell Support','Weapon Attack',
    'Creature Noise','Creature Death','Creature Attack','Ambience Stream',
    'Food and Drink','Item Movement','Event','UI','Whisper','Chat Message',
    'Party','VIP List','Raid Announcement','Server Message','Spell Generic'
  ];

  // Filtered sounds based on search
  $: filteredSounds = allSounds.filter(s => {
    const f = searchFilter.trim().toLowerCase();
    if (!f) return true;
    return String(s.id).includes(f) || (s.filename || '').toLowerCase().includes(f);
  });

  onMount(async () => {
    if (isOpen) {
      await loadSounds();
    }
  });

  onDestroy(() => {
    stopAudio();
  });

  async function loadSounds() {
    loading = true;
    try {
      allSounds = await getAllSounds();
    } catch (e) {
      console.error('Failed to load sounds:', e);
    } finally {
      loading = false;
    }
  }

  // Audio control
  function stopAudio() {
    if (currentAudio) {
      try { currentAudio.pause(); } catch {}
      currentAudio.src = '';
      currentAudio = null;
    }
    isPlaying = false;
    playingSequence = false;
    sequenceAbort = true;
  }

  async function playSingle(id: number) {
    sequenceAbort = true;
    stopAudio();
    
    try {
      const audioData = await getSoundAudioData(id);
      const audio = new Audio(`data:audio/ogg;base64,${audioData}`);
      currentAudio = audio;
      isPlaying = true;
      
      audio.addEventListener('ended', () => {
        stopAudio();
      });
      audio.addEventListener('error', () => {
        stopAudio();
      });
      
      await audio.play();
    } catch (e) {
      console.error('Failed to play sound:', id, e);
      stopAudio();
    }
  }

  async function playSequence(ids: number[]) {
    if (!ids || ids.length === 0) return;
    
    sequenceAbort = false;
    playingSequence = true;
    isPlaying = true;
    stopAudio();
    
    for (let i = 0; i < ids.length; i++) {
      if (sequenceAbort) break;
      
      try {
        const audioData = await getSoundAudioData(ids[i]);
        const audio = new Audio(`data:audio/ogg;base64,${audioData}`);
        currentAudio = audio;
        
        await new Promise<void>((resolve) => {
          audio.addEventListener('ended', () => resolve(), { once: true });
          audio.addEventListener('error', () => resolve(), { once: true });
          audio.play().catch(() => resolve());
        });
      } catch (e) {
        console.error('Failed to play sound in sequence:', ids[i], e);
      }
    }
    
    stopAudio();
  }

  function togglePlaySelected() {
    if (isPlaying) {
      stopAudio();
      return;
    }
    
    if (mode === 'random') {
      playSequence([...selectedIds]);
    } else if (soundId) {
      const id = parseInt(soundId, 10);
      if (!isNaN(id)) playSingle(id);
    }
  }

  // Selection handling
  function selectSound(id: number) {
    if (mode === 'simple') {
      selectedIds = [id];
      soundId = String(id);
    } else {
      if (!selectedIds.includes(id)) {
        selectedIds = [...selectedIds, id];
      }
      randomIds = selectedIds.join(',');
    }
  }

  function removeSelected(id: number) {
    selectedIds = selectedIds.filter(x => x !== id);
    if (mode === 'random') {
      randomIds = selectedIds.join(',');
    } else {
      soundId = selectedIds[0] ? String(selectedIds[0]) : '';
    }
  }

  function clearSelection() {
    selectedIds = [];
    soundId = '';
    randomIds = '';
  }

  // Mode change
  function handleModeChange(newMode: 'simple' | 'random') {
    mode = newMode;
    clearSelection();
  }

  // File upload
  async function selectFile() {
    try {
      const file = await openDialog({ 
        multiple: false, 
        filters: [{ name: 'Audio', extensions: ['ogg'] }] 
      });
      
      if (typeof file === 'string' && file.length > 0) {
        selectedFilePath = file;
        error = '';
        
        // Validate extension
        const ext = (file.split('.').pop() || '').toLowerCase();
        if (ext !== 'ogg') {
          error = 'Formato não suportado. Selecione um arquivo .ogg.';
          selectedFilePath = null;
        }
      }
    } catch (e) {
      console.error('Failed to select file:', e);
    }
  }

  async function handleImportAndAdd() {
    if (!selectedFilePath) {
      error = 'Selecione um arquivo .ogg primeiro.';
      return;
    }
    
    uploading = true;
    error = '';
    
    try {
      const idVal = uploadId ? Number(uploadId) : undefined;
      const created = await importAndAddSound(selectedFilePath, undefined, isStream, idVal);
      
      // Refresh sounds list
      allSounds = await refreshSounds();
      
      // Auto-select the created sound
      if (created && typeof created.id === 'number') {
        selectSound(created.id);
      }
      
      // Reset upload form
      selectedFilePath = null;
      uploadId = '';
      isStream = false;
    } catch (e) {
      console.error('Failed to import sound:', e);
      error = `Erro ao importar: ${e}`;
    } finally {
      uploading = false;
    }
  }

  // Save handler
  async function handleSave() {
    error = '';
    
    try {
      const parsedRandomIds = randomIds
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => Number(s));

      const info: any = {
        id: 0,
        sound_type: soundType,
        sound_id: undefined,
        random_sound_ids: undefined,
        random_pitch_min: pitchMin ? Number(pitchMin) : undefined,
        random_pitch_max: pitchMax ? Number(pitchMax) : undefined,
        random_volume_min: volumeMin ? Number(volumeMin) : undefined,
        random_volume_max: volumeMax ? Number(volumeMax) : undefined,
      };

      if (mode === 'simple') {
        info.sound_id = soundId ? Number(soundId) : undefined;
        info.random_sound_ids = [];
      } else {
        info.sound_id = undefined;
        info.random_sound_ids = parsedRandomIds;
      }

      const newId = await addNumericSoundEffect(info);
      
      if (onSoundCreated) {
        onSoundCreated(newId);
      }
      
      handleClose();
    } catch (e) {
      console.error('Failed to add sound effect:', e);
      error = 'Falha ao adicionar som. Veja o console para detalhes.';
    }
  }

  function handleClose() {
    stopAudio();
    clearSelection();
    error = '';
    onClose();
  }

  // Trap focus for accessibility
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="add-sound-modal" role="dialog" aria-modal="true" aria-labelledby="add-sound-title">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-backdrop" on:click={handleClose}></div>
    
    <div class="modal-content" role="document">
      <div class="modal-header">
        <h2 id="add-sound-title">Adicionar Som</h2>
        <button class="close-btn" type="button" on:click={handleClose} aria-label="Fechar">✕</button>
      </div>
      
      <div class="modal-body">
        {#if error}
          <div class="error-message" role="alert">{error}</div>
        {/if}
        
        <div class="edit-section">
          <!-- Mode Selection -->
          <fieldset class="radio-group">
            <legend class="sr-only">Modo de som</legend>
            <label>
              <input type="radio" name="mode" value="simple" checked={mode === 'simple'} on:change={() => handleModeChange('simple')} />
              Simples
            </label>
            <label>
              <input type="radio" name="mode" value="random" checked={mode === 'random'} on:change={() => handleModeChange('random')} />
              Aleatório
            </label>
          </fieldset>
          
          <!-- Form Grid -->
          <div class="form-grid">
            <label>
              Tipo
              <select class="modern-select" bind:value={soundType}>
                {#each typeOptions as t}
                  <option value={t}>{t}</option>
                {/each}
              </select>
            </label>
            
            {#if mode === 'simple'}
              <label>
                ID do arquivo de som
                <input type="number" class="modern-input" bind:value={soundId} />
              </label>
            {:else}
              <label>
                IDs aleatórios (separados por vírgula)
                <input type="text" class="modern-input" bind:value={randomIds} placeholder="ex: 101, 102, 103" />
              </label>
            {/if}
          </div>
          
          <div class="form-grid">
            <label>
              Pitch Min
              <input type="number" step="0.01" class="modern-input" bind:value={pitchMin} />
            </label>
            <label>
              Pitch Max
              <input type="number" step="0.01" class="modern-input" bind:value={pitchMax} />
            </label>
          </div>
          
          <div class="form-grid">
            <label>
              Volume Min
              <input type="number" step="0.01" class="modern-input" bind:value={volumeMin} />
            </label>
            <label>
              Volume Max
              <input type="number" step="0.01" class="modern-input" bind:value={volumeMax} />
            </label>
          </div>
          
          <!-- Upload Section -->
          <div class="upload-section">
            <h4>Importar novo arquivo</h4>
            <div class="form-grid">
              <div class="file-select">
                <button type="button" class="btn-secondary" on:click={selectFile}>
                  Selecionar arquivo .ogg
                </button>
                <span class="file-name">{selectedFilePath || 'Nenhum arquivo selecionado'}</span>
              </div>
              <label class="checkbox-label">
                <input type="checkbox" bind:checked={isStream} />
                Stream
              </label>
              <label>
                ID (opcional)
                <input type="number" class="modern-input" bind:value={uploadId} />
              </label>
              <button type="button" class="btn-primary" on:click={handleImportAndAdd} disabled={uploading || !selectedFilePath}>
                {uploading ? 'Importando...' : 'Importar e adicionar'}
              </button>
            </div>
          </div>
          
          <!-- Sound Picker -->
          <div class="sound-picker">
            <div class="picker-controls">
              <input 
                type="text" 
                class="modern-input" 
                placeholder="Buscar por ID ou nome..." 
                bind:value={searchFilter}
                aria-label="Buscar sons"
              />
              <div class="picker-actions">
                <button type="button" class="btn-secondary" on:click={togglePlaySelected} aria-label={isPlaying ? 'Pausar' : 'Reproduzir todos'}>
                  {isPlaying ? 'Pausar' : 'Reproduzir todos'}
                </button>
                <button type="button" class="btn-secondary" on:click={clearSelection} aria-label="Limpar seleção">
                  Limpar
                </button>
              </div>
            </div>
            
            <!-- Selected Chips -->
            {#if selectedIds.length > 0}
              <div class="selected-chips">
                {#each selectedIds as id}
                  <button type="button" class="chip" on:click={() => removeSelected(id)} aria-label="Remover {id}">
                    {id}
                    <span class="chip-remove" aria-hidden="true">✕</span>
                  </button>
                {/each}
              </div>
            {/if}
            
            <!-- Sound List -->
            <div class="sound-list" role="listbox" aria-label="Lista de sons">
              {#if loading}
                <div class="loading">Carregando sons...</div>
              {:else}
                {#each filteredSounds as sound}
                  <div 
                    class="sound-item" 
                    class:selected={selectedIds.includes(sound.id)}
                    role="option" 
                    aria-selected={selectedIds.includes(sound.id)}
                  >
                    <span class="sound-id">{sound.id}</span>
                    <span class="sound-name" title={sound.filename}>{sound.filename}</span>
                    <div class="sound-actions">
                      <button type="button" class="btn-icon" on:click={() => playSingle(sound.id)} aria-label="Reproduzir {sound.id}">
                        ▶
                      </button>
                      <button type="button" class="btn-icon" on:click={() => selectSound(sound.id)} aria-label={mode === 'random' ? 'Adicionar' : 'Selecionar'}>
                        {mode === 'random' ? '+' : '✓'}
                      </button>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn-save" on:click={handleSave}>Salvar</button>
        <button type="button" class="btn-secondary" on:click={handleClose}>Cancelar</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .add-sound-modal {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
  }
  
  .modal-content {
    position: relative;
    background: var(--card-background, #1e1e2e);
    border-radius: 12px;
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color, #333);
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text-primary, #fff);
  }
  
  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary, #888);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    line-height: 1;
  }
  
  .close-btn:hover {
    color: var(--text-primary, #fff);
  }
  
  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }
  
  .modal-footer {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border-color, #333);
  }
  
  .error-message {
    background: var(--error-bg, #3d1f1f);
    color: var(--error-color, #ff6b6b);
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }
  
  .edit-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .radio-group {
    display: flex;
    gap: 1.5rem;
    border: none;
    padding: 0;
    margin: 0;
  }
  
  .radio-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--text-primary, #fff);
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }
  
  .form-grid label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: var(--text-secondary, #aaa);
    font-size: 0.875rem;
  }
  
  .modern-input, .modern-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color, #444);
    border-radius: 6px;
    background: var(--input-bg, #2a2a3e);
    color: var(--text-primary, #fff);
    font-size: 0.9rem;
  }
  
  .modern-input:focus, .modern-select:focus {
    outline: none;
    border-color: var(--accent-color, #6366f1);
  }
  
  .upload-section {
    background: var(--section-bg, #252535);
    padding: 1rem;
    border-radius: 8px;
    margin-top: 0.5rem;
  }
  
  .upload-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    color: var(--text-primary, #fff);
  }
  
  .file-select {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .file-name {
    font-size: 0.8rem;
    color: var(--text-secondary, #888);
    word-break: break-all;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary, #fff);
  }
  
  .sound-picker {
    margin-top: 1rem;
    border: 1px solid var(--border-color, #333);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .picker-controls {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--section-bg, #252535);
    border-bottom: 1px solid var(--border-color, #333);
  }
  
  .picker-controls input {
    flex: 1;
  }
  
  .picker-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--section-bg, #252535);
    border-bottom: 1px solid var(--border-color, #333);
  }
  
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--accent-color, #6366f1);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
  }
  
  .chip:hover {
    background: var(--accent-hover, #5558e3);
  }
  
  .chip-remove {
    font-size: 0.7rem;
  }
  
  .sound-list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .sound-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border-color, #2a2a3e);
  }
  
  .sound-item:hover {
    background: var(--hover-bg, #2a2a3e);
  }
  
  .sound-item.selected {
    background: var(--selected-bg, #3a3a5e);
  }
  
  .sound-id {
    font-weight: 600;
    color: var(--accent-color, #6366f1);
    min-width: 3rem;
  }
  
  .sound-name {
    flex: 1;
    color: var(--text-primary, #fff);
    font-size: 0.875rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .sound-actions {
    display: flex;
    gap: 0.25rem;
  }
  
  .btn-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--btn-secondary-bg, #3a3a4e);
    border: none;
    border-radius: 4px;
    color: var(--text-primary, #fff);
    cursor: pointer;
    font-size: 0.75rem;
  }
  
  .btn-icon:hover {
    background: var(--btn-secondary-hover, #4a4a5e);
  }
  
  .btn-primary, .btn-secondary, .btn-save {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }
  
  .btn-primary, .btn-save {
    background: var(--accent-color, #6366f1);
    color: white;
  }
  
  .btn-primary:hover, .btn-save:hover {
    background: var(--accent-hover, #5558e3);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: var(--btn-secondary-bg, #3a3a4e);
    color: var(--text-primary, #fff);
  }
  
  .btn-secondary:hover {
    background: var(--btn-secondary-hover, #4a4a5e);
  }
  
  .loading {
    padding: 2rem;
    text-align: center;
    color: var(--text-secondary, #888);
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }
</style>
