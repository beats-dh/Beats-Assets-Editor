<script lang="ts">
  import type { CompleteAppearanceItem, CompleteFlags } from '../../../types';
  import { spriteLibraryState } from '../../../stores/spriteLibraryState.svelte';
  interface Props { details: CompleteAppearanceItem; category?: string; onSave: (updated: CompleteAppearanceItem) => void; }
  let { details, category = '', onSave }: Props = $props();

  let name = $state(details.name || '');
  let description = $state(details.description || '');
  let flags: any = $state(JSON.parse(JSON.stringify(details.flags || {})));

  // Ensure complex flags exist for binding
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
  if (!flags.market) flags.market = { category: 9, trade_as_object_id: 0, show_as_object_id: 0 };
  if (!flags.changed_to_expire) flags.changed_to_expire = { former_object_typeid: 0 };
  if (!flags.cyclopedia_item) flags.cyclopedia_item = { cyclopedia_type: 0 };
  if (!flags.upgrade_classification) flags.upgrade_classification = { upgrade_classification: 0 };
  if (!flags.skillwheel_gem) flags.skillwheel_gem = { gem_quality_id: 0, vocation_id: 0 };
  if (!flags.imbueable) flags.imbueable = { slot_count: 0 };
  if (!flags.proficiency) flags.proficiency = { proficiency_id: 0 };

  const flagDefs = [
    { key: 'clip', label: 'Clip' }, { key: 'bottom', label: 'Bottom' }, { key: 'top', label: 'Top' },
    { key: 'container', label: 'Container' }, { key: 'cumulative', label: 'Cumulative' },
    { key: 'usable', label: 'Usable' }, { key: 'forceuse', label: 'Forceuse' }, { key: 'multiuse', label: 'Multiuse' },
    { key: 'liquidpool', label: 'Liquidpool' }, { key: 'liquidcontainer', label: 'Liquid Container' },
    { key: 'unpass', label: 'Unpass' }, { key: 'unmove', label: 'Unmove' }, { key: 'unsight', label: 'Unsight' },
    { key: 'avoid', label: 'Avoid' }, { key: 'no_movement_animation', label: 'No Move Animation' },
    { key: 'take', label: 'Take' }, { key: 'hang', label: 'Hang' }, { key: 'rotate', label: 'Rotate' },
    { key: 'dont_hide', label: 'Dont Hide' }, { key: 'translucent', label: 'Translucent' },
    { key: 'lying_object', label: 'Lying Object' }, { key: 'animate_always', label: 'Animate Always' },
    { key: 'fullbank', label: 'Fullbank' }, { key: 'ignore_look', label: 'Ignore Look' },
    { key: 'wrap', label: 'Wrap' }, { key: 'unwrap', label: 'Unwrap' }, { key: 'topeffect', label: 'Topeffect' },
    { key: 'corpse', label: 'Corpse' }, { key: 'player_corpse', label: 'Player Corpse' },
    { key: 'ammo', label: 'Ammo' }, { key: 'show_off_socket', label: 'Show Off Socket' },
    { key: 'reportable', label: 'Reportable' },
    { key: 'reverse_addons_east', label: 'Reverse addon east' }, { key: 'reverse_addons_west', label: 'Reverse addon west' },
    { key: 'reverse_addons_south', label: 'Reverse addon south' }, { key: 'reverse_addons_north', label: 'Reverse addon north' },
    { key: 'wearout', label: 'Wearout' }, { key: 'clockexpire', label: 'Clockexpire' },
    { key: 'expire', label: 'Expire' }, { key: 'expirestop', label: 'Expirestop' },
    { key: 'deco_item_kit', label: 'Deco Item Kit' }, { key: 'dual_wielding', label: 'Dual Wielding' },
  ];

  function openSpriteSelector(callback: (id: number) => void) { spriteLibraryState.openSelect(callback); }

  function handleSave() { onSave({ ...details, name, description, flags }); }
</script>

<div class="detail-section">
  <h4>Editar Item</h4>
  <div class="detail-item"><span class="detail-label">Nome:</span><input type="text" bind:value={name} placeholder="Digite o nome" /></div>
  <div class="detail-item"><span class="detail-label">Descri&ccedil;&atilde;o:</span><textarea rows="3" bind:value={description} placeholder="Digite a descri&ccedil;&atilde;o"></textarea></div>
  <div class="detail-actions"><button class="btn-primary" onclick={handleSave}>Salvar Altera&ccedil;&otilde;es</button></div>
</div>

<div class="detail-section">
  <h4>Flags Booleanas</h4>
  <div class="flags-grid">
    {#each flagDefs as f}
      <label class="flag-toggle"><input type="checkbox" class="flag-checkbox" bind:checked={flags[f.key]} /><span>{f.label}</span></label>
    {/each}
  </div>
</div>

<div class="detail-section"><h4>Light</h4>
  <div class="detail-item"><span class="detail-label">Brightness:</span><div class="number-input"><input type="number" min="0" bind:value={flags.light.brightness} placeholder="ex: 255" /></div></div>
  <div class="detail-item"><span class="detail-label">Color:</span><div class="number-input"><input type="number" min="0" bind:value={flags.light.color} placeholder="ex: 215" /></div></div>
</div>
<div class="detail-section"><h4>Shift</h4>
  <div class="detail-item"><span class="detail-label">X:</span><div class="number-input"><input type="number" bind:value={flags.shift.x} /></div></div>
  <div class="detail-item"><span class="detail-label">Y:</span><div class="number-input"><input type="number" bind:value={flags.shift.y} /></div></div>
</div>
<div class="detail-section"><h4>Height</h4>
  <div class="detail-item"><span class="detail-label">Elevation:</span><div class="number-input"><input type="number" bind:value={flags.height.elevation} /></div></div>
</div>
<div class="detail-section"><h4>Write</h4><div class="detail-item"><span class="detail-label">Max Text Length:</span><div class="number-input"><input type="number" bind:value={flags.write.max_text_length} /></div></div></div>
<div class="detail-section"><h4>Write Once</h4><div class="detail-item"><span class="detail-label">Max Text Length Once:</span><div class="number-input"><input type="number" bind:value={flags.write_once.max_text_length_once} /></div></div></div>
<div class="detail-section"><h4>Automap</h4><div class="detail-item"><span class="detail-label">Color:</span><div class="number-input"><input type="number" bind:value={flags.automap.color} /></div></div></div>
<div class="detail-section"><h4>Hook</h4><div class="detail-item"><span class="detail-label">Direction:</span><div class="select-input"><select bind:value={flags.hook.direction}><option value={undefined}>—</option><option value={1}>Sul (1)</option><option value={2}>Leste (2)</option></select></div></div></div>
<div class="detail-section"><h4>Lens Help</h4>
  <div class="detail-item"><span class="detail-label">ID:</span><div class="number-input" style="display:flex;gap:0.5rem;"><input type="number" bind:value={flags.lenshelp.id} /><button type="button" class="btn-secondary" style="padding:0 0.5rem;" onclick={() => openSpriteSelector(id => flags.lenshelp.id = id)}>🔍</button></div></div>
</div>
<div class="detail-section"><h4>Clothes</h4><div class="detail-item"><span class="detail-label">Slot:</span><div class="select-input"><select bind:value={flags.clothes.slot}><option value={0}>None</option><option value={1}>Helmet</option><option value={2}>Amulet</option><option value={3}>Backpack</option><option value={4}>Armor</option><option value={5}>Shield</option><option value={6}>Weapon</option><option value={7}>Legs</option><option value={8}>Boots</option><option value={9}>Ring</option><option value={10}>Arrow / Quiver</option></select></div></div></div>
<div class="detail-section"><h4>Default Action</h4><div class="detail-item"><span class="detail-label">Action:</span><div class="select-input"><select bind:value={flags.default_action.action}><option value={0}>None</option><option value={1}>Look</option><option value={2}>Use</option><option value={3}>Open</option><option value={4}>Autowalk Highlight</option></select></div></div></div>
<div class="detail-section"><h4>Weapon Type</h4><div class="detail-item"><span class="detail-label">Type:</span><div class="select-input"><select bind:value={flags.weapon_type}><option value={undefined}>—</option><option value={0}>No Weapon</option><option value={1}>Sword</option><option value={2}>Axe</option><option value={3}>Club</option><option value={4}>Fist</option><option value={5}>Bow</option><option value={6}>Crossbow</option><option value={7}>Wand Rod</option><option value={8}>Throw</option></select></div></div></div>
<div class="detail-section"><h4>Market</h4>
  <div class="detail-item"><span class="detail-label">Category:</span><div class="select-input"><select bind:value={flags.market.category}><option value={undefined}>—</option>{#each Array.from({length: 27}, (_, i) => i + 1) as v}<option value={v}>{v}</option>{/each}</select></div></div>
  <div class="detail-item"><span class="detail-label">Trade As Object ID:</span><div class="number-input" style="display:flex;gap:0.5rem;"><input type="number" bind:value={flags.market.trade_as_object_id} /><button type="button" class="btn-secondary" style="padding:0 0.5rem;" onclick={() => openSpriteSelector(id => flags.market.trade_as_object_id = id)}>🔍</button></div></div>
  <div class="detail-item"><span class="detail-label">Show As Object ID:</span><div class="number-input" style="display:flex;gap:0.5rem;"><input type="number" bind:value={flags.market.show_as_object_id} /><button type="button" class="btn-secondary" style="padding:0 0.5rem;" onclick={() => openSpriteSelector(id => flags.market.show_as_object_id = id)}>🔍</button></div></div>
</div>
<div class="detail-section"><h4>Changed To Expire</h4>
  <div class="detail-item"><span class="detail-label">Former Object Type ID:</span><div class="number-input"><input type="number" bind:value={flags.changed_to_expire.former_object_typeid} /></div></div>
</div>
<div class="detail-section"><h4>Cyclopedia</h4>
  <div class="detail-item"><span class="detail-label">Cyclopedia Type:</span><div class="number-input"><input type="number" bind:value={flags.cyclopedia_item.cyclopedia_type} /></div></div>
</div>
<div class="detail-section"><h4>Upgrade Classification</h4>
  <div class="detail-item"><span class="detail-label">Classification:</span><div class="number-input"><input type="number" bind:value={flags.upgrade_classification.upgrade_classification} /></div></div>
</div>
<div class="detail-section"><h4>Skillwheel Gem</h4>
  <div class="detail-item"><span class="detail-label">Gem Quality ID:</span><div class="number-input"><input type="number" bind:value={flags.skillwheel_gem.gem_quality_id} /></div></div>
  <div class="detail-item"><span class="detail-label">Vocation ID:</span><div class="number-input"><input type="number" bind:value={flags.skillwheel_gem.vocation_id} /></div></div>
</div>
<div class="detail-section"><h4>Imbueable</h4>
  <div class="detail-item"><span class="detail-label">Slot Count:</span><div class="number-input"><input type="number" bind:value={flags.imbueable.slot_count} /></div></div>
</div>
<div class="detail-section"><h4>Proficiency</h4>
  <div class="detail-item"><span class="detail-label">Proficiency ID:</span><div class="number-input"><input type="number" bind:value={flags.proficiency.proficiency_id} /></div></div>
</div>
<div class="detail-actions" style="margin-top:2rem;"><button class="btn-primary" onclick={handleSave}>Salvar Altera&ccedil;&otilde;es</button></div>
