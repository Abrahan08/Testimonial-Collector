export type RateLimitStore = Map<string, number[]>;
export type RateWindow = { max: number; windowMs: number };

export const SUBMISSION_LIMIT: RateWindow = { max: 5, windowMs: 60 * 60 * 1000 };

const SWEEP_AT = 5000;
const HARD_CAP = 10000;

// Drops expired keys once the map is large; if everything is still live, evicts the
// oldest-inserted keys so memory and per-call cost stay bounded under key-rotation abuse.
function prune(store: RateLimitStore, now: number, windowMs: number) {
  if (store.size <= SWEEP_AT) return;
  for (const [k, stamps] of store) {
    if (stamps.length === 0 || now - stamps[stamps.length - 1] >= windowMs) store.delete(k);
  }
  for (const k of store.keys()) {
    if (store.size <= HARD_CAP) break;
    store.delete(k);
  }
}

// Pure sliding window: records `now` when allowed, drops stamps older than the window.
// Blocked attempts are not recorded, so waiting out the window always recovers.
export function checkRateLimit(
  store: RateLimitStore,
  key: string,
  now: number,
  { max, windowMs }: RateWindow = SUBMISSION_LIMIT,
): { allowed: boolean; remaining: number } {
  prune(store, now, windowMs);
  const recent = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    store.set(key, recent);
    return { allowed: false, remaining: 0 };
  }
  recent.push(now);
  store.set(key, recent);
  return { allowed: true, remaining: max - recent.length };
}

// Several windows at once: a hit is recorded in all of them only if every one allows it,
// so a blocked request never consumes another window's budget.
export function checkRateLimits(
  store: RateLimitStore,
  now: number,
  windows: { key: string; window: RateWindow }[],
): boolean {
  const live = windows.map(({ key, window }) => ({
    key,
    stamps: (store.get(key) ?? []).filter((t) => now - t < window.windowMs),
    max: window.max,
  }));
  if (live.some((w) => w.stamps.length >= w.max)) return false;
  prune(store, now, Math.max(...windows.map((w) => w.window.windowMs)));
  for (const w of live) store.set(w.key, [...w.stamps, now]);
  return true;
}

// Process-local store used by the submit action. Resets on restart and is not
// shared across instances.
export const submissionStore: RateLimitStore = new Map();
