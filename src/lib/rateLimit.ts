import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = new Map<string, Ratelimit>();

if (!redis) {
  console.warn(
    "[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — falling back to a process-local in-memory limiter (not shared across instances)."
  );
}

function getLimiter(limit: number, windowSeconds: number) {
  if (!redis) return null;

  const cacheKey = `${limit}:${windowSeconds}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: "ratelimit",
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

// Fallback used only when Upstash isn't configured (e.g. local dev). Not
// shared across serverless instances, but still blocks single-process abuse
// instead of silently allowing everything through.
const memoryHits = new Map<string, number[]>();

function checkMemoryRateLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const hits = (memoryHits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    memoryHits.set(key, hits);
    return false;
  }

  hits.push(now);
  memoryHits.set(key, hits);
  return true;
}

export async function checkRateLimit(key: string, limit: number, windowSeconds: number) {
  const limiter = getLimiter(limit, windowSeconds);
  if (!limiter) return checkMemoryRateLimit(key, limit, windowSeconds);

  const { success } = await limiter.limit(key);
  return success;
}

export function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
