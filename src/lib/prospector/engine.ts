import { randomUUID } from "node:crypto";
import * as store from "../store";
import type { WorkspaceId } from "../store";
import { discoverAccounts, feedbackNotes, researchAccount } from "./ai";
import { learnFromFeedback, scoreAccount } from "./scoring";
import type { Account, Feedback, Settings } from "./types";

type Trigger = "manual" | "nightly";

export function settingsReady(s: Settings): string | null {
  if (!s.icp.sellerCompany || !s.icp.whatYouSell) return "Set who you sell for and what you sell first (ICP tab).";
  if (!s.icp.personas.length) return "Add at least one buyer persona (ICP tab).";
  return null;
}

export async function runDiscovery(ws: WorkspaceId, trigger: Trigger, count = 8) {
  const settings = await store.getSettings(ws);
  const notReady = settingsReady(settings);
  if (notReady) throw new Error(notReady);
  const existing = await store.getAccounts(ws);
  try {
    const { candidates, searches } = await discoverAccounts(settings, existing, count);
    const known = new Set(existing.map((a) => norm(a.domain || a.name)));
    const fresh: Account[] = [];
    for (const c of candidates) {
      const key = norm(c.domain || c.name);
      if (!key || known.has(key)) continue;
      known.add(key);
      fresh.push({
        id: randomUUID().slice(0, 8),
        name: c.name,
        domain: c.domain,
        hq: c.hq,
        region: c.region,
        industry: c.industry,
        employees: c.employees,
        discoveryReason: c.discoveryReason,
        discoveredAt: new Date().toISOString(),
        status: "queued",
      });
    }
    for (const a of fresh) await store.saveAccount(ws, a);
    await store.enqueue(ws, fresh.map((a) => a.id));
    await store.logRun(ws, {
      at: new Date().toISOString(),
      kind: "discover",
      trigger,
      ok: true,
      summary: `Found ${fresh.length} new accounts (${searches} searches).`,
    });
    return fresh;
  } catch (e) {
    await store.logRun(ws, { at: new Date().toISOString(), kind: "discover", trigger, ok: false, summary: errText(e) });
    throw e;
  }
}

export async function addAccountManually(ws: WorkspaceId, name: string, domain: string) {
  const a: Account = {
    id: randomUUID().slice(0, 8),
    name: name.trim(),
    domain: domain.trim(),
    hq: "",
    region: "",
    industry: "",
    employees: "",
    discoveryReason: "Added by you.",
    discoveredAt: new Date().toISOString(),
    status: "queued",
  };
  await store.saveAccount(ws, a);
  await store.enqueue(ws, [a.id]);
  return a;
}

// Research the next account in the queue. Returns null when the queue is empty.
export async function researchNext(ws: WorkspaceId, trigger: Trigger): Promise<Account | null> {
  const id = await store.dequeue(ws);
  if (!id) return null;
  const account = await store.getAccount(ws, id);
  if (!account) return researchNext(ws, trigger);
  return researchInto(ws, account, trigger);
}

export async function researchInto(ws: WorkspaceId, account: Account, trigger: Trigger): Promise<Account> {
  const settings = await store.getSettings(ws);
  await store.saveAccount(ws, { ...account, status: "researching", error: undefined });
  try {
    const notes = feedbackNotes(await store.getAccounts(ws));
    const { research, company } = await researchAccount(settings, account, notes);
    const updated: Account = {
      ...account,
      ...pickFilled(company),
      status: "done",
      error: undefined,
      research,
    };
    updated.score = scoreAccount(updated, settings.rubric);
    await store.saveAccount(ws, updated);
    await store.logRun(ws, {
      at: new Date().toISOString(),
      kind: "research",
      trigger,
      ok: true,
      summary: `${updated.name}: scored ${updated.score} (${research.searchesUsed} searches, ${research.contacts.length} contacts).`,
    });
    return updated;
  } catch (e) {
    const failed: Account = { ...account, status: "error", error: errText(e) };
    await store.saveAccount(ws, failed);
    await store.logRun(ws, { at: new Date().toISOString(), kind: "research", trigger, ok: false, summary: `${account.name}: ${errText(e)}` });
    return failed;
  }
}

export async function giveFeedback(ws: WorkspaceId, id: string, fb: Omit<Feedback, "at">) {
  const [settings, account] = await Promise.all([store.getSettings(ws), store.getAccount(ws, id)]);
  if (!account) throw new Error("Account not found");
  const feedback: Feedback = { ...fb, at: new Date().toISOString() };
  // If you change your mind, the old verdict is undone first by learning the opposite.
  let rubric = settings.rubric;
  if (account.feedback && account.feedback.verdict !== fb.verdict) {
    rubric = learnFromFeedback(account, fb.verdict, rubric).rubric;
  }
  const { rubric: next, change } = account.feedback?.verdict === fb.verdict ? { rubric, change: null } : learnFromFeedback(account, fb.verdict, rubric);
  await store.saveSettings(ws, { ...settings, rubric: next });
  if (change) await store.logWeightChange(ws, change);
  await store.saveAccount(ws, { ...account, feedback, hidden: fb.verdict === "down" ? account.hidden : false });
  await rescoreAll(ws);
  return change;
}

// After weights change, every score is recomputed so the ranking reflects what you taught it.
export async function rescoreAll(ws: WorkspaceId) {
  const [settings, accounts] = await Promise.all([store.getSettings(ws), store.getAccounts(ws)]);
  for (const a of accounts) {
    const s = scoreAccount(a, settings.rubric);
    if (s !== a.score) await store.saveAccount(ws, { ...a, score: s });
  }
}

export async function checkContact(ws: WorkspaceId, id: string, index: number, check: "correct" | "wrong" | null) {
  const account = await store.getAccount(ws, id);
  if (!account?.research?.contacts[index]) throw new Error("Contact not found");
  const contacts = account.research.contacts.map((c, i) => (i === index ? { ...c, check: check ?? undefined } : c));
  await store.saveAccount(ws, { ...account, research: { ...account.research, contacts } });
}

export async function setHidden(ws: WorkspaceId, id: string, hidden: boolean) {
  const account = await store.getAccount(ws, id);
  if (!account) throw new Error("Account not found");
  await store.saveAccount(ws, { ...account, hidden });
}

// Copy your researched accounts to the public demo, with contact names removed.
export async function publishDemo() {
  const [settings, accounts] = await Promise.all([store.getSettings("owner"), store.getAccounts("owner")]);
  await store.deleteAccounts("demo");
  await store.saveSettings("demo", settings);
  const visible = accounts.filter((a) => a.status === "done" && !a.hidden);
  for (const a of visible) await store.saveAccount("demo", redactForPublic(a));
  return visible.length;
}

export function redactForPublic(a: Account): Account {
  if (!a.research) return a;
  return {
    ...a,
    research: {
      ...a.research,
      contacts: a.research.contacts.map((c) => ({ ...c, name: "Name hidden in public demo" })),
    },
  };
}

function pickFilled<T extends object>(o: T | undefined): Partial<T> {
  if (!o) return {};
  return Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === "string" && v.trim() && v.trim().toLowerCase() !== "unknown")) as Partial<T>;
}

function norm(s: string) {
  return s.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim();
}

export function errText(e: unknown) {
  return e instanceof Error ? e.message.slice(0, 240) : "Unknown error";
}
