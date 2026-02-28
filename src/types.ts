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
  actual_missiles: number;
}

export interface StaticDataStats {
  total_creatures: number;
  total_titles: number;
  total_houses: number;
  total_bosses: number;
  total_quests: number;
}

export interface StaticMapDataStats {
  total_houses_details: number;
}

export interface OutfitColors {
  head?: number;
  body?: number;
  legs?: number;
  feet?: number;
}

export interface OutfitLook {
  looktype?: number;
  colors?: OutfitColors;
  addons?: number;
  mount?: number;
}

// Static Data entities
export interface StaticCreature {
  id: number;
  name: string;
  outfit?: OutfitLook;
  difficulty: number;
  occurrence: number;
  is_npc: boolean;
  is_hostile: boolean;
}

export interface StaticTitle {
  id: number;
  name: string;
  description: string;
  grade: number;
}

export interface StaticQuest {
  id: number;
  name: string;
}

export interface StaticBoss {
  id: number;
  name: string;
  outfit?: OutfitLook;
  is_archfoe: boolean;
}

export interface StaticHouse {
  id: number;
  name: string;
  description: string;
  rent: number;
  size: number;
  position?: Coordinate;
  beds: number;
  guildhall: boolean;
  town: string;
  is_premium: boolean;
}

// Static Map Data Entities
export interface StaticMapHouseDetail {
  house_id?: number;
  layout?: StaticMapHouseLayout;
}

export interface StaticMapHouseLayout {
  position?: Coordinate;
  size?: StaticMapAreaSize;
  tiles?: StaticMapHouseTiles;
}

export interface StaticMapAreaSize {
  width?: number;
  height?: number;
  floors?: number;
}

export interface StaticMapHouseTiles {
  floor_data?: StaticMapHouseFloorData;
}

export interface StaticMapHouseFloorData {
  rows: StaticMapHouseTileRow[];
}

export interface StaticMapHouseTileRow {
  tiles: StaticMapHouseTile[];
  flags?: number;
}

export interface StaticMapHouseTile {
  object_id?: number;
  wall_info?: { is_wall?: boolean };
  door_info?: { is_door?: boolean };
}

// Complete appearance types matching Rust backend
export interface CompleteAppearanceItem {
  id: number;
  name?: string;
  description?: string;
  frame_groups: CompleteFrameGroup[];
  flags?: CompleteFlags;
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
  pattern_layers?: number;
  sprite_ids: number[];
  bounding_square?: number;
  animation?: SpriteAnimation;
  is_opaque?: boolean;
  bounding_boxes: BoundingBox[];
}

export interface SpriteAnimation {
  synchronized?: boolean;
  loop_type?: number;
  loop_count?: number;
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
  light?: { brightness?: number; color?: number };
  shift?: { x?: number; y?: number };
  height?: { elevation?: number };
  automap?: { color?: number };
  lenshelp?: { id?: number };
  clothes?: { slot?: number };
  default_action?: { action?: number };
  weapon_type?: number;
  market?: {
    category?: number;
    trade_as_object_id?: number;
    show_as_object_id?: number;
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

// Proficiency Editor types (matches real client format)
export interface ProficiencyPerk {
  Type: number;
  Value: number;
  SkillId?: number;
  AugmentType?: number;
  SpellId?: number;
}

export interface ProficiencyLevel {
  Perks: ProficiencyPerk[];
  XpRequired?: number;
}

export interface ProficiencyEntry {
  Name: string;
  ProficiencyId: number;
  Version?: number;
  Levels: ProficiencyLevel[];
}

export interface RawFileInfo {
  preview: string;
  topLevelType: string;
  topLevelKeys: string[];
  arrayLength?: number;
  firstValueType?: string;
}
