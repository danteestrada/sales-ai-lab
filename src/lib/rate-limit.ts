// Visitor protection: a daily limit per visitor and a site-wide daily cap.
//
// This version keeps counts in server memory. On Vercel that memory can reset when the
// server restarts, so treat it as a first line of defense. The hard backstop is the
// monthly spend limit set in the Anthropic Console. A shared store (e.g. Redis) can
// replace this later without changing the routes that call it.

const PER_VISITOR_DAILY = Number(process.env.PER_VISITOR_DAILY ?? 5);
const SITE_DAILY_CAP = Number(process.env.SITE_DAILY_CAP ?? 150);

type Counter = { day: string; count: number };
const visitors = new Map<string, Counter>();
let site: Counter = { day: today(), count: 0 };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function visitorId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

export type LimitResult =
  | { ok: true; remaining: number }
  | { ok: false; reason: "visitor" | "site"; message: string };

export function checkLimit(id: string, ownerKey?: string | null): LimitResult {
  // The site owner can skip limits by sending the OWNER_KEY (set in Vercel).
  if (ownerKey && process.env.OWNER_KEY && ownerKey === process.env.OWNER_KEY) {
    return { ok: true, remaining: Infinity };
  }
  const d = today();
  if (site.day !== d) site = { day: d, count: 0 };
  if (site.count >= SITE_DAILY_CAP) {
    return {
      ok: false,
      reason: "site",
      message: "The lab has hit its daily demo limit. It resets at midnight UTC — or reach out and I'll walk you through it live.",
    };
  }
  const v = visitors.get(id);
  const current = v && v.day === d ? v : { day: d, count: 0 };
  if (current.count >= PER_VISITOR_DAILY) {
    return {
      ok: false,
      reason: "visitor",
      message: `You've used today's ${PER_VISITOR_DAILY} free runs. Come back tomorrow, or reach out and I'll give you a live demo.`,
    };
  }
  current.count += 1;
  site.count += 1;
  visitors.set(id, current);
  return { ok: true, remaining: PER_VISITOR_DAILY - current.count };
}
