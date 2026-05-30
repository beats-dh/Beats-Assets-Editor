use crate::features::staticdata::{parsers::load_staticdata, StaticData};
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
    pub titles: u32,
    pub map_houses: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticDataMergePreview {
    pub creatures_to_add: usize,
    pub bosses_to_add: usize,
    pub houses_to_add: usize,
    pub quests_to_add: usize,
    pub titles_to_add: usize,
    pub map_houses_to_add: usize,
    /// File name that will be overwritten (e.g. "staticdata-12.90.dat")
    pub staticdata_file: String,
    pub staticmapdata_file: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaticDataMergeResult {
    pub creatures_added: usize,
    pub bosses_added: usize,
    pub houses_added: usize,
    pub quests_added: usize,
    pub titles_added: usize,
    pub map_houses_added: usize,
}

/// Preview which custom items would be added to the official files
/// auto-discovered in the new assets folder (already set in state).
#[tauri::command]
pub async fn get_staticdata_merge_preview(
    thresholds: StaticDataMergeThresholds,
    state: State<'_, AppState>,
) -> Result<StaticDataMergePreview, String> {
    let new_assets_dir = {
        let lock = state.merge_source_assets_dir.read();
        lock.as_ref()
            .ok_or("New assets folder not set — select it in step 5 first")?
            .clone()
    };

    let sd_path = find_largest_dat(&new_assets_dir, "staticdata-")
        .ok_or("No staticdata-*.dat found in the selected assets folder")?;
    let smd_path = find_largest_dat(&new_assets_dir, "staticmapdata-");

    let official_sd = load_staticdata(&sd_path)
        .map_err(|e| format!("Failed to load official staticdata: {}", e))?;
    let official_smd = smd_path.as_ref().and_then(|p| load_staticmapdata(p).ok());

    let current_sd = {
        let lock = state.staticdata.read();
        lock.as_ref()
            .ok_or("No staticdata loaded in app — load it first")?
            .clone()
    };
    let current_smd = { state.staticmapdata.read().as_ref().cloned() };

    let (_, creatures_to_add) = merge_by_id(official_sd.creatures.clone(), &current_sd.creatures, thresholds.creatures, |x| x.id);
    let (_, bosses_to_add)   = merge_by_id(official_sd.bosses.clone(),   &current_sd.bosses,   thresholds.bosses,   |x| x.id);
    let (_, houses_to_add)   = merge_by_id(official_sd.houses.clone(),   &current_sd.houses,   thresholds.houses,   |x| x.id);
    let (_, quests_to_add)   = merge_by_id(official_sd.quests.clone(),   &current_sd.quests,   thresholds.quests,   |x| x.id);
    let (_, titles_to_add)   = merge_by_id(official_sd.titles.clone(),   &current_sd.titles,   thresholds.titles,   |x| x.id);

    let map_houses_to_add = match (&official_smd, &current_smd) {
        (Some(official), Some(current)) => {
            let (_, n) = merge_by_id(official.houses.clone(), &current.houses, thresholds.map_houses, |x| x.house_id);
            n
        }
        _ => 0,
    };

    Ok(StaticDataMergePreview {
        creatures_to_add,
        bosses_to_add,
        houses_to_add,
        quests_to_add,
        titles_to_add,
        map_houses_to_add,
        staticdata_file: file_name_str(&sd_path),
        staticmapdata_file: smd_path.map(|p| file_name_str(&p)),
    })
}

/// Merge custom items into official staticdata/staticmapdata and save them in-place.
#[tauri::command]
pub async fn execute_staticdata_merge(
    thresholds: StaticDataMergeThresholds,
    state: State<'_, AppState>,
) -> Result<StaticDataMergeResult, String> {
    let new_assets_dir = {
        let lock = state.merge_source_assets_dir.read();
        lock.as_ref().ok_or("New assets folder not set")?.clone()
    };

    let sd_path = find_largest_dat(&new_assets_dir, "staticdata-")
        .ok_or("No staticdata-*.dat found")?;
    let smd_path = find_largest_dat(&new_assets_dir, "staticmapdata-");

    let official_sd = load_staticdata(&sd_path)
        .map_err(|e| format!("Failed to load official staticdata: {}", e))?;
    let official_smd = smd_path.as_ref().and_then(|p| load_staticmapdata(p).ok());

    let current_sd = {
        let lock = state.staticdata.read();
        lock.as_ref().ok_or("No staticdata loaded")?.clone()
    };
    let current_smd = { state.staticmapdata.read().as_ref().cloned() };

    let (new_creatures, creatures_added) = merge_by_id(official_sd.creatures, &current_sd.creatures, thresholds.creatures, |x| x.id);
    let (new_bosses,   bosses_added)     = merge_by_id(official_sd.bosses,   &current_sd.bosses,   thresholds.bosses,   |x| x.id);
    let (new_houses,   houses_added)     = merge_by_id(official_sd.houses,   &current_sd.houses,   thresholds.houses,   |x| x.id);
    let (new_quests,   quests_added)     = merge_by_id(official_sd.quests,   &current_sd.quests,   thresholds.quests,   |x| x.id);
    let (new_titles,   titles_added)     = merge_by_id(official_sd.titles,   &current_sd.titles,   thresholds.titles,   |x| x.id);

    let merged_sd = StaticData {
        creatures: new_creatures,
        titles: new_titles,
        houses: new_houses,
        bosses: new_bosses,
        quests: new_quests,
    };
    // Stage in memory instead of writing to disk
    *state.staged_staticdata.write() = Some((sd_path.clone(), merged_sd));

    let map_houses_added = match (official_smd, &current_smd, &smd_path) {
        (Some(official), Some(current), Some(path)) => {
            let (new_map_houses, n) =
                merge_by_id(official.houses, &current.houses, thresholds.map_houses, |x| x.house_id);
            let merged_smd = StaticMapData { houses: new_map_houses };
            let mut buf = Vec::new();
            merged_smd.encode(&mut buf)
                .map_err(|e| format!("Encode staticmapdata error: {}", e))?;
            // Stage in memory instead of writing to disk
            *state.staged_staticmapdata.write() = Some((path.clone(), buf));
            n
        }
        _ => 0,
    };

    Ok(StaticDataMergeResult {
        creatures_added,
        bosses_added,
        houses_added,
        quests_added,
        titles_added,
        map_houses_added,
    })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Merge items with id >= threshold from custom into base (skipping conflicts), sorted by id.
fn merge_by_id<T: Clone>(
    mut base: Vec<T>,
    custom: &[T],
    threshold: u32,
    get_id: impl Fn(&T) -> Option<u32>,
) -> (Vec<T>, usize) {
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
        .filter(|p| {
            p.file_name()
                .and_then(|n| n.to_str())
                .map(|n| n.starts_with(prefix) && n.ends_with(".dat"))
                .unwrap_or(false)
        })
        .map(|p| {
            let size = std::fs::metadata(&p).map(|m| m.len()).unwrap_or(0);
            (p, size)
        })
        .collect();
    files.sort_by_key(|(_, size)| std::cmp::Reverse(*size));
    files.into_iter().next().map(|(p, _)| p)
}

pub(crate) fn file_name_str(path: &PathBuf) -> String {
    path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default()
}
