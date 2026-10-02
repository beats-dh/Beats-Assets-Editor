use crate::features::minimap::parsers::load_markers;
use crate::features::minimap::parsers::otmm;
use base64::Engine;
use std::path::PathBuf;

// ── Markers (minimap.proto) ────────────────────────────────────────────────

/// A minimap marker flattened for the frontend.
#[derive(serde::Serialize)]
pub struct MinimapMarkerDto {
    pub x: u32,
    pub y: u32,
    pub z: u32,
    /// Marker icon type (Qt's minimap marker enum).
    pub r#type: u32,
    pub description: String,
}

/// Resolve the client's marker file, if present
/// (`<client>/minimap/minimapmarkers.bin`). It only exists once the player has
/// created markers in-game, so absence is normal.
#[tauri::command]
pub fn minimap_find_markers_file(tibia_path: String) -> Option<String> {
    let p = PathBuf::from(tibia_path).join("minimap").join("minimapmarkers.bin");
    if p.is_file() {
        Some(p.to_string_lossy().to_string())
    } else {
        None
    }
}

/// Load and flatten all markers from a marker file.
#[tauri::command]
pub fn minimap_load_markers(path: String) -> Result<Vec<MinimapMarkerDto>, String> {
    let content = load_markers(&path).map_err(|e| format!("Failed to load minimap markers: {}", e))?;
    Ok(content
        .markers
        .into_iter()
        .map(|m| {
            let pos = m.position.unwrap_or_default();
            MinimapMarkerDto {
                x: pos.x.unwrap_or(0),
                y: pos.y.unwrap_or(0),
                z: pos.z.unwrap_or(0),
                r#type: m.r#type.unwrap_or(0),
                description: m.description.unwrap_or_default(),
            }
        })
        .collect())
}

/// Convenience: find the client marker file and load it, returning an empty list
/// when no marker file exists yet.
#[tauri::command]
pub fn minimap_load_markers_auto(tibia_path: String) -> Result<Vec<MinimapMarkerDto>, String> {
    match minimap_find_markers_file(tibia_path) {
        Some(p) => minimap_load_markers(p),
        None => Ok(Vec::new()),
    }
}

// ── Tiles (minimap-<scale>-<x>-<y>-<floor>-<hash>.bmp.lzma) ─────────────────

/// One on-disk minimap tile, located by its sector coordinates and floor.
#[derive(serde::Serialize)]
pub struct MinimapTile {
    pub x: u32,
    pub y: u32,
    pub floor: u32,
    /// Absolute path to the `.bmp.lzma` tile.
    pub path: String,
}

/// Parse `minimap-<scale>-<x>-<y>-<floor>-<hash>.bmp.lzma` → (x, y, floor).
fn parse_tile_name(name: &str) -> Option<(u32, u32, u32)> {
    let stem = name.strip_prefix("minimap-")?.strip_suffix(".bmp.lzma")?;
    let parts: Vec<&str> = stem.split('-').collect();
    // [scale, x, y, floor, hash]
    if parts.len() < 5 {
        return None;
    }
    let x = parts[1].parse::<u32>().ok()?;
    let y = parts[2].parse::<u32>().ok()?;
    let floor = parts[3].parse::<u32>().ok()?;
    Some((x, y, floor))
}

/// List every minimap tile in the client's `assets/` folder, sorted by
/// (floor, y, x). The frontend groups by floor and stitches them into a map.
#[tauri::command]
pub fn minimap_list_tiles(tibia_path: String) -> Result<Vec<MinimapTile>, String> {
    let assets = PathBuf::from(tibia_path).join("assets");
    let entries = std::fs::read_dir(&assets).map_err(|e| format!("Failed to read assets directory: {}", e))?;

    let mut tiles = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        if !name.starts_with("minimap-") || !name.ends_with(".bmp.lzma") {
            continue;
        }
        if let Some((x, y, floor)) = parse_tile_name(name) {
            tiles.push(MinimapTile {
                x,
                y,
                floor,
                path: path.to_string_lossy().to_string(),
            });
        }
    }

    tiles.sort_by_key(|t| (t.floor, t.y, t.x));
    Ok(tiles)
}

/// Decompress one tile (`.bmp.lzma`) and return the raw BMP bytes (the frontend
/// renders BMP directly via a blob URL).
#[tauri::command]
pub fn minimap_get_tile(path: String) -> Result<Vec<u8>, String> {
    let data = std::fs::read(&path).map_err(|e| format!("Failed to read tile: {}", e))?;
    crate::core::lzma::decompress(&data).map_err(|e| format!("Failed to decompress tile: {}", e))
}

// ── OTClient minimap (.otmm) ───────────────────────────────────────────────

/// Per-floor summary of an `.otmm`.
#[derive(serde::Serialize)]
pub struct OtmmFloorInfo {
    pub floor: u32,
    pub blocks: usize,
    pub min_x: u32,
    pub min_y: u32,
    pub width: u32,
    pub height: u32,
}

/// A rendered `.otmm` floor (PNG as base64 + placement metadata).
#[derive(serde::Serialize)]
pub struct OtmmRender {
    pub image_base64: String,
    pub width: u32,
    pub height: u32,
    pub min_x: u32,
    pub min_y: u32,
    pub scale: f32,
}

/// List the floors present in an `.otmm` with their block counts and bounds.
#[tauri::command]
pub fn minimap_otmm_info(path: String) -> Result<Vec<OtmmFloorInfo>, String> {
    let data = std::fs::read(&path).map_err(|e| format!("Failed to read .otmm: {}", e))?;
    let index = otmm::parse_index(&data).map_err(|e| format!("Failed to parse .otmm: {}", e))?;

    let mut floors: std::collections::BTreeMap<u8, usize> = std::collections::BTreeMap::new();
    for b in &index {
        *floors.entry(b.z).or_insert(0) += 1;
    }
    let mut out = Vec::new();
    for (floor, blocks) in floors {
        let (min_x, min_y, w, h) = otmm::floor_bounds(&index, floor).unwrap_or((0, 0, 0, 0));
        out.push(OtmmFloorInfo {
            floor: floor as u32,
            blocks,
            min_x,
            min_y,
            width: w,
            height: h,
        });
    }
    Ok(out)
}

/// Render one floor of an `.otmm` to a PNG (downscaled so neither side exceeds
/// `max_dim`). CPU heavy (zlib + raster) → runs on the blocking pool.
#[tauri::command]
pub async fn minimap_render_otmm(path: String, floor: u32, max_dim: u32) -> Result<OtmmRender, String> {
    let max_dim = max_dim.clamp(256, 16384);
    tauri::async_runtime::spawn_blocking(move || -> Result<OtmmRender, String> {
        let data = std::fs::read(&path).map_err(|e| format!("Failed to read .otmm: {}", e))?;
        let index = otmm::parse_index(&data).map_err(|e| format!("Failed to parse .otmm: {}", e))?;
        let floor_u8 = u8::try_from(floor).map_err(|_| "Invalid floor".to_string())?;
        let r = otmm::render_floor(&data, &index, floor_u8, max_dim).map_err(|e| format!("Failed to render floor: {}", e))?;
        Ok(OtmmRender {
            image_base64: base64::engine::general_purpose::STANDARD.encode(&r.png),
            width: r.width,
            height: r.height,
            min_x: r.min_x,
            min_y: r.min_y,
            scale: r.scale,
        })
    })
    .await
    .map_err(|e| format!("Render task failed: {}", e))?
}
