import { timingSafeEqual } from "node:crypto";

// The site owner proves who they are with OWNER_KEY (set in Vercel), sent as a header.
export function isOwner(req: Request): boolean {
  const expected = process.env.OWNER_KEY;
  const given = req.headers.get("x-owner-key");
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Vercel sends CRON_SECRET as a Bearer token on scheduled runs.
export function isCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = req.headers.get("authorization") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
