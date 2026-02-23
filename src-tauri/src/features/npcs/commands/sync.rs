use crate::features::npcs::commands::io::list_npcs_recursive;
use crate::features::npcs::parsers::lua_parser::LuaNpcParser;
use crate::features::npcs::types::NpcShopItem;
use crate::state::AppState;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::path::{Component, Path, PathBuf};
use tauri::command;

#[derive(Debug, Clone)]
struct ProtoShopEntry {
    item_id: u32,
    item_name: String,
    sale_price: Option<u32>,
    buy_price: Option<u32>,
    market_category: Option<i32>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalProtoShopEntryInput {
    item_id: Option<u32>,
    item_name: String,
    sale_price: Option<u32>,
    buy_price: Option<u32>,
    market_category: Option<i32>,
}

fn normalize_item_lookup_key(value: &str) -> String {
    let mut out = String::new();
    let mut last_space = false;

    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch.to_ascii_lowercase());
            last_space = false;
        } else if !last_space {
            out.push(' ');
            last_space = true;
        }
    }

    out.trim().to_string()
}

fn add_item_name_lookup(lookup: &mut HashMap<String, u32>, item_id: u32, raw_name: &str) {
    if item_id == 0 {
        return;
    }

    let key = normalize_item_lookup_key(raw_name);
    if key.is_empty() {
        return;
    }

    lookup.entry(key).or_insert(item_id);
}

fn resolve_item_id_from_lookup(lookup: &HashMap<String, u32>, item_name: &str) -> Option<u32> {
    let normalized = normalize_item_lookup_key(item_name);
    if normalized.is_empty() {
        return None;
    }

    if let Some(item_id) = lookup.get(&normalized) {
        return Some(*item_id);
    }

    let trimmed_parenthesis = Regex::new(r"\s*\([^)]*\)\s*$")
        .ok()
        .map(|re| re.replace(&normalized, "").to_string())
        .unwrap_or_else(|| normalized.clone());
    if !trimmed_parenthesis.is_empty() {
        if let Some(item_id) = lookup.get(&trimmed_parenthesis) {
            return Some(*item_id);
        }
    }

    None
}

fn external_to_proto_entry(
    raw: &ExternalProtoShopEntryInput,
    item_name_to_id: &HashMap<String, u32>,
) -> Option<ProtoShopEntry> {
    let name = raw.item_name.trim();
    if name.is_empty() {
        return None;
    }

    let item_id = match raw.item_id {
        Some(id) if id > 0 => id,
        _ => resolve_item_id_from_lookup(item_name_to_id, name)?,
    };

    Some(ProtoShopEntry {
        item_id,
        item_name: name.to_string(),
        sale_price: raw.sale_price,
        buy_price: raw.buy_price,
        market_category: raw.market_category,
    })
}

fn normalize_external_shop_map(
    raw_map: Option<HashMap<String, Vec<ExternalProtoShopEntryInput>>>,
    item_name_to_id: &HashMap<String, u32>,
) -> HashMap<String, Vec<ProtoShopEntry>> {
    let mut result: HashMap<String, Vec<ProtoShopEntry>> = HashMap::new();
    let Some(raw_map) = raw_map else {
        return result;
    };

    for (npc_name, items) in raw_map {
        let key = npc_name.trim().to_lowercase();
        if key.is_empty() {
            continue;
        }

        let mut merged_by_id: HashMap<u32, ProtoShopEntry> = HashMap::new();
        for item in items
            .iter()
            .filter_map(|raw| external_to_proto_entry(raw, item_name_to_id))
        {
            let entry = merged_by_id.entry(item.item_id).or_insert(ProtoShopEntry {
                item_id: item.item_id,
                item_name: item.item_name.clone(),
                sale_price: None,
                buy_price: None,
                market_category: item.market_category,
            });

            if entry.item_name.is_empty() && !item.item_name.is_empty() {
                entry.item_name = item.item_name.clone();
            }
            if item.sale_price.is_some() {
                entry.sale_price = item.sale_price;
            }
            if item.buy_price.is_some() {
                entry.buy_price = item.buy_price;
            }
            if entry.market_category.is_none() {
                entry.market_category = item.market_category;
            }
        }

        if merged_by_id.is_empty() {
            continue;
        }

        let mut normalized_items: Vec<ProtoShopEntry> = merged_by_id.into_values().collect();
        normalized_items.sort_by(|a, b| a.item_id.cmp(&b.item_id));
        result.insert(key, normalized_items);
    }

    result
}

fn merge_proto_entries_by_item_id(entries: Vec<ProtoShopEntry>) -> Vec<ProtoShopEntry> {
    let mut merged_by_id: HashMap<u32, ProtoShopEntry> = HashMap::new();
    for item in entries {
        if item.item_id == 0 {
            continue;
        }

        let entry = merged_by_id.entry(item.item_id).or_insert(ProtoShopEntry {
            item_id: item.item_id,
            item_name: item.item_name.clone(),
            sale_price: None,
            buy_price: None,
            market_category: item.market_category,
        });

        if entry.item_name.is_empty() && !item.item_name.is_empty() {
            entry.item_name = item.item_name.clone();
        }
        if item.sale_price.is_some() {
            entry.sale_price = item.sale_price;
        }
        if item.buy_price.is_some() {
            entry.buy_price = item.buy_price;
        }
        if entry.market_category.is_none() {
            entry.market_category = item.market_category;
        }
    }

    let mut merged: Vec<ProtoShopEntry> = merged_by_id.into_values().collect();
    merged.sort_by(|a, b| a.item_id.cmp(&b.item_id));
    merged
}

fn collect_existing_shop_client_ids(existing_shop: Option<&Vec<NpcShopItem>>) -> HashSet<u32> {
    let mut ids = HashSet::new();
    let Some(existing_shop) = existing_shop else {
        return ids;
    };

    for item in existing_shop {
        if let Some(cid) = item.client_id {
            if cid > 0 {
                ids.insert(cid);
            }
        }
    }

    ids
}

fn remap_proto_entries_with_existing_shop_names(
    proto_entries: &mut Vec<ProtoShopEntry>,
    existing_shop: Option<&Vec<NpcShopItem>>,
) {
    let Some(existing_shop) = existing_shop else {
        return;
    };

    let mut name_to_id: HashMap<String, u32> = HashMap::new();
    let mut ambiguous_keys: HashSet<String> = HashSet::new();

    for item in existing_shop {
        let (Some(name), Some(cid)) = (&item.item_name, item.client_id) else {
            continue;
        };
        if cid == 0 {
            continue;
        }

        let key = normalize_item_lookup_key(name);
        if key.is_empty() {
            continue;
        }

        if let Some(existing) = name_to_id.get(&key) {
            if *existing != cid {
                ambiguous_keys.insert(key.clone());
            }
        } else {
            name_to_id.insert(key.clone(), cid);
        }
    }

    for entry in proto_entries.iter_mut() {
        let key = normalize_item_lookup_key(&entry.item_name);
        if key.is_empty() || ambiguous_keys.contains(&key) {
            continue;
        }
        if let Some(existing_id) = name_to_id.get(&key) {
            entry.item_id = *existing_id;
        }
    }
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

const AUTO_SYNC_BLOCK_START: &str = "-- AUTO-SYNC-PROTO-SHOP:START";
const AUTO_SYNC_BLOCK_END: &str = "-- AUTO-SYNC-PROTO-SHOP:END";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum ShopSyncSource {
    Proto,
    Fandom,
}

impl ShopSyncSource {
    fn parse(raw: Option<&str>) -> Self {
        match raw.map(|v| v.trim().to_ascii_lowercase()) {
            Some(value) if value == "fandom" => ShopSyncSource::Fandom,
            _ => ShopSyncSource::Proto,
        }
    }
}

fn proto_entry_to_shop_item(proto_entry: &ProtoShopEntry) -> NpcShopItem {
    NpcShopItem {
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
    }
}

/// Parse items.xml and build a map of item/client ID -> item name.
/// Supports id/clientid and range variants (fromid/toid, fromclientid/toclientid).
fn parse_items_xml(path: &Path) -> Result<HashMap<u32, String>, String> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("Failed to read items.xml ({}): {}", path.display(), e))?;

    let mut map = HashMap::new();

    let re_item_tag = Regex::new(r#"(?is)<item\b([^>]*)>"#)
        .map_err(|e| format!("Regex error (item tag): {}", e))?;
    let re_attr = Regex::new(r#"([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')"#)
        .map_err(|e| format!("Regex error (attributes): {}", e))?;

    for cap in re_item_tag.captures_iter(&content) {
        let attrs_raw = cap.get(1).map_or("", |m| m.as_str());
        let mut attrs: HashMap<String, String> = HashMap::new();

        for attr_cap in re_attr.captures_iter(attrs_raw) {
            let key = attr_cap[1].to_ascii_lowercase();
            let value = attr_cap
                .get(2)
                .or_else(|| attr_cap.get(3))
                .map_or("", |m| m.as_str())
                .trim()
                .to_string();
            attrs.insert(key, value);
        }

        let name = match attrs.get("name").map(|s| s.trim()).filter(|s| !s.is_empty()) {
            Some(n) => n.to_string(),
            None => continue,
        };

        if let Some(id) = attrs.get("id").and_then(|v| v.parse::<u32>().ok()) {
            map.entry(id).or_insert_with(|| name.clone());
        }
        if let Some(client_id) = attrs.get("clientid").and_then(|v| v.parse::<u32>().ok()) {
            map.entry(client_id).or_insert_with(|| name.clone());
        }

        if let (Some(from), Some(to)) = (
            attrs.get("fromid").and_then(|v| v.parse::<u32>().ok()),
            attrs.get("toid").and_then(|v| v.parse::<u32>().ok()),
        ) {
            let (start, end) = if from <= to { (from, to) } else { (to, from) };
            for id in start..=end {
                map.entry(id).or_insert_with(|| name.clone());
            }
        }

        if let (Some(from), Some(to)) = (
            attrs
                .get("fromclientid")
                .and_then(|v| v.parse::<u32>().ok()),
            attrs.get("toclientid").and_then(|v| v.parse::<u32>().ok()),
        ) {
            let (start, end) = if from <= to { (from, to) } else { (to, from) };
            for id in start..=end {
                map.entry(id).or_insert_with(|| name.clone());
            }
        }
    }

    Ok(map)
}

fn path_basename_eq(path: &Path, expected: &str) -> bool {
    path.file_name()
        .and_then(|s| s.to_str())
        .map(|s| s.eq_ignore_ascii_case(expected))
        .unwrap_or(false)
}

fn infer_data_dir_from_npcs_path(npcs_path: &Path) -> Option<PathBuf> {
    if path_basename_eq(npcs_path, "data") {
        return Some(npcs_path.to_path_buf());
    }

    if path_basename_eq(npcs_path, "npc") {
        if let Some(parent) = npcs_path.parent() {
            if path_basename_eq(parent, "data") {
                return Some(parent.to_path_buf());
            }
        }
    }

    npcs_path
        .ancestors()
        .find(|ancestor| path_basename_eq(ancestor, "data"))
        .map(|p| p.to_path_buf())
}

fn infer_server_root_from_npcs_path(npcs_path: &Path) -> Option<PathBuf> {
    infer_data_dir_from_npcs_path(npcs_path).and_then(|data_dir| data_dir.parent().map(Path::to_path_buf))
}

fn push_candidate(candidates: &mut Vec<PathBuf>, seen: &mut HashSet<String>, candidate: PathBuf) {
    let key = candidate.to_string_lossy().to_lowercase();
    if seen.insert(key) {
        candidates.push(candidate);
    }
}

fn strip_leading_data_component(path: &Path) -> Option<PathBuf> {
    let mut components = path.components();
    let first = components.next()?;
    match first {
        Component::Normal(part) if part.to_string_lossy().eq_ignore_ascii_case("data") => {
            let rest = components.as_path().to_path_buf();
            if rest.as_os_str().is_empty() {
                None
            } else {
                Some(rest)
            }
        }
        _ => None,
    }
}

/// Resolve items.xml path from explicit input (absolute/relative) or infer from npcs path.
fn resolve_items_xml_path(
    npcs_path: &Path,
    items_xml_path: Option<&str>,
) -> Result<Option<PathBuf>, String> {
    let data_dir = infer_data_dir_from_npcs_path(npcs_path);
    let server_root = infer_server_root_from_npcs_path(npcs_path);

    if let Some(raw_path) = items_xml_path.map(str::trim).filter(|p| !p.is_empty()) {
        let user_path = PathBuf::from(raw_path);
        let mut candidates = Vec::new();
        let mut seen = HashSet::new();

        if user_path.is_absolute() {
            push_candidate(&mut candidates, &mut seen, user_path);
        } else {
            // Try relative path from npc dir up to all ancestors.
            for base in npcs_path.ancestors() {
                push_candidate(&mut candidates, &mut seen, base.join(&user_path));
            }

            // Also try path without leading "data/" for repo layouts like ".../npc" + ".../items/items.xml".
            if let Some(stripped) = strip_leading_data_component(&user_path) {
                for base in npcs_path.ancestors() {
                    push_candidate(&mut candidates, &mut seen, base.join(&stripped));
                }
            }

            // Preserve explicit inferred bases too (may help in some edge layouts).
            if let Some(ref data_dir) = data_dir {
                push_candidate(&mut candidates, &mut seen, data_dir.join(&user_path));
            }
            if let Some(ref server_root) = server_root {
                push_candidate(&mut candidates, &mut seen, server_root.join(&user_path));
            }
        }

        if let Some(found) = candidates.iter().find(|p| p.is_file()) {
            return Ok(Some(found.clone()));
        }

        let attempted = candidates
            .iter()
            .map(|p| p.display().to_string())
            .collect::<Vec<_>>()
            .join(", ");
        return Err(format!(
            "items.xml not found. Checked paths: {}",
            attempted
        ));
    }

    let mut candidates = Vec::new();
    let mut seen = HashSet::new();

    if let Some(ref data_dir) = data_dir {
        push_candidate(
            &mut candidates,
            &mut seen,
            data_dir.join("items").join("items.xml"),
        );
    }
    if let Some(ref server_root) = server_root {
        push_candidate(
            &mut candidates,
            &mut seen,
            server_root.join("data").join("items").join("items.xml"),
        );
    }

    // Broad fallback across all ancestors (supports server roots like ".../canary/data/...").
    for base in npcs_path.ancestors() {
        push_candidate(
            &mut candidates,
            &mut seen,
            base.join("data").join("items").join("items.xml"),
        );
        push_candidate(
            &mut candidates,
            &mut seen,
            base.join("items").join("items.xml"),
        );
    }

    Ok(candidates.into_iter().find(|p| p.is_file()))
}

fn normalize_proto_name(raw: &[u8]) -> String {
    String::from_utf8_lossy(raw)
        .replace('\0', "")
        .trim()
        .to_string()
}

fn has_dynamic_shop_builder(content: &str) -> bool {
    let has_table_insert = Regex::new(r"table\.insert\s*\(\s*npcConfig\.shop\b")
        .map(|re| re.is_match(content))
        .unwrap_or(false);
    let has_index_assignment = Regex::new(r"npcConfig\.shop\s*\[[^\]]+\]\s*=")
        .map(|re| re.is_match(content))
        .unwrap_or(false);

    has_table_insert || has_index_assignment
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

fn find_auto_sync_block_range(content: &str) -> Option<(usize, usize)> {
    let start = content.find(AUTO_SYNC_BLOCK_START)?;
    let end_start = content[start..].find(AUTO_SYNC_BLOCK_END)? + start;
    let mut end = end_start + AUTO_SYNC_BLOCK_END.len();
    let bytes = content.as_bytes();
    while end < bytes.len() && (bytes[end] == b' ' || bytes[end] == b'\t') {
        end += 1;
    }
    if end < bytes.len() && bytes[end] == b'\r' {
        end += 1;
    }
    if end < bytes.len() && bytes[end] == b'\n' {
        end += 1;
    }
    Some((start, end))
}

fn remove_auto_sync_block(content: &str) -> String {
    let mut result = content.to_string();
    while let Some((start, end)) = find_auto_sync_block_range(&result) {
        result.replace_range(start..end, "");
    }
    result
}

fn find_matching_brace(content: &str, open_brace: usize) -> Option<usize> {
    let bytes = content.as_bytes();
    let len = bytes.len();
    if open_brace >= len || bytes[open_brace] != b'{' {
        return None;
    }

    let mut depth = 1;
    let mut cursor = open_brace + 1;

    while cursor < len {
        match bytes[cursor] {
            b'{' => depth += 1,
            b'}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(cursor);
                }
            }
            b'"' => {
                cursor += 1;
                while cursor < len {
                    if bytes[cursor] == b'\\' {
                        cursor += 1;
                    } else if bytes[cursor] == b'"' {
                        break;
                    }
                    cursor += 1;
                }
            }
            _ => {}
        }
        cursor += 1;
    }

    None
}

fn find_named_table_block_range(content: &str, table_name: &str) -> Option<(usize, usize, usize)> {
    let pattern = format!(
        r"(?m)(?:local\s+)?{}\s*=\s*\{{",
        regex::escape(table_name)
    );
    let re = Regex::new(&pattern).ok()?;
    let m = re.find(content)?;
    let start = m.start();
    let open_brace = content[start..].find('{')? + start;
    let close_brace = find_matching_brace(content, open_brace)?;

    let mut end = close_brace + 1;
    let bytes = content.as_bytes();
    while end < bytes.len() && (bytes[end] == b' ' || bytes[end] == b'\t') {
        end += 1;
    }
    if end < bytes.len() && bytes[end] == b'\r' {
        end += 1;
    }
    if end < bytes.len() && bytes[end] == b'\n' {
        end += 1;
    }

    Some((start, open_brace, end))
}

fn line_indent_at(content: &str, pos: usize) -> String {
    let line_start = content[..pos].rfind('\n').map_or(0, |idx| idx + 1);
    content[line_start..pos]
        .chars()
        .take_while(|c| *c == ' ' || *c == '\t')
        .collect()
}

fn newline_style(text: &str) -> &'static str {
    if text.contains("\r\n") {
        "\r\n"
    } else {
        "\n"
    }
}

fn detect_indent_unit(text: &str) -> String {
    if text.contains('\t') {
        "\t".to_string()
    } else {
        "    ".to_string()
    }
}

fn detect_direct_shop_item_indent(table_block: &str, outer_indent: &str) -> String {
    let re = Regex::new(r#"(?m)^([ \t]*)\{[^{}\r\n]*\bclientId\s*=\s*\d+"#);
    let Ok(re) = re else {
        return format!("{}{}", outer_indent, detect_indent_unit(table_block));
    };

    for cap in re.captures_iter(table_block) {
        let indent = cap.get(1).map_or("", |m| m.as_str());
        if indent.len() > outer_indent.len() && indent.starts_with(outer_indent) {
            return indent.to_string();
        }
    }

    format!("{}{}", outer_indent, detect_indent_unit(table_block))
}

fn normalize_category_label(value: &str) -> String {
    let mut out = String::new();
    let mut last_space = false;

    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch.to_ascii_lowercase());
            last_space = false;
        } else if !last_space {
            out.push(' ');
            last_space = true;
        }
    }

    out.trim().to_string()
}

fn normalize_match_token(token: &str) -> String {
    let mut out = token.to_ascii_lowercase();
    if out.len() > 3 && out.ends_with('s') {
        out.pop();
    }
    out
}

fn category_label_tokens(value: &str) -> Vec<String> {
    normalize_category_label(value)
        .split_whitespace()
        .map(normalize_match_token)
        .filter(|t| !t.is_empty())
        .collect()
}

fn category_has_token(category_label: &str, token: &str) -> bool {
    let wanted = normalize_match_token(token);
    category_label_tokens(category_label)
        .into_iter()
        .any(|t| t == wanted)
}

fn infer_market_category_from_item_name(item_name: &str) -> Option<i32> {
    let normalized = normalize_category_label(item_name);
    if normalized.is_empty() {
        return None;
    }

    if normalized.contains("wand") || normalized.contains("rod") {
        return Some(21);
    }
    if normalized.contains("rune") {
        return Some(12);
    }
    if normalized.contains("shield") || normalized.contains("spellbook") {
        return Some(13);
    }

    None
}

fn resolved_market_category(proto_entry: &ProtoShopEntry) -> Option<i32> {
    proto_entry
        .market_category
        .or_else(|| infer_market_category_from_item_name(&proto_entry.item_name))
}

fn market_category_aliases(category: i32) -> Vec<&'static str> {
    match category {
        1 => vec!["armors", "armor"],
        2 => vec!["amulets", "amulet"],
        3 => vec!["boots", "boot"],
        4 => vec!["containers", "container"],
        5 => vec!["decoration", "decorations"],
        6 => vec!["food"],
        7 => vec!["helmets hats", "helmets", "hats", "helmet", "hat"],
        8 => vec!["legs", "leg"],
        9 => vec!["others", "other"],
        10 => vec!["potions", "potion"],
        11 => vec!["rings", "ring"],
        12 => vec!["runes", "rune"],
        13 => vec!["shields", "shield"],
        14 => vec!["tools", "tool"],
        15 => vec!["valuables", "valuable"],
        16 => vec!["ammunition", "ammo"],
        17 => vec!["axes", "axe"],
        18 => vec!["clubs", "club"],
        19 => vec!["distance weapons", "distance", "bows", "crossbows"],
        20 => vec!["swords", "sword"],
        21 => vec![
            "wands rods",
            "wands and rods",
            "wands",
            "rods",
            "wand",
            "rod",
        ],
        22 => vec!["premium scrolls", "premium scroll"],
        23 => vec!["tibia coins", "tibia coin", "coins", "coin"],
        24 => vec!["creature products", "creature product"],
        25 => vec!["quiver", "quivers"],
        26 => vec!["soulcores", "soul core", "soul cores"],
        27 => vec!["fist weapons", "fist weapon"],
        _ => Vec::new(),
    }
}

fn category_matches_market(normalized_category_key: &str, market_category: i32) -> bool {
    let category_tokens = category_label_tokens(normalized_category_key);
    if category_tokens.is_empty() {
        return false;
    }

    market_category_aliases(market_category)
        .into_iter()
        .map(category_label_tokens)
        .filter(|alias_tokens| !alias_tokens.is_empty())
        .any(|alias_tokens| {
            if alias_tokens == category_tokens {
                return true;
            }

            let alias_in_category = alias_tokens
                .iter()
                .all(|token| category_tokens.iter().any(|ct| ct == token));
            if alias_in_category {
                return true;
            }

            category_tokens
                .iter()
                .all(|token| alias_tokens.iter().any(|at| at == token))
        })
}

fn lua_quote(value: &str) -> String {
    format!(
        "\"{}\"",
        value.replace('\\', "\\\\").replace('"', "\\\"")
    )
}

fn parse_client_id_from_item_entry(entry_text: &str) -> Option<u32> {
    let re = Regex::new(r"\bclientId\s*=\s*(\d+)").ok()?;
    re.captures(entry_text)?
        .get(1)?
        .as_str()
        .parse::<u32>()
        .ok()
}

fn parse_sub_type_from_item_entry(entry_text: &str) -> Option<i32> {
    let re = Regex::new(r"(?i)\b(?:subtype|count)\s*=\s*(-?\d+)").ok()?;
    re.captures(entry_text)?
        .get(1)?
        .as_str()
        .parse::<i32>()
        .ok()
}

fn detect_subtype_variant_client_ids_in_items_table(table_block: &str) -> HashSet<u32> {
    let item_entry_re = Regex::new(r#"(?s)\{[^{}]*\bclientId\s*=\s*\d+[^{}]*\}\s*,?"#);
    let Ok(item_entry_re) = item_entry_re else {
        return HashSet::new();
    };

    let mut occurrences: HashMap<u32, usize> = HashMap::new();
    let mut subtype_ids: HashSet<u32> = HashSet::new();

    for m in item_entry_re.find_iter(table_block) {
        let entry_text = &table_block[m.start()..m.end()];
        let Some(client_id) = parse_client_id_from_item_entry(entry_text) else {
            continue;
        };

        *occurrences.entry(client_id).or_insert(0) += 1;
        if parse_sub_type_from_item_entry(entry_text).is_some() {
            subtype_ids.insert(client_id);
        }
    }

    occurrences
        .into_iter()
        .filter_map(|(client_id, count)| {
            if count > 1 && subtype_ids.contains(&client_id) {
                Some(client_id)
            } else {
                None
            }
        })
        .collect()
}

fn strip_entry_braces_and_comma(entry_text: &str) -> Option<(String, bool)> {
    let trimmed = entry_text.trim();
    let trailing_comma = trimmed.ends_with(',');
    let without_comma = if trailing_comma {
        trimmed[..trimmed.len() - 1].trim_end()
    } else {
        trimmed
    };

    if !without_comma.starts_with('{') || !without_comma.ends_with('}') {
        return None;
    }

    let inner = without_comma[1..without_comma.len() - 1].trim().to_string();
    Some((inner, trailing_comma))
}

fn parse_item_entry_properties(inner: &str) -> Vec<(String, String)> {
    let re = Regex::new(
        r#"([A-Za-z_][A-Za-z0-9_]*)\s*=\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|-?\d+|true|false|[A-Za-z_][A-Za-z0-9_\.]*)"#,
    );
    let Ok(re) = re else {
        return Vec::new();
    };

    re.captures_iter(inner)
        .map(|cap| (cap[1].to_string(), cap[2].trim().to_string()))
        .collect()
}

fn set_or_remove_prop(props: &mut Vec<(String, String)>, key: &str, value: Option<String>) {
    if let Some(idx) = props.iter().position(|(k, _)| k == key) {
        if let Some(v) = value {
            props[idx].1 = v;
        } else {
            props.remove(idx);
        }
    } else if let Some(v) = value {
        props.push((key.to_string(), v));
    }
}

fn render_item_entry(props: &[(String, String)], indent: &str, trailing_comma: bool) -> String {
    let body = props
        .iter()
        .map(|(k, v)| format!("{} = {}", k, v))
        .collect::<Vec<_>>()
        .join(", ");

    let mut line = format!("{}{{ {} }}", indent, body);
    if trailing_comma {
        line.push(',');
    }
    line
}

fn normalize_leading_item_commas(table_block: &str) -> String {
    let re = Regex::new(
        r#"(?m)\}([ \t]*\r?\n[ \t]*),([ \t]*\{[^{}\r\n]*\bclientId\s*=)"#,
    );
    let Ok(re) = re else {
        return table_block.to_string();
    };

    re.replace_all(table_block, "},$1$2").to_string()
}

fn normalize_item_entry_commas(table_block: &str) -> String {
    let normalized = normalize_leading_item_commas(table_block);
    let item_entry_re = Regex::new(r#"(?s)\{[^{}]*\bclientId\s*=\s*\d+[^{}]*\},?"#);
    let Ok(item_entry_re) = item_entry_re else {
        return normalized;
    };

    let matches: Vec<_> = item_entry_re.find_iter(&normalized).collect();
    if matches.len() < 2 {
        return normalized;
    }

    let mut result = String::with_capacity(normalized.len() + 32);
    let mut cursor = 0usize;
    for (idx, m) in matches.iter().enumerate() {
        result.push_str(&normalized[cursor..m.start()]);

        let mut entry = normalized[m.start()..m.end()].to_string();
        if idx + 1 < matches.len() && !entry.trim_end().ends_with(',') {
            entry.push(',');
        }
        result.push_str(&entry);

        cursor = m.end();
    }
    result.push_str(&normalized[cursor..]);
    result
}

fn update_existing_item_entry(
    entry_text: &str,
    indent: &str,
    proto_item: &NpcShopItem,
    preserve_existing_prices_when_missing: bool,
) -> String {
    let (inner, trailing_comma) = match strip_entry_braces_and_comma(entry_text) {
        Some(v) => v,
        None => {
            return entry_text.to_string();
        }
    };

    let mut props = parse_item_entry_properties(&inner);
    if props.is_empty() {
        return entry_text.to_string();
    }

    let has_storage_gate = props
        .iter()
        .any(|(k, _)| k == "storageKey" || k == "storageValue");

    if !has_storage_gate {
        if let Some(cid) = proto_item.client_id {
            set_or_remove_prop(&mut props, "clientId", Some(cid.to_string()));
        }
    }

    let has_subtype_like = props
        .iter()
        .any(|(k, _)| k == "count" || k.eq_ignore_ascii_case("subtype"));

    // For subtype/count-based and storage-gated entries, preserve custom identity and sync only prices.
    if !has_subtype_like && !has_storage_gate {
        // Update whichever key style exists (`itemName` or `name`) and preserve all custom props.
        let name_value = proto_item.item_name.as_ref().map(|name| lua_quote(name));
        let has_item_name = props.iter().any(|(k, _)| k == "itemName");
        let has_name = props.iter().any(|(k, _)| k == "name");

        if has_item_name {
            set_or_remove_prop(&mut props, "itemName", name_value.clone());
        }
        if has_name {
            set_or_remove_prop(&mut props, "name", name_value.clone());
        }
        if !has_item_name && !has_name {
            set_or_remove_prop(&mut props, "itemName", name_value);
        }
    }

    if preserve_existing_prices_when_missing {
        if let Some(buy) = proto_item.buy.filter(|v| *v > 0) {
            set_or_remove_prop(&mut props, "buy", Some(buy.to_string()));
        }
        if let Some(sell) = proto_item.sell.filter(|v| *v > 0) {
            set_or_remove_prop(&mut props, "sell", Some(sell.to_string()));
        }
    } else {
        set_or_remove_prop(
            &mut props,
            "buy",
            proto_item.buy.filter(|v| *v > 0).map(|v| v.to_string()),
        );
        set_or_remove_prop(
            &mut props,
            "sell",
            proto_item.sell.filter(|v| *v > 0).map(|v| v.to_string()),
        );
    }

    // Keep existing count unless proto explicitly provides one.
    if let Some(count) = proto_item.count {
        let value = if count > 0 {
            Some(count.to_string())
        } else {
            None
        };
        set_or_remove_prop(&mut props, "count", value);
    }

    render_item_entry(&props, indent, trailing_comma)
}

fn normalize_direct_shop_closing_spacing(table_block: &str) -> String {
    let Some(open) = table_block.find('{') else {
        return table_block.to_string();
    };
    let Some(close) = find_matching_brace(table_block, open) else {
        return table_block.to_string();
    };

    let newline = newline_style(table_block);
    // Closing brace of `npcConfig.shop` should align with assignment line.
    let close_indent = line_indent_at(table_block, open);
    let mut inner_end = close;
    let bytes = table_block.as_bytes();
    while inner_end > open + 1 {
        match bytes[inner_end - 1] {
            b' ' | b'\t' | b'\r' | b'\n' => inner_end -= 1,
            _ => break,
        }
    }

    let inner_raw = &table_block[open + 1..inner_end];
    let inner_without_blank_lines = Regex::new(r"(?m)^[ \t]*\r?\n")
        .ok()
        .map(|re| re.replace_all(inner_raw, "").to_string())
        .unwrap_or_else(|| inner_raw.to_string());
    let inner_trimmed_end = inner_without_blank_lines
        .trim_end_matches(|c| c == ' ' || c == '\t' || c == '\r' || c == '\n')
        .to_string();
    let inner_without_leading_breaks = inner_trimmed_end.trim_start_matches(['\r', '\n']);
    let has_inner_content = !inner_without_leading_breaks.trim().is_empty();

    let mut result = String::with_capacity(table_block.len());
    result.push_str(&table_block[..open + 1]);
    if has_inner_content {
        result.push_str(newline);
        result.push_str(inner_without_leading_breaks);
        result.push_str(newline);
        result.push_str(&close_indent);
    }
    result.push_str(&table_block[close..]);
    result
}

fn render_proto_item_entry(proto_item: &NpcShopItem, indent: &str, name_key: &str) -> Option<String> {
    let cid = proto_item.client_id?;
    if cid == 0 {
        return None;
    }

    let mut props: Vec<(String, String)> = Vec::new();
    if let Some(name) = &proto_item.item_name {
        props.push((name_key.to_string(), lua_quote(name)));
    }
    props.push(("clientId".to_string(), cid.to_string()));
    if let Some(buy) = proto_item.buy.filter(|v| *v > 0) {
        props.push(("buy".to_string(), buy.to_string()));
    }
    if let Some(sell) = proto_item.sell.filter(|v| *v > 0) {
        props.push(("sell".to_string(), sell.to_string()));
    }
    if let Some(count) = proto_item.count.filter(|v| *v > 0) {
        props.push(("count".to_string(), count.to_string()));
    }

    Some(render_item_entry(&props, indent, true))
}

fn detect_name_key_in_category(table_block: &str, category_open: usize, category_close: usize) -> String {
    if category_open + 1 >= category_close || category_close > table_block.len() {
        return "itemName".to_string();
    }

    let inner = &table_block[category_open + 1..category_close];
    let pos_item_name = Regex::new(r"\bitemName\s*=")
        .ok()
        .and_then(|re| re.find(inner).map(|m| m.start()));
    let pos_name = Regex::new(r"\bname\s*=")
        .ok()
        .and_then(|re| re.find(inner).map(|m| m.start()));

    match (pos_item_name, pos_name) {
        (Some(i_pos), Some(n_pos)) => {
            if n_pos < i_pos {
                "name".to_string()
            } else {
                "itemName".to_string()
            }
        }
        (Some(_), None) => "itemName".to_string(),
        (None, Some(_)) => "name".to_string(),
        (None, None) => "itemName".to_string(),
    }
}

fn detect_global_name_key(table_block: &str) -> String {
    let re = Regex::new(r"\b(itemName|name)\s*=");
    let Ok(re) = re else {
        return "itemName".to_string();
    };
    if let Some(caps) = re.captures(table_block) {
        return caps[1].to_string();
    }
    "itemName".to_string()
}

#[derive(Debug, Clone)]
struct CategoryBlockInfo {
    normalized_key: String,
    open: usize,
    close: usize,
    close_indent: String,
    item_indent: String,
    name_key: String,
}

fn collect_category_blocks(table_block: &str) -> Vec<CategoryBlockInfo> {
    let re = Regex::new(r#"(?m)\[\s*["']([^"']+)["']\s*\]\s*=\s*\{"#);
    let Ok(re) = re else {
        return Vec::new();
    };

    let indent_unit = detect_indent_unit(table_block);
    let mut categories = Vec::new();

    for cap in re.captures_iter(table_block) {
        let Some(full) = cap.get(0) else {
            continue;
        };
        let Some(raw_key) = cap.get(1) else {
            continue;
        };

        let category_open = match table_block[full.start()..].find('{') {
            Some(pos) => full.start() + pos,
            None => continue,
        };
        let Some(category_close) = find_matching_brace(table_block, category_open) else {
            continue;
        };

        let category_indent = line_indent_at(table_block, full.start());
        let item_indent = format!("{}{}", category_indent, indent_unit);
        let name_key = detect_name_key_in_category(table_block, category_open, category_close);

        categories.push(CategoryBlockInfo {
            normalized_key: normalize_category_label(raw_key.as_str()),
            open: category_open,
            close: category_close,
            close_indent: category_indent,
            item_indent,
            name_key,
        });
    }

    categories
}

fn select_target_category_for_market<'a>(
    categories: &'a [CategoryBlockInfo],
    market_category: i32,
) -> Option<&'a CategoryBlockInfo> {
    categories
        .iter()
        .find(|c| category_matches_market(&c.normalized_key, market_category))
}

fn select_target_category_by_item_name<'a>(
    categories: &'a [CategoryBlockInfo],
    item_name: &str,
) -> Option<&'a CategoryBlockInfo> {
    let normalized_name = normalize_category_label(item_name);
    if normalized_name.is_empty() {
        return None;
    }

    if normalized_name.contains("exercise") {
        if let Some(exercise_category) = categories
            .iter()
            .find(|c| c.normalized_key.contains("exercise"))
        {
            return Some(exercise_category);
        }
    }

    if normalized_name.contains("wand") || normalized_name.contains("rod") {
        if let Some(wands_category) = categories.iter().find(|c| {
            category_has_token(&c.normalized_key, "wand")
                || category_has_token(&c.normalized_key, "rod")
        }) {
            return Some(wands_category);
        }
    }

    if normalized_name.contains("rune") {
        if let Some(runes_category) = categories
            .iter()
            .find(|c| category_has_token(&c.normalized_key, "rune"))
        {
            return Some(runes_category);
        }
    }

    if normalized_name.contains("shield") || normalized_name.contains("spellbook") {
        if let Some(shields_category) = categories
            .iter()
            .find(|c| category_has_token(&c.normalized_key, "shield"))
        {
            return Some(shields_category);
        }
    }

    None
}

fn select_target_category_for_proto_entry<'a>(
    categories: &'a [CategoryBlockInfo],
    proto_entry: &ProtoShopEntry,
) -> Option<&'a CategoryBlockInfo> {
    // Keep custom "exercise" grouping when present, even if market says wands/rods.
    let normalized_name = normalize_category_label(&proto_entry.item_name);
    if normalized_name.contains("exercise") {
        if let Some(exercise_category) = categories
            .iter()
            .find(|c| c.normalized_key.contains("exercise"))
        {
            return Some(exercise_category);
        }
    }

    // Explicit market category from proto has priority over generic name heuristics.
    if proto_entry.market_category.is_some() {
        return select_target_category(categories, proto_entry.market_category);
    }

    if let Some(by_name) = select_target_category_by_item_name(categories, &proto_entry.item_name) {
        return Some(by_name);
    }

    select_target_category(categories, resolved_market_category(proto_entry))
}

fn is_generic_category(normalized_key: &str) -> bool {
    normalized_key == "others" || normalized_key.contains("other")
}

fn is_strict_relocation_target(normalized_key: &str) -> bool {
    normalized_key.contains("exercise")
        || category_has_token(normalized_key, "wand")
        || category_has_token(normalized_key, "rod")
        || category_has_token(normalized_key, "rune")
        || category_has_token(normalized_key, "shield")
}

fn should_relocate_existing_item(
    current_category: &CategoryBlockInfo,
    target_category: &CategoryBlockInfo,
) -> bool {
    if current_category.close == target_category.close {
        return false;
    }

    // Conservative behavior: keep items where they already are unless they are in a generic bucket.
    if !is_generic_category(&current_category.normalized_key) {
        return false;
    }

    if is_generic_category(&target_category.normalized_key) {
        return false;
    }

    // Only move from `others` to high-confidence specific buckets.
    is_strict_relocation_target(&target_category.normalized_key)
}

fn select_target_category<'a>(
    categories: &'a [CategoryBlockInfo],
    market_category: Option<i32>,
) -> Option<&'a CategoryBlockInfo> {
    if categories.is_empty() {
        return None;
    }

    if let Some(market_category) = market_category {
        if let Some(target) = select_target_category_for_market(categories, market_category) {
            return Some(target);
        }
    }

    categories
        .iter()
        .find(|c| c.normalized_key == "others" || c.normalized_key.contains("other"))
        .or_else(|| categories.first())
}

fn normalize_category_closing_indentation(table_block: &str) -> String {
    let categories = collect_category_blocks(table_block);
    if categories.is_empty() {
        return table_block.to_string();
    }

    let mut closes: Vec<(usize, String)> = categories
        .iter()
        .map(|c| (c.close, c.close_indent.clone()))
        .collect();
    closes.sort_unstable_by(|a, b| b.0.cmp(&a.0));

    let mut result = table_block.to_string();
    for (close_pos, expected_indent) in closes {
        if close_pos > result.len() {
            continue;
        }

        let line_start = result[..close_pos].rfind('\n').map_or(0, |idx| idx + 1);
        let actual_close_pos = result[line_start..]
            .find('}')
            .map(|idx| line_start + idx)
            .unwrap_or(close_pos);

        if actual_close_pos < line_start {
            continue;
        }

        let current_indent = &result[line_start..actual_close_pos];
        if current_indent.chars().all(|c| c == ' ' || c == '\t') {
            result.replace_range(line_start..actual_close_pos, &expected_indent);
        }
    }

    result
}

fn normalize_category_item_indentation(table_block: &str) -> String {
    let categories = collect_category_blocks(table_block);
    if categories.is_empty() {
        return table_block.to_string();
    }

    let item_line_re =
        Regex::new(r"(?m)^[ \t]*(\{[^{}\r\n]*\bclientId\s*=\s*\d+[^{}\r\n]*\}\s*,?)");
    let Ok(item_line_re) = item_line_re else {
        return table_block.to_string();
    };

    let mut ranges: Vec<(usize, usize, String)> = categories
        .iter()
        .map(|c| {
            (
                c.open + 1,
                c.close,
                format!("{}{}", c.close_indent, detect_indent_unit(table_block)),
            )
        })
        .collect();
    ranges.sort_unstable_by(|a, b| b.0.cmp(&a.0));

    let mut result = table_block.to_string();
    for (inner_start, inner_end, expected_item_indent) in ranges {
        if inner_start >= inner_end || inner_end > result.len() {
            continue;
        }

        let inner = &result[inner_start..inner_end];
        let normalized_inner = item_line_re
            .replace_all(inner, |caps: &regex::Captures<'_>| {
                format!("{}{}", expected_item_indent, &caps[1])
            })
            .to_string();

        result.replace_range(inner_start..inner_end, &normalized_inner);
    }

    result
}

#[derive(Debug, Clone)]
struct CategoryRelocation {
    remove_start: usize,
    remove_end: usize,
    client_id: u32,
    entry_text: String,
}

fn find_entry_category<'a>(
    categories: &'a [CategoryBlockInfo],
    entry_start: usize,
    entry_end: usize,
) -> Option<&'a CategoryBlockInfo> {
    categories
        .iter()
        .find(|c| entry_start > c.open && entry_end <= c.close)
}

fn insert_lines_before_category_closings(
    table_block: &str,
    grouped_by_close: &HashMap<usize, (String, Vec<String>)>,
) -> String {
    if grouped_by_close.is_empty() {
        return table_block.to_string();
    }

    let newline = newline_style(table_block);
    let mut close_positions: Vec<usize> = grouped_by_close.keys().copied().collect();
    close_positions.sort_unstable_by(|a, b| b.cmp(a));

    let mut result = table_block.to_string();
    for close_pos in close_positions {
        let (close_indent, lines) = match grouped_by_close.get(&close_pos) {
            Some(value) => value,
            None => continue,
        };

        let close_line_start = result[..close_pos].rfind('\n').map_or(0, |idx| idx + 1);
        let actual_close_pos = result[close_line_start..]
            .find('}')
            .map(|idx| close_line_start + idx)
            .unwrap_or(close_pos);

        let mut insertion = String::new();
        for line in lines {
            insertion.push_str(line);
            insertion.push_str(newline);
        }
        insertion.push_str(close_indent);

        result.insert_str(close_line_start, &insertion);

        if actual_close_pos >= close_line_start {
            let old_indent_len = actual_close_pos - close_line_start;
            if old_indent_len > 0 {
                result.replace_range(
                    close_line_start + insertion.len()..close_line_start + insertion.len() + old_indent_len,
                    "",
                );
            }
        }
    }

    result
}

fn relocate_existing_items_by_market_category(
    table_block: &str,
    proto_by_id: &HashMap<u32, &ProtoShopEntry>,
    protected_client_ids: &HashSet<u32>,
    preserve_existing_prices_when_missing: bool,
) -> String {
    if proto_by_id.is_empty() {
        return table_block.to_string();
    }

    let categories = collect_category_blocks(table_block);
    if categories.is_empty() {
        return table_block.to_string();
    }

    let item_entry_re = Regex::new(r#"(?s)\{[^{}]*\bclientId\s*=\s*\d+[^{}]*\}\s*,?"#);
    let Ok(item_entry_re) = item_entry_re else {
        return table_block.to_string();
    };

    let mut relocations: Vec<CategoryRelocation> = Vec::new();
    for m in item_entry_re.find_iter(table_block) {
        let entry_text = &table_block[m.start()..m.end()];
        let Some(client_id) = parse_client_id_from_item_entry(entry_text) else {
            continue;
        };
        if protected_client_ids.contains(&client_id) {
            continue;
        }
        let Some(proto_entry) = proto_by_id.get(&client_id) else {
            continue;
        };
        let Some(current_category) = find_entry_category(&categories, m.start(), m.end()) else {
            continue;
        };
        let Some(target_category) = select_target_category_for_proto_entry(&categories, proto_entry) else {
            continue;
        };
        if !should_relocate_existing_item(current_category, target_category) {
            continue;
        }

        let line_start = table_block[..m.start()].rfind('\n').map_or(0, |idx| idx + 1);
        let line_end = match table_block[m.end()..].find('\n') {
            Some(offset) => m.end() + offset + 1,
            None => table_block.len(),
        };

        relocations.push(CategoryRelocation {
            remove_start: line_start,
            remove_end: line_end,
            client_id,
            entry_text: entry_text.to_string(),
        });
    }

    if relocations.is_empty() {
        return table_block.to_string();
    }

    relocations.sort_unstable_by(|a, b| b.remove_start.cmp(&a.remove_start));
    relocations.dedup_by(|a, b| a.remove_start == b.remove_start && a.remove_end == b.remove_end);

    let mut without_old_lines = table_block.to_string();
    for relocation in &relocations {
        if relocation.remove_start >= relocation.remove_end || relocation.remove_end > without_old_lines.len() {
            continue;
        }
        without_old_lines.replace_range(relocation.remove_start..relocation.remove_end, "");
    }

    let categories_after_removal = collect_category_blocks(&without_old_lines);
    if categories_after_removal.is_empty() {
        return without_old_lines;
    }

    let mut grouped_by_close: HashMap<usize, (String, Vec<String>)> = HashMap::new();
    for relocation in &relocations {
        let Some(proto_entry) = proto_by_id.get(&relocation.client_id) else {
            continue;
        };
        let Some(target_category) =
            select_target_category_for_proto_entry(&categories_after_removal, proto_entry)
        else {
            continue;
        };

        let updated_proto_item = proto_entry_to_shop_item(proto_entry);
        let moved_line = update_existing_item_entry(
            &relocation.entry_text,
            &target_category.item_indent,
            &updated_proto_item,
            preserve_existing_prices_when_missing,
        );

        grouped_by_close
            .entry(target_category.close)
            .and_modify(|(_, lines)| lines.push(moved_line.clone()))
            .or_insert_with(|| (target_category.close_indent.clone(), vec![moved_line]));
    }

    insert_lines_before_category_closings(&without_old_lines, &grouped_by_close)
}

fn insert_missing_proto_items_into_items_table(
    table_block: &str,
    missing_items: &[&ProtoShopEntry],
) -> Option<(String, usize)> {
    if missing_items.is_empty() {
        return Some((table_block.to_string(), 0));
    }

    let newline = newline_style(table_block);
    let categories = collect_category_blocks(table_block);
    let default_name_key = detect_global_name_key(table_block);

    if !categories.is_empty() {
        let mut grouped_by_close: HashMap<usize, (String, Vec<String>)> = HashMap::new();
        let mut added = 0usize;

        for proto_entry in missing_items {
            let Some(target_category) = select_target_category_for_proto_entry(&categories, proto_entry) else {
                continue;
            };

            let proto_item = proto_entry_to_shop_item(proto_entry);
            if let Some(line) = render_proto_item_entry(
                &proto_item,
                &target_category.item_indent,
                &target_category.name_key,
            ) {
                grouped_by_close
                    .entry(target_category.close)
                    .and_modify(|(_, lines)| lines.push(line.clone()))
                    .or_insert_with(|| (target_category.close_indent.clone(), vec![line]));
                added += 1;
            }
        }

        if added == 0 {
            return Some((table_block.to_string(), 0));
        }

        let result = insert_lines_before_category_closings(table_block, &grouped_by_close);

        return Some((result, added));
    }

    let indent_unit = detect_indent_unit(table_block);
    let outer_open = table_block.find('{')?;
    let outer_close = find_matching_brace(table_block, outer_open)?;
    let outer_indent = line_indent_at(table_block, outer_open);
    let category_indent = format!("{}{}", outer_indent, indent_unit);
    let item_indent = format!("{}{}", category_indent, indent_unit);

    let mut insertion = String::new();
    if !table_block[..outer_close].ends_with('\n') {
        insertion.push_str(newline);
    }
    insertion.push_str(&format!("{}[\"proto-sync\"] = {{{}", category_indent, newline));

    let mut added = 0usize;
    for proto_entry in missing_items {
        let proto_item = proto_entry_to_shop_item(proto_entry);
        if let Some(line) = render_proto_item_entry(&proto_item, &item_indent, &default_name_key) {
            insertion.push_str(&line);
            insertion.push_str(newline);
            added += 1;
        }
    }
    insertion.push_str(&format!("{}}},{}", category_indent, newline));

    if added == 0 {
        return Some((table_block.to_string(), 0));
    }

    let mut result = String::with_capacity(table_block.len() + insertion.len());
    result.push_str(&table_block[..outer_close]);
    result.push_str(&insertion);
    result.push_str(&table_block[outer_close..]);
    Some((result, added))
}

fn apply_proto_to_items_table_content(
    content: &str,
    proto_entries: &[ProtoShopEntry],
    keep_custom_items: bool,
    preserve_existing_prices_when_missing: bool,
) -> Option<(String, usize, usize)> {
    let (block_start, _, block_end) = find_named_table_block_range(content, "itemsTable")?;
    let table_block = &content[block_start..block_end];
    let protected_client_ids = detect_subtype_variant_client_ids_in_items_table(table_block);

    let item_entry_re = Regex::new(r#"(?s)\{[^{}]*\bclientId\s*=\s*\d+[^{}]*\}\s*,?"#).ok()?;

    let mut proto_by_id: HashMap<u32, &ProtoShopEntry> = HashMap::new();
    for proto_entry in proto_entries {
        if proto_entry.item_id > 0 {
            proto_by_id.insert(proto_entry.item_id, proto_entry);
        }
    }

    let mut updated_block = String::with_capacity(table_block.len() + 512);
    let mut cursor = 0usize;
    let mut items_before = 0usize;
    let mut items_after = 0usize;
    let mut seen_proto_ids: HashSet<u32> = HashSet::new();

    for m in item_entry_re.find_iter(table_block) {
        updated_block.push_str(&table_block[cursor..m.start()]);
        let entry_text = &table_block[m.start()..m.end()];

        let Some(cid) = parse_client_id_from_item_entry(entry_text) else {
            updated_block.push_str(entry_text);
            cursor = m.end();
            continue;
        };

        items_before += 1;
        let is_protected_variant =
            protected_client_ids.contains(&cid) && proto_by_id.contains_key(&cid);
        if is_protected_variant {
            // Do not overwrite entries that use clientId variants via count/subType (e.g. fluids).
            seen_proto_ids.insert(cid);
            updated_block.push_str(entry_text);
            items_after += 1;
            cursor = m.end();
            continue;
        }

        if let Some(proto_entry) = proto_by_id.get(&cid) {
            seen_proto_ids.insert(cid);
            let proto_item = proto_entry_to_shop_item(proto_entry);
            // Keep the original line indentation already present in the untouched prefix.
            let updated_entry = update_existing_item_entry(
                entry_text,
                "",
                &proto_item,
                preserve_existing_prices_when_missing,
            );
            updated_block.push_str(&updated_entry);
            items_after += 1;
        } else if keep_custom_items {
            updated_block.push_str(entry_text);
            items_after += 1;
        }

        cursor = m.end();
    }
    updated_block.push_str(&table_block[cursor..]);

    let updated_block = relocate_existing_items_by_market_category(
        &updated_block,
        &proto_by_id,
        &protected_client_ids,
        preserve_existing_prices_when_missing,
    );

    let mut missing_items: Vec<&ProtoShopEntry> = Vec::new();
    for proto_entry in proto_entries {
        if proto_entry.item_id == 0
            || seen_proto_ids.contains(&proto_entry.item_id)
            || protected_client_ids.contains(&proto_entry.item_id)
        {
            continue;
        }
        missing_items.push(proto_entry);
    }

    let (updated_block, added_count) =
        insert_missing_proto_items_into_items_table(&updated_block, &missing_items)?;
    items_after += added_count;
    let updated_block = normalize_item_entry_commas(&updated_block);
    let updated_block = normalize_category_item_indentation(&updated_block);
    let updated_block = normalize_category_closing_indentation(&updated_block);

    let mut new_content =
        String::with_capacity(content.len() - (block_end - block_start) + updated_block.len());
    new_content.push_str(&content[..block_start]);
    new_content.push_str(&updated_block);
    new_content.push_str(&content[block_end..]);

    Some((new_content, items_before, items_after))
}

fn insert_missing_proto_items_into_direct_shop(
    table_block: &str,
    missing_items: &[&ProtoShopEntry],
) -> Option<(String, usize)> {
    if missing_items.is_empty() {
        return Some((table_block.to_string(), 0));
    }

    let outer_open = table_block.find('{')?;
    let outer_close = find_matching_brace(table_block, outer_open)?;
    let outer_indent = line_indent_at(table_block, outer_open);
    let item_indent = detect_direct_shop_item_indent(table_block, &outer_indent);
    let newline = newline_style(table_block);
    let name_key = detect_global_name_key(table_block);

    let mut insertion = String::new();
    if !table_block[..outer_close].ends_with('\n') {
        insertion.push_str(newline);
    }

    let mut added = 0usize;
    for proto_entry in missing_items {
        let proto_item = proto_entry_to_shop_item(proto_entry);
        if let Some(line) = render_proto_item_entry(&proto_item, &item_indent, &name_key) {
            insertion.push_str(&line);
            insertion.push_str(newline);
            added += 1;
        }
    }

    if added == 0 {
        return Some((table_block.to_string(), 0));
    }

    let mut result = String::with_capacity(table_block.len() + insertion.len());
    result.push_str(&table_block[..outer_close]);
    result.push_str(&insertion);
    result.push_str(&table_block[outer_close..]);
    Some((result, added))
}

fn apply_proto_to_direct_shop_content(
    content: &str,
    proto_entries: &[ProtoShopEntry],
    keep_custom_items: bool,
    preserve_existing_prices_when_missing: bool,
) -> Option<(String, usize, usize)> {
    if proto_entries.is_empty() {
        return Some((content.to_string(), 0, 0));
    }

    let Some((block_start, _, block_end)) = find_named_table_block_range(content, "npcConfig.shop")
    else {
        let proto_shop_only: Vec<NpcShopItem> =
            proto_entries.iter().map(proto_entry_to_shop_item).collect();
        let new_content = apply_shop_to_content(content, &proto_shop_only);
        return Some((new_content, 0, proto_shop_only.len()));
    };

    let table_block = &content[block_start..block_end];
    let protected_client_ids = detect_subtype_variant_client_ids_in_items_table(table_block);
    let item_entry_re = Regex::new(r#"(?s)\{[^{}]*\bclientId\s*=\s*\d+[^{}]*\}\s*,?"#).ok()?;

    let mut proto_by_id: HashMap<u32, &ProtoShopEntry> = HashMap::new();
    for proto_entry in proto_entries {
        if proto_entry.item_id > 0 {
            proto_by_id.insert(proto_entry.item_id, proto_entry);
        }
    }

    let mut updated_block = String::with_capacity(table_block.len() + 512);
    let mut cursor = 0usize;
    let mut items_before = 0usize;
    let mut items_after = 0usize;
    let mut seen_proto_ids: HashSet<u32> = HashSet::new();

    for m in item_entry_re.find_iter(table_block) {
        updated_block.push_str(&table_block[cursor..m.start()]);
        let entry_text = &table_block[m.start()..m.end()];

        let Some(cid) = parse_client_id_from_item_entry(entry_text) else {
            updated_block.push_str(entry_text);
            cursor = m.end();
            continue;
        };

        items_before += 1;
        let is_protected_variant =
            protected_client_ids.contains(&cid) && proto_by_id.contains_key(&cid);
        if is_protected_variant {
            // Keep subtype/count variants intact (same clientId with different subtypes).
            seen_proto_ids.insert(cid);
            updated_block.push_str(entry_text);
            items_after += 1;
            cursor = m.end();
            continue;
        }

        if let Some(proto_entry) = proto_by_id.get(&cid) {
            seen_proto_ids.insert(cid);
            let proto_item = proto_entry_to_shop_item(proto_entry);
            // Keep the original line indentation already present in the untouched prefix.
            let updated_entry = update_existing_item_entry(
                entry_text,
                "",
                &proto_item,
                preserve_existing_prices_when_missing,
            );
            updated_block.push_str(&updated_entry);
            items_after += 1;
        } else if keep_custom_items {
            updated_block.push_str(entry_text);
            items_after += 1;
        }

        cursor = m.end();
    }
    updated_block.push_str(&table_block[cursor..]);

    let mut missing_items: Vec<&ProtoShopEntry> = Vec::new();
    for proto_entry in proto_entries {
        if proto_entry.item_id == 0
            || seen_proto_ids.contains(&proto_entry.item_id)
            || protected_client_ids.contains(&proto_entry.item_id)
        {
            continue;
        }
        missing_items.push(proto_entry);
    }

    let (updated_block, added_count) =
        insert_missing_proto_items_into_direct_shop(&updated_block, &missing_items)?;
    items_after += added_count;
    let updated_block = normalize_item_entry_commas(&updated_block);
    let updated_block = normalize_direct_shop_closing_spacing(&updated_block);

    let mut new_content =
        String::with_capacity(content.len() - (block_end - block_start) + updated_block.len());
    new_content.push_str(&content[..block_start]);
    new_content.push_str(&updated_block);
    new_content.push_str(&content[block_end..]);

    Some((new_content, items_before, items_after))
}

#[command]
pub async fn sync_npc_shops_from_proto(
    npcs_path: String,
    ignore_item_ids: Vec<u32>,
    ignore_item_names: Vec<String>,
    keep_custom_items: bool,
    items_xml_path: Option<String>,
    shop_source: Option<String>,
    fandom_shop_map: Option<HashMap<String, Vec<ExternalProtoShopEntryInput>>>,
    state: tauri::State<'_, AppState>,
) -> Result<SyncNpcShopsResult, String> {
    let base_path = PathBuf::from(&npcs_path);
    if !base_path.exists() {
        return Err("NPC directory does not exist".to_string());
    }
    let source = ShopSyncSource::parse(shop_source.as_deref());

    // Parse items.xml for name fallback (explicit path or inferred default)
    let resolved_items_xml_path = resolve_items_xml_path(&base_path, items_xml_path.as_deref())?;
    let items_xml_names: HashMap<u32, String> = match resolved_items_xml_path {
        Some(path) => parse_items_xml(&path)?,
        None => HashMap::new(),
    };

    // Build ignore sets
    let ignore_ids: HashSet<u32> = ignore_item_ids.into_iter().collect();
    let ignore_names_lower: HashSet<String> = ignore_item_names
        .iter()
        .map(|n| n.trim().to_lowercase())
        .filter(|n| !n.is_empty())
        .collect();

    let mut item_name_to_id: HashMap<String, u32> = HashMap::new();
    for (item_id, item_name) in &items_xml_names {
        add_item_name_lookup(&mut item_name_to_id, *item_id, item_name);
    }
    if source == ShopSyncSource::Fandom {
        let appearances_lock = state.appearances.read();
        if let Some(appearances) = &*appearances_lock {
            for appearance in &appearances.object {
                let item_id = match appearance.id {
                    Some(id) if id > 0 => id,
                    _ => continue,
                };
                let proto_name = appearance
                    .name
                    .as_ref()
                    .map(|b| normalize_proto_name(b))
                    .unwrap_or_default();
                if !proto_name.is_empty() {
                    add_item_name_lookup(&mut item_name_to_id, item_id, &proto_name);
                }
            }
        }
    }

    // Step 1: Build source data
    let mut npc_shop_map: HashMap<String, Vec<ProtoShopEntry>> = if source == ShopSyncSource::Fandom {
        normalize_external_shop_map(fandom_shop_map, &item_name_to_id)
    } else {
        HashMap::new()
    };

    if source == ShopSyncSource::Proto {
        let appearances_lock = state.appearances.read();
        let appearances = match &*appearances_lock {
            Some(a) => a,
            None => return Err("No appearances loaded. Please load an appearances file first.".to_string()),
        };

        let mut seen_items_by_npc: HashMap<String, HashMap<u32, usize>> = HashMap::new();
        for appearance in &appearances.object {
            let item_id = match appearance.id {
                Some(id) if id > 0 => id,
                _ => continue,
            };

            let proto_name = appearance
                .name
                .as_ref()
                .map(|b| normalize_proto_name(b))
                .unwrap_or_default();

            // Get name: try proto first, then items.xml fallback
            let item_name = if proto_name.is_empty() {
                items_xml_names.get(&item_id).cloned().unwrap_or_default()
            } else {
                proto_name
            };

            // Never import nameless items into npcConfig.shop
            if item_name.is_empty() {
                continue;
            }

            // Skip items in ignore list
            if ignore_ids.contains(&item_id) {
                continue;
            }
            if !item_name.is_empty() && ignore_names_lower.contains(&item_name.to_lowercase()) {
                continue;
            }

            let market_category = appearance
                .flags
                .as_ref()
                .and_then(|f| f.market.as_ref())
                .and_then(|m| m.category);

            if let Some(flags) = &appearance.flags {
                for npc_sale in &flags.npcsaledata {
                    if let Some(npc_name) = &npc_sale.name {
                        if npc_name.trim().is_empty() {
                            continue;
                        }

                        let npc_key = npc_name.trim().to_lowercase();
                        let npc_items = npc_shop_map.entry(npc_key.clone()).or_default();
                        let npc_seen = seen_items_by_npc.entry(npc_key).or_default();

                        if let Some(existing_idx) = npc_seen.get(&item_id).copied() {
                            if let Some(existing) = npc_items.get_mut(existing_idx) {
                                if existing.item_name.is_empty() && !item_name.is_empty() {
                                    existing.item_name = item_name.clone();
                                }
                                if existing.sale_price.is_none() {
                                    existing.sale_price = npc_sale.sale_price;
                                }
                                if existing.buy_price.is_none() {
                                    existing.buy_price = npc_sale.buy_price;
                                }
                                if existing.market_category.is_none() {
                                    existing.market_category = market_category;
                                }
                            }
                            continue;
                        }

                        let next_idx = npc_items.len();
                        npc_items.push(ProtoShopEntry {
                            item_id,
                            item_name: item_name.clone(),
                            sale_price: npc_sale.sale_price,
                            buy_price: npc_sale.buy_price,
                            market_category,
                        });
                        npc_seen.insert(item_id, next_idx);
                    }
                }
            }
        }
    } else if npc_shop_map.is_empty() {
        return Err(
            "Fandom source selected but no fandomShopMap was provided by the frontend."
                .to_string(),
        );
    }

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
        let mut proto_entries: Vec<ProtoShopEntry> =
            npc_shop_map.get(&npc_name_lower).cloned().unwrap_or_default();
        let existing_shop = npc.shop.as_ref();

        if source == ShopSyncSource::Fandom {
            remap_proto_entries_with_existing_shop_names(&mut proto_entries, existing_shop);
        }

        proto_entries = merge_proto_entries_by_item_id(proto_entries);
        let existing_client_ids = if source == ShopSyncSource::Fandom {
            collect_existing_shop_client_ids(existing_shop)
        } else {
            HashSet::new()
        };

        proto_entries.retain(|entry| {
            if entry.item_id > 0 && ignore_ids.contains(&entry.item_id) {
                return false;
            }
            if entry.item_name.is_empty() || ignore_names_lower.contains(&entry.item_name.to_lowercase()) {
                return false;
            }

            if source == ShopSyncSource::Fandom {
                // For Fandom rows with non-gold currency, keep only if this item already exists in the NPC file.
                return entry.sale_price.is_some()
                    || entry.buy_price.is_some()
                    || existing_client_ids.contains(&entry.item_id);
            }

            true
        });

        if proto_entries.is_empty() {
            result.npcs_skipped += 1;
            continue;
        }

        let preserve_existing_prices_when_missing = source == ShopSyncSource::Fandom;

        if has_dynamic_shop_builder(&file_content) {
            let content_without_auto = remove_auto_sync_block(&file_content);
            let Some((new_content, managed_before, managed_after)) = apply_proto_to_items_table_content(
                &content_without_auto,
                &proto_entries,
                keep_custom_items,
                preserve_existing_prices_when_missing,
            ) else {
                result.npcs_skipped += 1;
                result.errors.push(format!(
                    "{}: dynamic shop detected but itemsTable pattern was not recognized.",
                    entry.name
                ));
                continue;
            };

            if new_content == file_content {
                result.npcs_skipped += 1;
                continue;
            }

            if managed_after > managed_before {
                result.items_added += managed_after - managed_before;
            } else if managed_before > managed_after {
                result.items_removed += managed_before - managed_after;
            }

            result.npcs_updated += 1;
            result.npc_details.push(SyncNpcDetail {
                npc_name: npc.name.clone(),
                file_path: entry.file_path.clone(),
                items_before: managed_before,
                items_after: managed_after,
                status: "updated_dynamic".to_string(),
            });

            if let Err(e) = std::fs::write(&entry.file_path, new_content) {
                result.errors.push(format!("{}: Failed to save - {}", entry.name, e));
            }
            continue;
        }

        let content_without_auto = remove_auto_sync_block(&file_content);
        let Some((new_content, managed_before, managed_after)) = apply_proto_to_direct_shop_content(
            &content_without_auto,
            &proto_entries,
            keep_custom_items,
            preserve_existing_prices_when_missing,
        ) else {
            result.npcs_skipped += 1;
            result.errors.push(format!(
                "{}: shop detected but npcConfig.shop pattern was not recognized.",
                entry.name
            ));
            continue;
        };

        if new_content == file_content {
            result.npcs_skipped += 1;
            continue;
        }

        if managed_after > managed_before {
            result.items_added += managed_after - managed_before;
        } else if managed_before > managed_after {
            result.items_removed += managed_before - managed_after;
        }

        result.npcs_updated += 1;
        result.npc_details.push(SyncNpcDetail {
            npc_name: npc.name.clone(),
            file_path: entry.file_path.clone(),
            items_before: managed_before,
            items_after: managed_after,
            status: "updated".to_string(),
        });

        if let Err(e) = std::fs::write(&entry.file_path, new_content) {
            result.errors.push(format!("{}: Failed to save - {}", entry.name, e));
        }
    }

    Ok(result)
}
