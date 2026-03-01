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
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Falha ao ler arquivo: {}", e))?;

    let preview = content.chars().take(1000).collect::<String>();
    let value: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("JSON inválido: {}", e))?;

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

    Ok(RawFileInfo { preview, top_level_type, top_level_keys, array_length, first_value_type })
}

fn json_type_name(v: &serde_json::Value) -> String {
    match v {
        serde_json::Value::Array(_) => "array",
        serde_json::Value::Object(_) => "object",
        serde_json::Value::String(_) => "string",
        serde_json::Value::Number(_) => "number",
        serde_json::Value::Bool(_) => "bool",
        serde_json::Value::Null => "null",
    }.to_string()
}

// ── Load ───────────────────────────────────────────────────────────────────

#[command]
pub async fn load_proficiency_file(file_path: String) -> Result<Vec<ProficiencyEntry>, String> {
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Falha ao ler arquivo: {}", e))?;
    serde_json::from_str::<Vec<ProficiencyEntry>>(&content)
        .map_err(|e| format!("Falha ao parsear proficiency: {}", e))
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
    let mut new_value = serde_json::to_value(&data)
        .map_err(|e| format!("Falha ao serializar: {}", e))?;

    // Read the original file and preserve number formats for unchanged values
    if let Ok(original_content) = fs::read_to_string(&file_path) {
        if let Ok(original_value) = serde_json::from_str::<serde_json::Value>(&original_content) {
            preserve_number_formats(&mut new_value, &original_value);
        }
    }

    let json = serde_json::to_string_pretty(&new_value)
        .map_err(|e| format!("Falha ao formatar JSON: {}", e))?;
    fs::write(&file_path, json)
        .map_err(|e| format!("Falha ao salvar arquivo: {}", e))?;
    Ok(())
}
