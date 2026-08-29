type Entry = { count: number; resetAt: number };
const globalLimits = globalThis as typeof globalThis & {
  securepathbankRateLimits?: Map<string, Entry>;
};
const limits = globalLimits.securepathbankRateLimits ?? new Map<string, Entry>();
globalLimits.securepathbankRateLimits = limits;
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now(),
    entry = limits.get(key);
  if (!entry || entry.resetAt <= now) {
    limits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  entry.count += 1;
  return {
    allowed: entry.count <= limit,
    retryAfter: Math.ceil((entry.resetAt - now) / 1000),
  };
}
export function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}
