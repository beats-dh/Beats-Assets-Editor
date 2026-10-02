/**
 * Sound Service - Centralized sound management for the application
 * Migrated from the legacy sounds.ts
 */

import { invoke } from '../utils/invoke';
import { COMMANDS } from '../commands';
import type { SoundInfo, SoundStats, NumericSoundEffectInfo } from '../soundTypes';

// Re-export types for convenience
export type { SoundInfo, SoundStats, NumericSoundEffectInfo };

// State
let soundsLoaded = false;
let allSounds: SoundInfo[] = [];
let soundStats: SoundStats | null = null;

/**
 * Check if sounds have been loaded
 */
export function areSoundsLoaded(): boolean {
    return soundsLoaded;
}

/**
 * Get cached sound statistics
 */
export function getSoundStats(): SoundStats | null {
    return soundStats;
}

/**
 * Load all sounds from the backend
 */
export async function loadAllSounds(): Promise<SoundInfo[]> {
    try {
        const result = await invoke<SoundInfo[]>('list_all_sounds');
        allSounds = (result || []).sort((a, b) => a.id - b.id);
        soundsLoaded = true;
        return allSounds;
    } catch (e) {
        console.error('Failed to load sounds list:', e);
        return [];
    }
}

/**
 * Get cached sounds list (loads if not cached)
 */
export async function getAllSounds(): Promise<SoundInfo[]> {
    if (allSounds.length === 0) {
        return loadAllSounds();
    }
    return allSounds;
}

/**
 * Force refresh of sound list
 */
export async function refreshSounds(): Promise<SoundInfo[]> {
    return loadAllSounds();
}

/**
 * Get sound statistics from backend
 */
export async function getSoundsStats(): Promise<SoundStats> {
    try {
        const stats = await invoke<SoundStats>(COMMANDS.GET_SOUNDS_STATS);
        soundStats = stats;
        return stats;
    } catch (e) {
        console.error('Failed to get sound stats:', e);
        throw e;
    }
}

/**
 * List all available sound types
 */
export async function listSoundTypes(): Promise<string[]> {
    try {
        return await invoke<string[]>(COMMANDS.LIST_SOUND_TYPES);
    } catch (e) {
        console.error('Failed to list sound types:', e);
        return [];
    }
}

/**
 * Get a specific sound by ID
 */
export async function getSoundById(soundId: number): Promise<SoundInfo | null> {
    try {
        return await invoke<SoundInfo>('get_sound_by_id', { soundId });
    } catch (e) {
        console.error('Failed to get sound:', soundId, e);
        return null;
    }
}

/**
 * Get audio data as base64 string for a sound
 */
export async function getSoundAudioData(soundId: number): Promise<string> {
    return await invoke<string>('get_sound_audio_data', { soundId });
}

/**
 * Create an audio element from base64 data
 */
export function createAudioElement(base64Data: string): HTMLAudioElement {
    const audio = new Audio(`data:audio/ogg;base64,${base64Data}`);
    audio.preload = 'auto';
    return audio;
}

/**
 * Play a sound by ID (returns the audio element for control)
 */
export async function playSound(soundId: number): Promise<HTMLAudioElement | null> {
    try {
        const audioData = await getSoundAudioData(soundId);
        const audio = createAudioElement(audioData);
        await audio.play();
        return audio;
    } catch (e) {
        console.error('Failed to play sound:', soundId, e);
        return null;
    }
}

/**
 * Add a new numeric sound effect
 */
export async function addNumericSoundEffect(info: Partial<NumericSoundEffectInfo>): Promise<number> {
    const newId = await invoke<number>('add_numeric_sound_effect', { info });
    await invoke('save_sounds_file');
    return newId;
}

/**
 * Import a sound file and add it to the library
 */
export async function importAndAddSound(
    sourcePath: string,
    destFilename?: string,
    isStream?: boolean,
    id?: number
): Promise<SoundInfo> {
    const created = await invoke<SoundInfo>('import_and_add_sound', {
        sourcePath,
        destFilename,
        isStream: isStream ?? false,
        id
    });

    // Refresh the sounds list after import
    await refreshSounds();

    return created;
}

/**
 * Clear cached sounds (call when switching projects)
 */
export function clearSoundsCache(): void {
    allSounds = [];
    soundStats = null;
    soundsLoaded = false;
}
