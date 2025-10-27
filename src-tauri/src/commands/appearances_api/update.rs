use crate::commands::AppState;
use super::types::{AppearanceItem, AppearanceCategory};

#[tauri::command]
pub async fn update_appearance_name(
    category: AppearanceCategory,
    id: u32,
    new_name: String,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    appearance.name = if new_name.trim().is_empty() {
        None
    } else {
        Some(new_name.trim().as_bytes().to_vec())
    };

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_automap(
    category: AppearanceCategory,
    id: u32,
    color: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if color.is_none() {
        flags.automap = None;
    } else {
        flags.automap = Some(crate::core::protobuf::AppearanceFlagAutomap { color });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_hook(
    category: AppearanceCategory,
    id: u32,
    direction: Option<i32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if direction.is_none() {
        flags.hook = None;
    } else {
        flags.hook = Some(crate::core::protobuf::AppearanceFlagHook { direction });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_lenshelp(
    category: AppearanceCategory,
    id: u32,
    lenshelp_id: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if lenshelp_id.is_none() {
        flags.lenshelp = None;
    } else {
        flags.lenshelp = Some(crate::core::protobuf::AppearanceFlagLenshelp { id: lenshelp_id });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_clothes(
    category: AppearanceCategory,
    id: u32,
    slot: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if slot.is_none() {
        flags.clothes = None;
    } else {
        flags.clothes = Some(crate::core::protobuf::AppearanceFlagClothes { slot });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_default_action(
    category: AppearanceCategory,
    id: u32,
    action: Option<i32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if action.is_none() {
        flags.default_action = None;
    } else {
        flags.default_action = Some(crate::core::protobuf::AppearanceFlagDefaultAction { action });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
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
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

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

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_bank(
    category: AppearanceCategory,
    id: u32,
    waypoints: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if waypoints.is_none() {
        flags.bank = None;
    } else {
        flags.bank = Some(crate::core::protobuf::AppearanceFlagBank { waypoints });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_changed_to_expire(
    category: AppearanceCategory,
    id: u32,
    former_object_typeid: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if former_object_typeid.is_none() {
        flags.changedtoexpire = None;
    } else {
        flags.changedtoexpire = Some(crate::core::protobuf::AppearanceFlagChangedToExpire { former_object_typeid });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_cyclopedia_item(
    category: AppearanceCategory,
    id: u32,
    cyclopedia_type: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if cyclopedia_type.is_none() {
        flags.cyclopediaitem = None;
    } else {
        flags.cyclopediaitem = Some(crate::core::protobuf::AppearanceFlagCyclopedia { cyclopedia_type });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_upgrade_classification(
    category: AppearanceCategory,
    id: u32,
    upgrade_classification: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if upgrade_classification.is_none() {
        flags.upgradeclassification = None;
    } else {
        flags.upgradeclassification = Some(crate::core::protobuf::AppearanceFlagUpgradeClassification { upgrade_classification });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_skillwheel_gem(
    category: AppearanceCategory,
    id: u32,
    gem_quality_id: Option<u32>,
    vocation_id: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if gem_quality_id.is_none() && vocation_id.is_none() {
        flags.skillwheel_gem = None;
    } else {
        flags.skillwheel_gem = Some(crate::core::protobuf::AppearanceFlagSkillWheelGem { gem_quality_id, vocation_id });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_imbueable(
    category: AppearanceCategory,
    id: u32,
    slot_count: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if slot_count.is_none() {
        flags.imbueable = None;
    } else {
        flags.imbueable = Some(crate::core::protobuf::AppearanceFlagImbueable { slot_count });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_proficiency(
    category: AppearanceCategory,
    id: u32,
    proficiency_id: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if proficiency_id.is_none() {
        flags.proficiency = None;
    } else {
        flags.proficiency = Some(crate::core::protobuf::AppearanceFlagProficiency { proficiency_id });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_transparency_level(
    category: AppearanceCategory,
    id: u32,
    transparency_level: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if transparency_level.is_none() {
        flags.transparencylevel = None;
    } else {
        flags.transparencylevel = Some(crate::core::protobuf::AppearanceFlagTransparencyLevel { level: transparency_level });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_weapon_type(
    category: AppearanceCategory,
    id: u32,
    weapon_type: Option<i32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    // Direct optional enum/integer flag; None removes it
    flags.weapon_type = weapon_type;

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_description(
    category: AppearanceCategory,
    id: u32,
    new_description: String,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    appearance.description = if new_description.trim().is_empty() {
        None
    } else {
        Some(new_description.trim().as_bytes().to_vec())
    };

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

fn set_bool_flag(
    flags: &mut crate::core::protobuf::AppearanceFlags,
    key: &str,
    value: bool,
) -> Result<(), String> {
    let k = key.to_lowercase().replace('_', "").replace(' ', "");
    match k.as_str() {
        "clip" => { flags.clip = Some(value); }
        "bottom" => { flags.bottom = Some(value); }
        "top" => { flags.top = Some(value); }
        "container" => { flags.container = Some(value); }
        "cumulative" => { flags.cumulative = Some(value); }
        "usable" => { flags.usable = Some(value); }
        "forceuse" => { flags.forceuse = Some(value); }
        "multiuse" => { flags.multiuse = Some(value); }
        "liquidpool" => { flags.liquidpool = Some(value); }
        "unpass" | "unpassable" => { flags.unpass = Some(value); }
        "unmove" | "unmovable" => { flags.unmove = Some(value); }
        "unsight" | "blocksight" => { flags.unsight = Some(value); }
        "avoid" | "avoidwalk" => { flags.avoid = Some(value); }
        "nomovementanimation" => { flags.no_movement_animation = Some(value); }
        "take" | "takeable" => { flags.take = Some(value); }
        "liquidcontainer" => { flags.liquidcontainer = Some(value); }
        "hang" | "hangable" => { flags.hang = Some(value); }
        "rotate" | "rotatable" => { flags.rotate = Some(value); }
        "donthide" => { flags.dont_hide = Some(value); }
        "translucent" => { flags.translucent = Some(value); }
        "lyingobject" => { flags.lying_object = Some(value); }
        "animatealways" => { flags.animate_always = Some(value); }
        "fullbank" => { flags.fullbank = Some(value); }
        "ignorelook" => { flags.ignore_look = Some(value); }
        "wrap" => { flags.wrap = Some(value); }
        "unwrap" => { flags.unwrap = Some(value); }
        "topeffect" => { flags.topeffect = Some(value); }
        "corpse" => { flags.corpse = Some(value); }
        "playercorpse" => { flags.player_corpse = Some(value); }
        "ammo" => { flags.ammo = Some(value); }
        "showoffsocket" => { flags.show_off_socket = Some(value); }
        "reportable" => { flags.reportable = Some(value); }
        "reverseaddonseast" => { flags.reverse_addons_east = Some(value); }
        "reverseaddonswest" => { flags.reverse_addons_west = Some(value); }
        "reverseaddonssouth" => { flags.reverse_addons_south = Some(value); }
        "reverseaddonsnorth" => { flags.reverse_addons_north = Some(value); }
        "wearout" => { flags.wearout = Some(value); }
        "clockexpire" => { flags.clockexpire = Some(value); }
        "expire" => { flags.expire = Some(value); }
        "expirestop" => { flags.expirestop = Some(value); }
        "decoitemkit" => { flags.deco_item_kit = Some(value); }
        "dualwielding" => { flags.dual_wielding = Some(value); }
        "hooksouth" => { flags.hook_south = Some(value); }
        "hookeast" => { flags.hook_east = Some(value); }
        _ => return Err(format!("Unknown boolean flag '{}'" , key)),
    }
    Ok(())
}

#[tauri::command]
pub async fn update_appearance_flag_bool(
    category: AppearanceCategory,
    id: u32,
    flag: String,
    value: bool,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    set_bool_flag(flags, &flag, value)?;

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_light(
    category: AppearanceCategory,
    id: u32,
    brightness: Option<u32>,
    color: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if brightness.is_none() && color.is_none() {
        flags.light = None;
    } else {
        flags.light = Some(crate::core::protobuf::AppearanceFlagLight { brightness, color });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_shift(
    category: AppearanceCategory,
    id: u32,
    x: Option<u32>,
    y: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if x.is_none() && y.is_none() {
        flags.shift = None;
    } else {
        flags.shift = Some(crate::core::protobuf::AppearanceFlagShift { x, y });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_height(
    category: AppearanceCategory,
    id: u32,
    elevation: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if elevation.is_none() {
        flags.height = None;
    } else {
        flags.height = Some(crate::core::protobuf::AppearanceFlagHeight { elevation });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_write(
    category: AppearanceCategory,
    id: u32,
    max_text_length: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if max_text_length.is_none() {
        flags.write = None;
    } else {
        flags.write = Some(crate::core::protobuf::AppearanceFlagWrite { max_text_length });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}

#[tauri::command]
pub async fn update_appearance_write_once(
    category: AppearanceCategory,
    id: u32,
    max_text_length_once: Option<u32>,
    state: tauri::State<'_, AppState>,
) -> Result<AppearanceItem, String> {
    let mut appearances_lock = state.appearances.lock().unwrap();

    let appearances = match &mut *appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    let items = match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    };

    let appearance = items
        .iter_mut()
        .find(|app| app.id.unwrap_or(0) == id)
        .ok_or_else(|| format!("Appearance with ID {} not found in {:?}", id, category))?;

    if appearance.flags.is_none() {
        appearance.flags = Some(crate::core::protobuf::AppearanceFlags::default());
    }
    let flags = appearance.flags.as_mut().unwrap();

    if max_text_length_once.is_none() {
        flags.write_once = None;
    } else {
        flags.write_once = Some(crate::core::protobuf::AppearanceFlagWriteOnce { max_text_length_once });
    }

    let sprite_count: u32 = appearance
        .frame_group
        .iter()
        .map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32))
        .sum();

    Ok(AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        description: appearance.description.as_ref().map(|b| String::from_utf8_lossy(b).to_string()),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    })
}