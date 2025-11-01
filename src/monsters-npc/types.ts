export interface EditorViewOptions {
  onBack: () => void;
}

export interface OutfitInfo {
  lookType?: number;
  lookTypeEx?: number;
  lookHead?: number;
  lookBody?: number;
  lookLegs?: number;
  lookFeet?: number;
  lookAddons?: number;
  lookMount?: number;
}

export interface MonsterAttackInfo {
  name?: string;
  type?: string;
  interval?: number;
  chance?: number;
  minDamage?: number;
  maxDamage?: number;
  effectConst?: string;
  effectLabel?: string;
  shootEffect?: string;
  range?: number;
  radius?: number;
  length?: number;
  spread?: number;
  target?: boolean;
}

export interface MonsterDefenseInfo {
  defense?: number;
  armor?: number;
  mitigation?: number;
  spells: MonsterAttackInfo[];
}

export interface MonsterElementInfo {
  type: string;
  percent?: number;
}

export interface MonsterImmunityInfo {
  type: string;
  condition?: boolean;
}

export interface MonsterSummonInfo {
  name?: string;
  chance?: number;
  interval?: number;
  count?: number;
}

export interface MonsterSummonConfig {
  maxSummons?: number;
  entries: MonsterSummonInfo[];
}

export interface MonsterLightInfo {
  level?: number;
  color?: number;
}

export interface MonsterChangeTargetInfo {
  interval?: number;
  chance?: number;
}

export interface MonsterStrategiesInfo {
  [strategy: string]: number | undefined;
}

export interface MonsterLibraryEntry {
  path: string;
  name: string;
  description?: string;
  experience?: number;
  health?: number;
  maxHealth?: number;
  manaCost?: number;
  speed?: number;
  race?: string;
  corpse?: number;
  outfit: OutfitInfo;
  voices: string[];
  flags: Record<string, string>;
  attacks: MonsterAttackInfo[];
  loot: string[];
  events: string[];
  bestiary: Record<string, string | number>;
  changeTarget: MonsterChangeTargetInfo;
  strategies: MonsterStrategiesInfo;
  defenses: MonsterDefenseInfo;
  elements: MonsterElementInfo[];
  immunities: MonsterImmunityInfo[];
  summon: MonsterSummonConfig | null;
  light: MonsterLightInfo;
  properties: Record<string, string | number>;
  raw: string;
}

export interface NpcPhrase {
  triggers: string[];
  responses: string[];
  links: string[];
}

export interface NpcLibraryEntry {
  path: string;
  name: string;
  description?: string;
  outfit: OutfitInfo;
  voices: string[];
  flags: Record<string, string>;
  phrases: NpcPhrase[];
  messages: Record<string, string>;
  storages: string[];
  properties: Record<string, string | number>;
  raw: string;
}
