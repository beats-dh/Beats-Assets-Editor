// OTClient minimap format (`.otmm`).
//
// Layout (little-endian):
//   "OTMM" (u32 signature)
//   u16 data_start  (absolute offset where the block list begins; = 22)
//   u16 version
//   u32 flags
//   u16 desc_len + desc bytes
//   blocks from `data_start`:
//     [u16 x][u16 y][u8 z][u16 clen][zlib(clen) -> 64*64 MinimapTile]
//
// A MinimapTile is 3 bytes: [flags][color][speed]. `color` is an 8-bit palette
// index (6x6x6 colour cube); 255 means "unseen". 64x64 tiles per block, one map
// tile per pixel.

use anyhow::{bail, Context, Result};
use flate2::read::ZlibDecoder;
use std::io::Read;

const BLOCK: usize = 64;
const TILE_BYTES: usize = 3;
const COLOR_BYTE: usize = 1;

/// A block's position and where its compressed tile data lives in the file.
pub struct OtmmBlock {
    pub x: u16,
    pub y: u16,
    pub z: u8,
    pub data_offset: usize,
    pub clen: usize,
}

/// Parse the block directory without decompressing (cheap; for floor listing).
pub fn parse_index(data: &[u8]) -> Result<Vec<OtmmBlock>> {
    if data.len() < 6 || &data[0..4] != b"OTMM" {
        bail!("Not an OTMM file (bad signature)");
    }
    let data_start = u16::from_le_bytes([data[4], data[5]]) as usize;
    let mut p = data_start.max(6);
    let mut blocks = Vec::new();
    while p + 7 <= data.len() {
        let x = u16::from_le_bytes([data[p], data[p + 1]]);
        let y = u16::from_le_bytes([data[p + 2], data[p + 3]]);
        let z = data[p + 4];
        let clen = u16::from_le_bytes([data[p + 5], data[p + 6]]) as usize;
        let off = p + 7;
        if off + clen > data.len() {
            break;
        }
        blocks.push(OtmmBlock {
            x,
            y,
            z,
            data_offset: off,
            clen,
        });
        p = off + clen;
    }
    if blocks.is_empty() {
        bail!("OTMM file has no blocks");
    }
    Ok(blocks)
}

/// OTClient `Color::from8bit`: a 6x6x6 colour cube; 0 and >=216 are black.
pub fn color_from_8bit(c: u8) -> [u8; 3] {
    if c == 0 || c >= 216 {
        return [0, 0, 0];
    }
    let c = c as u32;
    [((c / 36) % 6 * 51) as u8, ((c / 6) % 6 * 51) as u8, (c % 6 * 51) as u8]
}

fn zlib_decompress(data: &[u8]) -> Result<Vec<u8>> {
    let mut dec = ZlibDecoder::new(data);
    let mut out = Vec::new();
    dec.read_to_end(&mut out).context("OTMM block zlib decompress")?;
    Ok(out)
}

/// Far-apart explored regions (gap > this many tiles) are treated as outliers
/// and excluded from the render bounds — otherwise a couple of stray blocks
/// (e.g. a brief teleport) blow up the bbox and shrink the real map to dots.
const CLUSTER_GAP: u32 = 4096;

/// Main contiguous range of `values`: expand from the median while consecutive
/// (deduped, sorted) values are within `gap`. Drops far-flung outliers.
fn cluster_range(values: &mut Vec<u32>, gap: u32) -> Option<(u32, u32)> {
    values.sort_unstable();
    values.dedup();
    if values.is_empty() {
        return None;
    }
    let mid = values.len() / 2;
    let mut lo = mid;
    while lo > 0 && values[lo] - values[lo - 1] <= gap {
        lo -= 1;
    }
    let mut hi = mid;
    while hi + 1 < values.len() && values[hi + 1] - values[hi] <= gap {
        hi += 1;
    }
    Some((values[lo], values[hi]))
}

/// Bounding box (in map tiles) of a floor's MAIN explored cluster:
/// (min_x, min_y, w, h). Outlier regions far from the main cluster are excluded.
pub fn floor_bounds(blocks: &[OtmmBlock], floor: u8) -> Option<(u32, u32, u32, u32)> {
    let mut xs: Vec<u32> = blocks.iter().filter(|b| b.z == floor).map(|b| b.x as u32).collect();
    let mut ys: Vec<u32> = blocks.iter().filter(|b| b.z == floor).map(|b| b.y as u32).collect();
    if xs.is_empty() {
        return None;
    }
    let (x0, x1) = cluster_range(&mut xs, CLUSTER_GAP)?;
    let (y0, y1) = cluster_range(&mut ys, CLUSTER_GAP)?;
    Some((x0, y0, x1 + BLOCK as u32 - x0, y1 + BLOCK as u32 - y0))
}

/// A rendered floor: PNG bytes + placement metadata.
pub struct OtmmFloorRender {
    pub png: Vec<u8>,
    pub width: u32,
    pub height: u32,
    pub min_x: u32,
    pub min_y: u32,
    pub scale: f32,
}

/// Render one floor of the minimap into a PNG, downscaling so neither dimension
/// exceeds `max_dim` (the explored area can span the whole world).
pub fn render_floor(data: &[u8], blocks: &[OtmmBlock], floor: u8, max_dim: u32) -> Result<OtmmFloorRender> {
    let (min_x, min_y, w, h) = floor_bounds(blocks, floor).ok_or_else(|| anyhow::anyhow!("No blocks on floor {}", floor))?;

    let scale = (max_dim as f32 / w as f32).min(max_dim as f32 / h as f32).min(1.0);
    let out_w = ((w as f32 * scale).round() as u32).max(1);
    let out_h = ((h as f32 * scale).round() as u32).max(1);

    let mut img = image::RgbaImage::new(out_w, out_h);
    for b in blocks.iter().filter(|b| b.z == floor) {
        // Skip outlier blocks outside the main cluster bbox (keeps subtraction
        // below non-negative and avoids drawing stray dots far from the map).
        let (bx, by) = (b.x as u32, b.y as u32);
        if bx < min_x || by < min_y || bx >= min_x + w || by >= min_y + h {
            continue;
        }
        let raw = match zlib_decompress(&data[b.data_offset..b.data_offset + b.clen]) {
            Ok(r) => r,
            Err(_) => continue,
        };
        if raw.len() < BLOCK * BLOCK * TILE_BYTES {
            continue;
        }
        for ty in 0..BLOCK {
            for tx in 0..BLOCK {
                let color = raw[(ty * BLOCK + tx) * TILE_BYTES + COLOR_BYTE];
                if color >= 216 {
                    continue; // unseen / transparent
                }
                let px = (b.x as u32 - min_x + tx as u32) as f32 * scale;
                let py = (b.y as u32 - min_y + ty as u32) as f32 * scale;
                let (dx, dy) = (px as u32, py as u32);
                if dx < out_w && dy < out_h {
                    let [r, g, bl] = color_from_8bit(color);
                    img.put_pixel(dx, dy, image::Rgba([r, g, bl, 255]));
                }
            }
        }
    }

    let mut png = Vec::new();
    image::DynamicImage::ImageRgba8(img).write_to(&mut std::io::Cursor::new(&mut png), image::ImageFormat::Png).context("Encode OTMM floor PNG")?;

    Ok(OtmmFloorRender {
        png,
        width: out_w,
        height: out_h,
        min_x,
        min_y,
        scale,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn real_otmm_when_env_set() {
        let Ok(path) = std::env::var("CANARY_OTMM") else {
            return;
        };
        let data = std::fs::read(&path).expect("read otmm");
        let index = parse_index(&data).expect("parse index");
        let floors: std::collections::BTreeSet<u8> = index.iter().map(|b| b.z).collect();
        println!("otmm blocks={} floors={:?}", index.len(), floors);
        assert!(!floors.is_empty());
        // Render a floor and confirm we produced a valid, non-trivial PNG.
        let floor = *floors.iter().next().unwrap();
        let r = render_floor(&data, &index, floor, 2048).expect("render");
        println!("floor {} -> {}x{} scale {} png {} bytes", floor, r.width, r.height, r.scale, r.png.len());
        assert!(r.png.len() > 8 && &r.png[1..4] == b"PNG");
    }
}
