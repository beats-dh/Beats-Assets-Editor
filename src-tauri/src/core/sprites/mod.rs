// Sprite handling module
// TODO: Implement sprite extraction and manipulation

use anyhow::Result;
use image::{DynamicImage, ImageBuffer, Rgba};

/// Represents a Tibia sprite
#[derive(Debug, Clone)]
pub struct TibiaSprite {
    pub id: u32,
    pub width: u32,
    pub height: u32,
    pub data: Vec<u8>,
}

impl TibiaSprite {
    /// Convert sprite data to an image
    pub fn to_image(&self) -> Result<DynamicImage> {
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_raw(
            self.width,
            self.height,
            self.data.clone(),
        )
        .ok_or_else(|| anyhow::anyhow!("Failed to create image from sprite data"))?;

        Ok(DynamicImage::ImageRgba8(img))
    }

    /// Export sprite to PNG file
    pub fn export_png<P: AsRef<std::path::Path>>(&self, path: P) -> Result<()> {
        let img = self.to_image()?;
        img.save(path)?;
        Ok(())
    }
}
