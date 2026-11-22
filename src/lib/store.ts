import { Redis } from "@upstash/redis";
import { DEFAULT_SETTINGS } from "./prospector/defaults";
import type { Submission } from "./contact";
import type { Account, RunLog, Settings, WeightChange, Workspace } from "./prospector/types";

// Storage lives in an Upstash Redis database connected through Vercel.
// Two workspaces: "owner" (Dante's real list) and "demo" (what visitors see).

export type WorkspaceId = "owner" | "demo";

export class StorageMissingError extends Error {
  constructor() {
    super("Database not connected");
  }
}

let redis: Redis | null = null;
function db(): Redis {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new StorageMissingError();
  if (!redis) redis = new Redis({ url, token });
  return redis;
}

export function storageReady(): boolean {
  return Boolean((process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL) && (process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN));
}

const k = (ws: WorkspaceId, name: string) => `prospector:${ws}:${name}`;

export async function getSettings(ws: WorkspaceId): Promise<Settings> {
  const s = await db().get<Settings>(k(ws, "settings"));
  return s ?? DEFAULT_SETTINGS;
}

export async function saveSettings(ws: WorkspaceId, s: Settings) {
  await db().set(k(ws, "settings"), { ...s, updatedAt: new Date().toISOString() });
}

export async function getAccounts(ws: WorkspaceId): Promise<Account[]> {
  const all = await db().hgetall<Record<string, Account>>(k(ws, "accounts"));
  return all ? Object.values(all) : [];
}

export async function getAccount(ws: WorkspaceId, id: string): Promise<Account | null> {
  return (await db().hget<Account>(k(ws, "accounts"), id)) ?? null;
}

export async function saveAccount(ws: WorkspaceId, a: Account) {
  await db().hset(k(ws, "accounts"), { [a.id]: a });
}

export async function deleteAccounts(ws: WorkspaceId) {
  await db().del(k(ws, "accounts"), k(ws, "queue"));
}

export async function enqueue(ws: WorkspaceId, ids: string[]) {
  if (ids.length) await db().rpush(k(ws, "queue"), ...ids);
}

export async function dequeue(ws: WorkspaceId): Promise<string | null> {
  return (await db().lpop<string>(k(ws, "queue"))) ?? null;
}

export async function queueLength(ws: WorkspaceId): Promise<number> {
  return db().llen(k(ws, "queue"));
}

export async function getQueue(ws: WorkspaceId): Promise<string[]> {
  return db().lrange<string>(k(ws, "queue"), 0, -1);
}

export async function logWeightChange(ws: WorkspaceId, c: WeightChange) {
  await db().lpush(k(ws, "weights"), c);
  await db().ltrim(k(ws, "weights"), 0, 199);
}

export async function logRun(ws: WorkspaceId, r: RunLog) {
  await db().lpush(k(ws, "runs"), r);
  await db().ltrim(k(ws, "runs"), 0, 99);
}

export async function getWorkspace(ws: WorkspaceId): Promise<Workspace> {
  const [settings, accounts, queue, weightLog, runs] = await Promise.all([
    getSettings(ws),
    getAccounts(ws),
    getQueue(ws),
    db().lrange<WeightChange>(k(ws, "weights"), 0, 49),
    db().lrange<RunLog>(k(ws, "runs"), 0, 29),
  ]);
  return { settings, accounts, queue, weightLog, runs };
}

// Simple per-key daily counter, used for visitor limits that survive restarts.
export async function bumpDaily(key: string): Promise<number> {
  const day = new Date().toISOString().slice(0, 10);
  const full = `limit:${day}:${key}`;
  const n = await db().incr(full);
  if (n === 1) await db().expire(full, 60 * 60 * 26);
  return n;
}

// ---------- contact form submissions ----------

export async function saveSubmission(s: Submission) {
  await db().hset("contact:submissions", { [s.id]: s });
}

export async function getSubmissions(): Promise<Submission[]> {
  const all = await db().hgetall<Record<string, Submission>>("contact:submissions");
  return all ? Object.values(all).sort((a, b) => (a.at < b.at ? 1 : -1)) : [];
}

export async function getSubmission(id: string): Promise<Submission | null> {
  return (await db().hget<Submission>("contact:submissions", id)) ?? null;
}
