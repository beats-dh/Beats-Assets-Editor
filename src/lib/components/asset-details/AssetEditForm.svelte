<script lang="ts">
  import type { CompleteAppearanceItem, CompleteFlags } from "../../../types";
  import { translate } from "../../../i18n";
  import { spriteLibraryState } from "../../../stores/spriteLibraryState.svelte";
  import { onMount, untrack } from "svelte";

  interface Props {
    details: CompleteAppearanceItem;
    category?: string;
    onSave?: (updated: CompleteAppearanceItem) => void;
    bindDetails?: (getEditedData: () => CompleteAppearanceItem) => void;
  }
  let { details, category = "", onSave, bindDetails }: Props = $props();

  let name = $state(details.name || "");
  let description = $state(details.description || "");
  let flags: any = $state(JSON.parse(JSON.stringify(details.flags || {})));

  $effect(() => {
    if (bindDetails) {
      untrack(() => {
        bindDetails(() => ({ ...details, name, description, flags }));
      });
    }
  });

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
  if (!flags.market)
    flags.market = { category: 9, trade_as_object_id: 0, show_as_object_id: 0 };
  if (!flags.changed_to_expire)
    flags.changed_to_expire = { former_object_typeid: 0 };
  if (!flags.cyclopedia_item) flags.cyclopedia_item = { cyclopedia_type: 0 };
  if (!flags.upgrade_classification)
    flags.upgrade_classification = { upgrade_classification: 0 };
  if (!flags.skillwheel_gem)
    flags.skillwheel_gem = { gem_quality_id: 0, vocation_id: 0 };
  if (!flags.imbueable) flags.imbueable = { slot_count: 0 };
  if (!flags.proficiency) flags.proficiency = { proficiency_id: 0 };
  if (!flags.minimum_level) flags.minimum_level = 0;
  if (!flags.restrict_to_vocation) flags.restrict_to_vocation = [];
  if (!flags.npc_sale_data) flags.npc_sale_data = [];

  const flagDefs = [
    { key: "clip", label: "Clip" },
    { key: "bottom", label: "Bottom" },
    { key: "top", label: "Top" },
    { key: "container", label: "Container" },
    { key: "cumulative", label: "Cumulative" },
    { key: "usable", label: "Usable" },
    { key: "forceuse", label: "Forceuse" },
    { key: "multiuse", label: "Multiuse" },
    { key: "liquidpool", label: "Liquidpool" },
    { key: "liquidcontainer", label: "Liquid Container" },
    { key: "unpass", label: "Unpass" },
    { key: "unmove", label: "Unmove" },
    { key: "unsight", label: "Unsight" },
    { key: "avoid", label: "Avoid" },
    { key: "no_movement_animation", label: "No Move Animation" },
    { key: "take", label: "Take" },
    { key: "hang", label: "Hang" },
    { key: "rotate", label: "Rotate" },
    { key: "dont_hide", label: "Dont Hide" },
    { key: "translucent", label: "Translucent" },
    { key: "lying_object", label: "Lying Object" },
    { key: "animate_always", label: "Animate Always" },
    { key: "fullbank", label: "Fullbank" },
    { key: "ignore_look", label: "Ignore Look" },
    { key: "wrap", label: "Wrap" },
    { key: "unwrap", label: "Unwrap" },
    { key: "topeffect", label: "Topeffect" },
    { key: "corpse", label: "Corpse" },
    { key: "player_corpse", label: "Player Corpse" },
    { key: "ammo", label: "Ammo" },
    { key: "show_off_socket", label: "Show Off Socket" },
    { key: "reportable", label: "Reportable" },
    { key: "reverse_addons_east", label: "Reverse addon east" },
    { key: "reverse_addons_west", label: "Reverse addon west" },
    { key: "reverse_addons_south", label: "Reverse addon south" },
    { key: "reverse_addons_north", label: "Reverse addon north" },
    { key: "wearout", label: "Wearout" },
    { key: "clockexpire", label: "Clockexpire" },
    { key: "expire", label: "Expire" },
    { key: "expirestop", label: "Expirestop" },
    { key: "deco_item_kit", label: "Deco Item Kit" },
    { key: "dual_wielding", label: "Dual Wielding" },
  ];

  function openSpriteSelector(callback: (id: number) => void) {
    spriteLibraryState.openSelect(callback);
  }

  function handleSave() {
    onSave({ ...details, name, description, flags });
  }
</script>

<div class="detail-section">
  <h4>{translate("asset.edit.title")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.name")}</span><input
      type="text"
      bind:value={name}
      placeholder={translate("asset.edit.placeholderName")}
    />
  </div>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.desc")}</span><textarea
      rows="3"
      bind:value={description}
      placeholder={translate("asset.edit.placeholderDesc")}
    ></textarea>
  </div>
</div>

<div class="detail-section">
  <h4>{translate("asset.edit.flagsTitle")}</h4>
  <div class="flags-grid">
    {#each flagDefs as f}
      <label class="flag-toggle"
        ><input
          type="checkbox"
          class="flag-checkbox"
          bind:checked={flags[f.key]}
        /><span>{translate(`asset.flags.${f.key}` as any)}</span></label
      >
    {/each}
  </div>
</div>

<div class="detail-section">
  <h4>{translate("asset.edit.attr.light")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.brightness")}</span>
    <div class="number-input">
      <input type="number" min="0" bind:value={flags.light.brightness} />
    </div>
  </div>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.color")}</span>
    <div class="number-input">
      <input type="number" min="0" bind:value={flags.light.color} />
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.shift")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.x")}</span>
    <div class="number-input">
      <input type="number" bind:value={flags.shift.x} />
    </div>
  </div>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.y")}</span>
    <div class="number-input">
      <input type="number" bind:value={flags.shift.y} />
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.height")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.elevation")}</span>
    <div class="number-input">
      <input type="number" bind:value={flags.height.elevation} />
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.write")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.maxTextLen")}</span>
    <div class="number-input">
      <input type="number" bind:value={flags.write.max_text_length} />
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.writeOnce")}</h4>
  <div class="detail-item">
    <span class="detail-label"
      >{translate("asset.edit.field.maxTextLenOnce")}</span
    >
    <div class="number-input">
      <input type="number" bind:value={flags.write_once.max_text_length_once} />
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.automap")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.color")}</span>
    <div class="number-input">
      <input type="number" bind:value={flags.automap.color} />
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.hook")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.direction")}</span>
    <div class="select-input">
      <select bind:value={flags.hook.direction}
        ><option value={undefined}>—</option><option value={1}
          >{translate("asset.edit.opt.south")}</option
        ><option value={2}>{translate("asset.edit.east")}</option></select
      >
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.lensHelp")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.id")}</span>
    <div class="number-input" style="display:flex;gap:0.5rem;">
      <input type="number" bind:value={flags.lenshelp.id} /><button
        type="button"
        class="btn-secondary"
        style="padding:0 0.5rem;"
        onclick={() => openSpriteSelector((id) => (flags.lenshelp.id = id))}
        >🔍</button
      >
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.clothes")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.slot")}</span>
    <div class="select-input">
      <select bind:value={flags.clothes.slot}
        ><option value={0}>{translate("asset.edit.opt.none")}</option><option
          value={1}>{translate("asset.edit.opt.helmet")}</option
        ><option></option><option value={2}
          >{translate("asset.edit.opt.amulet")}</option
        ><option value={3}>{translate("asset.edit.opt.backpack")}</option
        ><option value={4}>{translate("asset.edit.opt.armor")}</option><option
          value={5}>{translate("asset.edit.opt.shield")}</option
        ><option value={6}>{translate("asset.edit.opt.weapon")}</option><option
          value={7}>{translate("asset.edit.opt.legs")}</option
        ><option value={8}>{translate("asset.edit.opt.boots")}</option><option
          value={9}>{translate("asset.edit.opt.ring")}</option
        ><option value={10}>{translate("asset.edit.opt.arrowQuiver")}</option
        ></select
      >
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.defaultAction")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.action")}</span>
    <div class="select-input">
      <select bind:value={flags.default_action.action}
        ><option value={0}>{translate("asset.edit.opt.none")}</option><option
          value={1}>{translate("asset.edit.opt.look")}</option
        ><option></option><option value={2}
          >{translate("asset.edit.opt.use")}</option
        ><option value={3}>{translate("asset.edit.opt.open")}</option><option
          value={4}>{translate("asset.edit.opt.autowalkHi")}</option
        ></select
      >
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.weaponType")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.type")}</span>
    <div class="select-input">
      <select bind:value={flags.weapon_type}
        ><option value={undefined}>—</option><option value={0}
          >{translate("asset.edit.opt.noWeapon")}</option
        ><option value={1}>{translate("asset.edit.opt.sword")}</option><option
          value={2}>{translate("asset.edit.opt.axe")}</option
        ><option value={3}>{translate("asset.edit.opt.club")}</option><option
          value={4}>{translate("asset.edit.opt.fist")}</option
        ><option value={5}>{translate("asset.edit.opt.bow")}</option><option
          value={6}>Crossbow</option
        ><option value={7}>{translate("asset.edit.opt.wandRod")}</option><option
          value={8}>{translate("asset.edit.opt.throw")}</option
        ></select
      >
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.market")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.category")}</span>
    <div class="select-input">
      <select bind:value={flags.market.category}
        ><option value={undefined}>—</option
        >{#each Array.from({ length: 27 }, (_, i) => i + 1) as v}<option
            value={v}>{v}</option
          >{/each}</select
      >
    </div>
  </div>
  <div class="detail-item">
    <span class="detail-label"
      >{translate("asset.edit.field.tradeAsObjId")}</span
    >
    <div class="number-input" style="display:flex;gap:0.5rem;">
      <input
        type="number"
        bind:value={flags.market.trade_as_object_id}
      /><button
        type="button"
        class="btn-secondary"
        style="padding:0 0.5rem;"
        onclick={() =>
          openSpriteSelector((id) => (flags.market.trade_as_object_id = id))}
        >🔍</button
      >
    </div>
  </div>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.showAsObjId")}</span
    >
    <div class="number-input" style="display:flex;gap:0.5rem;">
      <input type="number" bind:value={flags.market.show_as_object_id} /><button
        type="button"
        class="btn-secondary"
        style="padding:0 0.5rem;"
        onclick={() =>
          openSpriteSelector((id) => (flags.market.show_as_object_id = id))}
        >🔍</button
      >
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.changedToExpire")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.formerObjId")}</span
    >
    <div class="number-input">
      <input
        type="number"
        bind:value={flags.changed_to_expire.former_object_typeid}
      />
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.cyclopedia")}</h4>
  <div class="detail-item">
    <span class="detail-label"
      >{translate("asset.edit.field.cyclopediaType")}</span
    >
    <div class="number-input">
      <input type="number" bind:value={flags.cyclopedia_item.cyclopedia_type} />
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.upgradeClass")}</h4>
  <div class="detail-item">
    <span class="detail-label"
      >{translate("asset.edit.field.classification")}</span
    >
    <div class="number-input">
      <input
        type="number"
        bind:value={flags.upgrade_classification.upgrade_classification}
      />
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.skillwheelGem")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.gemQualId")}</span>
    <div class="number-input">
      <input type="number" bind:value={flags.skillwheel_gem.gem_quality_id} />
    </div>
  </div>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.vocId")}</span>
    <div class="number-input">
      <input type="number" bind:value={flags.skillwheel_gem.vocation_id} />
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.imbueable")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.slotCount")}</span>
    <div class="number-input">
      <input type="number" bind:value={flags.imbueable.slot_count} />
    </div>
  </div>
</div>
<div class="detail-section">
  <h4>{translate("asset.edit.attr.proficiency")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.profId")}</span>
    <div class="number-input">
      <input type="number" bind:value={flags.proficiency.proficiency_id} />
    </div>
  </div>
</div>

<div class="detail-section">
  <h4>{translate("asset.edit.attr.requirements")}</h4>
  <div class="detail-item">
    <span class="detail-label">{translate("asset.edit.field.minLevel")}</span>
    <div class="number-input">
      <input type="number" bind:value={flags.minimum_level} />
    </div>
  </div>
  <div class="detail-item" style="align-items: flex-start;">
    <span class="detail-label">{translate("asset.edit.field.vocations")}</span>
    <div
      style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;"
    >
      {#each [1, 2, 3, 4] as vocName, i}
        <label
          style="display: flex; align-items: center; gap: 0.5rem; color: #ccc;"
        >
          <input
            type="checkbox"
            checked={flags.restrict_to_vocation.includes(i + 1)}
            onchange={(e) => {
              if (e.target.checked)
                flags.restrict_to_vocation = [
                  ...flags.restrict_to_vocation,
                  i + 1,
                ];
              else
                flags.restrict_to_vocation = flags.restrict_to_vocation.filter(
                  (v) => v !== i + 1,
                );
            }}
          />
          {translate("asset.edit.lbl.vocId", { id: String(i + 1) })}
        </label>
      {/each}
      <button
        class="btn-secondary"
        style="margin-top: 0.5rem;"
        onclick={() => {
          const id = prompt(translate("asset.edit.prompt.vocId"));
          if (id && !isNaN(parseInt(id))) {
            if (!flags.restrict_to_vocation.includes(parseInt(id)))
              flags.restrict_to_vocation = [
                ...flags.restrict_to_vocation,
                parseInt(id),
              ];
          }
        }}>{translate("asset.edit.btn.addVoc")}</button
      >
      {#each flags.restrict_to_vocation.filter((v) => v > 4) as extraVoc}
        <div
          style="display: flex; align-items: center; justify-content: space-between; background: #222; padding: 0.5rem; border-radius: 4px;"
        >
          <span
            >{translate("asset.edit.lbl.vocId", { id: String(extraVoc) })}</span
          >
          <button
            class="btn-secondary"
            style="padding: 0.2rem 0.5rem;"
            onclick={() =>
              (flags.restrict_to_vocation = flags.restrict_to_vocation.filter(
                (v) => v !== extraVoc,
              ))}>{translate("asset.edit.btn.remove")}</button
          >
        </div>
      {/each}
    </div>
  </div>
</div>

<div class="detail-section">
  <h4>{translate("asset.edit.attr.npcSaleData")}</h4>
  {#each flags.npc_sale_data as npc, index}
    <div
      style="background: rgba(0,0,0,0.2); padding: 1rem; margin-bottom: 1rem; border-radius: 8px;"
    >
      <div
        style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;"
      >
        <strong
          >{translate("asset.edit.lbl.npcNum", {
            num: String(index + 1),
          })}</strong
        >
        <button
          class="btn-secondary"
          onclick={() =>
            (flags.npc_sale_data = flags.npc_sale_data.filter(
              (_, i) => i !== index,
            ))}>{translate("asset.edit.btn.remove")}</button
        >
      </div>
      <div class="detail-item">
        <span class="detail-label">{translate("asset.edit.name")}</span><input
          type="text"
          bind:value={npc.name}
        />
      </div>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.edit.field.location")}</span
        ><input type="text" bind:value={npc.location} />
      </div>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.edit.field.salePrice")}</span
        >
        <div class="number-input">
          <input type="number" bind:value={npc.sale_price} />
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.edit.field.buyPrice")}</span
        >
        <div class="number-input">
          <input type="number" bind:value={npc.buy_price} />
        </div>
      </div>
      <div class="detail-item">
        <span class="detail-label"
          >{translate("asset.edit.field.currencyObjId")}</span
        >
        <div class="number-input">
          <input type="number" bind:value={npc.currency_object_type_id} />
        </div>
      </div>
    </div>
  {/each}
  <button
    class="btn-secondary"
    onclick={() =>
      (flags.npc_sale_data = [
        ...flags.npc_sale_data,
        {
          name: "",
          location: "",
          sale_price: 0,
          buy_price: 0,
          currency_object_type_id: 0,
        },
      ])}>{translate("asset.edit.btn.addNpc")}</button
  >
</div>
