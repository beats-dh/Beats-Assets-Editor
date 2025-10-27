use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use prost::Message;

// Import the protobuf definitions
use crate::core::protobuf::sound::{
    Sounds, Sound, NumericSoundEffect, AmbienceStream, AmbienceObjectStream, MusicTemplate,
    ENumericSoundType, EMusicType
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoundCatalog {
    pub file: String,
    #[serde(rename = "type")]
    pub catalog_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoundInfo {
    pub id: u32,
    pub filename: String,
    pub original_filename: Option<String>,
    pub is_stream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NumericSoundEffectInfo {
    pub id: u32,
    pub sound_type: String,
    pub sound_id: Option<u32>,
    pub random_sound_ids: Vec<u32>,
    pub random_pitch_min: Option<f32>,
    pub random_pitch_max: Option<f32>,
    pub random_volume_min: Option<f32>,
    pub random_volume_max: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AmbienceStreamInfo {
    pub id: u32,
    pub looping_sound_id: u32,
    pub delayed_effects: Vec<DelayedSoundEffectInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelayedSoundEffectInfo {
    pub numeric_sound_effect_id: u32,
    pub delay_seconds: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AmbienceObjectStreamInfo {
    pub id: u32,
    pub counted_appearance_types: Vec<u32>,
    pub sound_effects: Vec<AppearanceTypesCountSoundEffectInfo>,
    pub max_sound_distance: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceTypesCountSoundEffectInfo {
    pub count: u32,
    pub looping_sound_id: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicTemplateInfo {
    pub id: u32,
    pub sound_id: u32,
    pub music_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoundsData {
    pub sounds: Vec<SoundInfo>,
    pub numeric_sound_effects: Vec<NumericSoundEffectInfo>,
    pub ambience_streams: Vec<AmbienceStreamInfo>,
    pub ambience_object_streams: Vec<AmbienceObjectStreamInfo>,
    pub music_templates: Vec<MusicTemplateInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SoundStats {
    pub total_sounds: usize,
    pub total_numeric_effects: usize,
    pub total_ambience_streams: usize,
    pub total_ambience_object_streams: usize,
    pub total_music_templates: usize,
}

pub struct SoundsParser {
    sounds_data: Option<SoundsData>,
    sounds_dir: Option<PathBuf>,
}

impl SoundsParser {
    pub fn new() -> Self {
        Self {
            sounds_data: None,
            sounds_dir: None,
        }
    }

    /// Load sounds from a Tibia sounds directory
    pub fn load_from_directory(&mut self, sounds_dir: &Path) -> Result<SoundStats> {
        // Read catalog-sound.json
        let catalog_path = sounds_dir.join("catalog-sound.json");
        let catalog_content = fs::read_to_string(&catalog_path)
            .context("Failed to read catalog-sound.json")?;

        // Parse catalog as array first, fallback to single object
        let catalog_entries: Vec<SoundCatalog> = match serde_json::from_str(&catalog_content) {
            Ok(v) => v,
            Err(_) => {
                let single: SoundCatalog = serde_json::from_str(&catalog_content)
                    .context("Failed to parse catalog-sound.json")?;
                vec![single]
            }
        };

        if catalog_entries.is_empty() {
            anyhow::bail!("catalog-sound.json has no entries");
        }

        // Prefer the entry with type == "sounds"
        let selected = catalog_entries
            .iter()
            .find(|e| e.catalog_type == "sounds")
            .cloned()
            .unwrap_or_else(|| catalog_entries[0].clone());

        log::info!(
            "catalog-sound.json: found {} entries; using file: {}",
            catalog_entries.len(),
            selected.file
        );

        // Read the .dat file
        let dat_path = sounds_dir.join(&selected.file);
        let dat_content = fs::read(&dat_path)
            .context(format!("Failed to read {}", selected.file))?;

        // Parse protobuf: try direct decode, then LZMA/XZ decompress fallback
        let sounds = match Sounds::decode(dat_content.as_slice()) {
            Ok(s) => {
                log::info!("Sounds decoded directly without decompression");
                s
            },
            Err(e) => {
                log::warn!(
                    "Direct sounds decode failed: {}. Trying LZMA/XZ decompress...",
                    e
                );
                let decompressed = crate::core::lzma::decompress(&dat_content)
                    .context("Failed to decompress sounds data (LZMA/XZ)")?;
                let decoded = Sounds::decode(decompressed.as_slice())
                    .context("Failed to decode sounds protobuf after decompression")?;
                decoded
            }
        };

        // Convert to our internal structures
        let sounds_data = self.convert_sounds(&sounds)?;

        let stats = SoundStats {
            total_sounds: sounds_data.sounds.len(),
            total_numeric_effects: sounds_data.numeric_sound_effects.len(),
            total_ambience_streams: sounds_data.ambience_streams.len(),
            total_ambience_object_streams: sounds_data.ambience_object_streams.len(),
            total_music_templates: sounds_data.music_templates.len(),
        };

        self.sounds_data = Some(sounds_data);
        self.sounds_dir = Some(sounds_dir.to_path_buf());

        Ok(stats)
    }

    fn convert_sounds(&self, sounds: &Sounds) -> Result<SoundsData> {
        let sounds_list: Vec<SoundInfo> = sounds
            .sound
            .iter()
            .map(|s| SoundInfo {
                id: s.id.unwrap_or_default(),
                filename: s.filename.clone().unwrap_or_default(),
                original_filename: s.original_filename.clone(),
                is_stream: s.is_stream.unwrap_or(false),
            })
            .collect();

        let numeric_effects: Vec<NumericSoundEffectInfo> = sounds
            .numeric_sound_effect
            .iter()
            .map(|e| {
                let sound_type = match ENumericSoundType::from_i32(e.numeric_sound_type.unwrap_or_default()) {
                    Some(ENumericSoundType::NumericSoundTypeUnknown) => "Unknown",
                    Some(ENumericSoundType::NumericSoundTypeSpellAttack) => "Spell Attack",
                    Some(ENumericSoundType::NumericSoundTypeSpellHealing) => "Spell Healing",
                    Some(ENumericSoundType::NumericSoundTypeSpellSupport) => "Spell Support",
                    Some(ENumericSoundType::NumericSoundTypeWeaponAttack) => "Weapon Attack",
                    Some(ENumericSoundType::NumericSoundTypeCreatureNoise) => "Creature Noise",
                    Some(ENumericSoundType::NumericSoundTypeCreatureDeath) => "Creature Death",
                    Some(ENumericSoundType::NumericSoundTypeCreatureAttack) => "Creature Attack",
                    Some(ENumericSoundType::NumericSoundTypeAmbienceStream) => "Ambience Stream",
                    Some(ENumericSoundType::NumericSoundTypeFoodAndDrink) => "Food and Drink",
                    Some(ENumericSoundType::NumericSoundTypeItemMovement) => "Item Movement",
                    Some(ENumericSoundType::NumericSoundTypeEvent) => "Event",
                    Some(ENumericSoundType::NumericSoundTypeUi) => "UI",
                    Some(ENumericSoundType::NumericSoundTypeWhisperWithoutOpenChat) => "Whisper",
                    Some(ENumericSoundType::NumericSoundTypeChatMessage) => "Chat Message",
                    Some(ENumericSoundType::NumericSoundTypeParty) => "Party",
                    Some(ENumericSoundType::NumericSoundTypeVipList) => "VIP List",
                    Some(ENumericSoundType::NumericSoundTypeRaidAnnouncement) => "Raid Announcement",
                    Some(ENumericSoundType::NumericSoundTypeServerMessage) => "Server Message",
                    Some(ENumericSoundType::NumericSoundTypeSpellGeneric) => "Spell Generic",
                    None => "Unknown",
                };

                let (sound_id, random_sound_ids) = if let Some(simple) = &e.simple_sound_effect {
                    (simple.sound_id, Vec::new())
                } else if let Some(random) = &e.random_sound_effect {
                    (None, random.random_sound_id.clone())
                } else {
                    (None, Vec::new())
                };

                let (pitch_min, pitch_max) = if let Some(pitch) = &e.random_pitch {
                    (pitch.min, pitch.max)
                } else {
                    (None, None)
                };

                let (volume_min, volume_max) = if let Some(volume) = &e.random_volume {
                    (volume.min, volume.max)
                } else {
                    (None, None)
                };

                NumericSoundEffectInfo {
                    id: e.id.unwrap_or_default(),
                    sound_type: sound_type.to_string(),
                    sound_id,
                    random_sound_ids,
                    random_pitch_min: pitch_min,
                    random_pitch_max: pitch_max,
                    random_volume_min: volume_min,
                    random_volume_max: volume_max,
                }
            })
            .collect();

        let ambience_streams: Vec<AmbienceStreamInfo> = sounds
            .ambience_stream
            .iter()
            .map(|a| AmbienceStreamInfo {
                id: a.id.unwrap_or_default(),
                looping_sound_id: a.looping_sound_id.unwrap_or_default(),
                delayed_effects: a
                    .delayed_effects
                    .iter()
                    .map(|d| DelayedSoundEffectInfo {
                        numeric_sound_effect_id: d.numeric_sound_effect_id.unwrap_or_default(),
                        delay_seconds: d.delay_seconds.unwrap_or_default(),
                    })
                    .collect(),
            })
            .collect();

        let ambience_object_streams: Vec<AmbienceObjectStreamInfo> = sounds
            .ambience_object_stream
            .iter()
            .map(|a| AmbienceObjectStreamInfo {
                id: a.id.unwrap_or_default(),
                counted_appearance_types: a.counted_appearance_types.clone(),
                sound_effects: a
                    .sound_effects
                    .iter()
                    .map(|s| AppearanceTypesCountSoundEffectInfo {
                        count: s.count.unwrap_or_default(),
                        looping_sound_id: s.looping_sound_id.unwrap_or_default(),
                    })
                    .collect(),
                max_sound_distance: a.max_sound_distance,
            })
            .collect();

        let music_templates: Vec<MusicTemplateInfo> = sounds
            .music_template
            .iter()
            .map(|m| {
                let music_type = match EMusicType::from_i32(m.music_type.unwrap_or_default()) {
                    Some(EMusicType::MusicTypeUnknown) => "Unknown",
                    Some(EMusicType::MusicTypeMusic) => "Music",
                    Some(EMusicType::MusicTypeMusicImmediate) => "Music Immediate",
                    Some(EMusicType::MusicTypeMusicTitle) => "Music Title",
                    None => "Unknown",
                };

                MusicTemplateInfo {
                    id: m.id.unwrap_or_default(),
                    sound_id: m.sound_id.unwrap_or_default(),
                    music_type: music_type.to_string(),
                }
            })
            .collect();

        Ok(SoundsData {
            sounds: sounds_list,
            numeric_sound_effects: numeric_effects,
            ambience_streams,
            ambience_object_streams,
            music_templates,
        })
    }

    pub fn get_sounds_data(&self) -> Option<&SoundsData> {
        self.sounds_data.as_ref()
    }

    pub fn get_sound_by_id(&self, id: u32) -> Option<&SoundInfo> {
        self.sounds_data
            .as_ref()?
            .sounds
            .iter()
            .find(|s| s.id == id)
    }

    pub fn get_sounds_by_type(&self, sound_type: &str) -> Vec<&NumericSoundEffectInfo> {
        if let Some(data) = &self.sounds_data {
            data.numeric_sound_effects
                .iter()
                .filter(|e| e.sound_type == sound_type)
                .collect()
        } else {
            Vec::new()
        }
    }

    pub fn list_sound_types(&self) -> Vec<String> {
        if let Some(data) = &self.sounds_data {
            let mut types: Vec<String> = data
                .numeric_sound_effects
                .iter()
                .map(|e| e.sound_type.clone())
                .collect();
            types.sort();
            types.dedup();
            types
        } else {
            Vec::new()
        }
    }

    /// Get the audio file path for a sound ID
    pub fn get_sound_file_path(&self, sound_id: u32) -> Option<PathBuf> {
        let sound = self.get_sound_by_id(sound_id)?;
        let sounds_dir = self.sounds_dir.as_ref()?;
        Some(sounds_dir.join(&sound.filename))
    }

    /// Read audio file data (OGG format)
    pub fn read_sound_file(&self, sound_id: u32) -> Result<Vec<u8>> {
        let file_path = self
            .get_sound_file_path(sound_id)
            .context("Sound file not found")?;

        fs::read(&file_path)
            .context(format!("Failed to read sound file: {:?}", file_path))
    }

    // NEW: Get NumericSoundEffect by its numeric ID
    pub fn get_numeric_sound_effect_by_id(&self, id: u32) -> Option<&NumericSoundEffectInfo> {
        self.sounds_data
            .as_ref()?
            .numeric_sound_effects
            .iter()
            .find(|e| e.id == id)
    }
}
