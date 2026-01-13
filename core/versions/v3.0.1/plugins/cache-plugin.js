// Caching plugin v2.0
class CachePlugin {
  set(key, value, ttl) { return true; }
  get(key) { return null; }
  clear() { return true; }
}
module.exports = CachePlugin;
