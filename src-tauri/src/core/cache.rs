// LRU Cache implementation for Rust
// Provides bounded caches with automatic eviction

use dashmap::DashMap;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

/// Entry in the LRU cache with timestamp
pub struct CacheEntry<V> {
    pub value: Arc<V>,
    pub timestamp: u64,
}

/// LRU Cache with maximum size
/// Thread-safe using DashMap
pub struct LRUCache<K, V>
where
    K: Eq + std::hash::Hash + Clone,
{
    cache: DashMap<K, CacheEntry<V>>,
    max_size: usize,
}

impl<K, V> LRUCache<K, V>
where
    K: Eq + std::hash::Hash + Clone,
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
            // Update timestamp
            entry.timestamp = current_timestamp();
            Arc::clone(&entry.value)
        })
    }

    /// Insert a value into the cache
    /// Evicts least recently used items if size limit is reached
    pub fn insert(&self, key: K, value: V) {
        // If cache is full, evict LRU item
        if self.cache.len() >= self.max_size {
            self.evict_lru();
        }

        // Insert new entry
        self.cache.insert(
            key,
            CacheEntry {
                value: Arc::new(value),
                timestamp: current_timestamp(),
            },
        );
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
        }
    }

    /// Iterate over cache entries
    /// Returns an iterator over the underlying DashMap
    pub fn iter(&self) -> dashmap::iter::Iter<'_, K, CacheEntry<V>> {
        self.cache.iter()
    }

    /// Evict the least recently used item
    fn evict_lru(&self) {
        let mut oldest_key: Option<K> = None;
        let mut oldest_timestamp = u64::MAX;

        // Find the least recently used entry
        for entry in self.cache.iter() {
            if entry.value().timestamp < oldest_timestamp {
                oldest_timestamp = entry.value().timestamp;
                oldest_key = Some(entry.key().clone());
            }
        }

        // Remove the oldest entry
        if let Some(key) = oldest_key {
            self.cache.remove(&key);
        }
    }
}

/// Cache statistics
#[derive(Debug, Clone, serde::Serialize)]
pub struct CacheStats {
    pub size: usize,
    pub max_size: usize,
    pub utilization: f64,
}

/// Get current timestamp in milliseconds
fn current_timestamp() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64
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
        std::thread::sleep(std::time::Duration::from_millis(10));
        cache.insert("b", 2);

        // Access "a" to make it more recently used
        std::thread::sleep(std::time::Duration::from_millis(10));
        let _ = cache.get(&"a");

        // Insert "c", should evict "b" (least recently used)
        std::thread::sleep(std::time::Duration::from_millis(10));
        cache.insert("c", 3);

        assert_eq!(cache.len(), 2);
        assert!(cache.contains_key(&"a"));
        assert!(!cache.contains_key(&"b"));
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
