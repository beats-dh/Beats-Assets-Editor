// Sound management module
import { invoke } from '@tauri-apps/api/core';
import {
  SoundInfo,
  SoundStats,
  NumericSoundEffectInfo,
  getSoundTypeDisplayName,
  getSoundCategory
} from './soundTypes';
import { showStatus } from './utils';
import { translate } from './i18n';

// State
let soundsLoaded = false;
let soundStats: SoundStats | null = null;
let currentSoundTypes: string[] = [];

// Getters
export function areSoundsLoaded(): boolean {
  return soundsLoaded;
}

export function getSoundStats(): SoundStats | null {
  return soundStats;
}

export function getSoundTypes(): string[] {
  return currentSoundTypes;
}

/**
 * Load sounds file from the sounds directory
 */
export async function loadSoundsFile(soundsDir: string): Promise<SoundStats> {
  try {
    console.log('Loading sounds from:', soundsDir);
    showStatus(translate('sounds.loading'), 'loading');

    const stats = await invoke<SoundStats>('load_sounds_file', { soundsDir });

    soundsLoaded = true;
    soundStats = stats;
    (window as any).__lastLoadedSoundCount = stats.total_sounds;

    console.log('Sounds loaded successfully:', stats);
    showStatus(translate('sounds.loaded', { count: stats.total_sounds }), 'success');

    return stats;
  } catch (error) {
    console.error('Failed to load sounds:', error);
    const message = error instanceof Error ? error.message : String(error);
    showStatus(translate('sounds.loadFailed', { message }), 'error');
    throw error;
  }
}

/**
 * Get sound statistics
 */
export async function getSoundsStats(): Promise<SoundStats> {
  try {
    const stats = await invoke<SoundStats>('get_sounds_stats');
    soundStats = stats;
    return stats;
  } catch (error) {
    console.error('Failed to get sound stats:', error);
    throw error;
  }
}

/**
 * List all available sound types
 */
export async function listSoundTypes(): Promise<string[]> {
  try {
    const types = await invoke<string[]>('list_sound_types');
    currentSoundTypes = types;
    return types;
  } catch (error) {
    console.error('Failed to list sound types:', error);
    throw error;
  }
}

/**
 * Get sound by ID
 */
export async function getSoundById(soundId: number): Promise<SoundInfo> {
  try {
    return await invoke<SoundInfo>('get_sound_by_id', { soundId });
  } catch (error) {
    console.error(`Failed to get sound ${soundId}:`, error);
    throw error;
  }
}

/**
 * Get sounds by type
 */
export async function getSoundsByType(soundType: string): Promise<NumericSoundEffectInfo[]> {
  try {
    return await invoke<NumericSoundEffectInfo[]>('get_sounds_by_type', { soundType });
  } catch (error) {
    console.error(`Failed to get sounds by type ${soundType}:`, error);
    throw error;
  }
}

/**
 * List all sounds with pagination
 */
export async function listAllSounds(
  page: number,
  pageSize: number
): Promise<NumericSoundEffectInfo[]> {
  try {
    return await invoke<NumericSoundEffectInfo[]>('list_all_sounds', {
      page,
      pageSize
    });
  } catch (error) {
    console.error('Failed to list all sounds:', error);
    throw error;
  }
}

/**
 * List numeric sound effects with pagination and optional filtering by type
 */
export async function listNumericSoundEffects(
  page: number,
  pageSize: number,
  soundType?: string
): Promise<NumericSoundEffectInfo[]> {
  try {
    return await invoke<NumericSoundEffectInfo[]>('list_numeric_sound_effects', {
      page,
      pageSize,
      soundType: soundType || null
    });
  } catch (error) {
    console.error('Failed to list numeric sound effects:', error);
    throw error;
  }
}

/**
 * Get total count of sound effects
 */
export async function getSoundEffectCount(): Promise<number> {
  try {
    return await invoke<number>('get_sound_effect_count');
  } catch (error) {
    console.error('Failed to get sound effect count:', error);
    throw error;
  }
}

/**
 * Get sound audio data as base64-encoded string
 */
export async function getSoundAudioData(soundId: number): Promise<string> {
  try {
    return await invoke<string>('get_sound_audio_data', { soundId });
  } catch (error) {
    console.error(`Failed to get audio data for sound ${soundId}:`, error);
    throw error;
  }
}

/**
 * Get the file path for a sound
 */
export async function getSoundFilePath(soundId: number): Promise<string> {
  try {
    return await invoke<string>('get_sound_file_path', { soundId });
  } catch (error) {
    console.error(`Failed to get file path for sound ${soundId}:`, error);
    throw error;
  }
}

/**
 * Create an audio element from base64 data
 */
export function createAudioElement(base64Data: string): HTMLAudioElement {
  const audio = document.createElement('audio');
  audio.src = `data:audio/ogg;base64,${base64Data}`;
  audio.controls = true;
  audio.preload = 'metadata';
  return audio;
}

/**
 * Generate HTML for a sound card in the grid
 */
export function generateSoundCardHTML(sound: NumericSoundEffectInfo): string {
  const soundType = getSoundTypeDisplayName(sound.sound_type);
  const category = getSoundCategory(sound.sound_type);

  return `
    <div class="asset-item sound-item" data-asset-id="${sound.id}" data-category="Sounds">
      <div class="sound-icon">🔊</div>
      <div class="sound-info">
        <div class="sound-id">#${sound.id}</div>
        <div class="sound-type">${soundType}</div>
        ${sound.sound_id ? `<div class="sound-file">Sound: ${sound.sound_id}</div>` : ''}
        ${sound.random_sound_ids.length > 0 ? `<div class="sound-random">Random: ${sound.random_sound_ids.length} files</div>` : ''}
      </div>
      <div class="sound-badge ${category}">${category}</div>
    </div>
  `;
}

/**
 * Generate HTML for sound details display
 */
export function generateSoundDetailsHTML(sound: NumericSoundEffectInfo, soundInfo?: SoundInfo): string {
  const soundType = getSoundTypeDisplayName(sound.sound_type);

  let html = `
    <div class="details-section">
      <h3>Basic Information</h3>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Sound ID:</span>
          <span class="detail-value">#${sound.id}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${soundType}</span>
        </div>
  `;

  if (sound.sound_id) {
    html += `
        <div class="detail-item">
          <span class="detail-label">Main Sound File:</span>
          <span class="detail-value">${sound.sound_id}</span>
        </div>
    `;
  }

  if (sound.random_sound_ids.length > 0) {
    html += `
        <div class="detail-item">
          <span class="detail-label">Random Sounds:</span>
          <span class="detail-value">${sound.random_sound_ids.join(', ')}</span>
        </div>
    `;
  }

  html += `
      </div>
    </div>
  `;

  // Randomization
  if ((sound.random_pitch_min !== null && sound.random_pitch_min !== undefined && sound.random_pitch_max !== null && sound.random_pitch_max !== undefined)
    || (sound.random_volume_min !== null && sound.random_volume_min !== undefined && sound.random_volume_max !== null && sound.random_volume_max !== undefined)) {
    html += `
      <div class="details-section">
        <h3>Randomization</h3>
        <div class="details-grid">
    `;

    if (sound.random_pitch_min !== null && sound.random_pitch_min !== undefined && sound.random_pitch_max !== null && sound.random_pitch_max !== undefined) {
      html += `
          <div class="detail-item">
            <span class="detail-label">Random Pitch:</span>
            <span class="detail-value">${sound.random_pitch_min} – ${sound.random_pitch_max}</span>
          </div>
      `;
    }

    if (sound.random_volume_min !== null && sound.random_volume_min !== undefined && sound.random_volume_max !== null && sound.random_volume_max !== undefined) {
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

  // File information if available
  if (soundInfo) {
    html += `
      <div class="details-section">
        <h3>File Information</h3>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Filename:</span>
            <span class="detail-value">${soundInfo.filename}</span>
          </div>
    `;

    if (soundInfo.original_filename) {
      html += `
          <div class="detail-item">
            <span class="detail-label">Original Name:</span>
            <span class="detail-value">${soundInfo.original_filename}</span>
          </div>
      `;
    }

    html += `
          <div class="detail-item">
            <span class="detail-label">Stream:</span>
            <span class="detail-value">${soundInfo.is_stream ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    `;
  }

  return html;
}
