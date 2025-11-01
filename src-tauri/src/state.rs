// Application state module
// Contains the global application state shared across all features

use dashmap::DashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, RwLock};

use crate::features::appearances::{Appearances, CompleteFlags};
use crate::features::sprites::parsers::SpriteLoader;

/// Application state to hold loaded appearances and sprites
/// Optimized with lock-free data structures (DashMap) and RwLock for concurrent reads
pub struct AppState {
    pub appearances: RwLock<Option<Appearances>>,        // RwLock: multiple concurrent reads
    pub sprite_loader: RwLock<Option<SpriteLoader>>,     // RwLock: multiple concurrent reads
    pub tibia_path: Mutex<Option<PathBuf>>,              // Mutex: rarely accessed
    pub sprite_cache: DashMap<String, Arc<Vec<String>>>, // Lock-free cache: key -> Arc<base64 sprites>
    pub flags_clipboard: Mutex<Option<CompleteFlags>>,   // Mutex: rarely accessed
}
