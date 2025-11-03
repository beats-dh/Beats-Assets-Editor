use crate::features::monsters::types::*;
use anyhow::{Context, Result};
use regex::Regex;
use std::collections::HashSet;

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
        monster.outfit = match self.parse_outfit() {
            Ok(value) => value,
            Err(_) => MonsterOutfit::default(),
        };
        monster.race_id = self.extract_number_field_with_default("raceId", 0, &mut missing_fields)? as u32;
        monster.bestiary = self.parse_bestiary().ok();
        monster.health = self.extract_number_field_with_default("health", 0, &mut missing_fields)? as u32;
        monster.max_health = self.extract_number_field_with_default("maxHealth", 0, &mut missing_fields)? as u32;
        monster.race = self.extract_string_field_with_default("race", "", &mut missing_fields)?;
        monster.corpse = self.extract_number_field_with_default("corpse", 0, &mut missing_fields)? as u32;
        monster.speed = self.extract_number_field_with_default("speed", 0, &mut missing_fields)? as u16;
        monster.mana_cost = self.extract_number_field_with_default("manaCost", 0, &mut missing_fields)? as u16;
        monster.change_target = match self.parse_change_target() {
            Ok(value) => value,
            Err(_) => ChangeTarget::default(),
        };
        monster.strategies_target = match self.parse_strategies_target() {
            Ok(value) => value,
            Err(_) => StrategiesTarget::default(),
        };
        monster.flags = match self.parse_flags() {
            Ok(value) => value,
            Err(_) => MonsterFlags::default(),
        };
        monster.light = match self.parse_light() {
            Ok(value) => value,
            Err(_) => MonsterLight::default(),
        };
        monster.summon = match self.parse_summon() {
            Ok(value) => Some(value),
            Err(_) => None,
        };
        monster.voices = match self.parse_voices() {
            Ok(value) => Some(value),
            Err(_) => None,
        };
        monster.loot = match self.parse_loot() {
            Ok(value) => value,
            Err(_) => Vec::new(),
        };
        monster.attacks = match self.parse_attacks() {
            Ok(value) => value,
            Err(_) => Vec::new(),
        };
        monster.defenses = match self.parse_defenses() {
            Ok(value) => value,
            Err(_) => MonsterDefenses::default(),
        };
        monster.elements = match self.parse_elements() {
            Ok(value) => value,
            Err(_) => Vec::new(),
        };
        monster.immunities = match self.parse_immunities() {
            Ok(value) => value,
            Err(_) => Vec::new(),
        };

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
            race: self.extract_string_from_section(&bestiary_section, "race")?,
            to_kill: self.extract_from_section(&bestiary_section, "toKill")? as u32,
            first_unlock: self.extract_from_section(&bestiary_section, "FirstUnlock")? as u32,
            second_unlock: self.extract_from_section(&bestiary_section, "SecondUnlock")? as u32,
            charms_points: self.extract_from_section(&bestiary_section, "CharmsPoints")? as u32,
            stars: self.extract_from_section(&bestiary_section, "Stars")? as u8,
            occurrence: self.extract_from_section(&bestiary_section, "Occurrence")? as u8,
            locations: self.extract_string_from_section(&bestiary_section, "Locations")?,
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

        let voices_re = Regex::new(r#"\{\s*text\s*=\s*"([^"]+)"\s*,\s*yell\s*=\s*(true|false)\s*\}"#)?;
        let mut entries = Vec::new();

        for caps in voices_re.captures_iter(&section) {
            entries.push(VoiceEntry {
                text: caps[1].to_string(),
                yell: &caps[2] == "true",
            });
        }

        Ok(MonsterVoices {
            interval,
            chance,
            entries,
        })
    }

    fn parse_loot(&self) -> Result<Vec<LootEntry>> {
        let section = self.extract_table("loot")?;
        let loot_re = Regex::new(r#"\{([^}]+)\}"#)?;
        let mut loot = Vec::new();

        for caps in loot_re.captures_iter(&section) {
            let entry_str = &caps[1];
            let mut entry = LootEntry {
                id: None,
                name: None,
                chance: 0,
                min_count: None,
                max_count: None,
            };

            // Parse id
            if let Some(id_caps) = Regex::new(r"id\s*=\s*(\d+)")?.captures(entry_str) {
                entry.id = Some(id_caps[1].parse()?);
            }

            // Parse name
            if let Some(name_caps) = Regex::new(r#"name\s*=\s*"([^"]+)""#)?.captures(entry_str) {
                entry.name = Some(name_caps[1].to_string());
            }

            // Parse chance
            if let Some(chance_caps) = Regex::new(r"chance\s*=\s*(\d+)")?.captures(entry_str) {
                entry.chance = chance_caps[1].parse()?;
            }

            // Parse minCount
            if let Some(min_caps) = Regex::new(r"minCount\s*=\s*(\d+)")?.captures(entry_str) {
                entry.min_count = Some(min_caps[1].parse()?);
            }

            // Parse maxCount
            if let Some(max_caps) = Regex::new(r"maxCount\s*=\s*(\d+)")?.captures(entry_str) {
                entry.max_count = Some(max_caps[1].parse()?);
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
        let spell_re = Regex::new(r#"\{([^}]+)\}"#)?;
        let mut spells = Vec::new();

        for caps in spell_re.captures_iter(section) {
            let entry_str = &caps[1];

            // Skip if it's just defense/armor/mitigation
            if !entry_str.contains("name") {
                continue;
            }

            let mut entry = AttackEntry {
                name: String::new(),
                interval: 0,
                chance: 0,
                min_damage: None,
                max_damage: None,
                range: None,
                radius: None,
                target: None,
                length: None,
                spread: None,
                effect: None,
                shoot_effect: None,
                combat_type: None,
                speed_change: None,
                duration: None,
            };

            // Parse name
            if let Some(name_caps) = Regex::new(r#"name\s*=\s*"([^"]+)""#)?.captures(entry_str) {
                entry.name = name_caps[1].to_string();
            }

            // Parse interval
            if let Some(interval_caps) = Regex::new(r"interval\s*=\s*(\d+)")?.captures(entry_str) {
                entry.interval = interval_caps[1].parse()?;
            }

            // Parse chance
            if let Some(chance_caps) = Regex::new(r"chance\s*=\s*(\d+)")?.captures(entry_str) {
                entry.chance = chance_caps[1].parse()?;
            }

            // Parse minDamage
            if let Some(min_caps) = Regex::new(r"minDamage\s*=\s*(-?\d+)")?.captures(entry_str) {
                entry.min_damage = Some(min_caps[1].parse()?);
            }

            // Parse maxDamage
            if let Some(max_caps) = Regex::new(r"maxDamage\s*=\s*(-?\d+)")?.captures(entry_str) {
                entry.max_damage = Some(max_caps[1].parse()?);
            }

            // Parse type
            if let Some(type_caps) = Regex::new(r"type\s*=\s*([A-Z_]+)")?.captures(entry_str) {
                entry.combat_type = Some(type_caps[1].to_string());
            }

            // Parse range
            if let Some(range_caps) = Regex::new(r"range\s*=\s*(\d+)")?.captures(entry_str) {
                entry.range = Some(range_caps[1].parse()?);
            }

            // Parse radius
            if let Some(radius_caps) = Regex::new(r"radius\s*=\s*(\d+)")?.captures(entry_str) {
                entry.radius = Some(radius_caps[1].parse()?);
            }

            // Parse target
            if let Some(target_caps) = Regex::new(r"target\s*=\s*(true|false)")?.captures(entry_str) {
                entry.target = Some(&target_caps[1] == "true");
            }

            // Parse effect
            if let Some(effect_caps) = Regex::new(r"effect\s*=\s*([A-Z_]+)")?.captures(entry_str) {
                entry.effect = Some(effect_caps[1].to_string());
            }

            // Parse shootEffect
            if let Some(shoot_caps) = Regex::new(r"shootEffect\s*=\s*([A-Z_]+)")?.captures(entry_str) {
                entry.shoot_effect = Some(shoot_caps[1].to_string());
            }

            // Parse speedChange
            if let Some(speed_caps) = Regex::new(r"speedChange\s*=\s*(-?\d+)")?.captures(entry_str) {
                entry.speed_change = Some(speed_caps[1].parse()?);
            }

            // Parse duration
            if let Some(duration_caps) = Regex::new(r"duration\s*=\s*(\d+)")?.captures(entry_str) {
                entry.duration = Some(duration_caps[1].parse()?);
            }

            // Parse length
            if let Some(length_caps) = Regex::new(r"length\s*=\s*(\d+)")?.captures(entry_str) {
                entry.length = Some(length_caps[1].parse()?);
            }

            // Parse spread
            if let Some(spread_caps) = Regex::new(r"spread\s*=\s*(\d+)")?.captures(entry_str) {
                entry.spread = Some(spread_caps[1].parse()?);
            }

            spells.push(entry);
        }

        Ok(spells)
    }

    fn parse_elements(&self) -> Result<Vec<ElementEntry>> {
        let section = self.extract_table("elements")?;
        let element_re = Regex::new(r#"\{\s*type\s*=\s*([A-Z_]+)\s*,\s*percent\s*=\s*(-?\d+)\s*\}"#)?;
        let mut elements = Vec::new();

        for caps in element_re.captures_iter(&section) {
            elements.push(ElementEntry {
                element_type: caps[1].to_string(),
                percent: caps[2].parse()?,
            });
        }

        Ok(elements)
    }

    fn parse_immunities(&self) -> Result<Vec<ImmunityEntry>> {
        let section = self.extract_table("immunities")?;
        let immunity_re = Regex::new(r#"\{\s*type\s*=\s*"([^"]+)"\s*,\s*condition\s*=\s*(true|false)\s*\}"#)?;
        let mut immunities = Vec::new();

        for caps in immunity_re.captures_iter(&section) {
            immunities.push(ImmunityEntry {
                immunity_type: caps[1].to_string(),
                condition: &caps[2] == "true",
            });
        }

        Ok(immunities)
    }

    // Helper methods
    fn extract_table(&self, table_name: &str) -> Result<String> {
        let pattern = format!(r"monster\.{}\s*=\s*\{{([^}}]*(?:\{{[^}}]*\}}[^}}]*)*)\}}", table_name);
        let re = Regex::new(&pattern)?;
        let caps = re.captures(&self.content).context(format!("Failed to find table: {}", table_name))?;
        Ok(caps[1].to_string())
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

    fn extract_bool_from_section(&self, section: &str, field: &str) -> Result<bool> {
        let pattern = format!(r"{}\s*=\s*(true|false)", field);
        let re = Regex::new(&pattern)?;
        let caps = re.captures(section).context(format!("Failed to find field: {}", field))?;
        Ok(&caps[1] == "true")
    }
}
