const { loadImage } = require('@napi-rs/canvas');
const logger = require('../../utils/logger');

// In-memory cache keyed by the raw favicon/icon source string. Bounded so a
// bot monitoring many servers can't leak memory indefinitely.
const CACHE_MAX = 200;
const cache = new Map();

function remember(key, image) {
  if (cache.size >= CACHE_MAX) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, image);
}

/**
 * Resolves the best available icon image for a server status.
 * Priority: explicit configured icon URL > Java favicon (base64 data URI) > null (fallback drawn by the renderer).
 * Never throws — invalid/broken/missing icons simply resolve to null.
 */
async function resolveServerIcon(status, iconUrlOverride) {
  const source = iconUrlOverride || status.favicon || null;
  if (!source) return null;

  if (cache.has(source)) return cache.get(source);

  try {
    let image;
    if (source.startsWith('data:image')) {
      // Java's favicon field is already a data URI (base64-encoded PNG).
      image = await loadImage(source);
    } else {
      image = await loadImage(source);
    }
    remember(source, image);
    return image;
  } catch (err) {
    logger.warn(`Failed to decode server icon (${err.message}) — using fallback.`);
    remember(source, null); // don't retry a broken source every 30s
    return null;
  }
}

module.exports = { resolveServerIcon };
