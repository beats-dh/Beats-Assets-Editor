use super::category_types::AppearanceCategory;
use super::helpers::get_items_by_category;
use crate::core::protobuf::{Appearance, Appearances, FrameGroup, SpriteInfo};
use crate::features::sprites::parsers::SpriteLoader;
use crate::state::AppState;
use anyhow::{anyhow, Context, Result};
use apng::{create_config as create_apng_config, BlendOp, DisposeOp, Encoder, Frame as ApngFrame, PNGImage};
use image::{
    codecs::gif::{GifEncoder, Repeat},
    Delay, Frame as ImageFrame, Rgba, RgbaImage,
};
use log::{info, warn};
use serde::{Deserialize, Serialize};
use std::cmp;
use std::fs;
use std::io::BufWriter;
use std::path::{Path, PathBuf};
use tauri::State;
use png::{BitDepth as PngBitDepth, ColorType as PngColorType};

const DEFAULT_FRAME_DELAY_MS: u32 = 250;

#[derive(Debug, Clone, Deserialize)]
pub struct ImageExportRange {
    pub category: AppearanceCategory,
    pub start_id: u32,
    pub end_id: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct OutfitColorSelection {
    pub head: Option<String>,
    pub body: Option<String>,
    pub legs: Option<String>,
    pub feet: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ImageExportOptions {
    #[serde(default)]
    pub custom_delay_ms: Option<u32>,
    #[serde(default)]
    pub include_mount: Option<bool>,
    #[serde(default)]
    pub mount_id: Option<u32>,
    #[serde(default)]
    pub outfit_colors: Option<OutfitColorSelection>,
    #[serde(default)]
    pub formats: Option<Vec<String>>,
    #[serde(default)]
    pub addon_mode: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ImageExportFailure {
    pub category: AppearanceCategory,
    pub id: u32,
    pub reason: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_path: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ImageExportResult {
    pub exported_files: usize,
    pub failed: Vec<ImageExportFailure>,
}

#[derive(Clone, Copy)]
struct RgbColor {
    r: u8,
    g: u8,
    b: u8,
}

#[derive(Clone)]
struct OutfitColors {
    head: Option<RgbColor>,
    body: Option<RgbColor>,
    legs: Option<RgbColor>,
    feet: Option<RgbColor>,
}

impl OutfitColors {
    fn is_active(&self) -> bool {
        self.head.is_some() || self.body.is_some() || self.legs.is_some() || self.feet.is_some()
    }
}

#[derive(Clone)]
struct ResolvedOptions {
    custom_delay_ms: Option<u32>,
    addon_mode: AddonMode,
    include_mount: bool,
    mount_appearance_id: Option<u32>,
    formats: Vec<ImageExportFormat>,
    outfit_colors: Option<OutfitColors>,
}

#[derive(Debug, Clone, Copy)]
enum ImageExportFormat {
    Apng,
    Gif,
}

impl ImageExportFormat {
    fn from_value(value: &str) -> Option<Self> {
        match value.to_lowercase().as_str() {
            "gif" => Some(ImageExportFormat::Gif),
            "apng" => Some(ImageExportFormat::Apng),
            _ => None,
        }
    }

    fn extension(&self) -> &'static str {
        match self {
            ImageExportFormat::Apng => "apng",
            ImageExportFormat::Gif => "gif",
        }
    }
}

#[derive(Debug, Clone, Copy)]
enum AddonMode {
    None,
    Addon1,
    Addon2,
    Full,
}

impl AddonMode {
    fn from_option(value: Option<String>) -> Self {
        match value.as_deref().map(|s| s.to_lowercase()) {
            Some(ref v) if v == "addon1" => AddonMode::Addon1,
            Some(ref v) if v == "addon2" => AddonMode::Addon2,
            Some(ref v) if v == "none" => AddonMode::None,
            _ => AddonMode::Full,
        }
    }
}

#[tauri::command]
pub async fn export_appearances_to_images(ranges: Vec<ImageExportRange>, destination: String, options: Option<ImageExportOptions>, state: State<'_, AppState>) -> Result<ImageExportResult, String> {
    let result = (|| -> Result<ImageExportResult> {
        if ranges.is_empty() {
            return Err(anyhow!("No categories selected for export"));
        }

        let dest_path = PathBuf::from(destination.trim());
        if dest_path.as_os_str().is_empty() {
            return Err(anyhow!("Destination path is empty"));
        }
        if !dest_path.exists() {
            fs::create_dir_all(&dest_path).context("Failed to create destination directory")?;
        }

        let options = resolve_options(options);

        let appearances_lock = state.appearances.read();
        let appearances = appearances_lock.as_ref().ok_or_else(|| anyhow!("No appearances loaded"))?;

        let sprite_loader_lock = state.sprite_loader.read();
        let sprite_loader = sprite_loader_lock.as_ref().ok_or_else(|| anyhow!("Load sprites (catalog-content.json) before exporting images"))?;

        let mut exported_files = 0usize;
        let mut failures: Vec<ImageExportFailure> = Vec::new();

        for range in ranges {
            if range.start_id > range.end_id {
                failures.push(ImageExportFailure {
                    category: range.category,
                    id: range.start_id,
                    reason: format!("Invalid range for {:?}: start ID {} greater than end ID {}", range.category, range.start_id, range.end_id),
                    file_path: None,
                });
                continue;
            }

            let items = get_items_by_category(appearances, &range.category);
            for appearance in items.iter().filter(|app| {
                let id = app.id.unwrap_or(0);
                id >= range.start_id && id <= range.end_id
            }) {
                let appearance_id = appearance.id.unwrap_or(0);
                match export_single_appearance(appearance, range.category, appearances, &dest_path, sprite_loader, &options) {
                    Ok(count) => {
                        exported_files += count;
                    }
                    Err(err) => {
                        failures.push(ImageExportFailure {
                            category: range.category,
                            id: appearance_id,
                            reason: err.to_string(),
                            file_path: None,
                        });
                    }
                }
            }
        }

        Ok(ImageExportResult {
            exported_files,
            failed: failures,
        })
    })();

    result.map_err(|err| err.to_string())
}

fn resolve_options(options: Option<ImageExportOptions>) -> ResolvedOptions {
    let raw = options.unwrap_or_else(|| ImageExportOptions {
        custom_delay_ms: None,
        include_mount: Some(false),
        mount_id: None,
        outfit_colors: None,
        formats: None,
        addon_mode: None,
    });

    let formats = raw.formats.unwrap_or_else(|| vec!["apng".to_string()]).into_iter().filter_map(|value| ImageExportFormat::from_value(&value)).collect::<Vec<_>>();

    let formats = if formats.is_empty() {
        vec![ImageExportFormat::Apng]
    } else {
        formats
    };

    ResolvedOptions {
        custom_delay_ms: raw.custom_delay_ms,
        addon_mode: AddonMode::from_option(raw.addon_mode),
        include_mount: raw.include_mount.unwrap_or(false),
        mount_appearance_id: raw.mount_id,
        formats,
        outfit_colors: raw.outfit_colors.map(|colors| OutfitColors {
            head: colors.head.as_deref().and_then(parse_hex_color),
            body: colors.body.as_deref().and_then(parse_hex_color),
            legs: colors.legs.as_deref().and_then(parse_hex_color),
            feet: colors.feet.as_deref().and_then(parse_hex_color),
        }),
    }
}

fn export_single_appearance(
    appearance: &Appearance,
    category: AppearanceCategory,
    appearances: &Appearances,
    destination: &Path,
    sprite_loader: &SpriteLoader,
    options: &ResolvedOptions,
) -> Result<usize> {
    let mut exported_files = 0usize;
    let appearance_id = appearance.id.unwrap_or(0);

    let mount_appearance = if options.include_mount && category == AppearanceCategory::Outfits {
        let mount_id = options.mount_appearance_id.ok_or_else(|| anyhow!("Mount ID required when exporting with mount"))?;
        Some(find_mount_appearance(mount_id, appearances)?)
    } else {
        None
    };

    for (index, frame_group) in appearance.frame_group.iter().enumerate() {
        let sprite_info = match frame_group.sprite_info.as_ref() {
            Some(info) => info,
            None => continue,
        };

        if sprite_info.sprite_id.is_empty() {
            continue;
        }

        let bucket = resolve_bucket(frame_group, sprite_info);
        let output_dir = ensure_group_directory(destination, bucket, category).with_context(|| format!("Failed to prepare folder for {:?}", bucket))?;

        let mount_context = mount_appearance.and_then(|mount| resolve_mount_context_for_group(mount, frame_group));

        let frames = build_frame_images(sprite_loader, sprite_info, category, options, mount_context.as_ref())
            .with_context(|| format!("Failed to prepare frames for {:?} #{} (frame group {})", category, appearance_id, index + 1))?;

        if frames.frames.is_empty() {
            warn!("No frames generated for {:?} #{} (frame group {})", category, appearance_id, index + 1);
            continue;
        }

        for format in &options.formats {
            let file_name = build_output_name(category, appearance_id, bucket, index + 1 /* one-based */, *format);
            let file_path = output_dir.join(file_name);

            match format {
                ImageExportFormat::Apng => {
                    write_apng(&file_path, &frames.frames, &frames.configs).with_context(|| format!("Failed to write APNG for {:?} #{} at {:?}", category, appearance_id, file_path))?;
                }
                ImageExportFormat::Gif => {
                    write_gif(&file_path, &frames.frames, &frames.delays).with_context(|| format!("Failed to write GIF for {:?} #{} at {:?}", category, appearance_id, file_path))?;
                }
            }
        }

        info!("Exported {:?} #{} frame group {} to {} format(s)", category, appearance_id, index + 1, options.formats.len());
        exported_files += 1;
    }

    Ok(exported_files)
}

struct FrameCollection {
    frames: Vec<RgbaImage>,
    configs: Vec<ApngFrame>,
    delays: Vec<u16>,
}

struct MountContext {
    sprite_info: SpriteInfo,
    frame_count: u32,
    direction_max: u32,
}

fn build_frame_images(
    sprite_loader: &SpriteLoader,
    sprite_info: &SpriteInfo,
    category: AppearanceCategory,
    options: &ResolvedOptions,
    mount_context: Option<&MountContext>,
) -> Result<FrameCollection> {
    let direction_index = resolve_direction(sprite_info, category);
    let addon_max = sprite_info.pattern_height.unwrap_or(1).max(1) - 1;
    let mount_max = sprite_info.pattern_depth.unwrap_or(1).max(1) - 1;

    let addon_variants = resolve_addon_variants(options.addon_mode, addon_max);
    let mount_index = if options.include_mount && mount_max > 0 {
        mount_max
    } else {
        0
    };
    let tint_colors = if category == AppearanceCategory::Outfits {
        options.outfit_colors.as_ref()
    } else {
        None
    };
    let mount_context = if category == AppearanceCategory::Outfits {
        mount_context
    } else {
        None
    };

    let frame_count = resolve_frame_count(sprite_info);
    if frame_count == 0 {
        return Err(anyhow!("Frame group has zero frames"));
    }

    let mut rgba_frames: Vec<RgbaImage> = Vec::with_capacity(frame_count as usize);
    let mut configs: Vec<ApngFrame> = Vec::with_capacity(frame_count as usize);

    let delays = build_frame_delays(sprite_info, options.custom_delay_ms, frame_count);

    for frame_index in 0..frame_count {
        let mut composed: Option<RgbaImage> = None;

        if let Some(ctx) = mount_context {
            let mount_frames = ctx.frame_count.max(1);
            let mount_frame_index = if mount_frames > 0 {
                frame_index % mount_frames
            } else {
                0
            };
            let mount_direction = cmp::min(direction_index, ctx.direction_max);
            let mount_image = render_variant(sprite_loader, &ctx.sprite_info, mount_direction, 0, 0, mount_frame_index, None)?;
            composed = Some(mount_image);
        }

        for addon in &addon_variants {
            let rendered = render_variant(sprite_loader, sprite_info, direction_index, *addon, mount_index, frame_index, tint_colors)?;

            composed = Some(if let Some(mut canvas) = composed {
                overlay_rgba(&mut canvas, &rendered);
                canvas
            } else {
                rendered
            });
        }

        if let Some(canvas) = composed {
            let delay_ms = delays.get(frame_index as usize).copied().unwrap_or(DEFAULT_FRAME_DELAY_MS as u16);

            let frame_config = ApngFrame {
                delay_num: Some(delay_ms),
                delay_den: Some(1000),
                dispose_op: Some(DisposeOp::ApngDisposeOpPrevious),
                blend_op: Some(BlendOp::ApngBlendOpOver),
                ..Default::default()
            };

            rgba_frames.push(canvas);
            configs.push(frame_config);
        }
    }

    Ok(FrameCollection {
        frames: rgba_frames,
        configs,
        delays,
    })
}

fn write_apng(path: &Path, frames: &[RgbaImage], configs: &[ApngFrame]) -> Result<()> {
    if frames.is_empty() || configs.is_empty() || frames.len() != configs.len() {
        return Err(anyhow!("Frame data incomplete, nothing to write"));
    }

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).context("Failed to create bucket directory")?;
        }
    }

    let png_frames: Vec<PNGImage> = frames
        .iter()
        .map(|image| PNGImage {
            width: image.width(),
            height: image.height(),
            data: image.clone().into_raw(),
            color_type: PngColorType::Rgba,
            bit_depth: PngBitDepth::Eight,
        })
        .collect();

    let config = create_apng_config(&png_frames, None).map_err(|err| anyhow!("Failed to initialize APNG encoder: {}", err))?;

    let file = fs::File::create(path).context("Failed to create APNG file")?;
    let mut writer = BufWriter::new(file);
    let mut encoder = Encoder::new(&mut writer, config)?;

    for (image, frame_cfg) in png_frames.iter().zip(configs.iter()) {
        encoder.write_frame(image, frame_cfg.clone())?;
    }

    encoder.finish_encode()?;
    Ok(())
}

fn write_gif(path: &Path, frames: &[RgbaImage], delays: &[u16]) -> Result<()> {
    if frames.is_empty() {
        return Err(anyhow!("No frames to write GIF"));
    }

    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).context("Failed to create destination directory")?;
        }
    }

    let file = fs::File::create(path).context("Failed to create GIF file")?;
    let mut writer = BufWriter::new(file);
    let mut encoder = GifEncoder::new(&mut writer);
    encoder.set_repeat(Repeat::Infinite)?;

    for (index, image) in frames.iter().enumerate() {
        let delay_ms = delays.get(index).copied().unwrap_or(DEFAULT_FRAME_DELAY_MS as u16);
        let delay = Delay::from_numer_denom_ms(delay_ms as u32, 1);
        let gif_frame = ImageFrame::from_parts(image.clone(), 0, 0, delay);
        encoder.encode_frame(gif_frame)?;
    }

    Ok(())
}

fn render_variant(sprite_loader: &SpriteLoader, sprite_info: &SpriteInfo, direction: u32, addon: u32, mount: u32, frame_index: u32, tint_colors: Option<&OutfitColors>) -> Result<RgbaImage> {
    let layers = sprite_info.layers.or(sprite_info.pattern_layers).unwrap_or(1).max(1);

    let base_index = compute_sprite_index(sprite_info, 0, direction, addon, mount, frame_index)?;
    let sprite_id = sprite_info.sprite_id.get(base_index).copied().ok_or_else(|| anyhow!("Sprite index {} is out of bounds", base_index))?;

    let base_sprite = sprite_loader.get_sprite(sprite_id).map_err(|err| anyhow!("Failed to fetch sprite {}: {}", sprite_id, err))?;
    let mut base_image = base_sprite.to_image().map_err(|err| anyhow!("Failed to convert sprite {} to image: {}", sprite_id, err))?.to_rgba8();

    let should_tint = tint_colors.map(|c| c.is_active()).unwrap_or(false);

    if should_tint && layers > 1 {
        let template_index = compute_sprite_index(sprite_info, 1, direction, addon, mount, frame_index)?;
        let template_sprite = sprite_info.sprite_id.get(template_index).copied().ok_or_else(|| anyhow!("Template sprite index {} out of bounds", template_index))?;
        let template = sprite_loader
            .get_sprite(template_sprite)
            .map_err(|err| anyhow!("Failed to fetch template sprite {}: {}", template_sprite, err))?
            .to_image()
            .map_err(|err| anyhow!("Failed to convert template sprite {}: {}", template_sprite, err))?
            .to_rgba8();

        if let Some(colors) = tint_colors {
            apply_outfit_colors(&mut base_image, &template, colors);
        }
    }

    Ok(base_image)
}

fn compute_sprite_index(sprite_info: &SpriteInfo, layer: u32, direction: u32, addon: u32, mount: u32, frame: u32) -> Result<usize> {
    let layers = sprite_info.layers.or(sprite_info.pattern_layers).unwrap_or(1).max(1);
    let pw = sprite_info.pattern_width.unwrap_or(1).max(1);
    let ph = sprite_info.pattern_height.unwrap_or(1).max(1);
    let pd = sprite_info.pattern_depth.unwrap_or(1).max(1);
    let frames = resolve_frame_count(sprite_info).max(1);

    if layer >= layers {
        return Err(anyhow!("Invalid layer index {}", layer));
    }
    if direction >= pw {
        return Err(anyhow!("Invalid direction index {}", direction));
    }
    if addon >= ph {
        return Err(anyhow!("Invalid addon index {}", addon));
    }
    if mount >= pd {
        return Err(anyhow!("Invalid mount index {}", mount));
    }

    let mut idx = (frame % frames) as usize;
    idx = idx * pd as usize + mount as usize;
    idx = idx * ph as usize + addon as usize;
    idx = idx * pw as usize + direction as usize;
    idx = idx * layers as usize + layer as usize;
    Ok(idx)
}

fn resolve_bucket(frame_group: &FrameGroup, sprite_info: &SpriteInfo) -> FrameBucket {
    match frame_group.fixed_frame_group {
        Some(value) if value == 1 => FrameBucket::Animated,
        Some(value) if value == 0 || value == 2 => FrameBucket::Idle,
        _ => {
            if resolve_frame_count(sprite_info) > 1 {
                FrameBucket::Animated
            } else {
                FrameBucket::Idle
            }
        }
    }
}

fn ensure_group_directory(destination: &Path, bucket: FrameBucket, category: AppearanceCategory) -> Result<PathBuf> {
    let category_dir = format!("{:?}", category);
    let path = destination.join(bucket.folder_name()).join(category_dir);
    if !path.exists() {
        fs::create_dir_all(&path)?;
    }
    Ok(path)
}

fn build_output_name(category: AppearanceCategory, id: u32, bucket: FrameBucket, group_index: usize, format: ImageExportFormat) -> String {
    let normalized_category = format!("{:?}", category).to_lowercase();
    format!("{}_{:04}_{}_fg{}.{}", normalized_category, id, bucket.file_suffix(), group_index, format.extension())
}

fn resolve_direction(sprite_info: &SpriteInfo, category: AppearanceCategory) -> u32 {
    let direction_count = sprite_info.pattern_width.unwrap_or(1).max(1);
    if category == AppearanceCategory::Outfits {
        if direction_count >= 3 {
            cmp::min(2, direction_count - 1)
        } else if direction_count == 2 {
            1
        } else {
            0
        }
    } else {
        0
    }
}

fn resolve_frame_count(sprite_info: &SpriteInfo) -> u32 {
    if let Some(animation) = sprite_info.animation.as_ref() {
        let phases = animation.sprite_phase.len() as u32;
        if phases > 0 {
            return phases;
        }
    }
    sprite_info.pattern_frames.unwrap_or(1).max(1)
}

fn build_frame_delays(sprite_info: &SpriteInfo, custom_delay_ms: Option<u32>, frame_count: u32) -> Vec<u16> {
    let mut delays = Vec::with_capacity(frame_count as usize);
    if let Some(delay) = custom_delay_ms {
        let clamped = delay.min(u16::MAX as u32) as u16;
        delays.resize(frame_count as usize, clamped);
        return delays;
    }

    if let Some(animation) = sprite_info.animation.as_ref() {
        for phase in animation.sprite_phase.iter() {
            let ms = phase.duration_min.or(phase.duration_max).unwrap_or(DEFAULT_FRAME_DELAY_MS);
            delays.push(ms.min(u16::MAX as u32) as u16);
        }
    }

    if delays.len() < frame_count as usize {
        delays.resize(frame_count as usize, DEFAULT_FRAME_DELAY_MS as u16);
    }

    delays
}

fn resolve_addon_variants(mode: AddonMode, addon_max: u32) -> Vec<u32> {
    match mode {
        AddonMode::None => vec![0],
        AddonMode::Addon1 => {
            if addon_max >= 1 {
                vec![1]
            } else {
                vec![0]
            }
        }
        AddonMode::Addon2 => {
            if addon_max >= 2 {
                vec![2]
            } else {
                vec![0]
            }
        }
        AddonMode::Full => {
            if addon_max > 0 {
                (0..=addon_max).collect()
            } else {
                vec![0]
            }
        }
    }
}

fn apply_outfit_colors(base: &mut RgbaImage, template: &RgbaImage, colors: &OutfitColors) {
    let width = cmp::min(base.width(), template.width());
    let height = cmp::min(base.height(), template.height());

    for y in 0..height {
        for x in 0..width {
            let base_pixel = base.get_pixel(x, y);
            let template_pixel = template.get_pixel(x, y);
            let [tr, tg, tb, ta] = template_pixel.0;
            if ta == 0 {
                continue;
            }

            let target_color = if tr > 0 && tg > 0 && tb == 0 {
                colors.head
            } else if tr > 0 && tg == 0 && tb == 0 {
                colors.body
            } else if tr == 0 && tg > 0 && tb == 0 {
                colors.legs
            } else if tr == 0 && tg == 0 && tb > 0 {
                colors.feet
            } else {
                None
            };

            if let Some(color) = target_color {
                let mut new_pixel = base_pixel.0;
                new_pixel[0] = ((new_pixel[0] as u16 + color.r as u16) / 2) as u8;
                new_pixel[1] = ((new_pixel[1] as u16 + color.g as u16) / 2) as u8;
                new_pixel[2] = ((new_pixel[2] as u16 + color.b as u16) / 2) as u8;
                base.put_pixel(x, y, Rgba(new_pixel));
            }
        }
    }
}

fn overlay_rgba(base: &mut RgbaImage, layer: &RgbaImage) {
    let width = cmp::min(base.width(), layer.width());
    let height = cmp::min(base.height(), layer.height());

    for y in 0..height {
        for x in 0..width {
            let dest = base.get_pixel_mut(x, y);
            let src = layer.get_pixel(x, y);
            let sa = src.0[3] as f32 / 255.0;
            if sa <= 0.0 {
                continue;
            }
            let da = dest.0[3] as f32 / 255.0;
            let out_a = sa + da * (1.0 - sa);

            for channel in 0..3 {
                let sc = src.0[channel] as f32 / 255.0;
                let dc = dest.0[channel] as f32 / 255.0;
                let out = if out_a == 0.0 {
                    0.0
                } else {
                    (sc * sa + dc * da * (1.0 - sa)) / out_a
                };
                dest.0[channel] = (out * 255.0).round().clamp(0.0, 255.0) as u8;
            }

            dest.0[3] = (out_a * 255.0).round().clamp(0.0, 255.0) as u8;
        }
    }
}

fn parse_hex_color(value: &str) -> Option<RgbColor> {
    let trimmed = value.trim().trim_start_matches('#');
    if trimmed.len() != 6 {
        return None;
    }
    let r = u8::from_str_radix(&trimmed[0..2], 16).ok()?;
    let g = u8::from_str_radix(&trimmed[2..4], 16).ok()?;
    let b = u8::from_str_radix(&trimmed[4..6], 16).ok()?;
    Some(RgbColor {
        r,
        g,
        b,
    })
}

#[derive(Clone, Copy, Debug)]
enum FrameBucket {
    Idle,
    Animated,
}

impl FrameBucket {
    fn folder_name(&self) -> &'static str {
        match self {
            FrameBucket::Idle => "Idle",
            FrameBucket::Animated => "Animated",
        }
    }

    fn file_suffix(&self) -> &'static str {
        match self {
            FrameBucket::Idle => "idle",
            FrameBucket::Animated => "animated",
        }
    }
}
fn find_mount_appearance<'a>(mount_id: u32, appearances: &'a Appearances) -> Result<&'a Appearance> {
    appearances.outfit.iter().find(|app| app.id.unwrap_or(0) == mount_id).ok_or_else(|| anyhow!("Mount appearance #{} not found in Outfits", mount_id))
}

fn resolve_mount_context_for_group(mount: &Appearance, target_group: &FrameGroup) -> Option<MountContext> {
    let group = select_mount_frame_group(mount, target_group)?;
    let sprite_info = group.sprite_info.as_ref()?.clone();
    let frame_count = resolve_frame_count(&sprite_info).max(1);
    let direction_max = sprite_info.pattern_width.unwrap_or(1).max(1) - 1;
    Some(MountContext {
        sprite_info,
        frame_count,
        direction_max,
    })
}

fn select_mount_frame_group<'a>(mount: &'a Appearance, target_group: &FrameGroup) -> Option<&'a FrameGroup> {
    if let Some(target_fixed) = target_group.fixed_frame_group {
        if let Some(matched) = mount.frame_group.iter().find(|fg| fg.fixed_frame_group == Some(target_fixed) && fg.sprite_info.is_some()) {
            return Some(matched);
        }
    }

    if let Some(target_id) = target_group.id {
        if let Some(matched) = mount.frame_group.iter().find(|fg| fg.id == Some(target_id) && fg.sprite_info.is_some()) {
            return Some(matched);
        }
    }

    mount.frame_group.iter().find(|fg| fg.sprite_info.is_some())
}
