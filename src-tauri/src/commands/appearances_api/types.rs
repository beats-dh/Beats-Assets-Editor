use serde::{Deserialize, Serialize};

/// Simplified appearance data for listing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceItem {
    pub id: u32,
    pub name: Option<String>,
    pub description: Option<String>,
    pub has_flags: bool,
    pub sprite_count: u32,
}

/// Category of appearances
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AppearanceCategory {
    Objects,
    Outfits,
    Effects,
    Missiles,
}

/// Subcategory for Objects (based on ITEM_CATEGORY from protobuf)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ItemSubcategory {
    All,                    // Show all items
    Armors,                 // 1
    Amulets,                // 2
    Boots,                  // 3
    Containers,             // 4
    Decoration,             // 5
    Food,                   // 6
    HelmetsHats,            // 7
    Legs,                   // 8
    Others,                 // 9
    Potions,                // 10
    Rings,                  // 11
    Runes,                  // 12
    Shields,                // 13
    Tools,                  // 14
    Valuables,              // 15
    Ammunition,             // 16
    Axes,                   // 17
    Clubs,                  // 18
    DistanceWeapons,        // 19
    Swords,                 // 20
    WandsRods,              // 21
    PremiumScrolls,         // 22
    TibiaCoins,             // 23
    CreatureProducts,       // 24
    Quiver,                 // 25
    Soulcores,              // 26
}

impl ItemSubcategory {
    /// Convert to protobuf ITEM_CATEGORY value
    pub fn to_protobuf_value(&self) -> Option<i32> {
        match self {
            ItemSubcategory::All => None,
            ItemSubcategory::Armors => Some(1i32),
            ItemSubcategory::Amulets => Some(2i32),
            ItemSubcategory::Boots => Some(3i32),
            ItemSubcategory::Containers => Some(4i32),
            ItemSubcategory::Decoration => Some(5i32),
            ItemSubcategory::Food => Some(6i32),
            ItemSubcategory::HelmetsHats => Some(7i32),
            ItemSubcategory::Legs => Some(8i32),
            ItemSubcategory::Others => Some(9i32),
            ItemSubcategory::Potions => Some(10i32),
            ItemSubcategory::Rings => Some(11i32),
            ItemSubcategory::Runes => Some(12i32),
            ItemSubcategory::Shields => Some(13i32),
            ItemSubcategory::Tools => Some(14i32),
            ItemSubcategory::Valuables => Some(15i32),
            ItemSubcategory::Ammunition => Some(16i32),
            ItemSubcategory::Axes => Some(17i32),
            ItemSubcategory::Clubs => Some(18i32),
            ItemSubcategory::DistanceWeapons => Some(19i32),
            ItemSubcategory::Swords => Some(20i32),
            ItemSubcategory::WandsRods => Some(21i32),
            ItemSubcategory::PremiumScrolls => Some(22i32),
            ItemSubcategory::TibiaCoins => Some(23i32),
            ItemSubcategory::CreatureProducts => Some(24i32),
            ItemSubcategory::Quiver => Some(25i32),
            ItemSubcategory::Soulcores => Some(26i32),
        }
    }

    /// Get display name for UI
    pub fn display_name(&self) -> &'static str {
        match self {
            ItemSubcategory::All => "All Items",
            ItemSubcategory::Armors => "Armors",
            ItemSubcategory::Amulets => "Amulets",
            ItemSubcategory::Boots => "Boots",
            ItemSubcategory::Containers => "Containers",
            ItemSubcategory::Decoration => "Decoration",
            ItemSubcategory::Food => "Food",
            ItemSubcategory::HelmetsHats => "Helmets & Hats",
            ItemSubcategory::Legs => "Legs",
            ItemSubcategory::Others => "Others",
            ItemSubcategory::Potions => "Potions",
            ItemSubcategory::Rings => "Rings",
            ItemSubcategory::Runes => "Runes",
            ItemSubcategory::Shields => "Shields",
            ItemSubcategory::Tools => "Tools",
            ItemSubcategory::Valuables => "Valuables",
            ItemSubcategory::Ammunition => "Ammunition",
            ItemSubcategory::Axes => "Axes",
            ItemSubcategory::Clubs => "Clubs",
            ItemSubcategory::DistanceWeapons => "Distance Weapons",
            ItemSubcategory::Swords => "Swords",
            ItemSubcategory::WandsRods => "Wands & Rods",
            ItemSubcategory::PremiumScrolls => "Premium Scrolls",
            ItemSubcategory::TibiaCoins => "Tibia Coins",
            ItemSubcategory::CreatureProducts => "Creature Products",
            ItemSubcategory::Quiver => "Quiver",
            ItemSubcategory::Soulcores => "Soulcores",
        }
    }
}

/// Detailed appearance information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceDetails {
    pub id: u32,
    pub name: Option<String>,
    pub description: Option<String>,
    pub category: AppearanceCategory,
    pub frame_groups: Vec<FrameGroupInfo>,
    pub flags: Option<AppearanceFlagsInfo>,
}

/// Frame group information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameGroupInfo {
    pub id: Option<u32>,
    pub sprite_count: u32,
    pub pattern_width: Option<u32>,
    pub pattern_height: Option<u32>,
    pub layers: Option<u32>,
}

/// Simplified flags information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceFlagsInfo {
    pub usable: bool,
    pub container: bool,
    pub take: bool,
    pub hang: bool,
    pub rotate: bool,
    pub has_light: bool,
    pub has_market_info: bool,
    pub has_npc_data: bool,
}