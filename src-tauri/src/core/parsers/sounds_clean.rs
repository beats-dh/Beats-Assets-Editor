use std::fs;
use std::path::{Path, PathBuf};
use std::convert::TryFrom;

use anyhow::{Context, Result};
use prost::Message;
use serde::{Deserialize, Serialize};

use crate::core::protobuf::sound::{
  AmbienceObjectStream,
  AmbienceStream,
  ENumericSoundType,
  EMusicType,
  MusicTemplate,
  NumericSoundEffect,
  Sound,
  Sounds,
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

  pub fn load_from_directory(&mut self, sounds_dir: &Path) -> Result<SoundStats> {
    let catalog_path = sounds_dir.join("catalog-sound.json");
    let catalog_content = fs::read_to_string(&catalog_path)
      .context("Failed to read catalog-sound.json")?;

    let catalog_entries: Vec<SoundCatalog> = match serde_json::from_str(&catalog_content) {
      Ok(entries) => entries,
      Err(_) => {
        let single: SoundCatalog = serde_json::from_str(&catalog_content)
          .context("Failed to parse catalog-sound.json")?;
        vec![single]
      }
    };

    if catalog_entries.is_empty() {
      anyhow::bail!("catalog-sound.json has no entries");
    }

    let selected = catalog_entries
      .iter()
      .find(|entry| entry.catalog_type == "sounds")
      .cloned()
      .unwrap_or_else(|| catalog_entries[0].clone());

    log::info!(
      "catalog-sound.json: found {} entries; using file: {}",
      catalog_entries.len(),
      selected.file
    );

    let dat_path = sounds_dir.join(&selected.file);
    let dat_content = fs::read(&dat_path)
      .context(format!("Failed to read {}", selected.file))?;

    let sounds = match Sounds::decode(dat_content.as_slice()) {
      Ok(decoded) => {
        log::info!("Sounds decoded directly without decompression");
        decoded
      }
      Err(err) => {
        log::warn!(
          "Direct sounds decode failed: {}. Trying LZMA/XZ decompress...",
          err
        );
        let decompressed = crate::core::lzma::decompress(&dat_content)
          .context("Failed to decompress sounds data (LZMA/XZ)")?;
        Sounds::decode(decompressed.as_slice())
          .context("Failed to decode sounds protobuf after decompression")?
      }
    };

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
      .map(|sound| SoundInfo {
        id: sound.id.unwrap_or_default(),
        filename: sound.filename.clone().unwrap_or_default(),
        original_filename: sound.original_filename.clone(),
        is_stream: sound.is_stream.unwrap_or(false),
      })
      .collect();

    let numeric_effects: Vec<NumericSoundEffectInfo> = sounds
      .numeric_sound_effect
      .iter()
      .map(|effect| build_numeric_effect_info(effect))
      .collect();

    let ambience_streams: Vec<AmbienceStreamInfo> = sounds
      .ambience_stream
      .iter()
      .map(|stream| build_ambience_stream_info(stream))
      .collect();

    let ambience_object_streams: Vec<AmbienceObjectStreamInfo> = sounds
      .ambience_object_stream
      .iter()
      .map(|stream| build_ambience_object_stream_info(stream))
      .collect();

    let music_templates: Vec<MusicTemplateInfo> = sounds
      .music_template
      .iter()
      .map(|template| build_music_template_info(template))
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
    self
      .sounds_data
      .as_ref()?
      .sounds
      .iter()
      .find(|sound| sound.id == id)
  }

  pub fn get_sounds_by_type(&self, sound_type: &str) -> Vec<&NumericSoundEffectInfo> {
    if let Some(data) = &self.sounds_data {
      data
        .numeric_sound_effects
        .iter()
        .filter(|effect| effect.sound_type == sound_type)
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
        .map(|effect| effect.sound_type.clone())
        .collect();
      types.sort();
      types.dedup();
      types
    } else {
      Vec::new()
    }
  }

  pub fn get_sound_file_path(&self, sound_id: u32) -> Option<PathBuf> {
    let sound = self.get_sound_by_id(sound_id)?;
    let sounds_dir = self.sounds_dir.as_ref()?;
    Some(sounds_dir.join(&sound.filename))
  }

  pub fn read_sound_file(&self, sound_id: u32) -> Result<Vec<u8>> {
    let file_path = self
      .get_sound_file_path(sound_id)
      .context("Sound file not found")?;

    fs::read(&file_path).context(format!("Failed to read sound file: {:?}", file_path))
  }

  pub fn get_numeric_sound_effect_by_id(&self, id: u32) -> Option<&NumericSoundEffectInfo> {
    self
      .sounds_data
      .as_ref()?
      .numeric_sound_effects
      .iter()
      .find(|effect| effect.id == id)
  }

  pub fn update_sound_info(&mut self, updated: SoundInfo) -> Result<()> {
    let data = self.sounds_data.as_mut().context("Sounds not loaded")?;
    if let Some(sound) = data.sounds.iter_mut().find(|sound| sound.id == updated.id) {
      *sound = updated;
      Ok(())
    } else {
      anyhow::bail!("Sound with id {} not found", updated.id);
    }
  }

  pub fn update_numeric_sound_effect(&mut self, updated: NumericSoundEffectInfo) -> Result<()> {
    let data = self.sounds_data.as_mut().context("Sounds not loaded")?;
    if let Some(effect) = data
      .numeric_sound_effects
      .iter_mut()
      .find(|effect| effect.id == updated.id)
    {
      *effect = updated;
      Ok(())
    } else {
      anyhow::bail!("Numeric sound effect with id {} not found", updated.id);
    }
  }
}

fn build_numeric_effect_info(effect: &NumericSoundEffect) -> NumericSoundEffectInfo {
  let sound_type_enum = ENumericSoundType::try_from(effect.numeric_sound_type.unwrap_or_default())
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

  let (sound_id, random_sound_ids) = if let Some(simple) = &effect.simple_sound_effect {
    (simple.sound_id, Vec::new())
  } else if let Some(random) = &effect.random_sound_effect {
    (None, random.random_sound_id.clone())
  } else {
    (None, Vec::new())
  };

  let (pitch_min, pitch_max) = effect
    .random_pitch
    .as_ref()
    .map(|pitch| (pitch.min, pitch.max))
    .unwrap_or((None, None));

  let (volume_min, volume_max) = effect
    .random_volume
    .as_ref()
    .map(|volume| (volume.min, volume.max))
    .unwrap_or((None, None));

  NumericSoundEffectInfo {
    id: effect.id.unwrap_or_default(),
    sound_type: sound_type.to_string(),
    sound_id,
    random_sound_ids,
    random_pitch_min: pitch_min,
    random_pitch_max: pitch_max,
    random_volume_min: volume_min,
    random_volume_max: volume_max,
  }
}

fn build_ambience_stream_info(stream: &AmbienceStream) -> AmbienceStreamInfo {
  AmbienceStreamInfo {
    id: stream.id.unwrap_or_default(),
    looping_sound_id: stream.looping_sound_id.unwrap_or_default(),
    delayed_effects: stream
      .delayed_effects
      .iter()
      .map(|delayed| DelayedSoundEffectInfo {
        numeric_sound_effect_id: delayed.numeric_sound_effect_id.unwrap_or_default(),
        delay_seconds: delayed.delay_seconds.unwrap_or_default(),
      })
      .collect(),
  }
}

fn build_ambience_object_stream_info(stream: &AmbienceObjectStream) -> AmbienceObjectStreamInfo {
  AmbienceObjectStreamInfo {
    id: stream.id.unwrap_or_default(),
    counted_appearance_types: stream.counted_appearance_types.clone(),
    sound_effects: stream
      .sound_effects
      .iter()
      .map(|effect| AppearanceTypesCountSoundEffectInfo {
        count: effect.count.unwrap_or_default(),
        looping_sound_id: effect.looping_sound_id.unwrap_or_default(),
      })
      .collect(),
    max_sound_distance: stream.max_sound_distance,
  }
}

fn build_music_template_info(template: &MusicTemplate) -> MusicTemplateInfo {
  let music_type_enum = EMusicType::try_from(template.music_type.unwrap_or_default())
    .unwrap_or(EMusicType::MusicTypeUnknown);
  let music_type = match music_type_enum {
    EMusicType::MusicTypeUnknown => "Unknown",
    EMusicType::MusicTypeMusic => "Music",
    EMusicType::MusicTypeMusicImmediate => "Music Immediate",
    EMusicType::MusicTypeMusicTitle => "Music Title",
  };

  MusicTemplateInfo {
    id: template.id.unwrap_or_default(),
    sound_id: template.sound_id.unwrap_or_default(),
    music_type: music_type.to_string(),
  }
}
