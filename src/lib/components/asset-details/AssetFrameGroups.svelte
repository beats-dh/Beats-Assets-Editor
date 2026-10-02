<script lang="ts">
  import type { CompleteAppearanceItem } from "../../../types";
  import { translate } from "../../../i18n";
  interface Props {
    details: CompleteAppearanceItem;
  }
  let { details }: Props = $props();

  function getFixedFrameGroupName(group: number | undefined): string {
    if (group === undefined || group === null)
      return translate("asset.fg.unknown");
    switch (group) {
      case 0:
        return translate("asset.fg.outfitIdle");
      case 1:
        return translate("asset.fg.outfitMoving");
      case 2:
        return translate("asset.fg.objectInitial");
      default:
        return `${translate("asset.fg.unknown")} (${group})`;
    }
  }
  function getLoopTypeName(loopType: number): string {
    if (loopType === -1) return translate("asset.fg.loopTypes.pingpong");
    if (loopType === 0) return translate("asset.fg.loopTypes.infinite");
    if (loopType === 1) return translate("asset.fg.loopTypes.counted");
    return `${translate("asset.fg.unknown")} (${loopType})`;
  }
</script>

{#if details && details.frame_groups && details.frame_groups.length > 0}
  <div class="detail-section">
    <h4>
      {translate("asset.fg.title", {
        count: String(details.frame_groups.length),
      })}
    </h4>
    {#each details.frame_groups as fg, index}
      <div class="frame-group-detail">
        <strong
          >{translate("asset.fg.group", { index: String(index + 1) })}</strong
        >
        {#if fg.fixed_frame_group !== undefined}<div class="detail-item">
            <span class="detail-label">{translate("asset.fg.fixed")}</span><span
              class="detail-value"
              >{getFixedFrameGroupName(fg.fixed_frame_group)} ({fg.fixed_frame_group})</span
            >
          </div>{/if}
        {#if fg.id !== undefined}<div class="detail-item">
            <span class="detail-label">{translate("asset.fg.id")}</span><span
              class="detail-value">{fg.id}</span
            >
          </div>{/if}
        {#if fg.sprite_info}
          {@const spriteInfo = fg.sprite_info}
          {#if spriteInfo.pattern_width !== undefined}<div class="detail-item">
              <span class="detail-label">{translate("asset.fg.width")}</span
              ><span class="detail-value">{spriteInfo.pattern_width}</span>
            </div>{/if}
          {#if spriteInfo.pattern_height !== undefined}<div class="detail-item">
              <span class="detail-label">{translate("asset.fg.height")}</span
              ><span class="detail-value">{spriteInfo.pattern_height}</span>
            </div>{/if}
          {#if spriteInfo.pattern_depth !== undefined}<div class="detail-item">
              <span class="detail-label">{translate("asset.fg.depth")}</span
              ><span class="detail-value">{spriteInfo.pattern_depth}</span>
            </div>{/if}
          {#if spriteInfo.layers !== undefined}<div class="detail-item">
              <span class="detail-label">{translate("asset.fg.layers")}</span
              ><span class="detail-value">{spriteInfo.layers}</span>
            </div>{/if}
          {#if spriteInfo.bounding_square !== undefined}<div
              class="detail-item"
            >
              <span class="detail-label">{translate("asset.fg.box")}</span><span
                class="detail-value">{spriteInfo.bounding_square}</span
              >
            </div>{/if}
          {#if spriteInfo.is_opaque !== undefined}<div class="detail-item">
              <span class="detail-label">{translate("asset.fg.opaque")}</span
              ><span class="detail-value"
                >{spriteInfo.is_opaque
                  ? translate("asset.fg.yes")
                  : translate("asset.fg.no")}</span
              >
            </div>{/if}
          {#if spriteInfo.sprite_ids && spriteInfo.sprite_ids.length > 0}
            <div class="detail-item-full sprite-ids-section">
              <div class="detail-label">
                {translate("asset.fg.sprites", {
                  count: String(spriteInfo.sprite_ids.length),
                })}
              </div>
              <div class="sprite-ids-value">
                {spriteInfo.sprite_ids.slice(0, 15).join(", ")}{spriteInfo
                  .sprite_ids.length > 15
                  ? ", ..."
                  : ""}
              </div>
              {#if spriteInfo.sprite_ids.length > 15}<details>
                  <summary
                    >{translate("asset.fg.showAll", {
                      count: String(spriteInfo.sprite_ids.length),
                    })}</summary
                  >
                  <div class="sprite-ids-full">
                    {spriteInfo.sprite_ids.join(", ")}
                  </div>
                </details>{/if}
            </div>
          {/if}
          {#if spriteInfo.bounding_boxes && spriteInfo.bounding_boxes.length > 0}
            <div class="detail-item-full bounding-boxes-section">
              <div class="detail-label">{translate("asset.fg.boxesTitle")}</div>
              <div class="bounding-boxes-table">
                <div class="bb-header">
                  <span>{translate("asset.fg.dir")}</span><span
                    >{translate("asset.fg.x")}</span
                  ><span>{translate("asset.fg.y")}</span><span
                    >{translate("asset.fg.w")}</span
                  ><span>{translate("asset.fg.h")}</span>
                </div>
                {#each spriteInfo.bounding_boxes as box, idx}
                  <div class="bb-row">
                    <span class="bb-direction">#{idx + 1}</span><span
                      >{box.x ?? "—"}</span
                    ><span>{box.y ?? "—"}</span><span>{box.width ?? "—"}</span
                    ><span>{box.height ?? "—"}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          {#if spriteInfo.animation}
            {@const anim = spriteInfo.animation}
            <div class="detail-item-full animation-section">
              <div class="detail-label">{translate("asset.fg.animTitle")}</div>
              <div class="detail-value">
                <div>
                  {translate("asset.fg.phases", {
                    count: String(anim.phases.length),
                  })}
                </div>
                {#if anim.synchronized !== undefined}<div>
                    {translate("asset.fg.sync")}
                    {anim.synchronized
                      ? translate("asset.fg.yes")
                      : translate("asset.fg.no")}
                  </div>{/if}
                {#if anim.loop_type !== undefined}<div>
                    {translate("asset.fg.loopType")}
                    {getLoopTypeName(anim.loop_type)}
                  </div>{/if}
                {#if anim.loop_count !== undefined}<div>
                    {translate("asset.fg.loopCount")}
                    {anim.loop_count}
                  </div>{/if}
                <div class="animation-phases">
                  {#each anim.phases as ph, idx}<div class="phase-item">
                      <span class="phase-index"
                        >{translate("asset.fg.phaseN", {
                          n: String(idx + 1),
                        })}</span
                      ><span class="phase-duration"
                        >{ph.duration_min ?? "—"}-{ph.duration_max ?? "—"} ms</span
                      >
                    </div>{/each}
                </div>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
{/if}
