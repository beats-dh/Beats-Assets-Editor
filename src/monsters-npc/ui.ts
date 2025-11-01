import { invoke } from '@tauri-apps/api/core';
import { buildAssetPreviewAnimation, type PreviewAnimationSequence } from '../features/previewAnimation/assetPreviewAnimator';
import type { CompleteAppearanceItem } from '../types';
import { createPlaceholderImage, createSpriteImage, getAppearanceSprites } from '../spriteCache';
import { escapeRegExp, extractBlock } from './utils';
import type { MonsterLibraryEntry, NpcLibraryEntry, OutfitInfo } from './types';

const LOOKTYPE_CATEGORY = 'Outfits';
const LOOKTYPE_EX_CATEGORY = 'Objects';

const previewCleanups = new WeakMap<HTMLElement, () => void>();

function createSection(title: string, content: HTMLElement): HTMLElement {
  const section = document.createElement('section');
  section.className = 'entity-detail-section';

  const heading = document.createElement('h4');
  heading.textContent = title;
  section.append(heading, content);
  return section;
}

function escapeLuaStringValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r\n/g, '\\n')
    .replace(/\r/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
}

function formatLuaValue(value: string | number | boolean): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  const trimmed = value.trim();
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return trimmed;
  }
  if (/^(true|false)$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (/^[A-Z0-9_]+$/.test(trimmed)) {
    return trimmed;
  }
  return `"${escapeLuaStringValue(value)}"`;
}

function appendBlankLine(lines: string[]): void {
  if (lines.length === 0) {
    return;
  }
  if (lines[lines.length - 1] !== '') {
    lines.push('');
  }
}

function appendAssignmentLine(
  lines: string[],
  key: string,
  value: string | number | boolean | undefined | null
): void {
  if (value === undefined || value === null) {
    return;
  }
  const formattedValue = formatLuaValue(value as string | number | boolean);
  lines.push(`monster.${key} = ${formattedValue}`);
}

function hasBlock(raw: string, marker: string): boolean {
  const pattern = new RegExp(`${escapeRegExp(marker)}\\s*=\\s*{`, 'i');
  return pattern.test(raw);
}

function formatBlockFromRaw(raw: string, marker: string): string | null {
  if (!hasBlock(raw, marker)) {
    return null;
  }
  const block = extractBlock(raw, marker);
  const alias = marker.replace(/^monster\./i, '');
  if (!block || block.trim().length === 0) {
    return `monster.${alias} = { }`;
  }
  const trimmed = block.trim();
  const lines = trimmed.split('\n').map(line => `    ${line.trimEnd()}`);
  return `monster.${alias} = {\n${lines.join('\n')}\n}`;
}

function appendBlockFromRaw(lines: string[], raw: string, marker: string): void {
  const block = formatBlockFromRaw(raw, marker);
  if (!block) {
    return;
  }
  appendBlankLine(lines);
  lines.push(block);
}

function buildMonsterScriptText(entry: MonsterLibraryEntry): string {
  const lines: string[] = [];
  lines.push(`local mType = Game.createMonsterType("${escapeLuaStringValue(entry.name)}")`);
  lines.push('local monster = {}');
  appendBlankLine(lines);

  appendAssignmentLine(lines, 'description', entry.description ?? undefined);
  appendAssignmentLine(lines, 'experience', entry.experience);

  appendBlockFromRaw(lines, entry.raw, 'monster.outfit');
  appendBlockFromRaw(lines, entry.raw, 'monster.Bestiary');

  appendBlankLine(lines);
  appendAssignmentLine(lines, 'health', entry.health);
  appendAssignmentLine(lines, 'maxHealth', entry.maxHealth);
  appendAssignmentLine(lines, 'race', entry.race ?? undefined);
  appendAssignmentLine(lines, 'corpse', entry.corpse);
  appendAssignmentLine(lines, 'speed', entry.speed);
  appendAssignmentLine(lines, 'manaCost', entry.manaCost);

  const propertyKeys = Object.keys(entry.properties).sort((a, b) => a.localeCompare(b));
  propertyKeys.forEach(key => {
    appendAssignmentLine(lines, key, entry.properties[key]);
  });

  appendBlockFromRaw(lines, entry.raw, 'monster.changeTarget');
  appendBlockFromRaw(lines, entry.raw, 'monster.strategiesTarget');
  appendBlockFromRaw(lines, entry.raw, 'monster.flags');
  appendBlockFromRaw(lines, entry.raw, 'monster.light');
  appendBlockFromRaw(lines, entry.raw, 'monster.voices');
  appendBlockFromRaw(lines, entry.raw, 'monster.events');
  appendBlockFromRaw(lines, entry.raw, 'monster.attacks');
  appendBlockFromRaw(lines, entry.raw, 'monster.defenses');
  appendBlockFromRaw(lines, entry.raw, 'monster.elements');
  appendBlockFromRaw(lines, entry.raw, 'monster.immunities');
  appendBlockFromRaw(lines, entry.raw, 'monster.summon');
  appendBlockFromRaw(lines, entry.raw, 'monster.loot');

  appendBlankLine(lines);
  lines.push('mType:register(monster)');
  return lines.join('\n');
}

function renderMonsterScript(entry: MonsterLibraryEntry): HTMLElement {
  const script = document.createElement('pre');
  script.className = 'monster-script-view';
  script.textContent = buildMonsterScriptText(entry);
  return script;
}

function createDefinitionList(items: Array<{ label: string; value: string | number | undefined }>): HTMLElement {
  const list = document.createElement('dl');
  list.className = 'entity-definition-list';
  items
    .filter(item => item.value !== undefined && item.value !== null && item.value !== '')
    .forEach(item => {
      const dt = document.createElement('dt');
      dt.textContent = item.label;
      const dd = document.createElement('dd');
      dd.textContent = String(item.value);
      list.append(dt, dd);
    });
  if (!list.childElementCount) {
    const empty = document.createElement('p');
    empty.className = 'entity-empty-state';
    empty.textContent = 'No data available for this section yet.';
    return empty;
  }
  return list;
}

function createChipsList(values: Array<{ label: string; value: string }>): HTMLElement {
  if (values.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'entity-empty-state';
    empty.textContent = 'No entries to display.';
    return empty;
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'entity-chip-list';
  values.forEach(item => {
    const chip = document.createElement('span');
    chip.className = 'entity-chip';
    chip.textContent = `${item.label}: ${item.value}`;
    wrapper.append(chip);
  });
  return wrapper;
}

function createTextList(items: string[], emptyLabel = 'No entries to display.'): HTMLElement {
  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'entity-empty-state';
    empty.textContent = emptyLabel;
    return empty;
  }
  const list = document.createElement('ul');
  list.className = 'entity-text-list';
  items.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    list.append(li);
  });
  return list;
}

function renderProperties(properties: Record<string, string | number>): HTMLElement {
  const entries = Object.entries(properties).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'entity-empty-state';
    empty.textContent = 'There are no additional properties captured yet.';
    return empty;
  }
  const list = document.createElement('dl');
  list.className = 'entity-definition-list';
  entries.forEach(([key, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = key;
    const dd = document.createElement('dd');
    dd.textContent = String(value);
    list.append(dt, dd);
  });
  return list;
}

function createPreviewContainer(variant: 'card' | 'detail'): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = variant === 'detail' ? 'entity-preview entity-preview-large' : 'entity-preview';
  return wrapper;
}

function createAnimatedPreview(
  sprites: string[],
  sequence: PreviewAnimationSequence | null,
  variant: 'card' | 'detail'
): { node: HTMLElement; cleanup: () => void } {
  const wrapper = createPreviewContainer(variant);
  const frames = sequence?.frames?.length ? sequence.frames : sprites;
  const initialFrame = frames[0];

  if (!initialFrame) {
    const placeholder = createPlaceholderImage();
    placeholder.textContent = 'Preview unavailable';
    wrapper.append(placeholder);
    return { node: wrapper, cleanup: () => {} };
  }

  const image = createSpriteImage(initialFrame);
  image.classList.add('entity-preview-image');
  if (variant === 'detail') {
    image.classList.add('entity-preview-image-large');
  }
  wrapper.append(image);

  if (!sequence || sequence.frames.length <= 1) {
    return { node: wrapper, cleanup: () => {} };
  }

  let frameIndex = 0;
  const frameInterval = Math.max(50, sequence.interval || 150);

  const draw = () => {
    const frame = sequence.frames[frameIndex];
    if (frame) {
      image.src = `data:image/png;base64,${frame}`;
    }
  };

  draw();

  const timerId = window.setInterval(() => {
    frameIndex = (frameIndex + 1) % sequence.frames.length;
    draw();
  }, frameInterval);

  const cleanup = () => {
    window.clearInterval(timerId);
  };

  return { node: wrapper, cleanup };
}

async function buildAppearancePreview(
  category: string,
  appearanceId: number,
  variant: 'card' | 'detail'
): Promise<{ node: HTMLElement; cleanup: () => void } | null> {
  if (!appearanceId || appearanceId < 0) {
    return null;
  }
  try {
    const sprites = await getAppearanceSprites(category, appearanceId);
    if (sprites.length === 0) {
      return null;
    }

    let details: CompleteAppearanceItem | null = null;
    try {
      details = await invoke<CompleteAppearanceItem>('get_complete_appearance', { category, id: appearanceId });
    } catch (error) {
      console.warn(`Failed to load appearance details for ${category} ${appearanceId}:`, error);
    }

    let sequence: PreviewAnimationSequence | null = null;
    if (details) {
      try {
        sequence = await buildAssetPreviewAnimation(category, appearanceId, details, sprites);
      } catch (error) {
        console.warn(`Failed to build animation sequence for ${category} ${appearanceId}:`, error);
      }
    }

    return createAnimatedPreview(sprites, sequence, variant);
  } catch (error) {
    console.error(`Failed to load appearance sprites for ${category} ${appearanceId}:`, error);
    return null;
  }
}

async function renderOutfitPreview(target: HTMLElement, outfit: OutfitInfo, variant: 'card' | 'detail'): Promise<void> {
  previewCleanups.get(target)?.();
  target.innerHTML = '';

  const attempts: Array<{ category: string; appearanceId: number }> = [];
  const seen = new Set<string>();

  const addAttempt = (category: string, appearanceId: number | undefined): void => {
    if (!appearanceId || appearanceId <= 0) {
      return;
    }
    const key = `${category}:${appearanceId}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    attempts.push({ category, appearanceId });
  };

  if (typeof outfit.lookType === 'number') {
    addAttempt(LOOKTYPE_CATEGORY, outfit.lookType);
    addAttempt(LOOKTYPE_EX_CATEGORY, outfit.lookType);
  }
  if (typeof outfit.lookTypeEx === 'number') {
    addAttempt(LOOKTYPE_EX_CATEGORY, outfit.lookTypeEx);
    addAttempt(LOOKTYPE_CATEGORY, outfit.lookTypeEx);
  }

  for (const source of attempts) {
    const preview = await buildAppearancePreview(source.category, source.appearanceId, variant);
    if (preview) {
      target.append(preview.node);
      previewCleanups.set(target, preview.cleanup);
      return;
    }
  }

  const placeholder = createPlaceholderImage();
  const fallbackId =
    (typeof outfit.lookType === 'number' && outfit.lookType > 0 && outfit.lookType) ||
    (typeof outfit.lookTypeEx === 'number' && outfit.lookTypeEx > 0 && outfit.lookTypeEx) ||
    null;

  if (fallbackId !== null) {
    placeholder.textContent = `ID #${fallbackId}`;
    if (attempts.length > 0) {
      placeholder.title = `No sprites available for ID #${fallbackId} in categories: ${attempts
        .map(({ category }) => category)
        .join(', ')}`;
    }
  } else {
    placeholder.textContent = 'No looktype';
  }
  target.append(placeholder);
  previewCleanups.set(target, () => {});
}

function createPreview(outfit: OutfitInfo, variant: 'card' | 'detail' = 'card'): HTMLElement {
  const wrapper = createPreviewContainer(variant);
  void renderOutfitPreview(wrapper, outfit, variant);
  return wrapper;
}

function renderRawScript(content: string): HTMLElement {
  const details = document.createElement('details');
  details.className = 'entity-raw-viewer';

  const summary = document.createElement('summary');
  summary.textContent = 'View raw script';
  details.append(summary);

  const pre = document.createElement('pre');
  pre.className = 'entity-raw-content';
  pre.textContent = content;
  details.append(pre);
  return details;
}

export function renderMonsterLibrary(entries: MonsterLibraryEntry[], container: HTMLElement): void {
  container.innerHTML = '';
  container.classList.add('entity-library-container');

  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'entity-empty-state';
    empty.textContent = 'No monsters were detected in this directory.';
    container.append(empty);
    return;
  }

  const summary = document.createElement('div');
  summary.className = 'entity-library-summary';
  summary.textContent = `${entries.length} monster${entries.length === 1 ? '' : 's'} ready for editing.`;

  const layout = document.createElement('div');
  layout.className = 'entity-library-layout';

  const grid = document.createElement('div');
  grid.className = 'entity-grid';

  const detail = document.createElement('div');
  detail.className = 'entity-detail';
  detail.dataset.state = 'empty';
  detail.innerHTML = '<p class="entity-empty-state">Select a monster from the list to inspect all of its data.</p>';

  let activeCard: HTMLElement | null = null;

  function showDetail(entry: MonsterLibraryEntry, card: HTMLElement): void {
    if (activeCard) {
      activeCard.classList.remove('is-active');
    }
    activeCard = card;
    activeCard.classList.add('is-active');

    detail.dataset.state = 'ready';
    detail.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'entity-detail-header';
    const preview = createPreview(entry.outfit, 'detail');
    const info = document.createElement('div');
    info.className = 'entity-detail-info';
    const title = document.createElement('h3');
    title.textContent = entry.name;
    const description = document.createElement('p');
    description.className = 'entity-detail-description';
    description.textContent = entry.description ?? 'This monster has no description yet.';
    const path = document.createElement('p');
    path.className = 'entity-detail-path';
    path.textContent = entry.path;
    info.append(title, description, path);
    header.append(preview, info);

    const scriptSection = createSection('Lua script layout', renderMonsterScript(entry));

    const rawSection = document.createElement('section');
    rawSection.className = 'entity-detail-section';
    const rawHeading = document.createElement('h4');
    rawHeading.textContent = 'Raw script';
    rawSection.append(rawHeading, renderRawScript(entry.raw));

    detail.append(header, scriptSection, rawSection);
  }

  entries.forEach(entry => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'entity-card';

    const preview = createPreview(entry.outfit);
    const title = document.createElement('span');
    title.className = 'entity-card-title';
    title.textContent = entry.name;
    const subtitle = document.createElement('span');
    subtitle.className = 'entity-card-subtitle';
    subtitle.textContent = entry.description ?? 'No description available yet.';

    card.append(preview, title, subtitle);
    card.addEventListener('click', () => showDetail(entry, card));
    grid.append(card);
  });

  if (entries.length > 0) {
    showDetail(entries[0], grid.firstElementChild as HTMLElement);
  }

  layout.append(grid, detail);
  container.append(summary, layout);
}

function renderNpcPhrases(phrases: NpcLibraryEntry['phrases']): HTMLElement {
  if (phrases.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'entity-empty-state';
    empty.textContent = 'No keyword-driven dialogues were found.';
    return empty;
  }
  const list = document.createElement('div');
  list.className = 'entity-phrases';
  phrases.forEach(phrase => {
    const card = document.createElement('article');
    card.className = 'entity-phrase';
    const trigger = document.createElement('h5');
    trigger.textContent = phrase.triggers.join(', ');
    const responses = createTextList(phrase.responses, 'No responses registered.');
    card.append(trigger, responses);
    if (phrase.links.length > 0) {
      const links = document.createElement('p');
      links.className = 'entity-phrase-links';
      links.textContent = `Links: ${phrase.links.join(', ')}`;
      card.append(links);
    }
    list.append(card);
  });
  return list;
}

function renderNpcMessages(messages: Record<string, string>): HTMLElement {
  const entries = Object.entries(messages);
  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'entity-empty-state';
    empty.textContent = 'No interaction messages were captured for this NPC.';
    return empty;
  }
  const list = document.createElement('dl');
  list.className = 'entity-definition-list';
  entries.forEach(([type, text]) => {
    const dt = document.createElement('dt');
    dt.textContent = type.replace('MESSAGE_', '').toLowerCase();
    const dd = document.createElement('dd');
    dd.textContent = text;
    list.append(dt, dd);
  });
  return list;
}

export function renderNpcLibrary(entries: NpcLibraryEntry[], container: HTMLElement): void {
  container.innerHTML = '';
  container.classList.add('entity-library-container');

  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'entity-empty-state';
    empty.textContent = 'No NPCs were detected in this directory.';
    container.append(empty);
    return;
  }

  const summary = document.createElement('div');
  summary.className = 'entity-library-summary';
  summary.textContent = `${entries.length} NPC${entries.length === 1 ? '' : 's'} ready for editing.`;

  const layout = document.createElement('div');
  layout.className = 'entity-library-layout';

  const grid = document.createElement('div');
  grid.className = 'entity-grid';

  const detail = document.createElement('div');
  detail.className = 'entity-detail';
  detail.dataset.state = 'empty';
  detail.innerHTML = '<p class="entity-empty-state">Select an NPC to inspect its configuration and dialogue tree.</p>';

  let activeCard: HTMLElement | null = null;

  function showDetail(entry: NpcLibraryEntry, card: HTMLElement): void {
    if (activeCard) {
      activeCard.classList.remove('is-active');
    }
    activeCard = card;
    activeCard.classList.add('is-active');

    detail.dataset.state = 'ready';
    detail.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'entity-detail-header';
    const preview = createPreview(entry.outfit, 'detail');
    const info = document.createElement('div');
    info.className = 'entity-detail-info';
    const title = document.createElement('h3');
    title.textContent = entry.name;
    const description = document.createElement('p');
    description.className = 'entity-detail-description';
    description.textContent = entry.description ?? 'This NPC has no description yet.';
    const path = document.createElement('p');
    path.className = 'entity-detail-path';
    path.textContent = entry.path;
    info.append(title, description, path);
    header.append(preview, info);

    const attributes = renderProperties(entry.properties);
    const outfitDetails = createDefinitionList([
      { label: 'Look type', value: entry.outfit.lookType },
      { label: 'Look type (object)', value: entry.outfit.lookTypeEx },
      { label: 'Head', value: entry.outfit.lookHead },
      { label: 'Body', value: entry.outfit.lookBody },
      { label: 'Legs', value: entry.outfit.lookLegs },
      { label: 'Feet', value: entry.outfit.lookFeet },
      { label: 'Addons', value: entry.outfit.lookAddons },
      { label: 'Mount', value: entry.outfit.lookMount },
    ]);
    const flagsList = createChipsList(Object.entries(entry.flags).map(([key, value]) => ({ label: key, value })));
    const voicesList = createTextList(entry.voices, 'This NPC has no voice lines yet.');
    const messagesList = renderNpcMessages(entry.messages);
    const phrasesList = renderNpcPhrases(entry.phrases);
    const storagesList = createTextList(entry.storages, 'No storage values referenced yet.');

    detail.append(
      header,
      createSection('Attributes', attributes),
      createSection('Outfit', outfitDetails),
      createSection('Flags', flagsList),
      createSection('Voices', voicesList),
      createSection('Interaction messages', messagesList),
      createSection('Phrases', phrasesList),
      createSection('Storages', storagesList),
      renderRawScript(entry.raw)
    );
  }

  entries.forEach(entry => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'entity-card';

    const preview = createPreview(entry.outfit);
    const title = document.createElement('span');
    title.className = 'entity-card-title';
    title.textContent = entry.name;
    const subtitle = document.createElement('span');
    subtitle.className = 'entity-card-subtitle';
    subtitle.textContent = entry.description ?? 'No description available yet.';

    card.append(preview, title, subtitle);
    card.addEventListener('click', () => showDetail(entry, card));
    grid.append(card);
  });

  if (entries.length > 0) {
    showDetail(entries[0], grid.firstElementChild as HTMLElement);
  }

  layout.append(grid, detail);
  container.append(summary, layout);
}

export function createLoadingOverlay(message: string): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'entity-loading-overlay';
  const spinner = document.createElement('div');
  spinner.className = 'entity-loading-spinner';
  const text = document.createElement('p');
  text.className = 'entity-loading-text';
  text.textContent = message;
  overlay.append(spinner, text);
  return overlay;
}
