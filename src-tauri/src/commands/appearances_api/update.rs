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