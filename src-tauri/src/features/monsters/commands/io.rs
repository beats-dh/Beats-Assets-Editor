use crate::features::monsters::parsers::lua_parser::LuaMonsterParser;
use crate::features::monsters::types::{Monster, MonsterListEntry};
use anyhow::{Context, Result};
use serde::Serialize;
use std::collections::HashSet;
use regex::Regex;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameMonsterResult {
    pub file_path: String,
    pub relative_path: String,
}

#[command]
pub async fn list_monster_files(monsters_path: String) -> Result<Vec<MonsterListEntry>, String> {
    let base_path = PathBuf::from(&monsters_path);
    list_monsters_recursive(Path::new(&monsters_path), &base_path).map_err(|e| format!("Failed to list monster files: {}", e))
}

fn list_monsters_recursive(dir: &Path, base: &Path) -> Result<Vec<MonsterListEntry>> {
    let mut monsters = Vec::new();

    if !dir.exists() {
        return Ok(monsters);
    }

    let entries = fs::read_dir(dir).context(format!("Failed to read directory: {:?}", dir))?;

    for entry in entries {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            let sub_monsters = list_monsters_recursive(&path, base)?;
            monsters.extend(sub_monsters);
        } else if path.extension().and_then(|s| s.to_str()) == Some("lua") {
            if let Ok(content) = fs::read_to_string(&path) {
                let monster_name = match extract_monster_name_quick(&content) {
                    Ok(name) => name,
                    Err(_) => continue,
                };

                let relative_path = compute_relative_path(&path, base);
                let bestiary_class = extract_bestiary_class(&content);
                let is_boss = extract_boss_flag(&content);

                monsters.push(MonsterListEntry {
                    name: monster_name,
                    file_path: path.to_string_lossy().to_string(),
                    relative_path,
                    categories: Vec::new(),
                    bestiary_class,
                    is_boss,
                });
            }
        }
    }

    monsters.sort_by(|a, b| a.relative_path.to_lowercase().cmp(&b.relative_path.to_lowercase()));
    Ok(monsters)
}
fn extract_monster_name_quick(content: &str) -> Result<String> {
    let re = Regex::new(r#"Game\.createMonsterType\("([^"]+)"\)"#)?;
    let caps = re.captures(content).context("Failed to find monster name")?;
    Ok(caps[1].to_string())
}

fn extract_bestiary_class(content: &str) -> Option<String> {
    let block_re = Regex::new(r#"(?s)monster\.Bestiary\s*=\s*\{([^}]*)\}"#).ok()?;
    let class_re = Regex::new(r#"class\s*=\s*"([^"]+)""#).ok()?;

    let block = block_re.captures(content)?.get(1)?.as_str();
    let class_match = class_re.captures(block)?;
    let value = class_match.get(1)?.as_str().trim();
    if value.is_empty() {
        return None;
    }
    Some(value.to_string())
}

fn extract_boss_flag(content: &str) -> bool {
    let boss_re = Regex::new(r#"rewardBoss\s*=\s*true"#).unwrap();
    boss_re.is_match(content) || content.contains("monster.bosstiary")
}

#[command]
pub async fn load_monster_file(file_path: String) -> Result<Monster, String> {
    let content = fs::read_to_string(&file_path).map_err(|e| format!("Failed to read monster file: {}", e))?;

    let parser = LuaMonsterParser::new(content);
    parser.parse().map_err(|e| format!("Failed to parse monster file: {}", e))
}

#[command]
pub async fn save_monster_file(file_path: String, monster: Monster) -> Result<(), String> {
    let lua_content = generate_lua_from_monster(&monster).map_err(|e| format!("Failed to generate Lua: {}", e))?;

    fs::write(&file_path, lua_content).map_err(|e| format!("Failed to write monster file: {}", e))?;

    Ok(())
}

#[command]
pub async fn rename_monster_file(old_path: String, new_name: String, monsters_root: String) -> Result<RenameMonsterResult, String> {
    if new_name.trim().is_empty() {
        return Err("New monster name cannot be empty".into());
    }

    let old_path_buf = PathBuf::from(&old_path);
    if !old_path_buf.exists() {
        return Err("Original monster file was not found".into());
    }

    let parent_dir = old_path_buf.parent().ok_or_else(|| "Failed to determine monster directory".to_string())?;

    let slug = slugify_name(&new_name);
    let new_file_name = format!("{}.lua", slug);
    let new_path = parent_dir.join(&new_file_name);

    if new_path != old_path_buf && new_path.exists() {
        return Err("Another monster already uses this file name".into());
    }

    if new_path != old_path_buf {
        fs::rename(&old_path_buf, &new_path).map_err(|e| format!("Failed to rename monster file: {}", e))?;
    }

    let relative_path = compute_relative_path(&new_path, Path::new(&monsters_root));

    Ok(RenameMonsterResult {
        file_path: new_path.to_string_lossy().to_string(),
        relative_path,
    })
}

#[command]
pub async fn list_bestiary_classes(monsters_path: String) -> Result<Vec<String>, String> {
    let monsters_path = PathBuf::from(monsters_path);
    let definition_files = find_bestiary_definition_files(&monsters_path);

    for file_path in definition_files {
        let content = fs::read_to_string(&file_path).map_err(|e| format!("Failed to read bestiary definitions: {}", e))?;
        let classes = parse_bestiary_classes(&content);
        if !classes.is_empty() {
            return Ok(ensure_unknown_class(classes));
        }
    }

    Ok(vec!["Unknown".to_string()])
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
        "monster".to_string()
    } else {
        trimmed
    }
}

fn find_bestiary_definition_files(monsters_path: &Path) -> Vec<PathBuf> {
    let candidates = [
        PathBuf::from("src/creatures/creatures_definitions.hpp"),
        PathBuf::from("creatures/creatures_definitions.hpp"),
        PathBuf::from("utils_definitions.hpp"),
        PathBuf::from("data/utils_definitions.hpp"),
        PathBuf::from("src/utils/utils_definitions.hpp"),
    ];

    let mut current = Some(monsters_path);
    let mut results = Vec::new();
    let mut seen = HashSet::new();

    for _ in 0..8 {
        if let Some(dir) = current {
            for candidate in &candidates {
                let candidate_path = dir.join(candidate);
                if candidate_path.exists() {
                    let key = candidate_path.to_string_lossy().to_string();
                    if seen.insert(key) {
                        results.push(candidate_path);
                    }
                }
            }
            current = dir.parent();
        } else {
            break;
        }
    }

    results
}

fn parse_bestiary_classes(content: &str) -> Vec<String> {
    let mut classes = Vec::new();
    let mut inside_enum = false;

    for line in content.lines() {
        let trimmed = line.trim();
        if !inside_enum {
            if trimmed.starts_with("enum BestiaryType_t") {
                inside_enum = true;
            }
            continue;
        }

        if trimmed.starts_with("};") {
            break;
        }

        if let Some(remainder) = trimmed.strip_prefix("BESTY_RACE_") {
            let identifier = remainder.split(|c| c == '=' || c == ',' || c == ' ').next().unwrap_or("").trim();
            if identifier.is_empty() || matches!(identifier, "NONE" | "FIRST" | "LAST") {
                continue;
            }
            classes.push(format_bestiary_class_name(identifier));
        }
    }

    classes
}

fn format_bestiary_class_name(identifier: &str) -> String {
    identifier
        .split('_')
        .filter(|part| !part.is_empty())
        .map(|part| {
            let lower = part.to_ascii_lowercase();
            let mut chars = lower.chars();
            match chars.next() {
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn ensure_unknown_class(classes: Vec<String>) -> Vec<String> {
    let mut seen = HashSet::new();
    let mut ordered = Vec::new();

    for class_name in classes {
        let key = class_name.to_ascii_lowercase();
        if seen.insert(key) {
            ordered.push(class_name);
        }
    }

    if !seen.contains("unknown") {
        ordered.push("Unknown".to_string());
    }

    ordered
}

fn generate_lua_from_monster(monster: &Monster) -> Result<String> {
    let mut lua = String::new();

    let missing_fields: HashSet<&str> = monster.meta.missing_fields.iter().map(|s| s.as_str()).collect();
    let touched_fields: HashSet<&str> = monster.meta.touched_fields.iter().map(|s| s.as_str()).collect();
    let should_emit = |field: &str| !missing_fields.contains(field) || touched_fields.contains(field);

    // Header
    lua.push_str(&format!("local mType = Game.createMonsterType(\"{}\")\n", monster.name));
    lua.push_str("local monster = {}\n\n");

    // Basic info
    if should_emit("description") {
        lua.push_str(&format!("monster.description = \"{}\"\n", monster.description));
    }
    if should_emit("experience") {
        lua.push_str(&format!("monster.experience = {}\n", monster.experience));
    }

    // Outfit
    lua.push_str("monster.outfit = {\n");
    lua.push_str(&format!("\tlookType = {},\n", monster.outfit.look_type));
    lua.push_str(&format!("\tlookHead = {},\n", monster.outfit.look_head));
    lua.push_str(&format!("\tlookBody = {},\n", monster.outfit.look_body));
    lua.push_str(&format!("\tlookLegs = {},\n", monster.outfit.look_legs));
    lua.push_str(&format!("\tlookFeet = {},\n", monster.outfit.look_feet));
    lua.push_str(&format!("\tlookAddons = {},\n", monster.outfit.look_addons));
    lua.push_str(&format!("\tlookMount = {},\n", monster.outfit.look_mount));
    lua.push_str("}\n\n");

    if should_emit("raceId") {
        lua.push_str(&format!("monster.raceId = {}\n", monster.race_id));
    }

    // Bestiary
    if let Some(ref bestiary) = monster.bestiary {
        lua.push_str("monster.Bestiary = {\n");
        lua.push_str(&format!("\tclass = \"{}\",\n", bestiary.class));
        lua.push_str(&format!("\trace = {},\n", bestiary.race));
        lua.push_str(&format!("\ttoKill = {},\n", bestiary.to_kill));
        lua.push_str(&format!("\tFirstUnlock = {},\n", bestiary.first_unlock));
        lua.push_str(&format!("\tSecondUnlock = {},\n", bestiary.second_unlock));
        lua.push_str(&format!("\tCharmsPoints = {},\n", bestiary.charms_points));
        lua.push_str(&format!("\tStars = {},\n", bestiary.stars));
        lua.push_str(&format!("\tOccurrence = {},\n", bestiary.occurrence));
        lua.push_str(&format!("\tLocations = \"{}\",\n", bestiary.locations));
        lua.push_str("}\n\n");
    }

    // Bosstiary
    if let Some(ref bosstiary) = monster.bosstiary {
        lua.push_str("monster.bosstiary = {\n");
        lua.push_str(&format!("\tbossRaceId = {},\n", bosstiary.boss_race_id));
        lua.push_str(&format!("\tbossRace = {},\n", bosstiary.boss_race));
        lua.push_str("}\n\n");
    }

    // Events
    if !monster.events.is_empty() {
        lua.push_str("monster.events = {\n");
        for event_name in &monster.events {
            lua.push_str(&format!("\t\"{}\",\n", event_name));
        }
        lua.push_str("}\n\n");
    }

    // Stats
    if should_emit("health") {
        lua.push_str(&format!("monster.health = {}\n", monster.health));
    }
    if should_emit("maxHealth") {
        lua.push_str(&format!("monster.maxHealth = {}\n", monster.max_health));
    }
    if should_emit("race") {
        lua.push_str(&format!("monster.race = \"{}\"\n", monster.race));
    }
    if should_emit("corpse") {
        lua.push_str(&format!("monster.corpse = {}\n", monster.corpse));
    }
    if should_emit("speed") {
        lua.push_str(&format!("monster.speed = {}\n", monster.speed));
    }
    if should_emit("manaCost") {
        lua.push_str(&format!("monster.manaCost = {}\n", monster.mana_cost));
    }
    lua.push('\n');

    // Change target
    lua.push_str("monster.changeTarget = {\n");
    lua.push_str(&format!("\tinterval = {},\n", monster.change_target.interval));
    lua.push_str(&format!("\tchance = {},\n", monster.change_target.chance));
    lua.push_str("}\n\n");

    // Strategies
    lua.push_str("monster.strategiesTarget = {\n");
    lua.push_str(&format!("\tnearest = {},\n", monster.strategies_target.nearest));
    lua.push_str(&format!("\thealth = {},\n", monster.strategies_target.health));
    lua.push_str(&format!("\tdamage = {},\n", monster.strategies_target.damage));
    lua.push_str(&format!("\trandom = {},\n", monster.strategies_target.random));
    lua.push_str("}\n\n");

    // Flags
    lua.push_str("monster.flags = {\n");
    lua.push_str(&format!("\tsummonable = {},\n", monster.flags.summonable));
    lua.push_str(&format!("\tattackable = {},\n", monster.flags.attackable));
    lua.push_str(&format!("\thostile = {},\n", monster.flags.hostile));
    lua.push_str(&format!("\tconvinceable = {},\n", monster.flags.convinceable));
    lua.push_str(&format!("\tpushable = {},\n", monster.flags.pushable));
    lua.push_str(&format!("\trewardBoss = {},\n", monster.flags.reward_boss));
    lua.push_str(&format!("\tillusionable = {},\n", monster.flags.illusionable));
    lua.push_str(&format!("\tcanPushItems = {},\n", monster.flags.can_push_items));
    lua.push_str(&format!("\tcanPushCreatures = {},\n", monster.flags.can_push_creatures));
    lua.push_str(&format!("\tstaticAttackChance = {},\n", monster.flags.static_attack_chance));
    lua.push_str(&format!("\ttargetDistance = {},\n", monster.flags.target_distance));
    lua.push_str(&format!("\trunHealth = {},\n", monster.flags.run_health));
    lua.push_str(&format!("\thealthHidden = {},\n", monster.flags.health_hidden));
    lua.push_str(&format!("\tisBlockable = {},\n", monster.flags.is_blockable));
    lua.push_str(&format!("\tcanWalkOnEnergy = {},\n", monster.flags.can_walk_on_energy));
    lua.push_str(&format!("\tcanWalkOnFire = {},\n", monster.flags.can_walk_on_fire));
    lua.push_str(&format!("\tcanWalkOnPoison = {},\n", monster.flags.can_walk_on_poison));
    lua.push_str("}\n\n");

    // Light
    lua.push_str("monster.light = {\n");
    lua.push_str(&format!("\tlevel = {},\n", monster.light.level));
    lua.push_str(&format!("\tcolor = {},\n", monster.light.color));
    lua.push_str("}\n\n");

    // Summons
    if let Some(ref summon) = monster.summon {
        lua.push_str("monster.summon = {\n");
        lua.push_str(&format!("\tmaxSummons = {},\n", summon.max_summons));
        lua.push_str("\tsummons = {\n");
        for s in &summon.summons {
            lua.push_str(&format!("\t\t{{ name = \"{}\", chance = {}, interval = {}, count = {} }},\n", s.name, s.chance, s.interval, s.count));
        }
        lua.push_str("\t},\n");
        lua.push_str("}\n\n");
    }

    // Voices
    if let Some(ref voices) = monster.voices {
        lua.push_str("monster.voices = {\n");
        lua.push_str(&format!("\tinterval = {},\n", voices.interval));
        lua.push_str(&format!("\tchance = {},\n", voices.chance));
        for v in &voices.entries {
            lua.push_str(&format!("\t{{ text = \"{}\", yell = {} }},\n", v.text, v.yell));
        }
        lua.push_str("}\n\n");
    }

    // Loot
    lua.push_str("monster.loot = {\n");
    for l in &monster.loot {
        lua.push_str("\t{ ");
        if let Some(id) = l.id {
            lua.push_str(&format!("id = {}, ", id));
        }
        if let Some(ref name) = l.name {
            lua.push_str(&format!("name = \"{}\", ", name));
        }
        lua.push_str(&format!("chance = {}", l.chance));
        if let Some(min) = l.min_count {
            lua.push_str(&format!(", minCount = {}", min));
        }
        if let Some(max) = l.max_count {
            lua.push_str(&format!(", maxCount = {}", max));
        }
        lua.push_str(" },\n");
    }
    lua.push_str("}\n\n");

    // Attacks
    lua.push_str("monster.attacks = {\n");
    for a in &monster.attacks {
        lua.push_str(&format!("\t{{ name = \"{}\", interval = {}, chance = {}", a.name, a.interval, a.chance));
        if let Some(combat_type) = &a.combat_type {
            lua.push_str(&format!(", type = {}", combat_type));
        }
        if let Some(min) = a.min_damage {
            lua.push_str(&format!(", minDamage = {}", min));
        }
        if let Some(max) = a.max_damage {
            lua.push_str(&format!(", maxDamage = {}", max));
        }
        if let Some(range) = a.range {
            lua.push_str(&format!(", range = {}", range));
        }
        if let Some(radius) = a.radius {
            lua.push_str(&format!(", radius = {}", radius));
        }
        if let Some(target) = a.target {
            lua.push_str(&format!(", target = {}", target));
        }
        if let Some(ref effect) = a.effect {
            lua.push_str(&format!(", effect = {}", effect));
        }
        if let Some(ref shoot) = a.shoot_effect {
            lua.push_str(&format!(", shootEffect = {}", shoot));
        }
        if let Some(length) = a.length {
            lua.push_str(&format!(", length = {}", length));
        }
        if let Some(spread) = a.spread {
            lua.push_str(&format!(", spread = {}", spread));
        }
        if let Some(speed) = a.speed_change {
            lua.push_str(&format!(", speedChange = {}", speed));
        }
        if let Some(duration) = a.duration {
            lua.push_str(&format!(", duration = {}", duration));
        }
        if let Some(condition) = &a.condition {
            lua.push_str(", condition = { ");
            for (idx, prop) in condition.iter().enumerate() {
                if idx > 0 {
                    lua.push_str(", ");
                }
                lua.push_str(&format!("{} = {}", prop.key, prop.value));
            }
            lua.push_str(" }");
        }
        for prop in &a.extra_fields {
            lua.push_str(&format!(", {} = {}", prop.key, prop.value));
        }
        lua.push_str(" },\n");
    }
    lua.push_str("}\n\n");

    // Defenses
    lua.push_str("monster.defenses = {\n");
    lua.push_str(&format!("\tdefense = {},\n", monster.defenses.defense));
    lua.push_str(&format!("\tarmor = {},\n", monster.defenses.armor));
    lua.push_str(&format!("\tmitigation = {},\n", monster.defenses.mitigation));
    for d in &monster.defenses.entries {
        lua.push_str(&format!("\t{{ name = \"{}\", interval = {}, chance = {}", d.name, d.interval, d.chance));
        if let Some(combat_type) = &d.combat_type {
            lua.push_str(&format!(", type = {}", combat_type));
        }
        if let Some(min) = d.min_damage {
            lua.push_str(&format!(", minDamage = {}", min));
        }
        if let Some(max) = d.max_damage {
            lua.push_str(&format!(", maxDamage = {}", max));
        }
        if let Some(ref effect) = d.effect {
            lua.push_str(&format!(", effect = {}", effect));
        }
        if let Some(target) = d.target {
            lua.push_str(&format!(", target = {}", target));
        }
        if let Some(speed) = d.speed_change {
            lua.push_str(&format!(", speedChange = {}", speed));
        }
        if let Some(duration) = d.duration {
            lua.push_str(&format!(", duration = {}", duration));
        }
        if let Some(condition) = &d.condition {
            lua.push_str(", condition = { ");
            for (idx, prop) in condition.iter().enumerate() {
                if idx > 0 {
                    lua.push_str(", ");
                }
                lua.push_str(&format!("{} = {}", prop.key, prop.value));
            }
            lua.push_str(" }");
        }
        for prop in &d.extra_fields {
            lua.push_str(&format!(", {} = {}", prop.key, prop.value));
        }
        lua.push_str(" },\n");
    }
    lua.push_str("}\n\n");

    // Elements
    lua.push_str("monster.elements = {\n");
    for e in &monster.elements {
        lua.push_str(&format!("\t{{ type = {}, percent = {} }},\n", e.element_type, e.percent));
    }
    lua.push_str("}\n\n");

    // Immunities
    lua.push_str("monster.immunities = {\n");
    for i in &monster.immunities {
        lua.push_str(&format!("\t{{ type = \"{}\", condition = {} }},\n", i.immunity_type, i.condition));
    }
    lua.push_str("}\n\n");

    // Register
    lua.push_str("mType:register(monster)\n");

    Ok(lua)
}
