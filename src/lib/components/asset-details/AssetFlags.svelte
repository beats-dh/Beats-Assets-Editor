<script lang="ts">
  import type { CompleteFlags } from '../../../types';
  import { getHookDirectionName, getClothesSlotName, getPlayerActionName, getMarketCategoryName, getWeaponTypeName } from '../../../utils/assetHelpers';
  import { getVocationName } from '../../../utils';
  interface Props { flags: CompleteFlags | undefined; }
  let { flags }: Props = $props();

  let basicFlags = $derived(flags ? [
    { name: 'Clip', value: flags.clip }, { name: 'Bottom', value: flags.bottom }, { name: 'Top', value: flags.top },
    { name: 'Container', value: flags.container }, { name: 'Cumulative', value: flags.cumulative },
    { name: 'Usable', value: flags.usable }, { name: 'Forceuse', value: flags.forceuse }, { name: 'Multiuse', value: flags.multiuse },
    { name: 'Liquidpool', value: flags.liquidpool }, { name: 'Unpass', value: flags.unpass }, { name: 'Unmove', value: flags.unmove },
    { name: 'Unsight', value: flags.unsight }, { name: 'Avoid', value: flags.avoid },
    { name: 'No Move Animation', value: flags.no_movement_animation }, { name: 'Take', value: flags.take },
    { name: 'Liquid Container', value: flags.liquidcontainer }, { name: 'Hang', value: flags.hang }, { name: 'Rotate', value: flags.rotate },
    { name: 'Dont Hide', value: flags.dont_hide }, { name: 'Translucent', value: flags.translucent },
    { name: 'Lying Object', value: flags.lying_object }, { name: 'Animate Always', value: flags.animate_always },
    { name: 'Fullbank', value: flags.fullbank }, { name: 'Ignore Look', value: flags.ignore_look },
    { name: 'Wrap', value: flags.wrap }, { name: 'Unwrap', value: flags.unwrap }, { name: 'Topeffect', value: flags.topeffect },
    { name: 'Corpse', value: flags.corpse }, { name: 'Player Corpse', value: flags.player_corpse },
    { name: 'Ammo', value: flags.ammo }, { name: 'Show Off Socket', value: flags.show_off_socket },
    { name: 'Reportable', value: flags.reportable },
    { name: 'Reverse addon east', value: flags.reverse_addons_east }, { name: 'Reverse addon west', value: flags.reverse_addons_west },
    { name: 'Reverse addon south', value: flags.reverse_addons_south }, { name: 'Reverse addon north', value: flags.reverse_addons_north },
    { name: 'Wearout', value: flags.wearout }, { name: 'Clockexpire', value: flags.clockexpire },
    { name: 'Expire', value: flags.expire }, { name: 'Expirestop', value: flags.expirestop },
    { name: 'Deco Item Kit', value: flags.deco_item_kit }, { name: 'Dual Wielding', value: flags.dual_wielding },
  ].filter((f): f is { name: string; value: boolean } => f.value === true) : []);

  const flagGroups: Record<string, string[]> = {
    'Ground & Stack Order': ['Clip', 'Bottom', 'Top', 'Fullbank'],
    'Container & Stacking': ['Container', 'Cumulative', 'Liquid Container'],
    'Usage': ['Usable', 'Forceuse', 'Multiuse', 'Take'],
    'Movement & Pathfinding': ['Unpass', 'Unmove', 'Unsight', 'Avoid', 'No Move Animation'],
    'Placement': ['Hang', 'Rotate'],
    'Visual': ['Dont Hide', 'Translucent', 'Lying Object', 'Animate Always', 'Ignore Look', 'Topeffect'],
    'Wrapping': ['Wrap', 'Unwrap'],
    'Special Types': ['Corpse', 'Player Corpse', 'Ammo', 'Show Off Socket'],
    'Reportable': ['Reportable'],
    'Reverse Addons': ['Reverse addon east', 'Reverse addon west', 'Reverse addon south', 'Reverse addon north'],
    'Expiration': ['Wearout', 'Clockexpire', 'Expire', 'Expirestop'],
    'Special': ['Deco Item Kit', 'Dual Wielding']
  };

  function getGroupFlags(groupName: string) {
    const flagNames = flagGroups[groupName] || [];
    return basicFlags.filter(f => flagNames.includes(f.name));
  }
</script>

{#if basicFlags.length > 0}
<div class="detail-section">
  <h4>Active Flags ({basicFlags.length})</h4>
  {#each Object.keys(flagGroups) as groupName}
    {@const groupFlags = getGroupFlags(groupName)}
    {#if groupFlags.length > 0}
      <div class="flags-group"><h5 class="flags-group-title">{groupName}</h5>
        <div class="flags-grid">{#each groupFlags as flag}<span class="flag-badge">✅ {flag.name}</span>{/each}</div>
      </div>
    {/if}
  {/each}
</div>
{/if}

{#if flags}
  {#if flags.bank?.waypoints !== undefined}
    <div class="detail-section"><h4>Ground / Bank</h4><div class="detail-item"><span class="detail-label">Waypoints / Speed:</span><span class="detail-value">{flags.bank.waypoints}</span></div></div>
  {/if}
  {#if (flags.write?.max_text_length !== undefined) || (flags.write_once?.max_text_length_once !== undefined)}
    <div class="detail-section"><h4>Writable Properties</h4>
      {#if flags.write?.max_text_length !== undefined}<div class="detail-item"><span class="detail-label">Max Text Length:</span><span class="detail-value">{flags.write.max_text_length}</span></div>{/if}
      {#if flags.write_once?.max_text_length_once !== undefined}<div class="detail-item"><span class="detail-label">Max Text Length Once:</span><span class="detail-value">{flags.write_once.max_text_length_once}</span></div>{/if}
    </div>
  {/if}
  {#if flags.hook?.direction !== undefined}
    <div class="detail-section"><h4>Hook Properties</h4>
      <div class="detail-item"><span class="detail-label">Hook Direction:</span><span class="detail-value">{getHookDirectionName(flags.hook.direction)}</span></div>
    </div>
  {/if}
  {#if flags.light && ((flags.light.brightness !== undefined) || (flags.light.color !== undefined))}
    <div class="detail-section"><h4>Light Properties</h4>
      {#if flags.light.brightness !== undefined}<div class="detail-item"><span class="detail-label">Brightness:</span><span class="detail-value">{flags.light.brightness}</span></div>{/if}
      {#if flags.light.color !== undefined}<div class="detail-item"><span class="detail-label">Color:</span><span class="detail-value">{flags.light.color}</span></div>{/if}
    </div>
  {/if}
  {#if flags.shift && ((flags.shift.x !== undefined) || (flags.shift.y !== undefined))}
    <div class="detail-section"><h4>Shift / Displacement</h4>
      {#if flags.shift.x !== undefined}<div class="detail-item"><span class="detail-label">Shift X:</span><span class="detail-value">{flags.shift.x}</span></div>{/if}
      {#if flags.shift.y !== undefined}<div class="detail-item"><span class="detail-label">Shift Y:</span><span class="detail-value">{flags.shift.y}</span></div>{/if}
    </div>
  {/if}
  {#if flags.height?.elevation !== undefined}<div class="detail-section"><h4>Height / Elevation</h4><div class="detail-item"><span class="detail-label">Elevation:</span><span class="detail-value">{flags.height.elevation}</span></div></div>{/if}
  {#if flags.automap?.color !== undefined}<div class="detail-section"><h4>Minimap / Automap</h4><div class="detail-item"><span class="detail-label">Minimap Color:</span><span class="detail-value">{flags.automap.color}</span></div></div>{/if}
  {#if flags.lenshelp?.id !== undefined}<div class="detail-section"><h4>Lens Help</h4><div class="detail-item"><span class="detail-label">Help ID:</span><span class="detail-value">{flags.lenshelp.id}</span></div></div>{/if}
  {#if flags.clothes?.slot !== undefined}<div class="detail-section"><h4>Clothes / Equipment</h4><div class="detail-item"><span class="detail-label">Slot:</span><span class="detail-value">{getClothesSlotName(flags.clothes.slot)}</span></div></div>{/if}
  {#if flags.default_action?.action !== undefined}<div class="detail-section"><h4>Default Action</h4><div class="detail-item"><span class="detail-label">Action:</span><span class="detail-value">{getPlayerActionName(flags.default_action.action)}</span></div></div>{/if}
  {#if flags.weapon_type !== undefined}<div class="detail-section"><h4>Weapon Type</h4><div class="detail-item"><span class="detail-label">Type:</span><span class="detail-value">{getWeaponTypeName(flags.weapon_type)}</span></div></div>{/if}
  {#if flags.market}
    <div class="detail-section"><h4>Market Information</h4>
      {#if flags.market.category !== undefined}<div class="detail-item"><span class="detail-label">Category:</span><span class="detail-value">{getMarketCategoryName(flags.market.category)}</span></div>{/if}
      {#if flags.market.trade_as_object_id !== undefined}<div class="detail-item"><span class="detail-label">Trade As Object ID:</span><span class="detail-value">{flags.market.trade_as_object_id}</span></div>{/if}
      {#if flags.market.show_as_object_id !== undefined}<div class="detail-item"><span class="detail-label">Show As Object ID:</span><span class="detail-value">{flags.market.show_as_object_id}</span></div>{/if}
    </div>
  {/if}
  {#if flags.restrict_to_vocation && flags.restrict_to_vocation.length > 0}
    <div class="detail-section"><h4>Vocation Restrictions</h4>
      <div class="detail-item"><span class="detail-label">Restrict To:</span><span class="detail-value">{flags.restrict_to_vocation.map(v => getVocationName(v)).join(', ')}</span></div>
    </div>
  {/if}
  {#if flags.minimum_level !== undefined && flags.minimum_level > 0}
    <div class="detail-section"><h4>Level Requirement</h4><div class="detail-item"><span class="detail-label">Minimum Level:</span><span class="detail-value">{flags.minimum_level}</span></div></div>
  {/if}
  {#if flags.npc_sale_data && flags.npc_sale_data.length > 0}
    <div class="detail-section"><h4>NPC Sale Data ({flags.npc_sale_data.length})</h4>
      {#each flags.npc_sale_data as npc, idx}
        <div class="detail-item-full" style="margin-bottom: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.03); border-radius: 4px;">
          <div><strong>NPC #{idx + 1}</strong></div>
          {#if npc.name}<div class="detail-item"><span class="detail-label">Name:</span><span class="detail-value">{npc.name}</span></div>{/if}
          {#if npc.location}<div class="detail-item"><span class="detail-label">Location:</span><span class="detail-value">{npc.location}</span></div>{/if}
          {#if npc.sale_price !== undefined}<div class="detail-item"><span class="detail-label">Sale Price:</span><span class="detail-value">{npc.sale_price}</span></div>{/if}
          {#if npc.buy_price !== undefined}<div class="detail-item"><span class="detail-label">Buy Price:</span><span class="detail-value">{npc.buy_price}</span></div>{/if}
          {#if npc.currency_object_type_id !== undefined}<div class="detail-item"><span class="detail-label">Currency Object ID:</span><span class="detail-value">{npc.currency_object_type_id}</span></div>{/if}
          {#if npc.currency_quest_flag_display_name}<div class="detail-item"><span class="detail-label">Currency Quest Flag:</span><span class="detail-value">{npc.currency_quest_flag_display_name}</span></div>{/if}
        </div>
      {/each}
    </div>
  {/if}
  {#if flags.changed_to_expire?.former_object_typeid !== undefined}
    <div class="detail-section"><h4>Changed To Expire</h4><div class="detail-item"><span class="detail-label">Former Object Type ID:</span><span class="detail-value">{flags.changed_to_expire.former_object_typeid}</span></div></div>
  {/if}
  {#if flags.cyclopedia_item?.cyclopedia_type !== undefined}
    <div class="detail-section"><h4>Cyclopedia</h4><div class="detail-item"><span class="detail-label">Cyclopedia Type:</span><span class="detail-value">{flags.cyclopedia_item.cyclopedia_type}</span></div></div>
  {/if}
  {#if flags.upgrade_classification?.upgrade_classification !== undefined}
    <div class="detail-section"><h4>Upgrade Classification</h4><div class="detail-item"><span class="detail-label">Classification:</span><span class="detail-value">{flags.upgrade_classification.upgrade_classification}</span></div></div>
  {/if}
  {#if flags.skillwheel_gem}
    <div class="detail-section"><h4>Skillwheel Gem</h4>
      {#if flags.skillwheel_gem.gem_quality_id !== undefined}<div class="detail-item"><span class="detail-label">Gem Quality ID:</span><span class="detail-value">{flags.skillwheel_gem.gem_quality_id}</span></div>{/if}
      {#if flags.skillwheel_gem.vocation_id !== undefined}<div class="detail-item"><span class="detail-label">Vocation ID:</span><span class="detail-value">{flags.skillwheel_gem.vocation_id}</span></div>{/if}
    </div>
  {/if}
  {#if flags.imbueable?.slot_count !== undefined}
    <div class="detail-section"><h4>Imbueable</h4><div class="detail-item"><span class="detail-label">Slot Count:</span><span class="detail-value">{flags.imbueable.slot_count}</span></div></div>
  {/if}
  {#if flags.proficiency?.proficiency_id !== undefined}
    <div class="detail-section"><h4>Proficiency</h4><div class="detail-item"><span class="detail-label">Proficiency ID:</span><span class="detail-value">{flags.proficiency.proficiency_id}</span></div></div>
  {/if}
{/if}
