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

    // ✅ OPTIMIZED: Bounded LRU caches (prevents memory exhaustion)
    pub sprite_cache: LRUCache<String, Vec<Vec<u8>>>, // Max 1000 entries
    pub preview_cache: LRUCache<String, Vec<u8>>,     // Max 500 entries

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

impl AppState {
    /// Create new AppState with optimized caches
    pub fn new() -> Self {
        Self {
            appearances: RwLock::new(None),
            sprite_loader: RwLock::new(None),
            tibia_path: Mutex::new(None),

            // LRU caches with size limits
            sprite_cache: LRUCache::new(1000), // ~100MB max
            preview_cache: LRUCache::new(500), // ~25MB max

            // Indexes
            object_index: DashMap::with_hasher(ahash::RandomState::new()),
            outfit_index: DashMap::with_hasher(ahash::RandomState::new()),
            effect_index: DashMap::with_hasher(ahash::RandomState::new()),
            missile_index: DashMap::with_hasher(ahash::RandomState::new()),

            // Search cache
            search_cache: DashMap::with_hasher(ahash::RandomState::new()),

            flags_clipboard: Mutex::new(None),
        }
    }

    /// Get cache statistics for monitoring
    pub fn cache_stats(&self) -> CacheStatistics {
        CacheStatistics {
            sprite_cache: self.sprite_cache.stats(),
            preview_cache: self.preview_cache.stats(),
            search_cache_size: self.search_cache.len(),
        }
    }

    /// Clear all caches
    pub fn clear_caches(&self) {
        self.sprite_cache.clear();
        self.preview_cache.clear();
        self.search_cache.clear();
        log::info!("All caches cleared");
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

/// Cache statistics for monitoring
#[derive(Debug, Clone, serde::Serialize)]
pub struct CacheStatistics {
    pub sprite_cache: crate::core::cache::CacheStats,
    pub preview_cache: crate::core::cache::CacheStats,
    pub search_cache_size: usize,
}
