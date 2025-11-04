import { invoke } from "@tauri-apps/api/core";
import type { AttackEntry, DefenseEntry, LuaProperty, Monster, MonsterListEntry, MonsterMeta } from "./monsterTypes";
import { getAppearanceSprites } from "./spriteCache";
import { ensureAppearancesLoaded } from "./appearanceLoader";

export interface MonsterEditorOptions {
  onBack: () => void;
  monstersPath: string;
}

// Alias for backward compatibility with NPC editor
export interface EditorViewOptions {
  onBack: () => void;
}

let currentMonster: Monster | null = null;
let currentFilePath: string | null = null;
let monsterList: MonsterListEntry[] = [];
let lastEditorArea: HTMLElement | null = null;
let monsterListContainer: HTMLElement | null = null;
let monsterEditorAreaRef: HTMLElement | null = null;
let monsterSearchInput: HTMLInputElement | null = null;
let monstersRootPath: string | null = null;
let originalMonsterName: string | null = null;
let monsterSidebarRef: HTMLElement | null = null;

function ensureMonsterMeta(monster: Monster): MonsterMeta {
  if (!monster.meta) {
    monster.meta = { missingFields: [], touchedFields: [] };
  } else {
    if (!monster.meta.missingFields) {
      monster.meta.missingFields = [];
    }
    if (!monster.meta.touchedFields) {
      monster.meta.touchedFields = [];
    }
  }
  return monster.meta!;
}

function markFieldTouched(field: string) {
  if (!currentMonster) return;
  const meta = ensureMonsterMeta(currentMonster);
  if (!meta.touchedFields.includes(field)) {
    meta.touchedFields.push(field);
  }
}

export function createMonsterEditorView({ onBack, monstersPath }: MonsterEditorOptions): HTMLElement {
  const container = document.createElement("div");
  container.className = "monster-editor-container";
  monstersRootPath = monstersPath;

  // Header
  const header = createHeader(onBack);
  container.appendChild(header);

  // Main content with sidebar and editor
  const mainContent = document.createElement("div");
  mainContent.className = "monster-editor-main";

  // Sidebar with monster list
  const sidebar = createSidebar();
  mainContent.appendChild(sidebar);

  // Editor area
  const editorArea = createEditorArea();
  mainContent.appendChild(editorArea);

  container.appendChild(mainContent);

  // Load monster list
  loadMonsterList(monstersPath, sidebar);

  return container;
}

function createHeader(onBack: () => void): HTMLElement {
  const header = document.createElement("header");
  header.className = "monster-editor-header";

  const backButton = document.createElement("button");
  backButton.className = "editor-back-button";
  backButton.innerHTML = '<span class="btn-icon">🏠</span><span>Back to Home</span>';
  backButton.onclick = onBack;

  const title = document.createElement("h1");
  title.textContent = "Monster Editor";

  const actions = document.createElement("div");
  actions.className = "monster-header-actions";

  const reloadButton = document.createElement("button");
  reloadButton.type = "button";
  reloadButton.className = "editor-icon-button";
  reloadButton.innerHTML = '<span class="btn-icon">🔄</span><span>Reload</span>';
  reloadButton.title = "Recarregar diretório atual";
  reloadButton.addEventListener("click", () => {
    reloadCurrentMonsterDirectory();
  });

  const changeDirButton = document.createElement("button");
  changeDirButton.type = "button";
  changeDirButton.className = "editor-icon-button";
  changeDirButton.innerHTML = '<span class="btn-icon">📁</span><span>Mudar pasta</span>';
  changeDirButton.title = "Escolher um novo diretório de monstros";
  changeDirButton.addEventListener("click", () => {
    selectNewMonsterDirectory();
  });

  actions.append(reloadButton, changeDirButton);

  header.appendChild(backButton);
  header.appendChild(title);
  header.appendChild(actions);

  return header;
}

function createSidebar(): HTMLElement {
  const sidebar = document.createElement("aside");
  sidebar.className = "monster-sidebar";
  monsterSidebarRef = sidebar;

  const searchBox = document.createElement("input");
  searchBox.type = "text";
  searchBox.className = "monster-search";
  searchBox.placeholder = "Search monsters...";

  const monsterListEl = document.createElement("div");
  monsterListEl.className = "monster-list";

  monsterListContainer = monsterListEl;
  monsterSearchInput = searchBox;

  searchBox.addEventListener("input", () => {
    renderMonsterList(monsterListEl, searchBox.value);
  });

  sidebar.appendChild(searchBox);
  sidebar.appendChild(monsterListEl);

  return sidebar;
}

function createEditorArea(): HTMLElement {
  const editorArea = document.createElement("div");
  editorArea.className = "monster-editor-area";
  monsterEditorAreaRef = editorArea;

  const emptyState = document.createElement("div");
  emptyState.className = "monster-editor-empty";
  emptyState.textContent = "Select a monster to edit";
  editorArea.appendChild(emptyState);

  return editorArea;
}

function showEmptyMonsterEditorState() {
  if (!monsterEditorAreaRef) return;
  monsterEditorAreaRef.innerHTML = "";
  const emptyState = document.createElement("div");
  emptyState.className = "monster-editor-empty";
  emptyState.textContent = "Select a monster to edit";
  monsterEditorAreaRef.appendChild(emptyState);
}

async function loadMonsterList(monstersPath: string, sidebar: HTMLElement) {
  monstersRootPath = monstersPath;
  const listEl = sidebar.querySelector(".monster-list") as HTMLElement;
  listEl.innerHTML = "<div class='loading'>Carregando assets...</div>";

  try {
    await ensureAppearancesLoaded();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    listEl.innerHTML = `<div class='error'>${message}</div>`;
    return;
  }

  listEl.innerHTML = "<div class='loading'>Loading monsters...</div>";

  try {
    monsterList = await invoke<MonsterListEntry[]>("list_monster_files", { monstersPath });
    renderMonsterList(listEl);
  } catch (error) {
    listEl.innerHTML = `<div class='error'>Failed to load monsters: ${error}</div>`;
  }
}

async function reloadCurrentMonsterDirectory() {
  if (!monsterSidebarRef) {
    alert("Sidebar não está disponível para recarregar.");
    return;
  }

  if (!monstersRootPath) {
    await selectNewMonsterDirectory();
    return;
  }

  try {
    await loadMonsterList(monstersRootPath, monsterSidebarRef);
    if (currentFilePath && monsterEditorAreaRef) {
      await loadMonster(currentFilePath, monsterEditorAreaRef);
    }
  } catch (error) {
    alert(`Falha ao recarregar monstros: ${error}`);
  }
}

async function selectNewMonsterDirectory() {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selection = await open({ directory: true, multiple: false });
    if (typeof selection !== "string" || !selection) {
      return;
    }

    await invoke("set_monster_base_path", { monsterPath: selection });
    monstersRootPath = selection;
    showEmptyMonsterEditorState();
    if (monsterSidebarRef) {
      await loadMonsterList(selection, monsterSidebarRef);
    }
  } catch (error) {
    console.error("Failed to select monster directory:", error);
    alert("Não foi possível selecionar a nova pasta de monstros.");
  }
}

type MonsterCategoryNode = {
  name: string;
  path: string;
  children: Map<string, MonsterCategoryNode>;
  monsters: MonsterListEntry[];
};

type RenameMonsterResult = {
  filePath: string;
  relativePath: string;
};

function renderMonsterList(target?: HTMLElement, filterText?: string) {
  const listEl = target ?? monsterListContainer;
  if (!listEl) return;

  const normalizedFilter = (filterText ?? monsterSearchInput?.value ?? "").trim().toLowerCase();
  const entries =
    normalizedFilter.length === 0
      ? [...monsterList]
      : monsterList.filter((entry) => {
          const nameMatch = entry.name.toLowerCase().includes(normalizedFilter);
          const relativePath = entry.relativePath ?? entry.filePath;
          const pathMatch = relativePath.toLowerCase().includes(normalizedFilter);
          const categoryMatch = (entry.categories ?? []).some((cat) => cat.toLowerCase().includes(normalizedFilter));
          return nameMatch || pathMatch || categoryMatch;
        });

  if (entries.length === 0) {
    listEl.innerHTML = "<div class='empty'>No monsters found</div>";
    return;
  }

  const tree = buildMonsterTree(entries);
  listEl.innerHTML = "";
  const forceExpanded = normalizedFilter.length > 0;

  const rootMonsters = [...tree.monsters].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  rootMonsters.forEach((entry) => {
    listEl.appendChild(createMonsterListItem(entry, 0));
  });

  const categoryNodes = Array.from(tree.children.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  categoryNodes.forEach((node) => {
    listEl.appendChild(createMonsterCategoryElement(node, 0, forceExpanded));
  });

  if (currentFilePath) {
    const activeItem = findMonsterListItemByPath(currentFilePath);
    if (activeItem) {
      highlightActiveMonsterItem(activeItem);
    }
  }
}

function buildMonsterTree(entries: MonsterListEntry[]): MonsterCategoryNode {
  const root: MonsterCategoryNode = {
    name: "__root__",
    path: "",
    children: new Map(),
    monsters: [],
  };

  entries.forEach((entry) => {
    const categories = Array.isArray(entry.categories) ? entry.categories : [];
    let cursor = root;
    categories.forEach((category) => {
      if (!cursor.children.has(category)) {
        const nextPath = cursor.path ? `${cursor.path}/${category}` : category;
        cursor.children.set(category, {
          name: category,
          path: nextPath,
          children: new Map(),
          monsters: [],
        });
      }
      cursor = cursor.children.get(category)!;
    });
    cursor.monsters.push(entry);
  });

  return root;
}

function countMonstersInNode(node: MonsterCategoryNode): number {
  let total = node.monsters.length;
  node.children.forEach((child) => {
    total += countMonstersInNode(child);
  });
  return total;
}

function createMonsterCategoryElement(node: MonsterCategoryNode, depth: number, forceExpanded: boolean): HTMLElement {
  const details = document.createElement("details");
  details.className = "monster-category";
  if (forceExpanded) {
    details.open = true;
  }

  const summary = document.createElement("summary");
  summary.className = "monster-category-header";
  summary.style.paddingLeft = `${depth * 12 + 8}px`;

  const title = document.createElement("span");
  title.className = "category-name";
  title.textContent = node.name;

  const count = document.createElement("span");
  count.className = "category-count";
  count.textContent = countMonstersInNode(node).toString();

  summary.append(title, count);
  details.appendChild(summary);

  const childrenContainer = document.createElement("div");
  childrenContainer.className = "monster-category-children";
  details.appendChild(childrenContainer);

  const childCategories = Array.from(node.children.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  childCategories.forEach((child) => {
    childrenContainer.appendChild(createMonsterCategoryElement(child, depth + 1, forceExpanded));
  });

  const sortedMonsters = [...node.monsters].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  sortedMonsters.forEach((entry) => {
    childrenContainer.appendChild(createMonsterListItem(entry, depth + 1));
  });

  return details;
}

function createMonsterListItem(entry: MonsterListEntry, depth: number): HTMLElement {
  const item = document.createElement("div");
  item.className = "monster-list-item";
  item.dataset.path = entry.filePath;
  item.textContent = entry.name;
  item.style.paddingLeft = `${depth * 12 + 24}px`;

  if (entry.filePath === currentFilePath) {
    item.classList.add("active");
  }

  item.onclick = () => {
    if (!monsterEditorAreaRef) return;
    loadMonster(entry.filePath, monsterEditorAreaRef);
    highlightActiveMonsterItem(item);
  };

  return item;
}

function highlightActiveMonsterItem(activeItem: HTMLElement) {
  if (!monsterListContainer) return;
  monsterListContainer.querySelectorAll(".monster-list-item").forEach((item) => item.classList.remove("active"));
  activeItem.classList.add("active");

  let parent: HTMLElement | null = activeItem.parentElement as HTMLElement | null;
  while (parent && parent !== monsterListContainer) {
    if (parent.tagName.toLowerCase() === "details") {
      (parent as HTMLDetailsElement).open = true;
    }
    parent = parent.parentElement as HTMLElement | null;
  }

  activeItem.scrollIntoView({ block: "nearest" });
}

function findMonsterListItemByPath(path: string): HTMLElement | null {
  if (!monsterListContainer) return null;
  const items = monsterListContainer.querySelectorAll<HTMLElement>(".monster-list-item");
  for (const item of items) {
    if ((item.dataset.path || "") === path) {
      return item;
    }
  }
  return null;
}

async function loadMonster(filePath: string, editorArea: HTMLElement) {
  editorArea.innerHTML = "<div class='loading'>Loading monster...</div>";

  try {
    currentMonster = await invoke<Monster>("load_monster_file", { filePath });
    currentFilePath = filePath;
    if (currentMonster) {
      ensureMonsterMeta(currentMonster);
      originalMonsterName = currentMonster.name;
    }
    renderMonsterEditor(editorArea);
  } catch (error) {
    editorArea.innerHTML = `<div class='error'>Failed to load monster: ${error}</div>`;
  }
}

function renderMonsterEditor(editorArea: HTMLElement) {
  if (!currentMonster) return;

  lastEditorArea = editorArea;
  editorArea.innerHTML = "";

  // Save button at top
  const toolbar = document.createElement("div");
  toolbar.className = "monster-editor-toolbar";

  const saveButton = document.createElement("button");
  saveButton.className = "btn-primary";
  saveButton.textContent = "Save Monster";
  saveButton.onclick = saveMonster;

  toolbar.appendChild(saveButton);
  editorArea.appendChild(toolbar);

  // Single scrollable content area with all cards
  const contentArea = document.createElement("div");
  contentArea.className = "monster-content-area";
  editorArea.appendChild(contentArea);

  // Render all sections as cards
  renderAllSections(contentArea);
}

function refreshMonsterEditorView() {
  if (lastEditorArea && currentMonster) {
    renderMonsterEditor(lastEditorArea);
  }
}

function renderAllSections(container: HTMLElement) {
  if (!currentMonster) return;

  // Create a grid layout for cards
  const cardsGrid = document.createElement("div");
  cardsGrid.className = "monster-cards-grid";

  const leftColumn = document.createElement("div");
  leftColumn.className = "monster-card-column";

  const rightColumn = document.createElement("div");
  rightColumn.className = "monster-card-column";

  cardsGrid.append(leftColumn, rightColumn);
  container.appendChild(cardsGrid);

  const columns = [
    { element: leftColumn, height: 0 },
    { element: rightColumn, height: 0 }
  ];

  const appendCard = (card: HTMLElement | null) => {
    if (!card) return;

    const targetIndex = columns[0].height <= columns[1].height ? 0 : 1;
    const targetColumn = columns[targetIndex];
    targetColumn.element.appendChild(card);
    const rect = card.getBoundingClientRect();
    const measuredHeight = rect.height || card.offsetHeight || 0;
    columns[targetIndex].height += measuredHeight;
  };

  appendCard(createOutfitPreviewCard());
  appendCard(createBasicInfoCard());
  appendCard(createCombatStatsCard());
  appendCard(createAttacksCard());
  appendCard(createElementsImmunitiesCard());

  const lootCard = createLootCard();
  appendCard(lootCard);

  if (currentMonster.summon) {
    appendCard(createSummonsCard());
  }
  if (currentMonster.voices) {
    appendCard(createVoicesCard());
  }

  appendCard(createFlagsCard());
  appendCard(createAdvancedSettingsCard());

}

// Card creation functions
function createCard(title: string, content: HTMLElement): HTMLElement {
  const card = document.createElement("div");
  card.className = "monster-card";

  const header = document.createElement("div");
  header.className = "monster-card-header";
  header.textContent = title;

  const body = document.createElement("div");
  body.className = "monster-card-body";
  body.appendChild(content);

  card.appendChild(header);
  card.appendChild(body);

  return card;
}

function createBasicInfoCard(): HTMLElement {
  if (!currentMonster) return document.createElement("div");

  const content = document.createElement("div");
  content.className = "card-content";

  content.appendChild(createFormGroup("Name", "text", currentMonster.name, (value) => {
    if (currentMonster) currentMonster.name = value;
  }));

  content.appendChild(createFormGroup("Description", "textarea", currentMonster.description, (value) => {
    if (currentMonster) currentMonster.description = value;
    markFieldTouched("description");
  }));

  const statsRow = document.createElement("div");
  statsRow.className = "form-row";

  statsRow.appendChild(createFormGroup("Experience", "number", currentMonster.experience.toString(), (value) => {
    if (currentMonster) currentMonster.experience = parseInt(value) || 0;
    markFieldTouched("experience");
  }));

  statsRow.appendChild(createFormGroup("Health", "number", currentMonster.health.toString(), (value) => {
    if (currentMonster) currentMonster.health = parseInt(value) || 0;
    markFieldTouched("health");
  }));

  statsRow.appendChild(createFormGroup("Max Health", "number", currentMonster.maxHealth.toString(), (value) => {
    if (currentMonster) currentMonster.maxHealth = parseInt(value) || 0;
    markFieldTouched("maxHealth");
  }));

  content.appendChild(statsRow);

  const detailsRow = document.createElement("div");
  detailsRow.className = "form-row";

  detailsRow.appendChild(createFormGroup("Speed", "number", currentMonster.speed.toString(), (value) => {
    if (currentMonster) currentMonster.speed = parseInt(value) || 0;
    markFieldTouched("speed");
  }));

  detailsRow.appendChild(createFormGroup("Mana Cost", "number", currentMonster.manaCost.toString(), (value) => {
    if (currentMonster) currentMonster.manaCost = parseInt(value) || 0;
    markFieldTouched("manaCost");
  }));

  detailsRow.appendChild(createFormGroup("Race", "text", currentMonster.race, (value) => {
    if (currentMonster) currentMonster.race = value;
    markFieldTouched("race");
  }));

  content.appendChild(detailsRow);

  const idsRow = document.createElement("div");
  idsRow.className = "form-row";

  idsRow.appendChild(createFormGroup("Race ID", "number", currentMonster.raceId.toString(), (value) => {
    if (currentMonster) currentMonster.raceId = parseInt(value) || 0;
    markFieldTouched("raceId");
  }));

  idsRow.appendChild(createFormGroup("Corpse ID", "number", currentMonster.corpse.toString(), (value) => {
    if (currentMonster) currentMonster.corpse = parseInt(value) || 0;
    markFieldTouched("corpse");
  }));

  content.appendChild(idsRow);

  return createCard("📋 Basic Information", content);
}

function createOutfitPreviewCard(): HTMLElement {
  if (!currentMonster) return document.createElement("div");

  const outfit = currentMonster.outfit;
  const content = document.createElement("div");
  content.className = "card-content";

  // Outfit Preview
  const previewContainer = document.createElement("div");
  previewContainer.className = "outfit-preview";

  const spriteContainer = document.createElement("div");
  spriteContainer.className = "outfit-sprite-container";

  // Create sprite image element
  const spriteImg = document.createElement("img");
  spriteImg.className = "outfit-sprite-image";
  spriteImg.style.imageRendering = "pixelated";
  spriteImg.style.width = "80%";
  spriteImg.style.height = "80%";
  spriteImg.style.objectFit = "contain";

  // Function to load and display outfit sprite
  const loadOutfitSprite = async (lookType: number) => {
    try {
      const sprites = await getAppearanceSprites("Outfits", lookType);
      if (sprites.length > 0) {
        spriteImg.src = `data:image/png;base64,${sprites[0]}`;
        spriteImg.alt = `Outfit ${lookType}`;
      } else {
        spriteImg.src = "";
        spriteImg.alt = "No sprite available";
        spriteContainer.textContent = "A";
      }
    } catch (error) {
      console.error("Failed to load outfit sprite:", error);
      spriteImg.src = "";
      spriteImg.alt = "Failed to load";
      spriteContainer.textContent = "!";
    }
  };

  // Load initial sprite
  loadOutfitSprite(outfit.lookType);

  spriteContainer.appendChild(spriteImg);

  const outfitInfo = document.createElement("div");
  outfitInfo.className = "outfit-info";

  const createInfoItem = (label: string, value: string | number) => {
    const item = document.createElement("div");
    item.className = "outfit-info-item";

    const labelEl = document.createElement("div");
    labelEl.className = "outfit-info-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("div");
    valueEl.className = "outfit-info-value";
    valueEl.textContent = value.toString();

    item.append(labelEl, valueEl);
    return item;
  };

  outfitInfo.appendChild(createInfoItem("Type", outfit.lookType));
  outfitInfo.appendChild(createInfoItem("Head", outfit.lookHead));
  outfitInfo.appendChild(createInfoItem("Body", outfit.lookBody));
  outfitInfo.appendChild(createInfoItem("Legs", outfit.lookLegs));
  outfitInfo.appendChild(createInfoItem("Feet", outfit.lookFeet));
  outfitInfo.appendChild(createInfoItem("Addons", outfit.lookAddons));

  previewContainer.append(spriteContainer, outfitInfo);
  content.appendChild(previewContainer);

  // Outfit Edit Fields
  const editRow1 = document.createElement("div");
  editRow1.className = "form-row";

  editRow1.appendChild(createFormGroup("Look Type", "number", outfit.lookType.toString(), (value) => {
    if (currentMonster) {
      const newLookType = parseInt(value) || 0;
      currentMonster.outfit.lookType = newLookType;
      const preview = outfitInfo.children[0]?.querySelector('.outfit-info-value');
      if (preview) preview.textContent = value;
      loadOutfitSprite(newLookType);
    }
  }));

  editRow1.appendChild(createFormGroup("Look Mount", "number", outfit.lookMount.toString(), (value) => {
    if (currentMonster) currentMonster.outfit.lookMount = parseInt(value) || 0;
  }));

  content.appendChild(editRow1);

  const editRow2 = document.createElement("div");
  editRow2.className = "form-row";

  editRow2.appendChild(createFormGroup("Head", "number", outfit.lookHead.toString(), (value) => {
    if (currentMonster) {
      currentMonster.outfit.lookHead = parseInt(value) || 0;
      const preview = outfitInfo.children[1]?.querySelector('.outfit-info-value');
      if (preview) preview.textContent = value;
    }
  }));

  editRow2.appendChild(createFormGroup("Body", "number", outfit.lookBody.toString(), (value) => {
    if (currentMonster) {
      currentMonster.outfit.lookBody = parseInt(value) || 0;
      const preview = outfitInfo.children[2]?.querySelector('.outfit-info-value');
      if (preview) preview.textContent = value;
    }
  }));

  editRow2.appendChild(createFormGroup("Legs", "number", outfit.lookLegs.toString(), (value) => {
    if (currentMonster) {
      currentMonster.outfit.lookLegs = parseInt(value) || 0;
      const preview = outfitInfo.children[3]?.querySelector('.outfit-info-value');
      if (preview) preview.textContent = value;
    }
  }));

  editRow2.appendChild(createFormGroup("Feet", "number", outfit.lookFeet.toString(), (value) => {
    if (currentMonster) {
      currentMonster.outfit.lookFeet = parseInt(value) || 0;
      const preview = outfitInfo.children[4]?.querySelector('.outfit-info-value');
      if (preview) preview.textContent = value;
    }
  }));

  content.appendChild(editRow2);

  const editRow3 = document.createElement("div");
  editRow3.className = "form-row";

  editRow3.appendChild(createFormGroup("Addons", "number", outfit.lookAddons.toString(), (value) => {
    if (currentMonster) {
      currentMonster.outfit.lookAddons = parseInt(value) || 0;
      const preview = outfitInfo.children[5]?.querySelector('.outfit-info-value');
      if (preview) preview.textContent = value;
    }
  }));

  content.appendChild(editRow3);

  return createCard("👤 Outfit & Appearance", content);
}

function createCombatStatsCard(): HTMLElement {
  if (!currentMonster) return document.createElement("div");

  const content = document.createElement("div");
  content.className = "card-content";

  const row = document.createElement("div");
  row.className = "form-row";

  row.appendChild(createFormGroup("Defense", "number", currentMonster.defenses.defense.toString(), (value) => {
    if (currentMonster) currentMonster.defenses.defense = parseInt(value) || 0;
  }));

  row.appendChild(createFormGroup("Armor", "number", currentMonster.defenses.armor.toString(), (value) => {
    if (currentMonster) currentMonster.defenses.armor = parseInt(value) || 0;
  }));

  row.appendChild(createFormGroup("Mitigation", "number", currentMonster.defenses.mitigation.toString(), (value) => {
    if (currentMonster) currentMonster.defenses.mitigation = parseFloat(value) || 0;
  }));

  content.appendChild(row);

  return createCard("🛡️ Combat Stats", content);
}

function createAttacksCard(): HTMLElement {

  if (!currentMonster) return document.createElement("div");



  const content = document.createElement("div");

  content.className = "card-content";



  type SpellEntry = AttackEntry | DefenseEntry;



  const formatLuaDisplayValue = (raw: string): string => {

  const trimmed = raw.trim();



  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {

    return trimmed.slice(1, -1);

  }



  if (trimmed === "true") return "Yes";

  if (trimmed === "false") return "No";

  return trimmed;

};



const renderSpellEntry = (entry: SpellEntry, category: "attack" | "defense"): HTMLElement => {

    const container = document.createElement("div");

    container.className = "attack-item";



    const header = document.createElement("div");

    header.className = "attack-item-header";



    const nameEl = document.createElement("strong");

    nameEl.textContent = entry.name || "(Unnamed)";

    header.appendChild(nameEl);



    const badge = document.createElement("span");

    badge.className = `attack-badge ${category === "attack" ? "attack-badge-offense" : "attack-badge-defense"}`;

    badge.textContent = category === "attack" ? "Attack" : "Defense";

    header.appendChild(badge);



    container.appendChild(header);



    const metaEntries: Array<{ label: string; value: string }> = [];

    const addMeta = (label: string, value?: string | null) => {
      if (value && value.trim().length > 0) {
        metaEntries.push({ label, value });
      }
    };



    if ("interval" in entry && entry.interval > 0) {

      addMeta("Interval", `${entry.interval} ms`);

    }



    addMeta("Chance", `${entry.chance}%`);



    const minDamage = "minDamage" in entry ? entry.minDamage : undefined;

    const maxDamage = "maxDamage" in entry ? entry.maxDamage : undefined;

    if (minDamage !== undefined || maxDamage !== undefined) {

      if (minDamage !== undefined && maxDamage !== undefined) {

        addMeta("Damage", `${minDamage} to ${maxDamage}`);

      } else if (minDamage !== undefined) {

        addMeta("Damage", `${minDamage}`);

      } else if (maxDamage !== undefined) {

        addMeta("Damage", `${maxDamage}`);

      }

    }



    if ("range" in entry && entry.range !== undefined) {

      addMeta("Range", `${entry.range} tile${entry.range === 1 ? "" : "s"}`);

    }



    if ("radius" in entry && entry.radius !== undefined) {

      addMeta("Radius", `${entry.radius}`);

    }



    if ("length" in entry && entry.length !== undefined) {

      addMeta("Length", `${entry.length}`);

    }



    if ("spread" in entry && entry.spread !== undefined) {

      addMeta("Spread", `${entry.spread}`);

    }



    if (entry.target !== undefined) {

      addMeta("Target", entry.target ? "Yes" : "No");

    }



    if (entry.effect) {

      addMeta("Effect", formatLuaDisplayValue(entry.effect));

    }



    if ("shootEffect" in entry && entry.shootEffect) {

      addMeta("Shoot Effect", formatLuaDisplayValue(entry.shootEffect));

    }



    if (entry.combatType) {

      addMeta("Combat Type", formatLuaDisplayValue(entry.combatType));

    }



    if (entry.speedChange !== undefined) {

      addMeta("Speed Change", `${entry.speedChange}`);

    }



    if (entry.duration !== undefined) {

      addMeta("Duration", `${entry.duration} ms`);

    }



    if (metaEntries.length > 0) {

      const metaGrid = document.createElement("div");

      metaGrid.className = "attack-meta-grid";



      metaEntries.forEach(({ label, value }) => {

        const metaCell = document.createElement("div");

        metaCell.className = "attack-meta-entry";



        const labelEl = document.createElement("span");

        labelEl.className = "attack-meta-label";

        labelEl.textContent = label;



        const valueEl = document.createElement("span");

        valueEl.className = "attack-meta-value";

        valueEl.textContent = value;



        metaCell.append(labelEl, valueEl);

        metaGrid.appendChild(metaCell);

      });



      container.appendChild(metaGrid);

    }



    const appendPropertiesSection = (title: string, props?: LuaProperty[] | null) => {
      if (!props || props.length === 0) return;



      const section = document.createElement("div");

      section.className = "attack-subsection";



      const titleEl = document.createElement("div");

      titleEl.className = "attack-subsection-title";

      titleEl.textContent = title;

      section.appendChild(titleEl);



      const list = document.createElement("div");

      list.className = "attack-property-list";



      props.forEach((property) => {

        const row = document.createElement("div");

        row.className = "attack-property-row";



        const keyEl = document.createElement("span");

        keyEl.className = "attack-meta-label";

        keyEl.textContent = property.key;



        const valueEl = document.createElement("span");

        valueEl.className = "attack-meta-value";

        valueEl.textContent = formatLuaDisplayValue(property.value);



        row.append(keyEl, valueEl);

        list.appendChild(row);

      });



      section.appendChild(list);

      container.appendChild(section);

    };



    appendPropertiesSection("Condition", entry.condition);

    appendPropertiesSection("Extra Fields", entry.extraFields);



    return container;

  };



  const createSectionHeading = (title: string) => {

    const heading = document.createElement("h4");

    heading.textContent = title;

    heading.style.marginTop = "var(--space-lg)";

    heading.style.marginBottom = "var(--space-md)";

    heading.style.fontSize = "0.875rem";

    heading.style.fontWeight = "600";

    heading.style.color = "var(--text-secondary)";

    heading.style.textTransform = "uppercase";

    heading.style.letterSpacing = "0.05em";

    return heading;

  };



  const sections: Array<{ title: string; items: SpellEntry[]; category: "attack" | "defense" }> = [

    { title: "Offensive Spells", items: currentMonster.attacks, category: "attack" },

    { title: "Defensive Spells", items: currentMonster.defenses.entries, category: "defense" },

  ];



    let renderedSections = 0;

  sections.forEach(({ title, items, category }) => {

    if (items.length === 0) return;



    const heading = createSectionHeading(title);

    if (renderedSections === 0) {

      heading.style.marginTop = "0";

    }

    content.appendChild(heading);

    renderedSections += 1;



    const list = document.createElement("div");

    list.className = category === "attack" ? "attacks-list" : "defenses-list";



    items.forEach((entry) => {

      list.appendChild(renderSpellEntry(entry, category));

    });



    content.appendChild(list);

  });



  if (renderedSections === 0) {

    const empty = document.createElement("div");

    empty.className = "empty-state";

    empty.textContent = "No attacks or defenses configured";

    content.appendChild(empty);

  }



  const card = createCard("⚔️ Attacks & Defenses", content);
  attachCardEditButton(card, () => openSpellsEditorModal());
  return card;

}


function createElementsImmunitiesCard(): HTMLElement {
  if (!currentMonster) return document.createElement("div");

  const content = document.createElement("div");
  content.className = "card-content";

  // Elements
  if (currentMonster.elements.length > 0) {
    const elementsTitle = document.createElement("h4");
    elementsTitle.textContent = "Elements";
    elementsTitle.style.marginTop = "0";
    elementsTitle.style.marginBottom = "var(--space-md)";
    elementsTitle.style.fontSize = "0.875rem";
    elementsTitle.style.fontWeight = "600";
    elementsTitle.style.color = "var(--text-secondary)";
    elementsTitle.style.textTransform = "uppercase";
    elementsTitle.style.letterSpacing = "0.05em";
    content.appendChild(elementsTitle);

    const elementsList = document.createElement("div");
    elementsList.className = "elements-list";

    currentMonster.elements.forEach((element) => {
      const elementItem = document.createElement("div");
      elementItem.className = "element-item";
      elementItem.innerHTML = `<strong>${element.elementType}</strong>: ${element.percent}%`;
      elementsList.appendChild(elementItem);
    });

    content.appendChild(elementsList);
  }

  // Immunities
  if (currentMonster.immunities.length > 0) {
    const immunitiesTitle = document.createElement("h4");
    immunitiesTitle.textContent = "Immunities";
    immunitiesTitle.style.marginTop = "var(--space-lg)";
    immunitiesTitle.style.marginBottom = "var(--space-md)";
    immunitiesTitle.style.fontSize = "0.875rem";
    immunitiesTitle.style.fontWeight = "600";
    immunitiesTitle.style.color = "var(--text-secondary)";
    immunitiesTitle.style.textTransform = "uppercase";
    immunitiesTitle.style.letterSpacing = "0.05em";
    content.appendChild(immunitiesTitle);

    const immunitiesList = document.createElement("div");
    immunitiesList.className = "immunities-list";

    currentMonster.immunities.forEach((immunity) => {
      const immunityItem = document.createElement("div");
      immunityItem.className = "immunity-item";
      immunityItem.innerHTML = `<strong>${immunity.immunityType}</strong>: ${immunity.condition ? "Yes" : "No"}`;
      immunitiesList.appendChild(immunityItem);
    });

    content.appendChild(immunitiesList);
  }

  if (currentMonster.elements.length === 0 && currentMonster.immunities.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No elements or immunities configured";
    content.appendChild(empty);
  }

  const card = createCard("🧪 Elements & Immunities", content);
  attachCardEditButton(card, () => openElementsModal());
  return card;
}

function createLootCard(): HTMLElement {
  if (!currentMonster) return document.createElement("div");

  const content = document.createElement("div");
  content.className = "card-content";

  const lootList = document.createElement("div");
  lootList.className = "loot-list";

  if (currentMonster.loot.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <div class="empty-state-icon">🤷</div>
      <div>No loot items found for this monster</div>
    `;
    lootList.appendChild(emptyState);
  } else {
    const sortedLoot = [...currentMonster.loot].sort((a, b) => b.chance - a.chance);

    sortedLoot.forEach((item) => {
      const lootItem = document.createElement("div");
      lootItem.className = "loot-item";

      const itemName = item.name || (item.id ? `Item ID: ${item.id}` : "Unknown Item");
      const count = item.minCount || item.maxCount
        ? `<span style="color: var(--text-secondary)">x${item.minCount || 1}${item.maxCount && item.maxCount !== item.minCount ? `-${item.maxCount}` : ""}</span>`
        : "";

      lootItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${itemName}</strong> ${count}
          </div>
          <span class="loot-chance">${(item.chance / 1000).toFixed(2)}%</span>
        </div>
      `;

      lootList.appendChild(lootItem);
    });
  }

  content.appendChild(lootList);

  const card = createCard(`💰 Loot (${currentMonster.loot.length})`, content);
  attachCardEditButton(card, () => openLootEditorModal());
  return card;
}

function createSummonsCard(): HTMLElement {
  if (!currentMonster || !currentMonster.summon) return document.createElement("div");

  const content = document.createElement("div");
  content.className = "card-content";

  content.appendChild(createFormGroup("Max Summons", "number", currentMonster.summon.maxSummons.toString(), (value) => {
    if (currentMonster && currentMonster.summon) {
      currentMonster.summon.maxSummons = parseInt(value) || 0;
    }
  }));

  const summonsList = document.createElement("div");
  summonsList.className = "summons-list";

  currentMonster.summon.summons.forEach((summon) => {
    const summonItem = document.createElement("div");
    summonItem.className = "summon-item";
    summonItem.innerHTML = `
      <strong>${summon.name}</strong> -
      Count: ${summon.count},
      Chance: ${summon.chance}%,
      Interval: ${summon.interval}ms
    `;
    summonsList.appendChild(summonItem);
  });

  content.appendChild(summonsList);

  return createCard("🔮 Summons", content);
}

function createVoicesCard(): HTMLElement {
  if (!currentMonster || !currentMonster.voices) return document.createElement("div");

  const content = document.createElement("div");
  content.className = "card-content";

  const settingsRow = document.createElement("div");
  settingsRow.className = "form-row";

  settingsRow.appendChild(createFormGroup("Voice Interval", "number", currentMonster.voices.interval.toString(), (value) => {
    if (currentMonster && currentMonster.voices) {
      currentMonster.voices.interval = parseInt(value) || 0;
    }
  }));

  settingsRow.appendChild(createFormGroup("Voice Chance", "number", currentMonster.voices.chance.toString(), (value) => {
    if (currentMonster && currentMonster.voices) {
      currentMonster.voices.chance = parseInt(value) || 0;
    }
  }));

  content.appendChild(settingsRow);

  const voicesList = document.createElement("div");
  voicesList.className = "voices-list";

  currentMonster.voices.entries.forEach((voice) => {
    const voiceItem = document.createElement("div");
    voiceItem.className = "voice-item";
    voiceItem.innerHTML = `"${voice.text}" ${voice.yell ? "(yell)" : "(say)"}`;
    voicesList.appendChild(voiceItem);
  });

  content.appendChild(voicesList);

  const card = createCard("💬 Voices", content);
  attachCardEditButton(card, () => openVoicesModal());
  return card;
}

function createFlagsCard(): HTMLElement {
  if (!currentMonster) return document.createElement("div");

  const content = document.createElement("div");
  content.className = "card-content";

  const flags = currentMonster.flags;

  const flagsGrid = document.createElement("div");
  flagsGrid.style.display = "grid";
  flagsGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(200px, 1fr))";
  flagsGrid.style.gap = "var(--space-sm)";

  flagsGrid.appendChild(createCheckboxGroup("Summonable", flags.summonable, (value) => {
    if (currentMonster) currentMonster.flags.summonable = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Attackable", flags.attackable, (value) => {
    if (currentMonster) currentMonster.flags.attackable = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Hostile", flags.hostile, (value) => {
    if (currentMonster) currentMonster.flags.hostile = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Convinceable", flags.convinceable, (value) => {
    if (currentMonster) currentMonster.flags.convinceable = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Pushable", flags.pushable, (value) => {
    if (currentMonster) currentMonster.flags.pushable = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Reward Boss", flags.rewardBoss, (value) => {
    if (currentMonster) currentMonster.flags.rewardBoss = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Illusionable", flags.illusionable, (value) => {
    if (currentMonster) currentMonster.flags.illusionable = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Can Push Items", flags.canPushItems, (value) => {
    if (currentMonster) currentMonster.flags.canPushItems = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Can Push Creatures", flags.canPushCreatures, (value) => {
    if (currentMonster) currentMonster.flags.canPushCreatures = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Health Hidden", flags.healthHidden, (value) => {
    if (currentMonster) currentMonster.flags.healthHidden = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Is Blockable", flags.isBlockable, (value) => {
    if (currentMonster) currentMonster.flags.isBlockable = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Can Walk On Energy", flags.canWalkOnEnergy, (value) => {
    if (currentMonster) currentMonster.flags.canWalkOnEnergy = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Can Walk On Fire", flags.canWalkOnFire, (value) => {
    if (currentMonster) currentMonster.flags.canWalkOnFire = value;
  }));

  flagsGrid.appendChild(createCheckboxGroup("Can Walk On Poison", flags.canWalkOnPoison, (value) => {
    if (currentMonster) currentMonster.flags.canWalkOnPoison = value;
  }));

  content.appendChild(flagsGrid);

  const numericRow = document.createElement("div");
  numericRow.className = "form-row";
  numericRow.style.marginTop = "var(--space-md)";

  numericRow.appendChild(createFormGroup("Static Attack Chance", "number", flags.staticAttackChance.toString(), (value) => {
    if (currentMonster) currentMonster.flags.staticAttackChance = parseInt(value) || 0;
  }));

  numericRow.appendChild(createFormGroup("Target Distance", "number", flags.targetDistance.toString(), (value) => {
    if (currentMonster) currentMonster.flags.targetDistance = parseInt(value) || 0;
  }));

  numericRow.appendChild(createFormGroup("Run Health", "number", flags.runHealth.toString(), (value) => {
    if (currentMonster) currentMonster.flags.runHealth = parseInt(value) || 0;
  }));

  content.appendChild(numericRow);

  return createCard("⚙️ Flags", content);
}

function createAdvancedSettingsCard(): HTMLElement {
  if (!currentMonster) return document.createElement("div");

  const content = document.createElement("div");
  content.className = "card-content";

  // Light
  const lightTitle = document.createElement("h4");
  lightTitle.textContent = "Light";
  lightTitle.style.marginTop = "0";
  lightTitle.style.marginBottom = "var(--space-md)";
  lightTitle.style.fontSize = "0.875rem";
  lightTitle.style.fontWeight = "600";
  lightTitle.style.color = "var(--text-secondary)";
  lightTitle.style.textTransform = "uppercase";
  lightTitle.style.letterSpacing = "0.05em";
  content.appendChild(lightTitle);

  const lightRow = document.createElement("div");
  lightRow.className = "form-row";

  lightRow.appendChild(createFormGroup("Light Level", "number", currentMonster.light.level.toString(), (value) => {
    if (currentMonster) currentMonster.light.level = parseInt(value) || 0;
  }));

  lightRow.appendChild(createFormGroup("Light Color", "number", currentMonster.light.color.toString(), (value) => {
    if (currentMonster) currentMonster.light.color = parseInt(value) || 0;
  }));

  content.appendChild(lightRow);

  // Change Target
  const targetTitle = document.createElement("h4");
  targetTitle.textContent = "Change Target";
  targetTitle.style.marginTop = "var(--space-lg)";
  targetTitle.style.marginBottom = "var(--space-md)";
  targetTitle.style.fontSize = "0.875rem";
  targetTitle.style.fontWeight = "600";
  targetTitle.style.color = "var(--text-secondary)";
  targetTitle.style.textTransform = "uppercase";
  targetTitle.style.letterSpacing = "0.05em";
  content.appendChild(targetTitle);

  const targetRow = document.createElement("div");
  targetRow.className = "form-row";

  targetRow.appendChild(createFormGroup("Interval", "number", currentMonster.changeTarget.interval.toString(), (value) => {
    if (currentMonster) currentMonster.changeTarget.interval = parseInt(value) || 0;
  }));

  targetRow.appendChild(createFormGroup("Chance", "number", currentMonster.changeTarget.chance.toString(), (value) => {
    if (currentMonster) currentMonster.changeTarget.chance = parseInt(value) || 0;
  }));

  content.appendChild(targetRow);

  // Strategies
  const strategiesTitle = document.createElement("h4");
  strategiesTitle.textContent = "Target Strategies";
  strategiesTitle.style.marginTop = "var(--space-lg)";
  strategiesTitle.style.marginBottom = "var(--space-md)";
  strategiesTitle.style.fontSize = "0.875rem";
  strategiesTitle.style.fontWeight = "600";
  strategiesTitle.style.color = "var(--text-secondary)";
  strategiesTitle.style.textTransform = "uppercase";
  strategiesTitle.style.letterSpacing = "0.05em";
  content.appendChild(strategiesTitle);

  const strategiesRow = document.createElement("div");
  strategiesRow.className = "form-row";

  strategiesRow.appendChild(createFormGroup("Nearest", "number", currentMonster.strategiesTarget.nearest.toString(), (value) => {
    if (currentMonster) currentMonster.strategiesTarget.nearest = parseInt(value) || 0;
  }));

  strategiesRow.appendChild(createFormGroup("Health", "number", currentMonster.strategiesTarget.health.toString(), (value) => {
    if (currentMonster) currentMonster.strategiesTarget.health = parseInt(value) || 0;
  }));

  strategiesRow.appendChild(createFormGroup("Damage", "number", currentMonster.strategiesTarget.damage.toString(), (value) => {
    if (currentMonster) currentMonster.strategiesTarget.damage = parseInt(value) || 0;
  }));

  strategiesRow.appendChild(createFormGroup("Random", "number", currentMonster.strategiesTarget.random.toString(), (value) => {
    if (currentMonster) currentMonster.strategiesTarget.random = parseInt(value) || 0;
  }));

  content.appendChild(strategiesRow);

  return createCard("🔧 Advanced Settings", content);
}

function createFormGroup(label: string, type: string, value: string, onChange: (value: string) => void): HTMLElement {
  const group = document.createElement("div");
  group.className = "form-group";

  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  group.appendChild(labelEl);

  if (type === "textarea") {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.addEventListener("input", () => onChange(textarea.value));
    group.appendChild(textarea);
  } else {
    const input = document.createElement("input");
    input.type = type;
    input.value = value;
    input.addEventListener("input", () => onChange(input.value));
    group.appendChild(input);
  }

  return group;
}

function attachCardEditButton(card: HTMLElement, onClick: () => void) {
  const header = card.querySelector(".monster-card-header");
  if (!header) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "card-edit-button";
  button.textContent = "Editar";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    try {
      onClick();
    } catch (error) {
      console.error("Failed to open monster editor modal:", error);
      alert("Nao foi possivel abrir o editor. Verifique o console para mais detalhes.");
    }
  });
  header.appendChild(button);
}

let activeMonsterModal: {
  element: HTMLElement;
  restoreFocus: HTMLElement | null;
  keyHandler: (event: KeyboardEvent) => void;
} | null = null;

function closeMonsterModal() {
  if (!activeMonsterModal) return;
  document.removeEventListener("keydown", activeMonsterModal.keyHandler);
  activeMonsterModal.element.remove();
  activeMonsterModal.restoreFocus?.focus();
  activeMonsterModal = null;
}

type MonsterModalRenderHelpers = {
  addAction: (action: HTMLElement) => void;
};

function showMonsterModal(
  title: string,
  render: (body: HTMLElement, helpers: MonsterModalRenderHelpers) => (() => boolean | void) | void,
): void {
  closeMonsterModal();

  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const backdrop = document.createElement("div");
  backdrop.className = "monster-modal-backdrop";

  const modal = document.createElement("div");
  modal.className = "monster-modal";

  const header = document.createElement("div");
  header.className = "monster-modal-header";

  const titleEl = document.createElement("h3");
  titleEl.textContent = title;

  const toolbar = document.createElement("div");
  toolbar.className = "monster-modal-toolbar";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "modal-close-button";
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = () => closeMonsterModal();

  header.append(titleEl, toolbar, closeBtn);

  const body = document.createElement("div");
  body.className = "monster-modal-body";

  const footer = document.createElement("div");
  footer.className = "monster-modal-footer";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn-secondary";
  cancelBtn.textContent = "Cancelar";
  cancelBtn.onclick = () => closeMonsterModal();

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "btn-primary";
  saveBtn.textContent = "Salvar";

  footer.append(cancelBtn, saveBtn);

  modal.append(header, body, footer);
  backdrop.appendChild(modal);

  const keyHandler = (event: KeyboardEvent) => {
    if (event.key === "Escape" && activeMonsterModal) {
      event.preventDefault();
      closeMonsterModal();
    }
  };
  document.addEventListener("keydown", keyHandler);

  const host = document.querySelector(".monster-editor-container") || document.body;
  host.appendChild(backdrop);
  activeMonsterModal = { element: backdrop, restoreFocus: previousFocus, keyHandler };

  const helpers: MonsterModalRenderHelpers = {
    addAction: (action: HTMLElement) => {
      action.classList.add("monster-modal-action");
      toolbar.appendChild(action);
    },
  };

  const saveHandler = render(body, helpers);

  const handleSave = () => {
    if (typeof saveHandler === "function") {
      const result = saveHandler();
      if (result === false) {
        return;
      }
    }
    closeMonsterModal();
    refreshMonsterEditorView();
  };

  saveBtn.onclick = handleSave;
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) {
      closeMonsterModal();
    }
  });
}

function createModalField(labelText: string, input: HTMLElement): HTMLElement {
  const wrapper = document.createElement("label");
  wrapper.className = "monster-modal-field";

  const label = document.createElement("span");
  label.textContent = labelText;
  wrapper.append(label, input);
  return wrapper;
}

function createModalSection(title: string): HTMLElement {
  const section = document.createElement("div");
  section.className = "monster-modal-section";

  const heading = document.createElement("h4");
  heading.textContent = title;
  section.appendChild(heading);
  return section;
}

function openLootEditorModal() {
  if (!currentMonster) return;

  const lootEntries = currentMonster.loot.map((item) => ({ ...item }));

  showMonsterModal("Editar Loot", (body, helpers) => {
    const section = createModalSection("Itens de Loot");
    body.appendChild(section);

    const list = document.createElement("div");
    list.className = "modal-list";
    section.appendChild(list);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "btn-secondary";
    addButton.textContent = "Adicionar Item";
    addButton.onclick = () => {
      lootEntries.push({
        name: "",
        chance: 0,
      });
      renderList();
    };
    helpers.addAction(addButton);

    function renderList() {
      list.innerHTML = "";
      if (lootEntries.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "Nenhum item configurado";
        list.appendChild(empty);
        return;
      }

      lootEntries.forEach((entry, index) => {
        const row = document.createElement("div");
        row.className = "modal-list-item";

        const header = document.createElement("div");
        header.className = "modal-list-item-header";
        header.textContent = `Item ${index + 1}`;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn-icon";
        removeBtn.innerHTML = "&times;";
        removeBtn.title = "Remover";
        removeBtn.onclick = () => {
          lootEntries.splice(index, 1);
          renderList();
        };
        header.appendChild(removeBtn);

        const grid = document.createElement("div");
        grid.className = "modal-grid";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = entry.name ?? "";
        nameInput.placeholder = "Nome do item";
        nameInput.oninput = () => {
          entry.name = nameInput.value || undefined;
        };

        const idInput = document.createElement("input");
        idInput.type = "number";
        idInput.value = entry.id?.toString() ?? "";
        idInput.placeholder = "ID (opcional)";
        idInput.oninput = () => {
          const value = parseInt(idInput.value, 10);
          entry.id = Number.isNaN(value) ? undefined : value;
        };

        const chanceInput = document.createElement("input");
        chanceInput.type = "number";
        chanceInput.min = "0";
        chanceInput.value = entry.chance.toString();
        chanceInput.oninput = () => {
          entry.chance = parseInt(chanceInput.value, 10) || 0;
        };

        const minInput = document.createElement("input");
        minInput.type = "number";
        minInput.min = "0";
        minInput.value = entry.minCount?.toString() ?? "";
        minInput.oninput = () => {
          const value = parseInt(minInput.value, 10);
          entry.minCount = Number.isNaN(value) ? undefined : value;
        };

        const maxInput = document.createElement("input");
        maxInput.type = "number";
        maxInput.min = "0";
        maxInput.value = entry.maxCount?.toString() ?? "";
        maxInput.oninput = () => {
          const value = parseInt(maxInput.value, 10);
          entry.maxCount = Number.isNaN(value) ? undefined : value;
        };

        grid.append(
          createModalField("Nome", nameInput),
          createModalField("ID", idInput),
          createModalField("Chance (0-100000)", chanceInput),
          createModalField("Qtd. Minima", minInput),
          createModalField("Qtd. Maxima", maxInput),
        );

        row.append(header, grid);
        list.appendChild(row);
      });
    }

    renderList();

    return () => {
      if (!currentMonster) return false;
      currentMonster.loot = lootEntries
        .map((entry) => ({
          id: entry.id,
          name: entry.name?.trim() || undefined,
          chance: entry.chance || 0,
          minCount: entry.minCount,
          maxCount: entry.maxCount,
        }))
        .filter((entry) => (entry.id !== undefined || entry.name) && entry.chance >= 0);
      return true;
    };
  });
}

type SpellFieldConfig = {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox";
};

function buildSpellFields(category: "attack" | "defense"): SpellFieldConfig[] {
  const shared: SpellFieldConfig[] = [
    { key: "name", label: "Nome", type: "text" },
    { key: "interval", label: "Intervalo (ms)", type: "number" },
    { key: "chance", label: "Chance (%)", type: "number" },
    { key: "minDamage", label: "Dano minimo", type: "number" },
    { key: "maxDamage", label: "Dano maximo", type: "number" },
    { key: "combatType", label: "Tipo", type: "text" },
    { key: "target", label: "Precisa alvo", type: "checkbox" },
    { key: "effect", label: "Efeito", type: "text" },
    { key: "speedChange", label: "Alteracao velocidade", type: "number" },
    { key: "duration", label: "Duracao (ms)", type: "number" },
  ];

  if (category === "attack") {
    return [
      ...shared,
      { key: "range", label: "Alcance", type: "number" },
      { key: "radius", label: "Raio", type: "number" },
      { key: "length", label: "Comprimento", type: "number" },
      { key: "spread", label: "Abertura", type: "number" },
      { key: "shootEffect", label: "Efeito projetil", type: "text" },
    ];
  }

  return shared;
}

function renderPropertyEditor(title: string, properties: LuaProperty[] | undefined, onChange: (values: LuaProperty[]) => void) {
  const container = document.createElement("div");
  container.className = "attack-subsection";

  const heading = document.createElement("div");
  heading.className = "attack-subsection-title";
  heading.textContent = title;

  const list = document.createElement("div");
  list.className = "attack-property-list";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "btn-secondary btn-compact";
  addBtn.textContent = "Adicionar propriedade";

  container.append(heading, list, addBtn);

  const values = properties ?? [];
  if (!properties) {
    onChange(values);
  }

  const renderList = () => {
    list.innerHTML = "";
    if (values.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Nenhuma propriedade";
      list.appendChild(empty);
      return;
    }

    values.forEach((prop, index) => {
      const row = document.createElement("div");
      row.className = "attack-property-row";

      const keyInput = document.createElement("input");
      keyInput.type = "text";
      keyInput.value = prop.key;
      keyInput.placeholder = "Chave";
      keyInput.oninput = () => {
        prop.key = keyInput.value;
      };

      const valueInput = document.createElement("input");
      valueInput.type = "text";
      valueInput.value = prop.value;
      valueInput.placeholder = "Valor";
      valueInput.oninput = () => {
        prop.value = valueInput.value;
      };

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn-icon";
      remove.innerHTML = "&times;";
      remove.title = "Remover";
      remove.onclick = () => {
        values.splice(index, 1);
        onChange(values);
        renderList();
      };

      row.append(keyInput, valueInput, remove);
      list.appendChild(row);
    });
  };

  addBtn.onclick = () => {
    values.push({ key: "", value: "" });
    onChange(values);
    renderList();
  };

  renderList();

  return {
    element: container,
  };
}

function openSpellsEditorModal() {
  if (!currentMonster) return;

  const attacks = currentMonster.attacks.map((attack) => JSON.parse(JSON.stringify(attack)));
  const defenses = currentMonster.defenses.entries.map((defense) => JSON.parse(JSON.stringify(defense)));

  showMonsterModal("Editar Ataques & Defesas", (body, helpers) => {
    const sectionsWrapper = document.createElement("div");
    sectionsWrapper.className = "modal-sections-wrapper";
    body.appendChild(sectionsWrapper);

    const buildSection = (title: string, entries: (AttackEntry | DefenseEntry)[], category: "attack" | "defense") => {
      const section = createModalSection(title);
      section.classList.add("modal-spell-section");
      sectionsWrapper.appendChild(section);

      const list = document.createElement("div");
      list.className = "modal-list";
      section.appendChild(list);

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "btn-secondary";
      addBtn.textContent = category === "attack" ? "Adicionar Ataque" : "Adicionar Defesa";
      addBtn.onclick = () => {
        if (category === "attack") {
          entries.push({
            name: "",
            interval: 2000,
            chance: 100,
          } as AttackEntry);
        } else {
          entries.push({
            name: "",
            interval: 2000,
            chance: 100,
          } as DefenseEntry);
        }
        renderList();
      };
      helpers.addAction(addBtn);

      const fieldConfig = buildSpellFields(category);

      const renderList = () => {
        list.innerHTML = "";
        if (entries.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty-state";
          empty.textContent = "Nenhum registro";
          list.appendChild(empty);
          return;
        }

        entries.forEach((entry, index) => {
          const row = document.createElement("div");
          row.className = "modal-list-item";

          const header = document.createElement("div");
          header.className = "modal-list-item-header";
          header.textContent = `${title} ${index + 1}`;

          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "btn-icon";
          removeBtn.innerHTML = "&times;";
          removeBtn.title = "Remover";
          removeBtn.onclick = () => {
            entries.splice(index, 1);
            renderList();
          };
          header.appendChild(removeBtn);

          const grid = document.createElement("div");
          grid.className = "modal-grid";

          fieldConfig.forEach((field) => {
            const input = document.createElement("input");
            if (field.type === "checkbox") {
              input.type = "checkbox";
              input.checked = Boolean((entry as any)[field.key]);
              input.onchange = () => {
                (entry as any)[field.key] = input.checked;
              };
            } else {
              input.type = "number" === field.type ? "number" : "text";
              const value = (entry as any)[field.key];
              input.value = value !== undefined && value !== null ? value.toString() : "";
              input.oninput = () => {
                const val = input.value.trim();
                if (field.type === "number") {
                  if (val === "") {
                    (entry as any)[field.key] = undefined;
                    return;
                  }
                  const num = Number(val);
                  (entry as any)[field.key] = Number.isNaN(num) ? undefined : num;
                } else {
                  (entry as any)[field.key] = val || undefined;
                }
              };
            }
            grid.appendChild(createModalField(field.label, input));
          });

          const conditionEditor = renderPropertyEditor("Condicao", (entry as any).condition, (values) => {
            (entry as any).condition = values;
          });
          const extrasEditor = renderPropertyEditor("Propriedades extras", (entry as any).extra_fields || (entry as any).extraFields, (values) => {
            (entry as any).extra_fields = values;
            (entry as any).extraFields = values;
          });

          row.append(header, grid, conditionEditor.element, extrasEditor.element);
          list.appendChild(row);
        });
      };

      renderList();
    };

    buildSection("Ataques", attacks, "attack");
    buildSection("Defesas", defenses, "defense");

    return () => {
      if (!currentMonster) return false;
      currentMonster.attacks = attacks;
      currentMonster.defenses.entries = defenses;
      return true;
    };
  });
}

function openElementsModal() {
  if (!currentMonster) return;

  const elements = currentMonster.elements.map((element) => ({ ...element }));
  const immunities = currentMonster.immunities.map((immunity) => ({ ...immunity }));

  showMonsterModal("Editar Elementos & Imunidades", (body, helpers) => {
    const elementsSection = createModalSection("Elementos");
    const immunitySection = createModalSection("Imunidades");
    body.append(elementsSection, immunitySection);

    const renderSimpleList = (
      section: HTMLElement,
      entries: Array<Record<string, any>>,
      fields: Array<{ key: string; label: string; type: "text" | "number" | "checkbox" }>,
      addDefaults: () => Record<string, any>,
      addButtonLabel: string,
    ) => {
      const list = document.createElement("div");
      list.className = "modal-list";
      section.appendChild(list);

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "btn-secondary";
      addBtn.textContent = addButtonLabel;
      addBtn.onclick = () => {
        entries.push(addDefaults());
        render();
      };
      helpers.addAction(addBtn);

      const render = () => {
        list.innerHTML = "";
        if (entries.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty-state";
          empty.textContent = "Nenhum registro";
          list.appendChild(empty);
          return;
        }

        entries.forEach((entry, index) => {
          const row = document.createElement("div");
          row.className = "modal-list-item";

          const header = document.createElement("div");
          header.className = "modal-list-item-header";
          header.textContent = `${section.querySelector("h4")?.textContent || "Item"} ${index + 1}`;

          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "btn-icon";
          removeBtn.innerHTML = "&times;";
          removeBtn.title = "Remover";
          removeBtn.onclick = () => {
            entries.splice(index, 1);
            render();
          };
          header.appendChild(removeBtn);

          const grid = document.createElement("div");
          grid.className = "modal-grid";

          fields.forEach((field) => {
            const input = document.createElement("input");
            input.type = field.type === "checkbox" ? "checkbox" : field.type;

            if (field.type === "checkbox") {
              input.checked = Boolean(entry[field.key]);
              input.onchange = () => {
                entry[field.key] = input.checked;
              };
            } else {
              input.value = entry[field.key]?.toString() ?? "";
              input.oninput = () => {
                const val = input.value.trim();
                if (field.type === "number") {
                  const num = Number(val);
                  entry[field.key] = val === "" || Number.isNaN(num) ? undefined : num;
                } else {
                  entry[field.key] = val;
                }
              };
            }

            grid.appendChild(createModalField(field.label, input));
          });

          row.append(header, grid);
          list.appendChild(row);
        });
      };

      render();
    };

    renderSimpleList(
      elementsSection,
      elements,
      [
        { key: "elementType", label: "Tipo", type: "text" },
        { key: "percent", label: "%", type: "number" },
      ],
      () => ({ elementType: "", percent: 0 }),
      "Adicionar Elemento",
    );

    renderSimpleList(
      immunitySection,
      immunities,
      [
        { key: "immunityType", label: "Tipo", type: "text" },
        { key: "condition", label: "Immune", type: "checkbox" },
      ],
      () => ({ immunityType: "", condition: false }),
      "Adicionar Imunidade",
    );

    return () => {
      if (!currentMonster) return false;
      currentMonster.elements = elements.filter((el) => el.elementType.trim().length > 0);
      currentMonster.immunities = immunities.filter((imm) => imm.immunityType.trim().length > 0);
      return true;
    };
  });
}

function openVoicesModal() {
  if (!currentMonster) return;

  const voices = currentMonster.voices
    ? {
        interval: currentMonster.voices.interval,
        chance: currentMonster.voices.chance,
        entries: currentMonster.voices.entries.map((voice) => ({ ...voice })),
      }
    : {
        interval: 5000,
        chance: 10,
        entries: [],
      };

  showMonsterModal("Editar Falas", (body, helpers) => {
    const metaSection = createModalSection("Configuracoes");
    const listSection = createModalSection("Falas");
    body.append(metaSection, listSection);

    const intervalInput = document.createElement("input");
    intervalInput.type = "number";
    intervalInput.value = voices.interval.toString();
    intervalInput.oninput = () => {
      voices.interval = parseInt(intervalInput.value, 10) || 0;
    };

    const chanceInput = document.createElement("input");
    chanceInput.type = "number";
    chanceInput.value = voices.chance.toString();
    chanceInput.oninput = () => {
      voices.chance = parseInt(chanceInput.value, 10) || 0;
    };

    const grid = document.createElement("div");
    grid.className = "modal-grid";
    grid.append(createModalField("Intervalo (ms)", intervalInput), createModalField("Chance (%)", chanceInput));
    metaSection.appendChild(grid);

    const list = document.createElement("div");
    list.className = "modal-list";
    listSection.appendChild(list);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-secondary";
    addBtn.textContent = "Adicionar fala";
    addBtn.onclick = () => {
      voices.entries.push({ text: "", yell: false });
      renderVoices();
    };
    helpers.addAction(addBtn);

    function renderVoices() {
      list.innerHTML = "";
      if (voices.entries.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "Nenhuma fala cadastrada";
        list.appendChild(empty);
        return;
      }

      voices.entries.forEach((voice, index) => {
        const row = document.createElement("div");
        row.className = "modal-list-item";

        const header = document.createElement("div");
        header.className = "modal-list-item-header";
        header.textContent = `Fala ${index + 1}`;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn-icon";
        removeBtn.innerHTML = "&times;";
        removeBtn.title = "Remover";
        removeBtn.onclick = () => {
          voices.entries.splice(index, 1);
          renderVoices();
        };

        header.appendChild(removeBtn);

        const textInput = document.createElement("textarea");
        textInput.value = voice.text;
        textInput.rows = 2;
        textInput.oninput = () => {
          voice.text = textInput.value;
        };

        const yellLabel = document.createElement("label");
        yellLabel.className = "monster-modal-field checkbox";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = voice.yell;
        checkbox.onchange = () => {
          voice.yell = checkbox.checked;
        };
        const span = document.createElement("span");
        span.textContent = "Gritar";
        yellLabel.append(checkbox, span);

        row.append(header, createModalField("Texto", textInput), yellLabel);
        list.appendChild(row);
      });
    }

    renderVoices();

    return () => {
      if (!currentMonster) return false;
      currentMonster.voices = voices;
      return true;
    };
  });
}

function createCheckboxGroup(label: string, checked: boolean, onChange: (value: boolean) => void): HTMLElement {
  const group = document.createElement("div");
  group.className = "form-group checkbox-group";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  checkbox.id = `checkbox-${label.replace(/\s+/g, "-")}`;
  checkbox.addEventListener("change", () => onChange(checkbox.checked));

  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  labelEl.htmlFor = checkbox.id;

  group.appendChild(checkbox);
  group.appendChild(labelEl);

  return group;
}

async function saveMonster() {
  if (!currentMonster || !currentFilePath) {
    alert("No monster loaded");
    return;
  }

  ensureMonsterMeta(currentMonster);
  const previousName = originalMonsterName;
  const previousPath = currentFilePath;

  try {
    await invoke("save_monster_file", {
      filePath: currentFilePath,
      monster: currentMonster,
    });

    let needsListRefresh = false;
    const trimmedCurrentName = currentMonster.name.trim();
    const nameChanged = Boolean(previousName && trimmedCurrentName && trimmedCurrentName !== previousName.trim());

    if (nameChanged && monstersRootPath) {
      try {
        const renameResult = await invoke<RenameMonsterResult>("rename_monster_file", {
          oldPath: previousPath,
          newName: trimmedCurrentName,
          monstersRoot: monstersRootPath,
        });

        const listEntry = monsterList.find((entry) => entry.filePath === previousPath);
        if (listEntry) {
          listEntry.name = trimmedCurrentName;
          listEntry.filePath = renameResult.filePath;
          listEntry.relativePath = renameResult.relativePath;
        }

        currentFilePath = renameResult.filePath;
        originalMonsterName = trimmedCurrentName;
        needsListRefresh = true;
      } catch (renameError) {
        alert(`Monster saved, but failed to rename file: ${renameError}`);
      }
    } else if (nameChanged) {
      const listEntry = monsterList.find((entry) => entry.filePath === previousPath);
      if (listEntry) {
        listEntry.name = trimmedCurrentName;
        needsListRefresh = true;
      }
      originalMonsterName = trimmedCurrentName;
    }

    if (needsListRefresh) {
      renderMonsterList();
    }

    alert("Monster saved successfully!");
  } catch (error) {
    alert(`Failed to save monster: ${error}`);
  }
}

















