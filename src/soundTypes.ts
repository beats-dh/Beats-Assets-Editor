// TypeScript types for Sounds API
// Matching Rust structures from src-tauri/src/core/parsers/sounds.rs
import { translate } from './i18n';

export interface SoundInfo {
  id: number;
  filename: string;
  original_filename?: string | null;
  is_stream: boolean;
}

export interface SoundStats {
  total_sounds: number;
  total_numeric_effects: number;
  total_ambience_streams: number;
  total_ambience_object_streams: number;
  total_music_templates: number;
}

export interface NumericSoundEffectInfo {
  id: number;
  sound_type: string;
  sound_id?: number | null;
  random_sound_ids: number[];
  random_pitch_min?: number | null;
  random_pitch_max?: number | null;
  random_volume_min?: number | null;
  random_volume_max?: number | null;
}

export interface DelayedSoundEffectInfo {
  numeric_sound_effect_id: number;
  delay_seconds: number;
}

export interface AmbienceStreamInfo {
  id: number;
  looping_sound_id: number;
  delayed_effects: DelayedSoundEffectInfo[];
}

export interface AppearanceTypesCountSoundEffectInfo {
  count: number;
  looping_sound_id: number;
}

export interface AmbienceObjectStreamInfo {
  id: number;
  counted_appearance_types: number[];
  sound_effects: AppearanceTypesCountSoundEffectInfo[];
  max_sound_distance?: number | null;
}

export interface MusicTemplateInfo {
  id: number;
  sound_id: number;
  music_type: string;
}

// Sound type categories for navigation
export const SOUND_TYPES = [
  'Spell Attack',
  'Weapon Attack',
  'Creature Noise',
  'UI',
  'Movement',
  'Environment',
  'Item Usage',
  'Magic Effect',
  'Other'
] as const;

export type SoundType = typeof SOUND_TYPES[number];

// Helper function to get sound type display name
export function getSoundTypeDisplayName(soundType: string): string {
  return soundType || translate('general.unknown');
}

// Helper function to determine sound category from type
export function getSoundCategory(soundType: string): 'effects' | 'ambience' | 'music' | 'other' {
  const type = soundType.toLowerCase();

  if (type.includes('spell') || type.includes('weapon') || type.includes('attack')) {
    return 'effects';
  }
  if (type.includes('ambience') || type.includes('environment')) {
    return 'ambience';
  }
  if (type.includes('music')) {
    return 'music';
  }
  return 'other';
}
