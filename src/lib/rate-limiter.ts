// In-memory rate limiter.
// Resets on process restart — for multi-instance/serverless deployments replace with Redis or DB-backed store.

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key       Identifier (e.g. normalized email)
 * @param max       Max attempts within the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;
  entry.count++;
  return true;
}
