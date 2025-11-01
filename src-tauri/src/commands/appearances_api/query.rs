use super::types::{
    AppearanceCategory, AppearanceDetails, AppearanceFlagsInfo, AppearanceItem, FrameGroupInfo,
    ItemSubcategory,
};
use crate::commands::{AppState, CompleteAppearanceItem};
use tauri::State;

/// List appearances by category with pagination
#[tauri::command]
pub async fn list_appearances_by_category(
    category: AppearanceCategory,
    page: usize,
    page_size: usize,
    search: Option<String>,
    subcategory: Option<ItemSubcategory>,
    state: State<'_, AppState>,
) -> Result<Vec<AppearanceItem>, String> {
    let appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &appearances.object,
        AppearanceCategory::Outfits => &appearances.outfit,
        AppearanceCategory::Effects => &appearances.effect,
        AppearanceCategory::Missiles => &appearances.missile,
    };

    let mut filtered_items: Vec<AppearanceItem> = items
        .iter()
        .filter_map(|appearance| {
            let id = appearance.id.unwrap_or(0);
            let name = appearance
                .name
                .as_ref()
                .map(|b| String::from_utf8_lossy(b).to_string());
            let description = appearance
                .description
                .as_ref()
                .map(|b| String::from_utf8_lossy(b).to_string());

            // Apply search filter if provided
            if let Some(search_term) = &search {
                let search_lower = search_term.to_lowercase();
                let matches = name
                    .as_ref()
                    .map_or(false, |n| n.to_lowercase().contains(&search_lower))
                    || description
                        .as_ref()
                        .map_or(false, |d| d.to_lowercase().contains(&search_lower))
                    || id.to_string().contains(&search_lower);

                if !matches {
                    return None;
                }
            }

            // Apply subcategory filter for Objects category
            if category == AppearanceCategory::Objects {
                if let Some(ref filter_subcategory) = subcategory {
                    if *filter_subcategory != ItemSubcategory::All {
                        // Check if item has market flags with category
                        let item_category: Option<i32> = appearance
                            .flags
                            .as_ref()
                            .and_then(|flags| flags.market.as_ref())
                            .and_then(|market| market.category);

                        let expected_category = filter_subcategory.to_protobuf_value();

                        if item_category != expected_category {
                            return None;
                        }
                    }
                }
            }

            let sprite_count = appearance
                .frame_group
                .iter()
                .map(|fg| {
                    fg.sprite_info
                        .as_ref()
                        .map_or(0, |si| si.sprite_id.len() as u32)
                })
                .sum();

            Some(AppearanceItem {
                id,
                name,
                description,
                has_flags: appearance.flags.is_some(),
                sprite_count,
            })
        })
        .collect();

    // Sort by ID
    filtered_items.sort_by_key(|item| item.id);

    // Apply pagination
    let start = page * page_size;
    let end = std::cmp::min(start + page_size, filtered_items.len());

    if start >= filtered_items.len() {
        return Ok(vec![]);
    }

    Ok(filtered_items[start..end].to_vec())
}

/// Find the zero-based position of an appearance ID within the current filters
#[tauri::command]
pub async fn find_appearance_position(
    category: AppearanceCategory,
    id: u32,
    subcategory: Option<ItemSubcategory>,
    state: State<'_, AppState>,
) -> Result<Option<usize>, String> {
    let appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &appearances.object,
        AppearanceCategory::Outfits => &appearances.outfit,
        AppearanceCategory::Effects => &appearances.effect,
        AppearanceCategory::Missiles => &appearances.missile,
    };

    let mut filtered_ids: Vec<u32> = items
        .iter()
        .filter_map(|appearance| {
            let appearance_id = appearance.id.unwrap_or(0);

            if category == AppearanceCategory::Objects {
                if let Some(ref filter_subcategory) = subcategory {
                    if *filter_subcategory != ItemSubcategory::All {
                        let item_category: Option<i32> = appearance
                            .flags
                            .as_ref()
                            .and_then(|flags| flags.market.as_ref())
                            .and_then(|market| market.category);

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

    Ok(filtered_ids.iter().position(|&value| value == id))
}

/// Get detailed information about a specific appearance
#[tauri::command]
pub async fn get_appearance_details(
    category: AppearanceCategory,
    id: u32,
    state: State<'_, AppState>,
) -> Result<AppearanceDetails, String> {
    let appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &appearances.object,
        AppearanceCategory::Outfits => &appearances.outfit,
        AppearanceCategory::Effects => &appearances.effect,
        AppearanceCategory::Missiles => &appearances.missile,
    };

    let appearance = items
        .iter()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    let frame_groups: Vec<FrameGroupInfo> = appearance
        .frame_group
        .iter()
        .map(|fg| FrameGroupInfo {
            id: fg.id,
            sprite_count: fg
                .sprite_info
                .as_ref()
                .map_or(0, |si| si.sprite_id.len() as u32),
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
        name: appearance
            .name
            .as_ref()
            .map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance
            .description
            .as_ref()
            .map(|b| String::from_utf8_lossy(b).to_string()),
        appearance_type: appearance.appearance_type,
        category,
        frame_groups,
        flags: flags_info,
    })
}

/// Get total count of appearances by category
#[tauri::command]
pub async fn get_appearance_count(
    category: AppearanceCategory,
    search: Option<String>,
    subcategory: Option<ItemSubcategory>,
    state: State<'_, AppState>,
) -> Result<usize, String> {
    let appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &appearances.object,
        AppearanceCategory::Outfits => &appearances.outfit,
        AppearanceCategory::Effects => &appearances.effect,
        AppearanceCategory::Missiles => &appearances.missile,
    };

    let count = items
        .iter()
        .filter(|appearance| {
            let id = appearance.id.unwrap_or(0);
            let name = appearance
                .name
                .as_ref()
                .map(|b| String::from_utf8_lossy(b).to_string());
            let description = appearance
                .description
                .as_ref()
                .map(|b| String::from_utf8_lossy(b).to_string());

            // Apply search filter if provided
            if let Some(ref search_term) = search {
                let search_lower = search_term.to_lowercase();
                let matches = name
                    .as_ref()
                    .map_or(false, |n| n.to_lowercase().contains(&search_lower))
                    || description
                        .as_ref()
                        .map_or(false, |d| d.to_lowercase().contains(&search_lower))
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
                        let item_category: Option<i32> = appearance
                            .flags
                            .as_ref()
                            .and_then(|flags| flags.market.as_ref())
                            .and_then(|market| market.category);

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
        (
            format!("{:?}", ItemSubcategory::All),
            ItemSubcategory::All.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Armors),
            ItemSubcategory::Armors.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Amulets),
            ItemSubcategory::Amulets.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Boots),
            ItemSubcategory::Boots.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Containers),
            ItemSubcategory::Containers.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Decoration),
            ItemSubcategory::Decoration.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Food),
            ItemSubcategory::Food.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::HelmetsHats),
            ItemSubcategory::HelmetsHats.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Legs),
            ItemSubcategory::Legs.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Others),
            ItemSubcategory::Others.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Potions),
            ItemSubcategory::Potions.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Rings),
            ItemSubcategory::Rings.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Runes),
            ItemSubcategory::Runes.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Shields),
            ItemSubcategory::Shields.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Tools),
            ItemSubcategory::Tools.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Valuables),
            ItemSubcategory::Valuables.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Ammunition),
            ItemSubcategory::Ammunition.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Axes),
            ItemSubcategory::Axes.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Clubs),
            ItemSubcategory::Clubs.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::DistanceWeapons),
            ItemSubcategory::DistanceWeapons.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Swords),
            ItemSubcategory::Swords.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::WandsRods),
            ItemSubcategory::WandsRods.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::PremiumScrolls),
            ItemSubcategory::PremiumScrolls.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::TibiaCoins),
            ItemSubcategory::TibiaCoins.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::CreatureProducts),
            ItemSubcategory::CreatureProducts.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Quiver),
            ItemSubcategory::Quiver.display_name().to_string(),
        ),
        (
            format!("{:?}", ItemSubcategory::Soulcores),
            ItemSubcategory::Soulcores.display_name().to_string(),
        ),
    ];

    Ok(subcategories)
}

/// Get COMPLETE appearance data with ALL information
#[tauri::command]
pub async fn get_complete_appearance(
    category: AppearanceCategory,
    id: u32,
    state: State<'_, AppState>,
) -> Result<CompleteAppearanceItem, String> {
    let appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &appearances.object,
        AppearanceCategory::Outfits => &appearances.outfit,
        AppearanceCategory::Effects => &appearances.effect,
        AppearanceCategory::Missiles => &appearances.missile,
    };

    let appearance = items
        .iter()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    Ok(CompleteAppearanceItem::from_protobuf(appearance))
}

/// Get special meaning appearance IDs (coins, chests, etc.)
#[tauri::command]
pub async fn get_special_meaning_ids(
    state: State<'_, AppState>,
) -> Result<Option<crate::commands::SpecialMeaningAppearanceIds>, String> {
    let appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    Ok(appearances
        .special_meaning_appearance_ids
        .as_ref()
        .map(crate::commands::SpecialMeaningAppearanceIds::from_protobuf))
}
