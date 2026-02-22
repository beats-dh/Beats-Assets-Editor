use crate::features::npcs::commands::io::list_npcs_recursive;
use crate::features::npcs::parsers::lua_parser::LuaNpcParser;
use crate::features::npcs::types::NpcShopItem;
use crate::state::AppState;
use regex::Regex;
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Clone)]
struct ProtoShopEntry {
    item_id: u32,
    item_name: String,
    sale_price: Option<u32>,
    buy_price: Option<u32>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncNpcDetail {
    pub npc_name: String,
    pub file_path: String,
    pub items_before: usize,
    pub items_after: usize,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncNpcShopsResult {
    pub total_npcs_scanned: usize,
    pub npcs_updated: usize,
    pub npcs_skipped: usize,
    pub items_added: usize,
    pub items_removed: usize,
    pub errors: Vec<String>,
    pub npc_details: Vec<SyncNpcDetail>,
}

/// Parse items.xml and build a map of item ID -> item name.
/// Supports both `<item id="X" ... name="Y">` and `<item fromid="X" toid="Y" ... name="Z">`.
fn parse_items_xml(path: &str) -> Result<HashMap<u32, String>, String> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("Failed to read items.xml: {}", e))?;

    let mut map = HashMap::new();

    // Pattern for single id: <item id="123" ... name="something"
    let re_single = Regex::new(r#"<item\s+id="(\d+)"[^>]*\bname="([^"]+)""#)
        .map_err(|e| format!("Regex error: {}", e))?;

    // Pattern for range: <item fromid="123" toid="456" ... name="something"
    let re_range = Regex::new(r#"<item\s+fromid="(\d+)"\s+toid="(\d+)"[^>]*\bname="([^"]+)""#)
        .map_err(|e| format!("Regex error: {}", e))?;

    for cap in re_single.captures_iter(&content) {
        if let Ok(id) = cap[1].parse::<u32>() {
            let name = cap[2].to_string();
            if !name.is_empty() {
                map.insert(id, name);
            }
        }
    }

    for cap in re_range.captures_iter(&content) {
        if let (Ok(from), Ok(to)) = (cap[1].parse::<u32>(), cap[2].parse::<u32>()) {
            let name = cap[3].to_string();
            if !name.is_empty() {
                for id in from..=to {
                    map.entry(id).or_insert_with(|| name.clone());
                }
            }
        }
    }

    Ok(map)
}

/// Generate the Lua text for a `npcConfig.shop = { ... }` block
fn generate_shop_table(items: &[NpcShopItem]) -> String {
    if items.is_empty() {
        return "npcConfig.shop = {}\n".to_string();
    }

    let mut lua = String::from("npcConfig.shop = {\n");
    for item in items {
        lua.push_str("\t{");
        let mut props = Vec::new();
        if let Some(ref name) = item.item_name {
            props.push(format!(" itemName = \"{}\"", name));
        }
        if let Some(cid) = item.client_id {
            props.push(format!(" clientId = {}", cid));
        }
        if let Some(iid) = item.item_id {
            props.push(format!(" itemId = {}", iid));
        }
        if let Some(buy) = item.buy {
            if buy > 0 {
                props.push(format!(" buy = {}", buy));
            }
        }
        if let Some(sell) = item.sell {
            if sell > 0 {
                props.push(format!(" sell = {}", sell));
            }
        }
        if let Some(count) = item.count {
            props.push(format!(" count = {}", count));
        }
        lua.push_str(&props.join(","));
        lua.push_str(" },\n");
    }
    lua.push('}');
    lua
}

/// Find the byte range of the existing `npcConfig.shop = { ... }` block in the file content.
/// Returns (start, end) byte offsets covering the entire block including trailing newline.
fn find_shop_block_range(content: &str) -> Option<(usize, usize)> {
    let re = Regex::new(r"npcConfig\.shop\s*=\s*\{").ok()?;
    let m = re.find(content)?;
    let block_start = m.start();

    // Find the opening brace
    let brace_pos = content[block_start..].find('{')? + block_start;
    let bytes = content.as_bytes();
    let len = bytes.len();
    let mut depth = 1;
    let mut cursor = brace_pos + 1;

    while cursor < len && depth > 0 {
        match bytes[cursor] {
            b'{' => { depth += 1; }
            b'}' => { depth -= 1; }
            b'"' => {
                cursor += 1;
                while cursor < len {
                    if bytes[cursor] == b'\\' { cursor += 1; }
                    else if bytes[cursor] == b'"' { break; }
                    cursor += 1;
                }
            }
            _ => {}
        }
        cursor += 1;
    }

    if depth != 0 {
        return None;
    }

    // cursor is now right after the closing '}'
    let mut block_end = cursor;

    // Consume trailing whitespace/newline on the same line
    while block_end < len && (bytes[block_end] == b' ' || bytes[block_end] == b'\t') {
        block_end += 1;
    }
    if block_end < len && bytes[block_end] == b'\r' {
        block_end += 1;
    }
    if block_end < len && bytes[block_end] == b'\n' {
        block_end += 1;
    }

    Some((block_start, block_end))
}

/// Find the insertion point for a new shop block when none exists.
/// Inserts before `npcType:register(npcConfig)` or at the end of file.
fn find_shop_insert_position(content: &str) -> usize {
    if let Some(pos) = content.find("npcType:register(") {
        // Go back to the start of the line
        let line_start = content[..pos].rfind('\n').map_or(0, |p| p + 1);
        line_start
    } else {
        content.len()
    }
}

/// Apply the shop update to the file content surgically, preserving everything else.
fn apply_shop_to_content(content: &str, items: &[NpcShopItem]) -> String {
    let new_shop_text = generate_shop_table(items);

    if let Some((start, end)) = find_shop_block_range(content) {
        // Replace existing shop block
        let mut result = String::with_capacity(content.len());
        result.push_str(&content[..start]);
        result.push_str(&new_shop_text);
        result.push('\n');
        result.push_str(&content[end..]);
        result
    } else if !items.is_empty() {
        // No existing shop block, insert one
        let insert_pos = find_shop_insert_position(content);
        let mut result = String::with_capacity(content.len() + new_shop_text.len() + 2);
        result.push_str(&content[..insert_pos]);
        result.push_str(&new_shop_text);
        result.push_str("\n\n");
        result.push_str(&content[insert_pos..]);
        result
    } else {
        // No shop and no items to add, nothing to do
        content.to_string()
    }
}

#[command]
pub async fn sync_npc_shops_from_proto(
    npcs_path: String,
    ignore_item_ids: Vec<u32>,
    ignore_item_names: Vec<String>,
    keep_custom_items: bool,
    items_xml_path: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<SyncNpcShopsResult, String> {
    let base_path = PathBuf::from(&npcs_path);
    if !base_path.exists() {
        return Err("NPC directory does not exist".to_string());
    }

    // Parse items.xml for name fallback (if provided)
    let items_xml_names: HashMap<u32, String> = match &items_xml_path {
        Some(path) if !path.trim().is_empty() => {
            parse_items_xml(path)?
        }
        _ => HashMap::new(),
    };

    // Build ignore sets
    let ignore_ids: HashSet<u32> = ignore_item_ids.into_iter().collect();
    let ignore_names_lower: HashSet<String> = ignore_item_names
        .iter()
        .map(|n| n.trim().to_lowercase())
        .filter(|n| !n.is_empty())
        .collect();

    // Step 1: Read proto data and build NPC -> items map
    let npc_shop_map = {
        let appearances_lock = state.appearances.read();
        let appearances = match &*appearances_lock {
            Some(a) => a,
            None => return Err("No appearances loaded. Please load an appearances file first.".to_string()),
        };

        let mut map: HashMap<String, Vec<ProtoShopEntry>> = HashMap::new();

        for appearance in &appearances.object {
            let item_id = match appearance.id {
                Some(id) if id > 0 => id,
                _ => continue,
            };

            // Get name: try proto first, then items.xml fallback
            let proto_name = appearance
                .name
                .as_ref()
                .map(|b| String::from_utf8_lossy(b).to_string())
                .unwrap_or_default();

            let item_name = if proto_name.is_empty() {
                items_xml_names.get(&item_id).cloned().unwrap_or_default()
            } else {
                proto_name
            };

            // Skip items in ignore list
            if ignore_ids.contains(&item_id) {
                continue;
            }
            if !item_name.is_empty() && ignore_names_lower.contains(&item_name.to_lowercase()) {
                continue;
            }

            if let Some(flags) = &appearance.flags {
                for npc_sale in &flags.npcsaledata {
                    if let Some(npc_name) = &npc_sale.name {
                        if npc_name.trim().is_empty() {
                            continue;
                        }

                        map.entry(npc_name.trim().to_lowercase())
                            .or_default()
                            .push(ProtoShopEntry {
                                item_id,
                                item_name: item_name.clone(),
                                sale_price: npc_sale.sale_price,
                                buy_price: npc_sale.buy_price,
                            });
                    }
                }
            }
        }

        map
    }; // appearances_lock dropped here

    // Step 2: List and process all NPC files
    let npc_entries = list_npcs_recursive(&base_path, &base_path)
        .map_err(|e| format!("Failed to list NPC files: {}", e))?;

    let mut result = SyncNpcShopsResult {
        total_npcs_scanned: npc_entries.len(),
        npcs_updated: 0,
        npcs_skipped: 0,
        items_added: 0,
        items_removed: 0,
        errors: Vec::new(),
        npc_details: Vec::new(),
    };

    for entry in &npc_entries {
        let file_content = match std::fs::read_to_string(&entry.file_path) {
            Ok(c) => c,
            Err(e) => {
                result.errors.push(format!("{}: Failed to read - {}", entry.name, e));
                continue;
            }
        };

        // Parse NPC to get name and existing shop data
        let parser = LuaNpcParser::new(file_content.clone());
        let npc = match parser.parse() {
            Ok(n) => n,
            Err(e) => {
                result.errors.push(format!("{}: Failed to parse - {}", entry.name, e));
                continue;
            }
        };

        let npc_name_lower = npc.name.trim().to_lowercase();
        let proto_items = npc_shop_map.get(&npc_name_lower);

        let items_before = npc.shop.as_ref().map_or(0, |s| s.len());

        // Determine if this NPC has proto data
        let has_proto_data = proto_items.map_or(false, |items| !items.is_empty());

        if !has_proto_data {
            // No proto data for this NPC -> never touch it
            result.npcs_skipped += 1;
            continue;
        }

        let proto_entries = proto_items.unwrap();

        // Build set of proto item IDs for this NPC
        let proto_item_ids: HashSet<u32> = proto_entries.iter().map(|e| e.item_id).collect();

        // Build new shop list
        let mut new_shop: Vec<NpcShopItem> = Vec::new();

        // If keeping custom items, preserve existing items not in proto
        if keep_custom_items {
            if let Some(existing_shop) = &npc.shop {
                for item in existing_shop {
                    let cid = item.client_id.unwrap_or(0);
                    if cid > 0 && proto_item_ids.contains(&cid) {
                        // This item is in proto, it will be replaced by proto version
                        continue;
                    }
                    // Keep custom item
                    new_shop.push(item.clone());
                }
            }
        }

        // Add all proto items
        for proto_entry in proto_entries {
            new_shop.push(NpcShopItem {
                item_name: if proto_entry.item_name.is_empty() {
                    None
                } else {
                    Some(proto_entry.item_name.clone())
                },
                client_id: Some(proto_entry.item_id),
                item_id: None,
                buy: proto_entry.sale_price,
                sell: proto_entry.buy_price,
                count: None,
            });
        }

        let items_after = new_shop.len();

        // Check if anything changed
        let changed = items_before != items_after || shop_content_changed(&npc.shop, &new_shop);

        if !changed {
            result.npcs_skipped += 1;
            continue;
        }

        if items_after > items_before {
            result.items_added += items_after - items_before;
        } else if items_before > items_after {
            result.items_removed += items_before - items_after;
        }

        // Surgically replace only the shop block in the original file
        let new_content = apply_shop_to_content(&file_content, &new_shop);

        result.npcs_updated += 1;
        result.npc_details.push(SyncNpcDetail {
            npc_name: npc.name.clone(),
            file_path: entry.file_path.clone(),
            items_before,
            items_after,
            status: "updated".to_string(),
        });

        if let Err(e) = std::fs::write(&entry.file_path, new_content) {
            result.errors.push(format!("{}: Failed to save - {}", entry.name, e));
        }
    }

    Ok(result)
}

fn shop_content_changed(old_shop: &Option<Vec<NpcShopItem>>, new_shop: &[NpcShopItem]) -> bool {
    let old = match old_shop {
        Some(s) => s,
        None => return !new_shop.is_empty(),
    };

    if old.len() != new_shop.len() {
        return true;
    }

    for (a, b) in old.iter().zip(new_shop.iter()) {
        if a.client_id != b.client_id || a.buy != b.buy || a.sell != b.sell || a.item_name != b.item_name {
            return true;
        }
    }

    false
}
