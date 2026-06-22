<script lang="ts">
  import type { CompleteAppearanceItem } from "../../../types";
  import { translate } from "../../../i18n";
  import { openSelect } from "../../../stores/spriteLibraryState.svelte";
  import { openPromptModal } from "../../../stores/promptState.svelte";
  import { untrack } from "svelte";
  import Color8BitField from "./Color8BitField.svelte";

  // Lens-help types (DatEditor parity): id = index + 1100 (1100..1112).
  const lensHelpTypes = [
    "asset.edit.opt.lensh_ladders",
    "asset.edit.opt.lensh_sewerGrates",
    "asset.edit.opt.lensh_dungeonFloor",
    "asset.edit.opt.lensh_levers",
    "asset.edit.opt.lensh_doors",
    "asset.edit.opt.lensh_specialDoors",
    "asset.edit.opt.lensh_stairs",
    "asset.edit.opt.lensh_mailboxes",
    "asset.edit.opt.lensh_depotBoxes",
    "asset.edit.opt.lensh_dustbins",
    "asset.edit.opt.lensh_stonePiles",
    "asset.edit.opt.lensh_signs",
    "asset.edit.opt.lensh_booksScrolls",
  ];
  const LENS_BASE = 1100;

  interface Props {
    details: CompleteAppearanceItem;
    category?: string;
    bindDetails?: (getEditedData: () => CompleteAppearanceItem) => void;
  }
  let { details, bindDetails }: Props = $props();

  function buildFlags(sourceDetails: CompleteAppearanceItem) {
    let newFlags = JSON.parse(JSON.stringify(sourceDetails.flags || {}));

    if (!newFlags.light) newFlags.light = { brightness: 0, color: 0 };
    if (!newFlags.shift) newFlags.shift = { x: 0, y: 0 };
    if (!newFlags.height) newFlags.height = { elevation: 0 };
    if (!newFlags.write) newFlags.write = { max_text_length: 0 };
    if (!newFlags.write_once) newFlags.write_once = { max_text_length_once: 0 };
    if (!newFlags.automap) newFlags.automap = { color: 0 };
    if (!newFlags.hook) newFlags.hook = { direction: 1 };
    if (!newFlags.lenshelp) newFlags.lenshelp = { id: 0 };
    if (!newFlags.clothes) newFlags.clothes = { slot: 0 };
    if (!newFlags.default_action) newFlags.default_action = { action: 0 };
    if (!newFlags.market)
      newFlags.market = {
        category: 9,
        trade_as_object_id: 0,
        show_as_object_id: 0,
      };
    if (!newFlags.changed_to_expire)
      newFlags.changed_to_expire = { former_object_typeid: 0 };
    if (!newFlags.cyclopedia_item)
      newFlags.cyclopedia_item = { cyclopedia_type: 0 };
    if (!newFlags.upgrade_classification)
      newFlags.upgrade_classification = { upgrade_classification: 0 };
    if (!newFlags.skillwheel_gem)
      newFlags.skillwheel_gem = { gem_quality_id: 0, vocation_id: 0 };
    if (!newFlags.imbueable) newFlags.imbueable = { slot_count: 0 };
    if (!newFlags.proficiency) newFlags.proficiency = { proficiency_id: 0 };
    if (!newFlags.minimum_level) newFlags.minimum_level = 0;
    if (!newFlags.restrict_to_vocation) newFlags.restrict_to_vocation = [];
    if (!newFlags.npc_sale_data) newFlags.npc_sale_data = [];

    return newFlags;
  }

  let name = $state("");
  let description = $state("");
  let flags: any = $state({});

  $effect(() => {
    // Sincroniza estado sempre que o selected `details` de fora mudar
    untrack(() => {
      name = details.name || "";
      description = details.description || "";
      flags = buildFlags(details);
    });
  });

  $effect(() => {
    if (bindDetails) {
      untrack(() => {
        bindDetails(() => ({ ...details, name, description, flags }));
      });
    }
  });

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
    openSelect(callback);
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

{#if flags.light}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.light")}</h4>
    <div class="detail-item">
      <span class="detail-label"
        >{translate("asset.edit.field.brightness")}</span
      >
      <div class="number-input">
        <input type="number" min="0" bind:value={flags.light.brightness} />
      </div>
    </div>
    <Color8BitField
      label={translate("asset.edit.field.color")}
      value={flags.light.color ?? 0}
      onChange={(v) => (flags.light.color = v)}
    />
  </div>
{/if}
{#if flags.shift}
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
{/if}
{#if flags.height}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.height")}</h4>
    <div class="detail-item">
      <span class="detail-label">{translate("asset.edit.field.elevation")}</span
      >
      <div class="number-input">
        <input type="number" bind:value={flags.height.elevation} />
      </div>
    </div>
  </div>
{/if}
{#if flags.write}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.write")}</h4>
    <div class="detail-item">
      <span class="detail-label"
        >{translate("asset.edit.field.maxTextLen")}</span
      >
      <div class="number-input">
        <input type="number" bind:value={flags.write.max_text_length} />
      </div>
    </div>
  </div>
{/if}
{#if flags.write_once}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.writeOnce")}</h4>
    <div class="detail-item">
      <span class="detail-label"
        >{translate("asset.edit.field.maxTextLenOnce")}</span
      >
      <div class="number-input">
        <input
          type="number"
          bind:value={flags.write_once.max_text_length_once}
        />
      </div>
    </div>
  </div>
{/if}
{#if flags.automap}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.automap")}</h4>
    <Color8BitField
      label={translate("asset.edit.field.color")}
      value={flags.automap.color ?? 0}
      onChange={(v) => (flags.automap.color = v)}
    />
  </div>
{/if}
{#if flags.hook}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.hook")}</h4>
    <div class="detail-item">
      <span class="detail-label">{translate("asset.edit.field.direction")}</span
      >
      <div class="select-input">
        <select bind:value={flags.hook.direction}
          ><option value={undefined}>—</option><option value={1}
            >{translate("asset.edit.opt.south")}</option
          ><option value={2}>{translate("asset.edit.east")}</option></select
        >
      </div>
    </div>
  </div>
{/if}
{#if flags.lenshelp}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.lensHelp")}</h4>
    <div class="detail-item">
      <span class="detail-label">{translate("asset.edit.field.type")}</span>
      <div class="select-input">
        <select
          value={flags.lenshelp.id >= LENS_BASE &&
          flags.lenshelp.id < LENS_BASE + lensHelpTypes.length
            ? flags.lenshelp.id
            : ""}
          onchange={(e) => {
            const v = (e.currentTarget as HTMLSelectElement).value;
            if (v !== "") flags.lenshelp.id = Number(v);
          }}
        >
          <option value="">—</option>
          {#each lensHelpTypes as key, i}
            <option value={LENS_BASE + i}>{translate(key as any)}</option>
          {/each}
        </select>
      </div>
    </div>
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
{/if}
{#if flags.clothes}
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
          ><option value={6}>{translate("asset.edit.opt.weapon")}</option
          ><option value={7}>{translate("asset.edit.opt.legs")}</option><option
            value={8}>{translate("asset.edit.opt.boots")}</option
          ><option value={9}>{translate("asset.edit.opt.ring")}</option><option
            value={10}>{translate("asset.edit.opt.arrowQuiver")}</option
          ></select
        >
      </div>
    </div>
  </div>
{/if}
{#if flags.default_action}
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
{/if}
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
{#if flags.market}
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
      <span class="detail-label"
        >{translate("asset.edit.field.showAsObjId")}</span
      >
      <div class="number-input" style="display:flex;gap:0.5rem;">
        <input
          type="number"
          bind:value={flags.market.show_as_object_id}
        /><button
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
{/if}
{#if flags.changed_to_expire}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.changedToExpire")}</h4>
    <div class="detail-item">
      <span class="detail-label"
        >{translate("asset.edit.field.formerObjId")}</span
      >
      <div class="number-input">
        <input
          type="number"
          bind:value={flags.changed_to_expire.former_object_typeid}
        />
      </div>
    </div>
  </div>
{/if}
{#if flags.cyclopedia_item}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.cyclopedia")}</h4>
    <div class="detail-item">
      <span class="detail-label"
        >{translate("asset.edit.field.cyclopediaType")}</span
      >
      <div class="number-input">
        <input
          type="number"
          bind:value={flags.cyclopedia_item.cyclopedia_type}
        />
      </div>
    </div>
  </div>
{/if}
{#if flags.upgrade_classification}
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
{/if}
{#if flags.skillwheel_gem}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.skillwheelGem")}</h4>
    <div class="detail-item">
      <span class="detail-label">{translate("asset.edit.field.gemQualId")}</span
      >
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
{/if}
{#if flags.imbueable}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.imbueable")}</h4>
    <div class="detail-item">
      <span class="detail-label">{translate("asset.edit.field.slotCount")}</span
      >
      <div class="number-input">
        <input type="number" bind:value={flags.imbueable.slot_count} />
      </div>
    </div>
  </div>
{/if}
{#if flags.proficiency}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.proficiency")}</h4>
    <div class="detail-item">
      <span class="detail-label">{translate("asset.edit.field.profId")}</span>
      <div class="number-input">
        <input type="number" bind:value={flags.proficiency.proficiency_id} />
      </div>
    </div>
  </div>
{/if}

{#if flags.restrict_to_vocation}
  <div class="detail-section">
    <h4>{translate("asset.edit.attr.requirements")}</h4>
    <div class="detail-item">
      <span class="detail-label">{translate("asset.edit.field.minLevel")}</span>
      <div class="number-input">
        <input type="number" bind:value={flags.minimum_level} />
      </div>
    </div>
    <div class="detail-item" style="align-items: flex-start;">
      <span class="detail-label">{translate("asset.edit.field.vocations")}</span
      >
      <div
        style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;"
      >
        {#each [1, 2, 3, 4] as _, i}
          <label
            style="display: flex; align-items: center; gap: 0.5rem; color: #ccc;"
          >
            <input
              type="checkbox"
              checked={flags.restrict_to_vocation.includes(i + 1)}
              onchange={(e) => {
                if ((e.currentTarget as HTMLInputElement).checked)
                  flags.restrict_to_vocation = [
                    ...flags.restrict_to_vocation,
                    i + 1,
                  ];
                else
                  flags.restrict_to_vocation =
                    flags.restrict_to_vocation.filter(
                      (v: number) => v !== i + 1,
                    );
              }}
            />
            {translate("asset.edit.lbl.vocId", { id: String(i + 1) })}
          </label>
        {/each}
        <button
          class="btn-secondary"
          style="margin-top: 0.5rem;"
          onclick={async () => {
            const id = await openPromptModal({
              title: translate("asset.edit.prompt.vocId"),
            });
            if (id && !isNaN(parseInt(id))) {
              if (!flags.restrict_to_vocation.includes(parseInt(id)))
                flags.restrict_to_vocation = [
                  ...flags.restrict_to_vocation,
                  parseInt(id),
                ];
            }
          }}>{translate("asset.edit.btn.addVoc")}</button
        >
        {#each flags.restrict_to_vocation.filter((v: number) => v > 4) as extraVoc}
          <div
            style="display: flex; align-items: center; justify-content: space-between; background: #222; padding: 0.5rem; border-radius: 4px;"
          >
            <span
              >{translate("asset.edit.lbl.vocId", {
                id: String(extraVoc),
              })}</span
            >
            <button
              class="btn-secondary"
              style="padding: 0.2rem 0.5rem;"
              onclick={() =>
                (flags.restrict_to_vocation = flags.restrict_to_vocation.filter(
                  (v: number) => v !== extraVoc,
                ))}>{translate("asset.edit.btn.remove")}</button
            >
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

{#if flags.npc_sale_data}
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
                (_: unknown, i: number) => i !== index,
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
{/if}
