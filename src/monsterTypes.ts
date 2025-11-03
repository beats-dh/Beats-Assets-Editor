// TypeScript types matching Rust Monster structures

export interface MonsterOutfit {
  lookType: number;
  lookHead: number;
  lookBody: number;
  lookLegs: number;
  lookFeet: number;
  lookAddons: number;
  lookMount: number;
}

export interface MonsterBestiary {
  class: string;
  race: string;
  toKill: number;
  firstUnlock: number;
  secondUnlock: number;
  charmsPoints: number;
  stars: number;
  occurrence: number;
  locations: string;
}

export interface ChangeTarget {
  interval: number;
  chance: number;
}

export interface StrategiesTarget {
  nearest: number;
  health: number;
  damage: number;
  random: number;
}

export interface MonsterFlags {
  summonable: boolean;
  attackable: boolean;
  hostile: boolean;
  convinceable: boolean;
  pushable: boolean;
  rewardBoss: boolean;
  illusionable: boolean;
  canPushItems: boolean;
  canPushCreatures: boolean;
  staticAttackChance: number;
  targetDistance: number;
  runHealth: number;
  healthHidden: boolean;
  isBlockable: boolean;
  canWalkOnEnergy: boolean;
  canWalkOnFire: boolean;
  canWalkOnPoison: boolean;
}

export interface MonsterLight {
  level: number;
  color: number;
}

export interface SummonEntry {
  name: string;
  chance: number;
  interval: number;
  count: number;
}

export interface MonsterSummon {
  maxSummons: number;
  summons: SummonEntry[];
}

export interface VoiceEntry {
  text: string;
  yell: boolean;
}

export interface MonsterVoices {
  interval: number;
  chance: number;
  entries: VoiceEntry[];
}

export interface LootEntry {
  id?: number;
  name?: string;
  chance: number;
  minCount?: number;
  maxCount?: number;
}

export interface AttackEntry {
  name: string;
  interval: number;
  chance: number;
  minDamage?: number;
  maxDamage?: number;
  range?: number;
  radius?: number;
  target?: boolean;
  length?: number;
  spread?: number;
  effect?: string;
  shootEffect?: string;
  combatType?: string;
  speedChange?: number;
  duration?: number;
}

export interface DefenseEntry {
  name: string;
  interval: number;
  chance: number;
  minDamage?: number;
  maxDamage?: number;
  effect?: string;
  target?: boolean;
  combatType?: string;
  speedChange?: number;
  duration?: number;
}

export interface MonsterDefenses {
  defense: number;
  armor: number;
  mitigation: number;
  entries: DefenseEntry[];
}

export interface ElementEntry {
  elementType: string;
  percent: number;
}

export interface ImmunityEntry {
  immunityType: string;
  condition: boolean;
}

export interface MonsterMeta {
  missingFields: string[];
  touchedFields: string[];
}

export interface Monster {
  name: string;
  description: string;
  experience: number;
  outfit: MonsterOutfit;
  raceId: number;
  bestiary?: MonsterBestiary;
  health: number;
  maxHealth: number;
  race: string;
  corpse: number;
  speed: number;
  manaCost: number;
  changeTarget: ChangeTarget;
  strategiesTarget: StrategiesTarget;
  flags: MonsterFlags;
  light: MonsterLight;
  summon?: MonsterSummon;
  voices?: MonsterVoices;
  loot: LootEntry[];
  attacks: AttackEntry[];
  defenses: MonsterDefenses;
  elements: ElementEntry[];
  immunities: ImmunityEntry[];
  meta?: MonsterMeta;
}

export interface MonsterListEntry {
  name: string;
  filePath: string;
}
