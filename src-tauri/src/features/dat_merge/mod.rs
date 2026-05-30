pub mod staticdata_merge;
pub use staticdata_merge::{get_staticdata_merge_preview, execute_staticdata_merge, StaticDataMergeThresholds, StaticDataMergePreview, StaticDataMergeResult};

use crate::core::protobuf::{Appearance, Appearances};
use crate::features::appearances::parsers::load_appearances;
use crate::features::appearances::commands::helpers::{rebuild_indexes, invalidate_search_cache};
use crate::features::sprites::parsers::SpriteCatalogEntry;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use tauri::State;

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MergeThresholds {
    pub objects: u32,
    pub outfits: u32,
    pub effects: u32,
    pub missiles: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MergeSourceStats {
    pub objects: usize,
    pub outfits: usize,
    pub effects: usize,
    pub missiles: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MergePreview {
    /// Items in custom dat with id >= threshold (will be transferred)
    pub to_add: MergeSourceStats,
    /// Items with id >= threshold that exist in BOTH dats (conflicts — skipped)
    pub conflicts: MergeSourceStats,
    /// Items in official dat with id < threshold (kept as-is)
    pub official_kept: MergeSourceStats,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpriteCatalogStats {
    pub total_entries: usize,
    pub max_sprite_id: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictEntry {
    pub file: String,
    pub first_sprite_id: u32,
    pub last_sprite_id: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpriteMergePreview {
    pub custom_sprite_count: usize,
    /// Files with no ID conflict — copied with original IDs.
    pub lzma_files_to_copy: usize,
    /// Files whose ID range overlaps with official — will be remapped to IDs above official max.
    pub conflict_entries: Vec<ConflictEntry>,
    /// First new sprite ID that will be assigned after remapping.
    pub remap_starts_at: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpriteMergeResult {
    pub files_copied: usize,
    pub catalog_entries_added: usize,
    /// Number of sprite_id references updated in the .dat.
    pub sprites_remapped: usize,
    pub new_first_sprite_id: u32,
    pub new_last_sprite_id: u32,
}

/// Stats returned when the user selects the new official assets folder.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MergeFolderStats {
    pub appearances: MergeSourceStats,
    pub appearances_file: String,
    pub catalog: Option<SpriteCatalogStats>,
    pub staticdata_file: Option<String>,
    pub staticmapdata_file: Option<String>,
}

/// Select the new official assets folder — auto-discovers all .dat files inside it.
/// Replaces the need to pick appearances.dat and the assets folder separately.
#[tauri::command]
pub async fn load_merge_folder(assets_path: String, state: State<'_, AppState>) -> Result<MergeFolderStats, String> {
    let dir = PathBuf::from(&assets_path);

    // Auto-discover appearances file (appearances-{hash}.dat or appearances_latest.dat)
    let appearances_path = find_appearances_dat(&dir).ok_or_else(|| "Nenhum arquivo appearances-*.dat ou appearances_latest.dat encontrado na pasta selecionada".to_string())?;
    let appearances = load_appearances(&appearances_path).map_err(|e: anyhow::Error| format!("Falha ao carregar appearances.dat: {}", e))?;

    let appearances_stats = MergeSourceStats {
        objects: appearances.object.len(),
        outfits: appearances.outfit.len(),
        effects: appearances.effect.len(),
        missiles: appearances.missile.len(),
    };

    *state.merge_source.write() = Some(appearances);
    *state.merge_source_assets_dir.write() = Some(dir.clone());

    // catalog-content.json
    let catalog = {
        let catalog_path = dir.join("catalog-content.json");
        if catalog_path.exists() {
            std::fs::read_to_string(&catalog_path).ok().and_then(|d| serde_json::from_str::<Vec<SpriteCatalogEntry>>(&d).ok()).map(|entries| {
                let sprite_entries: Vec<_> = entries.iter().filter(|e| e.entry_type == "sprite").collect();
                let max_sprite_id = sprite_entries.iter().filter_map(|e| e.last_sprite_id).max().unwrap_or(0);
                SpriteCatalogStats {
                    total_entries: sprite_entries.len(),
                    max_sprite_id,
                }
            })
        } else {
            None
        }
    };

    let staticdata_file = staticdata_merge::find_largest_dat(&dir, "staticdata-").map(|p| staticdata_merge::file_name_str(&p));
    let staticmapdata_file = staticdata_merge::find_largest_dat(&dir, "staticmapdata-").map(|p| staticdata_merge::file_name_str(&p));

    let appearances_file = appearances_path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();

    Ok(MergeFolderStats {
        appearances: appearances_stats,
        appearances_file,
        catalog,
        staticdata_file,
        staticmapdata_file,
    })
}

/// Load a secondary .dat file to use as merge source (new official dat).
#[tauri::command]
pub async fn load_merge_source(path: String, state: State<'_, AppState>) -> Result<MergeSourceStats, String> {
    let appearances = load_appearances(&path).map_err(|e: anyhow::Error| e.to_string())?;

    let stats = MergeSourceStats {
        objects: appearances.object.len(),
        outfits: appearances.outfit.len(),
        effects: appearances.effect.len(),
        missiles: appearances.missile.len(),
    };

    *state.merge_source.write() = Some(appearances);
    Ok(stats)
}

/// Preview what the merge would produce given the custom id thresholds.
/// - current loaded dat = OLD CUSTOM (items >= threshold are custom)
/// - merge_source = NEW OFFICIAL (base to merge into)
#[tauri::command]
pub async fn get_merge_preview(thresholds: MergeThresholds, state: State<'_, AppState>) -> Result<MergePreview, String> {
    let source_lock = state.merge_source.read();
    let source = source_lock.as_ref().ok_or("No merge source loaded")?;

    let appearances_lock = state.appearances.read();
    let current = appearances_lock.as_ref().ok_or("No appearances loaded")?;

    fn preview_category(custom: &[Appearance], official: &[Appearance], threshold: u32) -> (usize, usize, usize) {
        let official_ids: HashSet<u32> = official.iter().filter_map(|a| a.id).collect();

        let mut to_add = 0usize;
        let mut conflicts = 0usize;

        for app in custom {
            if let Some(id) = app.id {
                if id >= threshold {
                    if official_ids.contains(&id) {
                        conflicts += 1;
                    } else {
                        to_add += 1;
                    }
                }
            }
        }

        let official_kept = official.iter().filter(|a| a.id.map_or(false, |id| id < threshold)).count();
        (to_add, conflicts, official_kept)
    }

    let (obj_add, obj_conflict, obj_kept) = preview_category(&current.object, &source.object, thresholds.objects);
    let (out_add, out_conflict, out_kept) = preview_category(&current.outfit, &source.outfit, thresholds.outfits);
    let (eff_add, eff_conflict, eff_kept) = preview_category(&current.effect, &source.effect, thresholds.effects);
    let (mis_add, mis_conflict, mis_kept) = preview_category(&current.missile, &source.missile, thresholds.missiles);

    Ok(MergePreview {
        to_add: MergeSourceStats {
            objects: obj_add,
            outfits: out_add,
            effects: eff_add,
            missiles: mis_add,
        },
        conflicts: MergeSourceStats {
            objects: obj_conflict,
            outfits: out_conflict,
            effects: eff_conflict,
            missiles: mis_conflict,
        },
        official_kept: MergeSourceStats {
            objects: obj_kept,
            outfits: out_kept,
            effects: eff_kept,
            missiles: mis_kept,
        },
    })
}

/// Execute the merge: new_official + custom items (id >= threshold) from old custom.
/// Replaces the primary appearances state with the merged result.
#[tauri::command]
pub async fn execute_dat_merge(thresholds: MergeThresholds, state: State<'_, AppState>) -> Result<MergeSourceStats, String> {
    // Clone source (new official) — this becomes our base
    let source = {
        let lock = state.merge_source.read();
        lock.as_ref().ok_or("No merge source loaded")?.clone()
    };

    // Clone current (old custom) — extract custom items from this
    let current = {
        let lock = state.appearances.read();
        lock.as_ref().ok_or("No appearances loaded")?.clone()
    };

    fn merge_category(mut base: Vec<Appearance>, custom: &[Appearance], threshold: u32) -> (Vec<Appearance>, usize) {
        let base_ids: HashSet<u32> = base.iter().filter_map(|a| a.id).collect();
        let mut added = 0usize;

        for app in custom {
            if let Some(id) = app.id {
                if id >= threshold && !base_ids.contains(&id) {
                    base.push(app.clone());
                    added += 1;
                }
            }
        }

        base.sort_by_key(|a| a.id.unwrap_or(0));
        (base, added)
    }

    let (objects, obj_added) = merge_category(source.object, &current.object, thresholds.objects);
    let (outfits, out_added) = merge_category(source.outfit, &current.outfit, thresholds.outfits);
    let (effects, eff_added) = merge_category(source.effect, &current.effect, thresholds.effects);
    let (missiles, mis_added) = merge_category(source.missile, &current.missile, thresholds.missiles);

    let result_stats = MergeSourceStats {
        objects: obj_added,
        outfits: out_added,
        effects: eff_added,
        missiles: mis_added,
    };

    let merged = Appearances {
        object: objects,
        outfit: outfits,
        effect: effects,
        missile: missiles,
        special_meaning_appearance_ids: source.special_meaning_appearance_ids,
    };

    // Replace primary state with merged result
    {
        let mut lock = state.appearances.write();
        *lock = Some(merged);

        // Rebuild O(1) indexes
        if let Some(appearances) = lock.as_ref() {
            rebuild_indexes(&state, appearances);
        }
    }

    // Invalidate all search caches
    invalidate_search_cache(&state);

    Ok(result_stats)
}

/// Unload the merge source from memory.
#[tauri::command]
pub async fn unload_merge_source(state: State<'_, AppState>) -> Result<(), String> {
    *state.merge_source.write() = None;
    Ok(())
}

/// Save the current (merged) appearances to a specific path chosen by the caller.
#[tauri::command]
pub async fn save_merged_dat(path: String, state: State<'_, AppState>) -> Result<usize, String> {
    use prost::Message;

    let appearances = {
        let lock = state.appearances.read();
        lock.as_ref().ok_or("No appearances loaded")?.clone()
    };

    let size = tauri::async_runtime::spawn_blocking(move || {
        let mut buf = Vec::new();
        appearances.encode(&mut buf).map_err(|e| format!("Encode error: {}", e))?;
        std::fs::write(&path, &buf).map_err(|e| format!("Write error: {}", e))?;
        Ok::<usize, String>(buf.len())
    })
    .await
    .map_err(|e| format!("Task error: {}", e))??;

    Ok(size)
}

// ── Sprite Merge ─────────────────────────────────────────────────────────────

/// Load the new official assets folder and return catalog stats.
/// Stores the path for later use by preview/execute commands.
#[tauri::command]
pub async fn load_merge_source_assets(assets_path: String, state: State<'_, AppState>) -> Result<SpriteCatalogStats, String> {
    let catalog_path = PathBuf::from(&assets_path).join("catalog-content.json");
    let data = std::fs::read_to_string(&catalog_path).map_err(|e| format!("Failed to read catalog-content.json: {}", e))?;
    let entries: Vec<SpriteCatalogEntry> = serde_json::from_str(&data).map_err(|e| format!("Failed to parse catalog: {}", e))?;

    let sprite_entries: Vec<&SpriteCatalogEntry> = entries.iter().filter(|e| e.entry_type == "sprite").collect();

    let max_sprite_id = sprite_entries.iter().filter_map(|e| e.last_sprite_id).max().unwrap_or(0);

    let stats = SpriteCatalogStats {
        total_entries: sprite_entries.len(),
        max_sprite_id,
    };

    *state.merge_source_assets_dir.write() = Some(PathBuf::from(assets_path));
    Ok(stats)
}

/// Preview which LZMA files and catalog entries would be copied.
#[tauri::command]
pub async fn get_sprite_merge_preview(thresholds: MergeThresholds, state: State<'_, AppState>) -> Result<SpriteMergePreview, String> {
    let old_assets_dir = old_assets_dir(&state)?;
    let new_assets_dir = {
        let lock = state.merge_source_assets_dir.read();
        lock.as_ref().ok_or("New official assets not loaded — use load_merge_source_assets first")?.clone()
    };

    let (old_entries, new_entries) = load_both_catalogs(&old_assets_dir, &new_assets_dir)?;

    let new_max = new_entries.iter().filter_map(|e| e.last_sprite_id).max().unwrap_or(0);

    let appearances_lock = state.appearances.read();
    let current = appearances_lock.as_ref().ok_or("No appearances loaded")?;

    let (custom_entries, sprite_count) = collect_custom_sprite_entries(current, &thresholds, &old_entries);

    let mut conflict_entries: Vec<ConflictEntry> = Vec::new();
    let mut to_copy = 0usize;

    for entry in &custom_entries {
        if has_sprite_id_conflict(entry, &new_entries) {
            conflict_entries.push(ConflictEntry {
                file: entry.file.clone(),
                first_sprite_id: entry.first_sprite_id.unwrap_or(0),
                last_sprite_id: entry.last_sprite_id.unwrap_or(0),
            });
        } else {
            to_copy += 1;
        }
    }

    Ok(SpriteMergePreview {
        custom_sprite_count: sprite_count,
        lzma_files_to_copy: to_copy,
        conflict_entries,
        remap_starts_at: new_max + 1,
    })
}

/// Copy custom LZMA files to new official assets folder and merge catalog-content.json.
/// Entries with conflicting sprite ID ranges are automatically remapped to IDs above the
/// official maximum — the LZMA content is unchanged, only the catalog entries and .dat
/// sprite_id references are updated.
#[tauri::command]
pub async fn execute_sprite_merge(thresholds: MergeThresholds, state: State<'_, AppState>) -> Result<SpriteMergeResult, String> {
    let old_assets_dir = old_assets_dir(&state)?;
    let new_assets_dir = {
        let lock = state.merge_source_assets_dir.read();
        lock.as_ref().ok_or("New official assets not loaded")?.clone()
    };

    let (old_entries, new_entries) = load_both_catalogs(&old_assets_dir, &new_assets_dir)?;

    // Next free sprite ID above the official maximum
    let new_max = new_entries.iter().filter_map(|e| e.last_sprite_id).max().unwrap_or(0);
    let mut next_remap_id = new_max + 1;

    let appearances_lock = state.appearances.read();
    let current = appearances_lock.as_ref().ok_or("No appearances loaded")?;
    let (mut custom_entries, _) = collect_custom_sprite_entries(current, &thresholds, &old_entries);
    drop(appearances_lock);

    // Sort by first_sprite_id for deterministic remap ordering
    custom_entries.sort_by_key(|e| e.first_sprite_id.unwrap_or(0));

    // Read new catalog as raw JSON to preserve all non-sprite entry types
    let new_catalog_path = new_assets_dir.join("catalog-content.json");
    let new_catalog_data = std::fs::read_to_string(&new_catalog_path).map_err(|e| format!("Failed to read new catalog: {}", e))?;
    let mut new_catalog: Vec<serde_json::Value> = serde_json::from_str(&new_catalog_data).map_err(|e| format!("Failed to parse new catalog: {}", e))?;

    // old_sprite_id -> new_sprite_id for conflicting entries
    let mut old_to_new: HashMap<u32, u32> = HashMap::new();
    let mut files_copied = 0usize;
    let mut catalog_entries_added = 0usize;
    let mut new_first_overall = u32::MAX;
    let mut new_last_overall = 0u32;

    let mut staged_files: Vec<(PathBuf, PathBuf)> = Vec::new();

    for entry in &custom_entries {
        let src = old_assets_dir.join(&entry.file);
        let dst = new_assets_dir.join(&entry.file);

        let catalog_entry = if has_sprite_id_conflict(entry, &new_entries) {
            // Remap: assign new sequential IDs above new_max, LZMA content unchanged
            let (Some(first), Some(last)) = (entry.first_sprite_id, entry.last_sprite_id) else {
                continue;
            };
            let count = last - first + 1;
            let new_first = next_remap_id;
            let new_last = next_remap_id + count - 1;

            for (i, old_id) in (first..=last).enumerate() {
                old_to_new.insert(old_id, new_first + i as u32);
            }

            new_first_overall = new_first_overall.min(new_first);
            new_last_overall = new_last_overall.max(new_last);
            next_remap_id += count;

            SpriteCatalogEntry {
                entry_type: entry.entry_type.clone(),
                file: entry.file.clone(),
                sprite_type: entry.sprite_type,
                first_sprite_id: Some(new_first),
                last_sprite_id: Some(new_last),
                area: entry.area,
            }
        } else {
            // No conflict — preserve original IDs
            entry.clone()
        };

        // Stage file copy instead of writing to disk
        staged_files.push((src, dst));
        files_copied += 1;

        new_catalog.push(serde_json::to_value(&catalog_entry).map_err(|e| format!("Serialize entry error: {}", e))?);
        catalog_entries_added += 1;
    }

    // Stage catalog and file copies in memory instead of writing to disk
    *state.staged_sprite_files.write() = staged_files;
    *state.staged_catalog.write() = Some((new_catalog_path, new_catalog));

    let sprites_remapped = old_to_new.len();

    // Update sprite_id references in the in-memory .dat if any remap occurred
    if !old_to_new.is_empty() {
        let mut lock = state.appearances.write();
        if let Some(appearances) = lock.as_mut() {
            remap_sprite_ids_in_appearances(appearances, &old_to_new, &thresholds);
        }
        if let Some(appearances) = lock.as_ref() {
            rebuild_indexes(&state, appearances);
        }
        drop(lock);
        invalidate_search_cache(&state);
    }

    Ok(SpriteMergeResult {
        files_copied,
        catalog_entries_added,
        sprites_remapped,
        new_first_sprite_id: if sprites_remapped > 0 {
            new_first_overall
        } else {
            0
        },
        new_last_sprite_id: if sprites_remapped > 0 {
            new_last_overall
        } else {
            0
        },
    })
}

// ── Save All ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAllMergeResult {
    pub dat_saved: bool,
    pub dat_bytes: usize,
    pub sprite_files_copied: usize,
    pub catalog_saved: bool,
    pub staticdata_saved: bool,
    pub staticmapdata_saved: bool,
}

/// Write all staged merge results to disk atomically.
/// This is the only command that writes files — all execute_* commands only stage in memory.
#[tauri::command]
pub async fn save_all_merge(dat_path: String, state: State<'_, AppState>) -> Result<SaveAllMergeResult, String> {
    use crate::features::staticdata::parsers::save_staticdata;
    use prost::Message;

    // 1. Save appearances .dat
    let dat_bytes = {
        let lock = state.appearances.read();
        let appearances = lock.as_ref().ok_or("No appearances loaded")?;
        let mut buf = Vec::new();
        appearances.encode(&mut buf).map_err(|e| format!("Encode .dat error: {}", e))?;
        std::fs::write(&dat_path, &buf).map_err(|e| format!("Write .dat error: {}", e))?;
        buf.len()
    };

    // 2. Copy staged LZMA sprite files
    let sprite_files_copied = {
        let files = state.staged_sprite_files.read();
        let mut copied = 0usize;
        for (src, dst) in files.iter() {
            std::fs::copy(src, dst).map_err(|e| format!("Copy sprite file error: {}", e))?;
            copied += 1;
        }
        copied
    };

    // 3. Save staged catalog
    let catalog_saved = {
        let lock = state.staged_catalog.read();
        if let Some((path, catalog)) = lock.as_ref() {
            let json = serde_json::to_string_pretty(catalog).map_err(|e| format!("Serialize catalog error: {}", e))?;
            std::fs::write(path, json).map_err(|e| format!("Write catalog error: {}", e))?;
            true
        } else {
            false
        }
    };

    // 4. Save staged staticdata
    let staticdata_saved = {
        let lock = state.staged_staticdata.read();
        if let Some((path, data)) = lock.as_ref() {
            save_staticdata(path, data).map_err(|e| format!("Write staticdata error: {}", e))?;
            true
        } else {
            false
        }
    };

    // 5. Save staged staticmapdata
    let staticmapdata_saved = {
        let lock = state.staged_staticmapdata.read();
        if let Some((path, buf)) = lock.as_ref() {
            std::fs::write(path, buf).map_err(|e| format!("Write staticmapdata error: {}", e))?;
            true
        } else {
            false
        }
    };

    // Clear all staged data
    state.staged_sprite_files.write().clear();
    *state.staged_catalog.write() = None;
    *state.staged_staticdata.write() = None;
    *state.staged_staticmapdata.write() = None;

    Ok(SaveAllMergeResult {
        dat_saved: true,
        dat_bytes,
        sprite_files_copied,
        catalog_saved,
        staticdata_saved,
        staticmapdata_saved,
    })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Remap sprite_id references inside custom appearances.
/// Only items with id >= threshold are modified; official items are untouched.
fn remap_sprite_ids_in_appearances(appearances: &mut Appearances, old_to_new: &HashMap<u32, u32>, thresholds: &MergeThresholds) {
    remap_category(&mut appearances.object, thresholds.objects, old_to_new);
    remap_category(&mut appearances.outfit, thresholds.outfits, old_to_new);
    remap_category(&mut appearances.effect, thresholds.effects, old_to_new);
    remap_category(&mut appearances.missile, thresholds.missiles, old_to_new);
}

fn remap_category(items: &mut Vec<Appearance>, threshold: u32, old_to_new: &HashMap<u32, u32>) {
    for app in items.iter_mut() {
        if app.id.map_or(false, |id| id >= threshold) {
            for fg in app.frame_group.iter_mut() {
                if let Some(si) = fg.sprite_info.as_mut() {
                    for sprite_id in si.sprite_id.iter_mut() {
                        if let Some(&new_id) = old_to_new.get(sprite_id) {
                            *sprite_id = new_id;
                        }
                    }
                }
            }
        }
    }
}

/// Discover the appearances .dat in an assets folder.
/// Matches `appearances_latest.dat` or `appearances-*.dat`, picks the largest file.
fn find_appearances_dat(dir: &PathBuf) -> Option<PathBuf> {
    let entries = std::fs::read_dir(dir).ok()?;
    let mut files: Vec<(PathBuf, u64)> = entries
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| p.file_name().and_then(|n| n.to_str()).map(|n| (n.starts_with("appearances-") || n == "appearances_latest.dat") && n.ends_with(".dat")).unwrap_or(false))
        .map(|p| {
            let size = std::fs::metadata(&p).map(|m| m.len()).unwrap_or(0);
            (p, size)
        })
        .collect();
    // largest first (most complete = most recent)
    files.sort_by_key(|(_, size)| std::cmp::Reverse(*size));
    files.into_iter().next().map(|(p, _)| p)
}

fn old_assets_dir(state: &AppState) -> Result<PathBuf, String> {
    let lock = state.tibia_path.lock();
    lock.as_ref().and_then(|p| p.parent().map(|d| d.to_path_buf())).ok_or_else(|| "Appearances not loaded — load a .dat file first".to_string())
}

/// Interval: (first, last) inclusive.
fn ranges_overlap(a_first: u32, a_last: u32, b_first: u32, b_last: u32) -> bool {
    a_first <= b_last && b_first <= a_last
}

/// Parse both catalogs.
/// Returns (old sprite entries, new sprite entries).
fn load_both_catalogs(old_assets_dir: &PathBuf, new_assets_dir: &PathBuf) -> Result<(Vec<SpriteCatalogEntry>, Vec<SpriteCatalogEntry>), String> {
    let old_data = std::fs::read_to_string(old_assets_dir.join("catalog-content.json")).map_err(|e| format!("Failed to read old catalog: {}", e))?;
    let old_all: Vec<SpriteCatalogEntry> = serde_json::from_str(&old_data).map_err(|e| format!("Failed to parse old catalog: {}", e))?;
    let old_entries: Vec<SpriteCatalogEntry> = old_all.into_iter().filter(|e| e.entry_type == "sprite").collect();

    let new_data = std::fs::read_to_string(new_assets_dir.join("catalog-content.json")).map_err(|e| format!("Failed to read new catalog: {}", e))?;
    let new_all: Vec<SpriteCatalogEntry> = serde_json::from_str(&new_data).map_err(|e| format!("Failed to parse new catalog: {}", e))?;
    let new_entries: Vec<SpriteCatalogEntry> = new_all.into_iter().filter(|e| e.entry_type == "sprite").collect();

    Ok((old_entries, new_entries))
}

/// Check if a custom entry's sprite ID range overlaps with any entry in the new catalog.
fn has_sprite_id_conflict(entry: &SpriteCatalogEntry, new_entries: &[SpriteCatalogEntry]) -> bool {
    let (Some(e_first), Some(e_last)) = (entry.first_sprite_id, entry.last_sprite_id) else {
        return false;
    };
    new_entries.iter().any(|n| {
        if let (Some(n_first), Some(n_last)) = (n.first_sprite_id, n.last_sprite_id) {
            ranges_overlap(e_first, e_last, n_first, n_last)
        } else {
            false
        }
    })
}

/// Collect deduplicated catalog entries from the OLD catalog that contain sprite IDs
/// used by custom appearances (item id >= threshold). Returns (entries, total sprite refs).
fn collect_custom_sprite_entries(current: &Appearances, thresholds: &MergeThresholds, old_entries: &[SpriteCatalogEntry]) -> (Vec<SpriteCatalogEntry>, usize) {
    // Build sprite_id -> entry index map
    let mut sprite_to_entry: HashMap<u32, usize> = HashMap::new();
    for (idx, entry) in old_entries.iter().enumerate() {
        if let (Some(first), Some(last)) = (entry.first_sprite_id, entry.last_sprite_id) {
            for id in first..=last {
                sprite_to_entry.insert(id, idx);
            }
        }
    }

    let categories: [(&[Appearance], u32); 4] =
        [(&current.object, thresholds.objects), (&current.outfit, thresholds.outfits), (&current.effect, thresholds.effects), (&current.missile, thresholds.missiles)];

    let mut used_entry_indices: HashSet<usize> = HashSet::new();
    let mut total_sprite_refs = 0usize;

    for (items, threshold) in &categories {
        for app in items.iter() {
            if app.id.map_or(false, |id| id >= *threshold) {
                for fg in &app.frame_group {
                    if let Some(si) = &fg.sprite_info {
                        for &sprite_id in &si.sprite_id {
                            total_sprite_refs += 1;
                            if let Some(&idx) = sprite_to_entry.get(&sprite_id) {
                                used_entry_indices.insert(idx);
                            }
                        }
                    }
                }
            }
        }
    }

    let entries: Vec<SpriteCatalogEntry> = used_entry_indices.into_iter().filter_map(|idx| old_entries.get(idx)).cloned().collect();

    (entries, total_sprite_refs)
}
