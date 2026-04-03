use regex::Regex;
use serde::{Deserialize, Serialize, Serializer};
use std::fs;
use tauri::command;

/// Serializes f64 preserving integer format: 1.0 → 1, 0.1 → 0.1
fn serialize_numeric_value<S: Serializer>(value: &f64, serializer: S) -> Result<S::Ok, S::Error> {
    if value.fract() == 0.0 && value.is_finite() {
        serializer.serialize_i64(*value as i64)
    } else {
        serializer.serialize_f64(*value)
    }
}

// ── Types matching the real client format ──────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProficiencyPerk {
    // Fields in alphabetical order by JSON key to match client format
    #[serde(rename = "AugmentType", skip_serializing_if = "Option::is_none")]
    pub augment_type: Option<u32>,
    #[serde(rename = "BestiaryId", skip_serializing_if = "Option::is_none")]
    pub bestiary_id: Option<u32>,
    #[serde(rename = "BestiaryName", skip_serializing_if = "Option::is_none")]
    pub bestiary_name: Option<String>,
    #[serde(rename = "DamageType", skip_serializing_if = "Option::is_none")]
    pub damage_type: Option<u32>,
    #[serde(rename = "ElementId", skip_serializing_if = "Option::is_none")]
    pub element_id: Option<u32>,
    #[serde(rename = "Range", skip_serializing_if = "Option::is_none")]
    pub range: Option<u32>,
    #[serde(rename = "SkillId", skip_serializing_if = "Option::is_none")]
    pub skill_id: Option<u32>,
    #[serde(rename = "SpellId", skip_serializing_if = "Option::is_none")]
    pub spell_id: Option<u32>,
    #[serde(rename = "Type")]
    pub perk_type: u32,
    #[serde(rename = "Value", serialize_with = "serialize_numeric_value")]
    pub value: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProficiencyLevel {
    #[serde(rename = "Perks")]
    pub perks: Vec<ProficiencyPerk>,
    #[serde(rename = "XpRequired", skip_serializing_if = "Option::is_none")]
    pub xp_required: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProficiencyEntry {
    // Fields in alphabetical order by JSON key to match client format
    #[serde(rename = "Levels")]
    pub levels: Vec<ProficiencyLevel>,
    #[serde(rename = "Name")]
    pub name: String,
    #[serde(rename = "ProficiencyId")]
    pub proficiency_id: u32,
    #[serde(rename = "Version", skip_serializing_if = "Option::is_none")]
    pub version: Option<u32>,
}

// ── Inspection (for diagnosing unknown formats) ────────────────────────────

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RawFileInfo {
    pub preview: String,
    pub top_level_type: String,
    pub top_level_keys: Vec<String>,
    pub array_length: Option<usize>,
    pub first_value_type: Option<String>,
}

#[command]
pub async fn inspect_proficiency_file(file_path: String) -> Result<RawFileInfo, String> {
    let content = fs::read_to_string(&file_path).map_err(|e| format!("Falha ao ler arquivo: {}", e))?;

    let preview = content.chars().take(1000).collect::<String>();
    let value: serde_json::Value = serde_json::from_str(&content).map_err(|e| format!("JSON inválido: {}", e))?;

    let (top_level_type, top_level_keys, array_length, first_value_type) = match &value {
        serde_json::Value::Array(arr) => {
            let first_type = arr.first().map(json_type_name);
            ("array".to_string(), vec![], Some(arr.len()), first_type)
        }
        serde_json::Value::Object(obj) => {
            let keys: Vec<String> = obj.keys().take(20).cloned().collect();
            let first_type = obj.values().next().map(json_type_name);
            ("object".to_string(), keys, None, first_type)
        }
        other => (json_type_name(other), vec![], None, None),
    };

    Ok(RawFileInfo {
        preview,
        top_level_type,
        top_level_keys,
        array_length,
        first_value_type,
    })
}

fn json_type_name(v: &serde_json::Value) -> String {
    match v {
        serde_json::Value::Array(_) => "array",
        serde_json::Value::Object(_) => "object",
        serde_json::Value::String(_) => "string",
        serde_json::Value::Number(_) => "number",
        serde_json::Value::Bool(_) => "bool",
        serde_json::Value::Null => "null",
    }
    .to_string()
}

// ── Load ───────────────────────────────────────────────────────────────────

#[command]
pub async fn load_proficiency_file(file_path: String) -> Result<Vec<ProficiencyEntry>, String> {
    let content = fs::read_to_string(&file_path).map_err(|e| format!("Falha ao ler arquivo: {}", e))?;
    serde_json::from_str::<Vec<ProficiencyEntry>>(&content).map_err(|e| format!("Falha ao parsear proficiency: {}", e))
}

// ── Save ───────────────────────────────────────────────────────────────────

/// Walks two JSON trees in parallel; where both have a Number at the same
/// path and the numeric value is unchanged, keeps the original
/// serde_json::Number so that "5.0" stays "5.0" and "1" stays "1".
fn preserve_number_formats(new_val: &mut serde_json::Value, original: &serde_json::Value) {
    match original {
        serde_json::Value::Array(orig_arr) => {
            if let serde_json::Value::Array(ref mut new_arr) = new_val {
                for (n, o) in new_arr.iter_mut().zip(orig_arr.iter()) {
                    preserve_number_formats(n, o);
                }
            }
        }
        serde_json::Value::Object(orig_obj) => {
            if let serde_json::Value::Object(ref mut new_obj) = new_val {
                for (key, new_v) in new_obj.iter_mut() {
                    if let Some(orig_v) = orig_obj.get(key) {
                        preserve_number_formats(new_v, orig_v);
                    }
                }
            }
        }
        serde_json::Value::Number(orig_num) => {
            if let serde_json::Value::Number(ref new_num) = new_val {
                let new_f = new_num.as_f64().unwrap_or(f64::NAN);
                let orig_f = orig_num.as_f64().unwrap_or(f64::NAN);
                if (new_f - orig_f).abs() < f64::EPSILON {
                    *new_val = serde_json::Value::Number(orig_num.clone());
                }
            }
        }
        _ => {}
    }
}

#[command]
pub async fn save_proficiency_file(file_path: String, data: Vec<ProficiencyEntry>) -> Result<(), String> {
    let mut new_value = serde_json::to_value(&data).map_err(|e| format!("Falha ao serializar: {}", e))?;

    // Read the original file and preserve number formats for unchanged values
    if let Ok(original_content) = fs::read_to_string(&file_path) {
        if let Ok(original_value) = serde_json::from_str::<serde_json::Value>(&original_content) {
            preserve_number_formats(&mut new_value, &original_value);
        }
    }

    let json = serde_json::to_string_pretty(&new_value).map_err(|e| format!("Falha ao formatar JSON: {}", e))?;
    fs::write(&file_path, json).map_err(|e| format!("Falha ao salvar arquivo: {}", e))?;
    Ok(())
}

// ── items.xml Proficiency Sync ──────────────────────────────────────────────

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ItemProficiencyInfo {
    pub item_id: u32,
    pub item_name: String,
    pub proficiency_id: u32,
}

/// Scan items.xml and return all items that have a proficiency attribute.
#[command]
pub async fn scan_proficiency_items_xml(xml_path: String) -> Result<Vec<ItemProficiencyInfo>, String> {
    let content = fs::read_to_string(&xml_path)
        .map_err(|e| format!("Falha ao ler items.xml: {}", e))?;

    let item_re = Regex::new(r#"<item\s+(?:fromid|id)="(\d+)"(?:\s[^>]*?name="([^"]*)")?"#)
        .map_err(|e| format!("Regex error: {}", e))?;
    let prof_re = Regex::new(r#"<attribute\s+key="proficiency"\s+value="(\d+)""#)
        .map_err(|e| format!("Regex error: {}", e))?;

    let mut current_item_id: u32 = 0;
    let mut current_item_name = String::new();
    let mut results = Vec::new();

    for line in content.lines() {
        if let Some(caps) = item_re.captures(line) {
            current_item_id = caps.get(1).and_then(|m| m.as_str().parse().ok()).unwrap_or(0);
            current_item_name = caps.get(2).map_or(String::new(), |m| m.as_str().to_string());
        }
        if let Some(caps) = prof_re.captures(line) {
            let prof_id: u32 = caps.get(1).and_then(|m| m.as_str().parse().ok()).unwrap_or(0);
            results.push(ItemProficiencyInfo {
                item_id: current_item_id,
                item_name: current_item_name.clone(),
                proficiency_id: prof_id,
            });
        }
    }

    Ok(results)
}

/// Update or add/remove proficiency attribute for a single item in items.xml.
#[command]
pub async fn update_item_proficiency_xml(xml_path: String, item_id: u32, proficiency_id: Option<u32>) -> Result<(), String> {
    let content = fs::read_to_string(&xml_path)
        .map_err(|e| format!("Falha ao ler items.xml: {}", e))?;

    let item_re = Regex::new(r#"<item\s+(?:fromid|id)="(\d+)""#)
        .map_err(|e| format!("Regex error: {}", e))?;
    let prof_re = Regex::new(r#"<attribute\s+key="proficiency"\s+value="\d+""#)
        .map_err(|e| format!("Regex error: {}", e))?;

    let lines: Vec<&str> = content.lines().collect();
    let mut result_lines: Vec<String> = Vec::with_capacity(lines.len() + 1);
    let mut in_target_item = false;
    let mut found_prof_line = false;
    let mut item_indent = String::new();

    for line in &lines {
        // Detect item opening tags
        if let Some(caps) = item_re.captures(line) {
            let id: u32 = caps.get(1).and_then(|m| m.as_str().parse().ok()).unwrap_or(0);

            // If we were in the target item and hit a new <item>, insert before leaving
            if in_target_item && !found_prof_line {
                if let Some(prof_id) = proficiency_id {
                    result_lines.push(format!("{}\t<attribute key=\"proficiency\" value=\"{}\"/>", item_indent, prof_id));
                }
                in_target_item = false;
            }

            if id == item_id {
                in_target_item = true;
                found_prof_line = false;
                item_indent = line.chars().take_while(|c| c.is_whitespace()).collect::<String>();

                // Self-closing: <item id="X" ... />
                if line.trim_end().ends_with("/>") {
                    if let Some(prof_id) = proficiency_id {
                        let trimmed = line.trim_end();
                        let open_tag = trimmed.strip_suffix("/>").unwrap_or(trimmed).to_string() + ">";
                        result_lines.push(open_tag);
                        result_lines.push(format!("{}\t<attribute key=\"proficiency\" value=\"{}\"/>", item_indent, prof_id));
                        result_lines.push(format!("{}</item>", item_indent));
                    } else {
                        result_lines.push(line.to_string());
                    }
                    in_target_item = false;
                    found_prof_line = true;
                    continue;
                }
            } else {
                in_target_item = false;
            }
        }

        if in_target_item {
            // Closing </item>
            if line.trim().starts_with("</item>") {
                if !found_prof_line {
                    if let Some(prof_id) = proficiency_id {
                        result_lines.push(format!("{}\t<attribute key=\"proficiency\" value=\"{}\"/>", item_indent, prof_id));
                    }
                }
                in_target_item = false;
                result_lines.push(line.to_string());
                continue;
            }

            // Existing proficiency line
            if prof_re.is_match(line) {
                found_prof_line = true;
                match proficiency_id {
                    Some(prof_id) => {
                        let indent = line.chars().take_while(|c| c.is_whitespace()).collect::<String>();
                        result_lines.push(format!("{}<attribute key=\"proficiency\" value=\"{}\"/>", indent, prof_id));
                    }
                    None => {
                        // Remove the line (skip it)
                    }
                }
                continue;
            }
        }

        result_lines.push(line.to_string());
    }

    let has_trailing_newline = content.ends_with('\n');
    let mut output = result_lines.join("\n");
    if has_trailing_newline && !output.ends_with('\n') {
        output.push('\n');
    }

    fs::write(&xml_path, output)
        .map_err(|e| format!("Falha ao salvar items.xml: {}", e))?;

    Ok(())
}

/// Batch sync: update multiple items at once.
#[command]
pub async fn sync_proficiency_items_xml(xml_path: String, mappings: Vec<ItemProficiencyMapping>) -> Result<SyncResult, String> {
    let content = fs::read_to_string(&xml_path)
        .map_err(|e| format!("Falha ao ler items.xml: {}", e))?;

    let item_re = Regex::new(r#"<item\s+(?:fromid|id)="(\d+)""#)
        .map_err(|e| format!("Regex error: {}", e))?;
    let prof_re = Regex::new(r#"<attribute\s+key="proficiency"\s+value="(\d+)""#)
        .map_err(|e| format!("Regex error: {}", e))?;

    // Build lookup: item_id -> proficiency_id
    let mut mapping_map = std::collections::HashMap::new();
    for m in &mappings {
        mapping_map.insert(m.item_id, m.proficiency_id);
    }

    let lines: Vec<&str> = content.lines().collect();
    let mut result_lines: Vec<String> = Vec::with_capacity(lines.len() + mappings.len());
    let mut current_item_id: u32 = 0;
    let mut in_mapped_item = false;
    let mut found_prof_line = false;
    let mut item_indent = String::new();
    let mut updated = 0u32;
    let mut added = 0u32;
    let mut processed_ids = std::collections::HashSet::new();

    for line in &lines {
        if let Some(caps) = item_re.captures(line) {
            let id: u32 = caps.get(1).and_then(|m| m.as_str().parse().ok()).unwrap_or(0);

            // Close previous mapped item if we didn't find a prof line
            if in_mapped_item && !found_prof_line {
                if let Some(&prof_id) = mapping_map.get(&current_item_id) {
                    result_lines.push(format!("{}\t<attribute key=\"proficiency\" value=\"{}\"/>", item_indent, prof_id));
                    added += 1;
                    processed_ids.insert(current_item_id);
                }
            }

            in_mapped_item = mapping_map.contains_key(&id);
            current_item_id = id;
            found_prof_line = false;
            item_indent = line.chars().take_while(|c| c.is_whitespace()).collect::<String>();

            // Handle self-closing items: <item id="X" ... />
            if in_mapped_item && line.trim_end().ends_with("/>") {
                let prof_id = mapping_map[&id];
                let trimmed = line.trim_end();
                let open_tag = trimmed.strip_suffix("/>").unwrap_or(trimmed).to_string() + ">";
                result_lines.push(open_tag);
                result_lines.push(format!("{}\t<attribute key=\"proficiency\" value=\"{}\"/>", item_indent, prof_id));
                result_lines.push(format!("{}</item>", item_indent));
                added += 1;
                processed_ids.insert(id);
                in_mapped_item = false;
                found_prof_line = true;
                continue;
            }
        }

        if in_mapped_item {
            if line.trim().starts_with("</item>") {
                if !found_prof_line {
                    if let Some(&prof_id) = mapping_map.get(&current_item_id) {
                        result_lines.push(format!("{}\t<attribute key=\"proficiency\" value=\"{}\"/>", item_indent, prof_id));
                        added += 1;
                        processed_ids.insert(current_item_id);
                    }
                }
                in_mapped_item = false;
                result_lines.push(line.to_string());
                continue;
            }

            if let Some(caps) = prof_re.captures(line) {
                found_prof_line = true;
                let indent = line.chars().take_while(|c| c.is_whitespace()).collect::<String>();
                let existing_id: u32 = caps.get(1).and_then(|m| m.as_str().parse().ok()).unwrap_or(0);
                if let Some(&prof_id) = mapping_map.get(&current_item_id) {
                    if existing_id != prof_id {
                        result_lines.push(format!("{}<attribute key=\"proficiency\" value=\"{}\"/>", indent, prof_id));
                        updated += 1;
                    } else {
                        result_lines.push(line.to_string());
                    }
                    processed_ids.insert(current_item_id);
                    continue;
                }
            }
        }

        result_lines.push(line.to_string());
    }

    // Handle last item if still pending
    if in_mapped_item && !found_prof_line {
        if let Some(&prof_id) = mapping_map.get(&current_item_id) {
            result_lines.push(format!("{}\t<attribute key=\"proficiency\" value=\"{}\"/>", item_indent, prof_id));
            added += 1;
            processed_ids.insert(current_item_id);
        }
    }

    let not_found: Vec<u32> = mappings.iter()
        .filter(|m| !processed_ids.contains(&m.item_id))
        .map(|m| m.item_id)
        .collect();

    let has_trailing_newline = content.ends_with('\n');
    let mut output = result_lines.join("\n");
    if has_trailing_newline && !output.ends_with('\n') {
        output.push('\n');
    }

    fs::write(&xml_path, output)
        .map_err(|e| format!("Falha ao salvar items.xml: {}", e))?;

    Ok(SyncResult { updated, added, not_found })
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ItemProficiencyMapping {
    pub item_id: u32,
    pub proficiency_id: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub updated: u32,
    pub added: u32,
    pub not_found: Vec<u32>,
}
