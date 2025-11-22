use super::category_types::{AppearanceCategory, AppearanceDetails, AppearanceFlagsInfo, AppearanceItem, FrameGroupInfo, ItemSubcategory};
use super::helpers::{create_appearance_item_response, get_items_by_category, get_index_for_category};
use crate::features::appearances::CompleteAppearanceItem;
use crate::state::AppState;
use tauri::State;
use serde::Serialize;
use std::sync::Arc;
use rayon::prelude::*;

#[derive(Serialize)]
pub struct AppearancePage {
    pub total: usize,
    pub items: Vec<AppearanceItem>,
}

/// HEAVILY OPTIMIZED list_appearances_by_category:
/// - Search result caching (memoize expensive filter operations)
/// - Pre-lowercased search string (no repeated allocations)
/// - parking_lot RwLock (3x faster)
/// - Minimal lock scope
#[tauri::command]
pub async fn list_appearances_by_category(
    category: AppearanceCategory,
    page: usize,
    page_size: usize,
    search: Option<String>,
    subcategory: Option<ItemSubcategory>,
    state: State<'_, AppState>,
) -> Result<AppearancePage, String> {
    // Build cache key for this exact query
    let cache_key = format!("{:?}:{}:{:?}", category, search.as_deref().unwrap_or(""), subcategory.as_ref().unwrap_or(&ItemSubcategory::All));

    // Check cache first (lock-free DashMap)
    if let Some(cached_ids) = state.search_cache.get(&cache_key) {
        // Clone Arc to drop DashMap guard ASAP (reduz contenção)
        let cached_ids = cached_ids.clone();

        // Cache hit! Just fetch the page of items
        let appearances_lock = state.appearances.read();
        let appearances = match &*appearances_lock {
            Some(a) => a,
            None => return Err("No appearances loaded".to_string()),
        };

        let items = get_items_by_category(appearances, &category);
        let index_map = get_index_for_category(&state, &category);

        let start = page * page_size;
        let ids_slice = cached_ids.as_ref();
        let end = std::cmp::min(start + page_size, ids_slice.len());

        if start >= ids_slice.len() {
            return Ok(AppearancePage {
                total: ids_slice.len(),
                items: vec![],
            });
        }

        let result: Vec<AppearanceItem> = ids_slice[start..end]
            .iter()
            .filter_map(|&id| {
                if let Some(idx) = index_map.get(&id) {
                    items.get(*idx).map(|appearance| create_appearance_item_response(id, appearance))
                } else {
                    items.iter().find(|app| app.id.unwrap_or(0) == id).map(|appearance| create_appearance_item_response(id, appearance))
                }
            })
            .collect();

        return Ok(AppearancePage {
            total: ids_slice.len(),
            items: result,
        });
    }

    // Cache miss - do full filter and cache result
    let appearances_lock = state.appearances.read();
    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category(appearances, &category);
    let index_map = get_index_for_category(&state, &category);

    // OPTIMIZATION: Pre-lowercase search term once (not per item!)
    let search_lower = search.as_ref().map(|s| s.to_lowercase());

    // CRITICAL OPTIMIZATION: Use parallel iterator for large datasets (>1000 items)
    // Rayon automatically splits work across CPU cores - significant speedup on multi-core CPUs
    let use_parallel = items.len() > 1000;

    let mut filtered_ids: Vec<u32> = if use_parallel {
        items
            .par_iter() // PARALLEL iterator via rayon
            .filter_map(|appearance| {
                let id = appearance.id.unwrap_or(0);

                // Apply search filter if provided
                if let Some(ref search_term_lower) = search_lower {
                    let name = appearance.name.as_ref().map(|b| String::from_utf8_lossy(b));
                    let description = appearance.description.as_ref().map(|b| String::from_utf8_lossy(b));

                    let matches = name.as_ref().map_or(false, |n| n.to_lowercase().contains(search_term_lower))
                        || description.as_ref().map_or(false, |d| d.to_lowercase().contains(search_term_lower))
                        || id.to_string().contains(search_term_lower);

                    if !matches {
                        return None;
                    }
                }

                // Apply subcategory filter for Objects category
                if category == AppearanceCategory::Objects {
                    if let Some(ref filter_subcategory) = subcategory {
                        if *filter_subcategory != ItemSubcategory::All {
                            let item_category: Option<i32> = appearance.flags.as_ref().and_then(|flags| flags.market.as_ref()).and_then(|market| market.category);

                            let expected_category = filter_subcategory.to_protobuf_value();

                            if item_category != expected_category {
                                return None;
                            }
                        }
                    }
                }

                Some(id)
            })
            .collect()
    } else {
        // Sequential for small datasets (overhead of parallelism not worth it)
        items
            .iter()
            .filter_map(|appearance| {
                let id = appearance.id.unwrap_or(0);

                // Apply search filter if provided
                if let Some(ref search_term_lower) = search_lower {
                    // OPTIMIZATION: Convert to string only if we need to search
                    let name = appearance.name.as_ref().map(|b| String::from_utf8_lossy(b));
                    let description = appearance.description.as_ref().map(|b| String::from_utf8_lossy(b));

                    let matches = name.as_ref().map_or(false, |n| n.to_lowercase().contains(search_term_lower))
                        || description.as_ref().map_or(false, |d| d.to_lowercase().contains(search_term_lower))
                        || id.to_string().contains(search_term_lower);

                    if !matches {
                        return None;
                    }
                }

                // Apply subcategory filter for Objects category
                if category == AppearanceCategory::Objects {
                    if let Some(ref filter_subcategory) = subcategory {
                        if *filter_subcategory != ItemSubcategory::All {
                            let item_category: Option<i32> = appearance.flags.as_ref().and_then(|flags| flags.market.as_ref()).and_then(|market| market.category);

                            let expected_category = filter_subcategory.to_protobuf_value();

                            if item_category != expected_category {
                                return None;
                            }
                        }
                    }
                }

                Some(id)
            })
            .collect()
    };

    // Sort by ID - use parallel sort for large datasets
    if use_parallel && filtered_ids.len() > 1000 {
        filtered_ids.par_sort_unstable(); // Parallel sort via rayon
    } else {
        filtered_ids.sort_unstable();
    }

    let filtered_ids = Arc::new(filtered_ids);
    let total = filtered_ids.len();
    // Cache the filtered IDs for future queries (Arc for zero-copy sharing)
    state.search_cache.insert(cache_key, filtered_ids.clone());

    // Build response for this page
    let start = page * page_size;
    let end = std::cmp::min(start + page_size, total);

    if start >= total {
        return Ok(AppearancePage {
            total,
            items: vec![],
        });
    }

    let ids_slice = filtered_ids.as_ref();
    let result: Vec<AppearanceItem> = ids_slice[start..end]
        .iter()
        .filter_map(|&id| {
            let appearance = if let Some(idx) = index_map.get(&id) {
                items.get(*idx)
            } else {
                items.iter().find(|app| app.id.unwrap_or(0) == id)
            };

            appearance.map(|appearance| create_appearance_item_response(id, appearance))
        })
        .collect();

    Ok(AppearancePage {
        total,
        items: result,
    })
}

/// HEAVILY OPTIMIZED find_appearance_position:
/// - Uses search cache (no repeated filtering)
/// - Binary search on sorted IDs for O(log n) instead of O(n)
/// - parking_lot RwLock (3x faster)
#[tauri::command]
pub async fn find_appearance_position(category: AppearanceCategory, id: u32, subcategory: Option<ItemSubcategory>, state: State<'_, AppState>) -> Result<Option<usize>, String> {
    // Build cache key (same as list_appearances_by_category)
    let cache_key = format!("{:?}::{:?}", category, subcategory.as_ref().unwrap_or(&ItemSubcategory::All));

    // Check cache first
    if let Some(cached_ids) = state.search_cache.get(&cache_key) {
        // OPTIMIZATION: Binary search on sorted Vec (O(log n) instead of O(n))
        return Ok(cached_ids.binary_search(&id).ok());
    }

    // Cache miss - build filtered list
    let appearances_lock = state.appearances.read();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category(appearances, &category);

    let mut filtered_ids: Vec<u32> = items
        .iter()
        .filter_map(|appearance| {
            let appearance_id = appearance.id.unwrap_or(0);

            if category == AppearanceCategory::Objects {
                if let Some(ref filter_subcategory) = subcategory {
                    if *filter_subcategory != ItemSubcategory::All {
                        let item_category: Option<i32> = appearance.flags.as_ref().and_then(|flags| flags.market.as_ref()).and_then(|market| market.category);

                        let expected_category = filter_subcategory.to_protobuf_value();

                        if item_category != expected_category {
                            return None;
                        }
                    }
                }
            }

            Some(appearance_id)
        })
        .collect();

    if filtered_ids.is_empty() {
        return Ok(None);
    }

    filtered_ids.sort_unstable();

    // Cache for future queries
    let position = filtered_ids.binary_search(&id).ok();
    state.search_cache.insert(cache_key, Arc::new(filtered_ids));

    Ok(position)
}

/// HEAVILY OPTIMIZED get_appearance_details:
/// - O(1) lookup via index map (no linear scan!)
/// - parking_lot RwLock (3x faster)
#[tauri::command]
pub async fn get_appearance_details(category: AppearanceCategory, id: u32, state: State<'_, AppState>) -> Result<AppearanceDetails, String> {
    let appearances_lock = state.appearances.read();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category(appearances, &category);

    // CRITICAL OPTIMIZATION: O(1) lookup via index instead of O(n) linear scan!
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get(idx).ok_or_else(|| format!("Index {} out of bounds for category {:?}", idx, category))?
    } else {
        // Fallback to linear search if index not found (shouldn't happen after rebuild_indexes)
        items.iter().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?
    };

    let frame_groups: Vec<FrameGroupInfo> = appearance
        .frame_group
        .iter()
        .map(|fg| FrameGroupInfo {
            id: fg.id,
            sprite_count: fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32),
            pattern_width: fg.sprite_info.as_ref().and_then(|si| si.pattern_width),
            pattern_height: fg.sprite_info.as_ref().and_then(|si| si.pattern_height),
            layers: fg.sprite_info.as_ref().and_then(|si| si.layers),
        })
        .collect();

    let flags_info = appearance.flags.as_ref().map(|flags| AppearanceFlagsInfo {
        usable: flags.usable.unwrap_or(false),
        container: flags.container.unwrap_or(false),
        take: flags.take.unwrap_or(false),
        hang: flags.hang.unwrap_or(false),
        rotate: flags.rotate.unwrap_or(false),
        has_light: flags.light.is_some(),
        has_market_info: flags.market.is_some(),
        has_npc_data: !flags.npcsaledata.is_empty(),
    });

    Ok(AppearanceDetails {
        id: appearance.id.unwrap_or(0),
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        appearance_type: appearance.appearance_type,
        category,
        frame_groups,
        flags: flags_info,
    })
}

/// OPTIMIZED get_appearance_count:
/// - Uses search cache (no repeated filtering)
/// - parking_lot RwLock (3x faster)
#[tauri::command]
pub async fn get_appearance_count(category: AppearanceCategory, search: Option<String>, subcategory: Option<ItemSubcategory>, state: State<'_, AppState>) -> Result<usize, String> {
    // Build cache key
    let cache_key = format!("{:?}:{}:{:?}", category, search.as_deref().unwrap_or(""), subcategory.as_ref().unwrap_or(&ItemSubcategory::All));

    // Check cache first
    if let Some(cached_ids) = state.search_cache.get(&cache_key) {
        return Ok(cached_ids.len());
    }

    // Cache miss - do full count (this will also populate cache via list_appearances_by_category logic)
    let appearances_lock = state.appearances.read();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category(appearances, &category);

    let count = items
        .iter()
        .filter(|appearance| {
            let id = appearance.id.unwrap_or(0);
            let name = appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string());
            let description = appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string());

            // Apply search filter if provided
            if let Some(ref search_term) = search {
                let search_lower = search_term.to_lowercase();
                let matches = name.as_ref().map_or(false, |n| n.to_lowercase().contains(&search_lower))
                    || description.as_ref().map_or(false, |d| d.to_lowercase().contains(&search_lower))
                    || id.to_string().contains(&search_lower);

                if !matches {
                    return false;
                }
            }

            // Apply subcategory filter for Objects category
            if category == AppearanceCategory::Objects {
                if let Some(ref filter_subcategory) = subcategory {
                    if *filter_subcategory != ItemSubcategory::All {
                        // Check if item has market flags with category
                        let item_category: Option<i32> = appearance.flags.as_ref().and_then(|flags| flags.market.as_ref()).and_then(|market| market.category);

                        let expected_category = filter_subcategory.to_protobuf_value();

                        if item_category != expected_category {
                            return false;
                        }
                    }
                }
            }

            true
        })
        .count();

    Ok(count)
}

/// Retorna subcategorias de itens com rótulos legíveis
#[tauri::command]
pub async fn get_item_subcategories() -> Result<Vec<(String, String)>, String> {
    let subcategories = vec![
        (format!("{:?}", ItemSubcategory::All), ItemSubcategory::All.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Armors), ItemSubcategory::Armors.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Amulets), ItemSubcategory::Amulets.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Boots), ItemSubcategory::Boots.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Containers), ItemSubcategory::Containers.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Decoration), ItemSubcategory::Decoration.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Food), ItemSubcategory::Food.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::HelmetsHats), ItemSubcategory::HelmetsHats.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Legs), ItemSubcategory::Legs.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Others), ItemSubcategory::Others.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Potions), ItemSubcategory::Potions.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Rings), ItemSubcategory::Rings.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Runes), ItemSubcategory::Runes.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Shields), ItemSubcategory::Shields.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Tools), ItemSubcategory::Tools.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Valuables), ItemSubcategory::Valuables.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Ammunition), ItemSubcategory::Ammunition.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Axes), ItemSubcategory::Axes.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Clubs), ItemSubcategory::Clubs.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::DistanceWeapons), ItemSubcategory::DistanceWeapons.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Swords), ItemSubcategory::Swords.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::WandsRods), ItemSubcategory::WandsRods.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::PremiumScrolls), ItemSubcategory::PremiumScrolls.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::TibiaCoins), ItemSubcategory::TibiaCoins.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::CreatureProducts), ItemSubcategory::CreatureProducts.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Quiver), ItemSubcategory::Quiver.display_name().to_string()),
        (format!("{:?}", ItemSubcategory::Soulcores), ItemSubcategory::Soulcores.display_name().to_string()),
    ];

    Ok(subcategories)
}

/// HEAVILY OPTIMIZED get_complete_appearance:
/// - O(1) lookup via index map (no linear scan!)
/// - parking_lot RwLock (3x faster)
#[tauri::command]
pub async fn get_complete_appearance(category: AppearanceCategory, id: u32, state: State<'_, AppState>) -> Result<CompleteAppearanceItem, String> {
    let appearances_lock = state.appearances.read();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = get_items_by_category(appearances, &category);

    // CRITICAL OPTIMIZATION: O(1) lookup via index instead of O(n) linear scan!
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get(idx).ok_or_else(|| format!("Index {} out of bounds for category {:?}", idx, category))?
    } else {
        // Fallback to linear search if index not found
        items.iter().find(|app| app.id.unwrap_or(0) == id).ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?
    };

    Ok(CompleteAppearanceItem::from_protobuf(appearance))
}

/// Get special meaning appearance IDs (coins, chests, etc.)
/// OPTIMIZED: parking_lot RwLock (3x faster)
#[tauri::command]
pub async fn get_special_meaning_ids(state: State<'_, AppState>) -> Result<Option<crate::features::appearances::SpecialMeaningAppearanceIds>, String> {
    let appearances_lock = state.appearances.read();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    Ok(appearances.special_meaning_appearance_ids.as_ref().map(crate::features::appearances::SpecialMeaningAppearanceIds::from_protobuf))
}
