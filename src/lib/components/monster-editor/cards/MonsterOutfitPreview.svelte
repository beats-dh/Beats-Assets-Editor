<script lang="ts">
    import { onDestroy } from "svelte";
    import { invoke } from "../../../../utils/invoke";
    import { getAppearanceSprites, pixelSprite } from "../../../../spriteCache";
    import { getSpriteUrl } from "../../../../utils/spriteUrlCache";
    import {
        computeSpriteIndex,
        computeGroupOffsetsFromDetails,
    } from "../../../../animation";
    import { outfitColorIdToRgb } from "../utils";
    import { translate } from "../../../../i18n";
    import type {
        CompleteAppearanceItem,
        CompleteSpriteInfo,
    } from "../../../../types";
    import type { MonsterOutfit } from "../../../../monsterTypes";

    interface Props {
        outfit: MonsterOutfit;
        showInfo?: boolean;
    }
    let { outfit, showInfo = true }: Props = $props();

    let spriteSrc = $state("");
    let previewDirections = $state<any[]>([]);
    let currentDirectionIndex = $state(0);
    let spritePlaceholder = $state("?");
    let animationTimer: number | null = null;
    let animationFrameIndex = 0;

    // Static context
    const outfitSpriteMetadataCache = new Map<
        number,
        { spriteInfo: CompleteSpriteInfo; baseOffset: number }
    >();
    let outfitComposeWorker: Worker | null = null;
    let outfitComposeRequestId = 0;
    const outfitPending = new Map<string, (value: string | null) => void>();

    function initOutfitWorker() {
        if (outfitComposeWorker) return;
        try {
            outfitComposeWorker = new Worker(
                new URL(
                    "../../../../workers/outfitComposeWorker.ts",
                    import.meta.url,
                ),
                { type: "module" },
            );
            outfitComposeWorker.onmessage = (event) => {
                const { id, buffer } = event.data;
                const resolve = outfitPending.get(id);
                if (resolve) {
                    const dataUrl = buffer
                        ? getSpriteUrl(new Uint8Array(buffer))
                        : null;
                    resolve(dataUrl);
                    outfitPending.delete(id);
                }
            };
        } catch (error) {
            console.error(error);
            outfitComposeWorker = null;
        }
    }

    function bufferSlice(sprite: Uint8Array): ArrayBuffer {
        return sprite.slice().buffer;
    }

    async function loadOutfitSprite(
        o: MonsterOutfit,
        preserveDirection = false,
    ) {
        stopAnimation();
        if (!preserveDirection) currentDirectionIndex = 0;

        try {
            const sprites = await getAppearanceSprites("Outfits", o.lookType);
            const newDirections = await getDirectionalSpritesForOutfit(
                o,
                sprites,
            );
            previewDirections = newDirections;

            if (!preserveDirection) {
                const preferredIndex = Math.min(
                    previewDirections.length - 1,
                    2,
                );
                currentDirectionIndex =
                    preferredIndex >= 0 ? preferredIndex : 0;
            } else if (previewDirections.length > 0) {
                currentDirectionIndex = Math.min(
                    currentDirectionIndex,
                    previewDirections.length - 1,
                );
            } else {
                currentDirectionIndex = 0;
            }

            if (previewDirections.length === 0) {
                spritePlaceholder = "—";
                spriteSrc = "";
            } else {
                spritePlaceholder = "";
                animationFrameIndex = 0;
                startAnimation();
            }
        } catch (error) {
            console.error("Failed to load outfit sprite:", error);
            stopAnimation();
            previewDirections = [];
            currentDirectionIndex = 0;
            spritePlaceholder = "!";
            spriteSrc = "";
        }
    }

    function startAnimation() {
        stopAnimation();
        if (previewDirections.length === 0) return;

        const directionPreview = previewDirections[currentDirectionIndex];
        if (!directionPreview || directionPreview.frames.length === 0) return;

        const playFrame = () => {
            const frame = directionPreview.frames[animationFrameIndex];
            if (frame) spriteSrc = frame;
            const duration =
                directionPreview.durations[animationFrameIndex] ?? 150;
            animationTimer = window.setTimeout(
                () => {
                    animationFrameIndex =
                        (animationFrameIndex + 1) %
                        directionPreview.frames.length;
                    playFrame();
                },
                Math.max(60, duration),
            );
        };

        playFrame();
    }

    function stopAnimation() {
        if (animationTimer !== null) {
            window.clearTimeout(animationTimer);
            animationTimer = null;
        }
    }

    function rotateSprite() {
        if (previewDirections.length <= 1) return;
        currentDirectionIndex =
            (currentDirectionIndex + 1) % previewDirections.length;
        animationFrameIndex = 0;
        startAnimation();
    }

    async function getDirectionalSpritesForOutfit(
        o: MonsterOutfit,
        sprites: Uint8Array[],
    ) {
        if (sprites.length === 0) return [];
        try {
            const metadata = await getOutfitSpriteMetadata(o.lookType);
            if (metadata) {
                const { spriteInfo, baseOffset } = metadata;
                const directionCount = Math.max(
                    1,
                    Math.min(4, spriteInfo.pattern_width ?? 4),
                );
                const addonCount = Math.max(1, spriteInfo.pattern_height ?? 1);
                const mountCount = Math.max(1, spriteInfo.pattern_depth ?? 1);
                const addonIndex = computeAddonPatternIndex(
                    o.lookAddons,
                    addonCount,
                );
                const mountIndex = computeMountPatternIndex(
                    o.lookMount,
                    mountCount,
                );
                const frameCount = computeFrameCount(spriteInfo);
                const phaseDurations = getAnimationDurations(
                    spriteInfo,
                    frameCount,
                );

                const previews = [];
                for (
                    let direction = 0;
                    direction < directionCount;
                    direction++
                ) {
                    const renderResults = await Promise.all(
                        Array.from({ length: frameCount }, (_, phaseIndex) =>
                            composeOutfitSprite({
                                sprites,
                                spriteInfo,
                                baseOffset,
                                direction,
                                addonIndex,
                                mountIndex,
                                o,
                                phaseIndex,
                            }),
                        ),
                    );

                    const frames: string[] = [];
                    const durations: number[] = [];
                    renderResults.forEach((result, index) => {
                        if (result) {
                            frames.push(result);
                            durations.push(phaseDurations[index] ?? 200);
                        }
                    });
                    if (frames.length > 0)
                        previews.push({ direction, frames, durations });
                }
                if (previews.length > 0) return previews;
            }
        } catch (e) {
            console.warn(e);
        }
        const fallback = sprites[0];
        if (!fallback) return [];
        return [
            {
                direction: 0,
                frames: [getSpriteUrl(fallback)],
                durations: [250],
            },
        ];
    }

    async function getOutfitSpriteMetadata(lookType: number) {
        if (outfitSpriteMetadataCache.has(lookType))
            return outfitSpriteMetadataCache.get(lookType)!;
        try {
            const details = await invoke<CompleteAppearanceItem>(
                "get_complete_appearance",
                { category: "Outfits", id: lookType },
            );
            if (!details || !details.frame_groups?.length) return null;
            const groupOffsets = computeGroupOffsetsFromDetails(details);
            const targetIndex = selectOutfitPreviewGroup(details);
            if (targetIndex < 0) return null;
            const spriteInfo = details.frame_groups[targetIndex]?.sprite_info;
            if (!spriteInfo) return null;
            const metadata = {
                spriteInfo,
                baseOffset: groupOffsets[targetIndex] ?? 0,
            };
            outfitSpriteMetadataCache.set(lookType, metadata);
            return metadata;
        } catch (e) {
            return null;
        }
    }

    function selectOutfitPreviewGroup(details: CompleteAppearanceItem): number {
        if (!details.frame_groups || details.frame_groups.length === 0)
            return -1;
        if (
            details.frame_groups.length > 1 &&
            hasAnimatedSprite(details.frame_groups[1]?.sprite_info)
        )
            return 1;
        for (let i = 0; i < details.frame_groups.length; i++) {
            if (hasAnimatedSprite(details.frame_groups[i]?.sprite_info))
                return i;
        }
        return 0;
    }

    function hasAnimatedSprite(
        spriteInfo: CompleteSpriteInfo | undefined,
    ): boolean {
        if (!spriteInfo) return false;
        const phaseCount = spriteInfo.animation?.phases?.length ?? 1;
        return phaseCount > 1;
    }

    function computeAddonPatternIndex(
        addons: number,
        patternHeight: number,
    ): number {
        if (patternHeight <= 1) return 0;
        if (patternHeight >= 4) {
            const hasAddon1 = (addons & 1) !== 0;
            const hasAddon2 = (addons & 2) !== 0;
            if (hasAddon1 && hasAddon2) return Math.min(patternHeight - 1, 3);
            if (hasAddon1) return 1;
            if (hasAddon2) return Math.min(patternHeight - 1, 2);
            return 0;
        }
        return Math.min(patternHeight - 1, Math.max(0, addons));
    }

    function computeMountPatternIndex(
        lookMount: number,
        patternDepth: number,
    ): number {
        if (patternDepth <= 1) return 0;
        if (lookMount <= 0) return 0;
        return 1;
    }

    function computeFrameCount(spriteInfo: CompleteSpriteInfo): number {
        const layers = spriteInfo.layers ?? spriteInfo.pattern_layers ?? 1;
        const pw = spriteInfo.pattern_width ?? 1;
        const ph = spriteInfo.pattern_height ?? 1;
        const pd = spriteInfo.pattern_depth ?? 1;
        const spritesPerFrame = Math.max(1, layers * pw * ph * pd);
        const totalSprites = spriteInfo.sprite_ids?.length ?? spritesPerFrame;
        const inferredFrames = Math.max(
            1,
            Math.floor(totalSprites / spritesPerFrame),
        );
        const metadataFrames =
            spriteInfo.animation?.phases?.length ?? inferredFrames;
        return Math.max(1, metadataFrames, inferredFrames);
    }

    function getAnimationDurations(
        spriteInfo: CompleteSpriteInfo,
        frameCountOverride?: number,
    ): number[] {
        const frames = frameCountOverride ?? computeFrameCount(spriteInfo);
        return Array.from({ length: frames }, () => 100);
    }

    async function composeOutfitSprite(params: any): Promise<string | null> {
        const {
            sprites,
            spriteInfo,
            baseOffset,
            direction,
            addonIndex,
            mountIndex,
            o,
            phaseIndex,
        } = params;
        const addonLayersToDraw = addonIndex > 0 ? [0, addonIndex] : [0];
        const frameCount = computeFrameCount(spriteInfo);
        const normalizedPhase =
            ((phaseIndex % frameCount) + frameCount) % frameCount;
        const primaryIndex =
            baseOffset +
            computeSpriteIndex(
                spriteInfo,
                0,
                direction,
                addonLayersToDraw[0],
                mountIndex,
                normalizedPhase,
            );
        if (!sprites[primaryIndex]) return null;

        initOutfitWorker();
        const layers: any[] = [];
        const totalLayers = spriteInfo.layers ?? spriteInfo.pattern_layers ?? 1;
        const hasTemplateLayer = totalLayers > 1;

        const headColor = outfitColorIdToRgb(o.lookHead);
        const bodyColor = outfitColorIdToRgb(o.lookBody);
        const legsColor = outfitColorIdToRgb(o.lookLegs);
        const feetColor = outfitColorIdToRgb(o.lookFeet);

        for (const addonLayer of addonLayersToDraw) {
            const spriteIdx =
                baseOffset +
                computeSpriteIndex(
                    spriteInfo,
                    0,
                    direction,
                    addonLayer,
                    mountIndex,
                    normalizedPhase,
                );
            const spriteData = sprites[spriteIdx];
            if (!spriteData) continue;
            const layer: any = { sprite: bufferSlice(spriteData) };
            if (hasTemplateLayer) {
                const templateIndex =
                    baseOffset +
                    computeSpriteIndex(
                        spriteInfo,
                        1,
                        direction,
                        addonLayer,
                        mountIndex,
                        normalizedPhase,
                    );
                const templateData = sprites[templateIndex];
                if (templateData) layer.template = bufferSlice(templateData);
            }
            layers.push(layer);
        }

        if (!outfitComposeWorker || layers.length === 0) return null;
        const id = `outfit-compose-${Date.now()}-${outfitComposeRequestId++}`;
        const transferables = layers.flatMap((l) =>
            [l.sprite, l.template].filter(Boolean),
        );

        return new Promise((resolve) => {
            outfitPending.set(id, resolve);
            outfitComposeWorker!.postMessage(
                {
                    id,
                    layers,
                    colors: {
                        head: headColor,
                        body: bodyColor,
                        legs: legsColor,
                        feet: feetColor,
                    },
                },
                transferables,
            );
        });
    }

    // Effect to reload when outfit properties change
    $effect(() => {
        if (outfit) {
            // Synchronously read dependencies to track them for the effect
            // before any async execution in loadOutfitSprite
            void outfit.lookType;
            void outfit.lookHead;
            void outfit.lookBody;
            void outfit.lookLegs;
            void outfit.lookFeet;
            void outfit.lookAddons;
            void outfit.lookMount;

            // Re-render outfit sprite automatically
            loadOutfitSprite(outfit, true);
        }
    });

    onDestroy(() => stopAnimation());
</script>

<div class="outfit-preview">
    <div class="outfit-sprite-container">
        {#if spriteSrc}
            <canvas
                use:pixelSprite={spriteSrc}
                class="outfit-sprite-image"
                style="width:80%;height:80%;"
            ></canvas>
        {:else}
            <div
                class="sprite-placeholder-text"
                style="display: flex; align-items: center; justify-content: center; height: 100%;"
            >
                {spritePlaceholder}
            </div>
        {/if}
        <button
            type="button"
            class="sprite-rotate-button"
            title={translate("monster.card.outfit.rotate")}
            onclick={rotateSprite}
            disabled={previewDirections.length <= 1}
        >
            ⟳
        </button>
    </div>

    {#if showInfo}
        <div class="outfit-info">
            <div class="outfit-info-item">
                <div class="outfit-info-label">
                    {translate("monster.card.outfit.type")}
                </div>
                <div class="outfit-info-value">{outfit.lookType}</div>
            </div>
            <div class="outfit-info-item">
                <div class="outfit-info-label">
                    {translate("monster.card.outfit.head")}
                </div>
                <div class="outfit-info-value">{outfit.lookHead}</div>
            </div>
            <div class="outfit-info-item">
                <div class="outfit-info-label">
                    {translate("monster.card.outfit.body")}
                </div>
                <div class="outfit-info-value">{outfit.lookBody}</div>
            </div>
            <div class="outfit-info-item">
                <div class="outfit-info-label">
                    {translate("monster.card.outfit.legs")}
                </div>
                <div class="outfit-info-value">{outfit.lookLegs}</div>
            </div>
            <div class="outfit-info-item">
                <div class="outfit-info-label">
                    {translate("monster.card.outfit.feet")}
                </div>
                <div class="outfit-info-value">{outfit.lookFeet}</div>
            </div>
            <div class="outfit-info-item">
                <div class="outfit-info-label">
                    {translate("monster.card.outfit.addons")}
                </div>
                <div class="outfit-info-value">{outfit.lookAddons}</div>
            </div>
        </div>
    {/if}
</div>

<style>
    .outfit-preview {
        display: flex;
        flex-direction: row;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
        background: var(--bg-modifier-hover);
        padding: 1rem;
        border-radius: 8px;
    }
    .outfit-sprite-container {
        width: 120px;
        height: 120px;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
    }
    .sprite-rotate-button {
        position: absolute;
        bottom: 4px;
        right: 4px;
        background: var(--bg-modifier-hover);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--text-color);
        font-size: 14px;
    }
    .sprite-rotate-button:hover {
        background: var(--interactive-accent);
        color: white;
    }
    .sprite-rotate-button:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
    .outfit-info {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
    }
    .outfit-info-item {
        display: flex;
        flex-direction: column;
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 0.5rem;
    }
    .outfit-info-label {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        font-weight: 600;
    }
    .outfit-info-value {
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-color);
    }
</style>
