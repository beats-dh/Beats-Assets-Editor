import { getEffectLabel } from './effectMapping';
import type {
  MonsterAttackInfo,
  MonsterChangeTargetInfo,
  MonsterDefenseInfo,
  MonsterElementInfo,
  MonsterImmunityInfo,
  MonsterLightInfo,
  MonsterLibraryEntry,
  MonsterSummonConfig,
  OutfitInfo,
} from './types';
import {
  loadLuaScripts,
  extractBlock,
  parseFlags,
  parseGeneralAssignments,
  parseKeyValueNumber,
  parseKeyValueString,
  parseOutfit,
  parseVoices,
  parseLuaList,
} from './utils';

export interface LoadLibraryOptions {
  onProgress?: (message: string) => void;
}

const MONSTER_NAME_REGEX = /Game\.createMonsterType\("((?:\\"|[^"])*)"\)/i;

function sanitiseName(value: string | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value.replace(/\s+/g, ' ').trim();
}

function extractArrayEntries(block: string | null): string[] {
  if (!block) {
    return [];
  }
  const entries: string[] = [];
  let depth = 0;
  let start = -1;
  for (let index = 0; index < block.length; index += 1) {
    const char = block[index];
    if (char === '{') {
      if (depth === 0) {
        start = index + 1;
      }
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        const snippet = block.slice(start, index).trim();
        if (snippet.length > 0) {
          entries.push(snippet);
        }
        start = -1;
      }
    }
  }
  return entries;
}

function parseAssignmentValue(raw: string): string | number | boolean {
  const sanitized = raw.replace(/,$/, '').trim();
  if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
    return sanitized.slice(1, -1).replace(/\\"/g, '"');
  }
  if (/^(true|false)$/i.test(sanitized)) {
    return sanitized.toLowerCase() === 'true';
  }
  const numeric = Number(sanitized);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }
  return sanitized;
}

function parseAssignments(block: string | null): Record<string, string | number | boolean> {
  if (!block) {
    return {};
  }
  const result: Record<string, string | number | boolean> = {};
  const assignmentRegex = /(\w+)\s*=\s*("(?:\\"|[^"])*"|[-]?[0-9]+(?:\.[0-9]+)?|[A-Z0-9_]+)\s*,?/g;
  for (const match of block.matchAll(assignmentRegex)) {
    const key = match[1];
    const value = parseAssignmentValue(match[2]);
    result[key] = value;
  }
  return result;
}

function parseCombatEntry(entry: string): MonsterAttackInfo {
  const attack: MonsterAttackInfo = {};
  const nameMatch = entry.match(/name\s*=\s*"((?:\\"|[^"])*)"/i);
  if (nameMatch) {
    attack.name = nameMatch[1].replace(/\\"/g, '"');
  }
  const typeMatch = entry.match(/type\s*=\s*([A-Z0-9_]+)/i);
  if (typeMatch) {
    attack.type = typeMatch[1];
  }
  const intervalMatch = entry.match(/interval\s*=\s*(\d+)/i);
  if (intervalMatch) {
    attack.interval = Number(intervalMatch[1]);
  }
  const chanceMatch = entry.match(/chance\s*=\s*(\d+)/i);
  if (chanceMatch) {
    attack.chance = Number(chanceMatch[1]);
  }
  const effectMatch = entry.match(/effect\s*=\s*(CONST_[A-Z0-9_]+)/i);
  if (effectMatch) {
    attack.effectConst = effectMatch[1];
    attack.effectLabel = getEffectLabel(effectMatch[1]);
  }
  const shootMatch = entry.match(/shootEffect\s*=\s*(CONST_[A-Z0-9_]+)/i);
  if (shootMatch) {
    attack.shootEffect = shootMatch[1];
  }

  const minDamageMatch = entry.match(/minDamage\s*=\s*(-?\d+)/i);
  if (minDamageMatch) {
    attack.minDamage = Number(minDamageMatch[1]);
  }
  const maxDamageMatch = entry.match(/maxDamage\s*=\s*(-?\d+)/i);
  if (maxDamageMatch) {
    attack.maxDamage = Number(maxDamageMatch[1]);
  }

  const rangeMatch = entry.match(/range\s*=\s*(\d+)/i);
  if (rangeMatch) {
    attack.range = Number(rangeMatch[1]);
  }
  const radiusMatch = entry.match(/radius\s*=\s*(\d+)/i);
  if (radiusMatch) {
    attack.radius = Number(radiusMatch[1]);
  }
  const lengthMatch = entry.match(/length\s*=\s*(\d+)/i);
  if (lengthMatch) {
    attack.length = Number(lengthMatch[1]);
  }
  const spreadMatch = entry.match(/spread\s*=\s*(\d+)/i);
  if (spreadMatch) {
    attack.spread = Number(spreadMatch[1]);
  }

  const targetMatch = entry.match(/target\s*=\s*(true|false)/i);
  if (targetMatch) {
    attack.target = targetMatch[1].toLowerCase() === 'true';
  }

  return attack;
}

function parseMonsterName(content: string, path: string): string {
  const nameMatch = content.match(MONSTER_NAME_REGEX);
  if (nameMatch) {
    return sanitiseName(nameMatch[1].replace(/\\"/g, '"'), path.split(/[\\/]/).pop() ?? path);
  }
  const fileName = path.split(/[\\/]/).pop() ?? path;
  return fileName.replace(/\.lua$/i, '').replace(/[_-]+/g, ' ');
}

function parseOutfitInfo(content: string): OutfitInfo {
  return parseOutfit(extractBlock(content, 'monster.outfit'));
}

function parseMonsterFlags(content: string): Record<string, string> {
  return parseFlags(extractBlock(content, 'monster.flags'));
}

function parseMonsterVoices(content: string): string[] {
  return parseVoices(extractBlock(content, 'monster.voices'));
}

function parseMonsterLoot(content: string): string[] {
  const lootBlock = extractBlock(content, 'monster.loot');
  if (!lootBlock) {
    return [];
  }
  const loot: string[] = [];
  for (const snippet of extractArrayEntries(lootBlock)) {
    const nameMatch = snippet.match(/name\s*=\s*"((?:\\"|[^"])*)"/i);
    if (nameMatch) {
      loot.push(nameMatch[1].replace(/\\"/g, '"'));
      continue;
    }
    const idMatch = snippet.match(/id\s*=\s*(\d+)/i);
    if (idMatch) {
      loot.push(`Item ${idMatch[1]}`);
    }
  }
  return loot;
}

function parseMonsterAttacks(content: string): MonsterAttackInfo[] {
  const attacksBlock = extractBlock(content, 'monster.attacks');
  if (!attacksBlock) {
    return [];
  }
  const attacks: MonsterAttackInfo[] = [];
  for (const entry of extractArrayEntries(attacksBlock)) {
    const attack = parseCombatEntry(entry);
    attacks.push(attack);
  }

  return attacks;
}

function parseMonsterDefenses(content: string): MonsterDefenseInfo {
  const defensesBlock = extractBlock(content, 'monster.defenses');
  const assignments = parseAssignments(defensesBlock);
  const spells: MonsterAttackInfo[] = [];
  if (defensesBlock) {
    for (const entry of extractArrayEntries(defensesBlock)) {
      spells.push(parseCombatEntry(entry));
    }
  }
  return {
    defense: typeof assignments.defense === 'number' ? assignments.defense : undefined,
    armor: typeof assignments.armor === 'number' ? assignments.armor : undefined,
    mitigation: typeof assignments.mitigation === 'number' ? assignments.mitigation : undefined,
    spells,
  };
}

function parseMonsterElements(content: string): MonsterElementInfo[] {
  const elementsBlock = extractBlock(content, 'monster.elements');
  const elements: MonsterElementInfo[] = [];
  if (!elementsBlock) {
    return elements;
  }
  for (const entry of extractArrayEntries(elementsBlock)) {
    const typeMatch = entry.match(/type\s*=\s*([A-Z0-9_"']+)/i);
    if (!typeMatch) {
      continue;
    }
    const rawType = typeMatch[1].replace(/^["']|["']$/g, '');
    const percentMatch = entry.match(/percent\s*=\s*(-?\d+)/i);
    const percent = percentMatch ? Number(percentMatch[1]) : undefined;
    elements.push({ type: rawType, percent });
  }
  return elements;
}

function parseMonsterImmunities(content: string): MonsterImmunityInfo[] {
  const immunityBlock = extractBlock(content, 'monster.immunities');
  const immunities: MonsterImmunityInfo[] = [];
  if (!immunityBlock) {
    return immunities;
  }
  for (const entry of extractArrayEntries(immunityBlock)) {
    const typeMatch = entry.match(/type\s*=\s*"((?:\\"|[^"])*)"/i);
    const conditionMatch = entry.match(/condition\s*=\s*(true|false)/i);
    immunities.push({
      type: typeMatch ? typeMatch[1].replace(/\\"/g, '"') : entry,
      condition: conditionMatch ? conditionMatch[1].toLowerCase() === 'true' : undefined,
    });
  }
  return immunities;
}

function parseMonsterEvents(content: string): string[] {
  const eventsBlock = extractBlock(content, 'monster.events');
  if (!eventsBlock) {
    return [];
  }
  return parseLuaList(`{${eventsBlock}}`);
}

function parseMonsterBestiary(content: string): Record<string, string | number> {
  const bestiaryBlock = extractBlock(content, 'monster.Bestiary');
  const assignments = parseAssignments(bestiaryBlock);
  const bestiary: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(assignments)) {
    if (typeof value === 'number' || typeof value === 'string') {
      bestiary[key] = value;
    }
  }
  return bestiary;
}

function parseMonsterChangeTarget(content: string): MonsterChangeTargetInfo {
  const block = extractBlock(content, 'monster.changeTarget');
  const assignments = parseAssignments(block);
  return {
    interval: typeof assignments.interval === 'number' ? assignments.interval : undefined,
    chance: typeof assignments.chance === 'number' ? assignments.chance : undefined,
  };
}

function parseMonsterStrategies(content: string): Record<string, number> {
  const block = extractBlock(content, 'monster.strategiesTarget');
  const assignments = parseAssignments(block);
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(assignments)) {
    if (typeof value === 'number') {
      result[key] = value;
    }
  }
  return result;
}

function parseMonsterLight(content: string): MonsterLightInfo {
  const block = extractBlock(content, 'monster.light');
  const assignments = parseAssignments(block);
  return {
    level: typeof assignments.level === 'number' ? assignments.level : undefined,
    color: typeof assignments.color === 'number' ? assignments.color : undefined,
  };
}

function parseMonsterSummon(content: string): MonsterSummonConfig | null {
  const block = extractBlock(content, 'monster.summon');
  if (!block) {
    return null;
  }
  const assignments = parseAssignments(block);
  const summonList: MonsterSummonConfig = {
    maxSummons: typeof assignments.maxSummons === 'number' ? assignments.maxSummons : undefined,
    entries: [],
  };
  const summonsBlock = extractBlock(block, 'summons');
  if (summonsBlock) {
    for (const entry of extractArrayEntries(summonsBlock)) {
      const info = parseAssignments(entry);
      summonList.entries.push({
        name: typeof info.name === 'string' ? info.name : undefined,
        chance: typeof info.chance === 'number' ? info.chance : undefined,
        interval: typeof info.interval === 'number' ? info.interval : undefined,
        count: typeof info.count === 'number' ? info.count : undefined,
      });
    }
  }
  if (summonList.entries.length === 0 && summonList.maxSummons === undefined) {
    return null;
  }
  return summonList;
}

function parseMonsterProperties(content: string): Record<string, string | number> {
  const properties = parseGeneralAssignments(content, 'monster.');
  delete properties.description;
  delete properties.attacks;
  delete properties.loot;
  delete properties.defenses;
  delete properties.outfit;
  delete properties.voices;
  delete properties.flags;
  delete properties.Bestiary;
  delete properties.events;
  delete properties.changeTarget;
  delete properties.strategiesTarget;
  delete properties.summon;
  delete properties.light;
  return properties;
}

function parseMonsterEntry(path: string, content: string): MonsterLibraryEntry {
  const name = parseMonsterName(content, path);
  const description = parseKeyValueString(content, 'monster.description');
  const experience = parseKeyValueNumber(content, 'monster.experience');
  const health = parseKeyValueNumber(content, 'monster.health');
  const maxHealth = parseKeyValueNumber(content, 'monster.maxHealth');
  const manaCost = parseKeyValueNumber(content, 'monster.manaCost');
  const speed = parseKeyValueNumber(content, 'monster.speed');
  const race = parseKeyValueString(content, 'monster.race');
  const corpse = parseKeyValueNumber(content, 'monster.corpse');

  const entry: MonsterLibraryEntry = {
    path,
    name,
    description,
    experience,
    health,
    maxHealth,
    manaCost,
    speed,
    race,
    corpse,
    outfit: parseOutfitInfo(content),
    voices: parseMonsterVoices(content),
    flags: parseMonsterFlags(content),
    attacks: parseMonsterAttacks(content),
    loot: parseMonsterLoot(content),
    events: parseMonsterEvents(content),
    bestiary: parseMonsterBestiary(content),
    changeTarget: parseMonsterChangeTarget(content),
    strategies: parseMonsterStrategies(content),
    defenses: parseMonsterDefenses(content),
    elements: parseMonsterElements(content),
    immunities: parseMonsterImmunities(content),
    summon: parseMonsterSummon(content),
    light: parseMonsterLight(content),
    properties: parseMonsterProperties(content),
    raw: content,
  };

  return entry;
}

export async function loadMonsterLibrary(root: string, options: LoadLibraryOptions = {}): Promise<MonsterLibraryEntry[]> {
  const scripts = await loadLuaScripts(root);
  const monsters: MonsterLibraryEntry[] = [];

  if (scripts.length === 0) {
    return monsters;
  }

  for (let index = 0; index < scripts.length; index += 1) {
    const script = scripts[index];
    options.onProgress?.(`Parsing monster ${index + 1} of ${scripts.length}...`);
    try {
      monsters.push(parseMonsterEntry(script.path, script.content));
    } catch (error) {
      console.error(`Failed to parse monster script at ${script.path}:`, error);
    }
  }

  monsters.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  return monsters;
}
