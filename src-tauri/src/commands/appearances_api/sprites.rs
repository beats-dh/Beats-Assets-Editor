use std::path::PathBuf;
use tauri::State;
use crate::core::parsers::SpriteLoader;
use crate::commands::AppState;
use super::types::AppearanceCategory;

#[tauri::command]
pub async fn load_sprites_catalog(
    catalog_path: String,
    assets_dir: String,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    log::info!("Loading sprites from catalog: {} with assets dir: {}", catalog_path, assets_dir);

    let sprite_loader = SpriteLoader::new(&catalog_path, &assets_dir)
        .map_err(|e| format!("Failed to load sprite catalog: {}", e))?;

    let sprite_count = sprite_loader.sprite_count();

    // Store in state
    *state.sprite_loader.lock().unwrap() = Some(sprite_loader);

    Ok(sprite_count)
}

/// Auto-detect and load sprites from Tibia directory
#[tauri::command]
pub async fn auto_load_sprites(
    tibia_path: String,
    state: State<'_, AppState>,
) -> Result<usize, String> {
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

    let sprite_loader = SpriteLoader::new(&catalog_path, &assets_dir)
        .map_err(|e| {
            log::error!("Failed to create SpriteLoader: {}", e);
            format!("Failed to auto-load sprites: {}", e)
        })?;

    let sprite_count = sprite_loader.sprite_count();

    // Store in state
    *state.sprite_loader.lock().unwrap() = Some(sprite_loader);

    log::info!("Successfully loaded {} sprites", sprite_count);
    Ok(sprite_count)
}

/// Get sprite by ID as base64 PNG
#[tauri::command]
pub async fn get_sprite_by_id(
    sprite_id: u32,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut sprite_loader_lock = state.sprite_loader.lock().unwrap();

    match &mut *sprite_loader_lock {
        Some(loader) => {
            let sprite = loader.get_sprite(sprite_id)
                .map_err(|e| format!("Failed to get sprite {}: {}", sprite_id, e))?;

            sprite.to_base64_png()
                .map_err(|e| format!("Failed to convert sprite to PNG: {}", e))
        }
        None => Err("No sprites loaded".to_string()),
    }
}

/// Get sprites for an appearance (from sprite IDs in frame groups)
#[tauri::command]
pub async fn get_appearance_sprites(
    category: AppearanceCategory,
    appearance_id: u32,
    state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    
    // Check cache first
    let cache_key = format!("{:?}:{}", category, appearance_id);
    {
        let sprite_cache_lock = state.sprite_cache.lock().unwrap();
        if let Some(cached_sprites) = sprite_cache_lock.get(&cache_key) {
            return Ok(cached_sprites.clone());
        }
    }
    
    
    let appearances_lock = state.appearances.lock().unwrap();
    let mut sprite_loader_lock = state.sprite_loader.lock().unwrap();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let sprite_loader = match &mut *sprite_loader_lock {
        Some(loader) => loader,
        None => return Err("No sprites loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &appearances.object,
        AppearanceCategory::Outfits => &appearances.outfit,
        AppearanceCategory::Effects => &appearances.effect,
        AppearanceCategory::Missiles => &appearances.missile,
    };

    let appearance = items
        .iter()
        .find(|app| app.id.unwrap_or(0) == appearance_id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", appearance_id, category))?;


    let mut sprite_images = Vec::new();

    // Get ALL sprites from ALL frame groups of this specific appearance
    for (fg_index, frame_group) in appearance.frame_group.iter().enumerate() {
        if let Some(sprite_info) = &frame_group.sprite_info {

            // Get ALL sprite IDs from this frame group
            for &sprite_id in &sprite_info.sprite_id {
                match sprite_loader.get_sprite(sprite_id) {
                    Ok(sprite) => {
                        match sprite.to_base64_png() {
                            Ok(base64_png) => {
                                sprite_images.push(base64_png);
                            },
                            Err(e) => log::warn!("Failed to encode sprite {}: {}", sprite_id, e),
                        }
                    }
                    Err(e) => log::warn!("Failed to get sprite {}: {}", sprite_id, e),
                }
            }

            if sprite_info.sprite_id.is_empty() {
                log::warn!("Frame group {} has no sprite IDs", fg_index);
            }
        } else {
            log::warn!("Frame group {} has no sprite info", fg_index);
        }
    }

    
    // Store in cache
    {
        let mut sprite_cache_lock = state.sprite_cache.lock().unwrap();
        sprite_cache_lock.insert(cache_key, sprite_images.clone());
    }
    
    Ok(sprite_images)
}

/// Clear the sprite cache
#[tauri::command]
pub async fn clear_sprite_cache(state: State<'_, AppState>) -> Result<usize, String> {
    let mut sprite_cache_lock = state.sprite_cache.lock().unwrap();
    let cache_size = sprite_cache_lock.len();
    sprite_cache_lock.clear();
    log::info!("Cleared sprite cache ({} entries)", cache_size);
    Ok(cache_size)
}

/// Get sprite cache statistics
#[tauri::command]
pub async fn get_sprite_cache_stats(state: State<'_, AppState>) -> Result<(usize, usize), String> {
    let sprite_cache_lock = state.sprite_cache.lock().unwrap();
    let total_entries = sprite_cache_lock.len();
    let total_sprites: usize = sprite_cache_lock.values().map(|v| v.len()).sum();
    Ok((total_entries, total_sprites))
}