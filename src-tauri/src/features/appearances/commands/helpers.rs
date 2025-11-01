// Helper utilities for appearance commands
// Eliminates code duplication across command handlers

use super::category_types::{AppearanceCategory, AppearanceItem};
use crate::core::protobuf::{Appearance, AppearanceFlags, Appearances};

/// Get immutable reference to items by category
/// Eliminates 33+ duplicate match blocks
#[inline]
pub fn get_items_by_category<'a>(appearances: &'a Appearances, category: &AppearanceCategory) -> &'a Vec<Appearance> {
    match category {
        AppearanceCategory::Objects => &appearances.object,
        AppearanceCategory::Outfits => &appearances.outfit,
        AppearanceCategory::Effects => &appearances.effect,
        AppearanceCategory::Missiles => &appearances.missile,
    }
}

/// Get mutable reference to items by category
/// Eliminates 33+ duplicate match blocks
#[inline]
pub fn get_items_by_category_mut<'a>(appearances: &'a mut Appearances, category: &AppearanceCategory) -> &'a mut Vec<Appearance> {
    match category {
        AppearanceCategory::Objects => &mut appearances.object,
        AppearanceCategory::Outfits => &mut appearances.outfit,
        AppearanceCategory::Effects => &mut appearances.effect,
        AppearanceCategory::Missiles => &mut appearances.missile,
    }
}

/// Convert bytes to String
/// Eliminates 60+ duplicate conversions
#[inline]
pub fn bytes_to_string(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).to_string()
}

/// Ensure appearance has flags initialized, return mutable reference
/// Eliminates 21+ duplicate flag initialization blocks
#[inline]
pub fn ensure_flags(appearance: &mut Appearance) -> &mut AppearanceFlags {
    if appearance.flags.is_none() {
        appearance.flags = Some(AppearanceFlags::default());
    }
    appearance.flags.as_mut().unwrap()
}

/// Create AppearanceItem response from an Appearance
/// Eliminates 24+ duplicate response construction blocks
#[inline]
pub fn create_appearance_item_response(id: u32, appearance: &Appearance) -> AppearanceItem {
    let sprite_count: u32 = appearance.frame_group.iter().map(|fg| fg.sprite_info.as_ref().map_or(0, |si| si.sprite_id.len() as u32)).sum();

    AppearanceItem {
        id,
        name: appearance.name.as_ref().map(|b| bytes_to_string(b)),
        description: appearance.description.as_ref().map(|b| bytes_to_string(b)),
        has_flags: appearance.flags.is_some(),
        sprite_count,
    }
}
