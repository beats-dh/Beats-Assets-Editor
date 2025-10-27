import { invoke } from '@tauri-apps/api/core';
import type { CompleteAppearanceItem, CompleteFlags } from './types';
import { getVocationOptionsHTML, getFlagBool } from './utils';
import { getAppearanceSprites } from './spriteCache';
import { stopDetailAnimationPlayers, initAnimationPlayersForDetails, initDetailSpriteCardAnimations } from './animation';
import { renderTextureTab } from './textureTab';

// Current appearance being displayed
let currentAppearanceDetails: CompleteAppearanceItem | null = null;

// DOM references
let assetDetails: HTMLElement | null = null;
let detailsContent: HTMLElement | null = null;

export function initAssetDetailsElements(): void {
  assetDetails = document.querySelector('#asset-details');
  detailsContent = document.querySelector('#details-content');
}

export function getCurrentAppearanceDetails(): CompleteAppearanceItem | null {
  return currentAppearanceDetails;
}

export function setCurrentAppearanceDetails(details: CompleteAppearanceItem | null): void {
  currentAppearanceDetails = details;
}

export async function showAssetDetails(category: string, id: number): Promise<void> {
  console.log(`showAssetDetails called with category: ${category}, id: ${id}`);

  // Ensure modal elements are initialized
  if (!assetDetails || !detailsContent) {
    initAssetDetailsElements();
  }

  if (!assetDetails || !detailsContent) {
    console.error('assetDetails or detailsContent is null');
    return;
  }

  if (category === 'Sounds') {
    await showSoundDetails(id);
  } else {
    await showAppearanceDetails(category, id);
  }
}

document.addEventListener('texture-settings-saved', async (event: Event) => {
  const custom = event as CustomEvent<{ category: string; id: number }>;
  const detail = custom.detail;
  if (!detail) return;
  try {
    await showAssetDetails(detail.category, detail.id);
  } catch (err) {
    console.error('Failed to refresh asset details after texture save', err);
  }
});

async function showSoundDetails(id: number): Promise<void> {
  try {
    if (!assetDetails || !detailsContent) {
      console.error('assetDetails or detailsContent is null');
      return;
    }
    // Determine current sound subcategory from UI
    const subSelect = document.getElementById('subcategory-select') as HTMLSelectElement | null;
    const sub = subSelect?.value || 'All';

    if (sub === 'Ambience Streams') {
      console.log('Loading ambience stream details...');
      const stream = await invoke('get_ambience_stream_by_id', { id });
      await displayAmbienceStreamDetails(stream as any, id);
    } else if (sub === 'Ambience Object Streams') {
      console.log('Loading ambience object stream details...');
      const objStream = await invoke('get_ambience_object_stream_by_id', { id });
      await displayAmbienceObjectStreamDetails(objStream as any, id);
    } else if (sub === 'Music Templates') {
      console.log('Loading music template details...');
      const tmpl = await invoke('get_music_template_by_id', { id });
      await displayMusicTemplateDetails(tmpl as any, id);
    } else {
      // Numeric sound effect details by ID
      console.log('Loading sound effect details...');
      const soundData = await invoke('get_numeric_sound_effect_by_id', { id });
      console.log('Received sound effect data:', soundData);
      await displaySoundDetails(soundData as any, id);
    }

    // Ensure tabs visible for Sounds; default to Details active
    const editContainer = document.getElementById('edit-content');
    const detailsContainer = document.getElementById('details-content');
    const tabEdit = document.getElementById('tab-edit');
    const tabDetails = document.getElementById('tab-details');

    if (tabEdit) {
      tabEdit.style.display = '';
      tabEdit.classList.remove('active');
      tabEdit.textContent = 'Edit';
    }
    if (tabDetails) {
      tabDetails.classList.add('active');
      tabDetails.textContent = 'Sound Details';
    }
    if (editContainer && detailsContainer) {
      editContainer.style.display = 'none';
      detailsContainer.style.display = 'block';
    }

    // Force display the modal
    const modal = assetDetails as HTMLElement;
    modal.style.display = 'flex';
    modal.classList.add('show');
    console.log('Sound modal should now be visible');
  } catch (error) {
    console.error('Error loading sound details:', error);
  }
}

async function showAppearanceDetails(category: string, id: number): Promise<void> {
  try {
    if (!assetDetails || !detailsContent) {
      console.error('assetDetails or detailsContent is null');
      return;
    }
    // Handle appearances (existing logic)
    console.log('Invoking get_complete_appearance...');
    const completeData = await invoke('get_complete_appearance', {
      category,
      id
    }) as CompleteAppearanceItem;

    console.log('Received complete data:', completeData);
    currentAppearanceDetails = completeData;
    await displayCompleteAssetDetails(completeData, category);

    // Ensure tabs are correct for Objects (Edit visible)
    const editContainer = document.getElementById('edit-content');
    const detailsContainer = document.getElementById('details-content');
    const tabEdit = document.getElementById('tab-edit');
    const tabDetails = document.getElementById('tab-details');

    if (tabEdit) {
      tabEdit.style.display = '';
      tabEdit.classList.remove('active');
      tabEdit.textContent = 'Edit';
    }
    if (tabDetails) {
      tabDetails.classList.add('active');
      tabDetails.textContent = 'Asset Details';
    }
    if (editContainer && detailsContainer) {
      editContainer.style.display = 'none';
      detailsContainer.style.display = 'block';
    }

    // Force display the modal
    const modal = assetDetails as HTMLElement;
    modal.style.display = 'flex';
    modal.classList.add('show');
    console.log('Modal display:', window.getComputedStyle(modal).display);
    console.log('Modal should now be visible');

    // Initialize animation players per frame group
    await initAnimationPlayersForDetails(completeData, category);

    // Load sprites for this specific item
    await loadDetailSprites(category, id);
  } catch (error) {
    console.error('Error loading appearance details:', error);
  }
}

export async function loadDetailSprites(category: string, id: number): Promise<void> {
  try {
    const sprites = await getAppearanceSprites(category, id);
    const container = document.getElementById(`detail-sprites-${id}`);

    if (container) {
      if (sprites.length > 0) {
        container.innerHTML = `
          <div class="detail-sprites-grid">
            ${sprites.map((sprite, index) => `
              <div class="detail-sprite-item" data-agg-index="${index}">
                <img src="data:image/png;base64,${sprite}" class="detail-sprite-image" alt="Sprite ${index + 1}">
                <span class="sprite-index">#${index + 1}</span>
              </div>
            `).join('')}
          </div>
        `;
        // Initialize click-to-animate on sprite cards
        initDetailSpriteCardAnimations(id, sprites, currentAppearanceDetails);
      } else {
        container.innerHTML = `
          <div class="no-sprites">
            <div class="sprite-placeholder"></div>
            <span>No sprites available</span>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error(`Failed to load detail sprites for ${category} ${id}:`, error);
    const container = document.getElementById(`detail-sprites-${id}`);
    if (container) {
      container.innerHTML = `
        <div class="sprite-error">
          <span>❌ Failed to load sprites</span>
        </div>
      `;
    }
  }
}

async function displaySoundDetails(sound: any, soundId: number): Promise<void> {
  if (!detailsContent) return;

  const soundType = sound.sound_type || 'Unknown';
  const hasRandomSounds = sound.random_sound_ids && sound.random_sound_ids.length > 0;
  const primarySoundId: number | undefined = (sound.sound_id !== null && sound.sound_id !== undefined)
    ? sound.sound_id
    : (hasRandomSounds ? sound.random_sound_ids[0] : undefined);
  const hasPlayable = primarySoundId !== undefined;

  let html = `
    <div class="asset-details-header">
      <div class="detail-header-left">
        <div class="detail-icon">🔊</div>
        <div class="detail-title-group">
          <h2>Sound Effect #${soundId}</h2>
          <p class="detail-subtitle">${soundType}</p>
        </div>
      </div>
    </div>

    <div class="details-section">
      <h3>Basic Information</h3>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Sound ID:</span>
          <span class="detail-value">#${soundId}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${soundType}</span>
        </div>
  `;

  if (hasPlayable) {
    html += `
        <div class="detail-item">
          <span class="detail-label">Primary Sound ID:</span>
          <span class="detail-value">${primarySoundId}</span>
        </div>
    `;
  }

  if (hasRandomSounds) {
    html += `
        <div class="detail-item">
          <span class="detail-label">Random Sounds:</span>
          <span class="detail-value">
            <div class="random-sounds-controls">
              ${sound.random_sound_ids.map((rid: number) => `
                <button class="random-sound-btn" data-effect-id="${soundId}" data-sound-id="${rid}" title="Play ${rid}">▶ ${rid}</button>
              `).join(' ')}
              <button class="random-sounds-playall-btn" data-effect-id="${soundId}" title="Play all random sounds">▶ Play All</button>
            </div>
          </span>
        </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  // Randomization properties (real fields)
  const hasRandomization =
    (sound.random_pitch_min != null && sound.random_pitch_max != null) ||
    (sound.random_volume_min != null && sound.random_volume_max != null);

  if (hasRandomization) {
    html += `
      <div class="details-section">
        <h3>Randomization</h3>
        <div class="details-grid">
    `;

    if (sound.random_pitch_min != null && sound.random_pitch_max != null) {
      html += `
          <div class="detail-item">
            <span class="detail-label">Random Pitch:</span>
            <span class="detail-value">${sound.random_pitch_min} – ${sound.random_pitch_max}</span>
          </div>
      `;
    }

    if (sound.random_volume_min != null && sound.random_volume_max != null) {
      html += `
          <div class="detail-item">
            <span class="detail-label">Random Volume:</span>
            <span class="detail-value">${sound.random_volume_min} – ${sound.random_volume_max}</span>
          </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
  }

  // Audio player section
  if (hasPlayable) {
    html += `
      <div class="details-section">
        <h3>Audio Preview</h3>
        <div id="sound-audio-player-${soundId}" class="sound-audio-container">
          <div class="loading-audio">Loading audio...</div>
        </div>
      </div>
    `;
  }

  detailsContent.innerHTML = html;

  // Wire random sound buttons
  if (hasRandomSounds) {
    const randomButtons = Array.from(document.querySelectorAll(`.random-sound-btn[data-effect-id="${soundId}"]`)) as HTMLButtonElement[];
    randomButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const ridStr = btn.getAttribute('data-sound-id');
        const rid = ridStr ? parseInt(ridStr, 10) : NaN;
        if (!isNaN(rid)) {
          loadAudioPlayer(rid, soundId, true);
        }
      });
    });

    const playAllBtn = document.querySelector(`.random-sounds-playall-btn[data-effect-id="${soundId}"]`) as HTMLButtonElement | null;
    if (playAllBtn) {
      playAllBtn.addEventListener('click', () => {
        const ids: number[] = Array.isArray(sound.random_sound_ids) ? sound.random_sound_ids : [];
        playRandomSequence(ids, soundId);
      });
    }
  }

  // Load and display audio player
  if (hasPlayable && primarySoundId !== undefined) {
    loadAudioPlayer(primarySoundId, soundId);
  }

  // Render edit form for numeric sound effect
  renderSoundEffectEdit(sound, soundId);
}

// Render edit form: Numeric Sound Effect
function renderSoundEffectEdit(sound: any, soundId: number): void {
  const editContent = document.getElementById('edit-content');
  const tabEdit = document.getElementById('tab-edit');
  const tabDetails = document.getElementById('tab-details');
  if (!editContent) return;

  const typeOptions = [
    'Unknown','Spell Attack','Spell Healing','Spell Support','Weapon Attack','Creature Noise','Creature Death','Creature Attack','Ambience Stream','Food and Drink','Item Movement','Event','UI','Whisper','Chat Message','Party','VIP List','Raid Announcement','Server Message','Spell Generic'
  ];

  const currentType = sound.sound_type || 'Unknown';
  const modeSimple = sound.sound_id != null;
  const randomIds = Array.isArray(sound.random_sound_ids) ? sound.random_sound_ids.join(',') : '';

  editContent.innerHTML = `
    <div class="edit-section">
      <h3>Editar Sound Effect</h3>
      <div class="form-grid">
        <label>Tipo
          <select id="se-sound-type">
            ${typeOptions.map(t => `<option value="${t}" ${t === currentType ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </label>
        <label>Modo
          <div class="radio-group">
            <label><input type="radio" name="se-mode" value="simple" ${modeSimple ? 'checked' : ''}/> Simple</label>
            <label><input type="radio" name="se-mode" value="random" ${!modeSimple ? 'checked' : ''}/> Random</label>
          </div>
        </label>
        <label>Sound ID
          <input id="se-sound-id" type="number" value="${sound.sound_id ?? ''}" />
        </label>
        <label>Random IDs (comma)
          <input id="se-random-ids" type="text" value="${randomIds}" placeholder="e.g. 101,102,103" />
        </label>
        <label>Pitch Min
          <input id="se-random-pitch-min" type="number" step="0.01" value="${sound.random_pitch_min ?? ''}" />
        </label>
        <label>Pitch Max
          <input id="se-random-pitch-max" type="number" step="0.01" value="${sound.random_pitch_max ?? ''}" />
        </label>
        <label>Volume Min
          <input id="se-random-volume-min" type="number" step="0.01" value="${sound.random_volume_min ?? ''}" />
        </label>
        <label>Volume Max
          <input id="se-random-volume-max" type="number" step="0.01" value="${sound.random_volume_max ?? ''}" />
        </label>
      </div>
      <div class="edit-actions">
        <button id="save-sound-effect" data-sound-effect-id="${soundId}" class="primary-btn">Salvar</button>
      </div>
    </div>
  `;

  // Ensure Edit tab visible
  if (tabEdit) {
    tabEdit.style.display = '';
    tabEdit.textContent = 'Edit';
  }
  if (tabDetails) {
    tabDetails.textContent = 'Sound Details';
  }

  const saveBtn = document.getElementById('save-sound-effect');
  saveBtn?.addEventListener('click', async () => {
    try {
      const typeEl = document.getElementById('se-sound-type') as HTMLSelectElement | null;
      const modeEl = document.querySelector('input[name="se-mode"]:checked') as HTMLInputElement | null;
      const soundIdEl = document.getElementById('se-sound-id') as HTMLInputElement | null;
      const randomIdsEl = document.getElementById('se-random-ids') as HTMLInputElement | null;
      const rpmEl = document.getElementById('se-random-pitch-min') as HTMLInputElement | null;
      const rpxEl = document.getElementById('se-random-pitch-max') as HTMLInputElement | null;
      const rvmEl = document.getElementById('se-random-volume-min') as HTMLInputElement | null;
      const rvxEl = document.getElementById('se-random-volume-max') as HTMLInputElement | null;

      const chosenType = typeEl?.value || 'Unknown';
      const mode = modeEl?.value || 'simple';
      const parsedRandomIds = (randomIdsEl?.value || '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => Number(s));

      const info: any = {
        id: soundId,
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

      await invoke('update_numeric_sound_effect', { info });
      await invoke('save_sounds_file');
      // Refresh details
      await showAssetDetails('Sounds', soundId);
    } catch (err) {
      console.error('Failed to save sound effect', err);
      alert('Failed to save sound effect. See console for details.');
    }
  });
}

async function displayAmbienceStreamDetails(stream: any, streamId: number): Promise<void> {
  if (!detailsContent) return;

  const hasDelayed = stream.delayed_effects && stream.delayed_effects.length > 0;

  let html = `
    <div class="asset-details-header">
      <div class="detail-header-left">
        <div class="detail-icon">🌫️</div>
        <div class="detail-title-group">
          <h2>Ambience Stream #${streamId}</h2>
          <p class="detail-subtitle">Looping ambience with optional delayed effects</p>
        </div>
      </div>
    </div>

    <div class="details-section">
      <h3>Basic Information</h3>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">ID:</span>
          <span class="detail-value">#${streamId}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Looping Sound ID:</span>
          <span class="detail-value">${stream.looping_sound_id}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Delayed Effects:</span>
          <span class="detail-value">${hasDelayed ? stream.delayed_effects.length : 0}</span>
        </div>
      </div>
    </div>
  `;

  if (hasDelayed) {
    html += `
      <div class="details-section">
        <h3>Delayed Effects</h3>
        <div class="table-like">
          <div class="table-row table-header">
            <div>Effect ID</div>
            <div>Delay (s)</div>
          </div>
          ${stream.delayed_effects.map((d: any) => `
            <div class="table-row">
              <div>${d.numeric_sound_effect_id}</div>
              <div>${d.delay_seconds}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  html += `
    <div class="details-section">
      <h3>Audio Preview</h3>
      <div id="sound-audio-player-${streamId}" class="sound-audio-container">
        <div class="loading-audio">Loading audio...</div>
      </div>
    </div>
  `;

  detailsContent.innerHTML = html;

  // Load audio for the looping sound
  await loadAudioPlayer(stream.looping_sound_id, streamId, false);

  // Render edit form for ambience stream
  renderAmbienceStreamEdit(stream, streamId);
}

function renderAmbienceStreamEdit(stream: any, streamId: number): void {
  const editContent = document.getElementById('edit-content');
  if (!editContent) return;
  editContent.innerHTML = `
    <div class="edit-section">
      <h3>Editar Ambience Stream</h3>
      <div class="form-grid">
        <label>Looping Sound ID
          <input id="as-looping-sound-id" type="number" value="${stream.looping_sound_id}" />
        </label>
      </div>
      <div class="details-section">
        <h4>Delayed Effects</h4>
        <div id="as-delayed-effects-container">
          ${(stream.delayed_effects || []).map((d: any, idx: number) => `
            <div class="table-row delay-row" data-index="${idx}">
              <input class="delay-effect-id" type="number" value="${d.numeric_sound_effect_id}" placeholder="Effect ID" />
              <input class="delay-effect-seconds" type="number" value="${d.delay_seconds}" placeholder="Delay (s)" />
              <button type="button" class="remove-delay">Remover</button>
            </div>
          `).join('')}
        </div>
        <button type="button" id="add-delay-effect">Adicionar Efeito</button>
      </div>
      <div class="edit-actions">
        <button id="save-ambience-stream" data-ambience-stream-id="${streamId}" class="primary-btn">Salvar</button>
      </div>
    </div>
  `;

  // Add/remove row handlers
  const container = document.getElementById('as-delayed-effects-container');
  const addBtn = document.getElementById('add-delay-effect');
  addBtn?.addEventListener('click', () => {
    const idx = (container?.children.length || 0);
    const row = document.createElement('div');
    row.className = 'table-row delay-row';
    row.setAttribute('data-index', String(idx));
    row.innerHTML = `
      <input class="delay-effect-id" type="number" placeholder="Effect ID" />
      <input class="delay-effect-seconds" type="number" placeholder="Delay (s)" />
      <button type="button" class="remove-delay">Remover</button>
    `;
    container?.appendChild(row);
  });
  container?.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    if (t.closest('.remove-delay')) {
      const row = t.closest('.delay-row');
      row?.parentElement?.removeChild(row!);
    }
  });

  const saveBtn = document.getElementById('save-ambience-stream');
  saveBtn?.addEventListener('click', async () => {
    try {
      const loopingEl = document.getElementById('as-looping-sound-id') as HTMLInputElement | null;
      const rows = Array.from(document.querySelectorAll('#as-delayed-effects-container .delay-row')) as HTMLElement[];
      const delayed_effects = rows.map(r => {
        const idEl = r.querySelector('.delay-effect-id') as HTMLInputElement | null;
        const secEl = r.querySelector('.delay-effect-seconds') as HTMLInputElement | null;
        return {
          numeric_sound_effect_id: idEl?.value ? Number(idEl.value) : 0,
          delay_seconds: secEl?.value ? Number(secEl.value) : 0,
        };
      }).filter(d => d.numeric_sound_effect_id > 0);

      const info = {
        id: streamId,
        looping_sound_id: loopingEl?.value ? Number(loopingEl.value) : 0,
        delayed_effects,
      };
      await invoke('update_ambience_stream', { info });
      await invoke('save_sounds_file');
      await showAssetDetails('Sounds', streamId);
    } catch (err) {
      console.error('Failed to save ambience stream', err);
      alert('Failed to save ambience stream. See console for details.');
    }
  });
}

async function displayAmbienceObjectStreamDetails(obj: any, objId: number): Promise<void> {
  if (!detailsContent) return;

  const hasEffects = obj.sound_effects && obj.sound_effects.length > 0;

  let html = `
    <div class="asset-details-header">
      <div class="detail-header-left">
        <div class="detail-icon">🪵</div>
        <div class="detail-title-group">
          <h2>Ambience Object Stream #${objId}</h2>
          <p class="detail-subtitle">Object-based ambience with counts</p>
        </div>
      </div>
    </div>

    <div class="details-section">
      <h3>Basic Information</h3>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">ID:</span>
          <span class="detail-value">#${objId}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Max Sound Distance:</span>
          <span class="detail-value">${obj.max_sound_distance ?? '—'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Counted Appearance Types:</span>
          <span class="detail-value">${obj.counted_appearance_types?.length || 0}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Sound Effects:</span>
          <span class="detail-value">${hasEffects ? obj.sound_effects.length : 0}</span>
        </div>
      </div>
    </div>
  `;

  if (obj.counted_appearance_types && obj.counted_appearance_types.length > 0) {
    html += `
      <div class="details-section">
        <h3>Counted Appearance Types</h3>
        <div class="tag-list">
          ${obj.counted_appearance_types.map((t: number) => `<span class="tag">${t}</span>`).join(' ')}
        </div>
      </div>
    `;
  }

  if (hasEffects) {
    html += `
      <div class="details-section">
        <h3>Sound Effects by Count</h3>
        <div class="table-like">
          <div class="table-row table-header">
            <div>Count</div>
            <div>Looping Sound ID</div>
          </div>
          ${obj.sound_effects.map((e: any) => `
            <div class="table-row">
              <div>${e.count}</div>
              <div>${e.looping_sound_id}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  const previewSoundId = hasEffects ? obj.sound_effects[0].looping_sound_id : undefined;
  if (previewSoundId !== undefined) {
    html += `
      <div class="details-section">
        <h3>Audio Preview</h3>
        <div id="sound-audio-player-${objId}" class="sound-audio-container">
          <div class="loading-audio">Loading audio...</div>
        </div>
      </div>
    `;
  }

  detailsContent.innerHTML = html;

  if (previewSoundId !== undefined) {
    await loadAudioPlayer(previewSoundId, objId, false);
  }

  // Render edit form for ambience object stream
  renderAmbienceObjectStreamEdit(obj, objId);
}

function renderAmbienceObjectStreamEdit(obj: any, objId: number): void {
  const editContent = document.getElementById('edit-content');
  if (!editContent) return;
  editContent.innerHTML = `
    <div class="edit-section">
      <h3>Editar Ambience Object Stream</h3>
      <div class="form-grid">
        <label>Max Sound Distance
          <input id="aos-max-distance" type="number" value="${obj.max_sound_distance ?? ''}" />
        </label>
        <label>Counted Appearance Types (comma)
          <input id="aos-counted-types" type="text" value="${(obj.counted_appearance_types || []).join(',')}" />
        </label>
      </div>
      <div class="details-section">
        <h4>Sound Effects by Count</h4>
        <div id="aos-sound-effects-container">
          ${(obj.sound_effects || []).map((s: any) => `
            <div class="table-row effect-row">
              <input class="effect-count" type="number" value="${s.count}" placeholder="Count" />
              <input class="effect-looping-id" type="number" value="${s.looping_sound_id}" placeholder="Looping Sound ID" />
              <button type="button" class="remove-effect">Remover</button>
            </div>
          `).join('')}
        </div>
        <button type="button" id="add-aos-effect">Adicionar Efeito</button>
      </div>
      <div class="edit-actions">
        <button id="save-ambience-object-stream" data-ambience-object-id="${objId}" class="primary-btn">Salvar</button>
      </div>
    </div>
  `;

  const container = document.getElementById('aos-sound-effects-container');
  const addBtn = document.getElementById('add-aos-effect');
  addBtn?.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'table-row effect-row';
    row.innerHTML = `
      <input class="effect-count" type="number" placeholder="Count" />
      <input class="effect-looping-id" type="number" placeholder="Looping Sound ID" />
      <button type="button" class="remove-effect">Remover</button>
    `;
    container?.appendChild(row);
  });
  container?.addEventListener('click', (ev) => {
    const t = (ev.target as HTMLElement);
    if (t.closest('.remove-effect')) {
      const row = t.closest('.effect-row');
      row?.parentElement?.removeChild(row!);
    }
  });

  const saveBtn = document.getElementById('save-ambience-object-stream');
  saveBtn?.addEventListener('click', async () => {
    try {
      const maxDistEl = document.getElementById('aos-max-distance') as HTMLInputElement | null;
      const countedEl = document.getElementById('aos-counted-types') as HTMLInputElement | null;
      const types = (countedEl?.value || '').split(',').map(s => s.trim()).filter(Boolean);
      const rows = Array.from(document.querySelectorAll('#aos-sound-effects-container .effect-row')) as HTMLElement[];
      const sound_effects = rows.map(r => {
        const cEl = r.querySelector('.effect-count') as HTMLInputElement | null;
        const lEl = r.querySelector('.effect-looping-id') as HTMLInputElement | null;
        return {
          count: cEl?.value ? Number(cEl.value) : 0,
          looping_sound_id: lEl?.value ? Number(lEl.value) : 0,
        };
      }).filter(e => e.count > 0 && e.looping_sound_id > 0);

      const info = {
        id: objId,
        max_sound_distance: maxDistEl?.value ? Number(maxDistEl.value) : undefined,
        counted_appearance_types: types,
        sound_effects,
      };
      await invoke('update_ambience_object_stream', { info });
      await invoke('save_sounds_file');
      await showAssetDetails('Sounds', objId);
    } catch (err) {
      console.error('Failed to save ambience object stream', err);
      alert('Failed to save ambience object stream. See console for details.');
    }
  });
}

async function displayMusicTemplateDetails(tmpl: any, tmplId: number): Promise<void> {
  if (!detailsContent) return;

  let html = `
    <div class="asset-details-header">
      <div class="detail-header-left">
        <div class="detail-icon">🎼</div>
        <div class="detail-title-group">
          <h2>Music Template #${tmplId}</h2>
          <p class="detail-subtitle">Background music template</p>
        </div>
      </div>
    </div>

    <div class="details-section">
      <h3>Basic Information</h3>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">ID:</span>
          <span class="detail-value">#${tmplId}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Sound ID:</span>
          <span class="detail-value">${tmpl.sound_id}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Music Type:</span>
          <span class="detail-value">${tmpl.music_type || 'Unknown'}</span>
        </div>
      </div>
    </div>

    <div class="details-section">
      <h3>Audio Preview</h3>
      <div id="sound-audio-player-${tmplId}" class="sound-audio-container">
        <div class="loading-audio">Loading audio...</div>
      </div>
    </div>
  `;

  detailsContent.innerHTML = html;

  await loadAudioPlayer(tmpl.sound_id, tmplId, false);

  // Render edit form for music template
  renderMusicTemplateEdit(tmpl, tmplId);
}

function renderMusicTemplateEdit(tmpl: any, tmplId: number): void {
  const editContent = document.getElementById('edit-content');
  if (!editContent) return;
  const musicOptions = ['Unknown','Music','Music Immediate','Music Title'];
  editContent.innerHTML = `
    <div class="edit-section">
      <h3>Editar Music Template</h3>
      <div class="form-grid">
        <label>Sound ID
          <input id="mt-sound-id" type="number" value="${tmpl.sound_id}" />
        </label>
        <label>Music Type
          <select id="mt-music-type">
            ${musicOptions.map(o => `<option value="${o}" ${o === (tmpl.music_type || 'Unknown') ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="edit-actions">
        <button id="save-music-template" data-music-template-id="${tmplId}" class="primary-btn">Salvar</button>
      </div>
    </div>
  `;

  const saveBtn = document.getElementById('save-music-template');
  saveBtn?.addEventListener('click', async () => {
    try {
      const soundIdEl = document.getElementById('mt-sound-id') as HTMLInputElement | null;
      const typeEl = document.getElementById('mt-music-type') as HTMLSelectElement | null;
      const info = {
        id: tmplId,
        sound_id: soundIdEl?.value ? Number(soundIdEl.value) : 0,
        music_type: typeEl?.value || 'Unknown',
      };
      await invoke('update_music_template', { info });
      await invoke('save_sounds_file');
      await showAssetDetails('Sounds', tmplId);
    } catch (err) {
      console.error('Failed to save music template', err);
      alert('Failed to save music template. See console for details.');
    }
  });
}

async function loadAudioPlayer(soundFileId: number, containerId: number, autoPlay: boolean = false): Promise<void> {
  try {
    const audioData = await invoke('get_sound_audio_data', { soundId: soundFileId });
    const container = document.getElementById(`sound-audio-player-${containerId}`);

    if (container && audioData) {
      container.innerHTML = `
        <audio controls preload="metadata" class="sound-player" ${autoPlay ? 'autoplay' : ''}>
          <source src="data:audio/ogg;base64,${audioData}" type="audio/ogg">
          Your browser does not support the audio element.
        </audio>
      `;
      const audioEl = container.querySelector('audio') as HTMLAudioElement | null;
      if (audioEl && autoPlay) {
        audioEl.play().catch(() => {});
      }
    }
  } catch (error) {
    console.error(`Failed to load audio for sound ${soundFileId}:`, error);
    const container = document.getElementById(`sound-audio-player-${containerId}`);
    if (container) {
      container.innerHTML = `
        <div class="audio-error">
          <span>❌ Failed to load audio</span>
        </div>
      `;
    }
  }
}

export async function displayCompleteAssetDetails(details: CompleteAppearanceItem, category: string): Promise<void> {
  if (!detailsContent) return;

  const flags = details.flags;

  // Build basic boolean flags list
  const basicFlags: { name: string; value: boolean }[] = flags ? [
    { name: 'Clip', value: flags.clip },
    { name: 'Bottom', value: flags.bottom },
    { name: 'Top', value: flags.top },
    { name: 'Container', value: flags.container },
    { name: 'Cumulative', value: flags.cumulative },
    { name: 'Usable', value: flags.usable },
    { name: 'Force Use', value: flags.forceuse },
    { name: 'Multi Use', value: flags.multiuse },
    { name: 'Liquid Pool', value: flags.liquidpool },
    { name: 'Unpassable', value: flags.unpass },
    { name: 'Unmovable', value: flags.unmove },
    { name: 'Blocks Sight', value: flags.unsight },
    { name: 'Avoid Walk', value: flags.avoid },
    { name: 'No Move Animation', value: flags.no_movement_animation },
    { name: 'Takeable', value: flags.take },
    { name: 'Liquid Container', value: flags.liquidcontainer },
    { name: 'Hangable', value: flags.hang },
    { name: 'Rotatable', value: flags.rotate },
    { name: "Don't Hide", value: flags.dont_hide },
    { name: 'Translucent', value: flags.translucent },
    { name: 'Lying Object', value: flags.lying_object },
    { name: 'Animate Always', value: flags.animate_always },
    { name: 'Full Bank', value: flags.fullbank },
    { name: 'Ignore Look', value: flags.ignore_look },
    { name: 'Wrap', value: flags.wrap },
    { name: 'Unwrap', value: flags.unwrap },
    { name: 'Top Effect', value: flags.topeffect },
    { name: 'Corpse', value: flags.corpse },
    { name: 'Player Corpse', value: flags.player_corpse },
    { name: 'Ammo', value: flags.ammo },
    { name: 'Show Off Socket', value: flags.show_off_socket },
    { name: 'Reportable', value: flags.reportable },
    { name: 'Reverse Addons East', value: flags.reverse_addons_east },
    { name: 'Reverse Addons West', value: flags.reverse_addons_west },
    { name: 'Reverse Addons South', value: flags.reverse_addons_south },
    { name: 'Reverse Addons North', value: flags.reverse_addons_north },
    { name: 'Wearout', value: flags.wearout },
    { name: 'Clock Expire', value: flags.clockexpire },
    { name: 'Expire', value: flags.expire },
    { name: 'Expire Stop', value: flags.expirestop },
    { name: 'Deco Item Kit', value: flags.deco_item_kit },
    { name: 'Dual Wielding', value: flags.dual_wielding },
  ].filter((f): f is { name: string; value: boolean } => f.value === true) : [];

  const basicInfoHTML = generateBasicInfoHTML(details, category);
  const spritePreviewHTML = generateSpritePreviewHTML(details);
  const frameGroupsHTML = generateFrameGroupsHTML(details);
  const flagsHTML = generateFlagsHTML(basicFlags);
  const complexFlagsHTML = generateComplexFlagsHTML(flags);
  const editFormHTML = generateEditFormHTML(details, category, flags);

  detailsContent.innerHTML = `
    ${basicInfoHTML}
    ${spritePreviewHTML}
    ${frameGroupsHTML}
    ${flagsHTML}
    ${complexFlagsHTML}
  `;

  // Add edit content to the edit tab
  const editContent = document.getElementById('edit-content');
  if (editContent) {
    editContent.innerHTML = editFormHTML;
  }

  await renderTextureTab(details, category);
}

function generateBasicInfoHTML(details: CompleteAppearanceItem, category: string): string {
  return `
    <div class="detail-section">
      <h4>Basic Information</h4>
      <div class="detail-item">
        <span class="detail-label">ID:</span>
        <span class="detail-value">#${details.id}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Name:</span>
        <span class="detail-value" id="detail-name-value">${details.name || 'Unnamed'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Description:</span>
        <span class="detail-value">${details.description || 'No description'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Category:</span>
        <span class="detail-value">${category}</span>
      </div>
    </div>
  `;
}

function generateSpritePreviewHTML(details: CompleteAppearanceItem): string {
  return `
    <div class="detail-section">
      <h4>Sprite Preview</h4>
      <div class="detail-sprites" id="detail-sprites-${details.id}">
        <div class="sprite-loading">🔄 Loading sprites...</div>
      </div>
    </div>
  `;
}

function generateFrameGroupsHTML(details: CompleteAppearanceItem): string {
  if (details.frame_groups.length === 0) return '';

  return `
    <div class="detail-section">
      <h4>Frame Groups (${details.frame_groups.length})</h4>
      ${details.frame_groups.map((fg, index) => {
        const spriteInfo = fg.sprite_info;
        return `
          <div class="frame-group-detail">
            <strong>Group ${index + 1}</strong>
            ${fg.fixed_frame_group !== undefined ? `
              <div class="detail-item">
                <span class="detail-label">Fixed Frame Group:</span>
                <span class="detail-value">${fg.fixed_frame_group}</span>
              </div>
            ` : ''}
            ${fg.id !== undefined ? `
              <div class="detail-item">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${fg.id}</span>
              </div>
            ` : ''}
            ${spriteInfo ? generateSpriteInfoHTML(spriteInfo) : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function generateSpriteInfoHTML(spriteInfo: any): string {
  return `
    ${spriteInfo.pattern_width ? `
      <div class="detail-item">
        <span class="detail-label">Pattern Size:</span>
        <span class="detail-value">${spriteInfo.pattern_width}x${spriteInfo.pattern_height}x${spriteInfo.pattern_depth || 1}</span>
      </div>
    ` : ''}
    ${spriteInfo.layers ? `
      <div class="detail-item">
        <span class="detail-label">Layers:</span>
        <span class="detail-value">${spriteInfo.layers}</span>
      </div>
    ` : ''}
    ${spriteInfo.sprite_ids && spriteInfo.sprite_ids.length > 0 ? `
      <div class="detail-item-full sprite-ids-section">
        <div class="detail-label">Sprite IDs (${spriteInfo.sprite_ids.length} total):</div>
        <div class="sprite-ids-value">
          ${spriteInfo.sprite_ids.slice(0, 15).join(', ')}${spriteInfo.sprite_ids.length > 15 ? ', ...' : ''}
        </div>
        ${spriteInfo.sprite_ids.length > 15 ? `
          <button class="sprite-ids-expand-btn" onclick="
            const full = this.nextElementSibling;
            const preview = this.previousElementSibling;
            if (full.style.display === 'none') {
              full.style.display = 'block';
              preview.style.display = 'none';
              this.textContent = 'Show Less ▲';
            } else {
              full.style.display = 'none';
              preview.style.display = 'block';
              this.textContent = 'Show All ${spriteInfo.sprite_ids.length} IDs ▼';
            }
          ">Show All ${spriteInfo.sprite_ids.length} IDs ▼</button>
          <div class="sprite-ids-full" style="display: none;">
            ${spriteInfo.sprite_ids.join(', ')}
          </div>
        ` : ''}
      </div>
    ` : ''}
    ${spriteInfo.animation ? generateAnimationHTML(spriteInfo.animation) : ''}
  `;
}

function generateAnimationHTML(animation: any): string {
  return `
    <div class="detail-item-full animation-section">
      <div class="detail-label">Animation Details:</div>
      <div class="detail-value">
        <div>Phases: ${animation.phases.length}</div>
        ${animation.synchronized !== undefined ? `<div>Synchronized: ${animation.synchronized ? 'Yes' : 'No'}</div>` : ''}
        ${animation.loop_type !== undefined ? `<div>Loop Type: ${getLoopTypeName(animation.loop_type)}</div>` : ''}
        ${animation.loop_count !== undefined ? `<div>Loop Count: ${animation.loop_count}</div>` : ''}
        <div class="animation-phases">
          ${animation.phases.map((ph: any, idx: number) => `
            <div class="phase-item">
              <span class="phase-index">Phase #${idx + 1}</span>
              <span class="phase-duration">${ph.duration_min ?? '—'}-${ph.duration_max ?? '—'} ms</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function getLoopTypeName(loopType: number): string {
  if (loopType === -1) return 'Pingpong';
  if (loopType === 0) return 'Infinito';
  if (loopType === 1) return 'Contado';
  return `Desconhecido (${loopType})`;
}

function generateFlagsHTML(basicFlags: Array<{ name: string; value: boolean }>): string {
  if (basicFlags.length === 0) return '';

  return `
    <div class="detail-section">
      <h4>Active Flags (${basicFlags.length})</h4>
      <div class="flags-grid">
        ${basicFlags.map(flag => `
          <span class="flag-badge">✅ ${flag.name}</span>
        `).join('')}
      </div>
    </div>
  `;
}

function generateComplexFlagsHTML(flags: CompleteFlags | undefined): string {
  if (!flags) return '';

  let html = '';

  // Market
  if (flags.market) {
    html += `
      <div class="detail-section">
        <h4>Market Information</h4>
        ${flags.market.category !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Category:</span>
            <span class="detail-value">${getMarketCategoryName(flags.market.category)}</span>
          </div>
        ` : ''}
        ${flags.market.minimum_level !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Minimum Level:</span>
            <span class="detail-value">${flags.market.minimum_level}</span>
          </div>
        ` : ''}
        ${flags.market.trade_as_object_id !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Trade As Object ID:</span>
            <span class="detail-value">${flags.market.trade_as_object_id}</span>
          </div>
        ` : ''}
        ${flags.market.show_as_object_id !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Show As Object ID:</span>
            <span class="detail-value">${flags.market.show_as_object_id}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Light, Shift, Height, etc. (simplified for brevity)
  if (flags.light) {
    html += `
      <div class="detail-section">
        <h4>Light Properties</h4>
        ${flags.light.brightness !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Brightness:</span>
            <span class="detail-value">${flags.light.brightness}</span>
          </div>
        ` : ''}
        ${flags.light.color !== undefined ? `
          <div class="detail-item">
            <span class="detail-label">Color:</span>
            <span class="detail-value">${flags.light.color}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  return html;
}

function getMarketCategoryName(category: number): string {
  const categories: Record<number, string> = {
    1: 'Armors', 2: 'Amulets', 3: 'Boots', 4: 'Containers',
    5: 'Decoration', 6: 'Food', 7: 'Helmets', 8: 'Legs',
    9: 'Others', 10: 'Potions', 11: 'Rings', 12: 'Runes',
    13: 'Shields', 14: 'Tools', 15: 'Valuables', 16: 'Ammunition',
    17: 'Axes', 18: 'Clubs', 19: 'Distance Weapons', 20: 'Swords',
    21: 'Wands Rods', 22: 'Premium Scrolls', 23: 'Tibia Coins',
    24: 'Creature Products', 25: 'Quiver', 26: 'Soul Cores', 27: 'Fist Weapons'
  };
  return categories[category] ? `${categories[category]} (${category})` : `Unknown (${category})`;
}

// Generate edit form HTML - Complete version with all fields
function generateEditFormHTML(details: CompleteAppearanceItem, category: string, flags: CompleteFlags | undefined): string {
  const flagDefs = [
    { key: 'clip', label: 'Clip', value: !!flags?.clip },
    { key: 'bottom', label: 'Bottom', value: !!flags?.bottom },
    { key: 'top', label: 'Top', value: !!flags?.top },
    { key: 'container', label: 'Container', value: !!flags?.container },
    { key: 'cumulative', label: 'Cumulative', value: !!flags?.cumulative },
    { key: 'usable', label: 'Usable', value: !!flags?.usable },
    { key: 'forceuse', label: 'Force Use', value: !!flags?.forceuse },
    { key: 'multiuse', label: 'Multi-use', value: !!flags?.multiuse },
    { key: 'liquidpool', label: 'Liquid Pool', value: getFlagBool(flags, 'liquidpool') },
    { key: 'liquidcontainer', label: 'Liquid Container', value: !!flags?.liquidcontainer },
    { key: 'unpass', label: 'Unpassable', value: !!flags?.unpass },
    { key: 'unmove', label: 'Unmovable', value: !!flags?.unmove },
    { key: 'unsight', label: 'Block Sight', value: !!flags?.unsight },
    { key: 'avoid', label: 'Avoid Walk', value: !!flags?.avoid },
    { key: 'nomovementanimation', label: 'No Movement Animation', value: !!flags?.no_movement_animation },
    { key: 'take', label: 'Takeable', value: !!flags?.take },
    { key: 'hang', label: 'Hangable', value: !!flags?.hang },
    { key: 'rotate', label: 'Rotatable', value: !!flags?.rotate },
    { key: 'donthide', label: "Don't Hide", value: !!flags?.dont_hide },
    { key: 'translucent', label: 'Translucent', value: !!flags?.translucent },
    { key: 'lyingobject', label: 'Lying Object', value: !!flags?.lying_object },
    { key: 'animatealways', label: 'Animate Always', value: !!flags?.animate_always },
    { key: 'fullbank', label: 'Full Bank', value: !!flags?.fullbank },
    { key: 'ignorelook', label: 'Ignore Look', value: !!flags?.ignore_look },
    { key: 'wrap', label: 'Wrap', value: !!flags?.wrap },
    { key: 'unwrap', label: 'Unwrap', value: !!flags?.unwrap },
    { key: 'topeffect', label: 'Top Effect', value: !!flags?.topeffect },
    { key: 'corpse', label: 'Corpse', value: !!flags?.corpse },
    { key: 'playercorpse', label: 'Player Corpse', value: !!flags?.player_corpse },
    { key: 'ammo', label: 'Ammo', value: !!flags?.ammo },
    { key: 'showoffsocket', label: 'Show Off Socket', value: !!flags?.show_off_socket },
    { key: 'reportable', label: 'Reportable', value: !!flags?.reportable },
    { key: 'reverseaddonseast', label: 'Reverse Addons East', value: !!flags?.reverse_addons_east },
    { key: 'reverseaddonswest', label: 'Reverse Addons West', value: !!flags?.reverse_addons_west },
    { key: 'reverseaddonssouth', label: 'Reverse Addons South', value: !!flags?.reverse_addons_south },
    { key: 'reverseaddonsnorth', label: 'Reverse Addons North', value: !!flags?.reverse_addons_north },
    { key: 'wearout', label: 'Wearout', value: !!flags?.wearout },
    { key: 'clockexpire', label: 'Clock Expire', value: !!flags?.clockexpire },
    { key: 'expire', label: 'Expire', value: !!flags?.expire },
    { key: 'expirestop', label: 'Expire Stop', value: !!flags?.expirestop },
    { key: 'decoitemkit', label: 'Deco Item Kit', value: !!flags?.deco_item_kit },
    { key: 'dualwielding', label: 'Dual Wielding', value: !!flags?.dual_wielding },
    { key: 'hooksouth', label: 'Hook South', value: getFlagBool(flags, 'hooksouth') },
    { key: 'hookeast', label: 'Hook East', value: getFlagBool(flags, 'hookeast') },
  ];

  const flagsHtml = flagDefs.map(f => `
    <label class="flag-toggle">
      <input type="checkbox" class="flag-checkbox" id="flag-${f.key}" data-flag="${f.key}" data-category="${category}" data-id="${details.id}" ${f.value ? 'checked' : ''} />
      <span>${f.label}</span>
    </label>
  `).join('');

  return `
    <div class="detail-section">
      <h4>Editar Item</h4>
      <div class="detail-item">
        <span class="detail-label">Nome:</span>
        <input type="text" id="asset-name-input" value="${details.name || ''}" placeholder="Digite o nome" />
      </div>
      <div class="detail-item">
        <span class="detail-label">Descrição:</span>
        <textarea id="asset-description-input" rows="3" placeholder="Digite a descrição">${details.description || ''}</textarea>
      </div>
      <div class="detail-actions">
        <button id="save-basic-info" class="btn-primary" data-category="${category}" data-id="${details.id}">Salvar</button>
      </div>
    </div>

    <div class="detail-section">
      <h4>Flags Booleanas</h4>
      <div class="flags-grid">
        ${flagsHtml}
      </div>
    </div>

    <div class="detail-section">
      <h4>Light</h4>
      <div class="detail-item">
        <span class="detail-label">Brightness:</span>
        <div class="number-input">
          <input type="number" id="light-brightness" min="0" value="${flags?.light?.brightness ?? ''}" placeholder="ex: 255" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="light-brightness"></button>
            <button type="button" class="spinner-down" data-input-id="light-brightness"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Color:</span>
        <div class="number-input">
          <input type="number" id="light-color" min="0" value="${flags?.light?.color ?? ''}" placeholder="ex: 215" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="light-color"></button>
            <button type="button" class="spinner-down" data-input-id="light-color"></button>
          </div>
        </div>
      </div>
      <button id="save-light" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Light</button>
    </div>

    <div class="detail-section">
      <h4>Shift</h4>
      <div class="detail-item">
        <span class="detail-label">X:</span>
        <div class="number-input">
          <input type="number" id="shift-x" value="${flags?.shift?.x ?? ''}" placeholder="ex: 1" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="shift-x"></button>
            <button type="button" class="spinner-down" data-input-id="shift-x"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Y:</span>
        <div class="number-input">
          <input type="number" id="shift-y" value="${flags?.shift?.y ?? ''}" placeholder="ex: 2" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="shift-y"></button>
            <button type="button" class="spinner-down" data-input-id="shift-y"></button>
          </div>
        </div>
      </div>
      <button id="save-shift" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Shift</button>
    </div>

    <div class="detail-section">
      <h4>Height</h4>
      <div class="detail-item">
        <span class="detail-label">Elevation:</span>
        <div class="number-input">
          <input type="number" id="height-elevation" value="${flags?.height?.elevation ?? ''}" placeholder="ex: 8" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="height-elevation"></button>
            <button type="button" class="spinner-down" data-input-id="height-elevation"></button>
          </div>
        </div>
      </div>
      <button id="save-height" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Height</button>
    </div>

    <div class="detail-section">
      <h4>Write</h4>
      <div class="detail-item">
        <span class="detail-label">Max Text Length:</span>
        <div class="number-input">
          <input type="number" id="write-max-text-length" value="${flags?.write?.max_text_length ?? ''}" placeholder="ex: 120" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="write-max-text-length"></button>
            <button type="button" class="spinner-down" data-input-id="write-max-text-length"></button>
          </div>
        </div>
      </div>
      <button id="save-write" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Write</button>
    </div>

    <div class="detail-section">
      <h4>Write Once</h4>
      <div class="detail-item">
        <span class="detail-label">Max Text Length Once:</span>
        <div class="number-input">
          <input type="number" id="write-once-max-text-length" value="${flags?.write_once?.max_text_length_once ?? ''}" placeholder="ex: 60" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="write-once-max-text-length"></button>
            <button type="button" class="spinner-down" data-input-id="write-once-max-text-length"></button>
          </div>
        </div>
      </div>
      <button id="save-write-once" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Write Once</button>
    </div>

    <div class="detail-section">
      <h4>Automap</h4>
      <div class="detail-item">
        <span class="detail-label">Color:</span>
        <div class="number-input">
          <input type="number" id="automap-color" value="${flags?.automap?.color ?? ''}" placeholder="ex: 215" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="automap-color"></button>
            <button type="button" class="spinner-down" data-input-id="automap-color"></button>
          </div>
        </div>
      </div>
      <button id="save-automap" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Automap</button>
    </div>

    <div class="detail-section">
      <h4>Hook</h4>
      <div class="detail-item">
        <span class="detail-label">Direction:</span>
        <div class="select-input">
          <select id="hook-direction">
            ${(() => {
              const selected = flags?.hook?.direction ?? null;
              const options = [
                { value: 1, label: 'Sul' },
                { value: 2, label: 'Leste' }
              ];
              const empty = `<option value="" ${selected == null ? 'selected' : ''}>—</option>`;
              const optHtml = options.map(o => `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label} (${o.value})</option>`).join('');
              return empty + optHtml;
            })()}
          </select>
        </div>
      </div>
      <button id="save-hook" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Hook</button>
    </div>

    <div class="detail-section">
      <h4>Lens Help</h4>
      <div class="detail-item">
        <span class="detail-label">ID:</span>
        <div class="number-input">
          <input type="number" id="lenshelp-id" value="${flags?.lenshelp?.id ?? ''}" placeholder="ex: 1000" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="lenshelp-id"></button>
            <button type="button" class="spinner-down" data-input-id="lenshelp-id"></button>
          </div>
        </div>
      </div>
      <button id="save-lenshelp" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Lens Help</button>
    </div>

    <div class="detail-section">
      <h4>Clothes</h4>
      <div class="detail-item">
        <span class="detail-label">Slot:</span>
        <div class="number-input">
          <input type="number" id="clothes-slot" value="${flags?.clothes?.slot ?? ''}" placeholder="ex: 8" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="clothes-slot"></button>
            <button type="button" class="spinner-down" data-input-id="clothes-slot"></button>
          </div>
        </div>
      </div>
      <button id="save-clothes" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Clothes</button>
    </div>

    <div class="detail-section">
      <h4>Default Action</h4>
      <div class="detail-item">
        <span class="detail-label">Action:</span>
        <div class="select-input">
          <select id="default-action">
            ${(() => {
              const selected = flags?.default_action?.action ?? null;
              const options = [
                { value: 0, label: 'None' },
                { value: 1, label: 'Look' },
                { value: 2, label: 'Use' },
                { value: 3, label: 'Open' },
                { value: 4, label: 'Autowalk Highlight' },
              ];
              const empty = `<option value="" ${selected == null ? 'selected' : ''}>—</option>`;
              const optHtml = options.map(o => `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label} (${o.value})</option>`).join('');
              return empty + optHtml;
            })()}
          </select>
        </div>
      </div>
      <button id="save-default-action" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Default Action</button>
    </div>

    <div class="detail-section">
      <h4>Market</h4>
      <div class="detail-item">
        <span class="detail-label">Category:</span>
        <div class="select-input">
          <select id="market-category">
            ${(() => {
              const selected = flags?.market?.category ?? null;
              const options = [
                { value: 1, label: 'Armors' }, { value: 2, label: 'Amulets' },
                { value: 3, label: 'Boots' }, { value: 4, label: 'Containers' },
                { value: 5, label: 'Decoration' }, { value: 6, label: 'Food' },
                { value: 7, label: 'Helmets Hats' }, { value: 8, label: 'Legs' },
                { value: 9, label: 'Others' }, { value: 10, label: 'Potions' },
                { value: 11, label: 'Rings' }, { value: 12, label: 'Runes' },
                { value: 13, label: 'Shields' }, { value: 14, label: 'Tools' },
                { value: 15, label: 'Valuables' }, { value: 16, label: 'Ammunition' },
                { value: 17, label: 'Axes' }, { value: 18, label: 'Clubs' },
                { value: 19, label: 'Distance Weapons' }, { value: 20, label: 'Swords' },
                { value: 21, label: 'Wands Rods' }, { value: 22, label: 'Premium Scrolls' },
                { value: 23, label: 'Tibia Coins' }, { value: 24, label: 'Creature Products' },
                { value: 25, label: 'Quiver' }, { value: 26, label: 'Soul Cores' },
                { value: 27, label: 'Fist Weapons' },
              ];
              const empty = `<option value="" ${selected == null ? 'selected' : ''}>—</option>`;
              const optHtml = options.map(o => `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label} (${o.value})</option>`).join('');
              return empty + optHtml;
            })()}
          </select>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Trade As Object ID:</span>
        <div class="number-input">
          <input type="number" id="market-trade-as-object-id" value="${flags?.market?.trade_as_object_id ?? ''}" placeholder="ex: 1234" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="market-trade-as-object-id"></button>
            <button type="button" class="spinner-down" data-input-id="market-trade-as-object-id"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Show As Object ID:</span>
        <div class="number-input">
          <input type="number" id="market-show-as-object-id" value="${flags?.market?.show_as_object_id ?? ''}" placeholder="ex: 5678" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="market-show-as-object-id"></button>
            <button type="button" class="spinner-down" data-input-id="market-show-as-object-id"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Restrict To Vocation:</span>
        <select id="market-restrict-to-vocation">
          ${getVocationOptionsHTML((flags?.market?.restrict_to_vocation?.length ? flags.market.restrict_to_vocation[0] : null), true, true)}
        </select>
      </div>
      <div class="detail-item">
        <span class="detail-label">Minimum Level:</span>
        <div class="number-input">
          <input type="number" id="market-minimum-level" value="${flags?.market?.minimum_level ?? ''}" placeholder="ex: 20" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="market-minimum-level"></button>
            <button type="button" class="spinner-down" data-input-id="market-minimum-level"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Name:</span>
        <input type="text" id="market-name" value="${details?.name ?? ''}" placeholder="ex: Magic Sword" />
      </div>
      <div class="detail-item">
        <span class="detail-label">Vocation:</span>
        <select id="market-vocation">
          ${getVocationOptionsHTML(flags?.market?.vocation ?? null, true, true)}
        </select>
      </div>
      <button id="save-market" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Market</button>
    </div>

    <div class="detail-section">
      <h4>Bank</h4>
      <div class="detail-item">
        <span class="detail-label">Waypoints:</span>
        <div class="number-input">
          <input type="number" id="bank-waypoints" value="${flags?.bank?.waypoints ?? ''}" placeholder="ex: 3" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="bank-waypoints"></button>
            <button type="button" class="spinner-down" data-input-id="bank-waypoints"></button>
          </div>
        </div>
      </div>
      <button id="save-bank" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Bank</button>
    </div>

    <div class="detail-section">
      <h4>Changed To Expire</h4>
      <div class="detail-item">
        <span class="detail-label">Former Object Type ID:</span>
        <div class="number-input">
          <input type="number" id="changed-to-expire-former-id" value="${flags?.changed_to_expire?.former_object_typeid ?? ''}" placeholder="ex: 100" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="changed-to-expire-former-id"></button>
            <button type="button" class="spinner-down" data-input-id="changed-to-expire-former-id"></button>
          </div>
        </div>
      </div>
      <button id="save-changed-to-expire" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Changed To Expire</button>
    </div>

    <div class="detail-section">
      <h4>Cyclopedia Item</h4>
      <div class="detail-item">
        <span class="detail-label">Type:</span>
        <div class="number-input">
          <input type="number" id="cyclopedia-type" value="${flags?.cyclopedia_item?.cyclopedia_type ?? ''}" placeholder="ex: 1" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="cyclopedia-type"></button>
            <button type="button" class="spinner-down" data-input-id="cyclopedia-type"></button>
          </div>
        </div>
      </div>
      <button id="save-cyclopedia-item" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Cyclopedia Item</button>
    </div>

    <div class="detail-section">
      <h4>Upgrade Classification</h4>
      <div class="detail-item">
        <span class="detail-label">Classification:</span>
        <div class="number-input">
          <input type="number" id="upgrade-classification" value="${flags?.upgrade_classification?.upgrade_classification ?? ''}" placeholder="ex: 2" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="upgrade-classification"></button>
            <button type="button" class="spinner-down" data-input-id="upgrade-classification"></button>
          </div>
        </div>
      </div>
      <button id="save-upgrade-classification" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Upgrade Classification</button>
    </div>

    <div class="detail-section">
      <h4>Skill Wheel Gem</h4>
      <div class="detail-item">
        <span class="detail-label">Gem Quality ID:</span>
        <div class="number-input">
          <input type="number" id="skillwheel-gem-quality-id" value="${flags?.skillwheel_gem?.gem_quality_id ?? ''}" placeholder="ex: 1" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="skillwheel-gem-quality-id"></button>
            <button type="button" class="spinner-down" data-input-id="skillwheel-gem-quality-id"></button>
          </div>
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label">Vocation:</span>
        <select id="skillwheel-vocation-id">
          ${getVocationOptionsHTML(flags?.skillwheel_gem?.vocation_id ?? null, true, false)}
        </select>
      </div>
      <button id="save-skillwheel-gem" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Skill Wheel Gem</button>
    </div>

    <div class="detail-section">
      <h4>Imbueable</h4>
      <div class="detail-item">
        <span class="detail-label">Slot Count:</span>
        <div class="number-input">
          <input type="number" id="imbueable-slot-count" value="${flags?.imbueable?.slot_count ?? ''}" placeholder="ex: 1" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="imbueable-slot-count"></button>
            <button type="button" class="spinner-down" data-input-id="imbueable-slot-count"></button>
          </div>
        </div>
      </div>
      <button id="save-imbueable" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Imbueable</button>
    </div>

    <div class="detail-section">
      <h4>Proficiency</h4>
      <div class="detail-item">
        <span class="detail-label">Proficiency ID:</span>
        <div class="number-input">
          <input type="number" id="proficiency-id" value="${flags?.proficiency?.proficiency_id ?? ''}" placeholder="ex: 3" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="proficiency-id"></button>
            <button type="button" class="spinner-down" data-input-id="proficiency-id"></button>
          </div>
        </div>
      </div>
      <button id="save-proficiency" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Proficiency</button>
    </div>

    <div class="detail-section">
      <h4>Weapon Type</h4>
      <div class="detail-item">
        <span class="detail-label">Type:</span>
        <div class="select-input">
          <select id="weapon-type">
            ${(() => {
              const selected = typeof flags?.weapon_type === 'number' ? flags.weapon_type : null;
              const options = [
                { value: 0, label: 'No Weapon' },
                { value: 1, label: 'Sword' },
                { value: 2, label: 'Axe' },
                { value: 3, label: 'Club' },
                { value: 4, label: 'Fist' },
                { value: 5, label: 'Bow' },
                { value: 6, label: 'Crossbow' },
                { value: 7, label: 'Wand Rod' },
                { value: 8, label: 'Throw' },
              ];
              const empty = `<option value="" ${selected == null ? 'selected' : ''}>—</option>`;
              const optHtml = options.map(o => `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label} (${o.value})</option>`).join('');
              return empty + optHtml;
            })()}
          </select>
        </div>
      </div>
      <button id="save-weapon-type" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Weapon Type</button>
    </div>

    <div class="detail-section">
      <h4>Transparency Level</h4>
      <div class="detail-item">
        <span class="detail-label">Level:</span>
        <div class="number-input">
          <input type="number" id="transparency-level" value="${flags?.transparency_level ?? ''}" placeholder="ex: 50" />
          <div class="spinner-controls">
            <button type="button" class="spinner-up" data-input-id="transparency-level"></button>
            <button type="button" class="spinner-down" data-input-id="transparency-level"></button>
          </div>
        </div>
      </div>
      <button id="save-transparency-level" class="btn-secondary" data-category="${category}" data-id="${details.id}">Salvar Transparency Level</button>
    </div>
  `;
}

export function closeAssetDetails(): void {
  if (assetDetails) {
    stopDetailAnimationPlayers();
    assetDetails.classList.remove('show');
    assetDetails.style.display = 'none';
  }
}

export async function refreshAssetDetails(category: string, id: number): Promise<void> {
  try {
    stopDetailAnimationPlayers();
    const updated = await invoke('get_complete_appearance', { category, id }) as CompleteAppearanceItem;
    currentAppearanceDetails = updated;
    await displayCompleteAssetDetails(updated, category);
    await initAnimationPlayersForDetails(updated, category);
    await loadDetailSprites(category, id);
  } catch (err) {
    console.error('Falha ao atualizar detalhes do item:', err);
  }
}

async function playRandomSequence(randomIds: number[], containerId: number): Promise<void> {
  if (!randomIds || randomIds.length === 0) return;
  const container = document.getElementById(`sound-audio-player-${containerId}`);
  if (!container) return;

  let index = 0;
  const playNext = async (): Promise<void> => {
    if (index >= randomIds.length) {
      return;
    }
    const currentId = randomIds[index++];
    try {
      const audioData = await invoke('get_sound_audio_data', { soundId: currentId });
      container.innerHTML = `
        <audio controls preload="metadata" class="sound-player" autoplay>
          <source src="data:audio/ogg;base64,${audioData}" type="audio/ogg">
          Your browser does not support the audio element.
        </audio>
      `;
      const audioEl = container.querySelector('audio') as HTMLAudioElement | null;
      if (audioEl) {
        audioEl.onended = () => { playNext(); };
        audioEl.play().catch(() => {});
      }
    } catch (err) {
      console.error(`Failed to load audio for random sound ${currentId}:`, err);
      // Skip failed and continue
      playNext();
    }
  };

  index = 0;
  await playNext();
}
