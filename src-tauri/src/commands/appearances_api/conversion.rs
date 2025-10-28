use crate::commands::{
    CompleteAppearanceItem, CompleteFlags, CompleteFrameGroup, CompleteSpriteInfo, FlagAutomap,
    FlagBank, FlagChangedToExpire, FlagClothes, FlagCyclopedia, FlagDefaultAction, FlagHeight,
    FlagHook, FlagImbueable, FlagLenshelp, FlagLight, FlagNPC, FlagProficiency, FlagShift,
    FlagSkillWheelGem, FlagUpgradeClassification, FlagWrite, FlagWriteOnce, SpriteAnimation,
};
use crate::core::protobuf::Box as ProtoBoundingBox;
use crate::core::protobuf::{
    Appearance, AppearanceFlagAutomap, AppearanceFlagBank, AppearanceFlagChangedToExpire,
    AppearanceFlagClothes, AppearanceFlagCyclopedia, AppearanceFlagDefaultAction,
    AppearanceFlagHeight, AppearanceFlagHook, AppearanceFlagImbueable, AppearanceFlagLenshelp,
    AppearanceFlagLight, AppearanceFlagMarket, AppearanceFlagNpc, AppearanceFlagProficiency,
    AppearanceFlagShift, AppearanceFlagSkillWheelGem, AppearanceFlagTransparencyLevel,
    AppearanceFlagUpgradeClassification, AppearanceFlagWrite, AppearanceFlagWriteOnce,
    AppearanceFlags, FrameGroup, SpriteAnimation as ProtoSpriteAnimation,
    SpriteInfo as ProtoSpriteInfo, SpritePhase as ProtoSpritePhase,
};

/// Convert a [`CompleteAppearanceItem`] back into the protobuf [`Appearance`]
/// representation used by the Tibia client files.
pub fn complete_to_protobuf(item: &CompleteAppearanceItem) -> Appearance {
    let mut appearance = Appearance::default();
    appearance.id = Some(item.id);
    appearance.name = item.name.as_ref().map(|s| s.clone().into_bytes());
    appearance.description = item.description.as_ref().map(|s| s.clone().into_bytes());

    appearance.frame_group = item
        .frame_groups
        .iter()
        .map(complete_frame_group_to_proto)
        .collect();

    appearance.flags = item.flags.as_ref().map(complete_flags_to_proto);

    appearance
}

fn complete_frame_group_to_proto(group: &CompleteFrameGroup) -> FrameGroup {
    let mut frame_group = FrameGroup::default();
    frame_group.fixed_frame_group = group.fixed_frame_group;
    frame_group.id = group.id;
    frame_group.sprite_info = group
        .sprite_info
        .as_ref()
        .map(complete_sprite_info_to_proto);
    frame_group
}

fn complete_sprite_info_to_proto(info: &CompleteSpriteInfo) -> ProtoSpriteInfo {
    let mut sprite_info = ProtoSpriteInfo::default();
    sprite_info.pattern_width = info.pattern_width;
    sprite_info.pattern_height = info.pattern_height;
    sprite_info.pattern_depth = info.pattern_depth;
    sprite_info.layers = info.layers;
    sprite_info.pattern_size = info.pattern_size;
    sprite_info.pattern_layers = info.pattern_layers;
    sprite_info.pattern_x = info.pattern_x;
    sprite_info.pattern_y = info.pattern_y;
    sprite_info.pattern_z = info.pattern_z;
    sprite_info.pattern_frames = info.pattern_frames;
    sprite_info.bounding_square = info.bounding_square;
    sprite_info.is_animation = info.is_animation;
    sprite_info.is_opaque = info.is_opaque;

    sprite_info.sprite_id = info.sprite_ids.clone();

    sprite_info.bounding_box_per_direction = info
        .bounding_boxes
        .iter()
        .map(|bb| ProtoBoundingBox {
            x: bb.x,
            y: bb.y,
            width: bb.width,
            height: bb.height,
        })
        .collect();

    sprite_info.animation = info.animation.as_ref().map(complete_animation_to_proto);

    sprite_info
}

fn complete_animation_to_proto(animation: &SpriteAnimation) -> ProtoSpriteAnimation {
    let mut proto = ProtoSpriteAnimation::default();
    proto.default_start_phase = animation.default_start_phase;
    proto.synchronized = animation.synchronized;
    proto.random_start_phase = animation.random_start_phase;
    proto.loop_type = animation.loop_type;
    proto.loop_count = animation.loop_count;
    proto.animation_mode = animation.animation_mode;
    proto.sprite_phase = animation
        .phases
        .iter()
        .map(|phase| ProtoSpritePhase {
            duration_min: phase.duration_min,
            duration_max: phase.duration_max,
        })
        .collect();
    proto
}

pub fn complete_flags_to_proto(flags: &CompleteFlags) -> AppearanceFlags {
    let mut proto = AppearanceFlags::default();

    proto.clip = flags.clip;
    proto.bottom = flags.bottom;
    proto.top = flags.top;
    proto.container = flags.container;
    proto.cumulative = flags.cumulative;
    proto.usable = flags.usable;
    proto.forceuse = flags.forceuse;
    proto.multiuse = flags.multiuse;
    proto.liquidpool = flags.liquidpool;
    proto.unpass = flags.unpass;
    proto.unmove = flags.unmove;
    proto.unsight = flags.unsight;
    proto.avoid = flags.avoid;
    proto.no_movement_animation = flags.no_movement_animation;
    proto.take = flags.take;
    proto.liquidcontainer = flags.liquidcontainer;
    proto.hang = flags.hang;
    proto.rotate = flags.rotate;
    proto.dont_hide = flags.dont_hide;
    proto.translucent = flags.translucent;
    proto.lying_object = flags.lying_object;
    proto.animate_always = flags.animate_always;
    proto.fullbank = flags.fullbank;
    proto.ignore_look = flags.ignore_look;
    proto.wrap = flags.wrap;
    proto.unwrap = flags.unwrap;
    proto.topeffect = flags.topeffect;
    proto.corpse = flags.corpse;
    proto.player_corpse = flags.player_corpse;
    proto.ammo = flags.ammo;
    proto.show_off_socket = flags.show_off_socket;
    proto.reportable = flags.reportable;
    proto.reverse_addons_east = flags.reverse_addons_east;
    proto.reverse_addons_west = flags.reverse_addons_west;
    proto.reverse_addons_south = flags.reverse_addons_south;
    proto.reverse_addons_north = flags.reverse_addons_north;
    proto.wearout = flags.wearout;
    proto.clockexpire = flags.clockexpire;
    proto.expire = flags.expire;
    proto.expirestop = flags.expirestop;
    proto.deco_item_kit = flags.deco_item_kit;
    proto.dual_wielding = flags.dual_wielding;

    proto.bank = flags
        .bank
        .as_ref()
        .map(|FlagBank { waypoints }| AppearanceFlagBank {
            waypoints: *waypoints,
        });
    proto.write = flags
        .write
        .as_ref()
        .map(|FlagWrite { max_text_length }| AppearanceFlagWrite {
            max_text_length: *max_text_length,
        });
    proto.write_once = flags.write_once.as_ref().map(
        |FlagWriteOnce {
             max_text_length_once,
         }| AppearanceFlagWriteOnce {
            max_text_length_once: *max_text_length_once,
        },
    );
    proto.hook = flags
        .hook
        .as_ref()
        .map(|FlagHook { direction }| AppearanceFlagHook {
            direction: *direction,
        });
    proto.light = flags
        .light
        .as_ref()
        .map(|FlagLight { brightness, color }| AppearanceFlagLight {
            brightness: *brightness,
            color: *color,
        });
    proto.shift = flags
        .shift
        .as_ref()
        .map(|FlagShift { x, y }| AppearanceFlagShift { x: *x, y: *y });
    proto.height = flags
        .height
        .as_ref()
        .map(|FlagHeight { elevation }| AppearanceFlagHeight {
            elevation: *elevation,
        });
    proto.automap = flags
        .automap
        .as_ref()
        .map(|FlagAutomap { color }| AppearanceFlagAutomap { color: *color });
    proto.lenshelp = flags
        .lenshelp
        .as_ref()
        .map(|FlagLenshelp { id }| AppearanceFlagLenshelp { id: *id });
    proto.clothes = flags
        .clothes
        .as_ref()
        .map(|FlagClothes { slot }| AppearanceFlagClothes { slot: *slot });
    proto.default_action = flags
        .default_action
        .as_ref()
        .map(|FlagDefaultAction { action }| AppearanceFlagDefaultAction { action: *action });
    proto.market = flags.market.as_ref().map(|market| AppearanceFlagMarket {
        category: market.category,
        trade_as_object_id: market.trade_as_object_id,
        show_as_object_id: market.show_as_object_id,
        restrict_to_vocation: market.restrict_to_vocation.clone(),
        minimum_level: market.minimum_level,
        name: market.name.as_ref().map(|s| s.clone().into_bytes()),
        vocation: market.vocation,
    });
    proto.npcsaledata = flags
        .npc_sale_data
        .iter()
        .map(
            |FlagNPC {
                 name,
                 location,
                 sale_price,
                 buy_price,
                 currency_object_type_id,
                 currency_quest_flag_display_name,
             }| AppearanceFlagNpc {
                name: name.as_ref().map(|s| s.clone().into_bytes()),
                location: location.as_ref().map(|s| s.clone().into_bytes()),
                sale_price: *sale_price,
                buy_price: *buy_price,
                currency_object_type_id: *currency_object_type_id,
                currency_quest_flag_display_name: currency_quest_flag_display_name
                    .as_ref()
                    .map(|s| s.clone().into_bytes()),
            },
        )
        .collect();
    proto.changedtoexpire = flags.changed_to_expire.as_ref().map(
        |FlagChangedToExpire {
             former_object_typeid,
         }| AppearanceFlagChangedToExpire {
            former_object_typeid: *former_object_typeid,
        },
    );
    proto.cyclopediaitem =
        flags
            .cyclopedia_item
            .as_ref()
            .map(
                |FlagCyclopedia { cyclopedia_type }| AppearanceFlagCyclopedia {
                    cyclopedia_type: *cyclopedia_type,
                },
            );
    proto.upgradeclassification = flags.upgrade_classification.as_ref().map(
        |FlagUpgradeClassification {
             upgrade_classification,
         }| AppearanceFlagUpgradeClassification {
            upgrade_classification: *upgrade_classification,
        },
    );
    proto.skillwheel_gem = flags.skillwheel_gem.as_ref().map(
        |FlagSkillWheelGem {
             gem_quality_id,
             vocation_id,
         }| AppearanceFlagSkillWheelGem {
            gem_quality_id: *gem_quality_id,
            vocation_id: *vocation_id,
        },
    );
    proto.imbueable = flags
        .imbueable
        .as_ref()
        .map(|FlagImbueable { slot_count }| AppearanceFlagImbueable {
            slot_count: *slot_count,
        });
    proto.proficiency = flags
        .proficiency
        .as_ref()
        .map(
            |FlagProficiency { proficiency_id }| AppearanceFlagProficiency {
                proficiency_id: *proficiency_id,
            },
        );
    proto.restrict_to_vocation = flags.restrict_to_vocation.clone();
    proto.minimum_level = flags.minimum_level;
    proto.weapon_type = flags.weapon_type;
    proto.hook_south = flags.hook_south;
    proto.hook_east = flags.hook_east;
    proto.transparencylevel = flags
        .transparency_level
        .map(|level| AppearanceFlagTransparencyLevel { level: Some(level) });

    proto
}

/// Helper to clone an existing protobuf [`Appearance`] changing only its identifier.
pub fn clone_with_new_id(original: &Appearance, new_id: u32) -> Appearance {
    let mut cloned = original.clone();
    cloned.id = Some(new_id);
    cloned
}
