use crate::features::npcs::parsers::lua_parser::LuaNpcParser;
use crate::features::npcs::types::{Npc, NpcListEntry};
use anyhow::{Context, Result};
use serde::Serialize;
use regex::Regex;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameNpcResult {
    pub file_path: String,
    pub relative_path: String,
}

#[command]
pub async fn list_npc_files(npcs_path: String) -> Result<Vec<NpcListEntry>, String> {
    let base_path = PathBuf::from(&npcs_path);
    list_npcs_recursive(Path::new(&npcs_path), &base_path).map_err(|e| format!("Failed to list npc files: {}", e))
}

fn list_npcs_recursive(dir: &Path, base: &Path) -> Result<Vec<NpcListEntry>> {
    let mut npcs = Vec::new();

    if !dir.exists() {
        return Ok(npcs);
    }

    let entries = fs::read_dir(dir).context(format!("Failed to read directory: {:?}", dir))?;

    for entry in entries {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            let sub_npcs = list_npcs_recursive(&path, base)?;
            npcs.extend(sub_npcs);
        } else if path.extension().and_then(|s| s.to_str()) == Some("lua") {
            if let Ok(content) = fs::read_to_string(&path) {
                let npc_name = match extract_npc_name_quick(&content) {
                    Ok(name) => name,
                    Err(_) => continue,
                };

                let relative_path = compute_relative_path(&path, base);

                npcs.push(NpcListEntry {
                    name: npc_name,
                    file_path: path.to_string_lossy().to_string(),
                    relative_path,
                    categories: Vec::new(),
                });
            }
        }
    }

    npcs.sort_by(|a, b| a.relative_path.to_lowercase().cmp(&b.relative_path.to_lowercase()));
    Ok(npcs)
}

fn extract_npc_name_quick(content: &str) -> Result<String> {
    let internal_re = Regex::new(r#"local\s+internalNpcName\s*=\s*"([^"]+)""#)?;
    if let Some(caps) = internal_re.captures(content) {
        return Ok(caps[1].to_string());
    }

    let re = Regex::new(r#"Game\.createNpcType\("([^"]+)"\)"#)?;
    let caps = re.captures(content).context("Failed to find npc name")?;
    Ok(caps[1].to_string())
}

#[command]
pub async fn load_npc_file(file_path: String) -> Result<Npc, String> {
    let content = fs::read_to_string(&file_path).map_err(|e| format!("Failed to read npc file: {}", e))?;

    let parser = LuaNpcParser::new(content);
    parser.parse().map_err(|e| format!("Failed to parse npc file: {}", e))
}

#[command]
pub async fn save_npc_file(file_path: String, npc: Npc) -> Result<(), String> {
    let lua_content = generate_lua_from_npc(&npc).map_err(|e| format!("Failed to generate Lua: {}", e))?;

    fs::write(&file_path, lua_content).map_err(|e| format!("Failed to write npc file: {}", e))?;

    Ok(())
}

#[command]
pub async fn rename_npc_file(old_path: String, new_name: String, npcs_root: String) -> Result<RenameNpcResult, String> {
    if new_name.trim().is_empty() {
        return Err("New npc name cannot be empty".into());
    }

    let old_path_buf = PathBuf::from(&old_path);
    if !old_path_buf.exists() {
        return Err("Original npc file was not found".into());
    }

    let parent_dir = old_path_buf.parent().ok_or_else(|| "Failed to determine npc directory".to_string())?;

    let slug = slugify_name(&new_name);
    let new_file_name = format!("{}.lua", slug);
    let new_path = parent_dir.join(&new_file_name);

    if new_path != old_path_buf && new_path.exists() {
        return Err("Another npc already uses this file name".into());
    }

    if new_path != old_path_buf {
        fs::rename(&old_path_buf, &new_path).map_err(|e| format!("Failed to rename npc file: {}", e))?;
    }

    let relative_path = compute_relative_path(&new_path, Path::new(&npcs_root));

    Ok(RenameNpcResult {
        file_path: new_path.to_string_lossy().to_string(),
        relative_path,
    })
}

fn compute_relative_path(path: &Path, base: &Path) -> String {
    path.strip_prefix(base).unwrap_or(path).to_string_lossy().replace('\\', "/")
}

fn slugify_name(name: &str) -> String {
    let mut slug = String::new();
    let mut last_was_separator = false;

    for ch in name.chars() {
        if ch.is_ascii_alphanumeric() {
            slug.push(ch.to_ascii_lowercase());
            last_was_separator = false;
        } else if !last_was_separator {
            slug.push('_');
            last_was_separator = true;
        }
    }

    let trimmed = slug.trim_matches('_').to_string();
    if trimmed.is_empty() {
        "npc".to_string()
    } else {
        trimmed
    }
}

fn generate_lua_from_npc(npc: &Npc) -> Result<String> {
    let mut lua = String::new();

    // Header
    lua.push_str(&format!("local internalNpcName = \"{}\"\n", npc.name));
    lua.push_str("local npcType = Game.createNpcType(internalNpcName)\n");
    lua.push_str("local npcConfig = {}\n\n");

    // Basic info
    lua.push_str("npcConfig.name = internalNpcName\n");
    if !npc.description.is_empty() {
      lua.push_str(&format!("npcConfig.description = \"{}\"\n", npc.description));
    } else {
      lua.push_str("npcConfig.description = internalNpcName\n");
    }

    lua.push('\n');

    lua.push_str(&format!("npcConfig.health = {}\n", npc.health));
    lua.push_str(&format!("npcConfig.maxHealth = {}\n", npc.max_health));
    lua.push_str(&format!("npcConfig.walkInterval = {}\n", npc.walk_interval));
    lua.push_str(&format!("npcConfig.walkRadius = {}\n", npc.walk_radius));

    if let Some(am_level) = npc.amount_level {
        lua.push_str(&format!("npcConfig.amountLevel = {}\n", am_level));
    }
    if let Some(am_money) = npc.amount_money {
        lua.push_str(&format!("npcConfig.amountMoney = {}\n", am_money));
    }
    if let Some(curr) = npc.currency {
        lua.push_str(&format!("npcConfig.currency = {}\n", curr));
    }
    if let Some(max_lvl) = npc.max_level {
        lua.push_str(&format!("npcConfig.maxLevel = {}\n", max_lvl));
    }
    if let Some(mtd) = npc.money_to_need_donation {
        lua.push_str(&format!("npcConfig.moneyToNeedDonation = {}\n", mtd));
    }
    if let Some(ref r_type) = npc.respawn_type {
        lua.push_str(&format!("npcConfig.respawnType = \"{}\"\n", r_type));
    }

    lua.push('\n');

    // Outfit
    lua.push_str("npcConfig.outfit = {\n");
    lua.push_str(&format!("\tlookType = {},\n", npc.outfit.look_type));
    lua.push_str(&format!("\tlookHead = {},\n", npc.outfit.look_head));
    lua.push_str(&format!("\tlookBody = {},\n", npc.outfit.look_body));
    lua.push_str(&format!("\tlookLegs = {},\n", npc.outfit.look_legs));
    lua.push_str(&format!("\tlookFeet = {},\n", npc.outfit.look_feet));
    lua.push_str(&format!("\tlookAddons = {},\n", npc.outfit.look_addons));
    lua.push_str(&format!("\tlookMount = {},\n", npc.outfit.look_mount));
    lua.push_str("}\n\n");

    // Flags
    lua.push_str("npcConfig.flags = {\n");
    lua.push_str(&format!("\tfloorchange = {},\n", npc.flags.floorchange));
    lua.push_str("}\n\n");

    // Voices
    if let Some(ref voices) = npc.voices {
        if !voices.lines.is_empty() {
            lua.push_str("npcConfig.voices = {\n");
            lua.push_str(&format!("\tinterval = {},\n", voices.interval));
            lua.push_str(&format!("\tchance = {},\n", voices.chance));
            for voice in &voices.lines {
                lua.push_str(&format!("\t{{ text = \"{}\"", voice.text));
                if voice.yell {
                    lua.push_str(", yell = true");
                } else {
                    lua.push_str(", yell = false");
                }
                lua.push_str(" },\n");
            }
            lua.push_str("}\n\n");
        }
    }

    // Shop
    if let Some(ref shop) = npc.shop {
        if !shop.is_empty() {
            lua.push_str("npcConfig.shop = {\n");
            for item in shop {
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
                    props.push(format!(" buy = {}", buy));
                }
                if let Some(sell) = item.sell {
                    props.push(format!(" sell = {}", sell));
                }
                if let Some(count) = item.count {
                    props.push(format!(" count = {}", count));
                }
                lua.push_str(&props.join(","));
                lua.push_str(" },\n");
            }
            lua.push_str("}\n\n");
        }
    }

    // Interaction system appending
    lua.push_str("local keywordHandler = KeywordHandler:new()\n");
    lua.push_str("local npcHandler = NpcHandler:new(keywordHandler)\n\n");
    
    lua.push_str("npcType.onThink = function(npc, interval)\n\tnpcHandler:onThink(npc, interval)\nend\n\n");
    lua.push_str("npcType.onAppear = function(npc, creature)\n\tnpcHandler:onAppear(npc, creature)\nend\n\n");
    lua.push_str("npcType.onDisappear = function(npc, creature)\n\tnpcHandler:onDisappear(npc, creature)\nend\n\n");
    lua.push_str("npcType.onMove = function(npc, creature, fromPosition, toPosition)\n\tnpcHandler:onMove(npc, creature, fromPosition, toPosition)\nend\n\n");
    lua.push_str("npcType.onSay = function(npc, creature, type, message)\n\tnpcHandler:onSay(npc, creature, type, message)\nend\n\n");
    lua.push_str("npcType.onCloseChannel = function(npc, creature)\n\tnpcHandler:onCloseChannel(npc, creature)\nend\n\n");

    // Output Messages
    for (msg_type, text) in &npc.interactions.messages {
        lua.push_str(&format!("npcHandler:setMessage({}, \"{}\")\n", msg_type, text));
    }

    if !npc.interactions.messages.is_empty() {
        lua.push_str("\n");
    }

    // Output Keywords
    for keyword in &npc.interactions.keywords {
        let mut is_greet = false;
        let mut clean_words = Vec::new();
        for w in &keyword.words {
            if w.starts_with("__greet:") {
                is_greet = true;
                clean_words.push(format!("\"{}\"", w.trim_start_matches("__greet:")));
            } else {
                clean_words.push(format!("\"{}\"", w));
            }
        }
        
        let handler_type = if is_greet { "addGreetKeyword" } else { "addKeyword" };
        let words_joined = clean_words.join(", ");
        
        if is_greet {
            lua.push_str(&format!("keywordHandler:{}({{ {} }}, {{ npcHandler = npcHandler, text = \"{}\" }})\n", 
                handler_type, words_joined, keyword.response));
        } else {
            // Standard StdModule.say response
            lua.push_str(&format!("keywordHandler:{}({{ {} }}, StdModule.say, {{ npcHandler = npcHandler, onlyUnfocus = true, text = \"{}\" }})\n", 
                handler_type, words_joined, keyword.response));
        }
    }

    if !npc.interactions.keywords.is_empty() {
        lua.push_str("\n");
    }

    // Embed Custom Code block before final Modules loading
    if !npc.interactions.raw_code.trim().is_empty() {
        lua.push_str(&npc.interactions.raw_code);
        lua.push_str("\n\n");
    }

    // Standard modules loading
    if npc.interactions.modules.is_empty() {
        // Fallback to FocusModule if empty but file expects default
        lua.push_str("npcHandler:addModule(FocusModule:new(), npcConfig.name, true, true, true)\n");
    } else {
        for module in &npc.interactions.modules {
            lua.push_str(&format!("npcHandler:addModule({}:new(), npcConfig.name, true, true, true)\n", module));
        }
    }

    lua.push_str("\n-- npcType registering the npcConfig table\n");
    lua.push_str("npcType:register(npcConfig)\n");

    Ok(lua)
}
