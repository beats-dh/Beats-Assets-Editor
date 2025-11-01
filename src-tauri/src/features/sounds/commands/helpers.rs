// Helper utilities for sounds commands
// Eliminates code duplication across command handlers

/// Generic pagination helper
/// Eliminates 4+ duplicate pagination blocks
#[inline]
pub fn paginate<T: Clone>(items: &[T], page: Option<usize>, page_size: Option<usize>) -> Vec<T> {
    let page = page.unwrap_or(0);
    let page_size = page_size.unwrap_or(50);
    let start = page * page_size;
    let end = start + page_size;

    if start < items.len() {
        items[start..items.len().min(end)].to_vec()
    } else {
        Vec::new()
    }
}
