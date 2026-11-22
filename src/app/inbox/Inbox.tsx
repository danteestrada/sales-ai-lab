"use client";

import { useEffect, useState } from "react";
import type { Submission, Verdict } from "@/lib/contact";
import { getOwnerKey, setOwnerKey, timeAgo } from "../tools/prospector/ui";

const TABS: { key: "worth" | "other" | "spam" | "dismissed"; label: string }[] = [
  { key: "worth", label: "Recruiters & hiring managers" },
  { key: "other", label: "Other" },
  { key: "spam", label: "Spam" },
  { key: "dismissed", label: "Dismissed" },
];

const verdictLabel: Record<Verdict, string> = { recruiter: "Recruiter", hiring_manager: "Hiring manager", other: "Other", spam: "Spam" };

function bucket(s: Submission) {
  if (s.status === "dismissed") return "dismissed";
  if (s.screen.verdict === "spam") return "spam";
  if (s.screen.verdict === "other") return "other";
  return "worth";
}

export default function Inbox() {
  const [items, setItems] = useState<Submission[] | null>(null);
  const [needKey, setNeedKey] = useState(false);
  const [key, setKey] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("worth");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/contact/inbox", { headers: { "x-owner-key": getOwnerKey() } });
    if (res.status === 401) {
      setNeedKey(true);
      setItems(null);
      return;
    }
    const json = await res.json();
    if (!res.ok) {
      setErr(json.error ?? "Couldn't load.");
      return;
    }
    setNeedKey(false);
    setItems(json.submissions);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/contact/inbox", { headers: { "x-owner-key": getOwnerKey() } })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) return setNeedKey(true);
        const json = await res.json();
        if (!res.ok) return setErr(json.error ?? "Couldn't load.");
        setItems(json.submissions);
      })
      .catch(() => !cancelled && setErr("Couldn't load."));
    return () => {
      cancelled = true;
    };
  }, []);

  async function setStatus(id: string, status: Submission["status"]) {
    await fetch("/api/contact/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-owner-key": getOwnerKey() },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  if (err) return <p className="mt-8 text-sm text-warn">{err}</p>;
  if (needKey) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); setOwnerKey(key); load(); }} className="mt-8 flex max-w-md gap-2">
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Owner key" className="flex-1 rounded-md border border-line bg-card px-3 py-2 text-sm outline-none focus:border-white/40" autoFocus />
        <button className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper">Sign in</button>
      </form>
    );
  }
  if (!items) return <p className="mt-8 text-sm text-muted">Loading…</p>;

  const shown = items.filter((s) => bucket(s) === tab).sort((a, b) => b.screen.score - a.screen.score || (a.at < b.at ? 1 : -1));

  return (
    <div className="mt-8">
      <nav className="flex flex-wrap gap-1 border-b border-line text-sm">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`-mb-px border-b-2 px-4 py-2 ${tab === t.key ? "border-ink font-medium" : "border-transparent text-muted hover:text-ink"}`}>
            {t.label} <span className="text-muted">({items.filter((s) => bucket(s) === t.key).length})</span>
          </button>
        ))}
      </nav>
      {shown.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nothing here yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {shown.map((s) => (
            <li key={s.id} className={`rounded-xl border bg-card p-5 ${s.status === "saved" ? "border-good/40" : "border-line"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {s.name} <span className="font-normal text-muted">· {s.title}, {s.company}</span>
                  </p>
                  <p className="mt-1 text-sm">{s.screen.summary}</p>
                </div>
                <div className="text-right">
                  <span className="label-caps rounded-full border border-line px-2.5 py-1 text-[10px]">{verdictLabel[s.screen.verdict]} · {s.screen.score}</span>
                  <p className="mt-2 text-xs text-muted">{timeAgo(s.at)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <Chip ok={!s.checks.personalEmail}>{s.checks.personalEmail ? "personal email" : "work email"}</Chip>
                {s.checks.domainMatchesCompany !== null && <Chip ok={s.checks.domainMatchesCompany}>{s.checks.domainMatchesCompany ? "email matches company" : "email doesn't match company"}</Chip>}
                {s.screen.flags.map((f) => (
                  <Chip key={f} ok={false}>{f}</Chip>
                ))}
              </div>
              {s.hiringFor && <p className="mt-3 text-sm"><span className="text-muted">Hiring for:</span> {s.hiringFor}</p>}
              <p className="mt-3 whitespace-pre-wrap rounded-md bg-paper p-3 text-sm leading-relaxed">{s.message}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <a href={`mailto:${s.email}`} className="rounded-md bg-ink px-3 py-1.5 font-medium text-paper">Reply by email</a>
                {s.linkedin && <a href={s.linkedin} target="_blank" rel="noreferrer" className="rounded-md border border-line px-3 py-1.5 hover:border-white/40">LinkedIn</a>}
                <span className="text-xs text-muted">{s.email}</span>
                <span className="flex-1" />
                {s.status !== "saved" && <button onClick={() => setStatus(s.id, "saved")} className="text-muted hover:text-ink">Save</button>}
                {s.status !== "dismissed" ? (
                  <button onClick={() => setStatus(s.id, "dismissed")} className="text-muted hover:text-ink">Dismiss</button>
                ) : (
                  <button onClick={() => setStatus(s.id, "new")} className="text-muted hover:text-ink">Restore</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={`rounded px-1.5 py-0.5 ${ok ? "bg-good-soft text-good" : "bg-warn-soft text-warn"}`}>{children}</span>;
}
