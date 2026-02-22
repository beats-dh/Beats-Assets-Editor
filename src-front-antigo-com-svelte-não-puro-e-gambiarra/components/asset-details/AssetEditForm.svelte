<script lang="ts">
  import type { CompleteAppearanceItem, CompleteFlags } from '../../types';
  import { getVocationOptionsHTML, getVocationName } from '../../utils';
  import { 
    getClothesSlotName, 
    getPlayerActionName, 
    getMarketCategoryName, 
    getWeaponTypeName 
  } from '../../utils/assetHelpers';
  import { spriteLibraryStore } from '../../stores/spriteLibraryStore';

  export let details: CompleteAppearanceItem;
  export const category: string = ''; // Exported but maybe unused for now
  export let onSave: (updatedDetails: CompleteAppearanceItem) => void;

  let name = details.name || '';
  let description = details.description || '';
  
  // Clone flags to avoid mutating prop directly until save
  // Cast to any to allow binding to optional properties that we ensure exist below
  let flags: any = JSON.parse(JSON.stringify(details.flags || {}));

  function openSpriteSelector(callback: (id: number) => void) {
    spriteLibraryStore.openSelect(callback);
  }

  // Initialize complex flags to ensure they exist for binding
  if (!flags.light) flags.light = { brightness: 0, color: 0 };
  if (!flags.shift) flags.shift = { x: 0, y: 0 };
  if (!flags.height) flags.height = { elevation: 0 };
  if (!flags.write) flags.write = { max_text_length: 0 };
  if (!flags.write_once) flags.write_once = { max_text_length_once: 0 };
  if (!flags.automap) flags.automap = { color: 0 };
  if (!flags.hook) flags.hook = { direction: 1 };
  if (!flags.lenshelp) flags.lenshelp = { id: 0 };
  if (!flags.clothes) flags.clothes = { slot: 0 };
  if (!flags.default_action) flags.default_action = { action: 0 };
  if (!flags.market) flags.market = { 
    category: 9, 
    trade_as_object_id: 0, 
    show_as_object_id: 0, 
    name: '', 
    restrict_to_vocation: [], 
    minimum_level: 0,
    vocation: 0 
  };

  // Flag definitions
  const flagDefs = [
    { key: 'clip', label: 'Clip' },
    { key: 'bottom', label: 'Bottom' },
    { key: 'top', label: 'Top' },
    { key: 'container', label: 'Container' },
    { key: 'cumulative', label: 'Cumulative' },
    { key: 'usable', label: 'Usable' },
    { key: 'forceuse', label: 'Forceuse' },
    { key: 'multiuse', label: 'Multiuse' },
    { key: 'liquidpool', label: 'Liquidpool' },
    { key: 'liquidcontainer', label: 'Liquid Container' },
    { key: 'unpass', label: 'Unpass' },
    { key: 'unmove', label: 'Unmove' },
    { key: 'unsight', label: 'Unsight' },
    { key: 'avoid', label: 'Avoid' },
    { key: 'no_movement_animation', label: 'No Move Animation' },
    { key: 'take', label: 'Take' },
    { key: 'hang', label: 'Hang' },
    { key: 'rotate', label: 'Rotate' },
    { key: 'dont_hide', label: 'Dont Hide' },
    { key: 'translucent', label: 'Translucent' },
    { key: 'lying_object', label: 'Lying Object' },
    { key: 'animate_always', label: 'Animate Always' },
    { key: 'fullbank', label: 'Fullbank' },
    { key: 'ignore_look', label: 'Ignore Look' },
    { key: 'wrap', label: 'Wrap' },
    { key: 'unwrap', label: 'Unwrap' },
    { key: 'topeffect', label: 'Topeffect' },
    { key: 'corpse', label: 'Corpse' },
    { key: 'player_corpse', label: 'Player Corpse' },
    { key: 'ammo', label: 'Ammo' },
    { key: 'show_off_socket', label: 'Show Off Socket' },
    { key: 'reportable', label: 'Reportable' },
    { key: 'reverse_addons_east', label: 'Reverse addon east' },
    { key: 'reverse_addons_west', label: 'Reverse addon west' },
    { key: 'reverse_addons_south', label: 'Reverse addon south' },
    { key: 'reverse_addons_north', label: 'Reverse addon north' },
    { key: 'wearout', label: 'Wearout' },
    { key: 'clockexpire', label: 'Clockexpire' },
    { key: 'expire', label: 'Expire' },
    { key: 'expirestop', label: 'Expirestop' },
    { key: 'deco_item_kit', label: 'Deco Item Kit' },
    { key: 'dual_wielding', label: 'Dual Wielding' },
    { key: 'hook_south', label: 'Hook South' },
    { key: 'hook_east', label: 'Hook East' },
  ];

  function handleSave() {
    const updated = {
      ...details,
      name,
      description,
      flags
    };
    onSave(updated);
  }
</script>

<div class="detail-section">
  <h4>Editar Item</h4>
  <div class="detail-item">
    <span class="detail-label">Nome:</span>
    <input type="text" bind:value={name} placeholder="Digite o nome" />
  </div>
  <div class="detail-item">
    <span class="detail-label">Descrição:</span>
    <textarea rows="3" bind:value={description} placeholder="Digite a descrição"></textarea>
  </div>
  <div class="detail-actions">
    <button class="btn-primary" on:click={handleSave}>Salvar Alterações</button>
  </div>
</div>

<div class="detail-section">
  <h4>Flags Booleanas</h4>
  <div class="flags-grid">
    {#each flagDefs as f}
      <label class="flag-toggle">
        <input type="checkbox" class="flag-checkbox" bind:checked={flags[f.key as keyof CompleteFlags] as boolean} />
        <span>{f.label}</span>
      </label>
    {/each}
  </div>
</div>

<!-- Light -->
<div class="detail-section">
  <h4>Light</h4>
  <div class="detail-item">
    <span class="detail-label">Brightness:</span>
    <div class="number-input">
      <input type="number" min="0" bind:value={flags.light.brightness} placeholder="ex: 255" />
    </div>
  </div>
  <div class="detail-item">
    <span class="detail-label">Color:</span>
    <div class="number-input">
      <input type="number" min="0" bind:value={flags.light.color} placeholder="ex: 215" />
    </div>
  </div>
</div>

<!-- Shift -->
<div class="detail-section">
  <h4>Shift</h4>
  <div class="detail-item">
    <span class="detail-label">X:</span>
    <div class="number-input">
      <input type="number" bind:value={flags.shift.x} placeholder="ex: 1" />
    </div>
  </div>
  <div class="detail-item">
    <span class="detail-label">Y:</span>
    <div class="number-input">
      <input type="number" bind:value={flags.shift.y} placeholder="ex: 2" />
    </div>
  </div>
</div>

<!-- Height -->
<div class="detail-section">
  <h4>Height</h4>
  <div class="detail-item">
    <span class="detail-label">Elevation:</span>
    <div class="number-input">
      <input type="number" bind:value={flags.height.elevation} placeholder="ex: 8" />
    </div>
  </div>
</div>

<!-- Write -->
<div class="detail-section">
  <h4>Write</h4>
  <div class="detail-item">
    <span class="detail-label">Max Text Length:</span>
    <div class="number-input">
      <input type="number" bind:value={flags.write.max_text_length} placeholder="ex: 120" />
    </div>
  </div>
</div>

<!-- Write Once -->
<div class="detail-section">
  <h4>Write Once</h4>
  <div class="detail-item">
    <span class="detail-label">Max Text Length Once:</span>
    <div class="number-input">
      <input type="number" bind:value={flags.write_once.max_text_length_once} placeholder="ex: 60" />
    </div>
  </div>
</div>

<!-- Automap -->
<div class="detail-section">
  <h4>Automap</h4>
  <div class="detail-item">
    <span class="detail-label">Color:</span>
    <div class="number-input">
      <input type="number" bind:value={flags.automap.color} placeholder="ex: 215" />
    </div>
  </div>
</div>

<!-- Hook -->
<div class="detail-section">
  <h4>Hook</h4>
  <div class="detail-item">
    <span class="detail-label">Direction:</span>
    <div class="select-input">
      <select bind:value={flags.hook.direction}>
        <option value={undefined}>—</option>
        <option value={1}>Sul (1)</option>
        <option value={2}>Leste (2)</option>
      </select>
    </div>
  </div>
</div>

<!-- Lens Help -->
<div class="detail-section">
  <h4>Lens Help</h4>
  <div class="detail-item">
    <span class="detail-label">ID:</span>
    <div class="number-input" style="display: flex; gap: 0.5rem;">
      <input type="number" bind:value={flags.lenshelp.id} placeholder="ex: 1000" />
      <button type="button" class="btn-secondary" style="padding: 0 0.5rem;" on:click={() => openSpriteSelector(id => flags.lenshelp.id = id)}>🔍</button>
    </div>
  </div>
</div>

<!-- Clothes -->
<div class="detail-section">
  <h4>Clothes</h4>
  <div class="detail-item">
    <span class="detail-label">Slot:</span>
    <div class="select-input">
      <select bind:value={flags.clothes.slot}>
        <option value={0}>None</option>
        <option value={1}>Helmet</option>
        <option value={2}>Amulet</option>
        <option value={3}>Backpack</option>
        <option value={4}>Armor</option>
        <option value={5}>Shield</option>
        <option value={6}>Weapon</option>
        <option value={7}>Legs</option>
        <option value={8}>Boots</option>
        <option value={9}>Ring</option>
        <option value={10}>Arrow / Quiver</option>
      </select>
    </div>
  </div>
</div>

<!-- Default Action -->
<div class="detail-section">
  <h4>Default Action</h4>
  <div class="detail-item">
    <span class="detail-label">Action:</span>
    <div class="select-input">
      <select bind:value={flags.default_action.action}>
        <option value={0}>None</option>
        <option value={1}>Look</option>
        <option value={2}>Use</option>
        <option value={3}>Open</option>
        <option value={4}>Autowalk Highlight</option>
      </select>
    </div>
  </div>
</div>

<!-- Weapon Type -->
<div class="detail-section">
  <h4>Weapon Type</h4>
  <div class="detail-item">
    <span class="detail-label">Type:</span>
    <div class="select-input">
      <select bind:value={flags.weapon_type}>
        <option value={undefined}>—</option>
        <option value={0}>No Weapon</option>
        <option value={1}>Sword</option>
        <option value={2}>Axe</option>
        <option value={3}>Club</option>
        <option value={4}>Fist</option>
        <option value={5}>Bow</option>
        <option value={6}>Crossbow</option>
        <option value={7}>Wand Rod</option>
        <option value={8}>Throw</option>
      </select>
    </div>
  </div>
</div>

<!-- Transparency Level -->
<div class="detail-section">
  <h4>Transparency Level</h4>
  <div class="detail-item">
    <span class="detail-label">Level:</span>
    <div class="number-input">
      <input type="number" bind:value={flags.transparency_level} placeholder="ex: 50" />
    </div>
  </div>
</div>

<!-- Market -->
<div class="detail-section">
  <h4>Market</h4>
  <div class="detail-item">
    <span class="detail-label">Category:</span>
    <div class="select-input">
      <select bind:value={flags.market.category}>
        <option value={undefined}>—</option>
        <option value={1}>Armors</option>
        <option value={2}>Amulets</option>
        <option value={3}>Boots</option>
        <option value={4}>Containers</option>
        <option value={5}>Decoration</option>
        <option value={6}>Food</option>
        <option value={7}>Helmets Hats</option>
        <option value={8}>Legs</option>
        <option value={9}>Others</option>
        <option value={10}>Potions</option>
        <option value={11}>Rings</option>
        <option value={12}>Runes</option>
        <option value={13}>Shields</option>
        <option value={14}>Tools</option>
        <option value={15}>Valuables</option>
        <option value={16}>Ammunition</option>
        <option value={17}>Axes</option>
        <option value={18}>Clubs</option>
        <option value={19}>Distance Weapons</option>
        <option value={20}>Swords</option>
        <option value={21}>Wands Rods</option>
        <option value={22}>Premium Scrolls</option>
        <option value={23}>Tibia Coins</option>
        <option value={24}>Creature Products</option>
        <option value={25}>Quiver</option>
        <option value={26}>Soul Cores</option>
        <option value={27}>Fist Weapons</option>
      </select>
    </div>
  </div>
  <div class="detail-item">
    <span class="detail-label">Trade As Object ID:</span>
    <div class="number-input" style="display: flex; gap: 0.5rem;">
      <input type="number" bind:value={flags.market.trade_as_object_id} placeholder="ex: 1234" />
      <button type="button" class="btn-secondary" style="padding: 0 0.5rem;" on:click={() => openSpriteSelector(id => flags.market.trade_as_object_id = id)}>🔍</button>
    </div>
  </div>
  <div class="detail-item">
    <span class="detail-label">Show As Object ID:</span>
    <div class="number-input" style="display: flex; gap: 0.5rem;">
      <input type="number" bind:value={flags.market.show_as_object_id} placeholder="ex: 5678" />
      <button type="button" class="btn-secondary" style="padding: 0 0.5rem;" on:click={() => openSpriteSelector(id => flags.market.show_as_object_id = id)}>🔍</button>
    </div>
  </div>
  <div class="detail-item">
    <span class="detail-label">Minimum Level:</span>
    <div class="number-input">
      <input type="number" bind:value={flags.market.minimum_level} placeholder="ex: 20" />
    </div>
  </div>
  <div class="detail-item">
    <span class="detail-label">Market Name:</span>
    <input type="text" bind:value={flags.market.name} placeholder="ex: Magic Sword" />
  </div>
</div>

<div class="detail-actions" style="margin-top: 2rem;">
  <button class="btn-primary" on:click={handleSave}>Salvar Alterações</button>
</div>
