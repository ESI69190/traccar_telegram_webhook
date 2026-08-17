// services/rateLimiter.js
// Simple in-memory rate limiter for authentication endpoints.
// For horizontally scaled deployments, replace with a shared store (Redis, etc.).

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

function getMaxRequests() {
  const env = process.env.RATE_LIMIT_MAX_REQUESTS;
  if (!env) return DEFAULT_MAX_REQUESTS;
  const parsed = parseInt(env, 10);
  if (isNaN(parsed) || parsed <= 0) return DEFAULT_MAX_REQUESTS;
  return parsed;
}

function getWindowMs() {
  const env = process.env.RATE_LIMIT_WINDOW_MS;
  if (!env) return DEFAULT_WINDOW_MS;
  const parsed = parseInt(env, 10);
  if (isNaN(parsed) || parsed <= 0) return DEFAULT_WINDOW_MS;
  return parsed;
}

// Store: Map<key, { count: number, resetTime: number }>
const store = new Map();

/**
 * Rate limiter middleware factory.
 * @param {Object} options
 * @param {string} options.keyPrefix - Prefix for the store key (e.g., 'miniapp_assoc')
 * @param {Function} options.keyGenerator - Function(req) => string key (default: IP)
 * @returns {Function} Express middleware
 */
export function createRateLimiter({ keyPrefix = 'default', keyGenerator = (req) => req.ip }) {
  const maxRequests = getMaxRequests();
  const windowMs = getWindowMs();

  return (req, res, next) => {
    const key = `${keyPrefix}:${keyGenerator(req)}`;
    const now = Date.now();
    const record = store.get(key);

    if (!record || now > record.resetTime) {
      // First request or window expired
      store.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      // Rate limited
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ ok: false, error: 'rate_limited', retryAfter });
    }

    record.count += 1;
    next();
  };
}

/**
 * Reset all rate limit records (for testing).
 */
export function resetRateLimiter() {
  store.clear();
}