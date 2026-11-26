const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 5;
const MAX_TRACKED_IPS = 10000;

/**
 * Creates an in-memory sliding-window rate limiter with periodic expired-entry cleanup.
 * For multi-instance horizontal scaling, swap backing store to Redis.
 */
export function createAuthRateLimiter({
  windowMs = DEFAULT_WINDOW_MS,
  maxRequests = DEFAULT_MAX_REQUESTS,
} = {}) {
  const rateLimitMap = new Map();

  const cleanupExpiredEntries = (now = Date.now()) => {
    const windowStart = now - windowMs;
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const validTimestamps = timestamps.filter((t) => t > windowStart);
      if (validTimestamps.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, validTimestamps);
      }
    }
  };

  const cleanupInterval = setInterval(() => cleanupExpiredEntries(), windowMs);
  if (typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress;
    if (!ip) return next();

    const now = Date.now();
    const windowStart = now - windowMs;

    if (rateLimitMap.size >= MAX_TRACKED_IPS && !rateLimitMap.has(ip)) {
      cleanupExpiredEntries(now);
      if (rateLimitMap.size >= MAX_TRACKED_IPS) {
        const oldestKey = rateLimitMap.keys().next().value;
        if (oldestKey) rateLimitMap.delete(oldestKey);
      }
    }

    const history = (rateLimitMap.get(ip) || []).filter((timestamp) => timestamp > windowStart);

    if (history.length >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((history[0] + windowMs - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.setHeader("X-RateLimit-Limit", String(maxRequests));
      res.setHeader("X-RateLimit-Remaining", "0");
      return res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    }

    history.push(now);
    rateLimitMap.set(ip, history);
    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, maxRequests - history.length)));

    next();
  };
}

export const authRateLimiter = createAuthRateLimiter();
