// services/rateLimiter.js
// Simple in-memory rate limiter for authentication endpoints.
// For horizontally scaled deployments, replace with a shared store (Redis, etc.).

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const STORE_CLEANUP_INTERVAL_MS = 1000;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveLimit(option, envName, fallback) {
  if (option !== undefined) return parsePositiveInteger(option, fallback);
  return parsePositiveInteger(process.env[envName], fallback);
}

// Store: Map<key, { count: number, resetTime: number }>
const store = new Map();
let cleanupTimer = null;

function stopCleanupTimerIfEmpty() {
  if (store.size !== 0 || cleanupTimer === null) return;
  clearInterval(cleanupTimer);
  cleanupTimer = null;
}

export function cleanupExpiredRateLimitRecords(now = Date.now()) {
  for (const [key, record] of store) {
    if (record.resetTime <= now) store.delete(key);
  }
  stopCleanupTimerIfEmpty();
}

function startCleanupTimer() {
  if (cleanupTimer !== null) return;

  // One shared timer cleans all limiter prefixes. unref() prevents the timer
  // from keeping a short-lived process or test run alive.
  cleanupTimer = setInterval(
    () => cleanupExpiredRateLimitRecords(),
    STORE_CLEANUP_INTERVAL_MS
  );
  cleanupTimer.unref?.();
}

/**
 * Rate limiter middleware factory.
 * @param {Object} options
 * @param {string} options.keyPrefix - Prefix for the store key (e.g., 'miniapp_assoc')
 * @param {Function} options.keyGenerator - Function(req) => string key (default: IP)
 * @param {number} options.maxRequests - Optional per-window request limit
 * @param {number} options.windowMs - Optional window duration in milliseconds
 * @param {string} options.maxRequestsEnv - Environment variable for maxRequests
 * @param {string} options.windowMsEnv - Environment variable for windowMs
 * @param {number} options.defaultMaxRequests - Fallback when no limit is configured
 * @param {number} options.defaultWindowMs - Fallback when no window is configured
 * @returns {Function} Express middleware
 */
export function createRateLimiter({
  keyPrefix = "default",
  keyGenerator = (req) => req.ip,
  maxRequests,
  windowMs,
  maxRequestsEnv = "RATE_LIMIT_MAX_REQUESTS",
  windowMsEnv = "RATE_LIMIT_WINDOW_MS",
  defaultMaxRequests = DEFAULT_MAX_REQUESTS,
  defaultWindowMs = DEFAULT_WINDOW_MS
} = {}) {
  const maxRequestsFallback = parsePositiveInteger(
    defaultMaxRequests,
    DEFAULT_MAX_REQUESTS
  );
  const windowMsFallback = parsePositiveInteger(defaultWindowMs, DEFAULT_WINDOW_MS);
  const resolvedMaxRequests = resolveLimit(
    maxRequests,
    maxRequestsEnv,
    maxRequestsFallback
  );
  const resolvedWindowMs = resolveLimit(windowMs, windowMsEnv, windowMsFallback);

  return (req, res, next) => {
    const clientKey = keyGenerator(req);
    const key = `${keyPrefix}:${String(clientKey ?? "unknown")}`;
    const now = Date.now();
    const record = store.get(key);

    if (!record || now >= record.resetTime) {
      // First request or window expired.
      store.set(key, { count: 1, resetTime: now + resolvedWindowMs });
      startCleanupTimer();
      return next();
    }

    if (record.count >= resolvedMaxRequests) {
      // Rate limited.
      const retryAfter = Math.max(
        1,
        Math.ceil((record.resetTime - now) / 1000)
      );
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        ok: false,
        error: "rate_limited",
        retryAfter
      });
    }

    record.count += 1;
    next();
  };
}

/**
 * Reset all rate limit records (for testing and controlled shutdown).
 */
export function resetRateLimiter() {
  store.clear();
  if (cleanupTimer !== null) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

/**
 * Return the current number of records. Intended for diagnostics/tests.
 */
export function getRateLimiterStoreSize() {
  return store.size;
}
