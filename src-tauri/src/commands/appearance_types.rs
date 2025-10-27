use crate::core::protobuf::{Appearance, AppearanceFlags, FrameGroup, SpriteInfo};
use serde::{Deserialize, Serialize};

/// Complete appearance data with ALL information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompleteAppearanceItem {
    pub id: u32,
    pub name: Option<String>,
    pub description: Option<String>,
    pub frame_groups: Vec<CompleteFrameGroup>,
    pub flags: Option<CompleteFlags>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompleteFrameGroup {
    pub fixed_frame_group: Option<i32>,
    pub id: Option<u32>,
    pub sprite_info: Option<CompleteSpriteInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompleteSpriteInfo {
    pub pattern_width: Option<u32>,
    pub pattern_height: Option<u32>,
    pub pattern_depth: Option<u32>,
    pub layers: Option<u32>,
    pub pattern_size: Option<u32>,
    pub pattern_layers: Option<u32>,
    pub pattern_x: Option<u32>,
    pub pattern_y: Option<u32>,
    pub pattern_z: Option<u32>,
    pub pattern_frames: Option<u32>,
    pub sprite_ids: Vec<u32>,
    pub bounding_square: Option<u32>,
    pub animation: Option<SpriteAnimation>,
    pub is_animation: Option<bool>,
    pub is_opaque: Option<bool>,
    pub bounding_boxes: Vec<BoundingBox>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpriteAnimation {
    pub default_start_phase: Option<u32>,
    pub synchronized: Option<bool>,
    pub random_start_phase: Option<bool>,
    pub loop_type: Option<i32>,
    pub loop_count: Option<u32>,
    pub animation_mode: Option<i32>,
    pub phases: Vec<SpritePhase>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpritePhase {
    pub duration_min: Option<u32>,
    pub duration_max: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
    pub x: Option<u32>,
    pub y: Option<u32>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

/// Complete flags with ALL properties
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompleteFlags {
    // Basic flags
    pub clip: Option<bool>,
    pub bottom: Option<bool>,
    pub top: Option<bool>,
    pub container: Option<bool>,
    pub cumulative: Option<bool>,
    pub usable: Option<bool>,
    pub forceuse: Option<bool>,
    pub multiuse: Option<bool>,
    pub liquidpool: Option<bool>,
    pub unpass: Option<bool>,
    pub unmove: Option<bool>,
    pub unsight: Option<bool>,
    pub avoid: Option<bool>,
    pub no_movement_animation: Option<bool>,
    pub take: Option<bool>,
    pub liquidcontainer: Option<bool>,
    pub hang: Option<bool>,
    pub rotate: Option<bool>,
    pub dont_hide: Option<bool>,
    pub translucent: Option<bool>,
    pub lying_object: Option<bool>,
    pub animate_always: Option<bool>,
    pub fullbank: Option<bool>,
    pub ignore_look: Option<bool>,
    pub wrap: Option<bool>,
    pub unwrap: Option<bool>,
    pub topeffect: Option<bool>,
    pub corpse: Option<bool>,
    pub player_corpse: Option<bool>,
    pub ammo: Option<bool>,
    pub show_off_socket: Option<bool>,
    pub reportable: Option<bool>,
    pub reverse_addons_east: Option<bool>,
    pub reverse_addons_west: Option<bool>,
    pub reverse_addons_south: Option<bool>,
    pub reverse_addons_north: Option<bool>,
    pub wearout: Option<bool>,
    pub clockexpire: Option<bool>,
    pub expire: Option<bool>,
    pub expirestop: Option<bool>,
    pub deco_item_kit: Option<bool>,
    pub dual_wielding: Option<bool>,

    // Complex flags
    pub bank: Option<FlagBank>,
    pub write: Option<FlagWrite>,
    pub write_once: Option<FlagWriteOnce>,
    pub hook: Option<FlagHook>,
    pub light: Option<FlagLight>,
    pub shift: Option<FlagShift>,
    pub height: Option<FlagHeight>,
    pub automap: Option<FlagAutomap>,
    pub lenshelp: Option<FlagLenshelp>,
    pub clothes: Option<FlagClothes>,
    pub default_action: Option<FlagDefaultAction>,
    pub market: Option<FlagMarket>,
    pub npc_sale_data: Vec<FlagNPC>,
    pub changed_to_expire: Option<FlagChangedToExpire>,
    pub cyclopedia_item: Option<FlagCyclopedia>,
    pub upgrade_classification: Option<FlagUpgradeClassification>,
    pub skillwheel_gem: Option<FlagSkillWheelGem>,
    pub imbueable: Option<FlagImbueable>,
    pub proficiency: Option<FlagProficiency>,
    pub restrict_to_vocation: Vec<i32>,
    pub minimum_level: Option<u32>,
    pub weapon_type: Option<i32>,
    pub hook_south: Option<bool>,
    pub hook_east: Option<bool>,
    pub transparency_level: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagBank {
    pub waypoints: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagWrite {
    pub max_text_length: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagWriteOnce {
    pub max_text_length_once: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagHook {
    pub direction: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagLight {
    pub brightness: Option<u32>,
    pub color: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagShift {
    pub x: Option<u32>,
    pub y: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagHeight {
    pub elevation: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagAutomap {
    pub color: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagLenshelp {
    pub id: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagClothes {
    pub slot: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagDefaultAction {
    pub action: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagMarket {
    pub category: Option<i32>,
    pub trade_as_object_id: Option<u32>,
    pub show_as_object_id: Option<u32>,
    pub restrict_to_vocation: Vec<i32>,
    pub minimum_level: Option<u32>,
    pub name: Option<String>,
    pub vocation: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagNPC {
    pub name: Option<String>,
    pub location: Option<String>,
    pub sale_price: Option<u32>,
    pub buy_price: Option<u32>,
    pub currency_object_type_id: Option<u32>,
    pub currency_quest_flag_display_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagChangedToExpire {
    pub former_object_typeid: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagCyclopedia {
    pub cyclopedia_type: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagUpgradeClassification {
    pub upgrade_classification: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagSkillWheelGem {
    pub gem_quality_id: Option<u32>,
    pub vocation_id: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagImbueable {
    pub slot_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlagProficiency {
    pub proficiency_id: Option<u32>,
}

// Conversion functions
impl CompleteAppearanceItem {
    pub fn from_protobuf(appearance: &Appearance) -> Self {
        // Convert optional bytes to Strings lossily to avoid UTF-8 errors
        let name = appearance
            .name
            .as_ref()
            .map(|b| String::from_utf8_lossy(b).to_string());
        let description = appearance
            .description
            .as_ref()
            .map(|b| String::from_utf8_lossy(b).to_string());

        Self {
            id: appearance.id.unwrap_or(0),
            name,
            description,
            frame_groups: appearance
                .frame_group
                .iter()
                .map(CompleteFrameGroup::from_protobuf)
                .collect(),
            flags: appearance.flags.as_ref().map(CompleteFlags::from_protobuf),
        }
    }
}

impl CompleteFrameGroup {
    pub fn from_protobuf(fg: &FrameGroup) -> Self {
        Self {
            fixed_frame_group: fg.fixed_frame_group,
            id: fg.id,
            sprite_info: fg
                .sprite_info
                .as_ref()
                .map(CompleteSpriteInfo::from_protobuf),
        }
    }
}

impl CompleteSpriteInfo {
    pub fn from_protobuf(si: &SpriteInfo) -> Self {
        Self {
            pattern_width: si.pattern_width,
            pattern_height: si.pattern_height,
            pattern_depth: si.pattern_depth,
            layers: si.layers,
            pattern_size: si.pattern_size,
            pattern_layers: si.pattern_layers,
            pattern_x: si.pattern_x,
            pattern_y: si.pattern_y,
            pattern_z: si.pattern_z,
            pattern_frames: si.pattern_frames,
            sprite_ids: si.sprite_id.clone(),
            bounding_square: si.bounding_square,
            animation: si.animation.as_ref().map(|a| SpriteAnimation {
                default_start_phase: a.default_start_phase,
                synchronized: a.synchronized,
                random_start_phase: a.random_start_phase,
                loop_type: a.loop_type,
                loop_count: a.loop_count,
                animation_mode: a.animation_mode.map(|mode| mode as i32),
                phases: a
                    .sprite_phase
                    .iter()
                    .map(|p| SpritePhase {
                        duration_min: p.duration_min,
                        duration_max: p.duration_max,
                    })
                    .collect(),
            }),
            is_animation: si.is_animation,
            is_opaque: si.is_opaque,
            bounding_boxes: si
                .bounding_box_per_direction
                .iter()
                .map(|b| BoundingBox {
                    x: b.x,
                    y: b.y,
                    width: b.width,
                    height: b.height,
                })
                .collect(),
        }
    }
}

impl CompleteFlags {
    pub fn from_protobuf(flags: &AppearanceFlags) -> Self {
        Self {
            // Basic flags
            clip: flags.clip,
            bottom: flags.bottom,
            top: flags.top,
            container: flags.container,
            cumulative: flags.cumulative,
            usable: flags.usable,
            forceuse: flags.forceuse,
            multiuse: flags.multiuse,
            liquidpool: flags.liquidpool,
            unpass: flags.unpass,
            unmove: flags.unmove,
            unsight: flags.unsight,
            avoid: flags.avoid,
            no_movement_animation: flags.no_movement_animation,
            take: flags.take,
            liquidcontainer: flags.liquidcontainer,
            hang: flags.hang,
            rotate: flags.rotate,
            dont_hide: flags.dont_hide,
            translucent: flags.translucent,
            lying_object: flags.lying_object,
            animate_always: flags.animate_always,
            fullbank: flags.fullbank,
            ignore_look: flags.ignore_look,
            wrap: flags.wrap,
            unwrap: flags.unwrap,
            topeffect: flags.topeffect,
            corpse: flags.corpse,
            player_corpse: flags.player_corpse,
            ammo: flags.ammo,
            show_off_socket: flags.show_off_socket,
            reportable: flags.reportable,
            reverse_addons_east: flags.reverse_addons_east,
            reverse_addons_west: flags.reverse_addons_west,
            reverse_addons_south: flags.reverse_addons_south,
            reverse_addons_north: flags.reverse_addons_north,
            wearout: flags.wearout,
            clockexpire: flags.clockexpire,
            expire: flags.expire,
            expirestop: flags.expirestop,
            deco_item_kit: flags.deco_item_kit,
            dual_wielding: flags.dual_wielding,

            // Complex flags
            bank: flags.bank.as_ref().map(|b| FlagBank {
                waypoints: b.waypoints,
            }),
            write: flags.write.as_ref().map(|w| FlagWrite {
                max_text_length: w.max_text_length,
            }),
            write_once: flags.write_once.as_ref().map(|w| FlagWriteOnce {
                max_text_length_once: w.max_text_length_once,
            }),
            hook: flags.hook.as_ref().map(|h| FlagHook {
                direction: h.direction,
            }),
            light: flags.light.as_ref().map(|l| FlagLight {
                brightness: l.brightness,
                color: l.color,
            }),
            shift: flags.shift.as_ref().map(|s| FlagShift { x: s.x, y: s.y }),
            height: flags.height.as_ref().map(|h| FlagHeight {
                elevation: h.elevation,
            }),
            automap: flags
                .automap
                .as_ref()
                .map(|a| FlagAutomap { color: a.color }),
            lenshelp: flags.lenshelp.as_ref().map(|l| FlagLenshelp { id: l.id }),
            clothes: flags.clothes.as_ref().map(|c| FlagClothes { slot: c.slot }),
            default_action: flags
                .default_action
                .as_ref()
                .map(|d| FlagDefaultAction { action: d.action }),
            market: flags.market.as_ref().map(|m| FlagMarket {
                category: m.category,
                trade_as_object_id: m.trade_as_object_id,
                show_as_object_id: m.show_as_object_id,
                restrict_to_vocation: m.restrict_to_vocation.clone(),
                minimum_level: m.minimum_level,
                name: m
                    .name
                    .as_ref()
                    .map(|b| String::from_utf8_lossy(b).to_string()),
                vocation: m.vocation,
            }),
            npc_sale_data: flags
                .npcsaledata
                .iter()
                .map(|npc| FlagNPC {
                    name: npc
                        .name
                        .as_ref()
                        .map(|b| String::from_utf8_lossy(b).to_string()),
                    location: npc
                        .location
                        .as_ref()
                        .map(|b| String::from_utf8_lossy(b).to_string()),
                    sale_price: npc.sale_price,
                    buy_price: npc.buy_price,
                    currency_object_type_id: npc.currency_object_type_id,
                    currency_quest_flag_display_name: npc
                        .currency_quest_flag_display_name
                        .as_ref()
                        .map(|b| String::from_utf8_lossy(b).to_string()),
                })
                .collect(),
            changed_to_expire: flags.changedtoexpire.as_ref().map(|c| FlagChangedToExpire {
                former_object_typeid: c.former_object_typeid,
            }),
            cyclopedia_item: flags.cyclopediaitem.as_ref().map(|c| FlagCyclopedia {
                cyclopedia_type: c.cyclopedia_type,
            }),
            upgrade_classification: flags.upgradeclassification.as_ref().map(|u| {
                FlagUpgradeClassification {
                    upgrade_classification: u.upgrade_classification,
                }
            }),
            skillwheel_gem: flags.skillwheel_gem.as_ref().map(|s| FlagSkillWheelGem {
                gem_quality_id: s.gem_quality_id,
                vocation_id: s.vocation_id,
            }),
            imbueable: flags.imbueable.as_ref().map(|i| FlagImbueable {
                slot_count: i.slot_count,
            }),
            proficiency: flags.proficiency.as_ref().map(|p| FlagProficiency {
                proficiency_id: p.proficiency_id,
            }),
            restrict_to_vocation: flags.restrict_to_vocation.clone(),
            minimum_level: flags.minimum_level,
            weapon_type: flags.weapon_type,
            hook_south: flags.hook_south,
            hook_east: flags.hook_east,
            transparency_level: flags.transparencylevel.as_ref().and_then(|t| t.level),
        }
    }
}
