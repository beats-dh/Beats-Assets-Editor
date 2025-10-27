use std::path::PathBuf;
use std::sync::Mutex;

use tauri::State;

use base64::{engine::general_purpose, Engine as _};

use crate::core::parsers::sounds::{
  AmbienceObjectStreamInfo,
  AmbienceStreamInfo,
  MusicTemplateInfo,
  NumericSoundEffectInfo,
  SoundInfo,
  SoundStats,
  SoundsParser,
};

pub struct SoundsState {
  pub parser: Mutex<SoundsParser>,
}

impl SoundsState {
  pub fn new() -> Self {
    Self {
      parser: Mutex::new(SoundsParser::new()),
    }
  }
}

#[tauri::command]
pub async fn load_sounds_file(sounds_dir: String, state: State<'_, SoundsState>) -> Result<SoundStats, String> {
  let dir_path = PathBuf::from(&sounds_dir);
  log::info!("Loading sounds from directory: {:?}", dir_path);

  let mut parser = state.parser.lock().map_err(|e| e.to_string())?;
  let stats = parser
    .load_from_directory(&dir_path)
    .map_err(|e| format!("Failed to load sounds: {}", e))?;

  log::info!(
    "Successfully loaded sounds: {} sounds, {} numeric effects, {} ambience streams, {} ambience object streams, {} music templates",
    stats.total_sounds,
    stats.total_numeric_effects,
    stats.total_ambience_streams,
    stats.total_ambience_object_streams,
    stats.total_music_templates
  );

  Ok(stats)
}

#[tauri::command]
pub async fn get_sounds_stats(state: State<'_, SoundsState>) -> Result<SoundStats, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;
  let data = parser.get_sounds_data().ok_or("No sounds loaded".to_string())?;
  let stats = SoundStats {
    total_sounds: data.sounds.len(),
    total_numeric_effects: data.numeric_sound_effects.len(),
    total_ambience_streams: data.ambience_streams.len(),
    total_ambience_object_streams: data.ambience_object_streams.len(),
    total_music_templates: data.music_templates.len(),
  };
  log::info!(
    "Sounds stats: {} sounds, {} numeric effects, {} ambience streams, {} ambience object streams, {} music templates",
    stats.total_sounds,
    stats.total_numeric_effects,
    stats.total_ambience_streams,
    stats.total_ambience_object_streams,
    stats.total_music_templates
  );
  Ok(stats)
}

#[tauri::command]
pub async fn list_sound_types(state: State<'_, SoundsState>) -> Result<Vec<String>, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;
  Ok(parser.list_sound_types())
}

#[tauri::command]
pub async fn get_sound_by_id(sound_id: u32, state: State<'_, SoundsState>) -> Result<SoundInfo, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;

  parser
    .get_sound_by_id(sound_id)
    .cloned()
    .ok_or(format!("Sound with ID {} not found", sound_id))
}

#[tauri::command]
pub async fn get_sounds_by_type(sound_type: String, state: State<'_, SoundsState>) -> Result<Vec<NumericSoundEffectInfo>, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;

  let sounds = parser
    .get_sounds_by_type(&sound_type)
    .into_iter()
    .cloned()
    .collect();

  Ok(sounds)
}

#[tauri::command]
pub async fn get_numeric_sound_effect_by_id(id: u32, state: State<'_, SoundsState>) -> Result<NumericSoundEffectInfo, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;
  parser
    .get_numeric_sound_effect_by_id(id)
    .cloned()
    .ok_or(format!("Numeric sound effect with ID {} not found", id))
}

#[tauri::command]
pub async fn list_all_sounds(state: State<'_, SoundsState>) -> Result<Vec<SoundInfo>, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;
  let data = parser.get_sounds_data().ok_or("No sounds loaded".to_string())?;
  Ok(data.sounds.clone())
}

#[tauri::command]
pub async fn list_numeric_sound_effects(
  page: Option<usize>,
  page_size: Option<usize>,
  sound_type: Option<String>,
  state: State<'_, SoundsState>,
) -> Result<Vec<NumericSoundEffectInfo>, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;

  let mut effects: Vec<NumericSoundEffectInfo> = if let Some(kind) = sound_type {
    parser
      .get_sounds_by_type(&kind)
      .into_iter()
      .cloned()
      .collect()
  } else {
    parser
      .get_sounds_data()
      .ok_or("No sounds loaded".to_string())?
      .numeric_sound_effects
      .clone()
  };

  effects.sort_by_key(|effect| effect.id);

  let page_index = page.unwrap_or(0);
  let per_page = page_size.unwrap_or(50);
  let start = page_index * per_page;
  let end = start + per_page;
  let slice = if start < effects.len() {
    &effects[start..effects.len().min(end)]
  } else {
    &[]
  };

  Ok(slice.to_vec())
}

#[tauri::command]
pub async fn get_sound_effect_count(state: State<'_, SoundsState>) -> Result<usize, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;
  let data = parser.get_sounds_data().ok_or("No sounds loaded".to_string())?;
  Ok(data.numeric_sound_effects.len())
}

#[tauri::command]
pub async fn list_ambience_streams(
  page: Option<usize>,
  page_size: Option<usize>,
  state: State<'_, SoundsState>,
) -> Result<Vec<AmbienceStreamInfo>, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;
  let mut items = parser
    .get_sounds_data()
    .ok_or("No sounds loaded".to_string())?
    .ambience_streams
    .clone();
  items.sort_by_key(|stream| stream.id);
  let page_index = page.unwrap_or(0);
  let per_page = page_size.unwrap_or(50);
  let start = page_index * per_page;
  let end = start + per_page;
  let slice = if start < items.len() {
    &items[start..items.len().min(end)]
  } else {
    &[]
  };
  Ok(slice.to_vec())
}

#[tauri::command]
pub async fn list_ambience_object_streams(
  page: Option<usize>,
  page_size: Option<usize>,
  state: State<'_, SoundsState>,
) -> Result<Vec<AmbienceObjectStreamInfo>, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;
  let mut items = parser
    .get_sounds_data()
    .ok_or("No sounds loaded".to_string())?
    .ambience_object_streams
    .clone();
  items.sort_by_key(|stream| stream.id);
  let page_index = page.unwrap_or(0);
  let per_page = page_size.unwrap_or(50);
  let start = page_index * per_page;
  let end = start + per_page;
  let slice = if start < items.len() {
    &items[start..items.len().min(end)]
  } else {
    &[]
  };
  Ok(slice.to_vec())
}

#[tauri::command]
pub async fn list_music_templates(
  page: Option<usize>,
  page_size: Option<usize>,
  state: State<'_, SoundsState>,
) -> Result<Vec<MusicTemplateInfo>, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;
  let mut items = parser
    .get_sounds_data()
    .ok_or("No sounds loaded".to_string())?
    .music_templates
    .clone();
  items.sort_by_key(|template| template.id);
  let page_index = page.unwrap_or(0);
  let per_page = page_size.unwrap_or(50);
  let start = page_index * per_page;
  let end = start + per_page;
  let slice = if start < items.len() {
    &items[start..items.len().min(end)]
  } else {
    &[]
  };
  Ok(slice.to_vec())
}

#[tauri::command]
pub async fn read_sound_file(sound_id: u32, state: State<'_, SoundsState>) -> Result<String, String> {
  let parser = state.parser.lock().map_err(|e| e.to_string())?;
  let data = parser
    .read_sound_file(sound_id)
    .map_err(|e| format!("Failed to read sound file: {}", e))?;
  Ok(general_purpose::STANDARD.encode(data))
}
