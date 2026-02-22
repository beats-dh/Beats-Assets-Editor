use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpcMeta {
    #[serde(default)]
    pub missing_fields: Vec<String>,
    #[serde(default)]
    pub touched_fields: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpcOutfit {
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
pub struct NpcFlags {
    pub floorchange: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpcShopItem {
    pub item_name: Option<String>,
    pub client_id: Option<u32>,
    pub item_id: Option<u32>,
    pub buy: Option<u32>,
    pub sell: Option<u32>,
    pub count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpcVoice {
    pub text: String,
    pub yell: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpcVoices {
    pub interval: u32,
    pub chance: u8,
    #[serde(default)]
    pub lines: Vec<NpcVoice>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpcKeyword {
    pub words: Vec<String>,
    pub response: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpcInteractions {
    #[serde(default)]
    pub messages: std::collections::HashMap<String, String>,
    #[serde(default)]
    pub keywords: Vec<NpcKeyword>,
    #[serde(default)]
    pub modules: Vec<String>,
    #[serde(default)]
    pub raw_code: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Npc {
    pub name: String,
    pub description: String,
    pub health: u32,
    pub max_health: u32,
    pub walk_interval: u32,
    pub walk_radius: u8,
    pub outfit: NpcOutfit,
    pub flags: NpcFlags,

    pub amount_level: Option<u32>,
    pub amount_money: Option<u32>,
    pub currency: Option<u32>,
    pub max_level: Option<u32>,
    pub money_to_need_donation: Option<u32>,
    pub respawn_type: Option<String>,

    #[serde(default)]
    pub voices: Option<NpcVoices>,
    #[serde(default)]
    pub shop: Option<Vec<NpcShopItem>>,

    #[serde(default)]
    pub interactions: NpcInteractions,

    #[serde(default)]
    pub meta: NpcMeta,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct NpcListEntry {
    pub name: String,
    pub file_path: String,
    pub relative_path: String,
    #[serde(default)]
    pub categories: Vec<String>,
}
