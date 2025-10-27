use std::fs;
use std::path::{Path, PathBuf};
use std::convert::TryFrom;
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
                let sound_type_enum = ENumericSoundType::try_from(
                    e.numeric_sound_type.unwrap_or_default(),
                )
                .unwrap_or(ENumericSoundType::NumericSoundTypeUnknown);
                let sound_type = match sound_type_enum {
                    ENumericSoundType::NumericSoundTypeUnknown => "Unknown",
                    ENumericSoundType::NumericSoundTypeSpellAttack => "Spell Attack",
                    ENumericSoundType::NumericSoundTypeSpellHealing => "Spell Healing",
                    ENumericSoundType::NumericSoundTypeSpellSupport => "Spell Support",
                    ENumericSoundType::NumericSoundTypeWeaponAttack => "Weapon Attack",
                    ENumericSoundType::NumericSoundTypeCreatureNoise => "Creature Noise",
                    ENumericSoundType::NumericSoundTypeCreatureDeath => "Creature Death",
                    ENumericSoundType::NumericSoundTypeCreatureAttack => "Creature Attack",
                    ENumericSoundType::NumericSoundTypeAmbienceStream => "Ambience Stream",
                    ENumericSoundType::NumericSoundTypeFoodAndDrink => "Food and Drink",
                    ENumericSoundType::NumericSoundTypeItemMovement => "Item Movement",
                    ENumericSoundType::NumericSoundTypeEvent => "Event",
                    ENumericSoundType::NumericSoundTypeUi => "UI",
                    ENumericSoundType::NumericSoundTypeWhisperWithoutOpenChat => "Whisper",
                    ENumericSoundType::NumericSoundTypeChatMessage => "Chat Message",
                    ENumericSoundType::NumericSoundTypeParty => "Party",
                    ENumericSoundType::NumericSoundTypeVipList => "VIP List",
                    ENumericSoundType::NumericSoundTypeRaidAnnouncement => "Raid Announcement",
                    ENumericSoundType::NumericSoundTypeServerMessage => "Server Message",
                    ENumericSoundType::NumericSoundTypeSpellGeneric => "Spell Generic",
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
                let music_type_enum = EMusicType::try_from(m.music_type.unwrap_or_default())
                    .unwrap_or(EMusicType::MusicTypeUnknown);
                let music_type = match music_type_enum {
                    EMusicType::MusicTypeUnknown => "Unknown",
                    EMusicType::MusicTypeMusic => "Music",
                    EMusicType::MusicTypeMusicImmediate => "Music Immediate",
                    EMusicType::MusicTypeMusicTitle => "Music Title",
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

    /// Get currently loaded sounds directory
    pub fn get_sounds_dir(&self) -> Option<PathBuf> {
        self.sounds_dir.clone()
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

    // NEW: Update helpers for runtime edits
    pub fn update_sound_info(&mut self, updated: SoundInfo) -> Result<()> {
        let data = self.sounds_data.as_mut().context("Sounds not loaded")?;
        if let Some(s) = data.sounds.iter_mut().find(|s| s.id == updated.id) {
            *s = updated;
            Ok(())
        } else {
            anyhow::bail!("Sound with id {} not found", updated.id);
        }
    }

    pub fn update_numeric_sound_effect(&mut self, updated: NumericSoundEffectInfo) -> Result<()> {
        let data = self.sounds_data.as_mut().context("Sounds not loaded")?;
        if let Some(eff) = data
            .numeric_sound_effects
            .iter_mut()
            .find(|e| e.id == updated.id)
        {
            *eff = updated;
            Ok(())
        } else {
            anyhow::bail!("NumericSoundEffect with id {} not found", updated.id);
        }
    }

    pub fn update_ambience_stream(&mut self, updated: AmbienceStreamInfo) -> Result<()> {
        let data = self.sounds_data.as_mut().context("Sounds not loaded")?;
        if let Some(s) = data.ambience_streams.iter_mut().find(|s| s.id == updated.id) {
            *s = updated;
            Ok(())
        } else {
            anyhow::bail!("AmbienceStream with id {} not found", updated.id);
        }
    }

    pub fn update_ambience_object_stream(&mut self, updated: AmbienceObjectStreamInfo) -> Result<()> {
        let data = self.sounds_data.as_mut().context("Sounds not loaded")?;
        if let Some(s) = data
            .ambience_object_streams
            .iter_mut()
            .find(|s| s.id == updated.id)
        {
            *s = updated;
            Ok(())
        } else {
            anyhow::bail!("AmbienceObjectStream with id {} not found", updated.id);
        }
    }

    pub fn update_music_template(&mut self, updated: MusicTemplateInfo) -> Result<()> {
        let data = self.sounds_data.as_mut().context("Sounds not loaded")?;
        if let Some(m) = data.music_templates.iter_mut().find(|m| m.id == updated.id) {
            *m = updated;
            Ok(())
        } else {
            anyhow::bail!("MusicTemplate with id {} not found", updated.id);
        }
    }

    /// Add a new base Sound entry. If the provided id is 0 or already exists,
    /// a new unique id will be assigned (max(existing)+1). Returns the final id.
    pub fn add_sound(&mut self, mut new: SoundInfo) -> Result<u32> {
        let data = self.sounds_data.as_mut().context("Sounds not loaded")?;

        if new.filename.trim().is_empty() {
            anyhow::bail!("filename must not be empty");
        }

        let mut max_id = 0u32;
        let mut id_exists = false;
        for s in &data.sounds {
            max_id = max_id.max(s.id);
            if s.id == new.id { id_exists = true; }
        }

        if new.id == 0 || id_exists {
            new.id = max_id.checked_add(1).unwrap_or(max_id);
        }

        data.sounds.push(new.clone());
        Ok(new.id)
    }

    /// Delete a base Sound by id. Fails if referenced by any effect/stream/template.
    pub fn delete_sound(&mut self, id: u32) -> Result<()> {
        let data = self.sounds_data.as_mut().context("Sounds not loaded")?;

        // Check references
        let referenced_by_effect = data
            .numeric_sound_effects
            .iter()
            .any(|e| e.sound_id == Some(id) || e.random_sound_ids.iter().any(|rid| *rid == id));
        if referenced_by_effect {
            anyhow::bail!("Sound {} is referenced by a NumericSoundEffect", id);
        }

        let referenced_by_stream = data
            .ambience_streams
            .iter()
            .any(|a| a.looping_sound_id == id);
        if referenced_by_stream {
            anyhow::bail!("Sound {} is referenced by an AmbienceStream", id);
        }

        let referenced_by_object_stream = data
            .ambience_object_streams
            .iter()
            .any(|a| a.sound_effects.iter().any(|s| s.looping_sound_id == id));
        if referenced_by_object_stream {
            anyhow::bail!("Sound {} is referenced by an AmbienceObjectStream", id);
        }

        let referenced_by_music = data
            .music_templates
            .iter()
            .any(|m| m.sound_id == id);
        if referenced_by_music {
            anyhow::bail!("Sound {} is referenced by a MusicTemplate", id);
        }

        let before_len = data.sounds.len();
        data.sounds.retain(|s| s.id != id);
        if data.sounds.len() == before_len {
            anyhow::bail!("Sound with id {} not found", id);
        }
        Ok(())
    }

    /// Add a new NumericSoundEffect. If id is 0 or collides, assign max+1. Returns the final id.
    pub fn add_numeric_sound_effect(&mut self, mut new: NumericSoundEffectInfo) -> Result<u32> {
        let data = self.sounds_data.as_mut().context("Sounds not loaded")?;

        let mut max_id = 0u32;
        let mut id_exists = false;
        for e in &data.numeric_sound_effects {
            max_id = max_id.max(e.id);
            if e.id == new.id { id_exists = true; }
        }

        if new.id == 0 || id_exists {
            new.id = max_id.checked_add(1).unwrap_or(max_id);
        }

        data.numeric_sound_effects.push(new.clone());
        Ok(new.id)
    }

    /// Delete a NumericSoundEffect by id. Fails if referenced by an AmbienceStream delayed effect.
    pub fn delete_numeric_sound_effect(&mut self, id: u32) -> Result<()> {
        let data = self.sounds_data.as_mut().context("Sounds not loaded")?;

        let referenced_by_delayed = data
            .ambience_streams
            .iter()
            .any(|a| a.delayed_effects.iter().any(|d| d.numeric_sound_effect_id == id));
        if referenced_by_delayed {
            anyhow::bail!("NumericSoundEffect {} is referenced by an AmbienceStream delayed effect", id);
        }

        let before_len = data.numeric_sound_effects.len();
        data.numeric_sound_effects.retain(|e| e.id != id);
        if data.numeric_sound_effects.len() == before_len {
            anyhow::bail!("NumericSoundEffect with id {} not found", id);
        }
        Ok(())
    }

    // NEW: Encode current SoundsData back into protobuf
    fn map_numeric_sound_type(&self, s: &str) -> i32 {
        match s {
            "Spell Attack" => ENumericSoundType::NumericSoundTypeSpellAttack as i32,
            "Spell Healing" => ENumericSoundType::NumericSoundTypeSpellHealing as i32,
            "Spell Support" => ENumericSoundType::NumericSoundTypeSpellSupport as i32,
            "Weapon Attack" => ENumericSoundType::NumericSoundTypeWeaponAttack as i32,
            "Creature Noise" => ENumericSoundType::NumericSoundTypeCreatureNoise as i32,
            "Creature Death" => ENumericSoundType::NumericSoundTypeCreatureDeath as i32,
            "Creature Attack" => ENumericSoundType::NumericSoundTypeCreatureAttack as i32,
            "Ambience Stream" => ENumericSoundType::NumericSoundTypeAmbienceStream as i32,
            "Food and Drink" => ENumericSoundType::NumericSoundTypeFoodAndDrink as i32,
            "Item Movement" => ENumericSoundType::NumericSoundTypeItemMovement as i32,
            "Event" => ENumericSoundType::NumericSoundTypeEvent as i32,
            "UI" => ENumericSoundType::NumericSoundTypeUi as i32,
            "Whisper" => ENumericSoundType::NumericSoundTypeWhisperWithoutOpenChat as i32,
            "Chat Message" => ENumericSoundType::NumericSoundTypeChatMessage as i32,
            "Party" => ENumericSoundType::NumericSoundTypeParty as i32,
            "VIP List" => ENumericSoundType::NumericSoundTypeVipList as i32,
            "Raid Announcement" => ENumericSoundType::NumericSoundTypeRaidAnnouncement as i32,
            "Server Message" => ENumericSoundType::NumericSoundTypeServerMessage as i32,
            "Spell Generic" => ENumericSoundType::NumericSoundTypeSpellGeneric as i32,
            _ => ENumericSoundType::NumericSoundTypeUnknown as i32,
        }
    }

    fn map_music_type(&self, s: &str) -> i32 {
        match s {
            "Music" => EMusicType::MusicTypeMusic as i32,
            "Music Immediate" => EMusicType::MusicTypeMusicImmediate as i32,
            "Music Title" => EMusicType::MusicTypeMusicTitle as i32,
            _ => EMusicType::MusicTypeUnknown as i32,
        }
    }

    fn rebuild_protobuf(&self) -> Result<Sounds> {
        use crate::core::protobuf::sound::{
            SimpleSoundEffect, RandomSoundEffect, DelayedSoundEffect, AppearanceTypesCountSoundEffect,
            MinMaxFloat,
        };

        let data = self.sounds_data.as_ref().context("Sounds not loaded")?;

        let sounds: Vec<Sound> = data
            .sounds
            .iter()
            .map(|s| Sound {
                id: Some(s.id),
                filename: Some(s.filename.clone()),
                original_filename: s.original_filename.clone(),
                is_stream: Some(s.is_stream),
            })
            .collect();

        let numeric_sound_effect: Vec<NumericSoundEffect> = data
            .numeric_sound_effects
            .iter()
            .map(|e| {
                let numeric_sound_type = Some(self.map_numeric_sound_type(&e.sound_type));

                let simple_sound_effect = e.sound_id.map(|sid| SimpleSoundEffect { sound_id: Some(sid) });
                let random_sound_effect = if !e.random_sound_ids.is_empty() {
                    Some(RandomSoundEffect { random_sound_id: e.random_sound_ids.clone() })
                } else { None };

                let random_pitch = match (e.random_pitch_min, e.random_pitch_max) {
                    (Some(min), Some(max)) => Some(MinMaxFloat { min: Some(min), max: Some(max) }),
                    (Some(min), None) => Some(MinMaxFloat { min: Some(min), max: None }),
                    (None, Some(max)) => Some(MinMaxFloat { min: None, max: Some(max) }),
                    _ => None,
                };

                let random_volume = match (e.random_volume_min, e.random_volume_max) {
                    (Some(min), Some(max)) => Some(MinMaxFloat { min: Some(min), max: Some(max) }),
                    (Some(min), None) => Some(MinMaxFloat { min: Some(min), max: None }),
                    (None, Some(max)) => Some(MinMaxFloat { min: None, max: Some(max) }),
                    _ => None,
                };

                NumericSoundEffect {
                    id: Some(e.id),
                    numeric_sound_type,
                    simple_sound_effect,
                    random_sound_effect,
                    random_pitch,
                    random_volume,
                }
            })
            .collect();

        let ambience_stream: Vec<AmbienceStream> = data
            .ambience_streams
            .iter()
            .map(|a| AmbienceStream {
                id: Some(a.id),
                looping_sound_id: Some(a.looping_sound_id),
                delayed_effects: a
                    .delayed_effects
                    .iter()
                    .map(|d| DelayedSoundEffect {
                        numeric_sound_effect_id: Some(d.numeric_sound_effect_id),
                        delay_seconds: Some(d.delay_seconds),
                    })
                    .collect(),
            })
            .collect();

        let ambience_object_stream: Vec<AmbienceObjectStream> = data
            .ambience_object_streams
            .iter()
            .map(|o| AmbienceObjectStream {
                id: Some(o.id),
                counted_appearance_types: o.counted_appearance_types.clone(),
                sound_effects: o
                    .sound_effects
                    .iter()
                    .map(|s| AppearanceTypesCountSoundEffect {
                        count: Some(s.count),
                        looping_sound_id: Some(s.looping_sound_id),
                    })
                    .collect(),
                max_sound_distance: o.max_sound_distance,
            })
            .collect();

        let music_template: Vec<MusicTemplate> = data
            .music_templates
            .iter()
            .map(|m| MusicTemplate {
                id: Some(m.id),
                sound_id: Some(m.sound_id),
                music_type: Some(self.map_music_type(&m.music_type)),
            })
            .collect();

        Ok(Sounds {
            sound: sounds,
            numeric_sound_effect,
            ambience_stream,
            ambience_object_stream,
            music_template,
        })
    }

    pub fn encode_sounds_bytes(&self) -> Result<Vec<u8>> {
        let sounds = self.rebuild_protobuf()?;
        let mut buf = Vec::with_capacity(sounds.encoded_len());
        sounds.encode(&mut buf)?;
        Ok(buf)
    }

    /// Save current sounds data back to the original .dat from catalog-sound.json
    pub fn save_to_directory(&self) -> Result<PathBuf> {
        let dir = self.sounds_dir.as_ref().context("Sounds directory not set")?;
        // Read catalog-sound.json again to get target file
        let catalog_path = dir.join("catalog-sound.json");
        let catalog_content = fs::read_to_string(&catalog_path)
            .context("Failed to read catalog-sound.json")?;

        let entries: Vec<SoundCatalog> = match serde_json::from_str(&catalog_content) {
            Ok(v) => v,
            Err(_) => {
                let single: SoundCatalog = serde_json::from_str(&catalog_content)
                    .context("Failed to parse catalog-sound.json")?;
                vec![single]
            }
        };
        if entries.is_empty() {
            anyhow::bail!("catalog-sound.json has no entries");
        }
        let selected = entries
            .iter()
            .find(|e| e.catalog_type == "sounds")
            .cloned()
            .unwrap_or_else(|| entries[0].clone());

        let dat_path = dir.join(&selected.file);
        let existing = fs::read(&dat_path).context("Failed to read existing sounds dat")?;
        let compressed = Sounds::decode(existing.as_slice()).is_err();

        let raw = self.encode_sounds_bytes()?;
        let to_write = if compressed {
            crate::core::lzma::compress(&raw).context("Failed to LZMA-compress sounds data")?
        } else {
            raw
        };

        fs::write(&dat_path, &to_write).context("Failed to write sounds dat")?;
        Ok(dat_path)
    }
}
