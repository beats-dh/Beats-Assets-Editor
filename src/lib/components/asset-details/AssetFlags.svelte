<script lang="ts">
  import type { CompleteFlags } from "../../../types";
  import { translate } from "../../../i18n";
  import {
    getHookDirectionName,
    getClothesSlotName,
    getPlayerActionName,
    getMarketCategoryName,
    getWeaponTypeName,
  } from "../../../utils/assetHelpers";
  import { getVocationName } from "../../../utils";
  interface Props {
    flags: CompleteFlags | undefined;
  }
  let { flags }: Props = $props();

  // Flag display names are technical/internal identifiers and kept as-is in the view
  let basicFlags = $derived(
    flags
      ? [
          { key: "clip", value: flags.clip },
          { key: "bottom", value: flags.bottom },
          { key: "top", value: flags.top },
          { key: "container", value: flags.container },
          { key: "cumulative", value: flags.cumulative },
          { key: "usable", value: flags.usable },
          { key: "forceuse", value: flags.forceuse },
          { key: "multiuse", value: flags.multiuse },
          { key: "liquidpool", value: flags.liquidpool },
          { key: "unpass", value: flags.unpass },
          { key: "unmove", value: flags.unmove },
          { key: "unsight", value: flags.unsight },
          { key: "avoid", value: flags.avoid },
          { key: "no_movement_animation", value: flags.no_movement_animation },
          { key: "take", value: flags.take },
          { key: "liquidcontainer", value: flags.liquidcontainer },
          { key: "hang", value: flags.hang },
          { key: "rotate", value: flags.rotate },
          { key: "dont_hide", value: flags.dont_hide },
          { key: "translucent", value: flags.translucent },
          { key: "lying_object", value: flags.lying_object },
          { key: "animate_always", value: flags.animate_always },
          { key: "fullbank", value: flags.fullbank },
          { key: "ignore_look", value: flags.ignore_look },
          { key: "wrap", value: flags.wrap },
          { key: "unwrap", value: flags.unwrap },
          { key: "topeffect", value: flags.topeffect },
          { key: "corpse", value: flags.corpse },
          { key: "player_corpse", value: flags.player_corpse },
          { key: "ammo", value: flags.ammo },
          { key: "show_off_socket", value: flags.show_off_socket },
          { key: "reportable", value: flags.reportable },
          { key: "reverse_addons_east", value: flags.reverse_addons_east },
          { key: "reverse_addons_west", value: flags.reverse_addons_west },
          { key: "reverse_addons_south", value: flags.reverse_addons_south },
          { key: "reverse_addons_north", value: flags.reverse_addons_north },
          { key: "wearout", value: flags.wearout },
          { key: "clockexpire", value: flags.clockexpire },
          { key: "expire", value: flags.expire },
          { key: "expirestop", value: flags.expirestop },
          { key: "deco_item_kit", value: flags.deco_item_kit },
          { key: "dual_wielding", value: flags.dual_wielding },
        ].filter((f): f is { key: string; value: boolean } => f.value === true)
      : [],
  );

  // Groups use translation keys; the flag keys are internal identifiers matching asset.flags.* translations
  const flagGroupsI18n: Record<string, string[]> = {
    "asset.flags.group.groundStack": ["clip", "bottom", "top", "fullbank"],
    "asset.flags.group.containerStack": [
      "container",
      "cumulative",
      "liquidcontainer",
    ],
    "asset.flags.group.usage": ["usable", "forceuse", "multiuse", "take"],
    "asset.flags.group.movement": [
      "unpass",
      "unmove",
      "unsight",
      "avoid",
      "no_movement_animation",
    ],
    "asset.flags.group.placement": ["hang", "rotate"],
    "asset.flags.group.visual": [
      "dont_hide",
      "translucent",
      "lying_object",
      "animate_always",
      "ignore_look",
      "topeffect",
    ],
    "asset.flags.group.wrapping": ["wrap", "unwrap"],
    "asset.flags.group.specialTypes": [
      "corpse",
      "player_corpse",
      "ammo",
      "show_off_socket",
    ],
    "asset.flags.group.reportable": ["reportable"],
    "asset.flags.group.reverseAddons": [
      "reverse_addons_east",
      "reverse_addons_west",
      "reverse_addons_south",
      "reverse_addons_north",
    ],
    "asset.flags.group.expiration": [
      "wearout",
      "clockexpire",
      "expire",
      "expirestop",
    ],
    "asset.flags.group.special": ["deco_item_kit", "dual_wielding"],
  };

  function getGroupFlags(groupKey: string) {
    const flagKeys = flagGroupsI18n[groupKey] || [];
    return basicFlags.filter((f) => flagKeys.includes(f.key));
  }
</script>

{#if basicFlags.length > 0}
  <div class="detail-section">
    <h4>{translate("asset.flags.activeTitle")} ({basicFlags.length})</h4>
    {#each Object.keys(flagGroupsI18n) as groupKey}
      {@const groupFlags = getGroupFlags(groupKey)}
      {#if groupFlags.length > 0}
        <div class="flags-group">
          <h5 class="flags-group-title">{translate(groupKey as any)}</h5>
          <div class="flags-grid">
            {#each groupFlags as flag}<span class="flag-badge"
                >✅ {translate(`asset.flags.${flag.key}` as any)}</span
              >{/each}
          </div>
        </div>
      {/if}
    {/each}
  </div>
{/if}

{#if flags}
  {#if flags.bank?.waypoints !== undefined}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.groundBank")}</h4>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.flags.field.waypointsSpeed")}</span
        ><span class="detail-value">{flags.bank.waypoints}</span>
      </div>
    </div>
  {/if}
  {#if flags.write?.max_text_length !== undefined || flags.write_once?.max_text_length_once !== undefined}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.writableProps")}</h4>
      {#if flags.write?.max_text_length !== undefined}<div class="detail-item">
          <span class="detail-label"
            >{translate("asset.edit.field.maxTextLen")}</span
          ><span class="detail-value">{flags.write.max_text_length}</span>
        </div>{/if}
      {#if flags.write_once?.max_text_length_once !== undefined}<div
          class="detail-item"
        >
          <span class="detail-label"
            >{translate("asset.edit.field.maxTextLenOnce")}</span
          ><span class="detail-value"
            >{flags.write_once.max_text_length_once}</span
          >
        </div>{/if}
    </div>
  {/if}
  {#if flags.hook?.direction !== undefined}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.hookProps")}</h4>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.flags.field.hookDirection")}</span
        ><span class="detail-value"
          >{getHookDirectionName(flags.hook.direction)}</span
        >
      </div>
    </div>
  {/if}
  {#if flags.light && (flags.light.brightness !== undefined || flags.light.color !== undefined)}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.lightProps")}</h4>
      {#if flags.light.brightness !== undefined}<div class="detail-item">
          <span class="detail-label"
            >{translate("asset.edit.field.brightness")}</span
          ><span class="detail-value">{flags.light.brightness}</span>
        </div>{/if}
      {#if flags.light.color !== undefined}<div class="detail-item">
          <span class="detail-label">{translate("asset.edit.field.color")}</span
          ><span class="detail-value">{flags.light.color}</span>
        </div>{/if}
    </div>
  {/if}
  {#if flags.shift && (flags.shift.x !== undefined || flags.shift.y !== undefined)}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.shiftDisp")}</h4>
      {#if flags.shift.x !== undefined}<div class="detail-item">
          <span class="detail-label"
            >{translate("asset.flags.field.shiftX")}</span
          ><span class="detail-value">{flags.shift.x}</span>
        </div>{/if}
      {#if flags.shift.y !== undefined}<div class="detail-item">
          <span class="detail-label"
            >{translate("asset.flags.field.shiftY")}</span
          ><span class="detail-value">{flags.shift.y}</span>
        </div>{/if}
    </div>
  {/if}
  {#if flags.height?.elevation !== undefined}<div class="detail-section">
      <h4>{translate("asset.flags.section.heightElev")}</h4>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.edit.field.elevation")}</span
        ><span class="detail-value">{flags.height.elevation}</span>
      </div>
    </div>{/if}
  {#if flags.automap?.color !== undefined}<div class="detail-section">
      <h4>{translate("asset.flags.section.automap")}</h4>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.flags.field.minimapColor")}</span
        ><span class="detail-value">{flags.automap.color}</span>
      </div>
    </div>{/if}
  {#if flags.lenshelp?.id !== undefined}<div class="detail-section">
      <h4>{translate("asset.flags.section.lensHelp")}</h4>
      <div class="detail-item">
        <span class="detail-label">{translate("asset.flags.field.helpId")}</span
        ><span class="detail-value">{flags.lenshelp.id}</span>
      </div>
    </div>{/if}
  {#if flags.clothes?.slot !== undefined}<div class="detail-section">
      <h4>{translate("asset.flags.section.clothesEquip")}</h4>
      <div class="detail-item">
        <span class="detail-label">{translate("asset.edit.field.slot")}</span
        ><span class="detail-value"
          >{getClothesSlotName(flags.clothes.slot)}</span
        >
      </div>
    </div>{/if}
  {#if flags.default_action?.action !== undefined}<div class="detail-section">
      <h4>{translate("asset.flags.section.defaultAction")}</h4>
      <div class="detail-item">
        <span class="detail-label">{translate("asset.edit.field.action")}</span
        ><span class="detail-value"
          >{getPlayerActionName(flags.default_action.action)}</span
        >
      </div>
    </div>{/if}
  {#if flags.weapon_type !== undefined}<div class="detail-section">
      <h4>{translate("asset.flags.section.weaponType")}</h4>
      <div class="detail-item">
        <span class="detail-label">{translate("asset.edit.field.type")}</span
        ><span class="detail-value">{getWeaponTypeName(flags.weapon_type)}</span
        >
      </div>
    </div>{/if}
  {#if flags.market}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.marketInfo")}</h4>
      {#if flags.market.category !== undefined}<div class="detail-item">
          <span class="detail-label"
            >{translate("asset.edit.field.category")}</span
          ><span class="detail-value"
            >{getMarketCategoryName(flags.market.category)}</span
          >
        </div>{/if}
      {#if flags.market.trade_as_object_id !== undefined}<div
          class="detail-item"
        >
          <span class="detail-label"
            >{translate("asset.edit.field.tradeAsObjId")}</span
          ><span class="detail-value">{flags.market.trade_as_object_id}</span>
        </div>{/if}
      {#if flags.market.show_as_object_id !== undefined}<div
          class="detail-item"
        >
          <span class="detail-label"
            >{translate("asset.edit.field.showAsObjId")}</span
          ><span class="detail-value">{flags.market.show_as_object_id}</span>
        </div>{/if}
    </div>
  {/if}
  {#if flags.restrict_to_vocation && flags.restrict_to_vocation.length > 0}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.vocationRestr")}</h4>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.flags.field.restrictTo")}</span
        ><span class="detail-value"
          >{flags.restrict_to_vocation
            .map((v) => getVocationName(v))
            .join(", ")}</span
        >
      </div>
    </div>
  {/if}
  {#if flags.minimum_level !== undefined && flags.minimum_level > 0}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.levelReq")}</h4>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.edit.field.minLevel")}</span
        ><span class="detail-value">{flags.minimum_level}</span>
      </div>
    </div>
  {/if}
  {#if flags.npc_sale_data && flags.npc_sale_data.length > 0}
    <div class="detail-section">
      <h4>
        {translate("asset.flags.section.npcSaleData")} ({flags.npc_sale_data
          .length})
      </h4>
      {#each flags.npc_sale_data as npc, idx}
        <div
          class="detail-item-full"
          style="margin-bottom: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.03); border-radius: 4px;"
        >
          <div>
            <strong
              >{translate("asset.flags.field.npcNum", {
                num: String(idx + 1),
              })}</strong
            >
          </div>
          {#if npc.name}<div class="detail-item">
              <span class="detail-label">{translate("asset.edit.name")}</span
              ><span class="detail-value">{npc.name}</span>
            </div>{/if}
          {#if npc.location}<div class="detail-item">
              <span class="detail-label"
                >{translate("asset.edit.field.location")}</span
              ><span class="detail-value">{npc.location}</span>
            </div>{/if}
          {#if npc.sale_price !== undefined}<div class="detail-item">
              <span class="detail-label"
                >{translate("asset.edit.field.salePrice")}</span
              ><span class="detail-value">{npc.sale_price}</span>
            </div>{/if}
          {#if npc.buy_price !== undefined}<div class="detail-item">
              <span class="detail-label"
                >{translate("asset.edit.field.buyPrice")}</span
              ><span class="detail-value">{npc.buy_price}</span>
            </div>{/if}
          {#if npc.currency_object_type_id !== undefined}<div
              class="detail-item"
            >
              <span class="detail-label"
                >{translate("asset.edit.field.currencyObjId")}</span
              ><span class="detail-value">{npc.currency_object_type_id}</span>
            </div>{/if}
          {#if npc.currency_quest_flag_display_name}<div class="detail-item">
              <span class="detail-label"
                >{translate("asset.flags.field.currencyQuestFlag")}</span
              ><span class="detail-value"
                >{npc.currency_quest_flag_display_name}</span
              >
            </div>{/if}
        </div>
      {/each}
    </div>
  {/if}
  {#if flags.changed_to_expire?.former_object_typeid !== undefined}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.changedToExpire")}</h4>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.edit.field.formerObjId")}</span
        ><span class="detail-value"
          >{flags.changed_to_expire.former_object_typeid}</span
        >
      </div>
    </div>
  {/if}
  {#if flags.cyclopedia_item?.cyclopedia_type !== undefined}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.cyclopedia")}</h4>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.edit.field.cyclopediaType")}</span
        ><span class="detail-value"
          >{flags.cyclopedia_item.cyclopedia_type}</span
        >
      </div>
    </div>
  {/if}
  {#if flags.upgrade_classification?.upgrade_classification !== undefined}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.upgradeClass")}</h4>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.edit.field.classification")}</span
        ><span class="detail-value"
          >{flags.upgrade_classification.upgrade_classification}</span
        >
      </div>
    </div>
  {/if}
  {#if flags.skillwheel_gem}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.skillwheelGem")}</h4>
      {#if flags.skillwheel_gem.gem_quality_id !== undefined}<div
          class="detail-item"
        >
          <span class="detail-label"
            >{translate("asset.edit.field.gemQualId")}</span
          ><span class="detail-value"
            >{flags.skillwheel_gem.gem_quality_id}</span
          >
        </div>{/if}
      {#if flags.skillwheel_gem.vocation_id !== undefined}<div
          class="detail-item"
        >
          <span class="detail-label">{translate("asset.edit.field.vocId")}</span
          ><span class="detail-value">{flags.skillwheel_gem.vocation_id}</span>
        </div>{/if}
    </div>
  {/if}
  {#if flags.imbueable?.slot_count !== undefined}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.imbueable")}</h4>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.edit.field.slotCount")}</span
        ><span class="detail-value">{flags.imbueable.slot_count}</span>
      </div>
    </div>
  {/if}
  {#if flags.proficiency?.proficiency_id !== undefined}
    <div class="detail-section">
      <h4>{translate("asset.flags.section.proficiency")}</h4>
      <div class="detail-item">
        <span class="detail-label">{translate("asset.edit.field.profId")}</span
        ><span class="detail-value">{flags.proficiency.proficiency_id}</span>
      </div>
    </div>
  {/if}
{/if}
