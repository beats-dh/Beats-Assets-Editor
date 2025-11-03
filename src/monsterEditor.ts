import { invoke } from "@tauri-apps/api/core";
import type { Monster, MonsterListEntry } from "./monsterTypes";
import { getAppearanceSprites } from "./spriteCache";

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

export function createMonsterEditorView({ onBack, monstersPath }: MonsterEditorOptions): HTMLElement {
  const container = document.createElement("div");
  container.className = "monster-editor-container";

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
  loadMonsterList(monstersPath, sidebar, editorArea);

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

  header.appendChild(backButton);
  header.appendChild(title);

  return header;
}

function createSidebar(): HTMLElement {
  const sidebar = document.createElement("aside");
  sidebar.className = "monster-sidebar";

  const searchBox = document.createElement("input");
  searchBox.type = "text";
  searchBox.className = "monster-search";
  searchBox.placeholder = "Search monsters...";

  const monsterListEl = document.createElement("div");
  monsterListEl.className = "monster-list";

  searchBox.addEventListener("input", () => {
    const query = searchBox.value.toLowerCase();
    filterMonsterList(monsterListEl, query);
  });

  sidebar.appendChild(searchBox);
  sidebar.appendChild(monsterListEl);

  return sidebar;
}

function createEditorArea(): HTMLElement {
  const editorArea = document.createElement("div");
  editorArea.className = "monster-editor-area";

  const emptyState = document.createElement("div");
  emptyState.className = "monster-editor-empty";
  emptyState.textContent = "Select a monster to edit";
  editorArea.appendChild(emptyState);

  return editorArea;
}

async function loadMonsterList(monstersPath: string, sidebar: HTMLElement, editorArea: HTMLElement) {
  const listEl = sidebar.querySelector(".monster-list") as HTMLElement;
  listEl.innerHTML = "<div class='loading'>Loading monsters...</div>";

  try {
    monsterList = await invoke<MonsterListEntry[]>("list_monster_files", { monstersPath });

    listEl.innerHTML = "";

    if (monsterList.length === 0) {
      listEl.innerHTML = "<div class='empty'>No monsters found</div>";
      return;
    }

    monsterList.forEach(entry => {
      const item = document.createElement("div");
      item.className = "monster-list-item";
      item.textContent = entry.name;
      item.dataset.path = entry.filePath;

      item.onclick = () => {
        loadMonster(entry.filePath, editorArea);
        // Highlight selected
        listEl.querySelectorAll(".monster-list-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
      };

      listEl.appendChild(item);
    });
  } catch (error) {
    listEl.innerHTML = `<div class='error'>Failed to load monsters: ${error}</div>`;
  }
}

function filterMonsterList(listEl: HTMLElement, query: string) {
  const items = listEl.querySelectorAll(".monster-list-item");
  items.forEach(item => {
    const name = item.textContent?.toLowerCase() || "";
    if (name.includes(query)) {
      (item as HTMLElement).style.display = "block";
    } else {
      (item as HTMLElement).style.display = "none";
    }
  });
}

async function loadMonster(filePath: string, editorArea: HTMLElement) {
  editorArea.innerHTML = "<div class='loading'>Loading monster...</div>";

  try {
    currentMonster = await invoke<Monster>("load_monster_file", { filePath });
    currentFilePath = filePath;
    renderMonsterEditor(editorArea);
  } catch (error) {
    editorArea.innerHTML = `<div class='error'>Failed to load monster: ${error}</div>`;
  }
}

function renderMonsterEditor(editorArea: HTMLElement) {
  if (!currentMonster) return;

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

function renderAllSections(container: HTMLElement) {
  if (!currentMonster) return;

  // Create a grid layout for cards
  const cardsGrid = document.createElement("div");
  cardsGrid.className = "monster-cards-grid";

  // Row 1: Outfit Preview (full width)
  const outfitCard = createOutfitPreviewCard();
  outfitCard.classList.add("card-full-width");
  cardsGrid.appendChild(outfitCard);

  // Row 2: Basic Info + Combat Stats
  cardsGrid.appendChild(createBasicInfoCard());
  cardsGrid.appendChild(createCombatStatsCard());

  // Row 3: Attacks + Elements & Immunities
  cardsGrid.appendChild(createAttacksCard());
  cardsGrid.appendChild(createElementsImmunitiesCard());

  // Row 4: Loot (full width if has many items)
  const lootCard = createLootCard();
  if (currentMonster.loot.length > 5) {
    lootCard.classList.add("card-full-width");
  }
  cardsGrid.appendChild(lootCard);

  // Row 5: Summons + Voices (if exist)
  if (currentMonster.summon) {
    cardsGrid.appendChild(createSummonsCard());
  }
  if (currentMonster.voices) {
    cardsGrid.appendChild(createVoicesCard());
  }

  // Row 6: Flags (full width)
  const flagsCard = createFlagsCard();
  flagsCard.classList.add("card-full-width");
  cardsGrid.appendChild(flagsCard);

  // Row 7: Advanced Settings
  cardsGrid.appendChild(createAdvancedSettingsCard());

  container.appendChild(cardsGrid);
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
  }));

  const statsRow = document.createElement("div");
  statsRow.className = "form-row";

  statsRow.appendChild(createFormGroup("Experience", "number", currentMonster.experience.toString(), (value) => {
    if (currentMonster) currentMonster.experience = parseInt(value) || 0;
  }));

  statsRow.appendChild(createFormGroup("Health", "number", currentMonster.health.toString(), (value) => {
    if (currentMonster) currentMonster.health = parseInt(value) || 0;
  }));

  statsRow.appendChild(createFormGroup("Max Health", "number", currentMonster.maxHealth.toString(), (value) => {
    if (currentMonster) currentMonster.maxHealth = parseInt(value) || 0;
  }));

  content.appendChild(statsRow);

  const detailsRow = document.createElement("div");
  detailsRow.className = "form-row";

  detailsRow.appendChild(createFormGroup("Speed", "number", currentMonster.speed.toString(), (value) => {
    if (currentMonster) currentMonster.speed = parseInt(value) || 0;
  }));

  detailsRow.appendChild(createFormGroup("Mana Cost", "number", currentMonster.manaCost.toString(), (value) => {
    if (currentMonster) currentMonster.manaCost = parseInt(value) || 0;
  }));

  detailsRow.appendChild(createFormGroup("Race", "text", currentMonster.race, (value) => {
    if (currentMonster) currentMonster.race = value;
  }));

  content.appendChild(detailsRow);

  const idsRow = document.createElement("div");
  idsRow.className = "form-row";

  idsRow.appendChild(createFormGroup("Race ID", "number", currentMonster.raceId.toString(), (value) => {
    if (currentMonster) currentMonster.raceId = parseInt(value) || 0;
  }));

  idsRow.appendChild(createFormGroup("Corpse ID", "number", currentMonster.corpse.toString(), (value) => {
    if (currentMonster) currentMonster.corpse = parseInt(value) || 0;
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
  spriteImg.style.width = "100%";
  spriteImg.style.height = "100%";
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
        spriteContainer.textContent = "?";
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

  const attacksList = document.createElement("div");
  attacksList.className = "attacks-list";

  if (currentMonster.attacks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No attacks configured";
    attacksList.appendChild(empty);
  } else {
    currentMonster.attacks.forEach((attack) => {
      const attackItem = document.createElement("div");
      attackItem.className = "attack-item";
      attackItem.innerHTML = `
        <strong>${attack.name}</strong> -
        Interval: ${attack.interval}ms,
        Chance: ${attack.chance}%,
        Damage: ${attack.minDamage || 0}-${attack.maxDamage || 0}
      `;
      attacksList.appendChild(attackItem);
    });
  }

  content.appendChild(attacksList);

  return createCard("⚔️ Attacks", content);
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

  return createCard("🔥 Elements & Immunities", content);
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
      <div class="empty-state-icon">📦</div>
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
        ? `<span style="color: var(--text-secondary)">×${item.minCount || 1}${item.maxCount && item.maxCount !== item.minCount ? `-${item.maxCount}` : ""}</span>`
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

  return createCard(`💎 Loot (${currentMonster.loot.length})`, content);
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

  return createCard("💬 Voices", content);
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

  try {
    await invoke("save_monster_file", {
      filePath: currentFilePath,
      monster: currentMonster,
    });
    alert("Monster saved successfully!");
  } catch (error) {
    alert(`Failed to save monster: ${error}`);
  }
}
