use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use crate::core::parsers::SpriteLoader;
use crate::core::protobuf::Appearances;

// Keep complete types separated
mod appearance_types;
pub use appearance_types::*;

// New API module housing all Tauri commands for appearances and sprites
pub mod appearances_api;
pub mod settings;
pub mod sounds_api;
pub mod map_api;

/// Application state to hold loaded appearances and sprites
pub struct AppState {
    pub appearances: Mutex<Option<Appearances>>,
    pub sprite_loader: Mutex<Option<SpriteLoader>>,
    pub tibia_path: Mutex<Option<PathBuf>>,
    pub sprite_cache: Mutex<HashMap<String, Vec<String>>>, // cache key -> base64 sprites
    pub flags_clipboard: Mutex<Option<CompleteFlags>>,
}
