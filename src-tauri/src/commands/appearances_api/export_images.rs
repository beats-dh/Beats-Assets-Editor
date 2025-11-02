use std::fs::{self, File};
use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use image::codecs::gif::{GifEncoder, Repeat};
use image::Delay;
use image::{Frame, ImageFormat};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::commands::{AppState, CompleteAppearanceItem, CompleteSpriteInfo};
use crate::core::parsers::SpriteLoader;
use crate::core::protobuf::{Appearance, Appearances};

use super::types::AppearanceCategory;

#[derive(Debug, Clone, Deserialize)]
pub struct ExportImagesOptions {
    #[serde(default)]
    pub export_gif: bool,
    #[serde(default)]
    pub gif_only: bool,
    #[serde(default)]
    pub export_mounted: bool,
    #[serde(default)]
    pub export_full_addons: bool,
    #[serde(default)]
    pub export_only_png: bool,
    #[serde(default)]
    pub export_all_png: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ExportImageTarget {
    pub category: AppearanceCategory,
    pub id: u32,
}

#[derive(Debug, Clone, Serialize)]
pub struct ExportImagesSummary {
    pub exported_files: usize,
    pub targets: usize,
}

#[derive(Debug, Clone, Copy)]
struct SpriteCounts {
    layers: u32,
    width: u32,
    height: u32,
    depth: u32,
    frames: u32,
}

#[derive(Debug, Clone, Copy)]
struct SpritePosition {
    layer: u32,
    x: u32,
    y: u32,
    z: u32,
    phase: u32,
}

#[tauri::command]
pub async fn export_appearances_images(
    targets: Vec<ExportImageTarget>,
    destination: String,
    options: ExportImagesOptions,
    state: State<'_, AppState>,
) -> Result<ExportImagesSummary, String> {
    if targets.is_empty() {
        return Err("No appearances selected for export".to_string());
    }

    let destination_path = PathBuf::from(&destination);

    let result = {
        let appearances_lock = state.appearances.lock().unwrap();
        let mut sprite_loader_lock = state.sprite_loader.lock().unwrap();

        let appearances = appearances_lock
            .as_ref()
            .ok_or_else(|| "No appearances loaded".to_string())?;

        let loader = sprite_loader_lock
            .as_mut()
            .ok_or_else(|| "No sprites loaded".to_string())?;

        export_targets(loader, appearances, &destination_path, &targets, &options)
            .map_err(|error| error.to_string())?
    };

    Ok(result)
}

fn export_targets(
    loader: &mut SpriteLoader,
    appearances: &Appearances,
    destination: &Path,
    targets: &[ExportImageTarget],
    options: &ExportImagesOptions,
) -> Result<ExportImagesSummary> {
    if !destination.exists() {
        fs::create_dir_all(destination).with_context(|| {
            format!("Failed to create destination directory: {:?}", destination)
        })?;
    }

    let mut exported_files = 0usize;

    for target in targets {
        let items = get_items_by_category(appearances, &target.category);
        let appearance = items
            .iter()
            .find(|app| app.id.unwrap_or(0) == target.id)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "Appearance {} not found in category {:?}",
                    target.id,
                    target.category
                )
            })?;

        let complete = CompleteAppearanceItem::from_protobuf(appearance);
        exported_files +=
            export_single_appearance(loader, destination, &complete, target, options)?;
    }

    Ok(ExportImagesSummary {
        exported_files,
        targets: targets.len(),
    })
}

fn export_single_appearance(
    loader: &mut SpriteLoader,
    destination: &Path,
    appearance: &CompleteAppearanceItem,
    target: &ExportImageTarget,
    options: &ExportImagesOptions,
) -> Result<usize> {
    let category_dir = destination.join(category_folder(&target.category));
    let appearance_dir = category_dir.join(format!("{}", target.id));
    fs::create_dir_all(&appearance_dir).with_context(|| {
        format!(
            "Failed to create export directory for appearance {}",
            target.id
        )
    })?;

    let mut exported = 0usize;

    for (group_index, frame_group) in appearance.frame_groups.iter().enumerate() {
        let sprite_info = match &frame_group.sprite_info {
            Some(info) if !info.sprite_ids.is_empty() => info,
            _ => continue,
        };

        let group_label = frame_group
            .id
            .unwrap_or_else(|| group_index.try_into().unwrap_or_default());
        let group_dir = appearance_dir.join(format!("group-{}", group_label));

        let counts = resolve_counts(sprite_info);
        let export_png_all = options.export_all_png && !options.gif_only;
        let export_png_first = options.export_only_png && !options.gif_only;
        let export_gif = options.export_gif || options.gif_only;

        if export_png_first {
            exported += export_first_png(
                loader,
                sprite_info,
                &group_dir,
                group_label,
                &target.category,
                options,
                &counts,
            )?;
        }

        if export_png_all {
            exported += export_all_png(
                loader,
                sprite_info,
                &group_dir,
                &target.category,
                options,
                &counts,
            )?;
        }

        if export_gif {
            exported += export_gif_variants(
                loader,
                sprite_info,
                &group_dir,
                group_label,
                &target.category,
                options,
                &counts,
            )?;
        }
    }

    Ok(exported)
}

fn export_first_png(
    loader: &mut SpriteLoader,
    sprite_info: &CompleteSpriteInfo,
    group_dir: &Path,
    group_label: u32,
    category: &AppearanceCategory,
    options: &ExportImagesOptions,
    counts: &SpriteCounts,
) -> Result<usize> {
    for (index, &sprite_id) in sprite_info.sprite_ids.iter().enumerate() {
        let position = decompose_sprite_index(counts, index);
        if !is_desired_single_png_state(category, options, counts, &position) {
            continue;
        }

        let sprite = loader
            .get_sprite(sprite_id)
            .with_context(|| format!("Failed to load sprite {}", sprite_id))?;
        let image = sprite
            .to_image()
            .context("Failed to convert sprite to image")?;

        fs::create_dir_all(group_dir)?;
        let file_path = group_dir.join(format!("group-{}-preview.png", group_label));
        image
            .save_with_format(&file_path, ImageFormat::Png)
            .with_context(|| format!("Failed to save PNG {:?}", file_path))?;
        return Ok(1);
    }

    Ok(0)
}

fn export_all_png(
    loader: &mut SpriteLoader,
    sprite_info: &CompleteSpriteInfo,
    group_dir: &Path,
    category: &AppearanceCategory,
    options: &ExportImagesOptions,
    counts: &SpriteCounts,
) -> Result<usize> {
    let (allowed_addons, allowed_mounts) = resolve_allowed_states(category, options, counts);

    fs::create_dir_all(group_dir)?;
    let mut exported = 0usize;

    for (index, &sprite_id) in sprite_info.sprite_ids.iter().enumerate() {
        let position = decompose_sprite_index(counts, index);
        if !should_include_state(
            category,
            &allowed_addons,
            &allowed_mounts,
            counts,
            &position,
        ) {
            continue;
        }

        let sprite = loader
            .get_sprite(sprite_id)
            .with_context(|| format!("Failed to load sprite {}", sprite_id))?;
        let image = sprite
            .to_image()
            .context("Failed to convert sprite to image")?;

        let file_name = format!(
            "sprite_{:04}_layer{}_dir{}_addon{}_mount{}_phase{}.png",
            index,
            position.layer + 1,
            position.x + 1,
            position.y + 1,
            position.z + 1,
            position.phase + 1
        );
        let file_path = group_dir.join(file_name);
        image
            .save_with_format(&file_path, ImageFormat::Png)
            .with_context(|| format!("Failed to save PNG {:?}", file_path))?;
        exported += 1;
    }

    Ok(exported)
}

fn export_gif_variants(
    loader: &mut SpriteLoader,
    sprite_info: &CompleteSpriteInfo,
    group_dir: &Path,
    group_label: u32,
    category: &AppearanceCategory,
    options: &ExportImagesOptions,
    counts: &SpriteCounts,
) -> Result<usize> {
    fs::create_dir_all(group_dir)?;

    let (addon_states, mount_states) = resolve_gif_states(category, options, counts);
    let mut exported = 0usize;

    for &addon in &addon_states {
        for &mount in &mount_states {
            let frames = collect_gif_frames(loader, sprite_info, counts, addon, mount)?;
            if frames.is_empty() {
                continue;
            }

            let file_name = match category {
                AppearanceCategory::Outfits => {
                    format!(
                        "group-{}-addon{}-mount{}.gif",
                        group_label,
                        addon + 1,
                        mount + 1
                    )
                }
                _ => format!("group-{}-animation.gif", group_label),
            };
            let file_path = group_dir.join(file_name);
            write_gif(frames, &file_path)?;
            exported += 1;
        }
    }

    Ok(exported)
}

fn collect_gif_frames(
    loader: &mut SpriteLoader,
    sprite_info: &CompleteSpriteInfo,
    counts: &SpriteCounts,
    addon_state: u32,
    mount_state: u32,
) -> Result<Vec<(image::DynamicImage, u32)>> {
    let mut frames = Vec::new();

    for phase in 0..counts.frames {
        let index = compute_sprite_index(counts, 0, 0, addon_state, mount_state, phase);
        if let Some(&sprite_id) = sprite_info.sprite_ids.get(index) {
            let sprite = loader
                .get_sprite(sprite_id)
                .with_context(|| format!("Failed to load sprite {}", sprite_id))?;
            let image = sprite
                .to_image()
                .context("Failed to convert sprite to image")?;
            let delay = resolve_phase_duration(sprite_info, phase as usize);
            frames.push((image, delay));
        }
    }

    Ok(frames)
}

fn write_gif(frames: Vec<(image::DynamicImage, u32)>, path: &Path) -> Result<()> {
    if frames.is_empty() {
        return Ok(());
    }

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let file =
        File::create(path).with_context(|| format!("Failed to create GIF file {:?}", path))?;
    let mut encoder = GifEncoder::new(file);
    encoder.set_repeat(Repeat::Infinite)?;

    for (image, delay_ms) in frames {
        let rgba = image.to_rgba8();
        use std::time::Duration;

        let fallback = 100u64;
        let ms = if delay_ms == 0 { fallback } else { delay_ms as u64 };
            
        let delay = Delay::from_saturating_duration(Duration::from_millis(ms));
        let frame = Frame::from_parts(rgba, 0, 0, delay);
        encoder.encode_frame(frame)?;
    }

    Ok(())
}

fn compute_sprite_index(
    counts: &SpriteCounts,
    layer: u32,
    x: u32,
    y: u32,
    z: u32,
    phase: u32,
) -> usize {
    let layers = counts.layers as usize;
    let width = counts.width as usize;
    let height = counts.height as usize;
    let depth = counts.depth as usize;
    let frames = counts.frames as usize;

    let mut idx = (phase as usize) % frames;
    idx = idx * depth + (z as usize % depth);
    idx = idx * height + (y as usize % height);
    idx = idx * width + (x as usize % width);
    idx = idx * layers + (layer as usize % layers);

    idx
}

fn decompose_sprite_index(counts: &SpriteCounts, index: usize) -> SpritePosition {
    let layers = counts.layers as usize;
    let width = counts.width as usize;
    let height = counts.height as usize;
    let depth = counts.depth as usize;
    let frames = counts.frames as usize;

    let mut value = index;
    let layer = (value % layers) as u32;
    value /= layers;
    let x = (value % width) as u32;
    value /= width;
    let y = (value % height) as u32;
    value /= height;
    let z = (value % depth) as u32;
    value /= depth;
    let phase = (value % frames) as u32;

    SpritePosition {
        layer,
        x,
        y,
        z,
        phase,
    }
}

fn resolve_counts(sprite_info: &CompleteSpriteInfo) -> SpriteCounts {
    let layers = sprite_info
        .layers
        .or(sprite_info.pattern_layers)
        .unwrap_or(1)
        .max(1);
    let width = sprite_info.pattern_width.unwrap_or(1).max(1);
    let height = sprite_info.pattern_height.unwrap_or(1).max(1);
    let depth = sprite_info.pattern_depth.unwrap_or(1).max(1);
    let frames = sprite_info
        .animation
        .as_ref()
        .map(|anim| anim.phases.len() as u32)
        .filter(|len| *len > 0)
        .unwrap_or_else(|| sprite_info.pattern_frames.unwrap_or(1).max(1));

    SpriteCounts {
        layers,
        width,
        height,
        depth,
        frames: frames.max(1),
    }
}

fn resolve_allowed_states(
    category: &AppearanceCategory,
    options: &ExportImagesOptions,
    counts: &SpriteCounts,
) -> (Vec<u32>, Vec<u32>) {
    match category {
        AppearanceCategory::Outfits => {
            let mut addons = vec![0];
            if options.export_full_addons && counts.height > 1 {
                addons.push(counts.height - 1);
            }
            addons.sort_unstable();
            addons.dedup();

            let mut mounts = vec![0];
            if options.export_mounted && counts.depth > 1 {
                mounts.push(counts.depth - 1);
            }
            mounts.sort_unstable();
            mounts.dedup();

            (addons, mounts)
        }
        _ => {
            let addons: Vec<u32> = (0..counts.height).collect();
            let mounts: Vec<u32> = (0..counts.depth).collect();
            (addons, mounts)
        }
    }
}

fn resolve_gif_states(
    category: &AppearanceCategory,
    options: &ExportImagesOptions,
    counts: &SpriteCounts,
) -> (Vec<u32>, Vec<u32>) {
    match category {
        AppearanceCategory::Outfits => resolve_allowed_states(category, options, counts),
        _ => (vec![0], vec![0]),
    }
}

fn should_include_state(
    category: &AppearanceCategory,
    addons: &[u32],
    mounts: &[u32],
    counts: &SpriteCounts,
    position: &SpritePosition,
) -> bool {
    match category {
        AppearanceCategory::Outfits => addons.contains(&position.y) && mounts.contains(&position.z),
        _ => position.y < counts.height && position.z < counts.depth,
    }
}

fn is_desired_single_png_state(
    category: &AppearanceCategory,
    options: &ExportImagesOptions,
    counts: &SpriteCounts,
    position: &SpritePosition,
) -> bool {
    match category {
        AppearanceCategory::Outfits => {
            let desired_addon = if options.export_full_addons && counts.height > 1 {
                counts.height - 1
            } else {
                0
            };
            let desired_mount = if options.export_mounted && counts.depth > 1 {
                counts.depth - 1
            } else {
                0
            };

            position.y == desired_addon
                && position.z == desired_mount
                && position.layer == 0
                && position.x == 0
        }
        _ => position.layer == 0 && position.x == 0 && position.y == 0 && position.z == 0,
    }
}

fn resolve_phase_duration(sprite_info: &CompleteSpriteInfo, phase_index: usize) -> u32 {
    const MIN_DURATION: u32 = 30;
    const DEFAULT_DURATION: u32 = 250;

    if let Some(animation) = &sprite_info.animation {
        if let Some(phase) = animation.phases.get(phase_index) {
            if let Some(duration) = phase.duration_min {
                return duration.max(MIN_DURATION);
            }
        }
    }

    DEFAULT_DURATION
}

fn category_folder(category: &AppearanceCategory) -> &'static str {
    match category {
        AppearanceCategory::Objects => "objects",
        AppearanceCategory::Outfits => "outfits",
        AppearanceCategory::Effects => "effects",
        AppearanceCategory::Missiles => "missiles",
    }
}

fn get_items_by_category<'a>(
    appearances: &'a Appearances,
    category: &AppearanceCategory,
) -> &'a Vec<Appearance> {
    match category {
        AppearanceCategory::Objects => &appearances.object,
        AppearanceCategory::Outfits => &appearances.outfit,
        AppearanceCategory::Effects => &appearances.effect,
        AppearanceCategory::Missiles => &appearances.missile,
    }
}
