use crate::features::appearances::AppearanceCategory;
use crate::features::sprites::parsers::SpriteLoader;
use crate::state::AppState;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use rayon::prelude::*;

#[tauri::command]
pub async fn load_sprites_catalog(catalog_path: String, assets_dir: String, state: State<'_, AppState>) -> Result<usize, String> {
    log::info!("Loading sprites from catalog: {} with assets dir: {}", catalog_path, assets_dir);

    let sprite_loader = SpriteLoader::new(&catalog_path, &assets_dir).map_err(|e| format!("Failed to load sprite catalog: {}", e))?;

    let sprite_count = sprite_loader.sprite_count();

    // Store in state
    *state.sprite_loader.write() = Some(sprite_loader);

    Ok(sprite_count)
}

/// Auto-detect and load sprites from Tibia directory
#[tauri::command]
pub async fn auto_load_sprites(tibia_path: String, state: State<'_, AppState>) -> Result<usize, String> {
    log::info!("Auto-loading sprites from Tibia directory: {}", tibia_path);

    // Force recompilation - First, try to find catalog-content.json in the project root
    let project_root = std::env::current_dir().map_err(|e| format!("Failed to get current directory: {}", e))?;
    let project_catalog_path = project_root.join("catalog-content.json");

    let (catalog_path, assets_dir) = if project_catalog_path.exists() {
        log::info!("Found catalog-content.json in project root: {:?}", project_catalog_path);
        // Use project root for both catalog and assets
        (project_catalog_path, project_root)
    } else {
        // Fallback to Tibia directory - look in assets subdirectory
        let tibia_dir = PathBuf::from(&tibia_path);
        let tibia_assets_dir = tibia_dir.join("assets");
        let tibia_catalog_path = tibia_assets_dir.join("catalog-content.json");
        log::info!("Looking for catalog in Tibia assets directory: {:?}", tibia_catalog_path);

        if !tibia_catalog_path.exists() {
            log::error!("catalog-content.json not found at: {:?}", tibia_catalog_path);
            return Err(format!("catalog-content.json not found in project root or Tibia assets directory"));
        }

        (tibia_catalog_path, tibia_assets_dir)
    };

    log::info!("Using catalog: {:?}", catalog_path);
    log::info!("Using assets directory: {:?}", assets_dir);

    let sprite_loader = SpriteLoader::new(&catalog_path, &assets_dir).map_err(|e| {
        log::error!("Failed to create SpriteLoader: {}", e);
        format!("Failed to auto-load sprites: {}", e)
    })?;

    let sprite_count = sprite_loader.sprite_count();

    // Store in state
    *state.sprite_loader.write() = Some(sprite_loader);

    log::info!("Successfully loaded {} sprites", sprite_count);
    Ok(sprite_count)
}

/// Get sprite by ID as base64 PNG
/// Optimized: SpriteLoader now uses lock-free cache internally
#[tauri::command]
pub async fn get_sprite_by_id(sprite_id: u32, state: State<'_, AppState>) -> Result<String, String> {
    let sprite_loader_lock = state.sprite_loader.read();

    match &*sprite_loader_lock {
        Some(loader) => {
            let sprite = loader.get_sprite(sprite_id).map_err(|e| format!("Failed to get sprite {}: {}", sprite_id, e))?;

            sprite.to_base64_png().map_err(|e| format!("Failed to convert sprite to PNG: {}", e))
        }
        None => Err("No sprites loaded".to_string()),
    }
}

/// Get sprites for an appearance (from sprite IDs in frame groups)
/// Optimized: Lock-free cache with Arc for zero-copy sharing
#[tauri::command]
pub async fn get_appearance_sprites(category: AppearanceCategory, appearance_id: u32, state: State<'_, AppState>) -> Result<Vec<String>, String> {
    // Check cache first (lock-free read)
    let cache_key = format!("{:?}:{}", category, appearance_id);
    if let Some(cached_sprites) = state.sprite_cache.get(&cache_key) {
        return Ok((**cached_sprites).clone());
    }

    let appearances_lock = state.appearances.read();
    let sprite_loader_lock = state.sprite_loader.read();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let sprite_loader = match &*sprite_loader_lock {
        Some(loader) => loader,
        None => return Err("No sprites loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &appearances.object,
        AppearanceCategory::Outfits => &appearances.outfit,
        AppearanceCategory::Effects => &appearances.effect,
        AppearanceCategory::Missiles => &appearances.missile,
    };

    let appearance = items.iter().find(|app| app.id.unwrap_or(0) == appearance_id).ok_or_else(|| format!("Appearance with ID {} not found in {:?}", appearance_id, category))?;

    // Collect all sprite IDs from all frame groups
    let all_sprite_ids: Vec<u32> = appearance.frame_group.iter().filter_map(|fg| fg.sprite_info.as_ref()).flat_map(|info| info.sprite_id.iter().copied()).collect();

    // CRITICAL OPTIMIZATION: Process sprites in PARALLEL
    // Each sprite's decompression + PNG encoding runs on a separate thread
    // Significant speedup when appearance has many sprites (10+ sprites = 10x faster on 10+ cores)
    let sprite_images: Vec<String> = if all_sprite_ids.len() > 5 {
        // Use parallel processing for appearances with many sprites
        all_sprite_ids
            .par_iter()
            .filter_map(|&sprite_id| match sprite_loader.get_sprite(sprite_id) {
                Ok(sprite) => match sprite.to_base64_png() {
                    Ok(base64_png) => Some(base64_png),
                    Err(e) => {
                        log::warn!("Failed to encode sprite {}: {}", sprite_id, e);
                        None
                    }
                },
                Err(e) => {
                    log::warn!("Failed to get sprite {}: {}", sprite_id, e);
                    None
                }
            })
            .collect()
    } else {
        // Sequential for small sprite counts (avoid parallelism overhead)
        all_sprite_ids
            .iter()
            .filter_map(|&sprite_id| match sprite_loader.get_sprite(sprite_id) {
                Ok(sprite) => match sprite.to_base64_png() {
                    Ok(base64_png) => Some(base64_png),
                    Err(e) => {
                        log::warn!("Failed to encode sprite {}: {}", sprite_id, e);
                        None
                    }
                },
                Err(e) => {
                    log::warn!("Failed to get sprite {}: {}", sprite_id, e);
                    None
                }
            })
            .collect()
    };

    // Store in cache (lock-free insert with Arc for zero-copy sharing)
    let sprites_arc = Arc::new(sprite_images);
    state.sprite_cache.insert(cache_key, sprites_arc.clone());

    Ok((*sprites_arc).clone())
}

/// Get a single preview sprite (first available sprite) for an appearance
/// Optimized: SpriteLoader uses lock-free cache
#[tauri::command]
pub async fn get_appearance_preview_sprite(category: AppearanceCategory, appearance_id: u32, state: State<'_, AppState>) -> Result<Option<String>, String> {
    let appearances_lock = state.appearances.read();
    let sprite_loader_lock = state.sprite_loader.read();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let sprite_loader = match &*sprite_loader_lock {
        Some(loader) => loader,
        None => return Err("No sprites loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &appearances.object,
        AppearanceCategory::Outfits => &appearances.outfit,
        AppearanceCategory::Effects => &appearances.effect,
        AppearanceCategory::Missiles => &appearances.missile,
    };

    let appearance = items.iter().find(|app| app.id.unwrap_or(0) == appearance_id).ok_or_else(|| format!("Appearance with ID {} not found in {:?}", appearance_id, category))?;

    let first_sprite_id = appearance.frame_group.iter().filter_map(|fg| fg.sprite_info.as_ref()).flat_map(|info| info.sprite_id.iter()).copied().next();

    let sprite_id = match first_sprite_id {
        Some(id) => id,
        None => return Ok(None),
    };

    let sprite = sprite_loader.get_sprite(sprite_id).map_err(|e| format!("Failed to get sprite {}: {}", sprite_id, e))?;

    let preview = sprite.to_base64_png().map_err(|e| format!("Failed to convert sprite to PNG: {}", e))?;

    Ok(Some(preview))
}

/// Clear the sprite cache
/// Optimized: Lock-free cache clear
#[tauri::command]
pub async fn clear_sprite_cache(state: State<'_, AppState>) -> Result<usize, String> {
    let cache_size = state.sprite_cache.len();
    state.sprite_cache.clear();
    log::info!("Cleared sprite cache ({} entries)", cache_size);
    Ok(cache_size)
}

/// Get sprite cache statistics
/// Optimized: Lock-free cache statistics
#[tauri::command]
pub async fn get_sprite_cache_stats(state: State<'_, AppState>) -> Result<(usize, usize), String> {
    let total_entries = state.sprite_cache.len();
    let total_sprites: usize = state.sprite_cache.iter().map(|entry| entry.value().len()).sum();
    Ok((total_entries, total_sprites))
}
