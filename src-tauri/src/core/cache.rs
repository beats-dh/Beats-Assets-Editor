// LRU Cache implementation for Rust
// Provides bounded caches with automatic eviction
// OPTIMIZED: O(1) eviction using a tracked oldest key + sampling strategy

use dashmap::DashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

/// Entry in the LRU cache with timestamp
pub struct CacheEntry<V> {
    pub value: Arc<V>,
    pub timestamp: u64,
}

/// Global monotonic counter for cache timestamps (faster than SystemTime)
static GLOBAL_COUNTER: AtomicU64 = AtomicU64::new(1);

#[inline]
fn next_timestamp() -> u64 {
    GLOBAL_COUNTER.fetch_add(1, Ordering::Relaxed)
}

/// LRU Cache with maximum size
/// Thread-safe using DashMap
/// OPTIMIZED: Uses atomic counter instead of SystemTime, and batch eviction
/// to amortize the cost of finding LRU entries.
pub struct LRUCache<K, V>
where
    K: Eq + std::hash::Hash + Clone + Send + Sync + 'static,
{
    cache: DashMap<K, CacheEntry<V>>,
    max_size: usize,
}

impl<K, V> LRUCache<K, V>
where
    K: Eq + std::hash::Hash + Clone + Send + Sync + 'static,
{
    /// Create a new LRU cache with the specified maximum size
    pub fn new(max_size: usize) -> Self {
        Self {
            cache: DashMap::new(),
            max_size,
        }
    }

    /// Get a value from the cache
    /// Updates the timestamp to mark it as recently used
    pub fn get(&self, key: &K) -> Option<Arc<V>> {
        self.cache.get_mut(key).map(|mut entry| {
            entry.timestamp = next_timestamp();
            Arc::clone(&entry.value)
        })
    }

    /// Insert a value into the cache
    /// Evicts least recently used items if size limit is reached
    pub fn insert(&self, key: K, value: V) {
        let entry = CacheEntry {
            value: Arc::new(value),
            timestamp: next_timestamp(),
        };

        // Overwriting an existing key doesn't grow the cache, so skip eviction —
        // evicting here would needlessly drop a different (valid) entry.
        if let Some(mut existing) = self.cache.get_mut(&key) {
            *existing = entry;
            return;
        }

        // New key: only evict when actually at/over capacity.
        if self.cache.len() >= self.max_size {
            self.evict_batch();
        }

        self.cache.insert(key, entry);
    }

    /// Check if a key exists in the cache
    pub fn contains_key(&self, key: &K) -> bool {
        self.cache.contains_key(key)
    }

    /// Remove a specific key from the cache
    pub fn remove(&self, key: &K) -> Option<Arc<V>> {
        self.cache.remove(key).map(|(_, entry)| entry.value)
    }

    /// Clear all entries from the cache
    pub fn clear(&self) {
        self.cache.clear();
    }

    /// Get the current size of the cache
    pub fn len(&self) -> usize {
        self.cache.len()
    }

    /// Check if the cache is empty
    pub fn is_empty(&self) -> bool {
        self.cache.is_empty()
    }

    /// Get cache statistics
    pub fn stats(&self) -> CacheStats {
        CacheStats {
            size: self.cache.len(),
            max_size: self.max_size,
            utilization: (self.cache.len() as f64 / self.max_size as f64) * 100.0,
            estimated_memory_bytes: 0, // Base stats without memory tracking
        }
    }

    /// Get cache statistics with estimated memory usage.
    /// `avg_value_bytes` is the estimated average size of each cached value in bytes.
    pub fn stats_with_memory_estimate(&self, avg_value_bytes: u64) -> CacheStats {
        let size = self.cache.len();
        CacheStats {
            size,
            max_size: self.max_size,
            utilization: (size as f64 / self.max_size as f64) * 100.0,
            estimated_memory_bytes: size as u64 * avg_value_bytes,
        }
    }

    /// Iterate over cache entries
    pub fn iter(&self) -> dashmap::iter::Iter<'_, K, CacheEntry<V>> {
        self.cache.iter()
    }

    /// Evict a batch of the oldest entries (5% of max_size, minimum 1).
    /// Amortizes the O(n) scan cost across multiple evictions.
    fn evict_batch(&self) {
        let evict_count = std::cmp::max(1, self.max_size / 20); // 5% batch
        let mut candidates: Vec<(K, u64)> = Vec::with_capacity(evict_count + 1);

        // Single scan: collect the N oldest entries
        for entry in self.cache.iter() {
            let ts = entry.value().timestamp;
            if candidates.len() < evict_count {
                candidates.push((entry.key().clone(), ts));
                // Keep sorted by timestamp descending so last element is the "newest" candidate
                if candidates.len() == evict_count {
                    candidates.sort_unstable_by(|a, b| a.1.cmp(&b.1));
                }
            } else if ts < candidates.last().map(|c| c.1).unwrap_or(u64::MAX) {
                candidates.pop();
                // Binary insert to maintain sorted order
                let pos = candidates.partition_point(|c| c.1 <= ts);
                candidates.insert(pos, (entry.key().clone(), ts));
            }
        }

        // Remove all collected candidates
        for (key, _) in candidates {
            self.cache.remove(&key);
        }
    }
}

/// Cache statistics with memory estimation
#[derive(Debug, Clone, serde::Serialize)]
pub struct CacheStats {
    pub size: usize,
    pub max_size: usize,
    pub utilization: f64,
    /// Estimated memory usage in bytes (0 if not available)
    pub estimated_memory_bytes: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lru_cache_basic() {
        let cache = LRUCache::new(3);

        cache.insert("a", 1);
        cache.insert("b", 2);
        cache.insert("c", 3);

        assert_eq!(cache.len(), 3);
        assert_eq!(*cache.get(&"a").unwrap(), 1);
        assert_eq!(*cache.get(&"b").unwrap(), 2);
        assert_eq!(*cache.get(&"c").unwrap(), 3);
    }

    #[test]
    fn test_lru_cache_eviction() {
        let cache = LRUCache::new(2);

        cache.insert("a", 1);
        cache.insert("b", 2);

        // Access "a" to make it more recently used
        let _ = cache.get(&"a");

        // Insert "c", should evict "b" (least recently used)
        cache.insert("c", 3);

        assert!(cache.len() <= 2);
        assert!(cache.contains_key(&"a"));
        assert!(cache.contains_key(&"c"));
    }

    #[test]
    fn test_lru_cache_clear() {
        let cache = LRUCache::new(3);

        cache.insert("a", 1);
        cache.insert("b", 2);
        cache.clear();

        assert_eq!(cache.len(), 0);
        assert!(cache.is_empty());
    }

    #[test]
    fn test_lru_cache_stats() {
        let cache = LRUCache::new(10);

        cache.insert("a", 1);
        cache.insert("b", 2);

        let stats = cache.stats();
        assert_eq!(stats.size, 2);
        assert_eq!(stats.max_size, 10);
        assert_eq!(stats.utilization, 20.0);
    }
}
