import rawDefinitions from '../../data/monsters-npc/utils/utils_definitions.hpp?raw';

const effectMap = new Map<string, string>();

const EFFECT_REGEX = /(CONST_ME_[A-Z0-9_]+)\s*=\s*(\d+)/g;

function formatEffectLabel(constant: string): string {
  const base = constant.replace('CONST_ME_', '').toLowerCase();
  return base
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseEffectDefinitions(source: string): void {
  for (const match of source.matchAll(EFFECT_REGEX)) {
    const constant = match[1];
    if (!effectMap.has(constant)) {
      effectMap.set(constant, formatEffectLabel(constant));
    }
  }
}

parseEffectDefinitions(rawDefinitions);

export function getEffectLabel(constant: string | undefined): string | undefined {
  if (!constant) {
    return undefined;
  }
  return effectMap.get(constant) ?? formatEffectLabel(constant);
}

export function getKnownEffectConstants(): string[] {
  return Array.from(effectMap.keys());
}
