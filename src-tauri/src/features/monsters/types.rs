use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MonsterMeta {
    #[serde(default)]
    pub missing_fields: Vec<String>,
    #[serde(default)]
    pub touched_fields: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MonsterOutfit {
    pub look_type: u32,
    pub look_head: u8,
    pub look_body: u8,
    pub look_legs: u8,
    pub look_feet: u8,
    pub look_addons: u8,
    pub look_mount: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MonsterBestiary {
    pub class: String,
    pub race: String,
    pub to_kill: u32,
    pub first_unlock: u32,
    pub second_unlock: u32,
    pub charms_points: u32,
    pub stars: u8,
    pub occurrence: u8,
    pub locations: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ChangeTarget {
    pub interval: u32,
    pub chance: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct StrategiesTarget {
    pub nearest: u8,
    pub health: u8,
    pub damage: u8,
    pub random: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MonsterFlags {
    pub summonable: bool,
    pub attackable: bool,
    pub hostile: bool,
    pub convinceable: bool,
    pub pushable: bool,
    pub reward_boss: bool,
    pub illusionable: bool,
    pub can_push_items: bool,
    pub can_push_creatures: bool,
    pub static_attack_chance: u8,
    pub target_distance: u8,
    pub run_health: u16,
    pub health_hidden: bool,
    pub is_blockable: bool,
    pub can_walk_on_energy: bool,
    pub can_walk_on_fire: bool,
    pub can_walk_on_poison: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MonsterLight {
    pub level: u8,
    pub color: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SummonEntry {
    pub name: String,
    pub chance: u8,
    pub interval: u32,
    pub count: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MonsterSummon {
    pub max_summons: u8,
    pub summons: Vec<SummonEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VoiceEntry {
    pub text: String,
    pub yell: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MonsterVoices {
    pub interval: u32,
    pub chance: u8,
    pub entries: Vec<VoiceEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LootEntry {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub chance: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_count: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AttackEntry {
    pub name: String,
    pub interval: u32,
    pub chance: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_damage: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_damage: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub range: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub radius: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub length: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spread: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effect: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shoot_effect: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub combat_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speed_change: Option<i16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct DefenseEntry {
    pub name: String,
    pub interval: u32,
    pub chance: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_damage: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_damage: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effect: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub combat_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speed_change: Option<i16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MonsterDefenses {
    pub defense: u16,
    pub armor: u16,
    pub mitigation: f32,
    pub entries: Vec<DefenseEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ElementEntry {
    pub element_type: String,
    pub percent: i16,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ImmunityEntry {
    pub immunity_type: String,
    pub condition: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Monster {
    pub name: String,
    pub description: String,
    pub experience: u32,
    pub outfit: MonsterOutfit,
    pub race_id: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bestiary: Option<MonsterBestiary>,
    pub health: u32,
    pub max_health: u32,
    pub race: String,
    pub corpse: u32,
    pub speed: u16,
    pub mana_cost: u16,
    pub change_target: ChangeTarget,
    pub strategies_target: StrategiesTarget,
    pub flags: MonsterFlags,
    pub light: MonsterLight,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summon: Option<MonsterSummon>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub voices: Option<MonsterVoices>,
    pub loot: Vec<LootEntry>,
    pub attacks: Vec<AttackEntry>,
    pub defenses: MonsterDefenses,
    pub elements: Vec<ElementEntry>,
    pub immunities: Vec<ImmunityEntry>,
    #[serde(default)]
    pub meta: MonsterMeta,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct MonsterListEntry {
    pub name: String,
    pub file_path: String,
}
