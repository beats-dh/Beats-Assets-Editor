import { invoke } from '@tauri-apps/api/core';
import type { OutfitInfo } from './types';

export interface LuaScriptFile {
  path: string;
  content: string;
}

export async function loadLuaScripts(root: string): Promise<LuaScriptFile[]> {
  const scripts = await invoke<LuaScriptFile[]>('load_lua_scripts', { path: root });
  return scripts;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractBlock(source: string, marker: string): string | null {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    return null;
  }

  const braceIndex = source.indexOf('{', markerIndex);
  if (braceIndex === -1) {
    return null;
  }

  let depth = 0;
  for (let index = braceIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceIndex + 1, index);
      }
    }
  }
  return null;
}

export function parseKeyValueNumber(source: string, variable: string): number | undefined {
  const pattern = `${escapeRegExp(variable)}\\s*=\\s*(-?\\d+)`;
  const regex = new RegExp(pattern, 'i');
  const match = source.match(regex);
  return match ? Number(match[1]) : undefined;
}

export function parseKeyValueString(source: string, variable: string): string | undefined {
  const pattern = `${escapeRegExp(variable)}\\s*=\\s*"((?:\\\\"|[^"])*)"`;
  const regex = new RegExp(pattern, 'i');
  const match = source.match(regex);
  return match ? unescapeLuaString(match[1]) : undefined;
}

export function parseOutfit(block: string | null): OutfitInfo {
  if (!block) {
    return {};
  }
  const outfit: OutfitInfo = {};
  const assignments = block.split(/[,\n]/);
  for (const assignment of assignments) {
    const [rawKey, rawValue] = assignment.split('=').map(part => part?.trim());
    if (!rawKey || !rawValue) {
      continue;
    }
    const value = Number(rawValue.replace(/,$/, ''));
    if (Number.isNaN(value)) {
      continue;
    }
    const key = rawKey as keyof OutfitInfo;
    (outfit as Record<string, number>)[key] = value;
  }
  return outfit;
}

export function parseFlags(block: string | null): Record<string, string> {
  if (!block) {
    return {};
  }
  const result: Record<string, string> = {};
  const flagRegex = /(\w+)\s*=\s*([^,\n}]+)/g;
  for (const match of block.matchAll(flagRegex)) {
    const key = match[1];
    const value = match[2].trim().replace(/,$/, '');
    result[key] = value;
  }
  return result;
}

export function parseVoices(block: string | null): string[] {
  if (!block) {
    return [];
  }
  const voices: string[] = [];
  const voiceRegex = /text\s*=\s*"((?:\\\\"|[^"])*)"/g;
  for (const match of block.matchAll(voiceRegex)) {
    voices.push(unescapeLuaString(match[1]));
  }
  return voices;
}

export function parseGeneralAssignments(source: string, prefix: string): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  const regex = new RegExp(`${escapeRegExp(prefix)}(\\w+)\\s*=\\s*([^\n]+)`, 'g');
  for (const match of source.matchAll(regex)) {
    const key = match[1];
    const rawValue = match[2].trim();
    if (rawValue.startsWith('{')) {
      continue;
    }
    if (rawValue.startsWith('"')) {
      const valueMatch = rawValue.match(/^"((?:\\\\"|[^"])*)"/);
      if (valueMatch) {
        result[key] = unescapeLuaString(valueMatch[1]);
      }
      continue;
    }
    const numeric = Number(rawValue.replace(/[,;]/g, ''));
    if (!Number.isNaN(numeric)) {
      result[key] = numeric;
      continue;
    }
    const sanitized = rawValue.replace(/[,;]/g, '');
    result[key] = sanitized;
  }
  return result;
}

export function parseLuaList(source: string): string[] {
  const items: string[] = [];
  const cleaned = source.replace(/[{}]/g, '');
  const parts = cleaned.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const stringMatch = trimmed.match(/^"((?:\\\\"|[^"])*)"$/);
    if (stringMatch) {
      items.push(unescapeLuaString(stringMatch[1]));
    } else {
      items.push(trimmed);
    }
  }
  return items;
}

export function unescapeLuaString(value: string): string {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}
