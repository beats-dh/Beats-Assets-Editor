import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { SOUND_TYPES, type SoundInfo } from './soundTypes';
import { showAssetDetails } from './assetDetails';

// Estado da sequência de reprodução na modal (para cancelamento ao fechar)
let pickerSequenceAbort = false;
let pickerSequenceToken = 0; // invalida chamadas concorrentes/reentrantes

function renderAddSoundForm(): void {
  const content = document.getElementById('add-sound-content');
  if (!content) return;

  const typeOptions = SOUND_TYPES || [
    'Unknown','Spell Attack','Spell Healing','Spell Support','Weapon Attack','Creature Noise','Creature Death','Creature Attack','Ambience Stream','Food and Drink','Item Movement','Event','UI','Whisper','Chat Message','Party','VIP List','Raid Announcement','Server Message','Spell Generic'
  ];

  content.innerHTML = `
    <div class="edit-section">
      <div id="add-sound-error" role="alert" aria-live="polite" style="display:none;color:var(--error-color);margin-bottom:var(--space-sm);"></div>
      <fieldset class="radio-group" style="margin-bottom:var(--space-sm);justify-content:flex-end;">
        <legend class="sr-only">Modo de som</legend>
        <label><input type="radio" name="add-se-mode" value="simple" checked /> Simples</label>
        <label><input type="radio" name="add-se-mode" value="random" /> Aleatório</label>
      </fieldset>
      <div class="form-grid">
        <label for="add-sound-type">Tipo
          <select id="add-sound-type" class="modern-select">
            ${typeOptions.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </label>
        <label for="add-sound-id">ID do arquivo de som
          <input id="add-sound-id" class="modern-input" type="number" />
        </label>
        <label for="add-random-ids">IDs aleatórios (separados por vírgula)
          <input id="add-random-ids" class="modern-input" type="text" placeholder="ex: 101, 102, 103" />
        </label>
      </div>
      <div class="form-grid">
        <label for="add-random-pitch-min">Pitch Min
          <input id="add-random-pitch-min" class="modern-input" type="number" step="0.01" />
        </label>
        <label for="add-random-pitch-max">Pitch Max
          <input id="add-random-pitch-max" class="modern-input" type="number" step="0.01" />
        </label>
      </div>
      <div class="form-grid">
        <label for="add-random-volume-min">Volume Min
          <input id="add-random-volume-min" class="modern-input" type="number" step="0.01" />
        </label>
        <label for="add-random-volume-max">Volume Max
          <input id="add-random-volume-max" class="modern-input" type="number" step="0.01" />
        </label>
      </div>
      <div id="upload-sound-section" class="edit-subsection" aria-label="Adicionar novo som">
        <div class="form-grid">
          <div style="display:flex;flex-direction:column;gap:var(--space-xs);">
            <span style="color:var(--text-primary);font-size:0.9rem;font-weight:500;">Arquivo</span>
            <button id="upload-select-file" type="button" class="btn-secondary">Selecionar arquivo .ogg</button>
            <div id="upload-selected-file" class="small-note" aria-live="polite">Nenhum arquivo selecionado</div>
          </div>
          <label for="upload-is-stream" class="checkbox-toggle">
            <input id="upload-is-stream" type="checkbox" />
            <span>Stream</span>
          </label>
          <label for="upload-id">ID (opcional)
            <input id="upload-id" class="modern-input" type="number" inputmode="numeric" />
          </label>
          <div style="display:flex;flex-direction:column;gap:var(--space-xs);">
            <span style="color:transparent;font-size:0.9rem;font-weight:500;visibility:hidden;">Ação</span>
            <button id="upload-import-add" type="button" class="btn-primary">Importar e adicionar</button>
          </div>
        </div>
      </div>
      <div id="sound-picker" class="sound-picker" aria-label="Selecionar IDs de áudio" style="display:none">
        <div class="picker-controls">
          <input id="sound-picker-search" class="modern-input" type="text" placeholder="Buscar por ID ou nome..." aria-label="Buscar ID ou nome" />
          <div class="picker-actions">
            <button id="picker-play-selected" type="button" class="btn-secondary" aria-label="Reproduzir todos">Reproduzir todos</button>
            <button id="picker-clear-selected" type="button" class="btn-secondary" aria-label="Limpar seleção">Limpar seleção</button>
          </div>
        </div>
        <div id="sound-picker-selected" class="selected-chips" aria-live="polite"></div>
        <div id="sound-picker-list" class="sound-picker-list" role="listbox" aria-label="Lista de sons"></div>
      </div>
      <div class="edit-actions">
        <button id="add-sound-save" class="btn-save" aria-label="Salvar novo som">Salvar</button>
        <button id="add-sound-cancel" class="btn-secondary" aria-label="Cancelar e fechar">Cancelar</button>
      </div>
    </div>
  `;

  const modeInputs = Array.from(document.querySelectorAll('input[name="add-se-mode"]')) as HTMLInputElement[];
  const errorEl = document.getElementById('add-sound-error') as HTMLElement | null;
  const soundIdEl = document.getElementById('add-sound-id') as HTMLInputElement | null;
  const randomIdsEl = document.getElementById('add-random-ids') as HTMLInputElement | null;
  const picker = document.getElementById('sound-picker') as HTMLElement | null;
  const pickerList = document.getElementById('sound-picker-list') as HTMLElement | null;
  const pickerSelected = document.getElementById('sound-picker-selected') as HTMLElement | null;
  const pickerSearch = document.getElementById('sound-picker-search') as HTMLInputElement | null;
  const playSelectedBtn = document.getElementById('picker-play-selected') as HTMLButtonElement | null;
  const clearSelectedBtn = document.getElementById('picker-clear-selected') as HTMLButtonElement | null;

  let allSounds: SoundInfo[] = [];
  let selectedIds: number[] = [];
  let pickerMode: 'simple' | 'random' = 'simple';
  let headlessAudio: HTMLAudioElement | null = null;
  let isPlayingAny = false;
  // Utilizamos a flag global pickerSequenceAbort para controlar cancelamento da sequência

  const ensureSoundsLoaded = async (): Promise<void> => {
    if (allSounds.length > 0) return;
    try {
      const result = await invoke<SoundInfo[]>('list_all_sounds');
      allSounds = (result || []).sort((a, b) => a.id - b.id);
    } catch (e) {
      console.error('Falha ao carregar lista de sons:', e);
    }
  };

  const refreshSounds = async (): Promise<void> => {
    try {
      const result = await invoke<SoundInfo[]>('list_all_sounds');
      allSounds = (result || []).sort((a, b) => a.id - b.id);
    } catch (e) {
      console.error('Falha ao atualizar lista de sons:', e);
    }
  };

  const renderSelectedChips = (): void => {
    if (!pickerSelected) return;
    if (selectedIds.length === 0) {
      pickerSelected.innerHTML = '';
      return;
    }
    pickerSelected.innerHTML = selectedIds
      .map(id => `<button type="button" class="chip" data-id="${id}" aria-label="Remover ${id}">${id}<span class="chip-remove" aria-hidden="true">✕</span></button>`)
      .join('');
    pickerSelected.querySelectorAll('.chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const idStr = (btn as HTMLElement).dataset.id;
        const id = idStr ? parseInt(idStr, 10) : NaN;
        if (!isNaN(id)) {
          selectedIds = selectedIds.filter(x => x !== id);
          renderSelectedChips();
          if (pickerMode === 'random' && randomIdsEl) {
            randomIdsEl.value = selectedIds.join(',');
          }
          if (pickerMode === 'simple' && soundIdEl) {
            soundIdEl.value = selectedIds[0] ? String(selectedIds[0]) : '';
          }
        }
      });
    });
  };

  const stopCurrentAudio = (): void => {
    if (headlessAudio) {
      try { headlessAudio.pause(); } catch {}
      headlessAudio.src = '';
    }
    headlessAudio = null;
  };
  // expõe parada do áudio para uso em outras partes (ex.: closeAddSoundModal)
  (window as any).stopCurrentAudio = stopCurrentAudio;

  const updatePlaySelectedState = (playing: boolean): void => {
    isPlayingAny = playing;
    if (playSelectedBtn) {
      playSelectedBtn.textContent = playing ? 'Pausar reprodução' : 'Reproduzir todos';
      playSelectedBtn.setAttribute('aria-label', playing ? 'Pausar reprodução' : 'Reproduzir todos');
    }
  };

  const playSingle = async (id: number): Promise<void> => {
    try {
      pickerSequenceAbort = true; // interrompe qualquer sequência em andamento
      stopCurrentAudio();
      const audioData = await invoke<string>('get_sound_audio_data', { soundId: id });
      const audio = new Audio(`data:audio/ogg;base64,${audioData}`);
      audio.preload = 'auto';
      headlessAudio = audio;
      updatePlaySelectedState(true);
      audio.addEventListener('ended', () => { stopCurrentAudio(); updatePlaySelectedState(false); });
      audio.addEventListener('error', () => { stopCurrentAudio(); updatePlaySelectedState(false); });
      const startPlayback = () => { audio.play().catch(() => {}); };
      audio.addEventListener('canplay', startPlayback, { once: true });
      // fallback imediato, caso o evento não dispare
      void audio.play().catch(() => {});
    } catch (err) {
      console.error('Falha ao reproduzir som', id, err);
      updatePlaySelectedState(false);
    }
  };

  const playSequence = async (ids: number[]): Promise<void> => {
    if (!ids || ids.length === 0) return;
    const myToken = ++pickerSequenceToken;
    pickerSequenceAbort = false;
    updatePlaySelectedState(true);
    let idx = 0;
    // Garante que nada anterior siga tocando antes de iniciar a sequência
    stopCurrentAudio();
    const next = async (): Promise<void> => {
      if (pickerSequenceAbort || myToken !== pickerSequenceToken || idx >= ids.length) {
        stopCurrentAudio();
        updatePlaySelectedState(false);
        return;
      }
      const id = ids[idx++];
      try {
        const audioData = await invoke<string>('get_sound_audio_data', { soundId: id });
        const audio = new Audio(`data:audio/ogg;base64,${audioData}`);
        audio.preload = 'auto';
        headlessAudio = audio;
        const onEndedOrError = () => {
          // Evita reentrada de sequência antiga
          if (pickerSequenceAbort || myToken !== pickerSequenceToken) return;
          void next();
        };
        audio.addEventListener('ended', onEndedOrError, { once: true });
        audio.addEventListener('error', onEndedOrError, { once: true });
        // tenta reproduzir imediatamente; se falhar, avance para o próximo
        const tryPlay = () => {
          const p = audio.play();
          if (p && typeof p.catch === 'function') {
            p.catch((err: any) => {
              console.warn('Falha ao dar play() no áudio da sequência, avançando...', err);
              onEndedOrError();
            });
          }
        };
        audio.addEventListener('canplay', () => { tryPlay(); }, { once: true });
        tryPlay();
      } catch (e) {
        console.error('Falha no áudio da sequência', id, e);
        await next();
      }
    };
    await next();
  };

  const renderPickerList = (filter = ''): void => {
    if (!pickerList) return;
    const f = filter.trim().toLowerCase();
    const items = allSounds.filter(s =>
      f === '' || String(s.id).includes(f) || (s.filename || '').toLowerCase().includes(f)
    );
    pickerList.innerHTML = items.map(s => `
      <div class="sound-picker-item" data-id="${s.id}" role="option" aria-selected="${selectedIds.includes(s.id) ? 'true' : 'false'}">
        <span class="sp-id">${s.id}</span>
        <span class="sp-name" title="${s.filename}">${s.filename}</span>
        <div class="sp-buttons">
          <button type="button" class="sp-play" aria-label="Reproduzir ${s.id}">▶</button>
          <button type="button" class="sp-add" aria-label="${pickerMode === 'random' ? 'Adicionar' : 'Selecionar'} ${s.id}">${pickerMode === 'random' ? 'Adicionar' : 'Selecionar'}</button>
        </div>
      </div>
    `).join('');

    pickerList.querySelectorAll('.sp-play').forEach(btn => {
      btn.addEventListener('click', () => {
        const idStr = (btn.closest('.sound-picker-item') as HTMLElement)?.dataset.id;
        const id = idStr ? parseInt(idStr, 10) : NaN;
        if (!isNaN(id)) playSingle(id);
      });
    });
    pickerList.querySelectorAll('.sp-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const idStr = (btn.closest('.sound-picker-item') as HTMLElement)?.dataset.id;
        const id = idStr ? parseInt(idStr, 10) : NaN;
        if (isNaN(id)) return;
        if (pickerMode === 'random') {
          if (!selectedIds.includes(id)) selectedIds.push(id);
          renderSelectedChips();
          if (randomIdsEl) randomIdsEl.value = selectedIds.join(',');
        } else {
          selectedIds = [id];
          renderSelectedChips();
          if (soundIdEl) soundIdEl.value = String(id);
        }
      });
    });
  };

  const showPicker = async (mode: 'simple'|'random'): Promise<void> => {
    pickerMode = mode;
    await ensureSoundsLoaded();
    if (!picker) return;
    picker.style.display = '';
    renderPickerList(pickerSearch?.value || '');
    renderSelectedChips();
  };

  // Toggle visibility based on mode
  const updateModeVisibility = () => {
    const mode = (modeInputs.find(i => i.checked)?.value) || 'simple';
    if (soundIdEl && randomIdsEl) {
      if (mode === 'simple') {
        soundIdEl.parentElement!.style.display = '';
        randomIdsEl.parentElement!.style.display = 'none';
        showPicker('simple');
      } else {
        soundIdEl.parentElement!.style.display = 'none';
        randomIdsEl.parentElement!.style.display = '';
        showPicker('random');
      }
    }
  };

  // Upload new sound flow
  const selectBtn = document.getElementById('upload-select-file') as HTMLButtonElement | null;
  const selectedFileEl = document.getElementById('upload-selected-file') as HTMLElement | null;
  const uploadIdEl = document.getElementById('upload-id') as HTMLInputElement | null;
  const isStreamEl = document.getElementById('upload-is-stream') as HTMLInputElement | null;
  const importAddBtn = document.getElementById('upload-import-add') as HTMLButtonElement | null;

  let selectedSourcePath: string | null = null;

  selectBtn?.addEventListener('click', async () => {
    try {
      const file = await openDialog({ multiple: false, filters: [{ name: 'Audio', extensions: ['ogg'] }] });
      if (typeof file === 'string' && file.length > 0) {
        selectedSourcePath = file;
        selectedFileEl && (selectedFileEl.textContent = file);

        // Apenas aceitar OGG
        const base = file.split(/\\|\//).pop() || 'sound.ogg';
        const ext = (base.split('.').pop() || '').toLowerCase();
        if (ext !== 'ogg') {
          if (errorEl) { errorEl.style.display = ''; errorEl.textContent = 'Formato não suportado. Selecione um arquivo .ogg.'; }
          if (importAddBtn) importAddBtn.disabled = true;
        } else {
          if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
          if (importAddBtn) importAddBtn.disabled = false;
        }
      }
    } catch (e) {
      console.error('Falha ao selecionar arquivo:', e);
    }
  });

  importAddBtn?.addEventListener('click', async () => {
    try {
      if (!selectedSourcePath) {
        if (errorEl) { errorEl.style.display = ''; errorEl.textContent = 'Selecione um arquivo .ogg primeiro.'; }
        return;
      }
      if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
      importAddBtn.disabled = true;

      const destFilename = undefined;
      const isStream = !!isStreamEl?.checked;
      const idVal = uploadIdEl?.value ? Number(uploadIdEl.value) : undefined;

      const created = await invoke<SoundInfo>('import_and_add_sound', {
        sourcePath: selectedSourcePath,
        destFilename,
        isStream,
        id: idVal,
      });

      // Update local list and selection
      await refreshSounds();
      renderPickerList(pickerSearch?.value || '');

      // Auto-select the created sound id based on current mode
      if (created && typeof created.id === 'number') {
        if (pickerMode === 'random') {
          if (!selectedIds.includes(created.id)) selectedIds.push(created.id);
          randomIdsEl && (randomIdsEl.value = selectedIds.join(','));
        } else {
          selectedIds = [created.id];
          soundIdEl && (soundIdEl.value = String(created.id));
        }
        renderSelectedChips();
      }

      // Feedback
      selectedSourcePath = null;
      selectedFileEl && (selectedFileEl.textContent = 'Nenhum arquivo selecionado');
      if (uploadIdEl) uploadIdEl.value = '';
      if (isStreamEl) isStreamEl.checked = false;
    } catch (e) {
      console.error('Falha ao importar/adicionar som:', e);
      if (errorEl) { errorEl.style.display = ''; errorEl.textContent = `Erro ao importar/adicionar: ${e}`; }
    } finally {
      importAddBtn && (importAddBtn.disabled = false);
    }
  });
  modeInputs.forEach(i => i.addEventListener('change', updateModeVisibility));
  updateModeVisibility();

  // Abrir seletor ao focar no input correspondente
  soundIdEl?.addEventListener('focus', () => showPicker('simple'));
  randomIdsEl?.addEventListener('focus', () => showPicker('random'));
  pickerSearch?.addEventListener('input', () => renderPickerList(pickerSearch.value));
  playSelectedBtn?.addEventListener('click', async () => {
    // Toggle: se está tocando, pausa; senão, inicia reprodução
    if (isPlayingAny) {
      pickerSequenceAbort = true;
      pickerSequenceToken++; // invalida sequência corrente
      stopCurrentAudio();
      updatePlaySelectedState(false);
      return;
    }
    if (pickerMode === 'random') {
      await playSequence(selectedIds.slice());
    } else if (soundIdEl?.value) {
      const id = parseInt(soundIdEl.value, 10);
      if (!isNaN(id)) await playSingle(id);
    }
  });
  clearSelectedBtn?.addEventListener('click', () => {
    selectedIds = [];
    renderSelectedChips();
    if (randomIdsEl) randomIdsEl.value = '';
    if (soundIdEl) soundIdEl.value = '';
  });
}

function trapFocus(modal: HTMLElement) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeAddSoundModal();
    } else if (e.key === 'Tab') {
      const focusables = Array.from(modal.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.hasAttribute('disabled'));
      if (focusables.length) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  };
  document.addEventListener('keydown', onKeyDown);
  return () => document.removeEventListener('keydown', onKeyDown);
}

let removeTrap: (() => void) | null = null;

export function openAddSoundModal(): void {
  const modal = document.getElementById('add-sound-modal') as HTMLElement | null;
  const content = document.getElementById('add-sound-content') as HTMLElement | null;
  const closeBtn = document.getElementById('close-add-sound') as HTMLButtonElement | null;
  if (!modal || !content) return;

  renderAddSoundForm();

  modal.style.display = 'flex';
  modal.classList.add('show');
  const firstField = document.getElementById('add-sound-type') as HTMLSelectElement | null;
  firstField?.focus();

  removeTrap = trapFocus(modal);

  const saveBtn = document.getElementById('add-sound-save') as HTMLButtonElement | null;
  const cancelBtn = document.getElementById('add-sound-cancel') as HTMLButtonElement | null;
  const errorEl = document.getElementById('add-sound-error') as HTMLElement | null;

  const onSave = async () => {
    try {
      if (saveBtn) saveBtn.disabled = true;
      if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }

      const typeEl = document.getElementById('add-sound-type') as HTMLSelectElement | null;
      const modeEl = document.querySelector('input[name="add-se-mode"]:checked') as HTMLInputElement | null;
      const soundIdEl = document.getElementById('add-sound-id') as HTMLInputElement | null;
      const randomIdsEl = document.getElementById('add-random-ids') as HTMLInputElement | null;
      const rpmEl = document.getElementById('add-random-pitch-min') as HTMLInputElement | null;
      const rpxEl = document.getElementById('add-random-pitch-max') as HTMLInputElement | null;
      const rvmEl = document.getElementById('add-random-volume-min') as HTMLInputElement | null;
      const rvxEl = document.getElementById('add-random-volume-max') as HTMLInputElement | null;

      const chosenType = typeEl?.value || 'Unknown';
      const mode = modeEl?.value || 'simple';
      const parsedRandomIds = (randomIdsEl?.value || '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => Number(s));

      const info: any = {
        id: 0,
        sound_type: chosenType,
        sound_id: undefined,
        random_sound_ids: undefined,
        random_pitch_min: rpmEl?.value ? Number(rpmEl.value) : undefined,
        random_pitch_max: rpxEl?.value ? Number(rpxEl.value) : undefined,
        random_volume_min: rvmEl?.value ? Number(rvmEl.value) : undefined,
        random_volume_max: rvxEl?.value ? Number(rvxEl.value) : undefined,
      };

      if (mode === 'simple') {
        info.sound_id = soundIdEl?.value ? Number(soundIdEl.value) : undefined;
        info.random_sound_ids = [];
      } else {
        info.sound_id = undefined;
        info.random_sound_ids = parsedRandomIds;
      }

      const newId = await invoke('add_numeric_sound_effect', { info }) as number;
      await invoke('save_sounds_file');
      closeAddSoundModal();
      await showAssetDetails('Sounds', newId);
    } catch (err) {
      console.error('Failed to add sound effect', err);
      if (errorEl) {
        errorEl.textContent = 'Falha ao adicionar som. Veja o console para detalhes.';
        errorEl.style.display = '';
      } else {
        alert('Falha ao adicionar som. Veja o console para detalhes.');
      }
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  };

  const onCancel = () => closeAddSoundModal();
  saveBtn?.addEventListener('click', onSave);
  cancelBtn?.addEventListener('click', onCancel);
  closeBtn?.addEventListener('click', onCancel);
  const backdrop = modal.querySelector('.modal-backdrop') as HTMLElement | null;
  backdrop?.addEventListener('click', onCancel);
}

export function closeAddSoundModal(): void {
  const modal = document.getElementById('add-sound-modal') as HTMLElement | null;
  if (modal) {
    // interrompe qualquer reprodução em andamento na modal
    try {
      // pausa áudio headless se existir
      // @ts-ignore accessing closure variable via window for safety if needed
      if (typeof (window as any).stopCurrentAudio === 'function') {
        (window as any).stopCurrentAudio();
      }
    } catch {}
    pickerSequenceAbort = true;
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
  if (removeTrap) { removeTrap(); removeTrap = null; }
}
