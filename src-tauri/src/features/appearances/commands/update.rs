use super::category_types::{AppearanceCategory, AppearanceItem};
use super::helpers::{create_appearance_item_response, ensure_flags, get_items_by_category_mut, get_index_for_category, invalidate_search_cache};
use crate::core::protobuf::{Box as ProtoBoundingBox, SpriteAnimation as ProtoSpriteAnimation, SpriteInfo as ProtoSpriteInfo, SpritePhase as ProtoSpritePhase};
use crate::state::AppState;
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct BoundingBoxInput {
    pub x: Option<u32>,
    pub y: Option<u32>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

/// Remove sprite slots by index from a frame group
#[tauri::command]
pub async fn remove_appearance_sprites(category: AppearanceCategory, id: u32, update: SpriteRemovalUpdate, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    if update.indices.is_empty() {
        return Err("No sprite indices provided for removal".to_string());
    }

    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds for category {:?}", idx, category))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?
    };

    if update.frame_group_index >= appearance.frame_group.len() {
        return Err(format!("Frame group {} not found for appearance {}", update.frame_group_index, id));
    }

    let frame_group = appearance.frame_group.get_mut(update.frame_group_index).expect("validated above");

    if frame_group.sprite_info.is_none() {
        return Err("Sprite info not available for this frame group".to_string());
    }

    let sprite_info = frame_group.sprite_info.as_mut().expect("sprite info ensured above");
    if sprite_info.sprite_id.is_empty() {
        return Err("No sprite slots available to remove".to_string());
    }

    let mut indices = update.indices.clone();
    indices.sort_unstable();
    indices.dedup();

    let total_slots = sprite_info.sprite_id.len();
    for idx in &indices {
        if *idx >= total_slots {
            return Err(format!("Sprite index {} out of bounds. Frame group has {} slots.", idx, total_slots));
        }
    }

    for idx in indices.iter().rev() {
        sprite_info.sprite_id.remove(*idx);
    }

    let cache_key = format!("{:?}:{}", category, id);
    state.sprite_cache.remove(&cache_key);
    state.preview_cache.remove(&cache_key);
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

/// Append new sprite IDs to the end of the sprite slots for a frame group
/// - Validates frame group bounds
/// - Automatically extends sprite slots
#[tauri::command]
pub async fn append_appearance_sprites(category: AppearanceCategory, id: u32, update: SpriteAppendUpdate, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    if update.sprite_ids.is_empty() {
        return Err("No sprite IDs provided for append".to_string());
    }

    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds for category {:?}", idx, category))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?
    };

    if update.frame_group_index >= appearance.frame_group.len() {
        return Err(format!("Frame group {} not found for appearance {}", update.frame_group_index, id));
    }

    let frame_group = appearance.frame_group.get_mut(update.frame_group_index).expect("validated above");

    if frame_group.sprite_info.is_none() {
        frame_group.sprite_info = Some(ProtoSpriteInfo::default());
    }

    // Validate sprite IDs exist in sprite loader (if available)
    if let Some(sprite_loader) = state.sprite_loader.read().as_ref() {
        for &sprite_id in &update.sprite_ids {
            if sprite_loader.get_sprite(sprite_id).is_err() {
                log::warn!("Sprite ID {} not found in sprite loader, but allowing append", sprite_id);
                // We log a warning but don't fail - sprite might be added later
            }
        }
    }

    let sprite_info = frame_group.sprite_info.as_mut().expect("sprite info ensured above");
    sprite_info.sprite_id.extend(update.sprite_ids.iter().copied());

    let cache_key = format!("{:?}:{}", category, id);
    state.sprite_cache.remove(&cache_key);
    state.preview_cache.remove(&cache_key);
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[derive(Debug, Clone, Deserialize)]
pub struct SpritePhaseInput {
    pub duration_min: Option<u32>,
    pub duration_max: Option<u32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SpriteAnimationInput {
    pub default_start_phase: Option<u32>,
    pub synchronized: Option<bool>,
    pub random_start_phase: Option<bool>,
    pub loop_type: Option<i32>,
    pub loop_count: Option<u32>,
    pub animation_mode: Option<i32>,
    pub phases: Vec<SpritePhaseInput>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TextureSettingsUpdate {
    pub frame_group_index: usize,
    pub pattern_width: Option<Option<u32>>,
    pub pattern_height: Option<Option<u32>>,
    pub pattern_depth: Option<Option<u32>>,
    pub layers: Option<Option<u32>>,
    pub pattern_size: Option<Option<u32>>,
    pub pattern_layers: Option<Option<u32>>,
    pub pattern_x: Option<Option<u32>>,
    pub pattern_y: Option<Option<u32>>,
    pub pattern_z: Option<Option<u32>>,
    pub pattern_frames: Option<Option<u32>>,
    pub bounding_square: Option<Option<u32>>,
    pub is_opaque: Option<Option<bool>>,
    pub is_animation: Option<Option<bool>>,
    pub bounding_boxes: Option<Vec<BoundingBoxInput>>,
    pub animation: Option<Option<SpriteAnimationInput>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SpriteSlotUpdate {
    pub index: usize,
    pub sprite_id: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SpriteReplacementUpdate {
    pub frame_group_index: usize,
    pub updates: Vec<SpriteSlotUpdate>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SpriteAppendUpdate {
    pub frame_group_index: usize,
    pub sprite_ids: Vec<u32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SpriteRemovalUpdate {
    pub frame_group_index: usize,
    pub indices: Vec<usize>,
}

/// HEAVILY OPTIMIZED update_appearance_texture_settings:
/// - O(1) lookup via index map (no linear scan!)
/// - Invalidates search cache after mutation
/// - parking_lot RwLock (3x faster)
#[tauri::command]
pub async fn update_appearance_texture_settings(category: AppearanceCategory, id: u32, update: TextureSettingsUpdate, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // CRITICAL OPTIMIZATION: O(1) lookup via index instead of O(n) linear scan!
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds for category {:?}", idx, category))?
    } else {
        // Fallback to linear search if index not found
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?
    };

    if update.frame_group_index >= appearance.frame_group.len() {
        return Err(format!("Frame group {} not found for appearance {}", update.frame_group_index, id));
    }

    let frame_group = appearance.frame_group.get_mut(update.frame_group_index).expect("validated above");

    if frame_group.sprite_info.is_none() {
        frame_group.sprite_info = Some(ProtoSpriteInfo::default());
    }

    let sprite_info = frame_group.sprite_info.as_mut().expect("sprite info set above");

    if let Some(value) = update.pattern_width {
        sprite_info.pattern_width = value;
    }
    if let Some(value) = update.pattern_height {
        sprite_info.pattern_height = value;
    }
    if let Some(value) = update.pattern_depth {
        sprite_info.pattern_depth = value;
    }
    if let Some(value) = update.layers {
        sprite_info.layers = value;
    }
    if let Some(value) = update.pattern_size {
        sprite_info.pattern_size = value;
    }
    if let Some(value) = update.pattern_layers {
        sprite_info.pattern_layers = value;
    }
    if let Some(value) = update.pattern_x {
        sprite_info.pattern_x = value;
    }
    if let Some(value) = update.pattern_y {
        sprite_info.pattern_y = value;
    }
    if let Some(value) = update.pattern_z {
        sprite_info.pattern_z = value;
    }
    if let Some(value) = update.pattern_frames {
        sprite_info.pattern_frames = value;
    }
    if let Some(value) = update.bounding_square {
        sprite_info.bounding_square = value;
    }
    if let Some(value) = update.is_opaque {
        sprite_info.is_opaque = value;
    }
    if let Some(value) = update.is_animation {
        sprite_info.is_animation = value;
    }

    if let Some(boxes) = update.bounding_boxes {
        sprite_info.bounding_box_per_direction.clear();
        for bb in boxes {
            sprite_info.bounding_box_per_direction.push(ProtoBoundingBox {
                x: bb.x,
                y: bb.y,
                width: bb.width,
                height: bb.height,
            });
        }
    }

    if let Some(animation_opt) = update.animation {
        match animation_opt {
            Some(anim) => {
                let mut proto_anim = ProtoSpriteAnimation::default();
                proto_anim.default_start_phase = anim.default_start_phase;
                proto_anim.synchronized = anim.synchronized;
                proto_anim.random_start_phase = anim.random_start_phase;
                proto_anim.loop_type = anim.loop_type;
                proto_anim.loop_count = anim.loop_count;
                proto_anim.animation_mode = anim.animation_mode;
                proto_anim.sprite_phase.clear();
                for phase in anim.phases {
                    proto_anim.sprite_phase.push(ProtoSpritePhase {
                        duration_min: phase.duration_min,
                        duration_max: phase.duration_max,
                    });
                }
                sprite_info.animation = Some(proto_anim);
            }
            None => {
                sprite_info.animation = None;
            }
        }
    }

    // CRITICAL: Invalidate caches (data changed)
    invalidate_search_cache(&state);
    let cache_key = format!("{:?}:{}", category, id);
    state.sprite_cache.remove(&cache_key);
    state.preview_cache.remove(&cache_key);

    Ok(create_appearance_item_response(id, appearance))
}

/// Replace one or more sprite IDs inside a specific frame group
/// - Validates bounds
/// - Invalidates caches so previews are refreshed
#[tauri::command]
pub async fn replace_appearance_sprites(category: AppearanceCategory, id: u32, update: SpriteReplacementUpdate, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds for category {:?}", idx, category))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?
    };

    if update.frame_group_index >= appearance.frame_group.len() {
        return Err(format!("Frame group {} not found for appearance {}", update.frame_group_index, id));
    }

    let frame_group = appearance.frame_group.get_mut(update.frame_group_index).expect("validated above");

    if frame_group.sprite_info.is_none() {
        return Err("Sprite info not available for this frame group".to_string());
    }

    let sprite_info = frame_group.sprite_info.as_mut().expect("checked above");

    if sprite_info.sprite_id.is_empty() {
        return Err("No sprite slots available to replace".to_string());
    }

    if update.updates.is_empty() {
        return Err("No sprite replacements provided".to_string());
    }

    let total_slots = sprite_info.sprite_id.len();
    for upd in &update.updates {
        if upd.index >= total_slots {
            return Err(format!("Sprite index {} out of bounds. Frame group has {} slots.", upd.index, total_slots));
        }
    }

    // Validate sprite IDs exist in sprite loader (if available)
    if let Some(sprite_loader) = state.sprite_loader.read().as_ref() {
        for upd in &update.updates {
            if sprite_loader.get_sprite(upd.sprite_id).is_err() {
                log::warn!("Sprite ID {} not found in sprite loader, but allowing update", upd.sprite_id);
                // We log a warning but don't fail - sprite might be added later
            }
        }
    }

    for upd in update.updates {
        sprite_info.sprite_id[upd.index] = upd.sprite_id;
    }

    // Invalidate caches so previews and sprite lists are recalculated
    let cache_key = format!("{:?}:{}", category, id);
    state.sprite_cache.remove(&cache_key);
    state.preview_cache.remove(&cache_key);
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

/// HEAVILY OPTIMIZED update_appearance_name:
/// - O(1) lookup via index map
/// - Invalidates search cache
/// - parking_lot RwLock (3x faster)
#[tauri::command]
pub async fn update_appearance_name(category: AppearanceCategory, id: u32, new_name: String, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    appearance.name = if new_name.trim().is_empty() {
        None
    } else {
        Some(new_name.trim().as_bytes().to_vec())
    };

    // Invalidate cache (name changed - affects search!)
    invalidate_search_cache(&state);

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

/// HEAVILY OPTIMIZED update_appearance_automap:
/// - O(1) lookup via index map
/// - Invalidates search cache
/// - parking_lot RwLock (3x faster)
#[tauri::command]
pub async fn update_appearance_automap(category: AppearanceCategory, id: u32, color: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if color.is_none() {
        flags.automap = None;
    } else {
        flags.automap = Some(crate::core::protobuf::AppearanceFlagAutomap {
            color,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_hook(category: AppearanceCategory, id: u32, direction: Option<i32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if direction.is_none() {
        flags.hook = None;
    } else {
        flags.hook = Some(crate::core::protobuf::AppearanceFlagHook {
            direction,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_lenshelp(category: AppearanceCategory, id: u32, lenshelp_id: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if lenshelp_id.is_none() {
        flags.lenshelp = None;
    } else {
        flags.lenshelp = Some(crate::core::protobuf::AppearanceFlagLenshelp {
            id: lenshelp_id,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_clothes(category: AppearanceCategory, id: u32, slot: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if slot.is_none() {
        flags.clothes = None;
    } else {
        flags.clothes = Some(crate::core::protobuf::AppearanceFlagClothes {
            slot,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_default_action(category: AppearanceCategory, id: u32, action: Option<i32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if action.is_none() {
        flags.default_action = None;
    } else {
        flags.default_action = Some(crate::core::protobuf::AppearanceFlagDefaultAction {
            action,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_market(
    category: AppearanceCategory,
    id: u32,
    category_value: Option<i32>,
    trade_as_object_id: Option<u32>,
    show_as_object_id: Option<u32>,
    restrict_to_vocation: Vec<i32>,
    minimum_level: Option<u32>,
    name: Option<String>,
    vocation: Option<i32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    let market = if category_value.is_none()
        && trade_as_object_id.is_none()
        && show_as_object_id.is_none()
        && restrict_to_vocation.is_empty()
        && minimum_level.is_none()
        && name.is_none()
        && vocation.is_none()
    {
        None
    } else {
        Some(crate::core::protobuf::AppearanceFlagMarket {
            category: category_value,
            trade_as_object_id,
            show_as_object_id,
            restrict_to_vocation,
            minimum_level,
            name: name.map(|s| s.into_bytes()),
            vocation,
        })
    };

    flags.market = market;

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_bank(category: AppearanceCategory, id: u32, waypoints: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if waypoints.is_none() {
        flags.bank = None;
    } else {
        flags.bank = Some(crate::core::protobuf::AppearanceFlagBank {
            waypoints,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_changed_to_expire(category: AppearanceCategory, id: u32, former_object_typeid: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if former_object_typeid.is_none() {
        flags.changedtoexpire = None;
    } else {
        flags.changedtoexpire = Some(crate::core::protobuf::AppearanceFlagChangedToExpire {
            former_object_typeid,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_cyclopedia_item(category: AppearanceCategory, id: u32, cyclopedia_type: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if cyclopedia_type.is_none() {
        flags.cyclopediaitem = None;
    } else {
        flags.cyclopediaitem = Some(crate::core::protobuf::AppearanceFlagCyclopedia {
            cyclopedia_type,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_upgrade_classification(category: AppearanceCategory, id: u32, upgrade_classification: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if upgrade_classification.is_none() {
        flags.upgradeclassification = None;
    } else {
        flags.upgradeclassification = Some(crate::core::protobuf::AppearanceFlagUpgradeClassification {
            upgrade_classification,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_skillwheel_gem(
    category: AppearanceCategory,
    id: u32,
    gem_quality_id: Option<u32>,
    vocation_id: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if gem_quality_id.is_none() && vocation_id.is_none() {
        flags.skillwheel_gem = None;
    } else {
        flags.skillwheel_gem = Some(crate::core::protobuf::AppearanceFlagSkillWheelGem {
            gem_quality_id,
            vocation_id,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_imbueable(category: AppearanceCategory, id: u32, slot_count: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if slot_count.is_none() {
        flags.imbueable = None;
    } else {
        flags.imbueable = Some(crate::core::protobuf::AppearanceFlagImbueable {
            slot_count,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_proficiency(category: AppearanceCategory, id: u32, proficiency_id: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if proficiency_id.is_none() {
        flags.proficiency = None;
    } else {
        flags.proficiency = Some(crate::core::protobuf::AppearanceFlagProficiency {
            proficiency_id,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_transparency_level(category: AppearanceCategory, id: u32, transparency_level: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if transparency_level.is_none() {
        flags.transparencylevel = None;
    } else {
        flags.transparencylevel = Some(crate::core::protobuf::AppearanceFlagTransparencyLevel {
            level: transparency_level,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_weapon_type(category: AppearanceCategory, id: u32, weapon_type: Option<i32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    // Direct optional enum/integer flag; None removes it
    flags.weapon_type = weapon_type;

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_description(category: AppearanceCategory, id: u32, new_description: String, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    appearance.description = if new_description.trim().is_empty() {
        None
    } else {
        Some(new_description.trim().as_bytes().to_vec())
    };

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

fn set_bool_flag(flags: &mut crate::core::protobuf::AppearanceFlags, key: &str, value: bool) -> Result<(), String> {
    let k = key.to_lowercase().replace('_', "").replace(' ', "");
    match k.as_str() {
        "clip" => {
            flags.clip = Some(value);
        }
        "bottom" => {
            flags.bottom = Some(value);
        }
        "top" => {
            flags.top = Some(value);
        }
        "container" => {
            flags.container = Some(value);
        }
        "cumulative" => {
            flags.cumulative = Some(value);
        }
        "usable" => {
            flags.usable = Some(value);
        }
        "forceuse" => {
            flags.forceuse = Some(value);
        }
        "multiuse" => {
            flags.multiuse = Some(value);
        }
        "liquidpool" => {
            flags.liquidpool = Some(value);
        }
        "unpass" | "unpassable" => {
            flags.unpass = Some(value);
        }
        "unmove" | "unmovable" => {
            flags.unmove = Some(value);
        }
        "unsight" | "blocksight" => {
            flags.unsight = Some(value);
        }
        "avoid" | "avoidwalk" => {
            flags.avoid = Some(value);
        }
        "nomovementanimation" => {
            flags.no_movement_animation = Some(value);
        }
        "take" | "takeable" => {
            flags.take = Some(value);
        }
        "liquidcontainer" => {
            flags.liquidcontainer = Some(value);
        }
        "hang" | "hangable" => {
            flags.hang = Some(value);
        }
        "rotate" | "rotatable" => {
            flags.rotate = Some(value);
        }
        "donthide" => {
            flags.dont_hide = Some(value);
        }
        "translucent" => {
            flags.translucent = Some(value);
        }
        "lyingobject" => {
            flags.lying_object = Some(value);
        }
        "animatealways" => {
            flags.animate_always = Some(value);
        }
        "fullbank" => {
            flags.fullbank = Some(value);
        }
        "ignorelook" => {
            flags.ignore_look = Some(value);
        }
        "wrap" => {
            flags.wrap = Some(value);
        }
        "unwrap" => {
            flags.unwrap = Some(value);
        }
        "topeffect" => {
            flags.topeffect = Some(value);
        }
        "corpse" => {
            flags.corpse = Some(value);
        }
        "playercorpse" => {
            flags.player_corpse = Some(value);
        }
        "ammo" => {
            flags.ammo = Some(value);
        }
        "showoffsocket" => {
            flags.show_off_socket = Some(value);
        }
        "reportable" => {
            flags.reportable = Some(value);
        }
        "reverseaddonseast" => {
            flags.reverse_addons_east = Some(value);
        }
        "reverseaddonswest" => {
            flags.reverse_addons_west = Some(value);
        }
        "reverseaddonssouth" => {
            flags.reverse_addons_south = Some(value);
        }
        "reverseaddonsnorth" => {
            flags.reverse_addons_north = Some(value);
        }
        "wearout" => {
            flags.wearout = Some(value);
        }
        "clockexpire" => {
            flags.clockexpire = Some(value);
        }
        "expire" => {
            flags.expire = Some(value);
        }
        "expirestop" => {
            flags.expirestop = Some(value);
        }
        "decoitemkit" => {
            flags.deco_item_kit = Some(value);
        }
        "dualwielding" => {
            flags.dual_wielding = Some(value);
        }
        "hooksouth" => {
            flags.hook_south = Some(value);
        }
        "hookeast" => {
            flags.hook_east = Some(value);
        }
        _ => return Err(format!("Unknown boolean flag '{}'", key)),
    }
    Ok(())
}

#[tauri::command]
pub async fn update_appearance_flag_bool(category: AppearanceCategory, id: u32, flag: String, value: bool, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    set_bool_flag(flags, &flag, value)?;

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_light(category: AppearanceCategory, id: u32, brightness: Option<u32>, color: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if brightness.is_none() && color.is_none() {
        flags.light = None;
    } else {
        flags.light = Some(crate::core::protobuf::AppearanceFlagLight {
            brightness,
            color,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_shift(category: AppearanceCategory, id: u32, x: Option<u32>, y: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if x.is_none() && y.is_none() {
        flags.shift = None;
    } else {
        flags.shift = Some(crate::core::protobuf::AppearanceFlagShift {
            x,
            y,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_height(category: AppearanceCategory, id: u32, elevation: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if elevation.is_none() {
        flags.height = None;
    } else {
        flags.height = Some(crate::core::protobuf::AppearanceFlagHeight {
            elevation,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_write(category: AppearanceCategory, id: u32, max_text_length: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if max_text_length.is_none() {
        flags.write = None;
    } else {
        flags.write = Some(crate::core::protobuf::AppearanceFlagWrite {
            max_text_length,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}

#[tauri::command]
pub async fn update_appearance_write_once(category: AppearanceCategory, id: u32, max_text_length_once: Option<u32>, state: tauri::State<'_, AppState>) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.write();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category_mut(appearances, &category);

    // O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance {} not found", id))?
    };

    let flags = ensure_flags(appearance);

    if max_text_length_once.is_none() {
        flags.write_once = None;
    } else {
        flags.write_once = Some(crate::core::protobuf::AppearanceFlagWriteOnce {
            max_text_length_once,
        });
    }

    // Invalidate cache (data changed)
    invalidate_search_cache(&state);

    Ok(create_appearance_item_response(id, appearance))
}
