import type { NpcLibraryEntry, NpcPhrase, OutfitInfo } from './types';
import {
  loadLuaScripts,
  extractBlock,
  parseFlags,
  parseGeneralAssignments,
  parseKeyValueString,
  parseLuaList,
  parseOutfit,
  parseVoices,
  unescapeLuaString,
} from './utils';

export interface LoadLibraryOptions {
  onProgress?: (message: string) => void;
}

const NPC_NAME_REGEX = /npcConfig\.name\s*=\s*"((?:\\"|[^"])*)"/i;
const INTERNAL_NAME_REGEX = /internalNpcName\s*=\s*"((?:\\"|[^"])*)"/i;
const STORAGE_REGEX = /(?:player|npcHandler):(?:set|get|add)StorageValue\(\s*([^,\)]+)(?:,\s*([^\)]+))?\)/gi;

function sanitiseName(value: string | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value.replace(/\s+/g, ' ').trim();
}

function extractLinkedKeywords(responses: string[]): string[] {
  const links = new Set<string>();
  const linkRegex = /\{([^}]+)\}/g;
  for (const response of responses) {
    for (const match of response.matchAll(linkRegex)) {
      const keyword = match[1].trim();
      if (keyword.length > 0) {
        links.add(keyword);
      }
    }
  }
  return Array.from(links).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

function parseNpcStorages(content: string): string[] {
  const storages = new Set<string>();
  for (const match of content.matchAll(STORAGE_REGEX)) {
    const key = match[1]?.trim();
    if (!key) {
      continue;
    }
    storages.add(key.replace(/\s+/g, ' '));
  }
  return Array.from(storages).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

function parseNpcName(content: string, path: string): string {
  const nameMatch = content.match(NPC_NAME_REGEX);
  if (nameMatch) {
    return sanitiseName(unescapeLuaString(nameMatch[1]), path.split(/[\\/]/).pop() ?? path);
  }
  const internalMatch = content.match(INTERNAL_NAME_REGEX);
  if (internalMatch) {
    return sanitiseName(unescapeLuaString(internalMatch[1]), path.split(/[\\/]/).pop() ?? path);
  }
  const fileName = path.split(/[\\/]/).pop() ?? path;
  return fileName.replace(/\.lua$/i, '').replace(/[_-]+/g, ' ');
}

function parseOutfitInfo(content: string): OutfitInfo {
  return parseOutfit(extractBlock(content, 'npcConfig.outfit'));
}

function parseNpcFlags(content: string): Record<string, string> {
  return parseFlags(extractBlock(content, 'npcConfig.flags'));
}

function parseNpcVoices(content: string): string[] {
  return parseVoices(extractBlock(content, 'npcConfig.voices'));
}

function parseNpcPhrases(content: string): NpcPhrase[] {
  const phrases: NpcPhrase[] = [];
  const phraseRegex = /addKeyword\(\s*\{([^}]+)\}\s*,\s*StdModule\.say\s*,\s*\{([\s\S]*?)\}\)/gi;
  for (const match of content.matchAll(phraseRegex)) {
    const triggersRaw = match[1];
    const optionsBlock = match[2];
    const textMatch = optionsBlock.match(/text\s*=\s*(\{[\s\S]*?\}|"(?:\\"|[^"])+")/i);
    if (!textMatch) {
      continue;
    }
    const triggers = parseLuaList(`{${triggersRaw}}`);
    const textRaw = textMatch[1];
    let responses: string[] = [];
    if (textRaw.startsWith('{')) {
      responses = parseLuaList(textRaw);
    } else {
      const single = textRaw.match(/^"((?:\\"|[^"])*)"$/);
      if (single) {
        responses = [unescapeLuaString(single[1])];
      }
    }
    if (responses.length === 0) {
      continue;
    }
    phrases.push({
      triggers,
      responses,
      links: extractLinkedKeywords(responses),
    });
  }
  return phrases;
}

function parseNpcMessages(content: string): Record<string, string> {
  const messages: Record<string, string> = {};
  const messageRegex = /npcHandler:setMessage\(\s*(MESSAGE_[A-Z_]+)\s*,\s*"((?:\\"|[^"])*)"\s*\)/gi;
  for (const match of content.matchAll(messageRegex)) {
    messages[match[1]] = unescapeLuaString(match[2]);
  }
  return messages;
}

function parseNpcProperties(content: string): Record<string, string | number> {
  const properties = parseGeneralAssignments(content, 'npcConfig.');
  delete properties.outfit;
  delete properties.voices;
  delete properties.flags;
  delete properties.modules;
  return properties;
}

function parseNpcEntry(path: string, content: string): NpcLibraryEntry {
  const name = parseNpcName(content, path);
  const description = parseKeyValueString(content, 'npcConfig.description');

  const entry: NpcLibraryEntry = {
    path,
    name,
    description,
    outfit: parseOutfitInfo(content),
    voices: parseNpcVoices(content),
    flags: parseNpcFlags(content),
    phrases: parseNpcPhrases(content),
    messages: parseNpcMessages(content),
    storages: parseNpcStorages(content),
    properties: parseNpcProperties(content),
    raw: content,
  };

  return entry;
}

export async function loadNpcLibrary(root: string, options: LoadLibraryOptions = {}): Promise<NpcLibraryEntry[]> {
  const scripts = await loadLuaScripts(root);
  const npcs: NpcLibraryEntry[] = [];

  if (scripts.length === 0) {
    return npcs;
  }

  for (let index = 0; index < scripts.length; index += 1) {
    const script = scripts[index];
    options.onProgress?.(`Parsing NPC ${index + 1} of ${scripts.length}...`);
    try {
      npcs.push(parseNpcEntry(script.path, script.content));
    } catch (error) {
      console.error(`Failed to parse NPC script at ${script.path}:`, error);
    }
  }

  npcs.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  return npcs;
}
