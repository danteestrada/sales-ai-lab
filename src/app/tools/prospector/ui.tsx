"use client";

import type { Confidence } from "@/lib/prospector/types";

// Small shared pieces for the Prospector screens.

const OWNER_KEY_STORAGE = "salesLab.ownerKey";

export function getOwnerKey(): string {
  try {
    return localStorage.getItem(OWNER_KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function setOwnerKey(v: string) {
  try {
    if (v) localStorage.setItem(OWNER_KEY_STORAGE, v);
    else localStorage.removeItem(OWNER_KEY_STORAGE);
  } catch {
    // storage blocked; sign-in lasts for this page view only
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/prospector/${path}`, {
    method: init?.method ?? (init?.body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", "x-owner-key": getOwnerKey() },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON (e.g. a platform timeout page)
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error ?? (res.status === 504 ? "That took too long and timed out. Try again." : `Request failed (${res.status}).`);
    throw new Error(msg);
  }
  return data as T;
}

export function ScoreBadge({ score, size = "md" }: { score?: number; size?: "md" | "lg" }) {
  if (score === undefined) return <span className="font-mono text-xs text-muted">—</span>;
  const tone = score >= 70 ? "bg-good-soft text-good" : score >= 45 ? "bg-accent-soft text-accent" : "bg-paper text-muted border border-line";
  return (
    <span className={`inline-flex items-center justify-center rounded-lg font-semibold tabular-nums ${tone} ${size === "lg" ? "h-14 w-14 text-xl" : "h-10 w-10 text-sm"}`}>
      {score}
    </span>
  );
}

export function ConfidenceChip({ c }: { c: Confidence }) {
  const map = {
    high: "bg-good-soft text-good",
    medium: "bg-accent-soft text-accent",
    low: "bg-warn-soft text-warn",
  } as const;
  return <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${map[c]}`}>{c} confidence</span>;
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "secondary",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "accent" | "ghost";
  type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-ink text-paper hover:opacity-90",
    accent: "bg-accent text-white hover:opacity-90",
    secondary: "border border-line bg-card hover:border-ink",
    ghost: "text-muted hover:text-ink",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 ${styles}`}>
      {children}
    </button>
  );
}

export function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} hr ago`;
  return `${Math.round(s / 86400)} days ago`;
}

export function prettyDate(d: string): string {
  if (!d) return "date unknown";
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(d);
  if (!m) return d;
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m[2]) - 1];
  return m[3] ? `${month} ${Number(m[3])}, ${m[1]}` : `${month} ${m[1]}`;
}

export function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
