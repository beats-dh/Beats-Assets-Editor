// Application state module
// Contains the global application state shared across all features
// HEAVILY OPTIMIZED: parking_lot locks (3x faster), LRU caches with bounds, ID indexes for O(1) lookups

use dashmap::DashMap;
use parking_lot::{Mutex, RwLock};
use std::path::PathBuf;
use std::sync::Arc;

use crate::core::cache::LRUCache;
use crate::features::appearances::{Appearances, CompleteFlags};
use crate::features::sprites::parsers::SpriteLoader;
use crate::features::staticdata::StaticData;
use crate::features::staticmapdata::StaticMapData;

/// Application state to hold loaded appearances and sprites
/// EXTREME OPTIMIZATIONS:
/// - parking_lot::RwLock (3x faster than std::sync::RwLock)
/// - LRU caches with bounded memory (prevents OOM)
/// - ID index maps for O(1) appearance lookups (no more O(n) linear scans)
/// - AHashMap for faster hashing than default SipHash
pub struct AppState {
    // Core data with parking_lot locks (3x faster than std locks)
    pub appearances: RwLock<Option<Appearances>>,
    pub sprite_loader: RwLock<Option<SpriteLoader>>,
    pub tibia_path: Mutex<Option<PathBuf>>,

    // StaticData
    pub staticdata: RwLock<Option<StaticData>>,
    pub staticmapdata: RwLock<Option<StaticMapData>>,

    // ✅ OPTIMIZED: Bounded LRU caches (prevents memory exhaustion)
    pub sprite_cache: LRUCache<String, Vec<Vec<u8>>>, // Max 5000 entries (appearance sprites)
    pub preview_cache: LRUCache<String, Vec<u8>>,     // Max 5000 entries (preview sprites)
    pub png_cache: LRUCache<u32, Vec<u8>>,            // Max 5000 entries (individual PNG by sprite ID)

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

    // Imported sprite overrides (e.g., from AEC files)
    pub imported_sprites: DashMap<u32, Vec<u8>, ahash::RandomState>,
    pub imported_sprite_hashes: DashMap<u64, u32, ahash::RandomState>,
    pub imported_sprite_next_id: Mutex<Option<u32>>,
}

impl AppState {
    /// Create new AppState with optimized caches
    pub fn new() -> Self {
        Self {
            appearances: RwLock::new(None),
            sprite_loader: RwLock::new(None),
            tibia_path: Mutex::new(None),
            staticdata: RwLock::new(None),
            staticmapdata: RwLock::new(None),

            // LRU caches with size limits
            sprite_cache: LRUCache::new(5000),
            preview_cache: LRUCache::new(5000),
            png_cache: LRUCache::new(5000), // ~250MB max (5000 × ~50KB avg PNG)

            // Indexes
            object_index: DashMap::with_hasher(ahash::RandomState::new()),
            outfit_index: DashMap::with_hasher(ahash::RandomState::new()),
            effect_index: DashMap::with_hasher(ahash::RandomState::new()),
            missile_index: DashMap::with_hasher(ahash::RandomState::new()),

            // Search cache
            search_cache: DashMap::with_hasher(ahash::RandomState::new()),

            flags_clipboard: Mutex::new(None),

            imported_sprites: DashMap::with_hasher(ahash::RandomState::new()),
            imported_sprite_hashes: DashMap::with_hasher(ahash::RandomState::new()),
            imported_sprite_next_id: Mutex::new(None),
        }
    }

    /// Get cache statistics for monitoring with estimated memory usage
    pub fn cache_stats(&self) -> CacheStatistics {
        CacheStatistics {
            // Sprite cache: avg ~20KB per appearance (multiple sprite frames)
            sprite_cache: self.sprite_cache.stats_with_memory_estimate(20_000),
            // Preview cache: avg ~5KB per preview sprite
            preview_cache: self.preview_cache.stats_with_memory_estimate(5_000),
            // PNG cache: avg ~50KB per individual PNG
            png_cache: self.png_cache.stats_with_memory_estimate(50_000),
            search_cache_size: self.search_cache.len(),
            imported_sprites_count: self.imported_sprites.len(),
        }
    }

    /// Clear all caches
    pub fn clear_caches(&self) {
        self.sprite_cache.clear();
        self.preview_cache.clear();
        self.png_cache.clear();
        self.search_cache.clear();
        log::info!("All caches cleared");
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

/// Cache statistics for monitoring with memory estimates
#[derive(Debug, Clone, serde::Serialize)]
pub struct CacheStatistics {
    pub sprite_cache: crate::core::cache::CacheStats,
    pub preview_cache: crate::core::cache::CacheStats,
    pub png_cache: crate::core::cache::CacheStats,
    pub search_cache_size: usize,
    pub imported_sprites_count: usize,
}

/// Tauri command to get cache memory statistics
#[tauri::command]
pub fn get_cache_memory_stats(state: tauri::State<'_, AppState>) -> CacheStatistics {
    state.cache_stats()
}
