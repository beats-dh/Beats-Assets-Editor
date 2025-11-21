// Validation utilities for data integrity
// Ensures sprites, frame groups, and other data are valid

use crate::core::errors::{AppError, AppResult};
use crate::features::sprites::parsers::SpriteLoader;

/// Validate that all sprite IDs in a frame group exist in the sprite loader
pub fn validate_sprite_ids(sprite_ids: &[u32], sprite_loader: &SpriteLoader) -> AppResult<()> {
    for &sprite_id in sprite_ids {
        // Check if sprite exists by attempting to get it
        if sprite_loader.get_sprite(sprite_id).is_err() {
            return Err(AppError::InvalidSpriteId(sprite_id));
        }
    }
    Ok(())
}

/// Validate frame group dimensions match sprite count
pub fn validate_frame_group_dimensions(
    pattern_width: u32,
    pattern_height: u32,
    pattern_depth: u32,
    layers: u32,
    sprite_count: usize,
) -> AppResult<()> {
    let expected = (pattern_width * pattern_height * pattern_depth * layers) as usize;
    
    if sprite_count != expected {
        return Err(AppError::SpriteCountMismatch {
            expected,
            actual: sprite_count,
        });
    }
    
    Ok(())
}

/// Validate animation phase counts
pub fn validate_animation_phases(phase_count: usize, sprite_count: usize) -> AppResult<()> {
    if phase_count == 0 {
        return Err(AppError::frame_group_validation("Animation must have at least one phase"));
    }
    
    if sprite_count % phase_count != 0 {
        return Err(AppError::frame_group_validation(
            format!("Sprite count ({}) must be divisible by phase count ({})", sprite_count, phase_count)
        ));
    }
    
    Ok(())
}

/// Validate appearance ID is within valid range
pub fn validate_appearance_id(id: u32, max_id: u32) -> AppResult<()> {
    if id == 0 || id > max_id {
        return Err(AppError::InvalidAppearanceId(id));
    }
    Ok(())
}

/// Validate enum value is within valid range
pub fn validate_enum_value(field: &str, value: i32, min: i32, max: i32) -> AppResult<()> {
    if value < min || value > max {
        return Err(AppError::InvalidEnumValue {
            field: field.to_string(),
            value,
        });
    }
    Ok(())
}

/// Validate brightness value (0-255)
pub fn validate_brightness(brightness: u32) -> AppResult<()> {
    const MAX_BRIGHTNESS: u32 = 255;
    if brightness > MAX_BRIGHTNESS {
        return Err(AppError::Validation(
            format!("Brightness must be <= {}, got {}", MAX_BRIGHTNESS, brightness)
        ));
    }
    Ok(())
}

/// Validate color value (0-255 for each RGB component)
pub fn validate_color(color: u32) -> AppResult<()> {
    const MAX_COLOR: u32 = 0xFFFFFF; // 24-bit RGB
    if color > MAX_COLOR {
        return Err(AppError::Validation(
            format!("Color must be <= 0x{:X}, got 0x{:X}", MAX_COLOR, color)
        ));
    }
    Ok(())
}

/// Validate string length
pub fn validate_string_length(s: &str, max_length: usize, field_name: &str) -> AppResult<()> {
    if s.len() > max_length {
        return Err(AppError::Validation(
            format!("{} exceeds maximum length of {} characters", field_name, max_length)
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_frame_group_dimensions() {
        // Valid dimensions
        assert!(validate_frame_group_dimensions(1, 1, 1, 1, 1).is_ok());
        assert!(validate_frame_group_dimensions(2, 2, 1, 1, 4).is_ok());
        assert!(validate_frame_group_dimensions(2, 2, 2, 2, 16).is_ok());

        // Invalid dimensions
        assert!(validate_frame_group_dimensions(2, 2, 1, 1, 3).is_err());
        assert!(validate_frame_group_dimensions(1, 1, 1, 1, 2).is_err());
    }

    #[test]
    fn test_validate_animation_phases() {
        // Valid phases
        assert!(validate_animation_phases(1, 4).is_ok());
        assert!(validate_animation_phases(4, 16).is_ok());

        // Invalid phases
        assert!(validate_animation_phases(0, 4).is_err());
        assert!(validate_animation_phases(3, 10).is_err());
    }

    #[test]
    fn test_validate_brightness() {
        assert!(validate_brightness(0).is_ok());
        assert!(validate_brightness(128).is_ok());
        assert!(validate_brightness(255).is_ok());
        assert!(validate_brightness(256).is_err());
    }

    #[test]
    fn test_validate_color() {
        assert!(validate_color(0x000000).is_ok());
        assert!(validate_color(0xFF0000).is_ok());
        assert!(validate_color(0xFFFFFF).is_ok());
        assert!(validate_color(0x1000000).is_err());
    }

    #[test]
    fn test_validate_string_length() {
        assert!(validate_string_length("test", 10, "name").is_ok());
        assert!(validate_string_length("test", 4, "name").is_ok());
        assert!(validate_string_length("test", 3, "name").is_err());
    }
}
