export function getAppearanceTypeName(type: number | undefined): string {
  if (type === undefined || type === null) return 'Unknown';
  switch (type) {
    case 1: return 'Object';
    case 2: return 'Outfit';
    case 3: return 'Effect';
    case 4: return 'Missile';
    default: return `Unknown (${type})`;
  }
}

export function getClothesSlotName(slot: number | undefined): string {
  if (slot === undefined || slot === null) return 'None';
  const slots: Record<number, string> = {
    0: 'None',
    1: 'Helmet',
    2: 'Amulet',
    3: 'Backpack',
    4: 'Armor',
    5: 'Shield',
    6: 'Weapon',
    7: 'Legs',
    8: 'Boots',
    9: 'Ring',
    10: 'Arrow/Quiver'
  };
  return slots[slot] || `Unknown (${slot})`;
}

export function getWeaponTypeName(type: number | undefined): string {
  if (type === undefined || type === null) return 'No Weapon';
  switch (type) {
    case 0: return 'No Weapon';
    case 1: return 'Sword';
    case 2: return 'Axe';
    case 3: return 'Club';
    case 4: return 'Fist';
    case 5: return 'Bow';
    case 6: return 'Crossbow';
    case 7: return 'Wand/Rod';
    case 8: return 'Throw';
    default: return `Unknown (${type})`;
  }
}

export function getHookDirectionName(direction: number | undefined): string {
  if (direction === undefined || direction === null) return 'None';
  switch (direction) {
    case 1: return 'South';
    case 2: return 'East';
    default: return `Unknown (${direction})`;
  }
}

export function getPlayerActionName(action: number | undefined): string {
  if (action === undefined || action === null) return 'None';
  switch (action) {
    case 0: return 'None';
    case 1: return 'Look';
    case 2: return 'Use';
    case 3: return 'Open';
    case 4: return 'Autowalk Highlight';
    default: return `Unknown (${action})`;
  }
}

export function getMarketCategoryName(category: number): string {
  const categories: Record<number, string> = {
    1: 'Armors', 2: 'Amulets', 3: 'Boots', 4: 'Containers',
    5: 'Decoration', 6: 'Food', 7: 'Helmets', 8: 'Legs',
    9: 'Others', 10: 'Potions', 11: 'Rings', 12: 'Runes',
    13: 'Shields', 14: 'Tools', 15: 'Valuables', 16: 'Ammunition',
    17: 'Axes', 18: 'Clubs', 19: 'Distance Weapons', 20: 'Swords',
    21: 'Wands Rods', 22: 'Premium Scrolls', 23: 'Tibia Coins',
    24: 'Creature Products', 25: 'Quiver', 26: 'Soul Cores', 27: 'Fist Weapons'
  };
  return categories[category] ? `${categories[category]} (${category})` : `Unknown (${category})`;
}
