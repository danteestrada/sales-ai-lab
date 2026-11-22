import type { Account, Confidence, ContactCheck, Criterion, WeightChange } from "./types";

// Everything here is plain math: the AI never sets the final score or the confidence.

export function scoreAccount(account: Account, rubric: Criterion[]): number | undefined {
  const r = account.research;
  if (!r) return undefined;
  let total = 0;
  let weights = 0;
  for (const c of rubric) {
    const s = r.criteria.find((x) => x.id === c.id);
    if (!s) continue;
    total += c.weight * (clamp(s.score, 0, 5) / 5);
    weights += c.weight;
  }
  if (weights === 0) return 0;
  let score = (total / weights) * 100;
  if (r.disqualified) score = Math.min(score, 20); // a disqualifier caps the score
  return Math.round(score);
}

// How fresh is the source that names this person in this role?
export function contactConfidence(sourceDate: string, now = new Date()): Confidence {
  const d = parseLooseDate(sourceDate);
  if (!d) return "low";
  const days = (now.getTime() - d.getTime()) / 86_400_000;
  if (days <= 120) return "high";
  if (days <= 365) return "medium";
  return "low";
}

// Combines the original source with the verification search.
// Left = low. Confirmed current = judged by the newest evidence. Unclear = original source only.
export function finalConfidence(sourceDate: string, verify?: ContactCheck, now = new Date()): Confidence {
  if (!verify) return contactConfidence(sourceDate, now);
  if (verify.status === "left") return "low";
  if (verify.status === "current") {
    const a = parseLooseDate(sourceDate)?.getTime() ?? 0;
    const b = parseLooseDate(verify.date)?.getTime() ?? 0;
    const newest = Math.max(a, b);
    return newest ? contactConfidence(new Date(newest).toISOString().slice(0, 10), now) : "medium";
  }
  return contactConfidence(sourceDate, now);
}

export function parseLooseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(s?.trim() ?? "");
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, m[3] ? Number(m[3]) : 15));
  return isNaN(d.getTime()) ? null : d;
}

// Learning from feedback. A thumbs-up nudges weight toward the criteria this account
// scored high on; a thumbs-down nudges weight away from them. Small steps, then
// re-balanced so weights still sum to 100. Every change is logged so it's visible.
const LEARNING_RATE = 0.15;
const MIN_WEIGHT = 3;

export function learnFromFeedback(
  account: Account,
  verdict: "up" | "down",
  rubric: Criterion[],
): { rubric: Criterion[]; change: WeightChange | null } {
  const r = account.research;
  if (!r) return { rubric, change: null };
  const label = verdict === "up" ? 1 : -1;
  const raw = rubric.map((c) => {
    const s = r.criteria.find((x) => x.id === c.id)?.score ?? 2.5;
    const centered = clamp(s, 0, 5) / 5 - 0.5; // -0.5 .. +0.5
    return Math.max(MIN_WEIGHT, c.weight * (1 + LEARNING_RATE * label * centered * 2));
  });
  const sum = raw.reduce((a, b) => a + b, 0);
  const next = rubric.map((c, i) => ({ ...c, weight: round1((raw[i] / sum) * 100) }));
  // fix rounding so the total is exactly 100
  const drift = round1(100 - next.reduce((a, c) => a + c.weight, 0));
  if (drift !== 0) {
    const biggest = next.reduce((m, c, i) => (c.weight > next[m].weight ? i : m), 0);
    next[biggest].weight = round1(next[biggest].weight + drift);
  }
  const changes = next
    .map((c, i) => ({ id: c.id, name: c.name, from: rubric[i].weight, to: c.weight }))
    .filter((x) => Math.abs(x.to - x.from) >= 0.1);
  return {
    rubric: next,
    change: changes.length ? { at: new Date().toISOString(), account: account.name, verdict, changes } : null,
  };
}

export function normalizeWeights(rubric: Criterion[]): Criterion[] {
  const sum = rubric.reduce((a, c) => a + Math.max(0, c.weight), 0) || 1;
  return rubric.map((c) => ({ ...c, weight: round1((Math.max(0, c.weight) / sum) * 100) }));
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
