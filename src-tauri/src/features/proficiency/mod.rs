use serde::{Deserialize, Serialize};
use std::fs;
use tauri::command;

// ── Types matching the real client format ──────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProficiencyPerk {
    #[serde(rename = "Type")]
    pub perk_type: u32,
    #[serde(rename = "Value")]
    pub value: f64,
    #[serde(rename = "SkillId", skip_serializing_if = "Option::is_none")]
    pub skill_id: Option<u32>,
    #[serde(rename = "AugmentType", skip_serializing_if = "Option::is_none")]
    pub augment_type: Option<u32>,
    #[serde(rename = "SpellId", skip_serializing_if = "Option::is_none")]
    pub spell_id: Option<u32>,
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
    #[serde(rename = "Name")]
    pub name: String,
    #[serde(rename = "ProficiencyId")]
    pub proficiency_id: u32,
    #[serde(rename = "Version", skip_serializing_if = "Option::is_none")]
    pub version: Option<u32>,
    #[serde(rename = "Levels")]
    pub levels: Vec<ProficiencyLevel>,
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

#[command]
pub async fn save_proficiency_file(file_path: String, data: Vec<ProficiencyEntry>) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Falha ao serializar: {}", e))?;
    fs::write(&file_path, json)
        .map_err(|e| format!("Falha ao salvar arquivo: {}", e))?;
    Ok(())
}
