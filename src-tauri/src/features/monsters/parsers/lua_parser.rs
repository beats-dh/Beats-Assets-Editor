use crate::features::monsters::types::*;
use anyhow::{anyhow, Context, Result};
use regex::Regex;
use std::collections::HashSet;
use std::fmt;

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
        monster.experience = self.extract_number_field_with_default("experience", 0, &mut missing_fields)? as u32;
        monster.outfit = self.parse_outfit().unwrap_or_default();
        monster.race_id = self.extract_number_field_with_default("raceId", 0, &mut missing_fields)? as u32;
        monster.bestiary = self.parse_bestiary().ok();
        monster.bosstiary = self.parse_bosstiary().ok();
        monster.health = self.extract_number_field_with_default("health", 0, &mut missing_fields)? as u32;
        monster.max_health = self.extract_number_field_with_default("maxHealth", 0, &mut missing_fields)? as u32;
        monster.race = self.extract_string_field_with_default("race", "", &mut missing_fields)?;
        monster.corpse = self.extract_number_field_with_default("corpse", 0, &mut missing_fields)? as u32;
        monster.speed = self.extract_number_field_with_default("speed", 0, &mut missing_fields)? as u16;
        monster.mana_cost = self.extract_number_field_with_default("manaCost", 0, &mut missing_fields)? as u16;
        monster.change_target = self.parse_change_target().unwrap_or_default();
        monster.strategies_target = self.parse_strategies_target().unwrap_or_default();
        monster.flags = self.parse_flags().unwrap_or_default();
        monster.light = self.parse_light().unwrap_or_default();
        monster.events = self.parse_events().unwrap_or_default();
        monster.summon = self.parse_summon().ok();
        monster.voices = self.parse_voices().ok();
        monster.loot = self.parse_loot().unwrap_or_default();
        monster.attacks = self.parse_attacks().unwrap_or_default();
        monster.defenses = self.parse_defenses().unwrap_or_default();
        monster.elements = self.parse_elements().unwrap_or_default();
        monster.immunities = self.parse_immunities().unwrap_or_default();

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

    fn parse_outfit(&self) -> Result<MonsterOutfit> {
        let outfit_section = self.extract_table("outfit")?;

        Ok(MonsterOutfit {
            look_type: self.extract_from_section(&outfit_section, "lookType")? as u32,
            look_head: self.extract_from_section(&outfit_section, "lookHead")? as u8,
            look_body: self.extract_from_section(&outfit_section, "lookBody")? as u8,
            look_legs: self.extract_from_section(&outfit_section, "lookLegs")? as u8,
            look_feet: self.extract_from_section(&outfit_section, "lookFeet")? as u8,
            look_addons: self.extract_from_section(&outfit_section, "lookAddons")? as u8,
            look_mount: self.extract_from_section(&outfit_section, "lookMount")? as u16,
        })
    }

    fn parse_bestiary(&self) -> Result<MonsterBestiary> {
        let bestiary_section = self.extract_table("Bestiary")?;

        Ok(MonsterBestiary {
            class: self.extract_string_from_section(&bestiary_section, "class")?,
            race: self.extract_identifier_or_string_from_section(&bestiary_section, "race")?,
            to_kill: self.extract_from_section(&bestiary_section, "toKill")? as u32,
            first_unlock: self.extract_from_section(&bestiary_section, "FirstUnlock")? as u32,
            second_unlock: self.extract_from_section(&bestiary_section, "SecondUnlock")? as u32,
            charms_points: self.extract_from_section(&bestiary_section, "CharmsPoints")? as u32,
            stars: self.extract_from_section(&bestiary_section, "Stars")? as u8,
            occurrence: self.extract_from_section(&bestiary_section, "Occurrence")? as u8,
            locations: self.extract_string_from_section(&bestiary_section, "Locations")?,
        })
    }

    fn parse_bosstiary(&self) -> Result<MonsterBosstiary> {
        let section = self.extract_table("bosstiary")?;

        Ok(MonsterBosstiary {
            boss_race_id: self.extract_from_section(&section, "bossRaceId")? as u32,
            boss_race: self.extract_identifier_or_string_from_section(&section, "bossRace")?,
        })
    }

    fn parse_change_target(&self) -> Result<ChangeTarget> {
        let section = self.extract_table("changeTarget")?;

        Ok(ChangeTarget {
            interval: self.extract_from_section(&section, "interval")? as u32,
            chance: self.extract_from_section(&section, "chance")? as u8,
        })
    }

    fn parse_strategies_target(&self) -> Result<StrategiesTarget> {
        let section = self.extract_table("strategiesTarget")?;

        Ok(StrategiesTarget {
            nearest: self.extract_from_section(&section, "nearest")? as u8,
            health: self.extract_from_section(&section, "health")? as u8,
            damage: self.extract_from_section(&section, "damage")? as u8,
            random: self.extract_from_section(&section, "random")? as u8,
        })
    }

    fn parse_flags(&self) -> Result<MonsterFlags> {
        let section = self.extract_table("flags")?;

        Ok(MonsterFlags {
            summonable: self.extract_bool_from_section(&section, "summonable")?,
            attackable: self.extract_bool_from_section(&section, "attackable")?,
            hostile: self.extract_bool_from_section(&section, "hostile")?,
            convinceable: self.extract_bool_from_section(&section, "convinceable")?,
            pushable: self.extract_bool_from_section(&section, "pushable")?,
            reward_boss: self.extract_bool_from_section(&section, "rewardBoss")?,
            illusionable: self.extract_bool_from_section(&section, "illusionable")?,
            can_push_items: self.extract_bool_from_section(&section, "canPushItems")?,
            can_push_creatures: self.extract_bool_from_section(&section, "canPushCreatures")?,
            static_attack_chance: self.extract_from_section(&section, "staticAttackChance")? as u8,
            target_distance: self.extract_from_section(&section, "targetDistance")? as u8,
            run_health: self.extract_from_section(&section, "runHealth")? as u16,
            health_hidden: self.extract_bool_from_section(&section, "healthHidden")?,
            is_blockable: self.extract_bool_from_section(&section, "isBlockable")?,
            can_walk_on_energy: self.extract_bool_from_section(&section, "canWalkOnEnergy")?,
            can_walk_on_fire: self.extract_bool_from_section(&section, "canWalkOnFire")?,
            can_walk_on_poison: self.extract_bool_from_section(&section, "canWalkOnPoison")?,
        })
    }

    fn parse_light(&self) -> Result<MonsterLight> {
        let section = self.extract_table("light")?;

        Ok(MonsterLight {
            level: self.extract_from_section(&section, "level")? as u8,
            color: self.extract_from_section(&section, "color")? as u8,
        })
    }

    fn parse_events(&self) -> Result<Vec<String>> {
        let section = self.extract_table_last("events")?;
        let re = Regex::new(r#""((?:\\.|[^"])*)""#)?;
        let mut events = Vec::new();
        for caps in re.captures_iter(&section) {
            events.push(caps[1].to_string());
        }
        Ok(events)
    }

    fn parse_summon(&self) -> Result<MonsterSummon> {
        let section = self.extract_table("summon")?;
        let max_summons = self.extract_from_section(&section, "maxSummons")? as u8;

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

        Ok(MonsterSummon {
            max_summons,
            summons,
        })
    }

    fn parse_voices(&self) -> Result<MonsterVoices> {
        let section = self.extract_table("voices")?;
        let interval = self.extract_from_section(&section, "interval")? as u32;
        let chance = self.extract_from_section(&section, "chance")? as u8;
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

        Ok(MonsterVoices {
            interval,
            chance,
            entries,
        })
    }

    fn parse_loot(&self) -> Result<Vec<LootEntry>> {
        let section = self.extract_table("loot")?;
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
        let section = self.extract_table("attacks")?;
        self.parse_spell_entries(&section, true)
    }

    fn parse_defenses(&self) -> Result<MonsterDefenses> {
        let section = self.extract_table("defenses")?;
        let defense = self.extract_from_section(&section, "defense")? as u16;
        let armor = self.extract_from_section(&section, "armor")? as u16;
        let mitigation = self.extract_float_from_section(&section, "mitigation")?;

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

        Ok(MonsterDefenses {
            defense,
            armor,
            mitigation,
            entries,
        })
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
        let section = self.extract_table("elements")?;
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
        let section = self.extract_table("immunities")?;
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
