// Spell-icon spritesheet editing (add / replace / remove / move), operating on
// the RCC's `spell-icons-32x32.png` and `spell-icons-20x20.png` resources.
//
// Ported from the reference Python tool (grm/core.py add_or_replace_icon /
// remove_icon / move_icon_index). Each sheet is a single horizontal strip of
// NxN cells; "index i" is the i-th cell across all sheets in lockstep, so an
// edit is applied to every sheet at the same logical index (just at its own
// cell size). After editing the bytes in memory, the caller recompiles+installs
// the .rcc so the client picks the new icons up.

use image::{imageops, GenericImageView, ImageFormat, Rgba, RgbaImage};
use std::io::Cursor;

/// The spell-icon sheets and their square cell size, in lockstep order.
pub const SPELL_SHEETS: [(&str, u32); 2] = [("images/spells/spell-icons-32x32.png", 32), ("images/spells/spell-icons-20x20.png", 20)];

/// Decode PNG bytes into an RGBA image.
fn decode_png(bytes: &[u8]) -> Result<RgbaImage, String> {
    let img = image::load_from_memory_with_format(bytes, ImageFormat::Png).map_err(|e| format!("Failed to decode PNG: {}", e))?;
    Ok(img.to_rgba8())
}

/// Encode an RGBA image to PNG bytes.
fn encode_png(img: &RgbaImage) -> Result<Vec<u8>, String> {
    let mut out = Vec::new();
    img.write_to(&mut Cursor::new(&mut out), ImageFormat::Png).map_err(|e| format!("Failed to encode PNG: {}", e))?;
    Ok(out)
}

/// Number of icon cells in a sheet of the given cell size.
pub fn icon_count(sheet_png: &[u8], cell: u32) -> Result<u32, String> {
    let img = decode_png(sheet_png)?;
    Ok(if cell == 0 {
        0
    } else {
        img.width() / cell
    })
}

/// Decode a PNG's dimensions, plus an inferred square cell size for a horizontal
/// sprite strip. A strip is a single row whose width is a multiple of its
/// height, so each cell is `height × height`. For images that aren't strips the
/// inferred cell is the full width (i.e. a single "cell" = the whole image).
pub fn describe(png: &[u8]) -> Result<(u32, u32, u32), String> {
    let img = decode_png(png)?;
    let (w, h) = (img.width(), img.height());
    let inferred_cell = if h > 0 && w % h == 0 && w >= h {
        h
    } else {
        w
    };
    Ok((w, h, inferred_cell))
}

/// Grow the sheet (to the right) so it has at least `target_index + 1` cells.
/// Returns the possibly-widened image. Existing pixels are preserved.
fn expand_to_index(mut sheet: RgbaImage, cell: u32, target_index: u32) -> RgbaImage {
    let current = sheet.width() / cell;
    if target_index < current {
        return sheet;
    }
    let new_w = (target_index + 1) * cell;
    let mut expanded = RgbaImage::from_pixel(new_w, cell, Rgba([0, 0, 0, 0]));
    imageops::overlay(&mut expanded, &sheet, 0, 0);
    sheet = expanded;
    sheet
}

/// Composite `icon` onto `sheet` at cell `index` (alpha-over), resizing the icon
/// to the cell size if needed. Returns the new sheet bytes.
///
/// `index_override`: when `Some(i)` replace cell i (growing if needed); when
/// `None` append at the end. Returns the index that was written.
pub fn add_or_replace(sheet_png: &[u8], cell: u32, icon_png: &[u8], index_override: Option<u32>) -> Result<(Vec<u8>, u32), String> {
    let mut sheet = decode_png(sheet_png)?;
    let count = sheet.width() / cell;
    let index = index_override.unwrap_or(count);
    sheet = expand_to_index(sheet, cell, index);

    let mut icon = decode_png(icon_png)?;
    if icon.dimensions() != (cell, cell) {
        icon = imageops::resize(&icon, cell, cell, imageops::FilterType::Lanczos3);
    }
    // Clear the destination cell first so we don't alpha-blend over old pixels.
    for y in 0..cell {
        for x in 0..cell {
            sheet.put_pixel(index * cell + x, y, Rgba([0, 0, 0, 0]));
        }
    }
    imageops::overlay(&mut sheet, &icon, (index * cell) as i64, 0);
    Ok((encode_png(&sheet)?, index))
}

/// Clear cell `index` (make it fully transparent). Errors if out of range.
pub fn remove(sheet_png: &[u8], cell: u32, index: u32) -> Result<Vec<u8>, String> {
    let mut sheet = decode_png(sheet_png)?;
    let max_index = sheet.width() / cell;
    if index >= max_index {
        return Err(format!("Index {} out of range (max {})", index, max_index.saturating_sub(1)));
    }
    for y in 0..cell {
        for x in 0..cell {
            sheet.put_pixel(index * cell + x, y, Rgba([0, 0, 0, 0]));
        }
    }
    encode_png(&sheet)
}

/// Swap cells `a` and `b`, growing the sheet if needed. Returns new bytes.
pub fn swap(sheet_png: &[u8], cell: u32, a: u32, b: u32) -> Result<Vec<u8>, String> {
    let mut sheet = decode_png(sheet_png)?;
    sheet = expand_to_index(sheet, cell, a.max(b));
    let crop = |s: &RgbaImage, idx: u32| -> RgbaImage { s.view(idx * cell, 0, cell, cell).to_image() };
    let icon_a = crop(&sheet, a);
    let icon_b = crop(&sheet, b);
    imageops::replace(&mut sheet, &icon_b, (a * cell) as i64, 0);
    imageops::replace(&mut sheet, &icon_a, (b * cell) as i64, 0);
    encode_png(&sheet)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn solid_sheet(cells: u32, cell: u32, color: [u8; 4]) -> Vec<u8> {
        let img = RgbaImage::from_pixel(cells * cell, cell, Rgba(color));
        encode_png(&img).unwrap()
    }
    fn solid_icon(cell: u32, color: [u8; 4]) -> Vec<u8> {
        encode_png(&RgbaImage::from_pixel(cell, cell, Rgba(color))).unwrap()
    }
    fn pixel_at(png: &[u8], x: u32, y: u32) -> [u8; 4] {
        decode_png(png).unwrap().get_pixel(x, y).0
    }

    #[test]
    fn append_grows_sheet() {
        let sheet = solid_sheet(2, 4, [10, 10, 10, 255]);
        assert_eq!(icon_count(&sheet, 4).unwrap(), 2);
        let icon = solid_icon(4, [200, 0, 0, 255]);
        let (out, idx) = add_or_replace(&sheet, 4, &icon, None).unwrap();
        assert_eq!(idx, 2);
        assert_eq!(icon_count(&out, 4).unwrap(), 3);
        assert_eq!(pixel_at(&out, 2 * 4, 0), [200, 0, 0, 255]); // new cell painted
        assert_eq!(pixel_at(&out, 0, 0), [10, 10, 10, 255]); // old cell intact
    }

    #[test]
    fn replace_resizes_icon() {
        let sheet = solid_sheet(3, 8, [0, 0, 0, 0]);
        let icon = solid_icon(4, [0, 128, 0, 255]); // wrong size → must resize to 8
        let (out, idx) = add_or_replace(&sheet, 8, &icon, Some(1)).unwrap();
        assert_eq!(idx, 1);
        assert_eq!(pixel_at(&out, 8 + 3, 3), [0, 128, 0, 255]);
    }

    #[test]
    fn remove_clears_cell() {
        let sheet = solid_sheet(2, 4, [50, 50, 50, 255]);
        let out = remove(&sheet, 4, 1).unwrap();
        assert_eq!(pixel_at(&out, 4, 0), [0, 0, 0, 0]); // cleared
        assert_eq!(pixel_at(&out, 0, 0), [50, 50, 50, 255]); // other intact
        assert!(remove(&sheet, 4, 9).is_err());
    }

    #[test]
    fn describe_infers_strip_cell() {
        // 10 cells of 8px = 80x8 strip → inferred cell 8.
        let strip = solid_sheet(10, 8, [0, 0, 0, 255]);
        assert_eq!(describe(&strip).unwrap(), (80, 8, 8));
        // A square-ish image (not a multiple) → cell = full width (single cell).
        let square = encode_png(&RgbaImage::from_pixel(20, 13, Rgba([0, 0, 0, 255]))).unwrap();
        assert_eq!(describe(&square).unwrap(), (20, 13, 20));
    }

    #[test]
    fn swap_exchanges_cells() {
        // cell 0 red, cell 1 blue
        let mut img = RgbaImage::from_pixel(8, 4, Rgba([0, 0, 0, 0]));
        for y in 0..4 {
            for x in 0..4 {
                img.put_pixel(x, y, Rgba([255, 0, 0, 255]));
            }
            for x in 4..8 {
                img.put_pixel(x, y, Rgba([0, 0, 255, 255]));
            }
        }
        let sheet = encode_png(&img).unwrap();
        let out = swap(&sheet, 4, 0, 1).unwrap();
        assert_eq!(pixel_at(&out, 0, 0), [0, 0, 255, 255]); // now blue
        assert_eq!(pixel_at(&out, 4, 0), [255, 0, 0, 255]); // now red
    }
}
