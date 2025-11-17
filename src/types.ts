// Type definitions for Tibia Assets Editor

export interface AppearanceStats {
  // Primary counts (last IDs - like Assets Editor)
  object_count: number;
  outfit_count: number;
  effect_count: number;
  missile_count: number;
  // Additional info - actual item counts in file
  actual_objects: number;
  actual_outfits: number;
  actual_effects: number;
  actual_missiles: number;
}

// Complete appearance types matching Rust backend
export interface CompleteAppearanceItem {
  id: number;
  name?: string;
  description?: string;
  appearance_type?: number;
  frame_groups: CompleteFrameGroup[];
  flags?: CompleteFlags;
  sprite_data: string[];
}

export interface CompleteFrameGroup {
  fixed_frame_group?: number;
  id?: number;
  sprite_info?: CompleteSpriteInfo;
}

export interface CompleteSpriteInfo {
  pattern_width?: number;
  pattern_height?: number;
  pattern_depth?: number;
  layers?: number;
  pattern_size?: number;
  // Extra optional pattern fields present from backend mapping
  pattern_layers?: number;
  pattern_x?: number;
  pattern_y?: number;
  pattern_z?: number;
  pattern_frames?: number;
  sprite_ids: number[];
  bounding_square?: number;
  animation?: SpriteAnimation;
  // Flag indicating animation presence
  is_animation?: boolean;
  is_opaque?: boolean;
  bounding_boxes: BoundingBox[];
}

export interface SpriteAnimation {
  default_start_phase?: number;
  synchronized?: boolean;
  random_start_phase?: boolean;
  loop_type?: number;
  loop_count?: number;
  animation_mode?: number;
  phases: SpritePhase[];
}

export interface SpritePhase {
  duration_min?: number;
  duration_max?: number;
}

export interface BoundingBox {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface CompleteFlags {
  // Basic boolean flags
  clip?: boolean;
  bottom?: boolean;
  top?: boolean;
  container?: boolean;
  cumulative?: boolean;
  usable?: boolean;
  forceuse?: boolean;
  multiuse?: boolean;
  liquidpool?: boolean;
  unpass?: boolean;
  unmove?: boolean;
  unsight?: boolean;
  avoid?: boolean;
  no_movement_animation?: boolean;
  take?: boolean;
  liquidcontainer?: boolean;
  hang?: boolean;
  rotate?: boolean;
  dont_hide?: boolean;
  translucent?: boolean;
  lying_object?: boolean;
  animate_always?: boolean;
  fullbank?: boolean;
  ignore_look?: boolean;
  wrap?: boolean;
  unwrap?: boolean;
  topeffect?: boolean;
  corpse?: boolean;
  player_corpse?: boolean;
  ammo?: boolean;
  show_off_socket?: boolean;
  reportable?: boolean;
  reverse_addons_east?: boolean;
  reverse_addons_west?: boolean;
  reverse_addons_south?: boolean;
  reverse_addons_north?: boolean;
  wearout?: boolean;
  clockexpire?: boolean;
  expire?: boolean;
  expirestop?: boolean;
  deco_item_kit?: boolean;
  dual_wielding?: boolean;

  // Complex flags
  bank?: { waypoints?: number };
  write?: { max_text_length?: number };
  write_once?: { max_text_length_once?: number };
  hook?: { direction?: number };
  // Hook mount booleans
  hook_south?: boolean;
  hook_east?: boolean;
  light?: { brightness?: number; color?: number };
  shift?: { x?: number; y?: number };
  height?: { elevation?: number };
  automap?: { color?: number };
  lenshelp?: { id?: number };
  clothes?: { slot?: number };
  default_action?: { action?: number };
  market?: {
    category?: number;
    trade_as_object_id?: number;
    show_as_object_id?: number;
    restrict_to_vocation: number[];
    minimum_level?: number;
    name?: string;
    vocation?: number;
  };
  npc_sale_data: FlagNPC[];
  changed_to_expire?: { former_object_typeid?: number };
  cyclopedia_item?: { cyclopedia_type?: number };
  upgrade_classification?: { upgrade_classification?: number };
  skillwheel_gem?: { gem_quality_id?: number; vocation_id?: number };
  // Extra complex flags
  imbueable?: { slot_count?: number };
  proficiency?: { proficiency_id?: number };
  // Extras
  restrict_to_vocation: number[];
  minimum_level?: number;
  weapon_type?: number;
  transparency_level?: number;
}

export interface FlagNPC {
  name?: string;
  location?: string;
  sale_price?: number;
  buy_price?: number;
  currency_object_type_id?: number;
  currency_quest_flag_display_name?: string;
}

export interface SpecialMeaningAppearanceIds {
  gold_coin_id?: number;
  platinum_coin_id?: number;
  crystal_coin_id?: number;
  tibia_coin_id?: number;
  stamped_letter_id?: number;
  supply_stash_id?: number;
  standard_reward_chest_id?: number;
  blank_imbuement_scroll_id?: number;
}

export interface Coordinate {
  x?: number;
  y?: number;
  z?: number;
}

// Vocation options for UI
export interface VocationOption {
  value: number;
  label: string;
}

// Animation player state
export interface AnimationPlayerState {
  key: string;
  timerId: number;
  phase: number;
}

// Sprite decomposition result
export interface SpriteDecomposition {
  layerIndex: number;
  x: number;
  y: number;
  z: number;
  phaseIndex: number;
}

// Group mapping for aggregated sprites
export interface GroupMapping {
  groupIndex: number;
  localIndex: number;
}

export interface ImageExportFailure {
  category: string;
  id: number;
  reason: string;
  file_path?: string;
}

export interface ImageExportResult {
  exported_files: number;
  failed: ImageExportFailure[];
}
