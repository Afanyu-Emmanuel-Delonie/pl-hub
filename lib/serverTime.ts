// A trusted clock for automatic quiz scheduling. A student's own device
// clock can't be trusted for open/close timing — changing it forward or
// back would let them dodge the window or claim extra time — so this syncs
// an offset against the Next.js server's clock (via /api/time) instead and
// every scheduling decision is made against `trustedNow()`, never
// `Date.now()` directly.
let offsetMs = 0;

export async function syncServerTime(): Promise<void> {
  const t0 = Date.now();
  const res = await fetch("/api/time", { cache: "no-store" });
  const { now } = (await res.json()) as { now: number };
  const t1 = Date.now();
  // Assume the request and response each took half the round trip, so the
  // server's clock reading corresponds to the midpoint of t0..t1 locally.
  offsetMs = now - (t0 + t1) / 2;
}

export function trustedNow(): number {
  return Date.now() + offsetMs;
}
