// Structured error types for the application
// Provides better error handling and user-friendly messages

use thiserror::Error;

/// Main application error type
#[derive(Debug, Error)]
pub enum AppError {
    #[error("Appearances not loaded. Please load an appearances file first.")]
    AppearancesNotLoaded,

    #[error("Sprite loader not initialized. Please load sprites catalog first.")]
    SpriteLoaderNotInitialized,

    #[error("Invalid appearance ID: {0}")]
    InvalidAppearanceId(u32),

    #[error("Appearance not found: category={category}, id={id}")]
    AppearanceNotFound { category: String, id: u32 },

    #[error("Invalid sprite ID: {0}")]
    InvalidSpriteId(u32),

    #[error("Sprite not found: {0}")]
    SpriteNotFound(u32),

    #[error("Invalid category: {0}")]
    InvalidCategory(String),

    #[error("Invalid subcategory: {0}")]
    InvalidSubcategory(String),

    #[error("Invalid frame group index: {0}")]
    InvalidFrameGroupIndex(usize),

    #[error("Frame group validation failed: {0}")]
    FrameGroupValidation(String),

    #[error("Sprite count mismatch: expected {expected}, got {actual}")]
    SpriteCountMismatch { expected: usize, actual: usize },

    #[error("Invalid enum value: {field}={value}")]
    InvalidEnumValue { field: String, value: i32 },

    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Protobuf decode error: {0}")]
    ProtobufDecode(#[from] prost::DecodeError),

    #[error("Protobuf encode error: {0}")]
    ProtobufEncode(#[from] prost::EncodeError),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("LZMA decompression error: {0}")]
    LzmaDecompression(String),

    #[error("Image processing error: {0}")]
    ImageProcessing(String),

    #[error("Cache error: {0}")]
    Cache(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

/// Result type alias for application errors
pub type AppResult<T> = Result<T, AppError>;

/// Convert AppError to String for Tauri commands
impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}

/// Helper functions for common error scenarios
impl AppError {
    pub fn sprite_validation(message: impl Into<String>) -> Self {
        AppError::Validation(format!("Sprite validation failed: {}", message.into()))
    }

    pub fn frame_group_validation(message: impl Into<String>) -> Self {
        AppError::FrameGroupValidation(message.into())
    }

    pub fn lzma_error(message: impl Into<String>) -> Self {
        AppError::LzmaDecompression(message.into())
    }

    pub fn image_error(message: impl Into<String>) -> Self {
        AppError::ImageProcessing(message.into())
    }

    pub fn cache_error(message: impl Into<String>) -> Self {
        AppError::Cache(message.into())
    }

    pub fn internal(message: impl Into<String>) -> Self {
        AppError::Internal(message.into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_messages() {
        let err = AppError::AppearancesNotLoaded;
        assert_eq!(
            err.to_string(),
            "Appearances not loaded. Please load an appearances file first."
        );

        let err = AppError::InvalidAppearanceId(123);
        assert_eq!(err.to_string(), "Invalid appearance ID: 123");

        let err = AppError::AppearanceNotFound {
            category: "Objects".to_string(),
            id: 456,
        };
        assert_eq!(
            err.to_string(),
            "Appearance not found: category=Objects, id=456"
        );
    }

    #[test]
    fn test_error_conversion() {
        let err = AppError::InvalidSpriteId(789);
        let string_err: String = err.into();
        assert_eq!(string_err, "Invalid sprite ID: 789");
    }
}
