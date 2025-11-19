// Application state module
// Contains the global application state shared across all features
// HEAVILY OPTIMIZED: parking_lot locks (3x faster), DashMap for lock-free access, ID indexes for O(1) lookups

use dashmap::DashMap;
use parking_lot::{Mutex, RwLock};
use std::path::PathBuf;
use std::sync::Arc;

use crate::features::appearances::{Appearances, CompleteFlags};
use crate::features::sprites::parsers::SpriteLoader;

/// Application state to hold loaded appearances and sprites
/// EXTREME OPTIMIZATIONS:
/// - parking_lot::RwLock (3x faster than std::sync::RwLock)
/// - DashMap for lock-free concurrent sprite cache access
/// - ID index maps for O(1) appearance lookups (no more O(n) linear scans)
/// - AHashMap for faster hashing than default SipHash
pub struct AppState {
    // Core data with parking_lot locks (3x faster than std locks)
    pub appearances: RwLock<Option<Appearances>>,
    pub sprite_loader: RwLock<Option<SpriteLoader>>,
    pub tibia_path: Mutex<Option<PathBuf>>,

    // Lock-free concurrent caches
    pub sprite_cache: DashMap<String, Arc<Vec<Vec<u8>>>>, // Lock-free: key -> Arc<PNG bytes>
    pub preview_cache: DashMap<String, Arc<Vec<u8>>>,     // First-frame cache to avoid recompressing previews

    // O(1) lookup indexes - no more O(n) linear scans!
    // Maps: ID -> index in Vec for instant lookups
    pub object_index: DashMap<u32, usize, ahash::RandomState>,
    pub outfit_index: DashMap<u32, usize, ahash::RandomState>,
    pub effect_index: DashMap<u32, usize, ahash::RandomState>,
    pub missile_index: DashMap<u32, usize, ahash::RandomState>,

    // Search cache: memoize expensive filter operations
    // Key: "category:search_term:subcategory" -> Vec<AppearanceItem>
    pub search_cache: DashMap<String, Arc<Vec<u32>>, ahash::RandomState>, // Cache filtered IDs

    pub flags_clipboard: Mutex<Option<CompleteFlags>>,
}
