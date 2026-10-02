//! Reorganize (compact) appearance ids within a range.
//!
//! Given a category and an id range `[from, to]`, renumbers the appearances whose
//! id falls in that range to be sequential starting at `from` — removing gaps and
//! freeing the tail `[from+N, to]`. Object-id cross-references inside the catalog
//! (market trade_as / show_as, changed-to-expire former object, npcsaledata
//! currency, and the special-meaning ids) are rewritten to follow the moved ids.
//!
//! This changes CLIENT/appearance ids only — not server item ids (items.xml). The
//! returned `remap` (old→new) is what the caller uses to update editor-managed
//! monster/npc/staticdata files and to export for fixing server scripts by hand.

use super::helpers::{get_items_by_category, get_items_by_category_mut, invalidate_search_cache, rebuild_indexes};
use crate::core::protobuf::{Appearance, SpecialMeaningAppearanceIds};
use crate::features::appearances::AppearanceCategory;
use crate::state::AppState;
use serde::Serialize;
use std::collections::HashMap;
use tauri::State;

#[derive(Serialize)]
pub struct ReorganizePreview {
    /// Appearances found in `[from, to]`.
    pub count: usize,
    /// How many of them actually change id.
    pub changed: usize,
    /// First freed id (`from + count`) and the range's upper bound.
    pub freed_from: u32,
    pub freed_to: u32,
    /// A few `(old, new)` pairs for the UI preview.
    pub sample: Vec<(u32, u32)>,
}

#[derive(Serialize)]
pub struct ReorganizeResult {
    /// Every `(old, new)` id that actually moved.
    pub remap: Vec<(u32, u32)>,
    pub count: usize,
    pub changed: usize,
    pub freed_from: u32,
    pub freed_to: u32,
}

/// Collect the in-range ids (sorted) and build the compacting `old→new` map.
/// Only ids that actually move are inserted into the map; `pairs` keeps them all.
fn build_remap(ids_in_range: &[u32], from: u32) -> (Vec<(u32, u32)>, HashMap<u32, u32>) {
    let mut pairs = Vec::new();
    let mut map = HashMap::new();
    for (i, &old_id) in ids_in_range.iter().enumerate() {
        let new_id = from + i as u32;
        if old_id != new_id {
            pairs.push((old_id, new_id));
            map.insert(old_id, new_id);
        }
    }
    (pairs, map)
}

fn ids_in_range(appearances: &crate::core::protobuf::Appearances, category: &AppearanceCategory, from: u32, to: u32) -> Vec<u32> {
    let mut ids: Vec<u32> = get_items_by_category(appearances, category).iter().filter_map(|a| a.id).filter(|id| *id >= from && *id <= to).collect();
    ids.sort_unstable();
    ids
}

fn validate_range(from: u32, to: u32) -> Result<(), String> {
    if from == 0 {
        return Err("Start id must be greater than 0".to_string());
    }
    if from > to {
        return Err(format!("Invalid range: {} > {}", from, to));
    }
    Ok(())
}

/// Rewrites every object-id reference an appearance holds through `map`
/// (ids absent from the map are left unchanged). Object ids only — lens-help,
/// cyclopedia, proficiency, gem/vocation and upgrade classification are NOT
/// object ids and are intentionally untouched.
fn apply_object_id_remap(appearance: &mut Appearance, map: &HashMap<u32, u32>) {
    let Some(flags) = appearance.flags.as_mut() else {
        return;
    };
    if let Some(market) = flags.market.as_mut() {
        remap_opt(&mut market.trade_as_object_id, map);
        remap_opt(&mut market.show_as_object_id, map);
    }
    if let Some(cte) = flags.changedtoexpire.as_mut() {
        remap_opt(&mut cte.former_object_typeid, map);
    }
    for npc in flags.npcsaledata.iter_mut() {
        remap_opt(&mut npc.currency_object_type_id, map);
    }
}

fn apply_special_meaning_remap(sm: &mut SpecialMeaningAppearanceIds, map: &HashMap<u32, u32>) {
    for field in [
        &mut sm.gold_coin_id,
        &mut sm.platinum_coin_id,
        &mut sm.crystal_coin_id,
        &mut sm.tibia_coin_id,
        &mut sm.stamped_letter_id,
        &mut sm.supply_stash_id,
        &mut sm.standard_reward_chest_id,
        &mut sm.blank_imbuement_scroll_id,
    ] {
        remap_opt(field, map);
    }
}

#[inline]
fn remap_opt(field: &mut Option<u32>, map: &HashMap<u32, u32>) {
    if let Some(id) = *field {
        if let Some(new_id) = map.get(&id) {
            *field = Some(*new_id);
        }
    }
}

/// Read-only: compute what a reorganize would do, without applying it.
#[tauri::command]
pub async fn preview_reorganize_appearance_ids(category: AppearanceCategory, from: u32, to: u32, state: State<'_, AppState>) -> Result<ReorganizePreview, String> {
    validate_range(from, to)?;
    let appearances_lock = state.appearances.read();
    let appearances = appearances_lock.as_ref().ok_or_else(|| "No appearances loaded".to_string())?;

    let ids = ids_in_range(appearances, &category, from, to);
    let (pairs, _map) = build_remap(&ids, from);

    Ok(ReorganizePreview {
        count: ids.len(),
        changed: pairs.len(),
        freed_from: from + ids.len() as u32,
        freed_to: to,
        sample: pairs.into_iter().take(50).collect(),
    })
}

/// Compact the appearance ids in `[from, to]` sequentially from `from`, rewrite
/// internal object-id references, rebuild indexes and drop derived caches. Does
/// NOT persist — the caller saves the `.dat` (as the other id commands do) and
/// applies the returned `remap` to external files.
#[tauri::command]
pub async fn reorganize_appearance_ids(category: AppearanceCategory, from: u32, to: u32, state: State<'_, AppState>) -> Result<ReorganizeResult, String> {
    validate_range(from, to)?;

    let mut appearances_lock = state.appearances.write();
    let appearances = appearances_lock.as_mut().ok_or_else(|| "No appearances loaded".to_string())?;

    let ids = ids_in_range(appearances, &category, from, to);
    let (pairs, map) = build_remap(&ids, from);

    if map.is_empty() {
        // Already compact — nothing to do.
        return Ok(ReorganizeResult {
            remap: Vec::new(),
            count: ids.len(),
            changed: 0,
            freed_from: from + ids.len() as u32,
            freed_to: to,
        });
    }

    // Reassign the moved ids. New ids ⊆ [from, to] and every in-range id is
    // remapped (its old id is freed), so no collision with out-of-range ids.
    {
        let items = get_items_by_category_mut(appearances, &category);
        for a in items.iter_mut() {
            if let Some(id) = a.id {
                if let Some(new_id) = map.get(&id) {
                    a.id = Some(*new_id);
                }
            }
        }
        items.sort_by_key(|a| a.id.unwrap_or(0));
    }

    // Object ids are the only appearance ids referenced from other appearances.
    if matches!(category, AppearanceCategory::Objects) {
        for a in appearances.object.iter_mut() {
            apply_object_id_remap(a, &map);
        }
        if let Some(sm) = appearances.special_meaning_appearance_ids.as_mut() {
            apply_special_meaning_remap(sm, &map);
        }
    }

    rebuild_indexes(&state, appearances);
    invalidate_search_cache(&state);
    // Many ids changed; drop per-id sprite/preview/png caches so nothing resolves
    // a stale id.
    state.clear_caches();

    Ok(ReorganizeResult {
        count: ids.len(),
        changed: pairs.len(),
        freed_from: from + ids.len() as u32,
        freed_to: to,
        remap: pairs,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_remap_compacts_and_reports_only_moves() {
        // Sparse ids 3000, 4000, 4005 compacted from 3000 -> 3000,3001,3002.
        let ids = vec![3000u32, 4000, 4005];
        let (pairs, map) = build_remap(&ids, 3000);
        assert_eq!(map.get(&4000), Some(&3001));
        assert_eq!(map.get(&4005), Some(&3002));
        // 3000 stays put, so it's not a "move".
        assert!(!map.contains_key(&3000));
        assert_eq!(pairs.len(), 2);
    }

    #[test]
    fn build_remap_noop_when_already_sequential() {
        let ids = vec![10u32, 11, 12];
        let (pairs, map) = build_remap(&ids, 10);
        assert!(pairs.is_empty());
        assert!(map.is_empty());
    }

    #[test]
    fn special_meaning_follows_moved_object_ids() {
        let map: HashMap<u32, u32> = [(4000u32, 3001u32)].into_iter().collect();
        let mut sm = SpecialMeaningAppearanceIds {
            gold_coin_id: Some(4000),
            platinum_coin_id: Some(999),
            ..Default::default()
        };
        apply_special_meaning_remap(&mut sm, &map);
        assert_eq!(sm.gold_coin_id, Some(3001));
        assert_eq!(sm.platinum_coin_id, Some(999)); // untouched
    }

    #[test]
    fn validate_range_rejects_bad_bounds() {
        assert!(validate_range(0, 10).is_err());
        assert!(validate_range(10, 5).is_err());
        assert!(validate_range(3000, 8000).is_ok());
    }
}
