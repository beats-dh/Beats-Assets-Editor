use crate::features::staticdata::parsers::{load_staticdata_doc, StaticDataDoc};
use crate::features::staticmapdata::{parsers::load_staticmapdata, StaticMapData};
use crate::state::AppState;
use prost::Message;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::PathBuf;
use tauri::State;

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StaticDataMergeThresholds {
    pub creatures: u32,
    pub bosses: u32,
    pub houses: u32,
    pub quests: u32,
    pub achievements: u32,
    /// Newer-client schema only; ignored for legacy files.
    pub monster_classes: u32,
    pub map_houses: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticDataMergePreview {
    pub creatures_to_add: usize,
    pub bosses_to_add: usize,
    pub houses_to_add: usize,
    pub quests_to_add: usize,
    pub achievements_to_add: usize,
    pub monster_classes_to_add: usize,
    pub map_houses_to_add: usize,
    /// File name that will be overwritten (e.g. "staticdata-12.90.dat")
    pub staticdata_file: String,
    pub staticmapdata_file: Option<String>,
    /// Which schema both files use: "old" or "new".
    pub schema: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticDataMergeResult {
    pub creatures_added: usize,
    pub bosses_added: usize,
    pub houses_added: usize,
    pub quests_added: usize,
    pub achievements_added: usize,
    pub monster_classes_added: usize,
    pub map_houses_added: usize,
}

/// How many items each category gained.
#[derive(Debug, Default)]
struct MergeCounts {
    creatures: usize,
    bosses: usize,
    houses: usize,
    quests: usize,
    achievements: usize,
    monster_classes: usize,
}

/// Merge `custom` into `official`. Both documents must use the same schema:
/// the categories are renumbered between schemas, so mixing them would write
/// one layout's data under another's field numbers.
fn merge_docs(official: StaticDataDoc, custom: &StaticDataDoc, thresholds: &StaticDataMergeThresholds) -> Result<(StaticDataDoc, MergeCounts), String> {
    // Merge one category in place, recording how many items were added.
    macro_rules! merge_into {
        ($counts:expr, $field:ident, $base:expr, $custom:expr, $threshold:expr) => {{
            let (merged, added) = merge_by_id(std::mem::take(&mut $base), &$custom, $threshold, |x| x.id);
            $base = merged;
            $counts.$field = added;
        }};
    }

    let mut counts = MergeCounts::default();

    match (official, custom) {
        (StaticDataDoc::Old(mut o), StaticDataDoc::Old(c)) => {
            merge_into!(counts, creatures, o.creatures, c.creatures, thresholds.creatures);
            merge_into!(counts, bosses, o.bosses, c.bosses, thresholds.bosses);
            merge_into!(counts, houses, o.houses, c.houses, thresholds.houses);
            merge_into!(counts, quests, o.quests, c.quests, thresholds.quests);
            merge_into!(counts, achievements, o.achievements, c.achievements, thresholds.achievements);
            Ok((StaticDataDoc::Old(o), counts))
        }
        (StaticDataDoc::New(mut n), StaticDataDoc::New(c)) => {
            merge_into!(counts, creatures, n.monsters, c.monsters, thresholds.creatures);
            merge_into!(counts, bosses, n.bosses, c.bosses, thresholds.bosses);
            merge_into!(counts, houses, n.houses, c.houses, thresholds.houses);
            merge_into!(counts, quests, n.quests, c.quests, thresholds.quests);
            merge_into!(counts, achievements, n.achievements, c.achievements, thresholds.achievements);
            merge_into!(counts, monster_classes, n.monster_classes, c.monster_classes, thresholds.monster_classes);
            Ok((StaticDataDoc::New(n), counts))
        }
        (official, custom) => Err(format!(
            "Schema mismatch: the official staticdata uses the \"{}\" schema but the loaded one uses \"{}\". \
             Load a staticdata from the same client version before merging.",
            official.version(),
            custom.version()
        )),
    }
}

/// Load the official staticdata (from the selected new-assets folder) plus the
/// staticdata currently loaded in the app.
fn load_both(state: &State<'_, AppState>) -> Result<(PathBuf, StaticDataDoc, StaticDataDoc, Option<PathBuf>, Option<StaticMapData>, Option<StaticMapData>), String> {
    let new_assets_dir = {
        let lock = state.merge_source_assets_dir.read();
        lock.as_ref().ok_or("New assets folder not set — select it in step 5 first")?.clone()
    };

    let sd_path = find_largest_dat(&new_assets_dir, "staticdata-").ok_or("No staticdata-*.dat found in the selected assets folder")?;
    let smd_path = find_largest_dat(&new_assets_dir, "staticmapdata-");

    let official_sd = load_staticdata_doc(&sd_path).map_err(|e| format!("Failed to load official staticdata: {}", e))?;
    let official_smd = smd_path.as_ref().and_then(|p| load_staticmapdata(p).ok());

    let current_sd = {
        let lock = state.staticdata_doc.read();
        lock.as_ref().ok_or("No staticdata loaded in app — load it first")?.clone()
    };
    let current_smd = { state.staticmapdata.read().as_ref().cloned() };

    Ok((sd_path, official_sd, current_sd, smd_path, official_smd, current_smd))
}

/// Preview which custom items would be added to the official files
/// auto-discovered in the new assets folder (already set in state).
#[tauri::command]
pub async fn get_staticdata_merge_preview(thresholds: StaticDataMergeThresholds, state: State<'_, AppState>) -> Result<StaticDataMergePreview, String> {
    let (sd_path, official_sd, current_sd, smd_path, official_smd, current_smd) = load_both(&state)?;

    let schema = current_sd.version().to_string();
    let (_, counts) = merge_docs(official_sd, &current_sd, &thresholds)?;

    let map_houses_to_add = match (&official_smd, &current_smd) {
        (Some(official), Some(current)) => {
            let (_, n) = merge_by_id(official.houses.clone(), &current.houses, thresholds.map_houses, |x| x.house_id);
            n
        }
        _ => 0,
    };

    Ok(StaticDataMergePreview {
        creatures_to_add: counts.creatures,
        bosses_to_add: counts.bosses,
        houses_to_add: counts.houses,
        quests_to_add: counts.quests,
        achievements_to_add: counts.achievements,
        monster_classes_to_add: counts.monster_classes,
        map_houses_to_add,
        staticdata_file: file_name_str(&sd_path),
        staticmapdata_file: smd_path.map(|p| file_name_str(&p)),
        schema,
    })
}

/// Merge custom items into official staticdata/staticmapdata and save them in-place.
#[tauri::command]
pub async fn execute_staticdata_merge(thresholds: StaticDataMergeThresholds, state: State<'_, AppState>) -> Result<StaticDataMergeResult, String> {
    let (sd_path, official_sd, current_sd, smd_path, official_smd, current_smd) = load_both(&state)?;

    let (merged_sd, counts) = merge_docs(official_sd, &current_sd, &thresholds)?;

    // Stage in memory instead of writing to disk
    *state.staged_staticdata.write() = Some((sd_path.clone(), merged_sd));

    let map_houses_added = match (official_smd, &current_smd, &smd_path) {
        (Some(official), Some(current), Some(path)) => {
            let (new_map_houses, n) = merge_by_id(official.houses, &current.houses, thresholds.map_houses, |x| x.house_id);
            let merged_smd = StaticMapData {
                houses: new_map_houses,
            };
            let mut buf = Vec::new();
            merged_smd.encode(&mut buf).map_err(|e| format!("Encode staticmapdata error: {}", e))?;
            // Stage in memory instead of writing to disk
            *state.staged_staticmapdata.write() = Some((path.clone(), buf));
            n
        }
        _ => 0,
    };

    Ok(StaticDataMergeResult {
        creatures_added: counts.creatures,
        bosses_added: counts.bosses,
        houses_added: counts.houses,
        quests_added: counts.quests,
        achievements_added: counts.achievements,
        monster_classes_added: counts.monster_classes,
        map_houses_added,
    })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Merge items with id >= threshold from custom into base (skipping conflicts), sorted by id.
fn merge_by_id<T: Clone>(mut base: Vec<T>, custom: &[T], threshold: u32, get_id: impl Fn(&T) -> Option<u32>) -> (Vec<T>, usize) {
    let base_ids: HashSet<u32> = base.iter().filter_map(|x| get_id(x)).collect();
    let mut added = 0;
    for item in custom {
        if let Some(id) = get_id(item) {
            if id >= threshold && !base_ids.contains(&id) {
                base.push(item.clone());
                added += 1;
            }
        }
    }
    base.sort_by_key(|x| get_id(x).unwrap_or(0));
    (base, added)
}

/// Find the .dat file with the given prefix that has the largest size
/// (largest = most complete = most recent version).
pub(crate) fn find_largest_dat(dir: &PathBuf, prefix: &str) -> Option<PathBuf> {
    let entries = std::fs::read_dir(dir).ok()?;
    let mut files: Vec<(PathBuf, u64)> = entries
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.file_name().and_then(|n| n.to_str()).map(|n| n.starts_with(prefix) && n.ends_with(".dat")).unwrap_or(false))
        .map(|p| {
            let size = std::fs::metadata(&p).map(|m| m.len()).unwrap_or(0);
            (p, size)
        })
        .collect();
    files.sort_by_key(|(_, size)| std::cmp::Reverse(*size));
    files.into_iter().next().map(|(p, _)| p)
}

pub(crate) fn file_name_str(path: &PathBuf) -> String {
    path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default()
}
