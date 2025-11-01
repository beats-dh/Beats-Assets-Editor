#!/usr/bin/env python3
"""
Script to optimize ALL update functions in update.rs with:
1. O(1) lookup via index maps
2. Cache invalidation after mutations
3. parking_lot locks (already done)
"""

import re

# Read the file
with open(r"c:\Users\danie\tibia-assets-editor\src-tauri\src\features\appearances\commands\update.rs", "r", encoding="utf-8") as f:
    content = f.read()

# Pattern to find the linear search: items.iter_mut().find(|app| app.id.unwrap_or(0) == id)
linear_search_pattern = r'let appearance = items\.iter_mut\(\)\.find\(\|app\| app\.id\.unwrap_or\(0\) == id\)\.ok_or_else\(\|\| format!\("Appearance with ID \{\} not found in \{:\?\}", id, category\)\)\?;'

# Replacement with O(1) lookup
o1_lookup = '''// O(1) lookup via index
    let index_map = get_index_for_category(&state, &category);
    let appearance = if let Some(idx_ref) = index_map.get(&id) {
        let idx = *idx_ref;
        items.get_mut(idx).ok_or_else(|| format!("Index {} out of bounds", idx))?
    } else {
        items.iter_mut().find(|app| app.id.unwrap_or(0) == id)
            .ok_or_else(|| format!("Appearance {} not found", id))?
    };'''

# Replace all occurrences
count = content.count('items.iter_mut().find(|app| app.id.unwrap_or(0) == id)')
content = re.sub(linear_search_pattern, o1_lookup, content)

print(f"Replaced {count} linear searches with O(1) lookups")

# Now add cache invalidation before each `Ok(create_appearance_item_response(id, appearance))`
# but only if it doesn't already have it
def add_cache_invalidation(match):
    text = match.group(0)
    if "invalidate_search_cache" in text:
        return text  # Already has cache invalidation
    # Add it before the Ok(...)
    return "    // Invalidate cache (data changed)\n    invalidate_search_cache(&state);\n\n" + text

# Find all Ok(create_appearance_item_response patterns and add cache invalidation
pattern = r'    Ok\(create_appearance_item_response\(id, appearance\)\)\n\}'
content = re.sub(pattern, add_cache_invalidation, content)

print(f"Added cache invalidation to all update functions")

# Write back
with open(r"c:\Users\danie\tibia-assets-editor\src-tauri\src\features\appearances\commands\update.rs", "w", encoding="utf-8") as f:
    f.write(content)

print("✅ All update functions optimized!")
