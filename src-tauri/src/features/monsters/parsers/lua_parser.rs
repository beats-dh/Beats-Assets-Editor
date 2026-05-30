use crate::features::monsters::types::*;
use anyhow::{anyhow, Context, Result};
use regex::Regex;
use std::collections::HashSet;
use std::fmt;

// Checked conversions from the parsed i64 to unsigned widths. A plain `as`
// cast would wrap negatives/overflow silently (e.g. -1 -> 4294967295),
// corrupting the monster instead of surfacing the bad input.
fn to_u32(field: &str, v: i64) -> Result<u32> {
    u32::try_from(v).map_err(|_| anyhow!("Field '{}' out of range for u32: {}", field, v))
}
fn to_u16(field: &str, v: i64) -> Result<u16> {
    u16::try_from(v).map_err(|_| anyhow!("Field '{}' out of range for u16: {}", field, v))
}

pub struct LuaMonsterParser {
    content: String,
}

impl LuaMonsterParser {
    pub fn new(content: String) -> Self {
        Self {
            content,
        }
    }

    pub fn parse(&self) -> Result<Monster> {
        let mut missing_fields: HashSet<String> = HashSet::new();

        let mut monster = Monster::default();

        monster.name = self.extract_monster_name()?;
        monster.description = self.extract_string_field_with_default("description", "", &mut missing_fields)?;
        monster.experience = to_u32("experience", self.extract_number_field_with_default("experience", 0, &mut missing_fields)?)?;
        monster.outfit = self.parse_outfit()?.unwrap_or_default();
        monster.race_id = to_u32("raceId", self.extract_number_field_with_default("raceId", 0, &mut missing_fields)?)?;
        monster.bestiary = self.parse_bestiary()?;
        monster.bosstiary = self.parse_bosstiary()?;
        monster.health = to_u32("health", self.extract_number_field_with_default("health", 0, &mut missing_fields)?)?;
        monster.max_health = to_u32("maxHealth", self.extract_number_field_with_default("maxHealth", 0, &mut missing_fields)?)?;
        monster.race = self.extract_string_field_with_default("race", "", &mut missing_fields)?;
        monster.corpse = to_u32("corpse", self.extract_number_field_with_default("corpse", 0, &mut missing_fields)?)?;
        monster.speed = to_u16("speed", self.extract_number_field_with_default("speed", 0, &mut missing_fields)?)?;
        monster.mana_cost = to_u16("manaCost", self.extract_number_field_with_default("manaCost", 0, &mut missing_fields)?)?;
        monster.change_target = self.parse_change_target()?.unwrap_or_default();
        monster.strategies_target = self.parse_strategies_target()?.unwrap_or_default();
        monster.flags = self.parse_flags()?.unwrap_or_default();
        monster.light = self.parse_light()?.unwrap_or_default();
        monster.events = self.parse_events()?;
        monster.summon = self.parse_summon()?;
        monster.voices = self.parse_voices()?;
        monster.loot = self.parse_loot()?;
        monster.attacks = self.parse_attacks()?;
        monster.defenses = self.parse_defenses()?.unwrap_or_default();
        monster.elements = self.parse_elements()?;
        monster.immunities = self.parse_immunities()?;

        let mut meta = MonsterMeta::default();
        if !missing_fields.is_empty() {
            let mut missing: Vec<String> = missing_fields.into_iter().collect();
            missing.sort();
            meta.missing_fields = missing;
        }

        monster.meta = meta;

        Ok(monster)
    }

    fn extract_monster_name(&self) -> Result<String> {
        let re = Regex::new(r#"Game\.createMonsterType\("([^"]+)"\)"#)?;
        let caps = re.captures(&self.content).context("Failed to find monster name")?;
        Ok(caps[1].to_string())
    }

    fn extract_string_field_optional(&self, field: &str) -> Result<Option<String>> {
        let pattern = format!(r#"monster\.{}\s*=\s*"([^"]*)""#, field);
        let re = Regex::new(&pattern)?;
        Ok(re.captures(&self.content).and_then(|caps| caps.get(1).map(|m| m.as_str().to_string())))
    }

    fn extract_string_field_with_default(&self, field: &str, default: &str, missing_fields: &mut HashSet<String>) -> Result<String> {
        match self.extract_string_field_optional(field)? {
            Some(value) => Ok(value),
            None => {
                missing_fields.insert(field.to_string());
                Ok(default.to_string())
            }
        }
    }

    fn extract_number_field_optional(&self, field: &str) -> Result<Option<i64>> {
        let pattern = format!(r"monster\.{}\s*=\s*(-?\d+)", field);
        let re = Regex::new(&pattern)?;
        Ok(re.captures(&self.content).and_then(|caps| caps.get(1).and_then(|m| m.as_str().parse().ok())))
    }

    fn extract_number_field_with_default(&self, field: &str, default: i64, missing_fields: &mut HashSet<String>) -> Result<i64> {
        match self.extract_number_field_optional(field)? {
            Some(value) => Ok(value),
            None => {
                missing_fields.insert(field.to_string());
                Ok(default)
            }
        }
    }

    fn parse_outfit(&self) -> Result<Option<MonsterOutfit>> {
        let Some(outfit_section) = self.extract_table_optional("outfit")? else {
            return Ok(None);
        };

        Ok(Some(MonsterOutfit {
            look_type: self.num_or(&outfit_section, "lookType", 0) as u32,
            look_head: self.num_or(&outfit_section, "lookHead", 0) as u8,
            look_body: self.num_or(&outfit_section, "lookBody", 0) as u8,
            look_legs: self.num_or(&outfit_section, "lookLegs", 0) as u8,
            look_feet: self.num_or(&outfit_section, "lookFeet", 0) as u8,
            look_addons: self.num_or(&outfit_section, "lookAddons", 0) as u8,
            look_mount: self.num_or(&outfit_section, "lookMount", 0) as u16,
        }))
    }

    fn parse_bestiary(&self) -> Result<Option<MonsterBestiary>> {
        let Some(bestiary_section) = self.extract_table_optional("Bestiary")? else {
            return Ok(None);
        };

        Ok(Some(MonsterBestiary {
            class: self.str_or(&bestiary_section, "class"),
            race: self.ident_or(&bestiary_section, "race"),
            to_kill: self.num_or(&bestiary_section, "toKill", 0) as u32,
            first_unlock: self.num_or(&bestiary_section, "FirstUnlock", 0) as u32,
            second_unlock: self.num_or(&bestiary_section, "SecondUnlock", 0) as u32,
            charms_points: self.num_or(&bestiary_section, "CharmsPoints", 0) as u32,
            stars: self.num_or(&bestiary_section, "Stars", 0) as u8,
            occurrence: self.num_or(&bestiary_section, "Occurrence", 0) as u8,
            locations: self.str_or(&bestiary_section, "Locations"),
        }))
    }

    fn parse_bosstiary(&self) -> Result<Option<MonsterBosstiary>> {
        let Some(section) = self.extract_table_optional("bosstiary")? else {
            return Ok(None);
        };

        Ok(Some(MonsterBosstiary {
            boss_race_id: self.num_or(&section, "bossRaceId", 0) as u32,
            boss_race: self.ident_or(&section, "bossRace"),
        }))
    }

    fn parse_change_target(&self) -> Result<Option<ChangeTarget>> {
        let Some(section) = self.extract_table_optional("changeTarget")? else {
            return Ok(None);
        };

        Ok(Some(ChangeTarget {
            interval: self.num_or(&section, "interval", 0) as u32,
            chance: self.num_or(&section, "chance", 0) as u8,
        }))
    }

    fn parse_strategies_target(&self) -> Result<Option<StrategiesTarget>> {
        let Some(section) = self.extract_table_optional("strategiesTarget")? else {
            return Ok(None);
        };

        Ok(Some(StrategiesTarget {
            nearest: self.num_or(&section, "nearest", 0) as u8,
            health: self.num_or(&section, "health", 0) as u8,
            damage: self.num_or(&section, "damage", 0) as u8,
            random: self.num_or(&section, "random", 0) as u8,
        }))
    }

    fn parse_flags(&self) -> Result<Option<MonsterFlags>> {
        let Some(section) = self.extract_table_optional("flags")? else {
            return Ok(None);
        };

        Ok(Some(MonsterFlags {
            summonable: self.bool_or(&section, "summonable", false),
            attackable: self.bool_or(&section, "attackable", false),
            hostile: self.bool_or(&section, "hostile", false),
            convinceable: self.bool_or(&section, "convinceable", false),
            pushable: self.bool_or(&section, "pushable", false),
            reward_boss: self.bool_or(&section, "rewardBoss", false),
            illusionable: self.bool_or(&section, "illusionable", false),
            can_push_items: self.bool_or(&section, "canPushItems", false),
            can_push_creatures: self.bool_or(&section, "canPushCreatures", false),
            static_attack_chance: self.num_or(&section, "staticAttackChance", 0) as u8,
            target_distance: self.num_or(&section, "targetDistance", 0) as u8,
            run_health: self.num_or(&section, "runHealth", 0) as u16,
            health_hidden: self.bool_or(&section, "healthHidden", false),
            is_blockable: self.bool_or(&section, "isBlockable", false),
            can_walk_on_energy: self.bool_or(&section, "canWalkOnEnergy", false),
            can_walk_on_fire: self.bool_or(&section, "canWalkOnFire", false),
            can_walk_on_poison: self.bool_or(&section, "canWalkOnPoison", false),
        }))
    }

    fn parse_light(&self) -> Result<Option<MonsterLight>> {
        let Some(section) = self.extract_table_optional("light")? else {
            return Ok(None);
        };

        Ok(Some(MonsterLight {
            level: self.num_or(&section, "level", 0) as u8,
            color: self.num_or(&section, "color", 0) as u8,
        }))
    }

    fn parse_events(&self) -> Result<Vec<String>> {
        let Some(section) = self.extract_table_last_optional("events")? else {
            return Ok(Vec::new());
        };
        let re = Regex::new(r#""((?:\\.|[^"])*)""#)?;
        let mut events = Vec::new();
        for caps in re.captures_iter(&section) {
            events.push(caps[1].to_string());
        }
        Ok(events)
    }

    fn parse_summon(&self) -> Result<Option<MonsterSummon>> {
        let Some(section) = self.extract_table_optional("summon")? else {
            return Ok(None);
        };
        let max_summons = self.num_or(&section, "maxSummons", 0) as u8;

        let summons_re = Regex::new(r#"\{\s*name\s*=\s*"([^"]+)"\s*,\s*chance\s*=\s*(\d+)\s*,\s*interval\s*=\s*(\d+)\s*,\s*count\s*=\s*(\d+)\s*\}"#)?;
        let mut summons = Vec::new();

        for caps in summons_re.captures_iter(&section) {
            summons.push(SummonEntry {
                name: caps[1].to_string(),
                chance: caps[2].parse()?,
                interval: caps[3].parse()?,
                count: caps[4].parse()?,
            });
        }

        Ok(Some(MonsterSummon {
            max_summons,
            summons,
        }))
    }

    fn parse_voices(&self) -> Result<Option<MonsterVoices>> {
        let Some(section) = self.extract_table_optional("voices")? else {
            return Ok(None);
        };
        let interval = self.num_or(&section, "interval", 0) as u32;
        let chance = self.num_or(&section, "chance", 0) as u8;
        let text_re = Regex::new(r#"text\s*=\s*"([^"]+)""#)?;
        let yell_re = Regex::new(r"yell\s*=\s*(true|false)")?;

        let mut entries = Vec::new();
        for raw_entry in Self::split_top_level_entries(&section) {
            if !raw_entry.contains("text") {
                continue;
            }

            let mut voice = VoiceEntry::default();
            if let Some(caps) = text_re.captures(&raw_entry) {
                voice.text = caps[1].to_string();
            } else {
                continue;
            }

            if let Some(caps) = yell_re.captures(&raw_entry) {
                voice.yell = &caps[1] == "true";
            }

            entries.push(voice);
        }

        Ok(Some(MonsterVoices {
            interval,
            chance,
            entries,
        }))
    }

    fn parse_loot(&self) -> Result<Vec<LootEntry>> {
        let Some(section) = self.extract_table_optional("loot")? else {
            return Ok(Vec::new());
        };
        let id_re = Regex::new(r"id\s*=\s*(\d+)")?;
        let name_re = Regex::new(r#"name\s*=\s*"([^"]+)""#)?;
        let chance_re = Regex::new(r"chance\s*=\s*(\d+)")?;
        let min_re = Regex::new(r"minCount\s*=\s*(\d+)")?;
        let max_re = Regex::new(r"maxCount\s*=\s*(\d+)")?;

        let mut loot = Vec::new();
        for raw_entry in Self::split_top_level_entries(&section) {
            let mut entry = LootEntry::default();

            if let Some(caps) = id_re.captures(&raw_entry) {
                entry.id = Some(caps[1].parse()?);
            }

            if let Some(caps) = name_re.captures(&raw_entry) {
                entry.name = Some(caps[1].to_string());
            }

            if let Some(caps) = chance_re.captures(&raw_entry) {
                entry.chance = caps[1].parse()?;
            }

            if let Some(caps) = min_re.captures(&raw_entry) {
                entry.min_count = Some(caps[1].parse()?);
            }

            if let Some(caps) = max_re.captures(&raw_entry) {
                entry.max_count = Some(caps[1].parse()?);
            }

            if entry.name.is_none() && entry.id.is_none() && entry.chance == 0 {
                continue;
            }

            loot.push(entry);
        }

        Ok(loot)
    }

    fn parse_attacks(&self) -> Result<Vec<AttackEntry>> {
        let Some(section) = self.extract_table_optional("attacks")? else {
            return Ok(Vec::new());
        };
        self.parse_spell_entries(&section, true)
    }

    fn parse_defenses(&self) -> Result<Option<MonsterDefenses>> {
        let Some(section) = self.extract_table_optional("defenses")? else {
            return Ok(None);
        };
        let defense = self.num_or(&section, "defense", 0) as u16;
        let armor = self.num_or(&section, "armor", 0) as u16;
        let mitigation = self.float_or(&section, "mitigation", 0.0);

        let entries_vec = self.parse_spell_entries(&section, false)?;
        let entries = entries_vec
            .into_iter()
            .map(|attack| DefenseEntry {
                name: attack.name,
                interval: attack.interval,
                chance: attack.chance,
                min_damage: attack.min_damage,
                max_damage: attack.max_damage,
                effect: attack.effect,
                target: attack.target,
                combat_type: attack.combat_type,
                speed_change: attack.speed_change,
                duration: attack.duration,
                condition: attack.condition,
                extra_fields: attack.extra_fields,
            })
            .collect();

        Ok(Some(MonsterDefenses {
            defense,
            armor,
            mitigation,
            entries,
        }))
    }

    fn parse_spell_entries(&self, section: &str, _is_attack: bool) -> Result<Vec<AttackEntry>> {
        let mut spells = Vec::new();

        for raw_entry in Self::split_top_level_entries(section) {
            let mut assignments = Self::parse_assignments(&raw_entry);
            if assignments.is_empty() {
                continue;
            }

            let name_value = match Self::take_assignment(&mut assignments, "name") {
                Some(value) => value,
                None => continue,
            };
            let mut entry = AttackEntry::default();
            entry.name = Self::strip_quotes(&name_value);
            let mut extras: Vec<LuaProperty> = Vec::new();

            if let Some(value) = Self::take_assignment(&mut assignments, "interval") {
                entry.interval = Self::parse_numeric::<u32>(&value, "interval")?;
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "chance") {
                entry.chance = Self::parse_numeric::<u8>(&value, "chance")?;
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "minDamage") {
                entry.min_damage = Some(Self::parse_numeric::<i32>(&value, "minDamage")?);
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "maxDamage") {
                entry.max_damage = Some(Self::parse_numeric::<i32>(&value, "maxDamage")?);
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "type") {
                entry.combat_type = Some(Self::strip_quotes(&value));
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "range") {
                entry.range = Some(Self::parse_numeric::<u8>(&value, "range")?);
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "radius") {
                entry.radius = Some(Self::parse_numeric::<u8>(&value, "radius")?);
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "target") {
                entry.target = Self::parse_bool(&value);
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "effect") {
                entry.effect = Some(Self::strip_quotes(&value));
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "shootEffect") {
                entry.shoot_effect = Some(Self::strip_quotes(&value));
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "speedChange") {
                entry.speed_change = Some(Self::parse_numeric::<i16>(&value, "speedChange")?);
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "duration") {
                entry.duration = Some(Self::parse_numeric::<u32>(&value, "duration")?);
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "length") {
                entry.length = Some(Self::parse_numeric::<u8>(&value, "length")?);
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "spread") {
                entry.spread = Some(Self::parse_numeric::<u8>(&value, "spread")?);
            }

            if let Some(value) = Self::take_assignment(&mut assignments, "condition") {
                if let Some(condition) = Self::parse_inline_table_properties(&value) {
                    entry.condition = Some(condition);
                } else {
                    extras.push(LuaProperty {
                        key: "condition".to_string(),
                        value,
                    });
                }
            }

            if !assignments.is_empty() {
                extras.extend(assignments.into_iter().map(|(key, value)| LuaProperty {
                    key,
                    value,
                }));
            }

            if !extras.is_empty() {
                entry.extra_fields = extras;
            }

            spells.push(entry);
        }

        Ok(spells)
    }

    fn parse_elements(&self) -> Result<Vec<ElementEntry>> {
        let Some(section) = self.extract_table_optional("elements")? else {
            return Ok(Vec::new());
        };
        let type_re = Regex::new(r"type\s*=\s*([A-Z_]+)")?;
        let percent_re = Regex::new(r"percent\s*=\s*(-?\d+)")?;

        let mut elements = Vec::new();
        for raw_entry in Self::split_top_level_entries(&section) {
            let element_type = match type_re.captures(&raw_entry) {
                Some(caps) => caps[1].to_string(),
                None => continue,
            };

            let percent = match percent_re.captures(&raw_entry) {
                Some(caps) => caps[1].parse()?,
                None => continue,
            };

            elements.push(ElementEntry {
                element_type,
                percent,
            });
        }

        Ok(elements)
    }

    fn parse_immunities(&self) -> Result<Vec<ImmunityEntry>> {
        let Some(section) = self.extract_table_optional("immunities")? else {
            return Ok(Vec::new());
        };
        let type_re = Regex::new(r#"type\s*=\s*"([^"]+)""#)?;
        let condition_re = Regex::new(r"condition\s*=\s*(true|false)")?;

        let mut immunities = Vec::new();
        for raw_entry in Self::split_top_level_entries(&section) {
            let immunity_type = match type_re.captures(&raw_entry) {
                Some(caps) => caps[1].to_string(),
                None => continue,
            };

            let condition = condition_re.captures(&raw_entry).map(|caps| &caps[1] == "true").unwrap_or(false);

            immunities.push(ImmunityEntry {
                immunity_type,
                condition,
            });
        }

        Ok(immunities)
    }

    // Helper methods
    fn extract_table(&self, table_name: &str) -> Result<String> {
        self.extract_table_internal(table_name, false)
    }

    fn extract_table_last(&self, table_name: &str) -> Result<String> {
        self.extract_table_internal(table_name, true)
    }

    /// Like `extract_table` but distinguishes an absent section (`Ok(None)`)
    /// from one that is present yet structurally broken (`Err`). This lets the
    /// caller default a missing section without masking real corruption.
    fn extract_table_optional(&self, table_name: &str) -> Result<Option<String>> {
        if !self.content.contains(&format!("monster.{}", table_name)) {
            return Ok(None);
        }
        self.extract_table(table_name).map(Some)
    }

    fn extract_table_last_optional(&self, table_name: &str) -> Result<Option<String>> {
        if !self.content.contains(&format!("monster.{}", table_name)) {
            return Ok(None);
        }
        self.extract_table_last(table_name).map(Some)
    }

    // Defaulting field accessors: a missing field within a present section uses
    // the default rather than discarding the whole section.
    fn num_or(&self, section: &str, field: &str, default: i64) -> i64 {
        self.extract_from_section(section, field).unwrap_or(default)
    }
    fn float_or(&self, section: &str, field: &str, default: f32) -> f32 {
        self.extract_float_from_section(section, field).unwrap_or(default)
    }
    fn bool_or(&self, section: &str, field: &str, default: bool) -> bool {
        self.extract_bool_from_section(section, field).unwrap_or(default)
    }
    fn str_or(&self, section: &str, field: &str) -> String {
        self.extract_string_from_section(section, field).unwrap_or_default()
    }
    fn ident_or(&self, section: &str, field: &str) -> String {
        self.extract_identifier_or_string_from_section(section, field).unwrap_or_default()
    }

    fn extract_table_internal(&self, table_name: &str, search_from_end: bool) -> Result<String> {
        let search = format!("monster.{}", table_name);
        let content = &self.content;
        let start_pos = if search_from_end {
            content.rfind(&search).context(format!("Failed to find table: {}", table_name))?
        } else {
            content.find(&search).context(format!("Failed to find table: {}", table_name))?
        };

        let bytes = content.as_bytes();
        let len = bytes.len();
        let mut idx = start_pos + search.len();

        while idx < len && bytes[idx].is_ascii_whitespace() {
            idx += 1;
        }

        if idx >= len || bytes[idx] != b'=' {
            return Err(anyhow!("Failed to find '=' for table: {}", table_name));
        }

        idx += 1;
        while idx < len && bytes[idx].is_ascii_whitespace() {
            idx += 1;
        }

        if idx >= len || bytes[idx] != b'{' {
            return Err(anyhow!("Failed to locate opening brace for table: {}", table_name));
        }

        let start = idx + 1;
        let mut depth = 1;
        let mut cursor = start;

        while cursor < len {
            match bytes[cursor] {
                b'{' => {
                    depth += 1;
                    cursor += 1;
                }
                b'}' => {
                    depth -= 1;
                    if depth == 0 {
                        return Ok(content[start..cursor].to_string());
                    }
                    cursor += 1;
                }
                b'"' => {
                    cursor += 1;
                    while cursor < len {
                        if bytes[cursor] == b'\\' {
                            cursor += 2;
                        } else if bytes[cursor] == b'"' {
                            cursor += 1;
                            break;
                        } else {
                            cursor += 1;
                        }
                    }
                }
                _ => {
                    cursor += 1;
                }
            }
        }

        Err(anyhow!("Failed to find closing brace for table: {}", table_name))
    }

    fn split_top_level_entries(section: &str) -> Vec<String> {
        let bytes = section.as_bytes();
        let len = bytes.len();
        let mut entries = Vec::new();
        let mut i = 0;

        while i < len {
            if bytes[i] == b'{' {
                let start = i + 1;
                let mut depth = 1;
                let mut j = start;

                while j < len {
                    match bytes[j] {
                        b'{' => {
                            depth += 1;
                            j += 1;
                        }
                        b'}' => {
                            depth -= 1;
                            if depth == 0 {
                                let fragment = section[start..j].trim();
                                if !fragment.is_empty() {
                                    entries.push(fragment.to_string());
                                }
                                j += 1;
                                i = j;
                                break;
                            }
                            j += 1;
                        }
                        b'"' => {
                            j += 1;
                            while j < len {
                                if bytes[j] == b'\\' {
                                    j += 2;
                                } else if bytes[j] == b'"' {
                                    j += 1;
                                    break;
                                } else {
                                    j += 1;
                                }
                            }
                        }
                        _ => {
                            j += 1;
                        }
                    }
                }

                if j >= len {
                    break;
                }
            } else {
                i += 1;
            }
        }

        entries
    }

    fn parse_assignments(entry: &str) -> Vec<(String, String)> {
        let bytes = entry.as_bytes();
        let len = bytes.len();
        let mut pairs = Vec::new();
        let mut i = 0;

        while i < len {
            while i < len && bytes[i].is_ascii_whitespace() {
                i += 1;
            }
            if i >= len {
                break;
            }
            if bytes[i] == b'-' && i + 1 < len && bytes[i + 1] == b'-' {
                break;
            }
            if bytes[i] == b',' {
                i += 1;
                continue;
            }

            let key_start = i;
            while i < len && (bytes[i].is_ascii_alphanumeric() || bytes[i] == b'_' || bytes[i] == b'.') {
                i += 1;
            }
            if key_start == i {
                i += 1;
                continue;
            }

            let key = entry[key_start..i].trim().to_string();
            while i < len && bytes[i].is_ascii_whitespace() {
                i += 1;
            }
            if i >= len || bytes[i] != b'=' {
                while i < len && bytes[i] != b',' {
                    if bytes[i] == b'-' && i + 1 < len && bytes[i + 1] == b'-' {
                        i = len;
                        break;
                    }
                    i += 1;
                }
                continue;
            }
            i += 1;
            while i < len && bytes[i].is_ascii_whitespace() {
                i += 1;
            }
            let value_start = i;
            let mut depth = 0;
            let mut in_string = false;

            while i < len {
                let c = bytes[i];
                if in_string {
                    if c == b'\\' && i + 1 < len {
                        i += 2;
                        continue;
                    }
                    if c == b'"' {
                        in_string = false;
                    }
                    i += 1;
                    continue;
                }

                match c {
                    b'"' => {
                        in_string = true;
                        i += 1;
                    }
                    b'{' => {
                        depth += 1;
                        i += 1;
                    }
                    b'}' => {
                        if depth == 0 {
                            break;
                        }
                        depth -= 1;
                        i += 1;
                    }
                    b',' => {
                        if depth == 0 {
                            break;
                        }
                        i += 1;
                    }
                    b'-' if i + 1 < len && bytes[i + 1] == b'-' && depth == 0 => {
                        break;
                    }
                    _ => i += 1,
                }
            }

            let mut value = entry[value_start..i].trim().to_string();
            if value.ends_with(',') {
                value.pop();
                value = value.trim().to_string();
            }

            pairs.push((key, value));

            while i < len && bytes[i] != b',' {
                if bytes[i] == b'-' && i + 1 < len && bytes[i + 1] == b'-' {
                    i = len;
                    break;
                }
                i += 1;
            }
            if i < len && bytes[i] == b',' {
                i += 1;
            }
        }

        pairs
    }

    fn take_assignment(assignments: &mut Vec<(String, String)>, key: &str) -> Option<String> {
        if let Some(index) = assignments.iter().position(|(k, _)| k == key) {
            Some(assignments.remove(index).1)
        } else {
            None
        }
    }

    fn parse_inline_table_properties(value: &str) -> Option<Vec<LuaProperty>> {
        let trimmed = value.trim();
        if !trimmed.starts_with('{') || !trimmed.ends_with('}') {
            return None;
        }

        let inner = trimmed.trim_start_matches('{').trim_end_matches('}').trim();

        if inner.is_empty() {
            return Some(Vec::new());
        }

        let assignments = Self::parse_assignments(inner);
        if assignments.is_empty() {
            return Some(Vec::new());
        }

        Some(
            assignments
                .into_iter()
                .map(|(key, value)| LuaProperty {
                    key,
                    value,
                })
                .collect(),
        )
    }

    fn parse_bool(value: &str) -> Option<bool> {
        match value.trim() {
            "true" => Some(true),
            "false" => Some(false),
            _ => None,
        }
    }

    fn strip_quotes(value: &str) -> String {
        let trimmed = value.trim();
        if (trimmed.starts_with('"') && trimmed.ends_with('"')) || (trimmed.starts_with('\'') && trimmed.ends_with('\'')) {
            trimmed[1..trimmed.len() - 1].to_string()
        } else {
            trimmed.to_string()
        }
    }

    fn parse_numeric<T>(value: &str, field: &str) -> Result<T>
    where
        T: TryFrom<i64>,
        <T as TryFrom<i64>>::Error: fmt::Display,
    {
        let trimmed = value.trim();
        let parsed: i64 = trimmed.parse()?;
        T::try_from(parsed).map_err(|err| anyhow!("Failed to parse {} value '{}': {}", field, trimmed, err))
    }

    fn extract_from_section(&self, section: &str, field: &str) -> Result<i64> {
        let pattern = format!(r"{}\s*=\s*(-?\d+)", field);
        let re = Regex::new(&pattern)?;
        let caps = re.captures(section).context(format!("Failed to find field: {}", field))?;
        Ok(caps[1].parse()?)
    }

    fn extract_float_from_section(&self, section: &str, field: &str) -> Result<f32> {
        let pattern = format!(r"{}\s*=\s*(-?\d+\.?\d*)", field);
        let re = Regex::new(&pattern)?;
        let caps = re.captures(section).context(format!("Failed to find field: {}", field))?;
        Ok(caps[1].parse()?)
    }

    fn extract_string_from_section(&self, section: &str, field: &str) -> Result<String> {
        let pattern = format!(r#"{}\s*=\s*"([^"]*)""#, field);
        let re = Regex::new(&pattern)?;
        let caps = re.captures(section).context(format!("Failed to find field: {}", field))?;
        Ok(caps[1].to_string())
    }

    fn extract_identifier_or_string_from_section(&self, section: &str, field: &str) -> Result<String> {
        let pattern = format!(r#"{}\s*=\s*(?:"([^"]*)"|([A-Za-z0-9_\.]+))"#, field);
        let re = Regex::new(&pattern)?;
        let caps = re.captures(section).context(format!("Failed to find field: {}", field))?;
        if let Some(m) = caps.get(1) {
            return Ok(m.as_str().to_string());
        }
        if let Some(m) = caps.get(2) {
            return Ok(m.as_str().to_string());
        }
        Err(anyhow!("Failed to parse identifier or string for {}", field))
    }

    fn extract_bool_from_section(&self, section: &str, field: &str) -> Result<bool> {
        let pattern = format!(r"{}\s*=\s*(true|false)", field);
        let re = Regex::new(&pattern)?;
        let caps = re.captures(section).context(format!("Failed to find field: {}", field))?;
        Ok(&caps[1] == "true")
    }
}
