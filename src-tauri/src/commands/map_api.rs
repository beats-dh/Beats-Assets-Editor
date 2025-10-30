// Map API - Commands for OTBM map viewing
// Based on Remere's Map Editor logic

use crate::core::parsers::otbm::{OtbmParser, OtbmMap, Tile, Item as OtbmItem, Town, Waypoint, Position};
use crate::AppState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

pub struct MapState {
    pub map: Option<OtbmMap>,
}

impl Default for MapState {
    fn default() -> Self {
        MapState { map: None }
    }
}

// ============================================================================
// DATA TRANSFER OBJECTS
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MapInfo {
    pub version: u32,
    pub width: u16,
    pub height: u16,
    pub description: String,
    pub tile_count: usize,
    pub town_count: usize,
    pub waypoint_count: usize,
    pub min_x: u16,
    pub max_x: u16,
    pub min_y: u16,
    pub max_y: u16,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TileData {
    pub x: u16,
    pub y: u16,
    pub z: u8,
    pub house_id: Option<u32>,
    pub flags: u32,
    pub items: Vec<ItemData>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ItemData {
    pub id: u16,
    pub count: Option<u8>,
    pub action_id: Option<u16>,
    pub unique_id: Option<u16>,
    pub text: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TownData {
    pub id: u32,
    pub name: String,
    pub temple_x: u16,
    pub temple_y: u16,
    pub temple_z: u8,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WaypointData {
    pub name: String,
    pub x: u16,
    pub y: u16,
    pub z: u8,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MapRegionRequest {
    pub min_x: u16,
    pub max_x: u16,
    pub min_y: u16,
    pub max_y: u16,
    pub z: u8,
}

/// Item render flags from appearances.dat
/// Based on RME's ItemType and loadFromProtobuf
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ItemRenderFlags {
    pub id: u16,
    // Basic protobuf flags
    pub is_ground: bool,      // bank flag
    pub is_border: bool,      // clip flag
    pub is_wall: bool,        // bottom flag
    pub is_on_top: bool,      // top flag
    pub is_top_effect: bool,  // topeffect flag

    // RME rendering logic
    // From RME items.cpp loadFromProtobuf:
    // alwaysOnBottom = (clip || top || bottom)
    pub always_on_bottom: bool,
    pub always_on_top_order: u8, // 0=ground, 1=border, 2=wall, 3=top

    // Additional flags for rendering
    pub height: u32,
    pub has_offset: bool,
    pub offset_x: u16,
    pub offset_y: u16,

    // Stacking/cumulative
    pub is_stackable: bool,
    pub is_container: bool,
}

// ============================================================================
// TAURI COMMANDS
// ============================================================================

#[tauri::command]
pub async fn load_map(path: String, state: State<'_, Mutex<MapState>>) -> Result<MapInfo, String> {
    log::info!("Loading OTBM map from: {}", path);

    let mut parser = OtbmParser::from_file(std::path::Path::new(&path))
        .map_err(|e| format!("Failed to open file: {}", e))?;

    let map = parser.parse()
        .map_err(|e| format!("Failed to parse OTBM: {}", e))?;

    let info = build_map_info(&map);

    let mut map_state = state.lock().unwrap();
    map_state.map = Some(map);

    log::info!("Map loaded successfully: {} tiles", info.tile_count);

    Ok(info)
}

#[tauri::command]
pub async fn get_map_info(state: State<'_, Mutex<MapState>>) -> Result<MapInfo, String> {
    let map_state = state.lock().unwrap();
    let map = map_state.map.as_ref().ok_or("No map loaded")?;
    Ok(build_map_info(map))
}

#[tauri::command]
pub async fn get_map_region(
    request: MapRegionRequest,
    state: State<'_, Mutex<MapState>>,
) -> Result<Vec<TileData>, String> {
    let map_state = state.lock().unwrap();
    let map = map_state.map.as_ref().ok_or("No map loaded")?;

    let mut tiles = Vec::new();

    for x in request.min_x..=request.max_x {
        for y in request.min_y..=request.max_y {
            if let Some(tile) = map.tiles.get(&(x, y, request.z)) {
                tiles.push(convert_tile(tile));
            }
        }
    }

    Ok(tiles)
}

#[tauri::command]
pub async fn get_tile_at(
    x: u16,
    y: u16,
    z: u8,
    state: State<'_, Mutex<MapState>>,
) -> Result<Option<TileData>, String> {
    let map_state = state.lock().unwrap();
    let map = map_state.map.as_ref().ok_or("No map loaded")?;

    Ok(map.tiles.get(&(x, y, z)).map(convert_tile))
}

#[tauri::command]
pub async fn get_towns(state: State<'_, Mutex<MapState>>) -> Result<Vec<TownData>, String> {
    let map_state = state.lock().unwrap();
    let map = map_state.map.as_ref().ok_or("No map loaded")?;

    Ok(map
        .towns
        .iter()
        .map(|town| TownData {
            id: town.id,
            name: town.name.clone(),
            temple_x: town.temple_pos.x,
            temple_y: town.temple_pos.y,
            temple_z: town.temple_pos.z,
        })
        .collect())
}

#[tauri::command]
pub async fn get_waypoints(state: State<'_, Mutex<MapState>>) -> Result<Vec<WaypointData>, String> {
    let map_state = state.lock().unwrap();
    let map = map_state.map.as_ref().ok_or("No map loaded")?;

    Ok(map
        .waypoints
        .iter()
        .map(|wp| WaypointData {
            name: wp.name.clone(),
            x: wp.pos.x,
            y: wp.pos.y,
            z: wp.pos.z,
        })
        .collect())
}

/// Get item render flags from appearances.dat
/// This follows RME's loadFromProtobuf logic
#[tauri::command]
pub async fn get_item_render_flags(
    item_id: u16,
    app_state: State<'_, AppState>,
) -> Result<ItemRenderFlags, String> {
    let appearances_lock = app_state.appearances.lock().unwrap();

    let appearances = match &*appearances_lock {
        Some(appearances) => appearances,
        None => return Err("No appearances loaded".to_string()),
    };

    // Find the item in objects
    let item = appearances
        .object
        .iter()
        .find(|obj| obj.id.unwrap_or(0) == item_id as u32)
        .ok_or_else(|| format!("Item with ID {} not found in appearances.dat", item_id))?;

    let flags = item.flags.as_ref();

    // Read flags from protobuf
    let is_ground = flags.and_then(|f| f.bank).is_some();
    let is_border = flags.and_then(|f| f.clip).unwrap_or(false);
    let is_wall = flags.and_then(|f| f.bottom).unwrap_or(false);
    let is_on_top = flags.and_then(|f| f.top).unwrap_or(false);
    let is_top_effect = flags.and_then(|f| f.topeffect).unwrap_or(false);

    // Height
    let height = if let Some(f) = flags {
        if let Some(h) = &f.height {
            h.elevation.unwrap_or(0)
        } else {
            0
        }
    } else {
        0
    };

    // Offset
    let (has_offset, offset_x, offset_y) = if let Some(f) = flags {
        if let Some(shift) = &f.shift {
            (true, shift.x.unwrap_or(0) as u16, shift.y.unwrap_or(0) as u16)
        } else {
            (false, 0, 0)
        }
    } else {
        (false, 0, 0)
    };

    // Stacking
    let is_stackable = flags.and_then(|f| f.cumulative).unwrap_or(false);
    let is_container = flags.and_then(|f| f.container).unwrap_or(false);

    // RME logic from items.cpp loadFromProtobuf():
    // alwaysOnBottom = (clip || top || bottom)
    let always_on_bottom = is_border || is_on_top || is_wall || is_ground;

    // Order within alwaysOnBottom layer
    // From RME: clip=1, bottom=2, top=3
    // Ground items (bank) = 0
    let always_on_top_order: u8 = if is_ground {
        0 // ground
    } else if is_border {
        1 // borders (clip)
    } else if is_wall {
        2 // walls (bottom)
    } else if is_on_top {
        3 // top items (doors, signs, etc)
    } else {
        0 // regular items
    };

    Ok(ItemRenderFlags {
        id: item_id,
        is_ground,
        is_border,
        is_wall,
        is_on_top,
        is_top_effect,
        always_on_bottom,
        always_on_top_order,
        height,
        has_offset,
        offset_x,
        offset_y,
        is_stackable,
        is_container,
    })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn build_map_info(map: &OtbmMap) -> MapInfo {
    let (min_x, max_x, min_y, max_y) = compute_bounds(map);

    MapInfo {
        version: map.version,
        width: map.width,
        height: map.height,
        description: map.description.clone(),
        tile_count: map.tiles.len(),
        town_count: map.towns.len(),
        waypoint_count: map.waypoints.len(),
        min_x,
        max_x,
        min_y,
        max_y,
    }
}

fn compute_bounds(map: &OtbmMap) -> (u16, u16, u16, u16) {
    if map.tiles.is_empty() {
        return (0, map.width.saturating_sub(1), 0, map.height.saturating_sub(1));
    }

    let mut min_x = u16::MAX;
    let mut max_x = u16::MIN;
    let mut min_y = u16::MAX;
    let mut max_y = u16::MIN;

    for ((x, y, _), _) in map.tiles.iter() {
        min_x = min_x.min(*x);
        max_x = max_x.max(*x);
        min_y = min_y.min(*y);
        max_y = max_y.max(*y);
    }

    (min_x, max_x, min_y, max_y)
}

fn convert_tile(tile: &Tile) -> TileData {
    TileData {
        x: tile.pos.x,
        y: tile.pos.y,
        z: tile.pos.z,
        house_id: tile.house_id,
        flags: tile.flags,
        items: tile.items.iter().map(convert_item).collect(),
    }
}

fn convert_item(item: &OtbmItem) -> ItemData {
    use crate::core::parsers::otbm::AttributeType;

    // Extract count
    let count = item.attributes.get(&AttributeType::Count)
        .and_then(|data| data.first().copied());

    // Extract action ID
    let action_id = item.attributes.get(&AttributeType::ActionId)
        .and_then(|data| {
            if data.len() >= 2 {
                Some(u16::from_le_bytes([data[0], data[1]]))
            } else {
                None
            }
        });

    // Extract unique ID
    let unique_id = item.attributes.get(&AttributeType::UniqueId)
        .and_then(|data| {
            if data.len() >= 2 {
                Some(u16::from_le_bytes([data[0], data[1]]))
            } else {
                None
            }
        });

    // Extract text
    let text = item.attributes.get(&AttributeType::Text)
        .map(|data| String::from_utf8_lossy(data).to_string());

    ItemData {
        id: item.id,
        count,
        action_id,
        unique_id,
        text,
    }
}
